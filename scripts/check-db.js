const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkDB() {
  try {
    const curriculums = await pool.query("SELECT count(*) FROM curriculums");
    console.log("Curriculums count:", curriculums.rows[0].count);

    const papers = await pool.query(
      "SELECT count(*), status FROM past_papers GROUP BY status",
    );
    console.log("Papers by status:", papers.rows);

    const users = await pool.query(
      "SELECT count(*), role FROM users GROUP BY role",
    );
    console.log("Users by role:", users.rows);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await pool.end();
  }
}

checkDB();
