import "dotenv/config";
import { db } from "../lib/db";

const expectedQuestionId = "8246aa1e-d6d7-4d3d-a48e-5be227ebee16";
// The source PDF has plain X/Y in the first fraction. Only the second X and
// final Y carry overlines.
const questionText = "If \\frac{X}{Y} = \\frac{a}{2} and \\bar{X} = \\frac{a}{2}, then the value of \\bar{Y} is equal to";

async function main() {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('repair-class-x-mathematics-2021-q7'))");

    const target = await client.query<{ id: string }>(
      `SELECT q.id
       FROM questions q
       JOIN past_papers pp ON pp.id = q.past_paper_id
       WHERE q.id = $1
         AND pp.board = 'AKUEB'
         AND pp.class = 'X'
         AND pp.subject = 'Mathematics'
         AND pp.year = 2021
         AND pp.paper_number = 1
         AND q.question_number = 7
         AND q.question_part IS NULL`,
      [expectedQuestionId],
    );
    if (target.rowCount !== 1) throw new Error(`Class X Mathematics 2021 P1 Q7 resolved to ${target.rowCount} rows`);

    await client.query(
      "UPDATE questions SET question_text = $1, updated_at = NOW() WHERE id = $2",
      [questionText, expectedQuestionId],
    );
    await client.query("COMMIT");
    console.log(JSON.stringify({ target: "Class X Mathematics 2021 Paper I Q7", overlines: 4, status: "applied" }));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await db.pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
