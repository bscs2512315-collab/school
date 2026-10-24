/**
 * scripts/migrate-cognitive-levels.ts
 *
 * Normalizes all legacy cognitive levels in PostgreSQL `chapters` table to the official standard:
 * - 'K' / 'Knowledge' -> 'R' (Remember)
 * - 'CA' / 'Classroom Activity' -> 'FA' (Formative Assessment)
 * - 'Ap', 'An', 'E', 'C' -> 'A' (Application and beyond)
 * - 'U' / 'Understanding' -> 'U' (Understand)
 *
 * Usage:
 *   npx tsx scripts/migrate-cognitive-levels.ts
 */

import "dotenv/config";
import { db } from "@/lib/db";
import { normalizeCognitiveLevel } from "@/lib/ai/syllabus-extract";

async function main() {
  console.log("🔄 Starting Cognitive Level normalization in database...");

  const { rows } = await db.query(`
    SELECT id, chapter_name, analyzed_content
    FROM chapters
    WHERE analyzed_content IS NOT NULL
  `);

  console.log(`Found ${rows.length} chapters to inspect and normalize.`);

  let updatedChapters = 0;
  let totalSlosUpdated = 0;

  for (const row of rows) {
    const content = row.analyzed_content;
    if (!content || !Array.isArray(content.subtopics)) continue;

    let modified = false;

    for (const subtopic of content.subtopics) {
      if (!Array.isArray(subtopic.slos)) continue;

      for (const slo of subtopic.slos) {
        const original = slo.cognitiveLevel;
        const normalized = normalizeCognitiveLevel(original);

        if (original !== normalized) {
          slo.cognitiveLevel = normalized;
          modified = true;
          totalSlosUpdated++;
        }
      }
    }

    if (modified) {
      await db.query(
        `UPDATE chapters SET analyzed_content = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(content), row.id],
      );
      updatedChapters++;
    }
  }

  console.log(`\n======================================================`);
  console.log(`✅ Normalized ${totalSlosUpdated} SLOs across ${updatedChapters} chapters!`);
  console.log(`======================================================\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
