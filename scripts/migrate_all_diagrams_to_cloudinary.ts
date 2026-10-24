import "dotenv/config";
import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { uploadToCloudinary } from "../lib/storage/cloudinary";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
});

async function main() {
  console.log("☁️  Starting Full Cloudinary Migration for Past Paper Diagrams...\n");

  const startTime = Date.now();

  // 1. Fetch all questions with local paths
  const { rows: questions } = await pool.query<{
    id: string;
    image_url: string;
    question_number: number;
    past_paper_id: string;
  }>(
    `SELECT id, image_url, question_number, past_paper_id 
     FROM questions 
     WHERE image_url LIKE '/diagrams/%' OR image_url LIKE '/PastPapers/%' OR image_url LIKE 'diagrams/%' OR image_url LIKE 'PastPapers/%'
     ORDER BY past_paper_id, question_number`
  );

  console.log(`📋 Found ${questions.length} questions with local image paths to migrate.\n`);

  if (questions.length === 0) {
    console.log("✅ No local images found to migrate.");
    await pool.end();
    return;
  }

  // Deduplication cache: normalized relative path -> Cloudinary URL
  const uploadedUrlCache = new Map<string, string>();
  let uploadedCount = 0;
  let cacheHitCount = 0;
  let missingCount = 0;
  let failedCount = 0;
  let dbUpdatedCount = 0;

  // Concurrency worker queue
  const CONCURRENCY = 12;
  let cursor = 0;

  async function processQuestion(q: typeof questions[0]) {
    const rawPath = q.image_url.trim();
    const cleanRelative = rawPath.startsWith("/") ? rawPath.slice(1) : rawPath;
    const absolutePath = path.join(process.cwd(), "public", cleanRelative);

    // Check cache first
    let cloudinaryUrl = uploadedUrlCache.get(cleanRelative);

    if (!cloudinaryUrl) {
      if (!fs.existsSync(absolutePath)) {
        console.warn(`⚠️ [MISSING FILE] ${absolutePath} (Question ID: ${q.id})`);
        missingCount++;
        return;
      }

      try {
        const fileBuffer = fs.readFileSync(absolutePath);
        const fileName = path.basename(absolutePath);
        const res = await uploadToCloudinary(fileBuffer, fileName, "questions");
        cloudinaryUrl = res.url;
        uploadedUrlCache.set(cleanRelative, cloudinaryUrl);
        uploadedCount++;
      } catch (uploadErr: any) {
        console.error(`❌ [UPLOAD ERROR] ${cleanRelative}:`, uploadErr.message);
        failedCount++;
        return;
      }
    } else {
      cacheHitCount++;
    }

    // Update Question in Database
    try {
      await pool.query(
        "UPDATE questions SET image_url = $1, updated_at = NOW() WHERE id = $2",
        [cloudinaryUrl, q.id]
      );
      dbUpdatedCount++;
    } catch (dbErr: any) {
      console.error(`❌ [DB UPDATE ERROR] Question ${q.id}:`, dbErr.message);
    }
  }

  // Run workers
  const total = questions.length;
  let completed = 0;

  async function worker() {
    while (cursor < total) {
      const index = cursor++;
      const q = questions[index];
      await processQuestion(q);
      completed++;
      if (completed % 50 === 0 || completed === total) {
        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(
          `[Progress] ${completed}/${total} processed (${((completed / total) * 100).toFixed(0)}%) | Uploaded: ${uploadedCount} | Cache Hits: ${cacheHitCount} | DB Updated: ${dbUpdatedCount} | Missing: ${missingCount} | Errors: ${failedCount} (${elapsedSec}s)`
        );
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n=======================================================");
  console.log("🎉 CLOUDINARY MIGRATION COMPLETE!");
  console.log(`⏱️ Duration:           ${durationSec}s`);
  console.log(`📋 Questions Processed: ${total}`);
  console.log(`☁️ Uploaded to Cloud:   ${uploadedCount}`);
  console.log(`🔁 Deduplicated (Hits): ${cacheHitCount}`);
  console.log(`💾 DB Rows Updated:    ${dbUpdatedCount}`);
  console.log(`⚠️ Missing Local Files: ${missingCount}`);
  console.log(`❌ Upload Errors:       ${failedCount}`);
  console.log("=======================================================\n");

  await pool.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
