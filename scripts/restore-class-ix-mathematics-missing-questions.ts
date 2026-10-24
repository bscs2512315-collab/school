import "dotenv/config";
import { db } from "../lib/db";

const APPLY = process.argv.includes("--apply");
type MissingRow = { year: number; question: number; part: string | null; text: string; marks: number; chapter: string };
const missing: MissingRow[] = [
  { year: 2023, question: 1, part: "i", marks: 1, chapter: "Sets and Functions", text: "If U = {a, e, i, o, u}, M = {a, i, u}, N = {u} and R = {e, o, u}, then represent M and N in the incomplete Venn diagram below." },
  { year: 2023, question: 1, part: "ii", marks: 1, chapter: "Sets and Functions", text: "If U = {a, e, i, o, u}, M = {a, i, u}, N = {u} and R = {e, o, u}, shade N<sup>c</sup> on the Venn diagram completed in part (i)." },
  { year: 2023, question: 1, part: "iii", marks: 1, chapter: "Sets and Functions", text: "If U = {a, e, i, o, u}, M = {a, i, u}, N = {u} and R = {e, o, u}, shade (M &cap; R)<sup>c</sup> on the Venn diagram below." },
  { year: 2025, question: 1, part: null, marks: 3, chapter: "Sets and Functions", text: "If M = {1, 2, 3, ...} and W = {0, 1, 2, ...}, then find M &cap; W." },
];

async function main() {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('restore-class-ix-mathematics-missing-questions'))");
    let inserted = 0;
    for (const item of missing) {
      const paper = await client.query<{ id: string }>(`SELECT id FROM past_papers WHERE board='AKUEB' AND class='IX' AND subject='Mathematics' AND year=$1 AND paper_number=2`, [item.year]);
      if (paper.rowCount !== 1) throw new Error(`Expected one ${item.year} Paper II row`);
      const existing = await client.query(`SELECT id FROM questions WHERE past_paper_id=$1 AND question_number=$2 AND question_part IS NOT DISTINCT FROM $3`, [paper.rows[0].id, item.question, item.part]);
      if (existing.rowCount) continue;
      if (APPLY) {
        await client.query(`INSERT INTO questions (past_paper_id, question_number, question_part, question_text, question_type, chapter_name, marks, ai_confidence, is_verified, paper_ii_data)
          VALUES ($1,$2,$3,$4,'CRQ',$5,$6,1,true,$7::jsonb)`, [paper.rows[0].id, item.question, item.part, item.text, item.chapter, item.marks, JSON.stringify({ botApproved: false, markingNotes: "Restored from the official AKUEB paper during source audit." })]);
      }
      inserted++;
    }
    if (APPLY) await client.query("COMMIT"); else await client.query("ROLLBACK");
    console.log(JSON.stringify({ mode: APPLY ? "applied" : "dry-run", restored: inserted }));
  } catch (error) { await client.query("ROLLBACK").catch(() => undefined); throw error; }
  finally { client.release(); await db.pool.end(); }
}
main().catch((error) => { console.error(error); process.exit(1); });
