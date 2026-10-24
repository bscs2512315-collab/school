import "dotenv/config";
import fs from "fs";
import path from "path";
import { db } from "../lib/db";
import { uploadToCloudinary } from "../lib/storage/cloudinary";

const APPLY = process.argv.includes("--apply");
const CROP_DIR = path.resolve("tmp/pdfs/class-x-math/corrected-crops");

const assets = [
  { year: 2021, questions: [1, 2], file: "2021-p1-q1-q2-table.png" },
  { year: 2021, questions: [27, 28], file: "2021-p1-q27-q28-graph.png" },
  { year: 2021, questions: [43, 44], file: "2021-p1-q43-q44-circle.png" },
  { year: 2022, questions: [48, 49], file: "2022-p1-q48-q49-circle.png" },
];

const textUpdates = new Map<string, string>([
  ["2022:48", "The given diagram shows a circle having centre at point O. It is also given that AB = DF and ∠DOF = 60°.<br><br>The measurement of ∠ACB is"],
  ["2022:49", "The given diagram shows a circle having centre at point O. It is also given that AB = DF and ∠DOF = 60°.<br><br>The measurement of ∠AOF is"],
]);

async function main() {
  for (const asset of assets) {
    if (!fs.existsSync(path.join(CROP_DIR, asset.file))) throw new Error(`Missing crop: ${asset.file}`);
  }
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('repair-class-x-mathematics'))");
    const targets = assets.flatMap((asset) => asset.questions.map((question) => ({ year: asset.year, question })));
    for (const target of targets) {
      const check = await client.query(
        `SELECT q.id FROM questions q JOIN past_papers pp ON pp.id=q.past_paper_id
         WHERE pp.board='AKUEB' AND pp.class='X' AND pp.subject='Mathematics'
           AND pp.year=$1 AND pp.paper_number=1 AND q.question_number=$2 AND q.question_part IS NULL`,
        [target.year, target.question],
      );
      if (check.rowCount !== 1) throw new Error(`${target.year} P1 Q${target.question} resolved to ${check.rowCount} rows`);
    }
    if (!APPLY) {
      await client.query("ROLLBACK");
      console.log(JSON.stringify({ mode: "dry-run", imageAssignments: targets.length, textUpdates: textUpdates.size }));
      return;
    }
    for (const asset of assets) {
      const upload = await uploadToCloudinary(fs.readFileSync(path.join(CROP_DIR, asset.file)), asset.file, "questions/class-x-mathematics-reviewed");
      for (const question of asset.questions) {
        const text = textUpdates.get(`${asset.year}:${question}`);
        await client.query(
          text
            ? `UPDATE questions q SET image_url=$1, question_text=$2, updated_at=NOW()
                 FROM past_papers pp WHERE q.past_paper_id=pp.id AND pp.board='AKUEB' AND pp.class='X' AND pp.subject='Mathematics' AND pp.year=$3 AND pp.paper_number=1 AND q.question_number=$4`
            : `UPDATE questions q SET image_url=$1, updated_at=NOW()
                 FROM past_papers pp WHERE q.past_paper_id=pp.id AND pp.board='AKUEB' AND pp.class='X' AND pp.subject='Mathematics' AND pp.year=$2 AND pp.paper_number=1 AND q.question_number=$3`,
          text ? [upload.url, text, asset.year, question] : [upload.url, asset.year, question],
        );
      }
    }
    await client.query("COMMIT");
    console.log(JSON.stringify({ mode: "applied", imageAssignments: targets.length, textUpdates: textUpdates.size }));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await db.pool.end();
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
