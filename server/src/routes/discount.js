const express = require("express");

const discountRouter = express.Router();
const DiscountCode = require("../models/discountCode");
const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

// Create discount code (admin only)
discountRouter.post("/discounts", userAuth, authorize("admin"), async (req, res) => {
  try {
    const { code, type, value, description, expiresAt } = req.body;

    if (!code || code.trim().length < 3) {
      throw new Error("Code must be at least 3 characters");
    }
    if (!["percent", "flat"].includes(type)) {
      throw new Error("Type must be 'percent' or 'flat'");
    }
    if (type === "percent" && value > 100) {
      throw new Error("Percent discount cannot exceed 100");
    }

    const discount = await DiscountCode.create({
      code: code.trim(),
      type,
      value,
      description,
      expiresAt: expiresAt || undefined,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Discount code created successfully",
      discount,
    });
  } catch (err) {
    const message = err.code === 11000 ? "This code already exists" : err.message;
    res.status(400).json({
      success: false,
      message: "Error creating discount code",
      Error: message,
    });
  }
});

// List discount codes (admin only)
discountRouter.get("/discounts", userAuth, authorize("admin"), async (req, res) => {
  try {
    const discounts = await DiscountCode.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Discount codes fetched successfully",
      discounts,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching discount codes",
      Error: err.message,
    });
  }
});

// Validate a discount code against an amount (admin only — used while
// recording an offline payment, not a public checkout endpoint)
discountRouter.get(
  "/api/discounts/validate",
  userAuth,
  authorize("admin"),
  async (req, res) => {
    try {
      const { code, amount } = req.query;

      if (!code) {
        throw new Error("code query parameter is required");
      }

      const discount = await DiscountCode.findOne({ code: code.trim().toUpperCase() });

      if (!discount || !discount.isValidNow()) {
        return res.status(404).json({
          success: false,
          message: "Invalid, inactive, or expired discount code",
        });
      }

      const baseAmount = Number(amount) || 0;
      const discountAmount = discount.applyTo(baseAmount);

      res.status(200).json({
        success: true,
        message: "Discount code is valid",
        discount,
        discountAmount,
        finalAmount: baseAmount - discountAmount,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error validating discount code",
        Error: err.message,
      });
    }
  },
);

// Update discount code (admin only)
discountRouter.patch("/discounts/:id", userAuth, authorize("admin"), async (req, res) => {
  try {
    const ALLOWED_UPDATES = ["type", "value", "description", "isActive", "expiresAt"];
    const isUpdateAllowed = Object.keys(req.body).every((key) =>
      ALLOWED_UPDATES.includes(key),
    );

    if (!isUpdateAllowed) {
      throw new Error("Invalid update field");
    }

    const discount = await DiscountCode.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!discount) {
      throw new Error("Discount code not found");
    }

    res.status(200).json({
      success: true,
      message: "Discount code updated successfully",
      discount,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error updating discount code",
      Error: err.message,
    });
  }
});

// Delete discount code (admin only)
discountRouter.delete("/discounts/:id", userAuth, authorize("admin"), async (req, res) => {
  try {
    const discount = await DiscountCode.findByIdAndDelete(req.params.id);

    if (!discount) {
      throw new Error("Discount code not found");
    }

    res.status(200).json({
      success: true,
      message: "Discount code deleted successfully",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error deleting discount code",
      Error: err.message,
    });
  }
});

module.exports = discountRouter;
