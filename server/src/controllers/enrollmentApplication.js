const PDFDocument = require("pdfkit");
const EnrollmentApplication = require("../models/enrollmentApplication");
const Batch = require("../models/batch");
const { uploadBuffer, deleteAsset } = require("../utils/cloudinaryUpload");

const ALLOWED_FIELDS = [
  "name",
  "fatherName",
  "fatherOccupation",
  "motherName",
  "motherOccupation",
  "dob",
  "category",
  "gender",
  "address",
  "pincode",
  "class",
  "board",
  "stream",
  "contactNo",
  "alternateNo",
  "branchName",
  "nextYearPlan",
  "appliedCourse",
  "declarationAccepted",
];

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

const createApplication = async (req, res) => {
    try {
      const { batchId, declarationAccepted } = req.body;

      if (!batchId) {
        throw new Error("batchId is required");
      }
      if (declarationAccepted !== "true" && declarationAccepted !== true) {
        throw new Error("You must accept the declaration to submit this form");
      }

      const batch = await Batch.findById(batchId).populate("course", "title");
      if (!batch) {
        throw new Error("Batch not found");
      }
      if (batch.status === "Completed") {
        throw new Error("This batch has already been completed");
      }

      const studentId = req.user._id.toString();
      const alreadyEnrolled = batch.students.some((s) => s.student.toString() === studentId);

      if (!alreadyEnrolled && batch.students.length >= batch.capacity) {
        throw new Error("This batch is at full capacity");
      }

      const photoFile = req.files?.photo?.[0];
      const signatureFile = req.files?.signature?.[0];
      const guardianSignatureFile = req.files?.guardianSignature?.[0];

      if (!photoFile) {
        throw new Error("Candidate photo is required");
      }
      if (!signatureFile) {
        throw new Error("Candidate signature is required");
      }

      const [photoUpload, signatureUpload, guardianUpload] = await Promise.all([
        uploadBuffer(photoFile.buffer, { folder: "mkai2tech/enrollment/photos" }),
        uploadBuffer(signatureFile.buffer, { folder: "mkai2tech/enrollment/signatures" }),
        guardianSignatureFile
          ? uploadBuffer(guardianSignatureFile.buffer, {
              folder: "mkai2tech/enrollment/guardian-signatures",
            })
          : Promise.resolve(null),
      ]);

      const formData = {};
      for (const key of ALLOWED_FIELDS) {
        if (req.body[key] !== undefined) formData[key] = req.body[key];
      }
      formData.declarationAccepted = true;
      formData.appliedCourse = formData.appliedCourse || batch.course?.title;

      const application = await EnrollmentApplication.findOneAndUpdate(
        { student: studentId, batch: batchId },
        {
          ...formData,
          student: studentId,
          course: batch.course?._id,
          batch: batchId,
          photo: photoUpload.secure_url,
          photoPublicId: photoUpload.public_id,
          signature: signatureUpload.secure_url,
          signaturePublicId: signatureUpload.public_id,
          ...(guardianUpload && {
            guardianSignature: guardianUpload.secure_url,
            guardianSignaturePublicId: guardianUpload.public_id,
          }),
        },
        {
          returnDocument: "after",
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );

      if (!alreadyEnrolled) {
        batch.students.push({ student: studentId, enrolledAt: new Date() });
        await batch.save();
      }

      res.status(201).json({
        success: true,
        message: "Enrollment application submitted successfully",
        application,
      });
    } catch (err) {
      const message = err.code === 11000 ? "You have already applied for this batch" : err.message;
      res.status(400).json({
        success: false,
        message: "Error submitting enrollment application",
        Error: message,
      });
    }
  };

const listMyApplications = async (req, res) => {
  try {
    const applications = await EnrollmentApplication.find({ student: req.user._id })
      .populate("course", "title")
      .populate("batch", "batchName")
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
      const filter = {};
      if (req.query.course) filter.course = req.query.course;

      const applications = await EnrollmentApplication.find(filter)
        .populate("student", "name email phone")
        .populate("course", "title")
        .populate("batch", "batchName")
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

const getApplicationById = async (req, res) => {
  try {
    const application = await EnrollmentApplication.findById(req.params.id)
      .populate("student", "name email phone")
      .populate("course", "title")
      .populate("batch", "batchName");

    if (!application) {
      throw new Error("Application not found");
    }

    const isOwner = application.student._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this application",
      });
    }

    res.status(200).json({
      success: true,
      message: "Application fetched successfully",
      application,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Error fetching application",
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

      const application = await EnrollmentApplication.findByIdAndUpdate(req.params.id, req.body, {
        returnDocument: "after",
        runValidators: true,
      });

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
        .populate("course", "title")
        .populate("batch", "batchName");

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
      const line = (label, value) => {
        doc.font("Helvetica-Bold").fontSize(10).text(label, 40, y, { continued: true });
        doc.font("Helvetica").text(` ${value || ""}`);
        y += 20;
      };

      line("Name:", application.name);
      line("Father's Name:", application.fatherName);
      line("Father's Occupation:", application.fatherOccupation);
      line("Mother's Name:", application.motherName);
      line("Mother's Occupation:", application.motherOccupation);
      line("Date of Birth:", formatDate(application.dob));
      line("Category:", application.category);
      line("Gender:", application.gender);
      line("Address:", application.address);
      line("Pin Code:", application.pincode);
      line("Class:", application.class);
      line("Board:", application.board);
      line("Stream:", application.stream);
      line("Contact No:", application.contactNo);
      line("Alternate No:", application.alternateNo);
      line("Branch Name:", application.branchName);
      line("Next Year Plan:", application.nextYearPlan);
      line("Applied Course:", application.appliedCourse || application.course?.title);
      line("Batch:", application.batch?.batchName);

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
  listMyApplications,
  listApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  downloadApplication,
};
