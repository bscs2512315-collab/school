import "dotenv/config";
import fs from "fs";
import path from "path";
import { Pool } from "pg";
import axios from "axios";
import { uploadToR2 } from "../lib/storage/r2";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
});

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  // 1. Try to find the file locally in public/ to save download bandwidth
  const urlParts = url.split("/");
  const rawFileName = urlParts[urlParts.length - 1]; // e.g. 1790406959065-diagram_p4_q12.png
  const cleanFileName = rawFileName.replace(/^\d+-/, ""); // e.g. diagram_p4_q12.png

  // Search if exists in public/diagrams/
  const diagramsDir = path.join(process.cwd(), "public", "diagrams");
  if (fs.existsSync(diagramsDir)) {
    // Check if filename matches directly or in any subfolder
    const subdirs = fs.readdirSync(diagramsDir);
    for (const sub of subdirs) {
      const candidate = path.join(diagramsDir, sub, cleanFileName);
      if (fs.existsSync(candidate)) {
        return fs.readFileSync(candidate);
      }
    }
  }

  // 2. Otherwise download from Cloudinary URL
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 15000,
    });
    return Buffer.from(response.data);
  } catch (err: any) {
    console.error(`⚠️ Failed to download ${url}: ${err.message}`);
    return null;
  }
}

async function migrateQuestions(urlMap: Map<string, string>) {
  console.log("\n--- Migrating Questions ---");
  const { rows } = await pool.query<{ id: string; image_url: string }>(
    `SELECT id, image_url FROM questions WHERE image_url LIKE '%res.cloudinary.com%'`
  );

  console.log(`Found ${rows.length} questions referencing Cloudinary.`);

  let updatedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const q = rows[i];
    const oldUrl = q.image_url.trim();

    let newUrl = urlMap.get(oldUrl);

    if (!newUrl) {
      const buffer = await fetchImageBuffer(oldUrl);
      if (!buffer) {
        failedCount++;
        continue;
      }

      const fileName = path.basename(new URL(oldUrl).pathname) || `q-${q.id}.png`;
      try {
        const uploadRes = await uploadToR2(buffer, fileName, "questions");
        newUrl = uploadRes.url;
        urlMap.set(oldUrl, newUrl);
      } catch (err: any) {
        console.error(`❌ Failed to upload to R2 (${oldUrl}):`, err.message);
        failedCount++;
        continue;
      }
    }

    await pool.query(`UPDATE questions SET image_url = $1 WHERE id = $2`, [newUrl, q.id]);
    updatedCount++;

    if ((i + 1) % 50 === 0 || i === rows.length - 1) {
      console.log(`Progress: ${i + 1}/${rows.length} questions processed (${updatedCount} updated, ${failedCount} failed)`);
    }
  }

  console.log(`✅ Questions migration complete: ${updatedCount} updated, ${failedCount} failed.`);
}

async function migrateExamAttempts(urlMap: Map<string, string>) {
  console.log("\n--- Migrating Exam Attempts ---");
  const { rows } = await pool.query<{ id: string; answers_data: any }>(
    `SELECT id, answers_data FROM exam_attempts WHERE answers_data::text LIKE '%res.cloudinary.com%'`
  );

  console.log(`Found ${rows.length} exam attempts referencing Cloudinary.`);

  for (const row of rows) {
    let rawStr = typeof row.answers_data === "string" ? row.answers_data : JSON.stringify(row.answers_data);

    for (const [oldUrl, newUrl] of urlMap.entries()) {
      if (rawStr.includes(oldUrl)) {
        rawStr = rawStr.split(oldUrl).join(newUrl);
      }
    }

    await pool.query(`UPDATE exam_attempts SET answers_data = $1::jsonb WHERE id = $2`, [rawStr, row.id]);
  }
  console.log(`✅ Exam attempts migration complete.`);
}

async function migrateTeacherPapers(urlMap: Map<string, string>) {
  console.log("\n--- Migrating Teacher Papers ---");
  const { rows } = await pool.query<{ id: string; questions_snapshot: any }>(
    `SELECT id, questions_snapshot FROM teacher_papers WHERE questions_snapshot::text LIKE '%res.cloudinary.com%'`
  );

  console.log(`Found ${rows.length} teacher papers referencing Cloudinary.`);

  for (const row of rows) {
    let rawStr = typeof row.questions_snapshot === "string" ? row.questions_snapshot : JSON.stringify(row.questions_snapshot);

    for (const [oldUrl, newUrl] of urlMap.entries()) {
      if (rawStr.includes(oldUrl)) {
        rawStr = rawStr.split(oldUrl).join(newUrl);
      }
    }

    await pool.query(`UPDATE teacher_papers SET questions_snapshot = $1::jsonb WHERE id = $2`, [rawStr, row.id]);
  }
  console.log(`✅ Teacher papers migration complete.`);
}

async function main() {
  console.log("🚀 Starting Cloudinary to Cloudflare R2 Migration...");
  const startTime = Date.now();

  const urlMap = new Map<string, string>();

  await migrateQuestions(urlMap);
  await migrateExamAttempts(urlMap);
  await migrateTeacherPapers(urlMap);

  const durationSec = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n🎉 Migration successfully finished in ${durationSec}s!`);
  console.log(`Total unique assets migrated: ${urlMap.size}`);

  await pool.end();
}

main().catch(async (err) => {
  console.error("Migration fatal error:", err);
  await pool.end();
  process.exit(1);
});
