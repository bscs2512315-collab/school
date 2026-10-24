import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkBioChem() {
  const subjects = ['Biology', 'Chemistry'];

  for (const sName of subjects) {
    console.log(`\n=================== ${sName.toUpperCase()} ===================`);
    const res = await pool.query(`
      SELECT curr."class" as class_level, c.chapter_number, c.chapter_name, COUNT(q.id) as q_count
      FROM curriculums curr
      JOIN chapters c ON c.curriculum_id = curr.id
      LEFT JOIN questions q ON q.chapter_id = c.id
      WHERE curr.subject = $1
      GROUP BY curr."class", c.chapter_number, c.chapter_name
      ORDER BY curr."class", c.chapter_number ASC
    `, [sName]);

    let currentClass = '';
    for (const row of res.rows) {
      if (row.class_level !== currentClass) {
        currentClass = row.class_level;
        console.log(`\n  --- Class ${currentClass} ---`);
      }
      console.log(`    Ch ${String(row.chapter_number).padStart(2)}: ${row.chapter_name.padEnd(45)} -> ${row.q_count} questions`);
    }
  }

  await pool.end();
}

checkBioChem();
