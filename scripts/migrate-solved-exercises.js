const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function migrateSolvedExercises() {
  const client = await pool.connect();
  try {
    console.log("🚀 Creating solved_exercises table...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS solved_exercises (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
        curriculum_id UUID REFERENCES curriculums(id) ON DELETE CASCADE,
        board TEXT NOT NULL DEFAULT 'Sindh Board',
        class TEXT NOT NULL,
        subject TEXT NOT NULL,
        chapter_number INTEGER NOT NULL,
        exercise_number TEXT NOT NULL,
        title TEXT NOT NULL,
        page_count INTEGER DEFAULT 1,
        image_urls TEXT[] NOT NULL DEFAULT '{}',
        thumbnail_url TEXT,
        solution_video_url TEXT,
        source_credit TEXT DEFAULT 'Adamjee Coaching / Sindh Textbook Board',
        is_published BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_exercise_per_curriculum UNIQUE(curriculum_id, chapter_number, exercise_number)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_solved_exercises_curriculum 
      ON solved_exercises(curriculum_id, chapter_number);
      
      CREATE INDEX IF NOT EXISTS idx_solved_exercises_class_board_subject 
      ON solved_exercises(class, board, subject);
    `);

    console.log("✅ solved_exercises table and indexes created successfully.");
  } catch (err) {
    console.error("❌ Error migrating solved_exercises table:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateSolvedExercises()
  .then(() => {
    console.log("Migration finished successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
