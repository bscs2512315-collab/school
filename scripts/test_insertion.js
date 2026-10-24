const { Pool } = require('pg');
const { randomUUID } = require('crypto');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    const pastPaperId = randomUUID();
    console.log('Testing PAST_PAPERS insertion...');
    await pool.query(
      `INSERT INTO past_papers (id, class, board, subject, year, paper_number, file_url, file_name, total_questions, status, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [pastPaperId, 'IX', 'AKUEB', 'Chemistry', 2031, 1, '', 'Test', 1, 'COMPLETED', 'cacc0044-8f4e-46b9-adba-a3271cff1226'] // Using a fake but valid-ish UUID
    );
    console.log('PAST_PAPERS success');

    console.log('Testing QUESTIONS insertion...');
    await pool.query(
      `INSERT INTO questions (
        id, past_paper_id, question_number, question_part, question_text, 
        question_type, chapter_id, chapter_name, is_verified, verified_by, mcq_data, image_url, marks
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        randomUUID(), 
        pastPaperId, 
        1, 
        null, 
        'Test Question', 
        'MCQ', 
        null, 
        'Test Chapter', 
        true, 
        'cacc0044-8f4e-46b9-adba-a3271cff1226', 
        JSON.stringify({ options: [], correctAnswer: 'A' }), 
        null, 
        1
      ]
    );
    console.log('QUESTIONS success');
  } catch (err) {
    console.error('ERROR:', err.message);
    if (err.hint) console.error('HINT:', err.hint);
    if (err.detail) console.error('DETAIL:', err.detail);
  } finally {
    pool.end();
  }
}

test();
