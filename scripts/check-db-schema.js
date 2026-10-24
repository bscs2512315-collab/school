const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkSchema() {
  try {
    const res = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'chapters'",
    );
    console.log(
      "Columns in 'chapters':",
      res.rows.map((r) => r.column_name),
    );

    const countRes = await pool.query(
      "SELECT COUNT(*) FROM chapters WHERE analyzed_content IS NOT NULL",
    );
    console.log("Chapters with analyzed_content:", countRes.rows[0].count);
  } catch (err) {
    console.error("Database check failed:", err.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
