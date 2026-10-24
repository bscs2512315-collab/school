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
    console.log('AUDITING ALL SOLVED NOTES ACROSS ALL CLASSES & SUBJECTS');
    console.log('====================================================\n');

    const exercises = await client.query(`
      SELECT se.id, se.title, se.exercise_number, ch.chapter_number, ch.chapter_name,
             se.sections, se.content_markdown, c.board, c.class, c.subject
      FROM solved_exercises se
      JOIN chapters ch ON se.chapter_id = ch.id
      JOIN curriculums c ON se.curriculum_id = c.id
      ORDER BY c.board, c.class, c.subject, ch.chapter_number, se.exercise_number
    `);

    console.log(`Total Solved Exercises in Database: ${exercises.rows.length}\n`);

    const statsByGroup = {};
    const unrenderedByGroup = {};
    let totalQuestions = 0;
    let totalParts = 0;

    for (const ex of exercises.rows) {
      const groupKey = `[${ex.board} - Class ${ex.class} - ${ex.subject}]`;
      if (!statsByGroup[groupKey]) {
        statsByGroup[groupKey] = { exercises: 0, questions: 0, parts: 0 };
        unrenderedByGroup[groupKey] = new Map();
      }
      statsByGroup[groupKey].exercises++;

      let sections = ex.sections;
      if (typeof sections === 'string') {
        try { sections = JSON.parse(sections); } catch(e) {}
      }

      function checkText(txt, loc) {
        if (!txt || typeof txt !== 'string') return;
        const rendered = convertMathToHTML(txt);
        const matches = rendered.match(/\\[a-zA-Z]+/g) || [];
        for (const m of matches) {
          if (!['\\n', '\\t', '\\r'].includes(m) && !m.startsWith('\\u')) {
            const map = unrenderedByGroup[groupKey];
            if (!map.has(m)) map.set(m, []);
            map.get(m).push({ title: ex.title, loc, sample: txt.substring(0, 100) });
          }
        }
      }

      if (Array.isArray(sections)) {
        statsByGroup[groupKey].questions += sections.length;
        totalQuestions += sections.length;
        for (let qIdx = 0; qIdx < sections.length; qIdx++) {
          const q = sections[qIdx];
          checkText(q.questionText || q.content, `Q${qIdx+1} Text`);
          if (Array.isArray(q.parts)) {
            statsByGroup[groupKey].parts += q.parts.length;
            totalParts += q.parts.length;
            for (let pIdx = 0; pIdx < q.parts.length; pIdx++) {
              const p = q.parts[pIdx];
              checkText(p.partText, `Q${qIdx+1} P${pIdx+1} Text`);
              checkText(p.solution, `Q${qIdx+1} P${pIdx+1} Sol`);
              checkText(p.explanation, `Q${qIdx+1} P${pIdx+1} Exp`);
            }
          }
        }
      }

      if (ex.content_markdown) {
        checkText(ex.content_markdown, 'content_markdown');
      }
    }

    console.log('--- SUBJECT SUMMARY & UNRENDERED COMMANDS ---');
    let totalUnrenderedCommands = 0;
    for (const [groupKey, stats] of Object.entries(statsByGroup)) {
      const unrenderedMap = unrenderedByGroup[groupKey];
      const distinctBad = unrenderedMap.size;
      totalUnrenderedCommands += distinctBad;
      console.log(`${groupKey.padEnd(48)} | ${stats.exercises.toString().padStart(3)} ex | ${stats.questions.toString().padStart(4)} Qs | ${stats.parts.toString().padStart(4)} parts | ${distinctBad === 0 ? '✅ 0 unrendered' : `⚠️ ${distinctBad} unrendered: ${Array.from(unrenderedMap.keys()).join(', ')}`}`);
    }

    console.log('\n====================================================');
    console.log(`TOTAL DATABASE METRICS:`);
    console.log(`Exercises: ${exercises.rows.length}`);
    console.log(`Questions: ${totalQuestions}`);
    console.log(`Parts:     ${totalParts}`);
    console.log(`Subjects with unrendered tags: ${totalUnrenderedCommands}`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
