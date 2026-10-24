import "dotenv/config";
import { db } from "../lib/db";
import { classifyMathQuestion } from "./test_math_classification";

async function main() {
  const { rows: xiQuestions } = await db.query(`
    SELECT q.id, q.question_number, q.question_text, pp.year, pp.paper_number
    FROM questions q
    JOIN past_papers pp ON q.past_paper_id = pp.id
    WHERE pp.class = 'XI' AND pp.subject = 'Mathematics'
    ORDER BY pp.year, pp.paper_number, q.question_number
  `);

  console.log(`\n=== ALL MATHEMATICS XI CLASSIFIED AS CHAPTER 1 ===`);
  const c1 = xiQuestions.filter(q => classifyMathQuestion('Mathematics', 'XI', q.question_text) === 1);
  console.log(`Total in Chapter 1: ${c1.length}`);
  for (let i = 0; i < Math.min(c1.length, 30); i++) {
    const q = c1[i];
    console.log(`[${q.year} P${q.paper_number} Q${q.question_number}] ${q.question_text.replace(/\n/g, ' ').slice(0, 110)}`);
  }

  process.exit(0);
}

main().catch(console.error);
