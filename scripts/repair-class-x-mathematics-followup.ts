import "dotenv/config";
import fs from "fs";
import path from "path";
import { db } from "../lib/db";
import { uploadToCloudinary } from "../lib/storage/cloudinary";

const APPLY = process.argv.includes("--apply");
const CROP_DIR = path.resolve("tmp/pdfs/class-x-math/corrected-crops");

async function main() {
  const q20Crop = path.join(CROP_DIR, "2025-p1-q20-graph.png");
  const q27Crop = path.join(CROP_DIR, "2025-p1-q27-line-diagram.png");
  for (const file of [q20Crop, q27Crop]) if (!fs.existsSync(file)) throw new Error(`Missing crop: ${file}`);

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('repair-class-x-mathematics'))");

    const find = async (question: number) => {
      const result = await client.query(
        `SELECT q.id, q.question_text, q.mcq_data, q.image_url
           FROM questions q JOIN past_papers pp ON pp.id = q.past_paper_id
          WHERE pp.board='AKUEB' AND pp.class='X' AND pp.subject='Mathematics'
            AND pp.year=2025 AND pp.paper_number=1 AND q.question_number=$1 AND q.question_part IS NULL`,
        [question],
      );
      if (result.rowCount !== 1) throw new Error(`2025 P1 Q${question} resolved to ${result.rowCount} rows`);
      return result.rows[0];
    };

    const q20 = await find(20);
    const q27 = await find(27);
    const q30 = await find(30);
    const q35 = await find(35);
    const q20Text = "The given graph represents straight line(s)<br><br>I. 2y = −(2x + 2c)<br>II. y = −x − c<br>III. 2y = x − c";
    const q35Text = "On simplification of (sin<sup>2</sup>θ + cos<sup>2</sup>θ) / (1 + tan<sup>2</sup>θ), we get";
    const options = q30.mcq_data?.options;
    if (!Array.isArray(options)) throw new Error("2025 P1 Q30 has no MCQ options");
    const updatedOptions = options.map((option: { id: string; text: string }) =>
      option.id === "B" ? { ...option, text: "75&pi;/4 m<sup>2</sup>" } : option,
    );

    if (!APPLY) {
      await client.query("ROLLBACK");
      console.log(JSON.stringify({ mode: "dry-run", changes: ["Q20 text/image", "Q27 image", "Q30 option B", "Q35 numerator grouping"] }));
      return;
    }

    const q20Upload = await uploadToCloudinary(fs.readFileSync(q20Crop), "2025-p1-q20-graph.png", "questions/class-x-mathematics-reviewed");
    const q27Upload = await uploadToCloudinary(fs.readFileSync(q27Crop), "2025-p1-q27-line-diagram.png", "questions/class-x-mathematics-reviewed");
    await client.query("UPDATE questions SET question_text=$1, image_url=$2, updated_at=NOW() WHERE id=$3", [q20Text, q20Upload.url, q20.id]);
    await client.query("UPDATE questions SET image_url=$1, updated_at=NOW() WHERE id=$2", [q27Upload.url, q27.id]);
    await client.query("UPDATE questions SET mcq_data=jsonb_set(mcq_data, '{options}', $1::jsonb), updated_at=NOW() WHERE id=$2", [JSON.stringify(updatedOptions), q30.id]);
    await client.query("UPDATE questions SET question_text=$1, updated_at=NOW() WHERE id=$2", [q35Text, q35.id]);
    await client.query("COMMIT");
    console.log(JSON.stringify({ mode: "applied", q20Image: q20Upload.url, q27Image: q27Upload.url, q30OptionB: "75π/4 m²", q35: "grouped numerator" }));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await db.pool.end();
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
