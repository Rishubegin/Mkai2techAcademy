const express = require("express");

const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const { documentUpload } = require("../middlewares/upload");

const materialController = require("../controllers/material");

const materialRouter = express.Router();

// Upload material (admin only)
materialRouter.post(
  "/materials",
  userAuth,
  authorize("admin"),
  documentUpload.single("file"),
  materialController.uploadMaterial,
);

// Get materials for a course (enrolled students or admin only)
materialRouter.get(
  "/materials/course/:courseId",
  userAuth,
  materialController.listByCourse,
);

// Download a material (enrolled students or admin only)
materialRouter.get(
  "/materials/:materialId/download",
  userAuth,
  materialController.downloadMaterial,
);

// Delete material (admin only)
materialRouter.delete(
  "/materials/:materialId",
  userAuth,
  authorize("admin"),
  materialController.deleteMaterial,
);

module.exports = materialRouter;
