const express = require("express");

const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

const adminController = require("../controllers/admin");

const adminRouter = express.Router();

// Headline user counts for the admin dashboard. Lives here rather than with
// the /users routes because it's a dashboard statistic, not a user resource.
adminRouter.get(
  "/dashboard/users/count",
  userAuth,
  authorize("admin"),
  adminController.getUserCounts,
);

// Admin creates a user directly (student/teacher/admin), bypassing public signup
adminRouter.post(
  "/admin/users",
  userAuth,
  authorize("admin"),
  adminController.createUser,
);

// Enrollment trend for admin analytics charts: count of enrollments per day.
// Defaults to the last `days` (default 30, max 90); pass explicit `from`/`to`
// (YYYY-MM-DD) to override with a specific date range instead.
adminRouter.get(
  "/admin/analytics/enrollment-trend",
  userAuth,
  authorize("admin"),
  adminController.getEnrollmentTrend,
);

adminRouter.get(
  "/admin/analytics/enrollments/export",
  userAuth,
  authorize("admin"),
  adminController.exportEnrollments,
);

// Offline payment collection summary — fees are collected in person, this
// aggregates what's been recorded so admins can see collected vs. pending.
adminRouter.get(
  "/admin/analytics/payments",
  userAuth,
  authorize("admin"),
  adminController.getPaymentAnalytics,
);

module.exports = adminRouter;
