// One-off backfill for the demo data seed.js already created in this DB.
// seed.js refuses to run a second time once courses exist, so the course
// and testimonial `image`/`photo` fields added to it after the initial
// seed never reached this database. This applies the same URLs directly.
// Safe to re-run — every update is keyed by title/name and idempotent.
//
// Usage: node scripts/backfillDemoImages.js   (from the server/ directory)

require("dotenv").config();
const mongoose = require("mongoose");

const Course = require("../src/models/course");
const Testimonial = require("../src/models/testimonial");

const courseImages = {
  "NEET Foundation & Crash Course":
    "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=600&fit=crop",
  "IIT-JEE Complete Program":
    "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=600&fit=crop",
  "MERN Stack Development":
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop",
  "Python Programming - Basics to Advanced":
    "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&h=600&fit=crop",
  "ADCA - Advanced Diploma in Computer Applications":
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop",
  "Digital Marketing Mastery":
    "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&h=600&fit=crop",
};

const testimonialPhotos = {
  Rishabh: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
  Abhishek: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop",
  Ashutosh: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop",
};

async function backfill() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to", mongoose.connection.name);

  let coursesUpdated = 0;
  for (const [title, image] of Object.entries(courseImages)) {
    const result = await Course.updateOne(
      { title, $or: [{ image: { $exists: false } }, { image: "" }] },
      { $set: { image } },
    );
    coursesUpdated += result.modifiedCount;
  }
  console.log(`Updated ${coursesUpdated} course(s) with a demo image`);

  let testimonialsUpdated = 0;
  for (const [name, photo] of Object.entries(testimonialPhotos)) {
    const result = await Testimonial.updateOne(
      { name, $or: [{ photo: { $exists: false } }, { photo: "" }] },
      { $set: { photo } },
    );
    testimonialsUpdated += result.modifiedCount;
  }
  console.log(`Updated ${testimonialsUpdated} testimonial(s) with a demo photo`);

  await mongoose.disconnect();
  console.log("Backfill complete.");
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
