const express = require("express");

const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

const batchController = require("../controllers/batch");

const batchRouter = express.Router();

// Create batch (admin only)
batchRouter.post("/batches", userAuth, authorize("admin"), batchController.createBatch);

// Stats
batchRouter.get(
  "/batches/stats",
  userAuth,
  authorize("admin"),
  batchController.getStats,
);

// Batches for a given course (public — never expose per-student financial
// or progress data here, only used for seat counts and "am I enrolled")
batchRouter.get("/courses/:courseId/batches", batchController.listBatchesForCourse);

// Batches for a given teacher (public — same exclusion as above)
batchRouter.get("/teachers/:teacherId/batches", batchController.listBatchesForTeacher);

// Batches for a given student
batchRouter.get(
  "/students/:studentId/batches",
  userAuth,
  batchController.listBatchesForStudent,
);

// List all batches (filters + pagination)
batchRouter.get("/batches", userAuth, authorize("admin"), batchController.listBatches);

// Remaining seats
batchRouter.get("/batches/:id/seats", batchController.getSeats);

// Self-enroll (student enrolls themselves in a batch)
batchRouter.post(
  "/batches/:id/enroll",
  userAuth,
  authorize("student"),
  batchController.enroll,
);

// Self-unenroll (student removes themselves from a batch)
batchRouter.delete(
  "/batches/:id/enroll",
  userAuth,
  authorize("student"),
  batchController.cancelEnrollment,
);

// Update batch status (admin only)
batchRouter.patch(
  "/batches/:id/status",
  userAuth,
  authorize("admin"),
  batchController.updateStatus,
);

// Add student to batch (admin only)
batchRouter.post(
  "/batches/:id/students",
  userAuth,
  authorize("admin"),
  batchController.addStudent,
);

// Remove student from batch (admin only)
batchRouter.delete(
  "/batches/:id/students/:studentId",
  userAuth,
  authorize("admin"),
  batchController.removeStudent,
);

// Record/update a student's offline payment for a batch (admin only) —
// fees are collected in person; this just records what the admin was told.
batchRouter.patch(
  "/batches/:id/students/:studentId/payment",
  userAuth,
  authorize("admin"),
  batchController.updateStudentPayment,
);

// Update a student's progress within a batch (admin only — there's no
// online lesson tracker, so this reflects offline attendance/coursework
// as reported by the instructor). Reaching 100% stamps completedAt, which
// is what makes the student eligible for a certificate.
batchRouter.patch(
  "/batches/:id/students/:studentId/progress",
  userAuth,
  authorize("admin"),
  batchController.updateStudentProgress,
);

// Get single batch — full roster including payment/progress, so admin only
// (nothing on the frontend calls this for students; they use
// /api/students/:studentId/batches instead, which is self-filtered)
batchRouter.get(
  "/batches/:id",
  userAuth,
  authorize("admin"),
  batchController.getBatchById,
);

// Update batch (admin only)
batchRouter.patch(
  "/batches/:id",
  userAuth,
  authorize("admin"),
  batchController.updateBatch,
);

// Delete batch (admin only)
batchRouter.delete(
  "/batches/:id",
  userAuth,
  authorize("admin"),
  batchController.deleteBatch,
);

module.exports = batchRouter;
