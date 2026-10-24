import "dotenv/config";
import { db } from "../lib/db";

async function main() {
  console.log("=== VERIFYING MATHEMATICS CLASS X MAPPING IN DB ===");
  
  const { rows: mathXDist } = await db.query(`
    SELECT q.chapter_name, COUNT(*) as count
    FROM questions q
    JOIN past_papers pp ON q.past_paper_id = pp.id
    WHERE pp.subject = 'Mathematics' AND pp.class = 'X'
    GROUP BY q.chapter_name
    ORDER BY count DESC
  `);
  console.log("Mathematics Class X Chapter Distribution:");
  console.table(mathXDist);

  const { rows: quadQuestions } = await db.query(`
    SELECT q.id, q.question_number, q.question_text, q.chapter_name, pp.year, pp.paper_number
    FROM questions q
    JOIN past_papers pp ON q.past_paper_id = pp.id
    WHERE pp.subject = 'Mathematics' AND pp.class = 'X' AND q.chapter_name = 'Quadratic Equations'
    ORDER BY pp.year, pp.paper_number, q.question_number
  `);

  console.log(`\nFound ${quadQuestions.length} questions mapped to 'Quadratic Equations':`);
  for (const q of quadQuestions) {
    console.log(`\n[${q.year} P${q.paper_number} Q${q.question_number}]`);
    console.log(`Text: ${q.question_text}`);
  }

  process.exit(0);
}

main().catch(console.error);
