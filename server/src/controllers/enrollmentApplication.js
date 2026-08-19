const PDFDocument = require("pdfkit");
const EnrollmentApplication = require("../models/enrollmentApplication");
const Course = require("../models/course");
const Enrollment = require("../models/enrollment");
const User = require("../models/user");
const { uploadBuffer, deleteAsset } = require("../utils/cloudinaryUpload");
const { getPaginationParams, buildPagination, escapeRegex } = require("../utils/pagination");

// The form is filled in section by section on the frontend; these are the fields
// each section owns. A section save only ever sends its own fields, so saving
// "Personal Information" can't wipe out an already-saved "Education".
const SECTION_FIELDS = {
  personal: [
    "name",
    "fatherName",
    "fatherOccupation",
    "motherName",
    "motherOccupation",
    "dob",
    "category",
    "gender",
  ],
  contact: ["address", "pincode", "contactNo", "alternateNo", "branchName"],
  education: [
    "educationLevel",
    "schoolName",
    "class",
    "board",
    "stream",
    "universityName",
    "universityCourse",
    "specialization",
    "passingYear",
    "nextYearPlan",
  ],
};

const SCHOOL_FIELDS = ["schoolName", "class", "board", "stream"];
const UNIVERSITY_FIELDS = ["universityName", "universityCourse", "specialization", "passingYear"];

const ALLOWED_FIELDS = [
  ...SECTION_FIELDS.personal,
  ...SECTION_FIELDS.contact,
  ...SECTION_FIELDS.education,
  "appliedCourse",
  "declarationAccepted",
];

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

// Legacy applications predate the draft/submitted split and have no status, but
// they only ever existed as completed submissions.
const isSubmitted = (application) => Boolean(application) && application.status !== "draft";

const ENUM_FIELDS = ["category", "gender", "educationLevel"];

// A blank dropdown means "not answered yet", but Mongoose validates "" against
// the enum and rejects it. Those fields are pulled out of the $set and unset
// instead, so a half-filled section still saves.
const splitEnumBlanks = (formData) => {
  const unset = {};
  for (const field of ENUM_FIELDS) {
    if (formData[field] === "") {
      delete formData[field];
      unset[field] = "";
    }
  }
  return unset;
};

const pickAllowedFields = (body) => {
  const formData = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) formData[key] = body[key];
  }
  return formData;
};

// Blank the fields belonging to the level that wasn't chosen, so a School
// applicant never carries university answers (and vice versa) into the PDF.
const clearUnusedEducationFields = (formData) => {
  if (!formData.educationLevel) return formData;

  const unused = formData.educationLevel === "School" ? UNIVERSITY_FIELDS : SCHOOL_FIELDS;
  for (const field of unused) {
    formData[field] = "";
  }
  return formData;
};

// A finished form needs the education section answered for whichever level the
// applicant picked. Stream and specialization stay optional.
const assertEducationComplete = (application) => {
  const required =
    application.educationLevel === "School"
      ? { schoolName: "school name", class: "class", board: "board" }
      : { universityName: "university name", universityCourse: "course", passingYear: "year/passout" };

  if (!application.educationLevel) {
    throw new Error("Please choose whether you are studying in a school or a university");
  }
  for (const [field, label] of Object.entries(required)) {
    if (!application[field]) {
      throw new Error(`Please fill in your ${label} in the Education section`);
    }
  }
};

// Uploads whichever document files came in with this request and returns the
// url/publicId pairs for them. Files are optional here because the Documents
// section can be saved on its own, one file at a time.
const uploadDocuments = async (files = {}) => {
  const photoFile = files.photo?.[0];
  const signatureFile = files.signature?.[0];
  const guardianSignatureFile = files.guardianSignature?.[0];

  const [photoUpload, signatureUpload, guardianUpload] = await Promise.all([
    photoFile
      ? uploadBuffer(photoFile.buffer, { folder: "mkai2tech/enrollment/photos" })
      : Promise.resolve(null),
    signatureFile
      ? uploadBuffer(signatureFile.buffer, { folder: "mkai2tech/enrollment/signatures" })
      : Promise.resolve(null),
    guardianSignatureFile
      ? uploadBuffer(guardianSignatureFile.buffer, {
          folder: "mkai2tech/enrollment/guardian-signatures",
        })
      : Promise.resolve(null),
  ]);

  return {
    ...(photoUpload && { photo: photoUpload.secure_url, photoPublicId: photoUpload.public_id }),
    ...(signatureUpload && {
      signature: signatureUpload.secure_url,
      signaturePublicId: signatureUpload.public_id,
    }),
    ...(guardianUpload && {
      guardianSignature: guardianUpload.secure_url,
      guardianSignaturePublicId: guardianUpload.public_id,
    }),
  };
};

