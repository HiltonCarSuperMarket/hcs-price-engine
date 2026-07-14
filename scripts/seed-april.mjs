/**
 * Upsert April (+ 30 Mar) DailySummaryLog rows from screenshots.
 * Does not delete or modify logs outside the ISO dates in APRIL_SEED_LOGS.
 *
 * Usage: node scripts/seed-april.mjs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import mongoose from "mongoose";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnv() {
  const envPath = join(root, ".env");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnv();

const DailySummaryLogSchema = new mongoose.Schema(
  {
    dateStr: { type: String, required: true },
    dateIso: { type: String, required: true, unique: true },
    savedAt: { type: Date, required: true },
    units: { type: Number, required: true },
    noChange: { type: Number, required: true },
    pcUp: { type: Number, required: true },
    pcDown: { type: Number, required: true },
    prUp: { type: Number, required: true },
    prDown: { type: Number, required: true },
    issues: { type: Number, default: 0 },
    drop: { type: Number, required: true },
    increase: { type: Number, required: true },
    net: { type: Number, required: true },
  },
  { timestamps: true },
);

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI missing in .env");
  }

  const { APRIL_SEED_LOGS } = await import(
    pathToFileURL(join(root, "src/lib/seedAprilLogs.js")).href
  );

  await mongoose.connect(uri);
  const DailySummaryLog =
    mongoose.models.DailySummaryLog ||
    mongoose.model("DailySummaryLog", DailySummaryLogSchema);

  let upserted = 0;
  for (const row of APRIL_SEED_LOGS) {
    const payload = {
      ...row,
      savedAt: new Date(`${row.dateIso}T12:00:00.000Z`),
    };
    await DailySummaryLog.findOneAndUpdate(
      { dateIso: row.dateIso },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    upserted += 1;
    console.log(`upserted ${row.dateIso} (${row.dateStr})`);
  }

  const total = await DailySummaryLog.countDocuments();
  const aprilCount = await DailySummaryLog.countDocuments({
    dateIso: { $gte: "2026-03-30", $lte: "2026-04-30" },
  });

  console.log(`\nDone. Upserted ${upserted} rows.`);
  console.log(`March30–April window in DB: ${aprilCount}`);
  console.log(`Total DailySummaryLog docs: ${total}`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
