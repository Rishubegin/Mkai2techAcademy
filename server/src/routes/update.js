const express = require("express");

const updateRouter = express.Router();

const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const User = require("../models/user");
const validator = require("validator");
const { avatarUpload } = require("../middlewares/avatarUpload");
const { uploadBuffer } = require("../utils/cloudinaryUpload");

const bcrypt = require("bcrypt");

updateRouter.patch("/users/change-password", userAuth, async (req, res) => {
  const { newPassword } = req.body;
  const { _id } = req.user;

  try {
    if (!newPassword) {
      throw new Error("New Password is required");
    }

    if (!validator.isStrongPassword(newPassword)) {
      throw new Error("Password is not Strong Enough");
    }

    const user = await User.findOne({
      _id: _id,
      isPasswordVerify: true,
      passwordVerifyExpires: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      throw new Error("Verify password again");
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    user.password = newPasswordHash;
    user.isPasswordVerify = false;
    user.passwordVerifyExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password successfully changed",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error changing Password",
      Error: err.message,
    });
  }
});

updateRouter.patch("/users/:id/verify", userAuth, authorize("admin"), async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      throw new Error("User id is required");
    }
    const user = await User.findByIdAndUpdate(
      id,
      { isVerified: true },
      { returnDocument: "after" },
    );

    if (!user) {
      throw new Error("Invalid User");
    }

    res.status(200).json({
      success: true,
      message: "User successfully Verified",
      user,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error Verifying User",
      Error: err.message,
    });
  }
});

updateRouter.patch("/users/:id", userAuth, async (req, res) => {
  const { id } = req.params;
  const data = { ...req.body };

  try {
    const isSelf = req.user._id.toString() === id;
    const isAdmin = req.user.role === "admin";

    if (!isSelf && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this user",
      });
    }

    if (!data || Object.keys(data).length === 0) {
      throw new Error("Data is required");
    }

    // An empty phone string (the common case: no phone on file yet) must
    // not be passed through — the phone field's validator runs on any
    // assigned value including "", and rejects it. Leaving phone out of
    // the update entirely means "don't touch it", not "clear it".
    if (data.phone === "") {
      delete data.phone;
    }

    const ALLOWED_UPDATES = ["name", "phone"];

    const isUpdateAllowed = Object.keys(data).every((key) =>
      ALLOWED_UPDATES.includes(key),
    );

    if (!isUpdateAllowed) {
      throw new Error("Invalid update field");
    }

    const user = await User.findByIdAndUpdate(id, data, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!user) {
      throw new Error("User not found");
    }

    res.status(200).json({
      success: true,
      message: "Successfully updated User",
      user,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error updating User",
      Error: err.message,
    });
  }
});

updateRouter.patch(
  "/users/:id/profile-image",
  userAuth,
  async (req, res) => {
    const { id } = req.params;
    const { profileImage } = req.body;

    try {
      const isSelf = req.user._id.toString() === id;
      const isAdmin = req.user.role === "admin";

      if (!isSelf && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to update this user",
        });
      }

      if (!profileImage) {
        throw new Error("profileImage URL is required");
      }

      const user = await User.findByIdAndUpdate(
        id,
        { profileImage },
        { returnDocument: "after", runValidators: true },
      );

      if (!user) {
        throw new Error("User not found");
      }

      res.status(200).json({
        success: true,
        message: "Profile image updated successfully",
        user,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error updating profile image",
        Error: err.message,
      });
    }
  },
);

// Upload a profile picture file directly (as opposed to setting a URL)
updateRouter.patch(
  "/users/:id/profile-image/upload",
  userAuth,
  avatarUpload.single("avatar"),
  async (req, res) => {
    const { id } = req.params;

    try {
      const isSelf = req.user._id.toString() === id;
      const isAdmin = req.user.role === "admin";

      if (!isSelf && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to update this user",
        });
      }

      if (!req.file) {
        throw new Error("An image file is required");
      }

      const uploaded = await uploadBuffer(req.file.buffer, {
        folder: "mkai2tech/avatars",
        resourceType: "image",
      });
      const profileImage = uploaded.secure_url;

      const user = await User.findByIdAndUpdate(
        id,
        { profileImage },
        { returnDocument: "after", runValidators: true },
      );

      if (!user) {
        throw new Error("User not found");
      }

      res.status(200).json({
        success: true,
        message: "Profile picture uploaded successfully",
        user,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error uploading profile picture",
        Error: err.message,
      });
    }
  },
);

module.exports = updateRouter;
