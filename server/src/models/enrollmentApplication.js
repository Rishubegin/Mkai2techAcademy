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
    class: { type: String, trim: true },
    board: { type: String, trim: true },
    stream: { type: String, trim: true },
    contactNo: { type: String, trim: true },
    alternateNo: { type: String, trim: true },
    branchName: { type: String, trim: true, default: "Sugamau" },
    nextYearPlan: { type: String, trim: true },
    appliedCourse: { type: String, trim: true },
    photo: { type: String },
    photoPublicId: { type: String },
    signature: { type: String },
    signaturePublicId: { type: String },
    guardianSignature: { type: String },
    guardianSignaturePublicId: { type: String },
    declarationAccepted: {
      type: Boolean,
      required: [true, "Declaration must be accepted"],
    },
  },
  { timestamps: true },
);

enrollmentApplicationSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentApplicationSchema.index({ course: 1 });

module.exports = mongoose.model("EnrollmentApplication", enrollmentApplicationSchema);
