const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function createCustomQuizTables() {
  const client = await pool.connect();
  try {
    console.log("Creating custom quiz tables...");

    // Student-created custom quizzes (questions stored as JSONB)
    await client.query(`
      CREATE TABLE IF NOT EXISTS custom_quizzes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        subject TEXT,
        questions JSONB NOT NULL DEFAULT '[]',
        attempt_count INTEGER NOT NULL DEFAULT 0,
        best_score DECIMAL(5,2),
        last_score DECIMAL(5,2),
        last_attempted_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_custom_quizzes_student_id
      ON custom_quizzes (student_id);
    `);

    // Quiz sharing (challenge friends with your own quiz)
    await client.query(`
      CREATE TABLE IF NOT EXISTS custom_quiz_shares (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        quiz_id UUID REFERENCES custom_quizzes(id) ON DELETE CASCADE,
        owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        shared_with_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'PENDING',
        attempt_count INTEGER NOT NULL DEFAULT 0,
        best_score DECIMAL(5,2),
        last_score DECIMAL(5,2),
        last_attempted_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(quiz_id, shared_with_id)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_custom_quiz_shares_shared_with
      ON custom_quiz_shares (shared_with_id);
    `);

    console.log("Custom quiz tables created successfully.");
  } catch (error) {
    console.error("Failed to create custom quiz tables:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

createCustomQuizTables();
