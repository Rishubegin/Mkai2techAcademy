const bcrypt = require("bcrypt");
const validator = require("validator");
const User = require("../models/user");
const { uploadBuffer } = require("../utils/cloudinaryUpload");
const { getPaginationParams, buildPagination, escapeRegex } = require("../utils/pagination");

const getCurrentUser = (req, res) => {
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
};

const searchUsers = async (req, res) => {
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
};

const listUsers = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    // Searching server-side rather than filtering the loaded page keeps the
    // admin's search box working across every user, not just the current page.
    if (req.query.search?.trim()) {
      const term = escapeRegex(req.query.search.trim());
      filter.$or = [
        { name: { $regex: term, $options: "i" } },
        { email: { $regex: term, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      users,
      pagination: buildPagination({ page, limit, total }),
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

const verifyPassword = async (req, res) => {
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
};

const changePassword = async (req, res) => {
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
};

const updateProfileImage = async (req, res) => {
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
};

const uploadProfileImage = async (req, res) => {
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
  };

const verifyUser = async (req, res) => {
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
};

// Role changes are deliberately kept out of updateUser: that endpoint is also
// reachable by a user editing themselves, so allowing `role` there would let
// anyone promote themselves to admin.
const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    const ALLOWED_ROLES = ["student", "teacher", "admin"];

    if (!ALLOWED_ROLES.includes(role)) {
      throw new Error("Role must be one of: student, teacher, admin");
    }

    // An admin cannot change their own role. Besides preventing an accidental
    // self-demotion lockout, this guarantees at least one admin always
    // remains: whoever performs the last demotion still holds the role.
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { returnDocument: "after", runValidators: true },
    );

    if (!user) {
      throw new Error("User not found");
    }

    res.status(200).json({
      success: true,
      message: `Role updated to ${role}`,
      user,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error updating role",
      Error: err.message,
    });
  }
};

const getUserById = async (req, res) => {
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
};

const updateUser = async (req, res) => {
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
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      throw new Error("User id is required");
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      throw new Error("User does not exist");
    }

    res.status(200).json({
      success: true,
      message: "User Deleted Successfully",
      user,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error Deleting User",
      Error: err.message,
    });
  }
};

module.exports = {
  getCurrentUser,
  searchUsers,
  listUsers,
  verifyPassword,
  changePassword,
  updateProfileImage,
  uploadProfileImage,
  verifyUser,
  updateUserRole,
  getUserById,
  updateUser,
  deleteUser,
};
