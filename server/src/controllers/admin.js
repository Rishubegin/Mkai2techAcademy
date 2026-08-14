const validator = require("validator");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Enrollment = require("../models/enrollment");

// CSV export of every enrollment
const escapeCsvField = (value) => {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

const getUserCounts = async (req, res) => {
  try {
    const students = await User.countDocuments({ role: "student" });
    const teachers = await User.countDocuments({ role: "teacher" });
    const admins = await User.countDocuments({ role: "admin" });

    res.status(200).json({
      success: true,
      message: "successfully fetched Count",
      students: students,
      teachers: teachers,
      admins: admins,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error Counting Users",
      Error: err.message,
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || name.length < 3 || name.length > 60) {
      throw new Error("Name must be between 3 to 60 characters");
    }
    if (!email || !validator.isEmail(email)) {
      throw new Error("A valid email is required");
    }
    if (!password || !validator.isStrongPassword(password)) {
      throw new Error("Password is not strong enough");
    }
    if (role && !["student", "teacher", "admin"].includes(role)) {
      throw new Error("Invalid role");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      phone: phone || undefined,
      password: passwordHash,
      role: role || "student",
    });

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: userResponse,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error creating user",
      Error: err.message,
    });
  }
};

const getEnrollmentTrend = async (req, res) => {
    try {
      let since;
      let until;

      if (req.query.from || req.query.to) {
        since = req.query.from ? new Date(req.query.from) : new Date(0);
        until = req.query.to ? new Date(req.query.to) : new Date();
      } else {
        const days = Math.min(90, Math.max(1, parseInt(req.query.days) || 30));
        since = new Date();
        since.setDate(since.getDate() - days);
        since.setHours(0, 0, 0, 0);
        until = new Date();
      }

      const trend = await Enrollment.aggregate([
        { $match: { enrolledAt: { $gte: since, $lte: until } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$enrolledAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", count: 1 } },
      ]);

      res.status(200).json({
        success: true,
        message: "Enrollment trend fetched successfully",
        trend,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error fetching enrollment trend",
        Error: err.message,
      });
    }
  };

const exportEnrollments = async (req, res) => {
    try {
      const enrollments = await Enrollment.find()
        .populate("course", "title category")
        .populate("student", "name email");

      const rows = [["Student Name", "Student Email", "Course", "Category", "Enrolled At"]];

      for (const entry of enrollments) {
        rows.push([
          entry.student?.name || "Unknown",
          entry.student?.email || "",
          entry.course?.title || "",
          entry.course?.category || "",
          entry.enrolledAt ? entry.enrolledAt.toISOString() : "",
        ]);
      }

      const csv = rows.map((row) => row.map(escapeCsvField).join(",")).join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=enrollments.csv");
      res.status(200).send(csv);
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error exporting enrollments",
        Error: err.message,
      });
    }
  };

const getPaymentAnalytics = async (req, res) => {
    try {
      const [summary] = await Enrollment.aggregate([
        {
          $lookup: {
            from: "courses",
            localField: "course",
            foreignField: "_id",
            as: "courseInfo",
          },
        },
        { $unwind: "$courseInfo" },
        {
          $project: {
            paymentStatus: 1,
            amountPaid: { $ifNull: ["$amountPaid", 0] },
            expectedFee: {
              $subtract: ["$courseInfo.fees", { $ifNull: ["$discountApplied", 0] }],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalExpected: { $sum: "$expectedFee" },
            totalCollected: { $sum: "$amountPaid" },
            paidCount: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] } },
            partialCount: { $sum: { $cond: [{ $eq: ["$paymentStatus", "partial"] }, 1, 0] } },
            unpaidCount: { $sum: { $cond: [{ $eq: ["$paymentStatus", "unpaid"] }, 1, 0] } },
          },
        },
      ]);

      const totalExpected = summary?.totalExpected || 0;
      const totalCollected = summary?.totalCollected || 0;

      res.status(200).json({
        success: true,
        message: "Payment summary fetched successfully",
        totalExpected,
        totalCollected,
        totalPending: totalExpected - totalCollected,
        paidCount: summary?.paidCount || 0,
        partialCount: summary?.partialCount || 0,
        unpaidCount: summary?.unpaidCount || 0,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error fetching payment summary",
        Error: err.message,
      });
    }
  };

module.exports = {
  getUserCounts,
  createUser,
  getEnrollmentTrend,
  exportEnrollments,
  getPaymentAnalytics,
};
