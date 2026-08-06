const express = require("express");

const testimonialRouter = express.Router();
const Testimonial = require("../models/testimonial");
const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const { isRequestFromAdmin } = require("../middlewares/optionalAdmin");

// Submit a testimonial (student) — pending approval by default
testimonialRouter.post(
  "/testimonials",
  userAuth,
  authorize("student"),
  async (req, res) => {
    try {
      const { position, company, photo, testimonial, shortQuote, course, result } = req.body;

      if (!testimonial || testimonial.trim().length < 10) {
        throw new Error("Testimonial text must be at least 10 characters");
      }

      const created = await Testimonial.create({
        student: req.user._id,
        name: req.user.name,
        position,
        company,
        // Students have no separate testimonial-photo upload flow — reuse
        // whatever profile picture they already have on file, if any.
        photo: photo || req.user.profileImage,
        testimonial,
        shortQuote,
        course,
        result,
      });

      res.status(201).json({
        success: true,
        message: "Testimonial submitted successfully (pending approval)",
        testimonial: created,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error submitting testimonial",
        Error: err.message,
      });
    }
  },
);

// List testimonials — public sees only approved; admin can see all via ?all=true
testimonialRouter.get("/testimonials", async (req, res) => {
  try {
    const wantsAll = req.query.all === "true";
    const isAdminRequest = wantsAll && (await isRequestFromAdmin(req));

    if (wantsAll && !isAdminRequest) {
      return res.status(403).json({
        success: false,
        message: "Admin access required to view unapproved testimonials",
      });
    }

    const filter = isAdminRequest ? {} : { isApproved: true };
    if (req.query.featured === "true") filter.isFeatured = true;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 6);
    const skip = (page - 1) * limit;

    const [testimonials, total] = await Promise.all([
      Testimonial.find(filter)
        .populate("course", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Testimonial.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: "Testimonials fetched successfully",
      testimonials,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching testimonials",
      Error: err.message,
    });
  }
});

// Approve/reject/feature (admin only)
testimonialRouter.patch(
  "/testimonials/:id",
  userAuth,
  authorize("admin"),
  async (req, res) => {
    try {
      const ALLOWED_UPDATES = ["isApproved", "isFeatured"];
      const isUpdateAllowed = Object.keys(req.body).every((key) =>
        ALLOWED_UPDATES.includes(key),
      );

      if (!isUpdateAllowed) {
        throw new Error("Invalid update field");
      }

      const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, {
        returnDocument: "after",
        runValidators: true,
      });

      if (!testimonial) {
        throw new Error("Testimonial not found");
      }

      res.status(200).json({
        success: true,
        message: "Testimonial updated successfully",
        testimonial,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error updating testimonial",
        Error: err.message,
      });
    }
  },
);

// Delete (admin or owner)
testimonialRouter.delete("/testimonials/:id", userAuth, async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      throw new Error("Testimonial not found");
    }

    const isOwner = testimonial.student.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this testimonial",
      });
    }

    await testimonial.deleteOne();

    res.status(200).json({
      success: true,
      message: "Testimonial deleted successfully",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error deleting testimonial",
      Error: err.message,
    });
  }
});

module.exports = testimonialRouter;
