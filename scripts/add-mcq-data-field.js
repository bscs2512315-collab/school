const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addMCQDataField() {
  const client = await pool.connect();
  try {
    console.log("Adding mcq_data field to questions table...");

    // Add mcq_data column if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'questions' AND column_name = 'mcq_data'
        ) THEN
          ALTER TABLE questions
          ADD COLUMN mcq_data JSONB;
        END IF;
      END $$;
    `);

    // Also ensure question_part exists
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'questions' AND column_name = 'question_part'
        ) THEN
          ALTER TABLE questions
          ADD COLUMN question_part TEXT;
        END IF;
      END $$;
    `);

    console.log("✅ mcq_data and question_part fields added successfully!");
  } catch (error) {
    console.error("❌ Error adding fields:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addMCQDataField()
  .then(() => {
    console.log("Migration completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });

