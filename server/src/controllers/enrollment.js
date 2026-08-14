const Enrollment = require("../models/enrollment");
const Course = require("../models/course");

// A student's own enrollments. Admins may view anyone's; students only their
// own — payment/progress figures are per-student and not shareable.
const listEnrollmentsForStudent = async (req, res) => {
  try {
    const isSelf = req.params.studentId === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isSelf && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this student's enrollments",
      });
    }

    const enrollments = await Enrollment.find({ student: req.params.studentId })
      .populate("course", "title category mode")
      .sort({ enrolledAt: -1 });

    res.status(200).json({
      success: true,
      message: "Enrollments fetched successfully",
      enrollments,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching enrollments",
      Error: err.message,
    });
  }
};

// Roster for a course (admin only).
const listEnrollmentsForCourse = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ course: req.params.courseId })
      .populate("student", "name email phone")
      .sort({ enrolledAt: -1 });

    res.status(200).json({
      success: true,
      message: "Enrollments fetched successfully",
      enrollments,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching enrollments",
      Error: err.message,
    });
  }
};

const selfEnroll = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).select("_id");
    if (!course) {
      throw new Error("Course not found");
    }

    const existing = await Enrollment.findOne({
      student: req.user._id,
      course: course._id,
    });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Already enrolled in this course",
        enrollment: existing,
      });
    }

    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: course._id,
    });

    res.status(201).json({
      success: true,
      message: "Enrolled successfully",
      enrollment,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error enrolling in course",
      Error: err.message,
    });
  }
};

// Admin-only. Students deliberately cannot remove their own enrollment:
// enrollment follows an offline paper application and fee payment, so
// withdrawing is an administrative decision, not a self-service action.
const removeEnrollment = async (req, res) => {
  try {
    const removed = await Enrollment.findOneAndDelete({
      student: req.params.studentId,
      course: req.params.courseId,
    });

    if (!removed) {
      throw new Error("This student is not enrolled in this course");
    }

    res.status(200).json({
      success: true,
      message: "Enrollment removed successfully",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error removing enrollment",
      Error: err.message,
    });
  }
};

// Admin updates a student's progress/payment on a course. Replaces the old
// per-batch progress and payment endpoints; certificates depend on
// progressPercent reaching 100, so this is what makes issuance possible.
const ALLOWED_UPDATES = [
  "paymentStatus",
  "amountPaid",
  "discountApplied",
  "discountCode",
  "paymentNotes",
  "progressPercent",
  "completedAt",
];

const updateEnrollment = async (req, res) => {
  try {
    const isUpdateAllowed = Object.keys(req.body).every((key) =>
      ALLOWED_UPDATES.includes(key),
    );
    if (!isUpdateAllowed) {
      throw new Error("Invalid update field");
    }

    const enrollment = await Enrollment.findOne({
      student: req.params.studentId,
      course: req.params.courseId,
    });

    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    Object.assign(enrollment, req.body);

    // Reaching 100% stamps the completion date the certificate reads from.
    if (enrollment.progressPercent >= 100 && !enrollment.completedAt) {
      enrollment.completedAt = new Date();
    }

    await enrollment.save();

    res.status(200).json({
      success: true,
      message: "Enrollment updated successfully",
      enrollment,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error updating enrollment",
      Error: err.message,
    });
  }
};

module.exports = {
  listEnrollmentsForStudent,
  listEnrollmentsForCourse,
  selfEnroll,
  removeEnrollment,
  updateEnrollment,
};
