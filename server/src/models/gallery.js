const mongoose = require("mongoose");
const validator = require("validator");

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Image is required"],
      validate(value) {
        if (!value.startsWith("/uploads/") && !validator.isURL(value)) {
          throw new Error("Invalid image path: " + value);
        }
      },
    },
    // Cloudinary public_id, used to delete the asset from Cloudinary.
    // Absent for any legacy photo still on local disk.
    imagePublicId: {
      type: String,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

gallerySchema.index({ category: 1 });
gallerySchema.index({ isFeatured: 1 });

module.exports = mongoose.model("Gallery", gallerySchema);
