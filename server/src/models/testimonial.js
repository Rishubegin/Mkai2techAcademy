const mongoose = require("mongoose");
const validator = require("validator");

const testimonialSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student reference is required"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    position: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    photo: {
      type: String,
      validate: {
        validator: (value) => !value || validator.isURL(value) || value.startsWith("/uploads/"),
        message: "Invalid photo URL",
      },
    },
    testimonial: {
      type: String,
      required: [true, "Testimonial text is required"],
      trim: true,
      maxlength: [1500, "Testimonial cannot exceed 1500 characters"],
    },
    shortQuote: {
      type: String,
      trim: true,
      maxlength: [200, "Short quote cannot exceed 200 characters"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    result: {
      type: String,
      trim: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

testimonialSchema.index({ isApproved: 1 });
testimonialSchema.index({ isFeatured: 1 });

module.exports = mongoose.model("Testimonial", testimonialSchema);
