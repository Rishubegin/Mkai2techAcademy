/**
 * One-time cleanup: drop indexes left behind by the batches -> enrollments move.
 *
 * Removing `batch` from the schemas dropped the field from new documents, and
 * migrate-batches-to-enrollments.js $unset it from the old ones — but Mongoose
 * only ever creates indexes, it never drops the ones a schema no longer
 * declares. So {student, batch} unique indexes stayed behind on collections
 * whose documents no longer have a `batch` at all.
 *
 * A missing field indexes as null, so every document now collides on
 * `batch: null` and the index enforces "one document per student, ever" —
 * across all courses. That surfaces as:
 *
 *   E11000 duplicate key error ... index: student_1_batch_1
 *   dup key: { student: ObjectId('...'), batch: null }
 *
 * ...the moment a student has a second enrolment form (or certificate). The
 * correct {student, course} unique indexes are already in place and stay.
 *
 * Run with --dry to preview without writing:
 *   node scripts/drop-stale-batch-indexes.js --dry
 */
require("dotenv").config();
const mongoose = require("mongoose");

const DRY = process.argv.includes("--dry");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(DRY ? "DRY RUN — no writes" : "APPLYING cleanup");
  console.log(`database: ${mongoose.connection.name}\n`);

  const collections = await mongoose.connection.db.listCollections().toArray();
  let dropped = 0;

  for (const { name } of collections) {
    const collection = mongoose.connection.db.collection(name);
    const indexes = await collection.indexes();

    // Anything keyed on a field the schemas no longer define.
    const stale = indexes.filter((index) => Object.keys(index.key).includes("batch"));
    if (stale.length === 0) continue;

    for (const index of stale) {
      console.log(`${name}: ${index.name} ${JSON.stringify(index.key)}`);

      if (!DRY) {
        await collection.dropIndex(index.name);
        console.log("  dropped");
      }
      dropped += 1;
    }
  }

  console.log(
    dropped === 0
      ? "\nNo stale batch indexes found — nothing to do."
      : `\n${dropped} stale index(es) ${DRY ? "would be dropped" : "dropped"}.`,
  );

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
