const express = require("express");

const deleteRouter = express.Router();
const User = require("../models/user");
const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

deleteRouter.delete("/users/:id", userAuth, authorize("admin"), async (req, res) => {
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
});

module.exports = deleteRouter;
