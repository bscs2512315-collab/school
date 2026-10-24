const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function createStudentTables() {
  const client = await pool.connect();
  try {
    console.log("Creating student tables...");

    // Create paper_attempts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS paper_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        subject TEXT NOT NULL,
        board TEXT NOT NULL,
        paper_type TEXT NOT NULL,
        class TEXT NOT NULL,
        chapter_ids UUID[] NOT NULL,
        total_questions INTEGER NOT NULL,
        score INTEGER DEFAULT 0,
        total_points INTEGER DEFAULT 0,
        percentage DECIMAL(5,2) DEFAULT 0,
        status TEXT DEFAULT 'in_progress',
        started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        submitted_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create paper_attempt_questions table (links questions to attempts)
    await client.query(`
      CREATE TABLE IF NOT EXISTS paper_attempt_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        attempt_id UUID REFERENCES paper_attempts(id) ON DELETE CASCADE,
        question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
        question_order INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create student_answers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_answers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        attempt_id UUID REFERENCES paper_attempts(id) ON DELETE CASCADE,
        question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
        answer_type TEXT NOT NULL,
        mcq_answer_id TEXT,
        file_url TEXT,
        file_name TEXT,
        is_correct BOOLEAN,
        points_earned INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create student_question_attempts table (tracks which questions student has attempted)
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_question_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
        attempt_id UUID REFERENCES paper_attempts(id) ON DELETE CASCADE,
        is_correct BOOLEAN,
        points_earned INTEGER DEFAULT 0,
        attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, question_id, attempt_id)
      );
    `);

    // Create rewards table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rewards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        attempt_id UUID REFERENCES paper_attempts(id) ON DELETE CASCADE,
        reward_type TEXT NOT NULL,
        points_awarded INTEGER DEFAULT 0,
        badge_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create badges table (to track student badges)
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_badges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        badge_name TEXT NOT NULL,
        badge_type TEXT NOT NULL,
        earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, badge_name)
      );
    `);

    // Create indexes for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_paper_attempts_student_id ON paper_attempts(student_id);
      CREATE INDEX IF NOT EXISTS idx_paper_attempts_status ON paper_attempts(status);
      CREATE INDEX IF NOT EXISTS idx_paper_attempt_questions_attempt_id ON paper_attempt_questions(attempt_id);
      CREATE INDEX IF NOT EXISTS idx_paper_attempt_questions_question_id ON paper_attempt_questions(question_id);
      CREATE INDEX IF NOT EXISTS idx_student_answers_attempt_id ON student_answers(attempt_id);
      CREATE INDEX IF NOT EXISTS idx_student_answers_question_id ON student_answers(question_id);
      CREATE INDEX IF NOT EXISTS idx_student_question_attempts_student_id ON student_question_attempts(student_id);
      CREATE INDEX IF NOT EXISTS idx_student_question_attempts_question_id ON student_question_attempts(question_id);
      CREATE INDEX IF NOT EXISTS idx_rewards_student_id ON rewards(student_id);
      CREATE INDEX IF NOT EXISTS idx_student_badges_student_id ON student_badges(student_id);
    `);

    console.log("Student tables created successfully.");
  } catch (err) {
    console.error("Error creating student tables:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

createStudentTables()
  .then(() => {
    console.log("Migration completed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });

