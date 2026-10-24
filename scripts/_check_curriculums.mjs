import "dotenv/config";
import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const res = await pool.query(`
  SELECT class, subject, COUNT(*) as chapters
  FROM curriculums
  GROUP BY class, subject
  ORDER BY class, subject`);
console.log(JSON.stringify(res.rows, null, 0));
await pool.end();
