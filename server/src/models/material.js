const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course reference is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    module: {
      type: String,
      trim: true,
    },
    // Cloudinary public_id (kept as "storedFileName" to avoid churning every
    // route/select() that already references this field name).
    storedFileName: {
      type: String,
      required: true,
    },
    // Cloudinary secure_url. Never exposed directly to clients — the download
    // route fetches from here server-side and streams the bytes through the
    // existing enrollment-gated endpoint, so materials stay access-controlled
    // even though Cloudinary itself doesn't enforce that.
    fileUrl: {
      type: String,
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

materialSchema.index({ course: 1 });

module.exports = mongoose.model("Material", materialSchema);
