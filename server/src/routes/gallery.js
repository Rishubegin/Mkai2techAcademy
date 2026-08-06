const express = require("express");

const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const { imageUpload } = require("../middlewares/upload");

const galleryController = require("../controllers/gallery");

const galleryRouter = express.Router();

// List gallery photos (public), optional ?category= filter
galleryRouter.get("/gallery", galleryController.listGalleryItems);

// Featured photos (public) — for homepage
galleryRouter.get("/gallery/featured", galleryController.listFeatured);

// Distinct categories (public) — for filter UI
galleryRouter.get("/gallery/categories", galleryController.listCategories);

// Upload a photo (admin only)
galleryRouter.post(
  "/gallery",
  userAuth,
  authorize("admin"),
  imageUpload.single("image"),
  galleryController.createGalleryItem,
);

// Toggle featured (admin only)
galleryRouter.patch(
  "/gallery/:id/feature",
  userAuth,
  authorize("admin"),
  galleryController.updateFeatured,
);

// Delete a photo (admin only) — also removes the asset from Cloudinary
galleryRouter.delete(
  "/gallery/:id",
  userAuth,
  authorize("admin"),
  galleryController.deleteGalleryItem,
);

module.exports = galleryRouter;
