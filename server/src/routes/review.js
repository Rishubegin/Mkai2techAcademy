const express = require("express");
const mongoose = require("mongoose");

const reviewRouter = express.Router();
const Review = require("../models/review");
const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const { isEnrolledInCourse } = require("../utils/enrollment");

// Create a review (must be enrolled in the course)
reviewRouter.post("/reviews", userAuth, authorize("student"), async (req, res) => {
  try {
    const { courseId, rating, comment } = req.body;

    if (!courseId) {
      throw new Error("courseId is required");
    }
    if (!rating || rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const enrolled = await isEnrolledInCourse(req.user._id, courseId);
    if (!enrolled) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in this course to leave a review",
      });
    }

    const existing = await Review.findOne({ course: courseId, student: req.user._id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this course",
      });
    }

    const review = await Review.create({
      course: courseId,
      student: req.user._id,
      rating,
      comment,
    });

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error creating review",
      Error: err.message,
    });
  }
});

// Get reviews for a course (public) + average rating
reviewRouter.get("/reviews/course/:courseId", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const [reviews, total, stats] = await Promise.all([
      Review.find({ course: req.params.courseId })
        .populate("student", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ course: req.params.courseId }),
      Review.aggregate([
        { $match: { course: new mongoose.Types.ObjectId(req.params.courseId) } },
        { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      message: "Reviews fetched successfully",
      reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: {
        averageRating: stats[0] ? Math.round(stats[0].avgRating * 10) / 10 : 0,
        totalReviews: stats[0]?.count || 0,
      },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching reviews",
      Error: err.message,
    });
  }
});

// Update own review
reviewRouter.patch("/reviews/:id", userAuth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      throw new Error("Review not found");
    }
    if (review.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own review",
      });
    }

    const ALLOWED_UPDATES = ["rating", "comment"];
    const isUpdateAllowed = Object.keys(req.body).every((key) =>
      ALLOWED_UPDATES.includes(key),
    );
    if (!isUpdateAllowed) {
      throw new Error("Invalid update field");
    }

    Object.assign(review, req.body);
    await review.save();

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error updating review",
      Error: err.message,
    });
  }
});

// Delete review (owner or admin)
reviewRouter.delete("/reviews/:id", userAuth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      throw new Error("Review not found");
    }

    const isOwner = review.student.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this review",
      });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error deleting review",
      Error: err.message,
    });
  }
});

module.exports = reviewRouter;
