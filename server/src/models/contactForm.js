const mongoose = require("mongoose");
const validator = require("validator");

const contactFormSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [60, "Name cannot exceed 60 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: "Please provide a valid email",
      },
    },
    phone: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: ["new", "responded", "archived"],
      default: "new",
    },
  },
  { timestamps: true },
);

contactFormSchema.index({ status: 1 });
contactFormSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ContactForm", contactFormSchema);
