const express = require("express");

const eventRouter = express.Router();
const Event = require("../models/event");
const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const { imageUpload } = require("../middlewares/upload");
const { uploadBuffer, deleteAsset } = require("../utils/cloudinaryUpload");

// List events (public) — ?upcoming=true / ?past=true filter by date
eventRouter.get("/events", async (req, res) => {
  try {
    const filter = {};
    const now = new Date();
    if (req.query.upcoming === "true") filter.date = { $gte: now };
    if (req.query.past === "true") filter.date = { $lt: now };

    const events = await Event.find(filter).sort({ date: 1 });

    res.status(200).json({
      success: true,
      message: "Events fetched successfully",
      events,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching events",
      Error: err.message,
    });
  }
});

// Stats (admin only)
eventRouter.get("/events/stats", userAuth, authorize("admin"), async (req, res) => {
  try {
    const now = new Date();
    const [totalEvents, upcoming, past] = await Promise.all([
      Event.countDocuments(),
      Event.countDocuments({ date: { $gte: now } }),
      Event.countDocuments({ date: { $lt: now } }),
    ]);

    res.status(200).json({
      success: true,
      message: "Event stats fetched successfully",
      totalEvents,
      upcoming,
      past,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching event stats",
      Error: err.message,
    });
  }
});

// Create event (admin only)
eventRouter.post(
  "/events",
  userAuth,
  authorize("admin"),
  imageUpload.single("image"),
  async (req, res) => {
    let uploaded;
    try {
      const { title, description, date, time, location, fee, maxAttendees, isFeatured } =
        req.body;

      if (req.file) {
        uploaded = await uploadBuffer(req.file.buffer, {
          folder: "mkai2tech/events",
          resourceType: "image",
        });
      }

      const event = await Event.create({
        title,
        description,
        date,
        time,
        location,
        fee,
        maxAttendees,
        isFeatured: isFeatured === "true" || isFeatured === true,
        image: uploaded?.secure_url,
        imagePublicId: uploaded?.public_id,
        createdBy: req.user._id,
      });

      res.status(201).json({
        success: true,
        message: "Event created successfully",
        event,
      });
    } catch (err) {
      if (uploaded) {
        deleteAsset(uploaded.public_id, "image").catch(() => {});
      }
      res.status(400).json({
        success: false,
        message: "Error creating event",
        Error: err.message,
      });
    }
  },
);

// Register for an event (student only) — capacity + dedup gated, same
// pattern as Batch self-enroll.
eventRouter.post(
  "/events/:id/register",
  userAuth,
  authorize("student"),
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        throw new Error("Event not found");
      }

      if (event.date < new Date()) {
        throw new Error("This event has already taken place");
      }

      const studentId = req.user._id.toString();

      if (event.attendees.some((a) => a.student.toString() === studentId)) {
        throw new Error("You are already registered for this event");
      }

      if (event.attendees.length >= event.maxAttendees) {
        throw new Error("This event is at full capacity");
      }

      event.attendees.push({ student: studentId, registeredAt: new Date() });
      await event.save();

      res.status(200).json({
        success: true,
        message: "Registered for event successfully",
        event,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error registering for event",
        Error: err.message,
      });
    }
  },
);

// Unregister from an event (student only)
eventRouter.delete(
  "/events/:id/register",
  userAuth,
  authorize("student"),
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        throw new Error("Event not found");
      }

      const studentId = req.user._id.toString();
      event.attendees = event.attendees.filter((a) => a.student.toString() !== studentId);
      await event.save();

      res.status(200).json({
        success: true,
        message: "Unregistered from event successfully",
        event,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error unregistering from event",
        Error: err.message,
      });
    }
  },
);

// Get single event (public)
eventRouter.get("/events/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "attendees.student",
      "name email",
    );

    if (!event) {
      throw new Error("Event not found");
    }

    res.status(200).json({
      success: true,
      message: "Event fetched successfully",
      event,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Error fetching event",
      Error: err.message,
    });
  }
});

// Update event (admin only)
eventRouter.patch("/events/:id", userAuth, authorize("admin"), async (req, res) => {
  try {
    const ALLOWED_UPDATES = [
      "title",
      "description",
      "date",
      "time",
      "location",
      "fee",
      "maxAttendees",
      "isFeatured",
    ];
    const isUpdateAllowed = Object.keys(req.body).every((key) =>
      ALLOWED_UPDATES.includes(key),
    );
    if (!isUpdateAllowed) {
      throw new Error("Invalid update field");
    }

    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!event) {
      throw new Error("Event not found");
    }

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error updating event",
      Error: err.message,
    });
  }
});

// Delete event (admin only) — also removes the image from Cloudinary
eventRouter.delete("/events/:id", userAuth, authorize("admin"), async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      throw new Error("Event not found");
    }

    await deleteAsset(event.imagePublicId, "image");

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error deleting event",
      Error: err.message,
    });
  }
});

module.exports = eventRouter;
