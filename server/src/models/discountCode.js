const mongoose = require("mongoose");

const discountCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["percent", "flat"],
      required: [true, "Discount type is required"],
    },
    value: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Value cannot be negative"],
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

discountCodeSchema.index({ isActive: 1 });

discountCodeSchema.methods.isValidNow = function () {
  if (!this.isActive) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  return true;
};

discountCodeSchema.methods.applyTo = function (amount) {
  if (this.type === "percent") {
    return Math.min(amount, Math.round((amount * this.value) / 100));
  }
  return Math.min(amount, this.value);
};

module.exports = mongoose.model("DiscountCode", discountCodeSchema);
