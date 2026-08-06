const path = require("path");
const Material = require("../models/material");
const { uploadBuffer, deleteAsset } = require("../utils/cloudinaryUpload");
const { isEnrolledInCourse } = require("../utils/enrollment");

// A student can access a course's materials only if enrolled in at least one
// of its batches; admins can always access.
const canAccessCourseMaterials = async (user, courseId) => {
  if (user.role === "admin") return true;
  return isEnrolledInCourse(user._id, courseId);
};

const uploadMaterial = async (req, res) => {
    try {
      const { courseId, title, module } = req.body;

      if (!req.file) {
        throw new Error("A file is required");
      }
      if (!courseId || !title) {
        throw new Error("courseId and title are required");
      }

      const uploaded = await uploadBuffer(req.file.buffer, {
        folder: "mkai2tech/materials",
        resourceType: "raw",
      });

      const material = new Material({
        course: courseId,
        title,
        module,
        storedFileName: uploaded.public_id,
        fileUrl: uploaded.secure_url,
        originalFileName: req.file.originalname,
        fileType: path.extname(req.file.originalname).slice(1),
        fileSize: req.file.size,
        uploadedBy: req.user._id,
      });

      await material.save();

      res.status(201).json({
        success: true,
        message: "Material uploaded successfully",
        material,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error uploading material",
        Error: err.message,
      });
    }
  };

const listByCourse = async (req, res) => {
  try {
    const allowed = await canAccessCourseMaterials(req.user, req.params.courseId);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in this course to view its materials",
      });
    }

    const materials = await Material.find({ course: req.params.courseId }).select(
      "-storedFileName -fileUrl",
    );

    res.status(200).json({
      success: true,
      message: "Materials fetched successfully",
      materials,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching materials",
      Error: err.message,
    });
  }
};

const downloadMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.materialId);

    if (!material) {
      throw new Error("Material not found");
    }

    const allowed = await canAccessCourseMaterials(req.user, material.course);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in this course to download its materials",
      });
    }

    const cloudinaryRes = await fetch(material.fileUrl);

    if (!cloudinaryRes.ok) {
      return res.status(404).json({
        success: false,
        message: "File is missing from storage",
      });
    }

    res.setHeader("Content-Disposition", `attachment; filename="${material.originalFileName}"`);
    res.setHeader(
      "Content-Type",
      cloudinaryRes.headers.get("content-type") || "application/octet-stream",
    );
    res.send(Buffer.from(await cloudinaryRes.arrayBuffer()));
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error downloading material",
      Error: err.message,
    });
  }
};

const deleteMaterial = async (req, res) => {
    try {
      const material = await Material.findByIdAndDelete(req.params.materialId);

      if (!material) {
        throw new Error("Material not found");
      }

      await deleteAsset(material.storedFileName, "raw");

      res.status(200).json({
        success: true,
        message: "Material deleted successfully",
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error deleting material",
        Error: err.message,
      });
    }
  };

module.exports = {
  uploadMaterial,
  listByCourse,
  downloadMaterial,
  deleteMaterial,
};
