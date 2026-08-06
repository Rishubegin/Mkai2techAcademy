const express = require("express");

const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

const reviewController = require("../controllers/review");

const reviewRouter = express.Router();

// Create a review (must be enrolled in the course)
reviewRouter.post(
  "/reviews",
  userAuth,
  authorize("student"),
  reviewController.createReview,
);

// Get reviews for a course (public) + average rating
reviewRouter.get("/reviews/course/:courseId", reviewController.listByCourse);

// Update own review
reviewRouter.patch("/reviews/:id", userAuth, reviewController.updateReview);

// Delete review (owner or admin)
reviewRouter.delete("/reviews/:id", userAuth, reviewController.deleteReview);

module.exports = reviewRouter;
