import "dotenv/config";
import fs from "fs";
import path from "path";
import { db } from "../lib/db";

async function main() {
  const { rows } = await db.query(
    `SELECT pp.id AS paper_id, pp.year, pp.paper_number,
            q.id, q.question_number, q.question_part, q.question_text,
            q.mcq_data, q.image_url
       FROM questions q
       JOIN past_papers pp ON pp.id = q.past_paper_id
      WHERE pp.board = 'AKUEB' AND pp.class = 'X' AND pp.subject = 'Mathematics'
      ORDER BY pp.year, pp.paper_number, q.question_number,
               q.question_part NULLS FIRST, q.id`,
  );

  const outputPath = path.resolve("tmp/pdfs/class-x-math/database-inventory.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(rows, null, 2)}\n`);

  for (const row of rows) {
    if (!row.image_url) continue;
    console.log(
      `${row.year} P${row.paper_number} Q${row.question_number}${row.question_part ? `(${row.question_part})` : ""}\t${row.image_url ?? "-"}\t${row.question_text.replace(/\s+/g, " ").slice(0, 130)}`,
    );
  }
  console.error(`Wrote ${rows.length} rows to ${outputPath}`);
  await db.pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await db.pool.end().catch(() => undefined);
  process.exit(1);
});
