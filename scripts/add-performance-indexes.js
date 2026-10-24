require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const indexes = [
  {
    name: 'idx_exam_attempts_user_created',
    sql: 'CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_created ON exam_attempts(user_id, created_at DESC);',
  },
  {
    name: 'idx_exam_attempts_paper2_grading',
    sql: "CREATE INDEX IF NOT EXISTS idx_exam_attempts_paper2_grading ON exam_attempts(paper_type, grading_status, created_at DESC);",
  },
  {
    name: 'idx_exam_attempts_teacher_paper',
    sql: 'CREATE INDEX IF NOT EXISTS idx_exam_attempts_teacher_paper ON exam_attempts(teacher_paper_id) WHERE teacher_paper_id IS NOT NULL;',
  },
  {
    name: 'idx_exam_attempts_generated_paper',
    sql: 'CREATE INDEX IF NOT EXISTS idx_exam_attempts_generated_paper ON exam_attempts(generated_paper_id) WHERE generated_paper_id IS NOT NULL;',
  },
  {
    name: 'idx_users_student_points',
    sql: "CREATE INDEX IF NOT EXISTS idx_users_student_points ON users(role, points DESC) WHERE role = 'STUDENT';",
  },
  {
    name: 'idx_users_school_role',
    sql: 'CREATE INDEX IF NOT EXISTS idx_users_school_role ON users(school_id, role) WHERE school_id IS NOT NULL;',
  },
  {
    name: 'idx_users_class',
    sql: 'CREATE INDEX IF NOT EXISTS idx_users_class ON users(class) WHERE class IS NOT NULL;',
  },
];

async function run() {
  console.log('--- Applying Performance Indexes to Database ---');
  const client = await pool.connect();
  try {
    for (const idx of indexes) {
      const start = Date.now();
      process.stdout.write(`Creating ${idx.name}... `);
      await client.query(idx.sql);
      console.log(`DONE (${Date.now() - start}ms)`);
    }
    console.log('All performance indexes successfully ensured.');
  } catch (error) {
    console.error('Error applying indexes:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
