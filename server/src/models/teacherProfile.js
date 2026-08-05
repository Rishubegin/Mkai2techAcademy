const mongoose = require("mongoose");
const validator = require("validator");

const teacherProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
    qualification: {
      type: String,
      required: [true, "Qualification is required"],
      trim: true,
    },
    experience: {
      type: String,
      trim: true,
    },
    experienceYears: {
      type: Number,
      min: [0, "Experience years cannot be negative"],
      default: 0,
    },
    specialization: {
      type: [String],
      default: [],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [1000, "Bio cannot exceed 1000 characters"],
    },
    photo: {
      type: String,
      validate: {
        validator: (value) => !value || validator.isURL(value),
        message: "Invalid photo URL",
      },
    },
    socialLinks: {
      linkedin: String,
      twitter: String,
      instagram: String,
      website: String,
    },
  },
  { timestamps: true },
);

teacherProfileSchema.index({ specialization: 1 });

module.exports = mongoose.model("TeacherProfile", teacherProfileSchema);
