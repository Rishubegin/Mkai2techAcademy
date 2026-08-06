const express = require("express");

const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

const contactController = require("../controllers/contact");

const contactRouter = express.Router();

// Submit contact form (public)
contactRouter.post("/contact", contactController.createInquiry);

// List submissions (admin only)
contactRouter.get(
  "/contact",
  userAuth,
  authorize("admin"),
  contactController.listInquiries,
);

// Update status (admin only)
contactRouter.patch(
  "/contact/:id",
  userAuth,
  authorize("admin"),
  contactController.updateInquiry,
);

module.exports = contactRouter;
