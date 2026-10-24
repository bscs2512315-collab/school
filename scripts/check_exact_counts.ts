import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const subjects = ['Islamiat', 'Islamiat (Urdu)', 'Pakistan Studies', 'Pakistan Studies (Urdu)', 'Computer Science', 'Business Studies', 'Urdu', 'Ethics'];
  for (const s of subjects) {
    console.log(`\n=== ${s.toUpperCase()} ===`);
    const res = await pool.query(`
      SELECT c.chapter_number, c.chapter_name, pp."class" as class_level, COUNT(q.id) as q_count
      FROM questions q
      JOIN past_papers pp ON q.past_paper_id = pp.id
      JOIN chapters c ON q.chapter_id = c.id
      WHERE pp.subject = $1
      GROUP BY c.chapter_number, c.chapter_name, pp."class"
      ORDER BY pp."class", c.chapter_number ASC
    `, [s]);

    let curClass = '';
    for (const r of res.rows) {
      if (r.class_level !== curClass) {
        curClass = r.class_level;
        console.log(`  --- Class ${curClass} ---`);
      }
      console.log(`    Ch ${String(r.chapter_number).padStart(2)}: ${r.chapter_name.padEnd(45)} -> ${r.q_count} questions`);
    }
  }
  await pool.end();
}
check();
