import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function cleanFalseDiagramUrls() {
  console.log('=== AUDITING AND CLEANING FALSE DIAGRAM URLS ===\n');

  // Find all questions with image_url in Mathematics and General Mathematics
  const res = await pool.query(`
    SELECT q.id, q.question_number, pp.subject, pp.class, pp.year, q.question_text, q.image_url, q.mcq_data
    FROM questions q
    JOIN past_papers pp ON q.past_paper_id = pp.id
    WHERE q.image_url IS NOT NULL AND q.image_url != ''
      AND (pp.subject ILIKE '%Mathematics%' OR pp.subject ILIKE '%Business%')
  `);

  console.log(`Found ${res.rows.length} Math/Business questions with image_url.`);

  let removedCount = 0;
  const toRemoveIds: string[] = [];

  for (const row of res.rows) {
    const text = (row.question_text || '').toLowerCase();
    
    // Check if the question legitimately needs a diagram/figure/graph/table/triangle/chart/construction
    const isGenuineDiagram = 
      text.includes('diagram') ||
      text.includes('figure') ||
      text.includes('graph') ||
      text.includes('plot') ||
      text.includes('table') ||
      text.includes('chart') ||
      text.includes('triangle') ||
      text.includes('circle') ||
      text.includes('tangent') ||
      text.includes('chord') ||
      text.includes('polygon') ||
      text.includes('hexagon') ||
      text.includes('inscribed') ||
      text.includes('circumscribed') ||
      text.includes('elevation') ||
      text.includes('depression') ||
      text.includes('ladder') ||
      text.includes('shown in') ||
      text.includes('given image') ||
      text.includes('given picture') ||
      text.includes('represented in') ||
      text.includes('histogram') ||
      text.includes('geometry');

    // Pure algebraic questions that do not have diagrams (e.g. roots of equation, solve inequality, discriminant, simplify expression)
    if (!isGenuineDiagram) {
      toRemoveIds.push(row.id);
      removedCount++;
      console.log(`❌ Removing false diagram for [${row.class} ${row.subject} ${row.year} Q${row.question_number}]: "${row.question_text.slice(0, 60)}..."`);
    }
  }

  if (toRemoveIds.length > 0) {
    await pool.query(
      `UPDATE questions SET image_url = NULL WHERE id = ANY($1::uuid[])`,
      [toRemoveIds]
    );
    console.log(`\n✅ Cleared ${removedCount} false formula-crop image_url values from questions.`);
  } else {
    console.log(`\n✅ All diagram references are valid.`);
  }

  await pool.end();
}

cleanFalseDiagramUrls();
