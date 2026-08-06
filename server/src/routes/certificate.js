const express = require("express");

const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

const certificateController = require("../controllers/certificate");

const certificateRouter = express.Router();

// Issue a certificate for a student who has completed a batch (admin only).
// Idempotent: re-issuing for the same student+batch returns the existing one.
certificateRouter.post(
  "/certificates/:batchId/:studentId",
  userAuth,
  authorize("admin"),
  certificateController.issueCertificate,
);

// List the logged-in student's own certificates
certificateRouter.get(
  "/certificates/my",
  userAuth,
  certificateController.listMyCertificates,
);

// Public verification — deliberately returns only non-sensitive fields
// (no email/phone), so this can be safely shared as a public link.
certificateRouter.get(
  "/certificates/verify/:certificateId",
  certificateController.verifyCertificate,
);

// Download the certificate as a PDF (owner or admin only)
certificateRouter.get(
  "/certificates/:certificateId/download",
  userAuth,
  certificateController.downloadCertificate,
);

module.exports = certificateRouter;
