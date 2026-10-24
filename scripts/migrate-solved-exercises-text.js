const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function updateSolvedExercisesSchema() {
  const client = await pool.connect();
  try {
    console.log("Adding content_markdown and sections to solved_exercises...");
    await client.query(`
      ALTER TABLE solved_exercises
      ADD COLUMN IF NOT EXISTS content_markdown TEXT,
      ADD COLUMN IF NOT EXISTS sections JSONB;
    `);
    console.log("✅ Schema updated successfully.");
  } catch (err) {
    console.error("❌ Schema update failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

updateSolvedExercisesSchema().then(() => process.exit(0));
