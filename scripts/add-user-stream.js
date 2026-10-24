const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function addUserStream() {
  const client = await pool.connect();
  try {
    console.log("Adding stream column to users (if missing)...");
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS stream TEXT`);
    const { rows } = await client.query(
      `SELECT COUNT(*) AS c FROM users WHERE stream IS NOT NULL`,
    );
    console.log(`Done. users with a stream set: ${rows[0].c}`);
  } catch (err) {
    console.error("Error adding stream column:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

addUserStream();
