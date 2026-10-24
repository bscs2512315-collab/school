const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Subjects that are live today. Everything else is seeded as "coming soon":
// hidden from students, visible (with a badge) only in the admin panel.
const LIVE_SUBJECTS = new Set([
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Mathematics",
]);

// Full catalog: unique subject name -> primary parent category.
// (A subject can appear in several streams; we store one representative
// category for grouping. Availability is controlled by LIVE_SUBJECTS.)
const CATALOG = [
  // General (shared across streams)
  ["English", "General"],
  ["Urdu", "General"],
  ["Islamiat", "General"],
  ["Pakistan Studies", "General"],
  ["Mathematics", "General"],
  ["General Science", "General"],
  ["Ethics", "General"],
  // Pre Medical
  ["Biology", "Pre Medical"],
  ["Physics", "Pre Medical"],
  ["Chemistry", "Pre Medical"],
  // Computer Science stream
  ["Computer Science", "Computer Science"],
  // Commerce
  ["Business Studies", "Commerce"],
  ["Principles of Accounting", "Commerce"],
  ["Principles of Commerce", "Commerce"],
  ["Principles of Economics", "Commerce"],
  ["Economics", "Commerce"],
  ["Business Mathematics", "Commerce"],
  ["Business Statistics", "Commerce"],
  ["Commercial Geography", "Commerce"],
  ["Banking", "Commerce"],
  ["Geography", "Commerce"],
  ["Civics", "Commerce"],
  ["History of Pakistan", "Commerce"],
  ["Food & Nutrition", "Commerce"],
  ["Environmental Studies", "Commerce"],
  ["Elements of Home Economics", "Commerce"],
  ["Art & Model Drawing", "Commerce"],
  // Humanities
  ["Statistics", "Humanities"],
  ["Psychology", "Humanities"],
  ["Sociology", "Humanities"],
  ["Education", "Humanities"],
  ["Islamic History", "Humanities"],
  ["Urdu Literature", "Humanities"],
  ["Literature in English", "Humanities"],
  ["Fine Arts", "Humanities"],
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log("Ensuring subjects table + columns exist...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        category TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(
      `ALTER TABLE subjects ADD COLUMN IF NOT EXISTS category TEXT`,
    );
    await client.query(
      `ALTER TABLE subjects ADD COLUMN IF NOT EXISTS coming_soon BOOLEAN NOT NULL DEFAULT false`,
    );

    console.log("Upserting catalog...");
    for (const [name, category] of CATALOG) {
      const comingSoon = !LIVE_SUBJECTS.has(name);
      await client.query(
        `INSERT INTO subjects (name, category, coming_soon, is_active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (name) DO UPDATE
           SET category = EXCLUDED.category,
               coming_soon = EXCLUDED.coming_soon,
               updated_at = CURRENT_TIMESTAMP`,
        [name, category, comingSoon],
      );
    }

    // Any pre-existing subject not in the live set becomes coming soon.
    await client.query(
      `UPDATE subjects SET coming_soon = true, updated_at = CURRENT_TIMESTAMP
       WHERE name <> ALL($1) AND coming_soon = false`,
      [Array.from(LIVE_SUBJECTS)],
    );
    await client.query(
      `UPDATE subjects SET coming_soon = false, updated_at = CURRENT_TIMESTAMP
       WHERE name = ANY($1)`,
      [Array.from(LIVE_SUBJECTS)],
    );

    const { rows } = await client.query(
      `SELECT category, name, coming_soon FROM subjects
       ORDER BY coming_soon ASC, category NULLS FIRST, name ASC`,
    );
    console.log(`\nCatalog ready (${rows.length} subjects):`);
    rows.forEach((r) =>
      console.log(
        `  ${r.coming_soon ? "🕒" : "✅"} ${r.name}  [${r.category || "—"}]`,
      ),
    );
  } catch (err) {
    console.error("Error seeding subjects catalog:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
