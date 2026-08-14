const Enrollment = require("../models/enrollment");

// True if the given user is enrolled in the given course.
const isEnrolledInCourse = async (userId, courseId) => {
  const enrollment = await Enrollment.findOne({
    student: userId,
    course: courseId,
  });
  return Boolean(enrollment);
};

module.exports = { isEnrolledInCourse };
