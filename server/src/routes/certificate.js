const express = require("express");
const PDFDocument = require("pdfkit");

const certificateRouter = express.Router();
const Certificate = require("../models/certificate");
const Batch = require("../models/batch");
const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

// Issue a certificate for a student who has completed a batch (admin only).
// Idempotent: re-issuing for the same student+batch returns the existing one.
certificateRouter.post(
  "/certificates/:batchId/:studentId",
  userAuth,
  authorize("admin"),
  async (req, res) => {
    try {
      const { batchId, studentId } = req.params;

      const batch = await Batch.findById(batchId).populate("course", "title");
      if (!batch) {
        throw new Error("Batch not found");
      }

      const entry = batch.students.find((s) => s.student.toString() === studentId);
      if (!entry) {
        throw new Error("Student is not enrolled in this batch");
      }

      const isComplete = entry.progressPercent >= 100 || batch.status === "Completed";
      if (!isComplete) {
        return res.status(400).json({
          success: false,
          message: "Student has not completed this batch yet",
        });
      }

      const existing = await Certificate.findOne({ student: studentId, batch: batchId });
      if (existing) {
        return res.status(200).json({
          success: true,
          message: "Certificate already issued",
          certificate: existing,
        });
      }

      const certificate = await Certificate.create({
        certificateId: Certificate.generateId(),
        student: studentId,
        course: batch.course._id,
        batch: batch._id,
        completionDate: entry.completedAt || new Date(),
        issuedBy: req.user._id,
      });

      res.status(201).json({
        success: true,
        message: "Certificate issued successfully",
        certificate,
      });
    } catch (err) {
      const message = err.code === 11000 ? "Certificate already exists" : err.message;
      res.status(400).json({
        success: false,
        message: "Error issuing certificate",
        Error: message,
      });
    }
  },
);

// List the logged-in student's own certificates
certificateRouter.get("/certificates/my", userAuth, async (req, res) => {
  try {
    const certificates = await Certificate.find({ student: req.user._id })
      .populate("course", "title category")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Certificates fetched successfully",
      certificates,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching certificates",
      Error: err.message,
    });
  }
});

// Public verification — deliberately returns only non-sensitive fields
// (no email/phone), so this can be safely shared as a public link.
certificateRouter.get("/certificates/verify/:certificateId", async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      certificateId: req.params.certificateId,
    })
      .populate("student", "name")
      .populate("course", "title");

    if (!certificate) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: "Certificate not found",
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      certificateId: certificate.certificateId,
      studentName: certificate.student.name,
      courseTitle: certificate.course.title,
      completionDate: certificate.completionDate,
      issuedAt: certificate.createdAt,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error verifying certificate",
      Error: err.message,
    });
  }
});

// Download the certificate as a PDF (owner or admin only)
certificateRouter.get(
  "/certificates/:certificateId/download",
  userAuth,
  async (req, res) => {
    try {
      const certificate = await Certificate.findOne({
        certificateId: req.params.certificateId,
      })
        .populate("student", "name")
        .populate("course", "title");

      if (!certificate) {
        throw new Error("Certificate not found");
      }

      const isOwner = certificate.student._id.toString() === req.user._id.toString();
      const isAdmin = req.user.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to download this certificate",
        });
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${certificate.certificateId}.pdf`,
      );

      const doc = new PDFDocument({ layout: "landscape", size: "A4", margin: 50 });
      doc.pipe(res);

      const navy = "#001F3F";
      const gold = "#D4A017";

      doc.rect(0, 0, doc.page.width, doc.page.height).fill("#FFFFFF");
      doc
        .lineWidth(6)
        .strokeColor(gold)
        .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
        .stroke();
      doc
        .lineWidth(1.5)
        .strokeColor(navy)
        .rect(32, 32, doc.page.width - 64, doc.page.height - 64)
        .stroke();

      doc
        .fillColor(navy)
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("M KAI² TECH ACADEMY", 0, 80, { align: "center" });

      doc
        .fillColor(gold)
        .fontSize(32)
        .font("Helvetica-Bold")
        .text("Certificate of Completion", 0, 130, { align: "center" });

      doc
        .fillColor("#2C3E50")
        .fontSize(14)
        .font("Helvetica")
        .text("This is to certify that", 0, 200, { align: "center" });

      doc
        .fillColor(navy)
        .fontSize(28)
        .font("Helvetica-Bold")
        .text(certificate.student.name, 0, 230, { align: "center" });

      doc
        .fillColor("#2C3E50")
        .fontSize(14)
        .font("Helvetica")
        .text("has successfully completed the course", 0, 275, { align: "center" });

      doc
        .fillColor(navy)
        .fontSize(20)
        .font("Helvetica-Bold")
        .text(certificate.course.title, 0, 300, { align: "center" });

      const completionDateStr = new Date(certificate.completionDate).toLocaleDateString(
        "en-IN",
        { year: "numeric", month: "long", day: "numeric" },
      );

      doc
        .fillColor("#2C3E50")
        .fontSize(12)
        .font("Helvetica")
        .text(`Completed on ${completionDateStr}`, 0, 350, { align: "center" });

      doc
        .fillColor("#95A5A6")
        .fontSize(10)
        .text(`Certificate ID: ${certificate.certificateId}`, 0, doc.page.height - 90, {
          align: "center",
        });
      doc.text(
        `Verify at /certificates/verify/${certificate.certificateId}`,
        0,
        doc.page.height - 75,
        { align: "center" },
      );

      doc.end();
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error generating certificate",
        Error: err.message,
      });
    }
  },
);

module.exports = certificateRouter;