const createApplication = async (req, res) => {
    try {
      const { courseId, declarationAccepted } = req.body;

      if (!courseId) {
        throw new Error("courseId is required");
      }
      if (declarationAccepted !== "true" && declarationAccepted !== true) {
        throw new Error("You must accept the declaration to submit this form");
      }

      const course = await Course.findById(courseId).select("title");
      if (!course) {
        throw new Error("Course not found");
      }

      const studentId = req.user._id.toString();
      const alreadyEnrolled = Boolean(
        await Enrollment.exists({ student: studentId, course: courseId }),
      );

      // Documents may have been uploaded earlier through a Documents-section
      // save, so the applicant doesn't have to re-pick the files to submit.
      const saved = await EnrollmentApplication.findOne({ student: studentId, course: courseId });

      if (!req.files?.photo?.[0] && !saved?.photo) {
        throw new Error("Candidate photo is required");
      }
      if (!req.files?.signature?.[0] && !saved?.signature) {
        throw new Error("Candidate signature is required");
      }

      const formData = clearUnusedEducationFields(pickAllowedFields(req.body));
      formData.declarationAccepted = true;
      formData.status = "submitted";
      formData.appliedCourse = formData.appliedCourse || saved?.appliedCourse || course.title;

      // Validate against the merged result: a field the applicant saved in an
      // earlier section counts even when this request doesn't resend it.
      // Validated before the blanks are split off, so clearing the level in this
      // request is rejected rather than silently falling back to the saved one.
      assertEducationComplete({ ...saved?.toObject(), ...formData });
      const unset = splitEnumBlanks(formData);

      const uploads = await uploadDocuments(req.files);

      const application = await EnrollmentApplication.findOneAndUpdate(
        { student: studentId, course: courseId },
        {
          $set: {
            ...formData,
            ...uploads,
            student: studentId,
            course: courseId,
          },
          ...(Object.keys(unset).length && { $unset: unset }),
        },
        {
          returnDocument: "after",
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );

      if (!alreadyEnrolled) {
        await Enrollment.create({
          student: studentId,
          course: courseId,
          enrolledAt: new Date(),
        });
      }

      res.status(201).json({
        success: true,
        message: "Enrollment application submitted successfully",
        application,
      });
    } catch (err) {
      const message = err.code === 11000 ? "You have already applied for this course" : err.message;
      res.status(400).json({
        success: false,
        message: "Error submitting enrollment application",
        Error: message,
      });
    }
  };

// Saves one section of the form without submitting it, so an applicant can fill
// the form across several sittings. Unlike createApplication this never enrolls
// the student, never touches the declaration, and requires nothing but courseId.
const saveDraft = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      throw new Error("courseId is required");
    }

    const course = await Course.findById(courseId).select("title");
    if (!course) {
      throw new Error("Course not found");
    }

    const studentId = req.user._id.toString();
    const saved = await EnrollmentApplication.findOne({ student: studentId, course: courseId });

    const formData = clearUnusedEducationFields(pickAllowedFields(req.body));
    // Only the final submit may accept the declaration on the applicant's behalf.
    delete formData.declarationAccepted;
    formData.appliedCourse = formData.appliedCourse || saved?.appliedCourse || course.title;
    // Editing an already-submitted form keeps it submitted; it must not silently
    // drop back to draft and disappear from the admin's list of real applications.
    formData.status = isSubmitted(saved) ? "submitted" : "draft";

    const unset = splitEnumBlanks(formData);
    const uploads = await uploadDocuments(req.files);

    const application = await EnrollmentApplication.findOneAndUpdate(
      { student: studentId, course: courseId },
      {
        $set: {
          ...formData,
          ...uploads,
          student: studentId,
          course: courseId,
        },
        ...(Object.keys(unset).length && { $unset: unset }),
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    res.status(200).json({
      success: true,
      message: "Section saved successfully",
      application,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error saving section",
      Error: err.message,
    });
  }
};

