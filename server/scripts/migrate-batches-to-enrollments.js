/**
 * One-time migration: batches -> enrollments.
 *
 * Enrollment used to live inside batch.students[]. This lifts each of those
 * subdocuments into the standalone Enrollment collection, keyed by
 * {student, course} instead of {student, batch}.
 *
 * A student could sit in two batches of the same course, which the new unique
 * index forbids — those are merged, keeping the earliest enrolledAt and the
 * furthest progress/payment.
 *
 * Run with --dry to preview without writing:
 *   node scripts/migrate-batches-to-enrollments.js --dry
 */
require("dotenv").config();
const mongoose = require("mongoose");

require("../src/models/user");
require("../src/models/course");
const Batch = require("../src/models/batch");
const Enrollment = require("../src/models/enrollment");
const EnrollmentApplication = require("../src/models/enrollmentApplication");
const Certificate = require("../src/models/certificate");

const DRY = process.argv.includes("--dry");

const paymentRank = { unpaid: 0, partial: 1, paid: 2 };

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(DRY ? "DRY RUN — no writes\n" : "APPLYING migration\n");

  const batches = await Batch.find().lean();

  // Collapse batch.students[] into one record per {student, course}.
  const merged = new Map();
  for (const batch of batches) {
    for (const entry of batch.students || []) {
      const key = `${entry.student}_${batch.course}`;
      const existing = merged.get(key);
      const candidate = {
        student: entry.student,
        course: batch.course,
        enrolledAt: entry.enrolledAt,
        paymentStatus: entry.paymentStatus || "unpaid",
        amountPaid: entry.amountPaid || 0,
        discountApplied: entry.discountApplied || 0,
        discountCode: entry.discountCode,
        paymentNotes: entry.paymentNotes,
        progressPercent: entry.progressPercent || 0,
        completedAt: entry.completedAt,
      };

      if (!existing) {
        merged.set(key, candidate);
        continue;
      }

      console.log(`  merging duplicate enrollment for student ${entry.student}`);
      existing.enrolledAt = new Date(
        Math.min(new Date(existing.enrolledAt), new Date(candidate.enrolledAt)),
      );
      existing.progressPercent = Math.max(existing.progressPercent, candidate.progressPercent);
      existing.amountPaid = Math.max(existing.amountPaid, candidate.amountPaid);
      if (paymentRank[candidate.paymentStatus] > paymentRank[existing.paymentStatus]) {
        existing.paymentStatus = candidate.paymentStatus;
      }
      existing.completedAt = existing.completedAt || candidate.completedAt;
    }
  }

  const records = [...merged.values()];
  console.log(`batches read:        ${batches.length}`);
  console.log(`enrollments to write: ${records.length}`);

  if (!DRY) {
    for (const record of records) {
      await Enrollment.updateOne(
        { student: record.student, course: record.course },
        { $setOnInsert: record },
        { upsert: true },
      );
    }
  }

  // Applications and certificates already carry `course`; backfill it from the
  // batch for any legacy row that somehow lacks one, then drop the batch ref.
  const batchCourse = new Map(batches.map((b) => [String(b._id), b.course]));

  for (const [label, Model] of [
    ["applications", EnrollmentApplication],
    ["certificates", Certificate],
  ]) {
    const rows = await Model.find().lean();
    let fixed = 0;
    for (const row of rows) {
      const course = row.course || batchCourse.get(String(row.batch));
      if (!course) {
        console.log(`  WARNING: ${label} ${row._id} has no course and no resolvable batch`);
        continue;
      }
      if (!DRY) {
        await Model.updateOne({ _id: row._id }, { $set: { course }, $unset: { batch: "" } });
      }
      fixed += 1;
    }
    console.log(`${label} repointed:  ${fixed}`);
  }

  await mongoose.disconnect();
  console.log(DRY ? "\nDry run complete." : "\nMigration complete.");
};

run().catch(async (err) => {
  console.error("Migration failed:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
