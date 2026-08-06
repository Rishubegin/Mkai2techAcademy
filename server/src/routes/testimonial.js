const express = require("express");

const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

const testimonialController = require("../controllers/testimonial");

const testimonialRouter = express.Router();

// Submit a testimonial (student) — pending approval by default
testimonialRouter.post(
  "/testimonials",
  userAuth,
  authorize("student"),
  testimonialController.createTestimonial,
);

// List testimonials — public sees only approved; admin can see all via ?all=true
testimonialRouter.get("/testimonials", testimonialController.listTestimonials);

// Approve/reject/feature (admin only)
testimonialRouter.patch(
  "/testimonials/:id",
  userAuth,
  authorize("admin"),
  testimonialController.updateTestimonial,
);

// Delete (admin or owner)
testimonialRouter.delete(
  "/testimonials/:id",
  userAuth,
  testimonialController.deleteTestimonial,
);

module.exports = testimonialRouter;
