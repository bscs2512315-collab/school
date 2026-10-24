import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "../lib/db";
import { uploadToCloudinary } from "../lib/storage/cloudinary";

const imageDir = join(process.cwd(), "tmp", "pdfs", "class-x-math", "clean-diagrams");
const assets = [
  { questions: [27, 28], file: "2021-p1-q27-q28-graph.png" },
  { questions: [30], file: "2021-p1-q30-triangle.png" },
  { questions: [31], file: "2021-p1-q31-sector.png" },
  { questions: [34], file: "2021-p1-q34-triangle.png" },
  { questions: [35], file: "2021-p1-q35-triangle.png" },
  { questions: [42], file: "2021-p1-q42-tangents.png" },
  { questions: [48], file: "2021-p1-q48-circle.png" },
];

async function main() {
  const imageBuffers = new Map<string, Buffer>();
  for (const asset of assets) imageBuffers.set(asset.file, await readFile(join(imageDir, asset.file)));

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('repair-class-x-mathematics-2021-images'))");
    const result = await client.query<{ id: string; question_number: number; image_url: string }>(
      `SELECT q.id, q.question_number, q.image_url
         FROM questions q JOIN past_papers pp ON pp.id = q.past_paper_id
        WHERE pp.board = 'AKUEB' AND pp.class = 'X' AND pp.subject = 'Mathematics'
          AND pp.year = 2021 AND pp.paper_number = 1 AND q.question_part IS NULL
          AND q.question_number = ANY($1::int[])
        ORDER BY q.question_number FOR UPDATE OF q`,
      [assets.flatMap((asset) => asset.questions)],
    );
    if (result.rowCount !== 8 || result.rows.some((row) => !row.image_url)) {
      throw new Error(`Expected 8 existing diagram assignments; found ${result.rowCount}`);
    }
    const backupDir = join(process.cwd(), "backups", "production", "class-x-mathematics");
    await mkdir(backupDir, { recursive: true });
    await writeFile(
      join(backupDir, `2021-p1-image-fidelity-${new Date().toISOString().replace(/[:.]/g, "-")}.json`),
      JSON.stringify(result.rows, null, 2),
    );

    for (const asset of assets) {
      const uploaded = await uploadToCloudinary(imageBuffers.get(asset.file)!, asset.file, "questions/class-x-mathematics-reviewed");
      for (const number of asset.questions) {
        const row = result.rows.find((candidate) => candidate.question_number === number);
        if (!row) throw new Error(`Q${number} missing`);
        await client.query(
          "UPDATE questions SET image_url = $1, updated_at = NOW() WHERE id = $2",
          [uploaded.url, row.id],
        );
      }
    }
    await client.query("COMMIT");
    console.log(JSON.stringify({ status: "applied", questions: assets.flatMap((asset) => asset.questions), uniqueImages: assets.length }));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await db.pool.end();
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
