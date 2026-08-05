const express = require("express");

const searchRouter = express.Router();
const User = require("../models/user");
const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

searchRouter.get("/api/users/search", userAuth, authorize("admin"), async (req, res) => {
  const query = req.query;

  try {
    if (Object.keys(query).length === 0) {
      throw new Error("Atleast One parameter is required");
    }
    const ALLOWED_QUERY = ["name", "email", "role", "isVerified", "phone"];

    const isQueryAllowed = Object.keys(query).every((key) =>
      ALLOWED_QUERY.includes(key),
    );

    if (!isQueryAllowed) {
      throw new Error("Invalid Query parameter");
    }

    if (query.isVerified !== undefined) {
      query.isVerified = query.isVerified === "true";
    }

    const users = await User.find(query);

    if (users.length === 0) {
      throw new Error("No Users found");
    }
    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching users",
      Error: err.message,
    });
  }
});

searchRouter.get("/api/users/:id", userAuth, async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) {
      throw new Error("id is required");
    }

    const user = await User.findById(id);

    if (!user) {
      throw new Error("User not found!");
    }

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error finding User",
      Error: err.message,
    });
  }
});

searchRouter.get("/api/dashboard/users/count", userAuth, authorize("admin"), async (req, res) => {
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
});

module.exports = searchRouter;
