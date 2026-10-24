const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Seed with the subjects that previously lived in the Subject enum so the app
// keeps working immediately after migration.
const DEFAULT_SUBJECTS = [
  "English",
  "Urdu",
  "Mathematics",
  "Pakistan Studies",
  "Islamiat",
  "Physics",
  "Chemistry",
  "Biology",
];

async function createSubjectsTable() {
  const client = await pool.connect();
  try {
    console.log("Creating subjects table (if it does not exist)...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        category TEXT,
        coming_soon BOOLEAN NOT NULL DEFAULT false,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Seeding default subjects (idempotent)...");
    for (const name of DEFAULT_SUBJECTS) {
      await client.query(
        `INSERT INTO subjects (name) VALUES ($1)
         ON CONFLICT (name) DO NOTHING`,
        [name],
      );
    }

    const { rows } = await client.query(
      `SELECT name FROM subjects ORDER BY name ASC`,
    );
    console.log(
      "Subjects table ready. Current subjects:",
      rows.map((r) => r.name).join(", "),
    );
  } catch (err) {
    console.error("Error setting up subjects table:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

createSubjectsTable();
