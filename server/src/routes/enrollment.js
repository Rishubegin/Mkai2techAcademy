const express = require("express");

const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

const enrollmentController = require("../controllers/enrollment");

const enrollmentRouter = express.Router();

// A student's enrollments (self or admin)
enrollmentRouter.get(
  "/students/:studentId/enrollments",
  userAuth,
  enrollmentController.listEnrollmentsForStudent,
);

// Roster for a course (admin only)
enrollmentRouter.get(
  "/courses/:courseId/enrollments",
  userAuth,
  authorize("admin"),
  enrollmentController.listEnrollmentsForCourse,
);

// Self enroll (student). There is deliberately no self-unenroll — removing an
// enrollment is admin-only, see the DELETE route below.
enrollmentRouter.post(
  "/courses/:courseId/enroll",
  userAuth,
  enrollmentController.selfEnroll,
);

// Remove a student's enrollment (admin only)
enrollmentRouter.delete(
  "/courses/:courseId/enrollments/:studentId",
  userAuth,
  authorize("admin"),
  enrollmentController.removeEnrollment,
);

// Update a student's progress/payment on a course (admin only)
enrollmentRouter.patch(
  "/courses/:courseId/enrollments/:studentId",
  userAuth,
  authorize("admin"),
  enrollmentController.updateEnrollment,
);

module.exports = enrollmentRouter;