// Loads the logged-in student's saved form for one course so the frontend can
// reopen a part-filled draft instead of starting from an empty form.
const getMyApplicationForCourse = async (req, res) => {
  try {
    const application = await EnrollmentApplication.findOne({
      student: req.user._id,
      course: req.params.courseId,
    }).populate("course", "title");

    res.status(200).json({
      success: true,
      message: application ? "Application fetched successfully" : "No saved application yet",
      application: application || null,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching application",
      Error: err.message,
    });
  }
};

const listMyApplications = async (req, res) => {
  try {
    const applications = await EnrollmentApplication.find({ student: req.user._id })
      .populate("course", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Applications fetched successfully",
      applications,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching applications",
      Error: err.message,
    });
  }
};

const listApplications = async (req, res) => {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);

      const filter = {};
      if (req.query.course) filter.course = req.query.course;
      if (req.query.status) filter.status = req.query.status;

      if (req.query.search?.trim()) {
        const pattern = { $regex: escapeRegex(req.query.search.trim()), $options: "i" };

        // The card shows the account's name and email, which live on the User
        // document. A populated field can't be matched in the same query, so
        // the matching students are resolved to ids first.
        const studentIds = await User.find({
          $or: [{ name: pattern }, { email: pattern }],
        }).distinct("_id");

        filter.$or = [
          { name: pattern },
          { contactNo: pattern },
          { appliedCourse: pattern },
          { student: { $in: studentIds } },
        ];
      }

      const [applications, total] = await Promise.all([
        EnrollmentApplication.find(filter)
          .populate("student", "name email phone")
          .populate("course", "title")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        EnrollmentApplication.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        message: "Applications fetched successfully",
        applications,
        pagination: buildPagination({ page, limit, total }),
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error fetching applications",
        Error: err.message,
      });
    }
  };

const updateApplication = async (req, res) => {
    try {
      const isUpdateAllowed = Object.keys(req.body).every((key) => ALLOWED_FIELDS.includes(key));
      if (!isUpdateAllowed) {
        throw new Error("Invalid update field");
      }

      const formData = clearUnusedEducationFields({ ...req.body });
      const unset = splitEnumBlanks(formData);

      const application = await EnrollmentApplication.findByIdAndUpdate(
        req.params.id,
        {
          ...(Object.keys(formData).length && { $set: formData }),
          ...(Object.keys(unset).length && { $unset: unset }),
        },
        {
          returnDocument: "after",
          runValidators: true,
        },
      );

      if (!application) {
        throw new Error("Application not found");
      }

      res.status(200).json({
        success: true,
        message: "Application updated successfully",
        application,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error updating application",
        Error: err.message,
      });
    }
  };

const deleteApplication = async (req, res) => {
    try {
      const application = await EnrollmentApplication.findByIdAndDelete(req.params.id);

      if (!application) {
        throw new Error("Application not found");
      }

      await Promise.all([
        deleteAsset(application.photoPublicId, "image"),
        deleteAsset(application.signaturePublicId, "image"),
        deleteAsset(application.guardianSignaturePublicId, "image"),
      ]);

      res.status(200).json({
        success: true,
        message: "Application deleted successfully",
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error deleting application",
        Error: err.message,
      });
    }
  };

