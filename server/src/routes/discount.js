const express = require("express");

const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

const discountController = require("../controllers/discount");

const discountRouter = express.Router();

// Create discount code (admin only)
discountRouter.post(
  "/discounts",
  userAuth,
  authorize("admin"),
  discountController.createDiscount,
);

// List discount codes (admin only)
discountRouter.get(
  "/discounts",
  userAuth,
  authorize("admin"),
  discountController.listDiscounts,
);

// Update discount code (admin only)
discountRouter.patch(
  "/discounts/:id",
  userAuth,
  authorize("admin"),
  discountController.updateDiscount,
);

// Delete discount code (admin only)
discountRouter.delete(
  "/discounts/:id",
  userAuth,
  authorize("admin"),
  discountController.deleteDiscount,
);

module.exports = discountRouter;
