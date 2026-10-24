const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const paperCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'past_papers'");
    console.log('PAST_PAPERS columns:', paperCols.rows.map(r => r.column_name));
    
    const questionCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'questions'");
    console.log('QUESTIONS columns:', questionCols.rows.map(r => r.column_name));

    const chapterCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'chapters'");
    console.log('CHAPTERS columns:', chapterCols.rows.map(r => r.column_name));

    const curriculumCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'curriculums'");
    console.log('CURRICULUMS columns:', curriculumCols.rows.map(r => r.column_name));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

check();
