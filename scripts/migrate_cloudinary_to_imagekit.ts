import "dotenv/config";
import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { getImageKitClient } from "../lib/storage/imagekit";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
});

const CHECKPOINT_FILE = path.join(__dirname, ".migration_checkpoint.json");

function loadCheckpoint(): Record<string, string> {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf-8"));
    } catch {
      return {};
    }
  }
  return {};
}

function saveCheckpoint(data: Record<string, string>) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(data, null, 2));
}

// Build index of local files
const diagramsDir = path.join(process.cwd(), "public", "diagrams");
const localFileMap = new Map<string, string>();

function scanDir(dir: string) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) scanDir(full);
    else if (e.isFile()) localFileMap.set(e.name.toLowerCase(), full);
  }
}
scanDir(diagramsDir);
console.log(`Indexed ${localFileMap.size} local diagrams from public/diagrams/`);

async function uploadAsset(oldUrl: string): Promise<string> {
  const imagekit = getImageKitClient();
  const rawFileName = path.basename(new URL(oldUrl).pathname);
  const cleanFileName = rawFileName.replace(/^\d+-/, "");

  // Check if we have the file locally
  const localCandidate =
    localFileMap.get(cleanFileName.toLowerCase()) ||
    localFileMap.get(rawFileName.toLowerCase());

  let filePayload: Buffer | string;
  if (localCandidate && fs.existsSync(localCandidate)) {
    filePayload = fs.readFileSync(localCandidate);
  } else {
    filePayload = oldUrl; // ImageKit will fetch directly from Cloudinary URL
  }

  const res = await imagekit.upload({
    file: filePayload,
    fileName: cleanFileName || "image.png",
    folder: "/exboard/questions",
    useUniqueFileName: true,
  });

  return res.url;
}

// Concurrency helper
async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  const workers = Array.from({ length: limit }, async () => {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      results[index] = await fn(items[index], index);
    }
  });

  await Promise.all(workers);
  return results;
}

