const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    batchName: {
      type: String,
      required: [true, "Batch name is required"],
      trim: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course reference is required"],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherProfile",
    },
    students: {
      type: [
        {
          student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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
          // Progress/completion — admin/instructor updates this based on
          // offline attendance and coursework, since there's no online
          // lesson-tracking UI.
          progressPercent: { type: Number, default: 0, min: 0, max: 100 },
          completedAt: Date,
        },
      ],
      default: [],
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },
    status: {
      type: String,
      enum: ["Upcoming", "Running", "Completed"],
      default: "Upcoming",
    },
    startDate: Date,
    endDate: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

batchSchema.index({ course: 1 });
batchSchema.index({ teacher: 1 });
batchSchema.index({ "students.student": 1 });
batchSchema.index({ status: 1 });
batchSchema.index({ startDate: 1 });

module.exports = mongoose.model("Batch", batchSchema);
