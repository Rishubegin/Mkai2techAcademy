require("dotenv").config();

const mongoose = require("mongoose");

// Redirect to an isolated database on the same cluster so tests never touch
// real data. Must happen before app.js (and its models/connectDB) are required.
const baseUri = process.env.MONGO_URI;
if (baseUri && !/_test(\?|$)/.test(baseUri)) {
  process.env.MONGO_URI = baseUri.replace(/\/([^/?]+)(\?|$)/, "/$1_test$2");
}

const bcrypt = require("bcrypt");
const request = require("supertest");

const app = require("../src/app");
const connectDB = require("../src/config/database");
const User = require("../src/models/user");
const Enrollment = require("../src/models/enrollment");

const connectTestDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }
};

const disconnectTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
};

const clearCollections = async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};

// Creates a user directly in the DB with a given role (bypassing public
// signup, which always defaults to "student"), then logs in via the real
// endpoint to obtain a valid session cookie for authenticated requests.
const createUserAndLogin = async ({
  name = "Test User",
  email,
  password = "StrongPass123!",
  role = "student",
} = {}) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: passwordHash,
    role,
    isVerified: true,
  });

  const loginRes = await request(app).post("/api/auth/login").send({ email, password });

  return { user, cookie: loginRes.headers["set-cookie"] };
};

// Enrollment happens through the enrollment-application flow in the app, so
// there's no plain "enroll" endpoint to call from a test. Setting the record
// up directly keeps these tests focused on what they actually assert.
const enrollStudent = (studentId, courseId) =>
  Enrollment.create({ student: studentId, course: courseId });

module.exports = {
  app,
  enrollStudent,
  connectTestDB,
  disconnectTestDB,
  clearCollections,
  createUserAndLogin,
};
