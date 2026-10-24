import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkMathImages() {
  const res = await pool.query(`
    SELECT q.id, q.question_number, pp.subject, pp.class, pp.year, q.question_text, q.image_url
    FROM questions q
    JOIN past_papers pp ON q.past_paper_id = pp.id
    WHERE pp.subject = 'Mathematics' AND pp.class = 'X' AND q.image_url IS NOT NULL
    ORDER BY pp.year, q.question_number
  `);
  console.log(`Found ${res.rows.length} questions with image_url in Mathematics Class X:`);
  res.rows.forEach(r => {
    console.log(`[${r.year} Q${r.question_number}] image: ${r.image_url} | text: "${r.question_text.slice(0, 70)}..."`);
  });
  await pool.end();
}
checkMathImages();
