const Batch = require("../models/batch");
const { sendEnrollmentConfirmation } = require("../services/email");

// Applied to any batch query a student or the public might see: per-student
// payment/progress data is sensitive and must never leak to classmates or
// anonymous visitors, so it's excluded at the query level, not just hidden
// in the UI.
const PUBLIC_STUDENT_FIELD_EXCLUSIONS =
  "-students.paymentStatus -students.amountPaid -students.discountApplied " +
  "-students.discountCode -students.paymentNotes -students.progressPercent " +
  "-students.completedAt";

const createBatch = async (req, res) => {
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
};

const getStats = async (req, res) => {
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
};

const listBatchesForCourse = async (req, res) => {
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
};

const listBatchesForTeacher = async (req, res) => {
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
};

const listBatchesForStudent = async (req, res) => {
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
};

const listBatches = async (req, res) => {
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
};

const getSeats = async (req, res) => {
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
};

const enroll = async (req, res) => {
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
};

const cancelEnrollment = async (req, res) => {
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
  };

const updateStatus = async (req, res) => {
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
  };

const addStudent = async (req, res) => {
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
  };

const removeStudent = async (req, res) => {
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
  };

const updateStudentPayment = async (req, res) => {
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
  };

const updateStudentProgress = async (req, res) => {
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
  };

const getBatchById = async (req, res) => {
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
};

const updateBatch = async (req, res) => {
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
};

const deleteBatch = async (req, res) => {
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
};

module.exports = {
  createBatch,
  getStats,
  listBatchesForCourse,
  listBatchesForTeacher,
  listBatchesForStudent,
  listBatches,
  getSeats,
  enroll,
  cancelEnrollment,
  updateStatus,
  addStudent,
  removeStudent,
  updateStudentPayment,
  updateStudentProgress,
  getBatchById,
  updateBatch,
  deleteBatch,
};
