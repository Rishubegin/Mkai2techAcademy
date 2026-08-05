const Batch = require("../models/batch");

// True if the given user is enrolled in at least one batch of the given course.
const isEnrolledInCourse = async (userId, courseId) => {
  const enrolledBatch = await Batch.findOne({
    course: courseId,
    "students.student": userId,
  });
  return Boolean(enrolledBatch);
};

module.exports = { isEnrolledInCourse };
