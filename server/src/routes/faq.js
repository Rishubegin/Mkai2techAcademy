const express = require("express");

const FAQ = require("../models/faq");
const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

const faqController = require("../controllers/faq");

const faqRouter = express.Router();

// List FAQs (public sees only active; admin can see all via ?all=true)
faqRouter.get("/faqs", faqController.listFaqs);

// Create FAQ (admin only)
faqRouter.post("/faqs", userAuth, authorize("admin"), faqController.createFaq);

// Mark as helpful (public)
faqRouter.post("/faqs/:id/helpful", faqController.markHelpful);

// Update FAQ (admin only)
faqRouter.patch("/faqs/:id", userAuth, authorize("admin"), faqController.updateFaq);

// Delete FAQ (admin only)
faqRouter.delete("/faqs/:id", userAuth, authorize("admin"), faqController.deleteFaq);

module.exports = faqRouter;
