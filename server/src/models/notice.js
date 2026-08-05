const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    targetRole: {
      type: String,
      enum: ["all", "student", "teacher", "admin"],
      default: "all",
    },
    expiryDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

noticeSchema.index({ targetRole: 1 });
noticeSchema.index({ isActive: 1 });
noticeSchema.index({ expiryDate: 1 });

module.exports = mongoose.model("Notice", noticeSchema);
