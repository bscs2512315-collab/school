import "dotenv/config";
import { db } from "../lib/db";

async function main() {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    const rows = await client.query<{ id: string; question_number: number; question_text: string }>(
      `SELECT q.id, q.question_number, q.question_text
         FROM questions q JOIN past_papers pp ON pp.id = q.past_paper_id
        WHERE pp.board = 'AKUEB' AND pp.class = 'X' AND pp.subject = 'Mathematics'
          AND pp.year = 2022 AND pp.paper_number = 1
          AND q.question_number IN (48, 49) AND q.question_part IS NULL
        ORDER BY q.question_number FOR UPDATE OF q`,
    );
    if (rows.rowCount !== 2) throw new Error(`Expected Q48 and Q49, found ${rows.rowCount}`);
    for (const row of rows.rows) {
      const cleaned = row.question_text.replace(
        /^Use the given information to answer Q\.48 and Q\.49\.<br><br>/,
        "",
      );
      if (cleaned === row.question_text || !cleaned.includes("AB = DF and ∠DOF = 60°")) {
        throw new Error(`Unexpected 2022 Q${row.question_number} source text`);
      }
      await client.query(
        "UPDATE questions SET question_text = $1, updated_at = NOW() WHERE id = $2",
        [cleaned, row.id],
      );
    }
    await client.query("COMMIT");
    console.log(JSON.stringify({ status: "applied", questions: [48, 49] }));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await db.pool.end();
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
