const express = require("express");

const userAuth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

const courseController = require("../controllers/course");

const courseRouter = express.Router();

// Create course (admin only)
courseRouter.post(
  "/courses",
  userAuth,
  authorize("admin"),
  courseController.createCourse,
);

// Featured courses
courseRouter.get("/courses/featured", courseController.listFeatured);

// Distinct categories
courseRouter.get("/courses/categories", courseController.listCategories);

// Dashboard stats
courseRouter.get(
  "/courses/stats",
  userAuth,
  authorize("admin"),
  courseController.getStats,
);

// Search courses by keyword (title/description)
courseRouter.get("/courses/search", courseController.searchCourses);

// Courses by category (path param variant)
courseRouter.get("/courses/category/:category", courseController.listByCategory);

// Courses by instructor
courseRouter.get("/courses/instructor/:teacherId", courseController.listByInstructor);

// List all courses (filters + pagination)
courseRouter.get("/courses", courseController.listCourses);

// Toggle featured flag (admin only)
courseRouter.patch(
  "/courses/:id/feature",
  userAuth,
  authorize("admin"),
  courseController.updateFeatured,
);

// Update course image (admin only)
courseRouter.patch(
  "/courses/:id/image",
  userAuth,
  authorize("admin"),
  courseController.updateImage,
);

// Update syllabus (admin only)
courseRouter.patch(
  "/courses/:id/syllabus",
  userAuth,
  authorize("admin"),
  courseController.updateSyllabus,
);

// Get single course
courseRouter.get("/courses/:id", courseController.getCourseById);

// Update course (admin only)
courseRouter.patch(
  "/courses/:id",
  userAuth,
  authorize("admin"),
  courseController.updateCourse,
);

// Delete course (admin only)
courseRouter.delete(
  "/courses/:id",
  userAuth,
  authorize("admin"),
  courseController.deleteCourse,
);

module.exports = courseRouter;
