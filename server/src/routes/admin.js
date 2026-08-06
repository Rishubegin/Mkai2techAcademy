const express = require("express");
const validator = require("validator");
const bcrypt = require("bcrypt");

const adminRouter = express.Router();
const User = require("../models/user");
const Batch = require("../models/batch");
const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

// Admin creates a user directly (student/teacher/admin), bypassing public signup
adminRouter.post("/admin/users", userAuth, authorize("admin"), async (req, res) => {
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
});

// Enrollment trend for admin analytics charts: count of enrollments per day.
// Defaults to the last `days` (default 30, max 90); pass explicit `from`/`to`
// (YYYY-MM-DD) to override with a specific date range instead.
adminRouter.get(
  "/api/admin/analytics/enrollment-trend",
  userAuth,
  authorize("admin"),
  async (req, res) => {
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

      const trend = await Batch.aggregate([
        { $unwind: "$students" },
        { $match: { "students.enrolledAt": { $gte: since, $lte: until } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$students.enrolledAt" } },
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
  },
);

// CSV export of every enrollment across all batches
const escapeCsvField = (value) => {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

adminRouter.get(
  "/api/admin/analytics/enrollments/export",
  userAuth,
  authorize("admin"),
  async (req, res) => {
    try {
      const batches = await Batch.find()
        .populate("course", "title category")
        .populate("students.student", "name email");

      const rows = [
        ["Student Name", "Student Email", "Course", "Category", "Batch", "Enrolled At"],
      ];

      for (const batch of batches) {
        for (const entry of batch.students) {
          rows.push([
            entry.student?.name || "Unknown",
            entry.student?.email || "",
            batch.course?.title || "",
            batch.course?.category || "",
            batch.batchName,
            entry.enrolledAt ? entry.enrolledAt.toISOString() : "",
          ]);
        }
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
  },
);

// Offline payment collection summary — fees are collected in person, this
// aggregates what's been recorded so admins can see collected vs. pending.
adminRouter.get(
  "/api/admin/analytics/payments",
  userAuth,
  authorize("admin"),
  async (req, res) => {
    try {
      const [summary] = await Batch.aggregate([
        { $unwind: "$students" },
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
            paymentStatus: "$students.paymentStatus",
            amountPaid: { $ifNull: ["$students.amountPaid", 0] },
            expectedFee: {
              $subtract: ["$courseInfo.fees", { $ifNull: ["$students.discountApplied", 0] }],
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
  },
);

module.exports = adminRouter;
