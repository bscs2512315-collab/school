const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function migrateTeacherPortal() {
  const client = await pool.connect();
  try {
    console.log("Starting Teacher Portal migrations...");

    // 1. Update Users Table
    console.log("Updating users table...");
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS subjects TEXT[],
      ADD COLUMN IF NOT EXISTS school_id UUID;
    `);

    // 2. Create Teacher Content Table
    console.log("Creating teacher_content table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS teacher_content (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        teacher_id TEXT REFERENCES users(id),
        school_id UUID,
        title TEXT NOT NULL,
        description TEXT,
        content_type TEXT NOT NULL, -- assignment, quiz, homework, practice_question
        subject TEXT NOT NULL,
        questions_data JSONB,
        due_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Create Content Assignments Table (Bulk assignments)
    console.log("Creating content_assignments table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS content_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_id UUID REFERENCES teacher_content(id) ON DELETE CASCADE,
        student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'assigned', -- assigned, completed, graded
        submission_data JSONB,
        score INTEGER,
        feedback TEXT,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Update Exam Attempts for Manual Grading
    console.log("Updating exam_attempts table...");
    await client.query(`
      ALTER TABLE exam_attempts 
      ADD COLUMN IF NOT EXISTS manual_grader_id TEXT REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS feedback TEXT;
    `);

    console.log("Teacher Portal migrations completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateTeacherPortal()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
