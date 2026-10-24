import "dotenv/config";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { db } from "../lib/db";

async function main() {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const papers = await client.query(`SELECT * FROM past_papers WHERE board='AKUEB' AND class='IX' AND subject='Mathematics' ORDER BY year, paper_number, id`);
    const ids = papers.rows.map((paper) => paper.id);
    const questions = ids.length ? await client.query(`SELECT * FROM questions WHERE past_paper_id=ANY($1::uuid[]) ORDER BY past_paper_id, question_number, question_part NULLS FIRST, id`, [ids]) : { rows: [] };
    await client.query("COMMIT");
    const payload = { schemaVersion: 1, createdAt: new Date().toISOString(), scope: { board: "AKUEB", class: "IX", subject: "Mathematics" }, paperCount: papers.rows.length, questionCount: questions.rows.length, papers: papers.rows, questions: questions.rows };
    const serialized = `${JSON.stringify(payload, null, 2)}\n`;
    const digest = createHash("sha256").update(serialized).digest("hex");
    const directory = path.resolve("backups/production/class-ix-mathematics");
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    const filename = `${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    const outputPath = path.join(directory, filename);
    fs.writeFileSync(outputPath, serialized, { mode: 0o600 });
    fs.writeFileSync(`${outputPath}.sha256`, `${digest}  ${filename}\n`, { mode: 0o600 });
    console.log(JSON.stringify({ outputPath, sha256: digest, papers: papers.rows.length, questions: questions.rows.length }));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally { client.release(); await db.pool.end(); }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
