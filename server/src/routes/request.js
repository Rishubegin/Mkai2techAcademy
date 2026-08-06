const express = require("express");

const reqRouter = express.Router();
const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const User = require("../models/user");
const bcrypt = require("bcrypt");

reqRouter.get("/users/me", userAuth, (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching user",
      err: err.message,
    });
  }
});

reqRouter.get("/users", userAuth, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find();

    if (!users) {
      throw new Error("Error finding users");
    }

    res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

reqRouter.post("/users/verify-password", userAuth, async (req, res) => {
  const { password } = req.body;
  const { _id } = req.user;

  try {
    if (!password) {
      throw new Error("Password is required");
    }

    const user = await User.findById(_id).select("+password");

    if (!user) {
      throw new Error("Invalid user");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    user.isPasswordVerify = true;
    user.passwordVerifyExpires = Date.now() + 60 * 10 * 1000;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password successfully verified",
    });
  } catch (err) {
    res.status(400).json({
      status: false,
      message: "Error verifying password",
      Error: err.message,
    });
  }
});

module.exports = reqRouter;
