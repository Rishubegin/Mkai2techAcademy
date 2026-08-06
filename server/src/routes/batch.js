const express = require("express");

const batchRouter = express.Router();
const Batch = require("../models/batch");
const Certificate = require("../models/certificate");
const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const { sendEnrollmentConfirmation } = require("../services/email");

// Applied to any batch query a student or the public might see: per-student
// payment/progress data is sensitive and must never leak to classmates or
// anonymous visitors, so it's excluded at the query level, not just hidden
// in the UI.
const PUBLIC_STUDENT_FIELD_EXCLUSIONS =
  "-students.paymentStatus -students.amountPaid -students.discountApplied " +
  "-students.discountCode -students.paymentNotes -students.progressPercent " +
  "-students.completedAt";

// Create batch (admin only)
batchRouter.post("/batches", userAuth, authorize("admin"), async (req, res) => {
  try {
    const { batchName, course, teacher, capacity, status, startDate, endDate } = req.body;

    const batch = new Batch({
      batchName,
      course,
      teacher,
      capacity,
      status,
      startDate,
      endDate,
      createdBy: req.user._id,
    });

    await batch.save();

    res.status(201).json({
      success: true,
      message: "Batch created successfully",
      batch,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error creating batch",
      Error: err.message,
    });
  }
});

// Stats
batchRouter.get("/batches/stats", userAuth, authorize("admin"), async (req, res) => {
  try {
    const [totalBatches, running, upcoming, completed] = await Promise.all([
      Batch.countDocuments(),
      Batch.countDocuments({ status: "Running" }),
      Batch.countDocuments({ status: "Upcoming" }),
      Batch.countDocuments({ status: "Completed" }),
    ]);

    res.status(200).json({
      success: true,
      message: "Batch stats fetched successfully",
      totalBatches,
      running,
      upcoming,
      completed,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching batch stats",
      Error: err.message,
    });
  }
});

// Batches for a given course (public — never expose per-student financial
// or progress data here, only used for seat counts and "am I enrolled")
batchRouter.get("/courses/:courseId/batches", async (req, res) => {
  try {
    const batches = await Batch.find({ course: req.params.courseId }).select(
      PUBLIC_STUDENT_FIELD_EXCLUSIONS,
    );

    res.status(200).json({
      success: true,
      message: "Batches fetched successfully",
      batches,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching batches for course",
      Error: err.message,
    });
  }
});

// Batches for a given teacher (public — same exclusion as above)
batchRouter.get("/teachers/:teacherId/batches", async (req, res) => {
  try {
    const batches = await Batch.find({ teacher: req.params.teacherId }).select(
      PUBLIC_STUDENT_FIELD_EXCLUSIONS,
    );

    res.status(200).json({
      success: true,
      message: "Batches fetched successfully",
      batches,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching batches for teacher",
      Error: err.message,
    });
  }
});

// Batches for a given student
batchRouter.get("/students/:studentId/batches", userAuth, async (req, res) => {
  try {
    const isSelf = req.params.studentId === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isSelf && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this student's batches",
      });
    }

    const batches = await Batch.find({ "students.student": req.params.studentId }).populate(
      "course",
      "title category mode",
    );

    // A student viewing their own batches must only see their own
    // payment/progress entry, never classmates' — admins see the full roster.
    const responseBatches = isAdmin
      ? batches
      : batches.map((batch) => {
          const plain = batch.toObject();
          plain.students = plain.students.filter(
            (s) => s.student.toString() === req.params.studentId,
          );
          return plain;
        });

    res.status(200).json({
      success: true,
      message: "Batches fetched successfully",
      batches: responseBatches,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching batches for student",
      Error: err.message,
    });
  }
});

// List all batches (filters + pagination)
batchRouter.get("/batches", userAuth, authorize("admin"), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.course) filter.course = req.query.course;
    if (req.query.teacher) filter.teacher = req.query.teacher;
    if (req.query.student) filter["students.student"] = req.query.student;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.batchName = new RegExp(req.query.search, "i");

    if (req.query.startDate) {
      filter.startDate = { $gte: new Date(req.query.startDate) };
    }
    if (req.query.from || req.query.to) {
      filter.startDate = {};
      if (req.query.from) filter.startDate.$gte = new Date(req.query.from);
      if (req.query.to) filter.startDate.$lte = new Date(req.query.to);
    }

    const [batches, total] = await Promise.all([
      Batch.find(filter)
        .populate("course", "title category mode")
        .skip(skip)
        .limit(limit),
      Batch.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: "Batches fetched successfully",
      batches,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching batches",
      Error: err.message,
    });
  }
});

