const express = require("express");

const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const { imageUpload } = require("../middlewares/upload");

const teacherController = require("../controllers/teacher");

const teacherRouter = express.Router();

// Create teacher profile (admin, or the teacher creating their own profile)
teacherRouter.post("/teacher-profiles", userAuth, teacherController.createProfile);

// Stats
teacherRouter.get("/teacher-profiles/stats", teacherController.getStats);

// Search teachers (qualification, bio, specialization)
teacherRouter.get("/teacher-profiles/search", teacherController.searchProfiles);

// Get profile by linked user id
teacherRouter.get(
  "/teacher-profiles/user/:userId",
  teacherController.getProfileByUserId,
);

// List all teacher profiles (with optional specialization/experience filters)
teacherRouter.get("/teacher-profiles", teacherController.listProfiles);

// Upload/replace photo (owner or admin)
teacherRouter.patch(
  "/teacher-profiles/:profileId/photo",
  userAuth,
  imageUpload.single("photo"),
  teacherController.updatePhoto,
);

// Get single profile
teacherRouter.get("/teacher-profiles/:profileId", teacherController.getProfileById);

// Update profile (owner or admin)
teacherRouter.patch(
  "/teacher-profiles/:profileId",
  userAuth,
  teacherController.updateProfile,
);

// Delete profile (admin only)
teacherRouter.delete(
  "/teacher-profiles/:profileId",
  userAuth,
  authorize("admin"),
  teacherController.deleteProfile,
);

module.exports = teacherRouter;
