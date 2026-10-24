import "dotenv/config";
import { db } from "@/lib/db";

async function verifyDB() {
  const { rows: stats } = await db.query(`
    SELECT class, board, subject, count(*) as exercise_count, sum(page_count) as total_pages
    FROM solved_exercises
    GROUP BY class, board, subject
  `);

  console.log("📊 Solved Exercises in Database:");
  console.table(stats);

  const { rows: sample } = await db.query(`
    SELECT id, class, board, subject, chapter_number, exercise_number, title, page_count, array_length(image_urls, 1) as images_len
    FROM solved_exercises
    ORDER BY class ASC, chapter_number ASC, exercise_number ASC
    LIMIT 10
  `);

  console.log("\n🔍 Sample Ingested Exercises:");
  console.table(sample);
}

verifyDB().then(() => process.exit(0));
