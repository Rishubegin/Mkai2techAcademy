const express = require("express");

const faqRouter = express.Router();
const FAQ = require("../models/faq");
const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const { isRequestFromAdmin } = require("../middlewares/optionalAdmin");

// List FAQs (public sees only active; admin can see all via ?all=true)
faqRouter.get("/faqs", async (req, res) => {
  try {
    const wantsAll = req.query.all === "true";
    const isAdminRequest = wantsAll && (await isRequestFromAdmin(req));

    if (wantsAll && !isAdminRequest) {
      return res.status(403).json({
        success: false,
        message: "Admin access required to view inactive FAQs",
      });
    }

    const filter = isAdminRequest ? {} : { isActive: true };
    if (req.query.category) filter.category = req.query.category;

    const faqs = await FAQ.find(filter).sort({ displayOrder: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      message: "FAQs fetched successfully",
      faqs,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching FAQs",
      Error: err.message,
    });
  }
});

// Create FAQ (admin only)
faqRouter.post("/faqs", userAuth, authorize("admin"), async (req, res) => {
  try {
    const { question, answer, category, course, displayOrder } = req.body;

    const faq = await FAQ.create({ question, answer, category, course, displayOrder });

    res.status(201).json({
      success: true,
      message: "FAQ created successfully",
      faq,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error creating FAQ",
      Error: err.message,
    });
  }
});

// Mark as helpful (public)
faqRouter.post("/faqs/:id/helpful", async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpful: 1 } },
      { returnDocument: "after" },
    );

    if (!faq) {
      throw new Error("FAQ not found");
    }

    res.status(200).json({
      success: true,
      message: "FAQ marked as helpful",
      helpful: faq.helpful,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error marking FAQ as helpful",
      Error: err.message,
    });
  }
});

// Get single FAQ (public) — also increments view count
faqRouter.get("/faqs/:id", async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { returnDocument: "after" },
    ).populate("course", "title");

    if (!faq) {
      throw new Error("FAQ not found");
    }

    res.status(200).json({
      success: true,
      message: "FAQ fetched successfully",
      faq,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Error fetching FAQ",
      Error: err.message,
    });
  }
});

// Update FAQ (admin only)
faqRouter.patch("/faqs/:id", userAuth, authorize("admin"), async (req, res) => {
  try {
    const ALLOWED_UPDATES = [
      "question",
      "answer",
      "category",
      "course",
      "displayOrder",
      "isActive",
    ];
    const isUpdateAllowed = Object.keys(req.body).every((key) =>
      ALLOWED_UPDATES.includes(key),
    );
    if (!isUpdateAllowed) {
      throw new Error("Invalid update field");
    }

    const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!faq) {
      throw new Error("FAQ not found");
    }

    res.status(200).json({
      success: true,
      message: "FAQ updated successfully",
      faq,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error updating FAQ",
      Error: err.message,
    });
  }
});

// Delete FAQ (admin only)
faqRouter.delete("/faqs/:id", userAuth, authorize("admin"), async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);

    if (!faq) {
      throw new Error("FAQ not found");
    }

    res.status(200).json({
      success: true,
      message: "FAQ deleted successfully",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error deleting FAQ",
      Error: err.message,
    });
  }
});

module.exports = faqRouter;
