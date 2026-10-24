const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { convertMathToHTML } = require('../lib/utils/math-notation.ts');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('====================================================');
    console.log('AUDITING ALL CLASS XI MATHEMATICS SOLVED EXERCISES');
    console.log('====================================================\n');

    const exercises = await client.query(`
      SELECT se.id, se.title, se.exercise_number, ch.chapter_number, ch.chapter_name,
             se.sections, se.content_markdown, c.board
      FROM solved_exercises se
      JOIN chapters ch ON se.chapter_id = ch.id
      JOIN curriculums c ON se.curriculum_id = c.id
      WHERE c.subject = 'Mathematics' AND c.class = 'XI'
      ORDER BY c.board, ch.chapter_number, se.exercise_number
    `);

    console.log(`Found ${exercises.rows.length} solved exercises in Class XI Mathematics.\n`);

    const issues = [];
    let totalQuestions = 0;
    let totalParts = 0;

    for (const ex of exercises.rows) {
      console.log(`[Ch ${ex.chapter_number}: ${ex.chapter_name}] ${ex.title} (ID: ${ex.id})`);

      let sections = ex.sections;
      if (typeof sections === 'string') {
        try {
          sections = JSON.parse(sections);
        } catch (e) {
          issues.push({ id: ex.id, title: ex.title, type: 'INVALID_SECTIONS_JSON', detail: e.message });
        }
      }

      if (!sections && ex.content_markdown) {
        if (ex.content_markdown.includes('```json') || (ex.content_markdown.startsWith('{') && ex.content_markdown.includes('"sections"'))) {
          issues.push({ id: ex.id, title: ex.title, type: 'RAW_JSON_IN_MARKDOWN', detail: 'Contains raw JSON in content_markdown' });
        }
      }

      if (Array.isArray(sections)) {
        totalQuestions += sections.length;
        for (let qIdx = 0; qIdx < sections.length; qIdx++) {
          const q = sections[qIdx];
          const qText = q.questionText || q.content || '';
          
          // Test rendering of question text
          testText(qText, ex, `Q${qIdx + 1} QuestionText`, issues);

          if (Array.isArray(q.parts)) {
            totalParts += q.parts.length;
            for (let pIdx = 0; pIdx < q.parts.length; pIdx++) {
              const part = q.parts[pIdx];
              testText(part.partText || '', ex, `Q${qIdx + 1} Part ${part.partNumber || pIdx + 1} Text`, issues);
              testText(part.solution || '', ex, `Q${qIdx + 1} Part ${part.partNumber || pIdx + 1} Solution`, issues);
              if (part.explanation) {
                testText(part.explanation, ex, `Q${qIdx + 1} Part ${part.partNumber || pIdx + 1} Explanation`, issues);
              }
            }
          }
        }
      } else if (!ex.content_markdown) {
        issues.push({ id: ex.id, title: ex.title, type: 'EMPTY_EXERCISE', detail: 'Neither sections nor content_markdown found' });
      }
    }

    console.log('\n----------------------------------------------------');
    console.log(`Total Exercises: ${exercises.rows.length}`);
    console.log(`Total Questions: ${totalQuestions}`);
    console.log(`Total Subparts:  ${totalParts}`);
    console.log(`Formatting Issues Detected: ${issues.length}`);
    console.log('----------------------------------------------------\n');

    if (issues.length > 0) {
      console.log('DETAILED ISSUES:');
      for (const iss of issues) {
        console.log(`- [${iss.type}] ${iss.title} (${iss.field || ''}): ${iss.detail}`);
        if (iss.sample) {
          console.log(`  Sample: "${iss.sample.substring(0, 120)}..."`);
        }
      }
    } else {
      console.log('🎉 ALL Class XI Mathematics exercises passed formatting and LaTeX conversion audits!');
    }

  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

function testText(rawText, exercise, fieldName, issues) {
  if (!rawText) return;

  // Check for common LaTeX artifacts that should have been converted to HTML or Unicode
  const rendered = convertMathToHTML(rawText);

  // 1. Unrendered LaTeX commands
  const unrenderedLatex = rendered.match(/\\[a-zA-Z]+/g);
  if (unrenderedLatex) {
    // Filter out valid escape characters if any
    const badCommands = unrenderedLatex.filter(cmd => 
      !['\\n', '\\t', '\\r'].includes(cmd) &&
      !cmd.startsWith('\\u')
    );
    if (badCommands.length > 0) {
      issues.push({
        id: exercise.id,
        title: exercise.title,
        field: fieldName,
        type: 'UNRENDERED_LATEX',
        detail: `Found unrendered LaTeX commands: ${[...new Set(badCommands)].join(', ')}`,
        sample: rawText
      });
    }
  }

  // 2. Unbalanced brackets or double backslashes
  if (rawText.includes('\\\\') && !rawText.includes('begin{')) {
    // Might be escaped backslashes from JSON
  }

  // 3. Raw LaTeX environments not converted
  if (rendered.includes('\\begin{') || rendered.includes('\\end{')) {
    issues.push({
      id: exercise.id,
      title: exercise.title,
      field: fieldName,
      type: 'UNRENDERED_ENVIRONMENT',
      detail: 'Contains unconverted LaTeX environment (\\begin{...})',
      sample: rawText
    });
  }

  // 4. Undefined/broken math tags
  if (rendered.includes('undefined') || rendered.includes('NaN')) {
    issues.push({
      id: exercise.id,
      title: exercise.title,
      field: fieldName,
      type: 'NAN_OR_UNDEFINED',
      detail: 'Rendered HTML contains "undefined" or "NaN"',
      sample: rawText
    });
  }
}

main();
