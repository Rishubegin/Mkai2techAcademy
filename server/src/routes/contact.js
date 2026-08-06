const express = require("express");
const validator = require("validator");

const contactRouter = express.Router();
const ContactForm = require("../models/contactForm");
const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

// Submit contact form (public)
contactRouter.post("/contact", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || name.trim().length < 2) {
      throw new Error("Name is required");
    }
    if (!email || !validator.isEmail(email)) {
      throw new Error("A valid email is required");
    }
    if (!message || message.trim().length < 5) {
      throw new Error("Message is required");
    }

    const contactForm = new ContactForm({ name, email, phone, message });
    await contactForm.save();

    res.status(201).json({
      success: true,
      message: "Form submitted successfully",
      contactForm,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error submitting form",
      Error: err.message,
    });
  }
});

// List submissions (admin only)
contactRouter.get("/contact", userAuth, authorize("admin"), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [contactForms, total] = await Promise.all([
      ContactForm.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ContactForm.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: "Contact forms fetched successfully",
      contactForms,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching contact forms",
      Error: err.message,
    });
  }
});

// Update status (admin only)
contactRouter.patch("/contact/:id", userAuth, authorize("admin"), async (req, res) => {
  try {
    const { status } = req.body;
    const ALLOWED_STATUSES = ["new", "responded", "archived"];

    if (!ALLOWED_STATUSES.includes(status)) {
      throw new Error("Invalid status value");
    }

    const contactForm = await ContactForm.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: "after", runValidators: true },
    );

    if (!contactForm) {
      throw new Error("Contact form entry not found");
    }

    res.status(200).json({
      success: true,
      message: "Contact status updated successfully",
      contactForm,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error updating contact status",
      Error: err.message,
    });
  }
});

module.exports = contactRouter;
