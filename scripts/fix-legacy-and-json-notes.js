const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Robust JSON parse for AI outputs containing LaTeX backslashes
 */
function parseAiJson(raw) {
  if (!raw) return null;
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    // Escape unescaped backslashes that are not valid JSON escape sequences: \", \\, \/, \b, \f, \n, \r, \t, \uXXXX
    let fixed = '';
    let inString = false;
    let isEscaped = false;

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      if (char === '"' && !isEscaped) {
        inString = !inString;
        fixed += char;
        isEscaped = false;
      } else if (char === '\\' && inString) {
        const next = cleaned[i + 1];
        if (next === '"' || next === '\\' || next === '/' || next === 'b' || next === 'f' || next === 'n' || next === 'r' || next === 't') {
          fixed += '\\';
          isEscaped = true;
        } else if (next === 'u' && /^[0-9a-fA-F]{4}$/.test(cleaned.slice(i + 2, i + 6))) {
          fixed += '\\';
          isEscaped = true;
        } else {
          // Unescaped LaTeX backslash (e.g. \phi, \frac, \alpha, etc.)
          fixed += '\\\\';
          isEscaped = false;
        }
      } else {
        fixed += char;
        isEscaped = false;
      }
    }

    try {
      return JSON.parse(fixed);
    } catch (e2) {
      console.warn('Fallback regex JSON extraction for:', cleaned.slice(0, 100));
      // Try extracting sections array manually
      const sectionsMatch = cleaned.match(/"sections"\s*:\s*(\[[\s\S]*?\])\s*(?:,\s*"markdown"|\})/);
      if (sectionsMatch) {
        try {
          const sections = JSON.parse(sectionsMatch[1]);
          return { sections, markdown: '' };
        } catch {}
      }
      return null;
    }
  }
}

