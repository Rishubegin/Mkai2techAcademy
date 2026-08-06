const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/user");
const { sendWelcomeEmail } = require("../services/email");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    //validation
    if (!name) {
      throw new Error("Name is required!");
    } else if (name.length < 3 || name.length > 60) {
      throw new Error("Name must be between 3 to 60 characters");
    }

    if (!email) {
      throw new Error("Email is required");
    } else if (!validator.isEmail(email)) {
      throw new Error("Email is Invalid");
    }

    if (!password) {
      throw new Error("Password is required");
    } else if (!validator.isStrongPassword(password)) {
      throw new Error("Password is not Strong Enough");
    }

    // check existing email
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new Error("Email already registerd!!!");
    }

    // Encrypting password
    const passwordHash = await bcrypt.hash(password, 10);

    // save user
    const user = new User({
      name,
      email,
      password: passwordHash,
    });

    await user.save();

    sendWelcomeEmail(user).catch((err) =>
      console.error("Failed to send welcome email:", err.message),
    );

    res.status(201).json({
      success: true,
      message: "User added successfully",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const passwordHash = user.password;

    const isPasswordValid = await bcrypt.compare(password, passwordHash);

    if (!isPasswordValid) {
      throw new Error("Invalid Credentials");
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "user logged in successfully",
      user: userResponse,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error login user",
      Error: err.message,
    });
  }
};

const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new Error("Email is required");
    }
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("User does not exist");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    console.log(resetToken);

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes;

    await user.save();

    res.status(200).json({
      success: true,
      message: "password reset token has sent to email successfully",
      resetToken,
      hashedToken,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error forgoting password",
      Error: err.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      throw new Error("Reset Token and new Password are required");
    }
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      throw new Error("Invalid or Expired Reset Token");
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    user.password = newPasswordHash;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password successfully changed",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error Resetting password",
      Error: err.message,
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
};
