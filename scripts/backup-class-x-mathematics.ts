import "dotenv/config";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { db } from "../lib/db";

async function main() {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const papers = await client.query(
      `SELECT * FROM past_papers
       WHERE board = 'AKUEB' AND class = 'X' AND subject = 'Mathematics'
       ORDER BY year, paper_number, id`,
    );
    const paperIds = papers.rows.map((paper) => paper.id);
    const questions = paperIds.length
      ? await client.query(
          `SELECT * FROM questions
           WHERE past_paper_id = ANY($1::uuid[])
           ORDER BY past_paper_id, question_number, question_part NULLS FIRST, id`,
          [paperIds],
        )
      : { rows: [] };
    await client.query("COMMIT");

    const payload = {
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      scope: { board: "AKUEB", class: "X", subject: "Mathematics" },
      paperCount: papers.rows.length,
      questionCount: questions.rows.length,
      papers: papers.rows,
      questions: questions.rows,
    };
    const serialized = `${JSON.stringify(payload, null, 2)}\n`;
    const digest = createHash("sha256").update(serialized).digest("hex");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputDir = path.resolve(process.cwd(), "backups/production/class-x-mathematics");
    fs.mkdirSync(outputDir, { recursive: true, mode: 0o700 });
    const outputPath = path.join(outputDir, `${stamp}.json`);
    fs.writeFileSync(outputPath, serialized, { mode: 0o600 });
    fs.writeFileSync(`${outputPath}.sha256`, `${digest}  ${path.basename(outputPath)}\n`, {
      mode: 0o600,
    });
    console.log(
      JSON.stringify({ outputPath, sha256: digest, papers: papers.rows.length, questions: questions.rows.length }),
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await db.pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
