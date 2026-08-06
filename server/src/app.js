require("dotenv").config();

const express = require("express");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");

const app = express();
const sanitizeBody = require("./middlewares/sanitize");

// Security middleware (first). crossOriginResourcePolicy is relaxed to
// "cross-origin" because the client (Vite on :5173) loads uploaded images
// (avatars) directly from this API's origin (:7777) — helmet's default
// "same-origin" policy would silently block those <img> loads.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

const allowedOrigins = [
  "http://localhost:5173",
  "https://mkai2tech-academy-gg6d.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Rate limiting is skipped under test: express-rate-limit's MemoryStore
// keeps a background interval alive (which stops Jest from exiting cleanly),
// and the strict per-IP auth limit would throttle the test suite's own
// repeated login calls.
if (process.env.NODE_ENV !== "test") {
  // Global rate limiter
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Stricter limiter for auth endpoints (brute-force protection)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many attempts, please try again later",
    },
  });
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/auth/forgot-password", authLimiter);
}

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(sanitizeBody);

// Publicly servable uploaded assets (avatars only — course materials are
// deliberately NOT served statically; they're gated behind an auth+
// enrollment check in routes/material.js instead).
app.use(
  "/uploads/avatars",
  express.static(path.join(__dirname, "..", "uploads", "avatars")),
);
app.use(
  "/uploads/gallery",
  express.static(path.join(__dirname, "..", "uploads", "gallery")),
);
app.use(
  "/uploads/events",
  express.static(path.join(__dirname, "..", "uploads", "events")),
);

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is healthy" });
});

const authRouter = require("./routes/auth");
const deleteRouter = require("./routes/delete");
const reqRouter = require("./routes/request");
const searchRouter = require("./routes/search");
const updateRouter = require("./routes/update");
const courseRouter = require("./routes/course");
const teacherRouter = require("./routes/teacher");
const batchRouter = require("./routes/batch");
const contactRouter = require("./routes/contact");
const adminRouter = require("./routes/admin");
const materialRouter = require("./routes/material");
const testimonialRouter = require("./routes/testimonial");
const reviewRouter = require("./routes/review");
const faqRouter = require("./routes/faq");
const galleryRouter = require("./routes/gallery");
const eventRouter = require("./routes/event");
const noticeRouter = require("./routes/notice");
const discountRouter = require("./routes/discount");
const certificateRouter = require("./routes/certificate");
const enrollmentApplicationRouter = require("./routes/enrollmentApplication");

app.use("/api/auth", authRouter);
app.use("/api", deleteRouter);
app.use("/api", reqRouter);
app.use("/api", searchRouter);
app.use("/api", updateRouter);
app.use("/api", courseRouter);
app.use("/api", teacherRouter);
app.use("/api", batchRouter);
app.use("/api/contact", contactRouter);
app.use("/api/admin", adminRouter);
app.use("/api", materialRouter);
app.use("/api", testimonialRouter);
app.use("/api", reviewRouter);
app.use("/api", faqRouter);
app.use("/api", galleryRouter);
app.use("/api", eventRouter);
app.use("/api", noticeRouter);
app.use("/api", discountRouter);
app.use("/api", certificateRouter);
app.use("/api", enrollmentApplicationRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Error handler (last)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    statusCode,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

module.exports = app;
