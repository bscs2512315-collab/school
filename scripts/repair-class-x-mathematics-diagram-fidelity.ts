import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "../lib/db";
import { uploadToCloudinary } from "../lib/storage/cloudinary";

type Question = {
  id: string;
  year: number;
  question_number: number;
  question_text: string;
  image_url: string | null;
  mcq_data: {
    options: Array<{ id: string; text: string }>;
    correctAnswer: string;
    [key: string]: unknown;
  };
};

const diagramDir = join(process.cwd(), "tmp", "pdfs", "class-x-math", "clean-diagrams");
const assets = [
  { year: 2023, questions: [20], file: "2023-p1-q20-graph.png" },
  { year: 2024, questions: [18], file: "2024-p1-q18-number-line.png" },
  { year: 2024, questions: [31, 32], file: "2024-p1-q31-q32-ladder.png" },
];

async function main() {
  const images = new Map<string, Buffer>();
  for (const asset of assets) images.set(asset.file, await readFile(join(diagramDir, asset.file)));

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('repair-class-x-mathematics-diagram-fidelity'))");
    const found = await client.query<Question>(
      `SELECT q.id, pp.year, q.question_number, q.question_text, q.image_url, q.mcq_data
         FROM questions q JOIN past_papers pp ON pp.id = q.past_paper_id
        WHERE pp.board = 'AKUEB' AND pp.class = 'X' AND pp.subject = 'Mathematics'
          AND pp.paper_number = 1 AND q.question_part IS NULL
          AND ((pp.year = 2023 AND q.question_number = 20)
            OR (pp.year = 2024 AND q.question_number IN (18, 31, 32)))
        ORDER BY pp.year, q.question_number FOR UPDATE OF q`,
    );
    if (found.rowCount !== 4) throw new Error(`Expected four target rows, got ${found.rowCount}`);

    const backupDir = join(process.cwd(), "backups", "production", "class-x-mathematics");
    await mkdir(backupDir, { recursive: true });
    await writeFile(
      join(backupDir, `diagram-fidelity-${new Date().toISOString().replace(/[:.]/g, "-")}.json`),
      JSON.stringify(found.rows, null, 2),
    );

    const urls = new Map<string, string>();
    for (const asset of assets) {
      const uploaded = await uploadToCloudinary(images.get(asset.file)!, asset.file, "questions/class-x-mathematics-reviewed");
      urls.set(asset.file, uploaded.url);
    }
    for (const asset of assets) {
      for (const number of asset.questions) {
        const row = found.rows.find((candidate) => candidate.year === asset.year && candidate.question_number === number);
        if (!row) throw new Error(`${asset.year} Q${number} missing`);
        const mcqData = structuredClone(row.mcq_data);
        const questionText = asset.year === 2024 && number === 18
          ? "The given number line is the result of"
          : row.question_text;
        if (asset.year === 2024 && number === 18) {
          const corrected: Record<string, string> = {
            A: "y &le; -5",
            B: "y > -5",
            C: "1.5 &le; y < 5",
            D: "1.5 < y &le; 5",
          };
          for (const option of mcqData.options) option.text = corrected[option.id] ?? option.text;
          mcqData.correctAnswer = "C";
        }
        await client.query(
          "UPDATE questions SET question_text = $1, mcq_data = $2::jsonb, image_url = $3, updated_at = NOW() WHERE id = $4",
          [questionText, JSON.stringify(mcqData), urls.get(asset.file), row.id],
        );
      }
    }
    await client.query("COMMIT");
    console.log(JSON.stringify({ status: "applied", questions: ["2023 Q20", "2024 Q18", "2024 Q31", "2024 Q32"], uploadedImages: urls.size }));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await db.pool.end();
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
