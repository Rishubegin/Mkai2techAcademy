const mongoose = require("mongoose");

// Enrollment used to live inside batch.students[]. It's a standalone
// collection rather than an array on Course because course documents are
// served publicly (/courses/featured, /courses/:id) — embedding student
// references there would leak them to anonymous visitors.
const enrollmentSchema = new mongoose.Schema(
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
    enrolledAt: { type: Date, default: Date.now },
    // Offline payment tracking — fees are collected in person, not
    // processed online. This just records what the admin was told.
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },
    amountPaid: { type: Number, default: 0, min: 0 },
    discountApplied: { type: Number, default: 0, min: 0 },
    discountCode: String,
    paymentNotes: String,
    // Progress/completion — admin/instructor updates this based on offline
    // attendance and coursework, since there's no online lesson-tracking UI.
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    completedAt: Date,
  },
  { timestamps: true },
);

// One enrollment per student per course (was {student, batch}).
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ course: 1 });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
