const mongoose = require("mongoose");
const validator = require("validator");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    time: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    fee: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxAttendees: {
      type: Number,
      required: [true, "Max attendees is required"],
      min: 1,
    },
    attendees: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        registeredAt: { type: Date, default: Date.now },
      },
    ],
    image: {
      type: String,
      validate(value) {
        if (value && !value.startsWith("/uploads/") && !validator.isURL(value)) {
          throw new Error("Invalid image path: " + value);
        }
      },
    },
    // Cloudinary public_id, used to delete the asset from Cloudinary.
    // Absent for any legacy image still on local disk.
    imagePublicId: {
      type: String,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

eventSchema.index({ date: 1 });
eventSchema.index({ isFeatured: 1 });

module.exports = mongoose.model("Event", eventSchema);
