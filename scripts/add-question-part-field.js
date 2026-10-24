const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addQuestionPartField() {
  const client = await pool.connect();
  try {
    console.log("Adding question_part field to questions table...");

    // Add question_part column if it doesn't exist
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

    console.log("✅ question_part field added successfully!");
  } catch (error) {
    console.error("❌ Error adding question_part field:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addQuestionPartField()
  .then(() => {
    console.log("Migration completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });

