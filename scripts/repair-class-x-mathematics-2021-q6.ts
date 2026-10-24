import "dotenv/config";
import { db } from "../lib/db";

const APPLY = process.argv.includes("--apply");

const questionText = [
  "The given data, in ascending order, represents the ages of people who visited a shop in a day.",
  "9, 9, 10, 15, 17, 19, 23, 27, p, p, 32, 35, 35, 35, 37, 40, 40.",
  "The mode of the data",
].join("<br><br>");

async function main() {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('repair-class-x-mathematics'))");
    const result = await client.query(
      `SELECT q.id, q.image_url FROM questions q
       JOIN past_papers pp ON pp.id=q.past_paper_id
       WHERE pp.board='AKUEB' AND pp.class='X' AND pp.subject='Mathematics'
         AND pp.year=2021 AND pp.paper_number=1
         AND q.question_number=6 AND q.question_part IS NULL`,
    );
    if (result.rowCount !== 1) throw new Error(`2021 P1 Q6 resolved to ${result.rowCount} rows`);
    if (!APPLY) {
      await client.query("ROLLBACK");
      console.log(JSON.stringify({ mode: "dry-run", target: "2021 P1 Q6", image: "removed", sharedData: "restored" }));
      return;
    }
    await client.query(
      "UPDATE questions SET question_text=$1, image_url=NULL, updated_at=NOW() WHERE id=$2",
      [questionText, result.rows[0].id],
    );
    await client.query("COMMIT");
    console.log(JSON.stringify({ mode: "applied", target: "2021 P1 Q6", image: "none", sharedData: "restored" }));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await db.pool.end();
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
