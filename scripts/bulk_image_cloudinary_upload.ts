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
});

async function run() {
  console.log("Starting Cloudinary migration...");

  try {
    // 1. Find all questions with local image paths
    const { rows: questions } = await pool.query(
      `SELECT id, image_url FROM questions WHERE image_url LIKE '/PastPapers/%'`
    );

    console.log(`Found ${questions.length} questions with local image paths.`);

    let successCount = 0;
    let failCount = 0;
    let missingFileCount = 0;

    for (const question of questions) {
      const localRelativePath = question.image_url;
      const absolutePath = path.join(process.cwd(), "public", localRelativePath.startsWith("/") ? localRelativePath.slice(1) : localRelativePath);

      if (!fs.existsSync(absolutePath)) {
        console.warn(`[MISSING] File not found: ${absolutePath} (Question ID: ${question.id})`);
        missingFileCount++;
        continue;
      }

      try {
        // 2. Read file and upload to Cloudinary
        const fileBuffer = fs.readFileSync(absolutePath);
        const fileName = path.basename(absolutePath);
        
        // Use 'questions' as the subfolder as per the existing utility or common practice
        const result = await uploadToCloudinary(fileBuffer, fileName, "questions");

        // 3. Update database with Cloudinary URL
        await pool.query(
          "UPDATE questions SET image_url = $1 WHERE id = $2",
          [result.url, question.id]
        );

        console.log(`[SUCCESS] Migrated ${fileName} -> ${result.url}`);
        successCount++;
      } catch (uploadErr: any) {
        console.error(`[ERROR] Failed to migrate ${localRelativePath}:`, uploadErr.message);
        failCount++;
      }
    }

    console.log("\n--- Migration Summary ---");
    console.log(`Total Found:    ${questions.length}`);
    console.log(`Successfully Migrated: ${successCount}`);
    console.log(`Failed Uploads: ${failCount}`);
    console.log(`Missing Files:  ${missingFileCount}`);

  } catch (err: any) {
    console.error("Fatal error during migration:", err.message);
  } finally {
    await pool.end();
  }
}

run().catch(err => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