const downloadApplication = async (req, res) => {
    try {
      const application = await EnrollmentApplication.findById(req.params.id)
        .populate("student", "name email")
        .populate("course", "title");

      if (!application) {
        throw new Error("Application not found");
      }

      const isOwner = application.student._id.toString() === req.user._id.toString();
      if (!isOwner && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to download this application",
        });
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=enrolment-form-${application._id}.pdf`,
      );

      const doc = new PDFDocument({ size: "A4", margin: 40 });
      doc.pipe(res);

      const navy = "#001F3F";
      const gold = "#D4A017";
      const pageWidth = doc.page.width - 80;

      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke(navy);

      doc
        .fillColor(navy)
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("M-Kai² Tech Academy", 40, 50, { align: "center" });
      doc
        .fontSize(14)
        .font("Helvetica")
        .fillColor(gold)
        .text("Enrolment Form", 40, 78, { align: "center", underline: true });

      doc
        .fillColor("black")
        .fontSize(10)
        .font("Helvetica")
        .text(`Form No: ${application.student._id}`, 40, 105);

      let y = 130;
      // Kept clear of the photo block pinned to the right of the first section.
      const fieldWidth = pageWidth - 150;

      const line = (label, value) => {
        doc.font("Helvetica-Bold").fontSize(10).text(label, 40, y, {
          continued: true,
          width: fieldWidth,
        });
        doc.font("Helvetica").text(` ${value || "-"}`);
        // Read the cursor back rather than adding a fixed step, so a value that
        // wraps onto a second line doesn't overprint the field below it.
        y = doc.y + 4;
      };

      const section = (title) => {
        y += 8;
        doc.font("Helvetica-Bold").fontSize(11).fillColor(navy).text(title, 40, y);
        y = doc.y + 6;
        doc.fillColor("black");
      };

      section("Personal Information");
      line("Name:", application.name);
      line("Father's Name:", application.fatherName);
      line("Father's Occupation:", application.fatherOccupation);
      line("Mother's Name:", application.motherName);
      line("Mother's Occupation:", application.motherOccupation);
      line("Date of Birth:", formatDate(application.dob));
      line("Category:", application.category);
      line("Gender:", application.gender);

      section("Contact Information");
      line("Address:", application.address);
      line("Pin Code:", application.pincode);
      line("Contact No:", application.contactNo);
      line("Alternate No:", application.alternateNo);
      line("Branch Name:", application.branchName);

      section("Education");
      if (application.educationLevel === "University") {
        line("Studying at:", "University / College");
        line("University Name:", application.universityName);
        line("Course:", application.universityCourse);
        line("Specialization:", application.specialization);
        line("Year / Passout:", application.passingYear);
      } else {
        line("Studying at:", "School");
        line("School Name:", application.schoolName);
        line("Class:", application.class);
        line("Board:", application.board);
        line("Stream:", application.stream);
      }
      line("Next Year Plan:", application.nextYearPlan);
      line("Applied Course:", application.appliedCourse || application.course?.title);

      y += 10;
      if (application.photo) {
        try {
          const photoRes = await fetch(application.photo);
          const photoBuffer = Buffer.from(await photoRes.arrayBuffer());
          doc.image(photoBuffer, doc.page.width - 170, 130, { width: 100, height: 120, fit: [100, 120] });
        } catch {
          // If the photo can't be fetched, skip it rather than failing the whole PDF.
        }
      }

      y += 20;
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Declaration by Applicant", 40, y, { underline: true });
      y += 16;
      doc
        .font("Helvetica")
        .fontSize(9)
        .text(
          "I hereby declare that I have read and understood the terms and conditions of eligibility for this course. In the event any information is found incorrect or misleading, my candidature shall be liable to cancellation by the Organization, and I accept the rules of the Organization.",
          40,
          y,
          { width: pageWidth },
        );
      y = doc.y + 30;

      const sigWidth = 130;
      const drawSignature = async (label, url, x) => {
        doc.font("Helvetica").fontSize(9).text(label, x, y + 55, { width: sigWidth, align: "center" });
        if (url) {
          try {
            const sigRes = await fetch(url);
            const sigBuffer = Buffer.from(await sigRes.arrayBuffer());
            doc.image(sigBuffer, x, y, { width: sigWidth, height: 50, fit: [sigWidth, 50] });
          } catch {
            // Skip missing/unfetchable signature images.
          }
        }
      };

      await drawSignature("Sign. of Applicant", application.signature, 40);
      await drawSignature("Sign. Parent's/Guardian's", application.guardianSignature, 200);
      doc
        .font("Helvetica")
        .fontSize(9)
        .text(`Date: ${formatDate(application.createdAt)}`, 400, y + 55);

      doc.end();
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error generating enrolment form PDF",
        Error: err.message,
      });
    }
  };

module.exports = {
  createApplication,
  saveDraft,
  getMyApplicationForCourse,
  listMyApplications,
  listApplications,
  updateApplication,
  deleteApplication,
  downloadApplication,
};

