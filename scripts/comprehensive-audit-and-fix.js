const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('--- AUDITING ALL SOLVED EXERCISES IN DATABASE ---');

    // 1. Check counts by class and subject
    const subjectStats = await client.query([
      'SELECT c.board, c.class, c.subject, count(se.id) as exercise_count',
      'FROM solved_exercises se',
      'JOIN curriculums c ON se.curriculum_id = c.id',
      'GROUP BY c.board, c.class, c.subject',
      'ORDER BY c.board, c.class, c.subject'
    ].join('\n'));
    console.table(subjectStats.rows);

    // 2. Check for any remaining raw JSON in content_markdown
    const jsonInMarkdown = await client.query([
      'SELECT se.id, se.title, se.exercise_number, ch.chapter_name, c.subject, c.class',
      'FROM solved_exercises se',
      'JOIN chapters ch ON se.chapter_id = ch.id',
      'JOIN curriculums c ON se.curriculum_id = c.id',
      'WHERE se.content_markdown ILIKE \'%```json%\'',
      '   OR (se.content_markdown ILIKE \'%{"sections":%\' AND se.sections IS NULL)'
    ].join('\n'));
    console.log(`\nRemaining raw JSON records: ${jsonInMarkdown.rows.length}`);
    if (jsonInMarkdown.rows.length > 0) {
      console.table(jsonInMarkdown.rows);
    }

    // 3. Check for empty sections where content_markdown is null or short
    const emptyExercises = await client.query([
      'SELECT se.id, se.title, se.exercise_number, ch.chapter_name, c.subject, c.class',
      'FROM solved_exercises se',
      'JOIN chapters ch ON se.chapter_id = ch.id',
      'JOIN curriculums c ON se.curriculum_id = c.id',
      'WHERE (se.sections IS NULL OR jsonb_array_length(se.sections) = 0)',
      '  AND (se.content_markdown IS NULL OR length(trim(se.content_markdown)) < 50)'
    ].join('\n'));
    console.log(`\nEmpty / short exercises: ${emptyExercises.rows.length}`);
    if (emptyExercises.rows.length > 0) {
      console.table(emptyExercises.rows);
    }

    // 4. Audit all chapter-exercise distributions across all subjects
    const allChapters = await client.query([
      'SELECT c.board, c.class, c.subject, ch.chapter_number, ch.chapter_name, ch.id as chapter_id,',
      '       count(se.id) as ex_count,',
      '       string_agg(se.exercise_number, \', \' ORDER BY se.exercise_number) as exercises',
      'FROM chapters ch',
      'JOIN curriculums c ON ch.curriculum_id = c.id',
      'LEFT JOIN solved_exercises se ON se.chapter_id = ch.id',
      'GROUP BY c.board, c.class, c.subject, ch.chapter_number, ch.chapter_name, ch.id',
      'ORDER BY c.board, c.class, c.subject, ch.chapter_number'
    ].join('\n'));
    
    console.log('\n--- ALL CHAPTERS & EXERCISES ---');
    for (const r of allChapters.rows) {
      console.log(`[${r.board} Class ${r.class} - ${r.subject}] Ch ${r.chapter_number}: "${r.chapter_name}" (${r.ex_count} ex) -> ${r.exercises || 'None'}`);
    }

  } catch (err) {
    console.error('Audit error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
