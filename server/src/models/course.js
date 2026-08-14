const mongoose = require("mongoose");
const validator = require("validator");

const syllabusModuleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    topics: { type: [String], default: [] },
  },
  { _id: false },
);

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    mode: {
      type: String,
      enum: ["Offline", "Online", "Hybrid"],
      default: "Offline",
    },
    fees: {
      type: Number,
      required: [true, "Fees is required"],
      min: [0, "Fees cannot be negative"],
    },
    image: {
      type: String,
      validate: {
        validator: (value) => !value || validator.isURL(value),
        message: "Invalid image URL",
      },
    },
    // Set when the image was uploaded through us, so the old Cloudinary asset
    // can be destroyed on replace. Absent for images stored as a plain
    // external URL before uploads existed (e.g. the seeded Unsplash links).
    imagePublicId: String,
    isFeatured: {
      type: Boolean,
      default: false,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherProfile",
    },
    syllabus: {
      type: [syllabusModuleSchema],
      default: [],
    },
    // Short marketing bullets shown next to the enroll button
    // (e.g. "30+ hours of video content").
    highlights: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

courseSchema.index({ category: 1 });
courseSchema.index({ mode: 1 });
courseSchema.index({ isFeatured: 1 });
courseSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Course", courseSchema);
