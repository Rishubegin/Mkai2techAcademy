const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [60, "Name must be at most 60 characters"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: "Please provide a valid email",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      validate: {
        validator: validator.isStrongPassword,
        message:
          "Password must contain uppercase, lowercase, number and special character.",
      },
      select: false,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      validate(value) {
        if (!validator.isMobilePhone(value, "en-IN")) {
          throw new Error("Invalid phone number");
        }
      },
    },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
    },
    profileImage: {
      type: String,
      validate(value) {
        if (value && !validator.isURL(value) && !value.startsWith("/uploads/")) {
          throw new Error("Invalid profile image URL: " + value);
        }
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    passwordResetToken: String, // password reset token when user forget password
    passwordResetExpires: Date,
    isPasswordVerify: {
      type: Boolean,
      default: false,
    }, // verify password before changing while user is login
    passwordVerifyExpires: Date, //
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
