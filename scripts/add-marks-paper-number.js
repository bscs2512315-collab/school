const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function addMarksPaperNumber() {
  const client = await pool.connect();
  try {
    console.log("Adding marks and paper_number fields...");

    // Add paper_number column to past_papers if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'past_papers' AND column_name = 'paper_number'
        ) THEN
          ALTER TABLE past_papers
          ADD COLUMN paper_number INTEGER DEFAULT 1;
        END IF;
      END $$;
    `);

    // Add marks column to questions if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'questions' AND column_name = 'marks'
        ) THEN
          ALTER TABLE questions
          ADD COLUMN marks INTEGER;
        END IF;
      END $$;
    `);

    console.log("✅ marks and paper_number fields added successfully!");
  } catch (error) {
    console.error("❌ Error adding fields:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addMarksPaperNumber()
  .then(() => {
    console.log("Migration completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
