const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Best-effort default categories for the seeded subjects. Science subjects map
// to Pre Medical (which overlaps Pre Engineering); the common subjects are
// "General" so they appear across every stream.
const DEFAULT_CATEGORY_MAP = {
  Biology: "Pre Medical",
  Chemistry: "Pre Medical",
  Physics: "Pre Medical",
  Mathematics: "General",
  English: "General",
  Urdu: "General",
  "Pakistan Studies": "General",
  Islamiat: "General",
};

async function addSubjectCategory() {
  const client = await pool.connect();
  try {
    console.log("Adding category column to subjects (if missing)...");
    await client.query(
      `ALTER TABLE subjects ADD COLUMN IF NOT EXISTS category TEXT`,
    );

    console.log("Backfilling default categories...");
    for (const [name, category] of Object.entries(DEFAULT_CATEGORY_MAP)) {
      await client.query(
        `UPDATE subjects SET category = $1, updated_at = CURRENT_TIMESTAMP
         WHERE name = $2 AND (category IS NULL OR category = '')`,
        [category, name],
      );
    }

    const { rows } = await client.query(
      `SELECT name, category FROM subjects ORDER BY category NULLS FIRST, name ASC`,
    );
    console.log("Subjects with categories:");
    rows.forEach((r) => console.log(`  - ${r.name}: ${r.category || "(none)"}`));
  } catch (err) {
    console.error("Error adding subject category:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

addSubjectCategory();