// Remaining seats
batchRouter.get("/batches/:id/seats", async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      throw new Error("Batch not found");
    }

    const filled = batch.students.length;

    res.status(200).json({
      success: true,
      message: "Seat availability fetched successfully",
      capacity: batch.capacity,
      filled,
      available: batch.capacity - filled,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Error fetching seat availability",
      Error: err.message,
    });
  }
});

// Self-enroll (student enrolls themselves in a batch)
batchRouter.post("/batches/:id/enroll", userAuth, authorize("student"), async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id).populate("course", "title");

    if (!batch) {
      throw new Error("Batch not found");
    }

    if (batch.status === "Completed") {
      throw new Error("This batch has already been completed");
    }

    const studentId = req.user._id.toString();

    if (batch.students.some((s) => s.student.toString() === studentId)) {
      throw new Error("You are already enrolled in this batch");
    }

    if (batch.students.length >= batch.capacity) {
      throw new Error("This batch is at full capacity");
    }

    batch.students.push({ student: studentId, enrolledAt: new Date() });
    await batch.save();

    sendEnrollmentConfirmation({
      user: req.user,
      courseTitle: batch.course?.title || "your course",
      batchName: batch.batchName,
    }).catch((err) => console.error("Failed to send enrollment email:", err.message));

    res.status(200).json({
      success: true,
      message: "Enrolled in batch successfully",
      batch,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error enrolling in batch",
      Error: err.message,
    });
  }
});

// Self-unenroll (student removes themselves from a batch)
batchRouter.delete(
  "/api/batches/:id/enroll",
  userAuth,
  authorize("student"),
  async (req, res) => {
    try {
      const batch = await Batch.findById(req.params.id);

      if (!batch) {
        throw new Error("Batch not found");
      }

      const studentId = req.user._id.toString();
      batch.students = batch.students.filter((s) => s.student.toString() !== studentId);
      await batch.save();

      res.status(200).json({
        success: true,
        message: "Unenrolled from batch successfully",
        batch,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error unenrolling from batch",
        Error: err.message,
      });
    }
  },
);

// Update batch status (admin only)
batchRouter.patch(
  "/api/batches/:id/status",
  userAuth,
  authorize("admin"),
  async (req, res) => {
    try {
      const { status } = req.body;
      const ALLOWED_STATUSES = ["Upcoming", "Running", "Completed"];

      if (!ALLOWED_STATUSES.includes(status)) {
        throw new Error("Invalid status value");
      }

      const batch = await Batch.findById(req.params.id);

      if (!batch) {
        throw new Error("Batch not found");
      }

      batch.status = status;

      // Auto-complete: marking a batch Completed marks every student who
      // hasn't already been individually completed as 100% done, so
      // certificates become issuable without an admin having to touch
      // each student record one by one.
      if (status === "Completed") {
        const now = new Date();
        batch.students.forEach((entry) => {
          if (!entry.completedAt) {
            entry.progressPercent = 100;
            entry.completedAt = now;
          }
        });
      }

      await batch.save();

      res.status(200).json({
        success: true,
        message: "Batch status updated successfully",
        batch,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error updating batch status",
        Error: err.message,
      });
    }
  },
);

// Add student to batch (admin only)
batchRouter.post(
  "/api/batches/:id/students",
  userAuth,
  authorize("admin"),
  async (req, res) => {
    try {
      const { studentId } = req.body;

      if (!studentId) {
        throw new Error("studentId is required");
      }

      const batch = await Batch.findById(req.params.id);

      if (!batch) {
        throw new Error("Batch not found");
      }

      if (batch.students.some((s) => s.student.toString() === studentId)) {
        throw new Error("Student already enrolled in this batch");
      }

      if (batch.students.length >= batch.capacity) {
        throw new Error("Batch is at full capacity");
      }

      batch.students.push({ student: studentId, enrolledAt: new Date() });
      await batch.save();

      res.status(200).json({
        success: true,
        message: "Student added to batch successfully",
        batch,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error adding student to batch",
        Error: err.message,
      });
    }
  },
);

// Remove student from batch (admin only)
batchRouter.delete(
  "/api/batches/:id/students/:studentId",
  userAuth,
  authorize("admin"),
  async (req, res) => {
    try {
      const batch = await Batch.findById(req.params.id);

      if (!batch) {
        throw new Error("Batch not found");
      }

      batch.students = batch.students.filter(
        (s) => s.student.toString() !== req.params.studentId,
      );
      await batch.save();

      res.status(200).json({
        success: true,
        message: "Student removed from batch successfully",
        batch,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error removing student from batch",
        Error: err.message,
      });
    }
  },
);

