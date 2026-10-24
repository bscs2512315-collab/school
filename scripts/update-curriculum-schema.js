const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function updateSchema() {
  const client = await pool.connect();
  try {
    console.log("Updating curriculum schema for chapter-by-chapter upload...");

    // Make file_url and file_name optional in curriculums table
    await client.query(`
      ALTER TABLE curriculums 
      ALTER COLUMN file_url DROP NOT NULL,
      ALTER COLUMN file_name DROP NOT NULL;
    `);

    // Add content field to chapters table for storing PDF text or plain text
    await client.query(`
      ALTER TABLE chapters 
      ADD COLUMN IF NOT EXISTS content TEXT,
      ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'text',
      ADD COLUMN IF NOT EXISTS file_url TEXT,
      ADD COLUMN IF NOT EXISTS file_name TEXT,
      ADD COLUMN IF NOT EXISTS analyzed_content JSONB,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);

    // Add index for chapter content searches
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chapters_curriculum_id_number 
      ON chapters(curriculum_id, chapter_number);
    `);

    console.log("Schema updated successfully.");
  } catch (err) {
    console.error("Error updating schema:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

updateSchema()
  .then(() => {
    console.log("Migration completed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });










