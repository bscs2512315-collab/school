const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function createAdminTables() {
  const client = await pool.connect();
  try {
    console.log("Creating admin tables...");

    // Create chapters table first (referenced by curriculums)
    await client.query(`
      CREATE TABLE IF NOT EXISTS chapters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        curriculum_id UUID,
        chapter_number INTEGER,
        chapter_name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create curriculums table
    await client.query(`
      CREATE TABLE IF NOT EXISTS curriculums (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        class TEXT NOT NULL,
        board TEXT NOT NULL,
        subject TEXT NOT NULL,
        file_url TEXT NOT NULL,
        file_name TEXT NOT NULL,
        analyzed_content JSONB,
        uploaded_by TEXT REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(class, board, subject)
      );
    `);

    // Add foreign key constraint for chapters (only if it doesn't exist)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_chapters_curriculum'
        ) THEN
          ALTER TABLE chapters
          ADD CONSTRAINT fk_chapters_curriculum
          FOREIGN KEY (curriculum_id) REFERENCES curriculums(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // Create past_papers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS past_papers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        class TEXT NOT NULL,
        board TEXT NOT NULL,
        subject TEXT NOT NULL,
        year INTEGER NOT NULL,
        paper_number INTEGER DEFAULT 1,
        file_url TEXT NOT NULL,
        file_name TEXT NOT NULL,
        total_questions INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        uploaded_by TEXT REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(class, board, subject, year, paper_number)
      );
    `);

    // Create questions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        past_paper_id UUID REFERENCES past_papers(id) ON DELETE CASCADE,
        question_number INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        question_type TEXT,
        chapter_id UUID REFERENCES chapters(id),
        chapter_name TEXT,
        ai_confidence DECIMAL(3,2),
        is_verified BOOLEAN DEFAULT FALSE,
        verified_by TEXT REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_curriculums_class_board_subject ON curriculums(class, board, subject);
      CREATE INDEX IF NOT EXISTS idx_past_papers_class_board_subject_year ON past_papers(class, board, subject, year);
      CREATE INDEX IF NOT EXISTS idx_questions_past_paper_id ON questions(past_paper_id);
      CREATE INDEX IF NOT EXISTS idx_questions_chapter_id ON questions(chapter_id);
      CREATE INDEX IF NOT EXISTS idx_chapters_curriculum_id ON chapters(curriculum_id);
    `);

    console.log("Admin tables created successfully.");
  } catch (err) {
    console.error("Error creating admin tables:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

createAdminTables()
  .then(() => {
    console.log("Migration completed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
