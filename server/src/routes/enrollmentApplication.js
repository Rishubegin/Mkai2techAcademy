const express = require("express");

const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const { imageUpload } = require("../middlewares/upload");

const enrollmentApplicationController = require("../controllers/enrollmentApplication");

const enrollmentApplicationRouter = express.Router();

// Submit an enrollment application (student only). Also performs the actual
// course enrollment in the same request — the paper form and "joining a
// course" are the same real-world action, so the frontend only needs one
// button/request for both.
enrollmentApplicationRouter.post(
  "/enrollment-applications",
  userAuth,
  authorize("student"),
  imageUpload.fields([
    { name: "photo", maxCount: 1 },
    { name: "signature", maxCount: 1 },
    { name: "guardianSignature", maxCount: 1 },
  ]),
  enrollmentApplicationController.createApplication,
);

// List the logged-in student's own applications
enrollmentApplicationRouter.get(
  "/enrollment-applications/my",
  userAuth,
  enrollmentApplicationController.listMyApplications,
);

// List all applications (admin only), optional ?course= filter
enrollmentApplicationRouter.get(
  "/enrollment-applications",
  userAuth,
  authorize("admin"),
  enrollmentApplicationController.listApplications,
);

// Get a single application (owner or admin)
enrollmentApplicationRouter.get(
  "/enrollment-applications/:id",
  userAuth,
  enrollmentApplicationController.getApplicationById,
);

// Update an application (admin only)
enrollmentApplicationRouter.patch(
  "/enrollment-applications/:id",
  userAuth,
  authorize("admin"),
  enrollmentApplicationController.updateApplication,
);

// Delete an application (admin only) — also removes uploaded assets
enrollmentApplicationRouter.delete(
  "/enrollment-applications/:id",
  userAuth,
  authorize("admin"),
  enrollmentApplicationController.deleteApplication,
);

// Download the application as a PDF matching the paper enrolment form
// (owner or admin only). "Form No." is replaced with the student's user ID.
enrollmentApplicationRouter.get(
  "/enrollment-applications/:id/download",
  userAuth,
  enrollmentApplicationController.downloadApplication,
);

module.exports = enrollmentApplicationRouter;
