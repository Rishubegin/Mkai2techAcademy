const express = require("express");

const courseRouter = express.Router();
const Course = require("../models/course");
const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

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

// Create course (admin only)
courseRouter.post("/api/courses", userAuth, authorize("admin"), async (req, res) => {
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
});

// Featured courses
courseRouter.get("/api/courses/featured", async (req, res) => {
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
});

// Distinct categories
courseRouter.get("/api/courses/categories", async (req, res) => {
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
});

// Dashboard stats
courseRouter.get("/api/courses/stats", userAuth, authorize("admin"), async (req, res) => {
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
});

// Search courses by keyword (title/description)
courseRouter.get("/api/courses/search", async (req, res) => {
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
});

// Courses by category (path param variant)
courseRouter.get("/api/courses/category/:category", async (req, res) => {
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
});

// Courses by instructor
courseRouter.get("/api/courses/instructor/:teacherId", async (req, res) => {
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
});

// List all courses (filters + pagination)
courseRouter.get("/api/courses", async (req, res) => {
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
});

// Toggle featured flag (admin only)
courseRouter.patch(
  "/api/courses/:id/feature",
  userAuth,
  authorize("admin"),
  async (req, res) => {
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
  },
);

// Update course image (admin only)
courseRouter.patch(
  "/api/courses/:id/image",
  userAuth,
  authorize("admin"),
  async (req, res) => {
    try {
      const { image } = req.body;

      if (!image) {
        throw new Error("image URL is required");
      }

      const course = await Course.findByIdAndUpdate(
        req.params.id,
        { image },
        { returnDocument: "after", runValidators: true },
      );

      if (!course) {
        throw new Error("Course not found");
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
  },
);

// Update syllabus (admin only)
courseRouter.patch(
  "/api/courses/:id/syllabus",
  userAuth,
  authorize("admin"),
  async (req, res) => {
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
  },
);

// Get single course
courseRouter.get("/api/courses/:id", async (req, res) => {
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
});

// Update course (admin only)
courseRouter.patch("/api/courses/:id", userAuth, authorize("admin"), async (req, res) => {
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
});

// Delete course (admin only)
courseRouter.delete("/api/courses/:id", userAuth, authorize("admin"), async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      throw new Error("Course not found");
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
});

module.exports = courseRouter;