async function migrateQuestions(urlMap: Map<string, string>) {
  console.log("\n--- Step 1: Migrating Questions ---");
  const { rows } = await pool.query<{ id: string; image_url: string }>(
    `SELECT id, image_url FROM questions WHERE image_url LIKE '%res.cloudinary.com%'`
  );

  console.log(`Found ${rows.length} questions in DB with Cloudinary URLs.`);
  if (rows.length === 0) return;

  // Group unique URLs
  const uniqueUrls = Array.from(new Set(rows.map((r) => r.image_url.trim())));
  console.log(`Found ${uniqueUrls.length} unique URLs to migrate.`);

  // Load checkpoint
  const checkpoint = loadCheckpoint();
  for (const [k, v] of Object.entries(checkpoint)) {
    urlMap.set(k, v);
  }
  console.log(`Resumed with ${urlMap.size} previously migrated URLs from checkpoint.`);

  const toMigrate = uniqueUrls.filter((u) => !urlMap.has(u));
  console.log(`Need to upload ${toMigrate.length} new unique assets to ImageKit.`);

  let completedUploads = 0;
  let checkpointSaveCounter = 0;

  // Upload in parallel with concurrency of 8
  await mapConcurrent(toMigrate, 8, async (oldUrl, idx) => {
    let retries = 3;
    while (retries > 0) {
      try {
        const newUrl = await uploadAsset(oldUrl);
        urlMap.set(oldUrl, newUrl);
        completedUploads++;
        checkpointSaveCounter++;

        if (checkpointSaveCounter >= 25) {
          const obj: Record<string, string> = {};
          for (const [k, v] of urlMap.entries()) obj[k] = v;
          saveCheckpoint(obj);
          checkpointSaveCounter = 0;
        }

        if (completedUploads % 50 === 0 || completedUploads === toMigrate.length) {
          console.log(
            `Upload progress: ${completedUploads}/${toMigrate.length} (${Math.round(
              (completedUploads / toMigrate.length) * 100
            )}%)`
          );
        }
        break;
      } catch (err: any) {
        retries--;
        if (retries === 0) {
          console.error(`❌ Failed to upload asset ${oldUrl}: ${err.message}`);
        } else {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }
  });

  // Final checkpoint save
  const finalObj: Record<string, string> = {};
  for (const [k, v] of urlMap.entries()) finalObj[k] = v;
  saveCheckpoint(finalObj);

  console.log(`\nUpdating ${rows.length} question rows in database...`);
  let dbUpdates = 0;
  for (let i = 0; i < rows.length; i++) {
    const q = rows[i];
    const newUrl = urlMap.get(q.image_url.trim());
    if (newUrl) {
      await pool.query(`UPDATE questions SET image_url = $1 WHERE id = $2`, [
        newUrl,
        q.id,
      ]);
      dbUpdates++;
    }
  }

  console.log(`✅ Questions updated: ${dbUpdates}/${rows.length}`);
}

async function migrateExamAttempts(urlMap: Map<string, string>) {
  console.log("\n--- Step 2: Migrating Exam Attempts ---");
  const { rows } = await pool.query<{ id: string; answers_data: any }>(
    `SELECT id, answers_data FROM exam_attempts WHERE answers_data::text LIKE '%res.cloudinary.com%'`
  );

  console.log(`Found ${rows.length} exam attempts referencing Cloudinary.`);

  for (const row of rows) {
    let rawStr =
      typeof row.answers_data === "string"
        ? row.answers_data
        : JSON.stringify(row.answers_data);

    for (const [oldUrl, newUrl] of urlMap.entries()) {
      if (rawStr.includes(oldUrl)) {
        rawStr = rawStr.split(oldUrl).join(newUrl);
      }
    }

    await pool.query(
      `UPDATE exam_attempts SET answers_data = $1::jsonb WHERE id = $2`,
      [rawStr, row.id]
    );
  }
  console.log(`✅ Exam attempts migrated.`);
}

async function migrateTeacherPapers(urlMap: Map<string, string>) {
  console.log("\n--- Step 3: Migrating Teacher Papers ---");
  const { rows } = await pool.query<{ id: string; questions_snapshot: any }>(
    `SELECT id, questions_snapshot FROM teacher_papers WHERE questions_snapshot::text LIKE '%res.cloudinary.com%'`
  );

  console.log(`Found ${rows.length} teacher papers referencing Cloudinary.`);

  for (const row of rows) {
    let rawStr =
      typeof row.questions_snapshot === "string"
        ? row.questions_snapshot
        : JSON.stringify(row.questions_snapshot);

    for (const [oldUrl, newUrl] of urlMap.entries()) {
      if (rawStr.includes(oldUrl)) {
        rawStr = rawStr.split(oldUrl).join(newUrl);
      }
    }

    await pool.query(
      `UPDATE teacher_papers SET questions_snapshot = $1::jsonb WHERE id = $2`,
      [rawStr, row.id]
    );
  }
  console.log(`✅ Teacher papers migrated.`);
}

async function main() {
  console.log("🚀 Starting Cloudinary to ImageKit Migration...");
  const startTime = Date.now();

  const urlMap = new Map<string, string>();

  await migrateQuestions(urlMap);
  await migrateExamAttempts(urlMap);
  await migrateTeacherPapers(urlMap);

  const durationSec = Math.round((Date.now() - startTime) / 1000);
  console.log(
    `\n🎉 Migration successfully finished in ${durationSec}s! Total mapped assets: ${urlMap.size}`
  );

  // Verification count
  const remaining = await pool.query(
    `SELECT COUNT(*) FROM questions WHERE image_url LIKE '%res.cloudinary.com%'`
  );
  console.log(`Remaining Cloudinary URLs in questions table: ${remaining.rows[0].count}`);

  await pool.end();
}

main().catch(async (err) => {
  console.error("Migration fatal error:", err);
  await pool.end();
  process.exit(1);
});