async function run() {
  console.log('--- Step 1: Fix Raw JSON in content_markdown across database ---');
  const jsonRows = await pool.query(`
    SELECT id, title, content_markdown, sections
    FROM solved_exercises
    WHERE content_markdown ILIKE '%\\\`\\\`\\\`json%'
       OR (content_markdown ILIKE '{%' AND content_markdown ILIKE '%\"sections\"%');
  `);

  console.log(`Found ${jsonRows.rows.length} records with raw JSON.`);
  let fixedCount = 0;

  for (const row of jsonRows.rows) {
    const parsed = parseAiJson(row.content_markdown);
    if (parsed) {
      const sections = parsed.sections || [];
      const markdown = parsed.markdown || '';

      await pool.query(
        `UPDATE solved_exercises
         SET sections = $1::jsonb, content_markdown = $2, updated_at = NOW()
         WHERE id = $3`,
        [JSON.stringify(sections), markdown, row.id]
      );
      fixedCount++;
      console.log(`✓ Fixed JSON for: [${row.title}] (${sections.length} sections)`);
    } else {
      console.error(`✗ Could not parse JSON for: [${row.title}] (${row.id})`);
    }
  }
  console.log(`Finished Step 1: ${fixedCount}/${jsonRows.rows.length} records updated.`);

  console.log('\n--- Step 2: Remove Old Book Legacy Mappings in Class XI Math ---');
  // List of IDs that are purely legacy old-book entries in Class XI Math:
  const legacyTitlesToDelete = [
    'Sets - Exercise 1.1',
    'Sets - Definitions and Formulae',
    'Real and Complex Number Systems - Exercise 2.1',
    'Real and Complex Number Systems - Exercise 2.2',
    'Real and Complex Number Systems - Exercise 2.3',
    'Real and Complex Number Systems - Definitions and Formulae',
    'Groups Theory - Definitions and Formulae',
    'Groups Theory - Exercise 5.1',
    'Groups Theory - Exercise 5.2',
    'Groups Theory - Exercise 5.3',
    'Matrices and Determinants - Exercise 4.1',
    'Matrices and Determinants - Exercise 4.2',
    'Matrices and Determinants - Exercise 4.3',
    'Matrices and Determinants - Exercise 4.4 Part-I',
    'Sequence and Series - Exercise 6.1',
    'Sequence and Series - Exercise 6.2',
    'Sequence and Series - Exercise 6.3',
    'Sequence and Series - Exercise 6.4',
    'Sequence and Series - Exercise 6.5',
    'Sequence and Series - Exercise 6.6',
    'Sequence and Series - Exercise 6.7',
    'Sequence and Series - Exercise 6.8',
    'Permutations, Combinations and Introduction to Probability - Exercise 7.1',
    'Permutations, Combinations and Introduction to Probability - Exercise 7.2',
    'Permutations, Combinations and Introduction to Probability - Exercise 7.3',
    'Permutations, Combinations and Introduction to Probability - Exercise 7.4',
    'Permutations, Combinations and Introduction to Probability - Exercise 7.5',
    'Permutations, Combinations and Introduction to Probability - Definitions and Formulae',
    'Mathematical Induction and Binomial Theorem - Exercise 8.1',
    'Mathematical Induction and Binomial Theorem - Exercise 8.2',
    'Mathematical Induction and Binomial Theorem - Exercise 8.3',
    'Mathematical Induction and Binomial Theorem - Exercise 8.4',
    'Mathematical Induction and Binomial Theorem - Exercise 8.5',
    'Mathematical Induction and Binomial Theorem - Definitions and Formulae',
    'Graphs of Trigonometric Functions - Exercise 11.1',
    'Graphs of Trigonometric Functions - Exercise 11.2',
    'Graphs of Trigonometric and Inverse Trigonometric Functions - Exercise 12.1',
    'Graphs of Trigonometric and Inverse Trigonometric Functions - Exercise 12.3',
    'Graphs of Trigonometric and Inverse Trigonometric Functions - Exercise 12.4',
    'Graphs of Trigonometric and Inverse Trigonometric Functions - Exercise 12.5',
    'Inverse Trigonometric Functions and Trigonometric Equations - Exercise 13.1',
    'Inverse Trigonometric Functions and Trigonometric Equations - Exercise 13.2',
    'Graphs of Trigonometric Functions - Definitions and Formulae',
    'Inverse Trigonometric Functions and Trigonometric Equations - Definitions and Formulae',
    'Solutions of Triangles - Exercise 12.1',
    'Solutions of Triangles - Exercise 12.2',
    'Solutions of Triangles - Exercise 12.3',
    'Solutions of Triangles - Exercise 12.4',
    'Solutions of Triangles - Exercise 12.5',
    'Solutions of Triangles - Definitions and Formulae',
    'Fundamentals of Trigonometry - Exercise 9.1',
    'Fundamentals of Trigonometry - Exercise 9.2',
    'Fundamentals of Trigonometry - Exercise 9.3',
    'Fundamentals of Trigonometry - Definitions and Formulae',
    'Equations - Definitions and Formulae',
    'Equations - Exercise 3.1',
    'Equations - Exercise 3.2',
    'Equations - Exercise 3.3',
    'Equations - Exercise 3.4',
    'Equations - Exercise 3.5',
    'Equations - Exercise 3.6',
    'Equations - Exercise 3.7',
    'Equations - Exercise 3.8',
  ];

  const delRes = await pool.query(
    `DELETE FROM solved_exercises
     WHERE board = 'Sindh Board' AND class = 'XI' AND subject ILIKE '%math%'
       AND title = ANY($1::text[])
     RETURNING id, title;`,
    [legacyTitlesToDelete]
  );
  console.log(`Deleted ${delRes.rows.length} legacy old-book exercises from Class XI Math.`);

  console.log('\n--- Step 3: Remove Duplicate Congruent Triangles Exercises in Class IX Math Unit 9 ---');
  const delIXRes = await pool.query(
    `DELETE FROM solved_exercises
     WHERE board = 'Sindh Board' AND class = 'IX' AND subject ILIKE '%math%'
       AND chapter_number = 9 AND exercise_number IN ('Exercise 10.1', 'Exercise 10.2', 'Exercise 10.3')
     RETURNING id, title;`
  );
  console.log(`Deleted ${delIXRes.rows.length} duplicate exercises from Class IX Math Unit 9.`);

  await pool.end();
  console.log('\nMigration complete!');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
