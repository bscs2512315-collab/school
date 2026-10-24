const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function updatePastPaperSchema() {
  const client = await pool.connect();
  try {
    console.log("Updating questions table schema for Past Papers...");

    // Add image_url column if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'questions' AND column_name = 'image_url'
        ) THEN
          ALTER TABLE questions
          ADD COLUMN image_url TEXT;
        END IF;
      END $$;
    `);

    // Add paper_ii_data column if it doesn't exist
    // This will store better_response, weaker_response, and other Paper II specific fields
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'questions' AND column_name = 'paper_ii_data'
        ) THEN
          ALTER TABLE questions
          ADD COLUMN paper_ii_data JSONB;
        END IF;
      END $$;
    `);

    console.log("✅ Database schema updated successfully!");
  } catch (error) {
    console.error("❌ Error updating schema:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updatePastPaperSchema()
  .then(() => {
    console.log("Migration completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
