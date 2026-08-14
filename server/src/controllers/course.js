const Course = require("../models/course");
const { uploadBuffer, deleteAsset } = require("../utils/cloudinaryUpload");

const ALLOWED_FEE_OPS = ["gte", "gt", "lte", "lt"];

// Builds a safe Mongo filter from query params (whitelisted fields/operators only)
const buildCourseFilter = (query) => {
  const filter = {};

  if (query.category) filter.category = query.category;
  if (query.mode) filter.mode = query.mode;
  if (query.instructor) filter.instructor = query.instructor;
  if (query.isFeatured !== undefined) {
    filter.isFeatured = query.isFeatured === "true";
  }

  if (query.fees && typeof query.fees === "object") {
    const feesFilter = {};
    for (const op of ALLOWED_FEE_OPS) {
      if (query.fees[op] !== undefined) {
        feesFilter[`$${op}`] = Number(query.fees[op]);
      }
    }
    if (Object.keys(feesFilter).length) filter.fees = feesFilter;
  }

  return filter;
};

const createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      mode,
      fees,
      image,
      isFeatured,
      instructor,
      syllabus,
    } = req.body;

    const course = new Course({
      title,
      description,
      category,
      mode,
      fees,
      image,
      isFeatured,
      instructor,
      syllabus,
      createdBy: req.user._id,
    });

    await course.save();

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error creating course",
      Error: err.message,
    });
  }
};

const listFeatured = async (req, res) => {
  try {
    const courses = await Course.find({ isFeatured: true }).populate(
      "instructor",
      "qualification specialization",
    );

    res.status(200).json({
      success: true,
      message: "Featured courses fetched successfully",
      courses,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching featured courses",
      Error: err.message,
    });
  }
};

const listCategories = async (req, res) => {
  try {
    const categories = await Course.distinct("category");

    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      categories,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching categories",
      Error: err.message,
    });
  }
};

const getStats = async (req, res) => {
  try {
    const [totalCourses, featuredCourses, offlineCourses, onlineCourses, hybridCourses] =
      await Promise.all([
        Course.countDocuments(),
        Course.countDocuments({ isFeatured: true }),
        Course.countDocuments({ mode: "Offline" }),
        Course.countDocuments({ mode: "Online" }),
        Course.countDocuments({ mode: "Hybrid" }),
      ]);

    res.status(200).json({
      success: true,
      message: "Course stats fetched successfully",
      totalCourses,
      featuredCourses,
      offlineCourses,
      onlineCourses,
      hybridCourses,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching course stats",
      Error: err.message,
    });
  }
};

const searchCourses = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      throw new Error("keyword query parameter is required");
    }

    const courses = await Course.find({ $text: { $search: keyword } });

    res.status(200).json({
      success: true,
      message: "Courses fetched successfully",
      courses,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error searching courses",
      Error: err.message,
    });
  }
};

const listByCategory = async (req, res) => {
  try {
    const courses = await Course.find({ category: req.params.category });

    res.status(200).json({
      success: true,
      message: "Courses fetched successfully",
      courses,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching courses by category",
      Error: err.message,
    });
  }
};

const listByInstructor = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.params.teacherId });

    res.status(200).json({
      success: true,
      message: "Courses fetched successfully",
      courses,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching courses by instructor",
      Error: err.message,
    });
  }
};

const listCourses = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const filter = buildCourseFilter(req.query);

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate("instructor", "qualification specialization")
        .skip(skip)
        .limit(limit),
      Course.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: "Courses fetched successfully",
      courses,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching courses",
      Error: err.message,
    });
  }
};

const updateFeatured = async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);

      if (!course) {
        throw new Error("Course not found");
      }

      course.isFeatured = !course.isFeatured;
      await course.save();

      res.status(200).json({
        success: true,
        message: "Course feature status toggled successfully",
        course,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error toggling feature status",
        Error: err.message,
      });
    }
  };

const updateImage = async (req, res) => {
    try {
      if (!req.file) {
        throw new Error("An image file is required");
      }

      const existing = await Course.findById(req.params.id).select("imagePublicId");
      if (!existing) {
        throw new Error("Course not found");
      }

      const uploaded = await uploadBuffer(req.file.buffer, {
        folder: "mkai2tech/courses",
      });

      const course = await Course.findByIdAndUpdate(
        req.params.id,
        { image: uploaded.secure_url, imagePublicId: uploaded.public_id },
        { returnDocument: "after", runValidators: true },
      );

      // Drop the previous upload only once the new one is safely stored.
      if (existing.imagePublicId) {
        deleteAsset(existing.imagePublicId, "image").catch(() => {});
      }

      res.status(200).json({
        success: true,
        message: "Course image updated successfully",
        course,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error updating course image",
        Error: err.message,
      });
    }
  };

const updateSyllabus = async (req, res) => {
    try {
      const { syllabus } = req.body;

      if (!Array.isArray(syllabus)) {
        throw new Error("syllabus must be an array");
      }

      const course = await Course.findByIdAndUpdate(
        req.params.id,
        { syllabus },
        { returnDocument: "after", runValidators: true },
      );

      if (!course) {
        throw new Error("Course not found");
      }

      res.status(200).json({
        success: true,
        message: "Syllabus updated successfully",
        course,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error updating syllabus",
        Error: err.message,
      });
    }
  };

const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate({
      path: "instructor",
      select: "qualification specialization bio photo user",
      populate: { path: "user", select: "name" },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    res.status(200).json({
      success: true,
      message: "Course fetched successfully",
      course,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Error fetching course",
      Error: err.message,
    });
  }
};

const updateCourse = async (req, res) => {
  try {
    const ALLOWED_UPDATES = [
      "title",
      "description",
      "category",
      "mode",
      "fees",
      "image",
      "isFeatured",
      "instructor",
      "syllabus",
      "highlights",
    ];

    const isUpdateAllowed = Object.keys(req.body).every((key) =>
      ALLOWED_UPDATES.includes(key),
    );

    if (!isUpdateAllowed) {
      throw new Error("Invalid update field");
    }

    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!course) {
      throw new Error("Course not found");
    }

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error updating course",
      Error: err.message,
    });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      throw new Error("Course not found");
    }

    // Don't leave the uploaded image orphaned in Cloudinary.
    if (course.imagePublicId) {
      deleteAsset(course.imagePublicId, "image").catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
      course,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error deleting course",
      Error: err.message,
    });
  }
};

module.exports = {
  createCourse,
  listFeatured,
  listCategories,
  getStats,
  searchCourses,
  listByCategory,
  listByInstructor,
  listCourses,
  updateFeatured,
  updateImage,
  updateSyllabus,
  getCourseById,
  updateCourse,
  deleteCourse,
};
