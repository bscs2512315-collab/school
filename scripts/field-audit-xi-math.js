const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { convertMathToHTML } = require('../lib/utils/math-notation.ts');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  const res = await client.query(`
    SELECT se.id, se.title, se.sections, se.content_markdown
    FROM solved_exercises se
    JOIN curriculums c ON se.curriculum_id = c.id
    WHERE c.subject = 'Mathematics' AND c.class = 'XI'
  `);
  
  const badCmds = new Map();

  function checkString(str, exTitle, location) {
    if (!str || typeof str !== 'string') return;
    const rendered = convertMathToHTML(str);
    const matches = rendered.match(/\\[a-zA-Z]+/g) || [];
    for (const m of matches) {
      if (!['\\n', '\\t', '\\r'].includes(m) && !m.startsWith('\\u')) {
        if (!badCmds.has(m)) {
          badCmds.set(m, []);
        }
        badCmds.get(m).push({ exTitle, location, sample: str.substring(0, 100) });
      }
    }
  }

  for (const row of res.rows) {
    let sections = row.sections;
    if (typeof sections === 'string') {
      try { sections = JSON.parse(sections); } catch(e) {}
    }
    if (Array.isArray(sections)) {
      sections.forEach((q, qIdx) => {
        checkString(q.questionText || q.content, row.title, `Q${qIdx+1} Text`);
        if (Array.isArray(q.parts)) {
          q.parts.forEach((p, pIdx) => {
            checkString(p.partText, row.title, `Q${qIdx+1} P${pIdx+1} Text`);
            checkString(p.solution, row.title, `Q${qIdx+1} P${pIdx+1} Sol`);
            checkString(p.explanation, row.title, `Q${qIdx+1} P${pIdx+1} Exp`);
          });
        }
      });
    }
    if (row.content_markdown) {
      checkString(row.content_markdown, row.title, 'content_markdown');
    }
  }

  console.log(`\nFound ${badCmds.size} distinct unrendered LaTeX commands across Class XI Math fields:\n`);
  for (const [cmd, occurrences] of badCmds.entries()) {
    console.log(`Command: ${cmd} (${occurrences.length} occurrences)`);
    console.log(`  Example [${occurrences[0].exTitle} - ${occurrences[0].location}]: "${occurrences[0].sample}"\n`);
  }

  client.release();
  await pool.end();
}
run();
