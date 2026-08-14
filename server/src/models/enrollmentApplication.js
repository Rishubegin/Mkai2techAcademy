const mongoose = require("mongoose");

const enrollmentApplicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student reference is required"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course reference is required"],
    },
    // One application per student per course — resubmitting overwrites.
    name: { type: String, required: [true, "Name is required"], trim: true },
    fatherName: { type: String, trim: true },
    fatherOccupation: { type: String, trim: true },
    motherName: { type: String, trim: true },
    motherOccupation: { type: String, trim: true },
    dob: { type: Date },
    category: {
      type: String,
      enum: ["General", "OBC", "SC", "ST"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    address: { type: String, trim: true },
    pincode: { type: String, trim: true },
    contactNo: { type: String, trim: true },
    alternateNo: { type: String, trim: true },
    branchName: { type: String, trim: true, default: "Sugamau" },
    // Education. The applicant picks a level first; only that level's fields are
    // filled in, and the controller blanks out the other level's fields so an
    // applicant who switches from School to University doesn't leave stale data.
    educationLevel: {
      type: String,
      enum: ["School", "University"],
    },
    // educationLevel: "School"
    schoolName: { type: String, trim: true },
    class: { type: String, trim: true },
    // Free text rather than an enum: the form offers UP/CBSE/ICSE Board plus an
    // "Other" option that lets the applicant type their own board name.
    board: { type: String, trim: true },
    stream: { type: String, trim: true },
    // educationLevel: "University"
    universityName: { type: String, trim: true },
    // Named universityCourse because `course` is already the ObjectId ref above.
    universityCourse: { type: String, trim: true },
    specialization: { type: String, trim: true },
    passingYear: { type: String, trim: true },
    nextYearPlan: { type: String, trim: true },
    appliedCourse: { type: String, trim: true },
    photo: { type: String },
    photoPublicId: { type: String },
    signature: { type: String },
    signaturePublicId: { type: String },
    guardianSignature: { type: String },
    guardianSignaturePublicId: { type: String },
    // The form is saved one section at a time, so a partly filled application is
    // a valid document. Only a "submitted" one has to be complete, which the
    // controller enforces at submit time — the schema can't require it here
    // without rejecting every draft save.
    status: {
      type: String,
      enum: ["draft", "submitted"],
      default: "draft",
    },
    declarationAccepted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

enrollmentApplicationSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentApplicationSchema.index({ course: 1 });

module.exports = mongoose.model("EnrollmentApplication", enrollmentApplicationSchema);
