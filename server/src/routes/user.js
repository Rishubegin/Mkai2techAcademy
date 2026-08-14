const express = require("express");

const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const { imageUpload } = require("../middlewares/upload");

const userController = require("../controllers/user");

const userRouter = express.Router();

// Route order matters: every literal path ("/users/me", "/users/search",
// "/users/change-password") must be declared before the "/users/:id" forms,
// or ":id" swallows them. This file previously lived as four routers split by
// HTTP verb (request/search/update/delete), where the ordering was an accident
// of the mount order in app.js.

// ---------------------------------------------------------------- reads ----
userRouter.get("/users/me", userAuth, userController.getCurrentUser);

userRouter.get(
  "/users/search",
  userAuth,
  authorize("admin"),
  userController.searchUsers,
);

userRouter.get("/users", userAuth, authorize("admin"), userController.listUsers);

// ------------------------------------------------------------- password ----
userRouter.post("/users/verify-password", userAuth, userController.verifyPassword);

userRouter.patch("/users/change-password", userAuth, userController.changePassword);

// -------------------------------------------------------- profile image ----

// Set the profile image from an already-hosted URL.
userRouter.patch(
  "/users/:id/profile-image",
  userAuth,
  userController.updateProfileImage,
);

// Upload a profile picture file directly (as opposed to setting a URL)
userRouter.patch(
  "/users/:id/profile-image/upload",
  userAuth,
  imageUpload.single("avatar"),
  userController.uploadProfileImage,
);

// --------------------------------------------------------- admin actions ----
userRouter.patch(
  "/users/:id/verify",
  userAuth,
  authorize("admin"),
  userController.verifyUser,
);

// Promote/demote a user (admin only). Kept separate from PATCH /users/:id,
// which any user can call on themselves.
userRouter.patch(
  "/users/:id/role",
  userAuth,
  authorize("admin"),
  userController.updateUserRole,
);

// ------------------------------------------------- single-user by id (last) ----
userRouter.get("/users/:id", userAuth, userController.getUserById);

userRouter.patch("/users/:id", userAuth, userController.updateUser);

userRouter.delete(
  "/users/:id",
  userAuth,
  authorize("admin"),
  userController.deleteUser,
);

module.exports = userRouter;
