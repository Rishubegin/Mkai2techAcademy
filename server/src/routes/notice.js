const express = require("express");

const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

const noticeController = require("../controllers/notice");

const noticeRouter = express.Router();

// List notices — requires auth, since notices are role-targeted and we need
// req.user.role to filter them. Non-admins always get only active,
// non-expired notices targeted at "all" or their own role. Admins can pass
// ?all=true to see everything (including expired/inactive) for management.
noticeRouter.get("/notices", userAuth, noticeController.listNotices);

// Create notice (admin only)
noticeRouter.post(
  "/notices",
  userAuth,
  authorize("admin"),
  noticeController.createNotice,
);

// Update notice (admin only)
noticeRouter.patch(
  "/notices/:id",
  userAuth,
  authorize("admin"),
  noticeController.updateNotice,
);

// Delete notice (admin only)
noticeRouter.delete(
  "/notices/:id",
  userAuth,
  authorize("admin"),
  noticeController.deleteNotice,
);

module.exports = noticeRouter;
