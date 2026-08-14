const express = require("express");

const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const { imageUpload } = require("../middlewares/upload");

const eventController = require("../controllers/event");

const eventRouter = express.Router();

// List events (public) — ?upcoming=true / ?past=true filter by date
eventRouter.get("/events", eventController.listEvents);

// Stats (admin only)
eventRouter.get(
  "/events/stats",
  userAuth,
  authorize("admin"),
  eventController.getStats,
);

// Create event (admin only)
eventRouter.post(
  "/events",
  userAuth,
  authorize("admin"),
  imageUpload.single("image"),
  eventController.createEvent,
);

// Register for an event (student only) — capacity + dedup gated.
eventRouter.post(
  "/events/:id/register",
  userAuth,
  authorize("student"),
  eventController.registerForEvent,
);

// Unregister from an event (student only)
eventRouter.delete(
  "/events/:id/register",
  userAuth,
  authorize("student"),
  eventController.cancelRegistration,
);

// Get single event (public)
eventRouter.get("/events/:id", eventController.getEventById);

// Update event (admin only)
eventRouter.patch(
  "/events/:id",
  userAuth,
  authorize("admin"),
  eventController.updateEvent,
);

// Delete event (admin only) — also removes the image from Cloudinary
eventRouter.delete(
  "/events/:id",
  userAuth,
  authorize("admin"),
  eventController.deleteEvent,
);

module.exports = eventRouter;
