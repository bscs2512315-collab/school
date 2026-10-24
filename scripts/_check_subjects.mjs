import "dotenv/config";
import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const res = await pool.query(`
  SELECT DISTINCT class, subject FROM past_papers WHERE board='AKUEB' ORDER BY class, subject`);
console.log(JSON.stringify(res.rows, null, 0));
await pool.end();
