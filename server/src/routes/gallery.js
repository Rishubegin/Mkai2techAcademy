const express = require("express");

const galleryRouter = express.Router();
const Gallery = require("../models/gallery");
const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const { galleryUpload } = require("../middlewares/galleryUpload");
const { uploadBuffer, deleteAsset } = require("../utils/cloudinaryUpload");

// List gallery photos (public), optional ?category= filter
galleryRouter.get("/gallery", async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;

    const photos = await Gallery.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Gallery photos fetched successfully",
      photos,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching gallery photos",
      Error: err.message,
    });
  }
});

// Featured photos (public) — for homepage
galleryRouter.get("/gallery/featured", async (req, res) => {
  try {
    const photos = await Gallery.find({ isFeatured: true }).sort({ createdAt: -1 }).limit(8);

    res.status(200).json({
      success: true,
      message: "Featured gallery photos fetched successfully",
      photos,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching featured gallery photos",
      Error: err.message,
    });
  }
});

// Distinct categories (public) — for filter UI
galleryRouter.get("/gallery/categories", async (req, res) => {
  try {
    const categories = await Gallery.distinct("category");

    res.status(200).json({
      success: true,
      message: "Gallery categories fetched successfully",
      categories,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching gallery categories",
      Error: err.message,
    });
  }
});

// Upload a photo (admin only)
galleryRouter.post(
  "/gallery",
  userAuth,
  authorize("admin"),
  galleryUpload.single("image"),
  async (req, res) => {
    let uploaded;
    try {
      if (!req.file) {
        throw new Error("Image file is required");
      }

      const { title, description, category, course, isFeatured } = req.body;

      uploaded = await uploadBuffer(req.file.buffer, {
        folder: "mkai2tech/gallery",
        resourceType: "image",
      });

      const photo = await Gallery.create({
        title,
        description,
        category,
        course: course || undefined,
        isFeatured: isFeatured === "true" || isFeatured === true,
        image: uploaded.secure_url,
        imagePublicId: uploaded.public_id,
        uploadedBy: req.user._id,
      });

      res.status(201).json({
        success: true,
        message: "Photo uploaded successfully",
        photo,
      });
    } catch (err) {
      // Roll back the uploaded asset if the DB write failed, so a bad
      // request doesn't leave an orphaned file with no DB record.
      if (uploaded) {
        deleteAsset(uploaded.public_id, "image").catch(() => {});
      }
      res.status(400).json({
        success: false,
        message: "Error uploading photo",
        Error: err.message,
      });
    }
  },
);

// Toggle featured (admin only)
galleryRouter.patch(
  "/gallery/:id/feature",
  userAuth,
  authorize("admin"),
  async (req, res) => {
    try {
      const photo = await Gallery.findById(req.params.id);

      if (!photo) {
        throw new Error("Photo not found");
      }

      photo.isFeatured = !photo.isFeatured;
      await photo.save();

      res.status(200).json({
        success: true,
        message: "Photo feature status updated successfully",
        photo,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error updating photo feature status",
        Error: err.message,
      });
    }
  },
);

// Delete a photo (admin only) — also removes the asset from Cloudinary
galleryRouter.delete("/gallery/:id", userAuth, authorize("admin"), async (req, res) => {
  try {
    const photo = await Gallery.findByIdAndDelete(req.params.id);

    if (!photo) {
      throw new Error("Photo not found");
    }

    await deleteAsset(photo.imagePublicId, "image");

    res.status(200).json({
      success: true,
      message: "Photo deleted successfully",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error deleting photo",
      Error: err.message,
    });
  }
});

module.exports = galleryRouter;