// Record/update a student's offline payment for a batch (admin only) —
// fees are collected in person; this just records what the admin was told.
batchRouter.patch(
  "/api/batches/:id/students/:studentId/payment",
  userAuth,
  authorize("admin"),
  async (req, res) => {
    try {
      const ALLOWED_UPDATES = [
        "paymentStatus",
        "amountPaid",
        "discountApplied",
        "discountCode",
        "paymentNotes",
      ];
      const isUpdateAllowed = Object.keys(req.body).every((key) =>
        ALLOWED_UPDATES.includes(key),
      );
      if (!isUpdateAllowed) {
        throw new Error("Invalid update field");
      }
      if (
        req.body.paymentStatus &&
        !["unpaid", "partial", "paid"].includes(req.body.paymentStatus)
      ) {
        throw new Error("Invalid payment status");
      }

      const batch = await Batch.findById(req.params.id);
      if (!batch) {
        throw new Error("Batch not found");
      }

      const entry = batch.students.find(
        (s) => s.student.toString() === req.params.studentId,
      );
      if (!entry) {
        throw new Error("Student is not enrolled in this batch");
      }

      Object.assign(entry, req.body);
      await batch.save();

      res.status(200).json({
        success: true,
        message: "Payment record updated successfully",
        student: entry,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error updating payment record",
        Error: err.message,
      });
    }
  },
);

// Update a student's progress within a batch (admin only — there's no
// online lesson tracker, so this reflects offline attendance/coursework
// as reported by the instructor). Reaching 100% stamps completedAt, which
// is what makes the student eligible for a certificate.
batchRouter.patch(
  "/api/batches/:id/students/:studentId/progress",
  userAuth,
  authorize("admin"),
  async (req, res) => {
    try {
      const { progressPercent } = req.body;

      if (
        progressPercent === undefined ||
        progressPercent < 0 ||
        progressPercent > 100
      ) {
        throw new Error("progressPercent must be between 0 and 100");
      }

      const batch = await Batch.findById(req.params.id);
      if (!batch) {
        throw new Error("Batch not found");
      }

      const entry = batch.students.find(
        (s) => s.student.toString() === req.params.studentId,
      );
      if (!entry) {
        throw new Error("Student is not enrolled in this batch");
      }

      entry.progressPercent = progressPercent;
      if (progressPercent >= 100 && !entry.completedAt) {
        entry.completedAt = new Date();
      } else if (progressPercent < 100) {
        entry.completedAt = undefined;
      }

      await batch.save();

      res.status(200).json({
        success: true,
        message: "Progress updated successfully",
        student: entry,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error updating progress",
        Error: err.message,
      });
    }
  },
);

// Get single batch — full roster including payment/progress, so admin only
// (nothing on the frontend calls this for students; they use
// /api/students/:studentId/batches instead, which is self-filtered)
batchRouter.get("/batches/:id", userAuth, authorize("admin"), async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate("course", "title category mode")
      .populate("students.student", "name email");

    if (!batch) {
      throw new Error("Batch not found");
    }

    res.status(200).json({
      success: true,
      message: "Batch fetched successfully",
      batch,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Error fetching batch",
      Error: err.message,
    });
  }
});

// Update batch (admin only)
batchRouter.patch("/batches/:id", userAuth, authorize("admin"), async (req, res) => {
  try {
    const ALLOWED_UPDATES = [
      "batchName",
      "course",
      "teacher",
      "capacity",
      "status",
      "startDate",
      "endDate",
    ];

    const isUpdateAllowed = Object.keys(req.body).every((key) =>
      ALLOWED_UPDATES.includes(key),
    );

    if (!isUpdateAllowed) {
      throw new Error("Invalid update field");
    }

    const batch = await Batch.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!batch) {
      throw new Error("Batch not found");
    }

    res.status(200).json({
      success: true,
      message: "Batch updated successfully",
      batch,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error updating batch",
      Error: err.message,
    });
  }
});

// Delete batch (admin only)
batchRouter.delete("/batches/:id", userAuth, authorize("admin"), async (req, res) => {
  try {
    const batch = await Batch.findByIdAndDelete(req.params.id);

    if (!batch) {
      throw new Error("Batch not found");
    }

    res.status(200).json({
      success: true,
      message: "Batch deleted successfully",
      batch,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error deleting batch",
      Error: err.message,
    });
  }
});

module.exports = batchRouter;
