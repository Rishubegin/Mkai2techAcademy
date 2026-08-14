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
  "https://mkai2tech-academy-gg6d.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

// Any local dev origin is allowed, whatever the port. A browser treats
// "localhost:5173", "127.0.0.1:5173" and "localhost:5174" (what Vite picks
// when 5173 is taken) as three different origins — pinning one of them
// means the other two get no Access-Control-Allow-Origin at all.
const isLocalOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);

app.use(
  cors({
    // No origin at all (curl, same-origin, server-to-server) is allowed too.
    origin: (origin, callback) => {
      if (!origin || isLocalOrigin(origin) || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
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
  // Scoped to /api rather than mounted globally: the static /uploads routes
  // below serve plain files (avatars, gallery, event images), and a single
  // page can pull dozens of them — counting those against the quota exhausted
  // it long before the API calls did.
  //
  // Dev gets a much larger budget because StrictMode double-invokes every
  // effect, so each page load costs twice the requests, and hot reloads
  // repeat them.
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: process.env.NODE_ENV === "production" ? 100 : 1000,
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

// One router per resource, each declaring paths relative to its mount point.
// Auth is the only one with its own sub-prefix; the rest own a distinct
// top-level noun ("/courses", "/enrollments", ...) directly under /api.
const routers = [
  ["/api/auth", require("./routes/auth")],
  ["/api", require("./routes/user")],
  ["/api", require("./routes/course")],
  ["/api", require("./routes/enrollment")],
  ["/api", require("./routes/teacher")],
  ["/api", require("./routes/contact")],
  ["/api", require("./routes/admin")],
  ["/api", require("./routes/material")],
  ["/api", require("./routes/testimonial")],
  ["/api", require("./routes/review")],
  ["/api", require("./routes/faq")],
  ["/api", require("./routes/gallery")],
  ["/api", require("./routes/event")],
  ["/api", require("./routes/notice")],
  ["/api", require("./routes/discount")],
  ["/api", require("./routes/certificate")],
  ["/api", require("./routes/enrollmentApplication")],
];

for (const [prefix, router] of routers) {
  app.use(prefix, router);
}

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
