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
    const res = await client.query(`
      SELECT se.id, se.title, se.content_markdown, se.sections
      FROM solved_exercises se
      WHERE se.content_markdown LIKE '%"sections"%'
    `);

    console.log(`Found ${res.rows.length} records with JSON in content_markdown.`);
    for (const r of res.rows) {
      console.log(`Processing: ${r.title} (${r.id})`);
      let cleanMd = r.content_markdown.trim();
      if (cleanMd.startsWith('```json')) {
        cleanMd = cleanMd.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      }
      
      let parsed = null;
      try {
        parsed = JSON.parse(cleanMd);
      } catch (e) {
        // Try loose extraction of markdown property
        const mdMatch = cleanMd.match(/"markdown"\s*:\s*"([\s\S]*?)"\s*\}?$/);
        if (mdMatch) {
          try {
            parsed = { markdown: JSON.parse(`"${mdMatch[1]}"`) };
          } catch(e2) {
            // Unescape common JSON escaped chars
            parsed = {
              markdown: mdMatch[1]
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\')
            };
          }
        }
      }

      if (parsed) {
        if (parsed.markdown) {
          console.log(`Extracted markdown (${parsed.markdown.length} chars)`);
          await client.query(
            `UPDATE solved_exercises SET content_markdown = $1 WHERE id = $2`,
            [parsed.markdown, r.id]
          );
        } else if (Array.isArray(parsed.sections) && parsed.sections.length > 0) {
          console.log(`Extracted ${parsed.sections.length} sections`);
          await client.query(
            `UPDATE solved_exercises SET sections = $1, content_markdown = NULL WHERE id = $2`,
            [JSON.stringify(parsed.sections), r.id]
          );
        }
      }
    }

    // Also check Parabola, Ellipse and Hyperbola - Solved Exercise 9.4 for double backslash
    const ex94 = await client.query(`
      SELECT id, title, sections FROM solved_exercises WHERE title LIKE '%Solved Exercise 9.4%'
    `);
    if (ex94.rows.length > 0) {
      for (const row of ex94.rows) {
        let sec = row.sections;
        if (typeof sec === 'string') sec = JSON.parse(sec);
        if (Array.isArray(sec)) {
          let modified = false;
          for (const q of sec) {
            if (Array.isArray(q.parts)) {
              for (const p of q.parts) {
                if (p.solution && p.solution.includes('\\\\Line:')) {
                  p.solution = p.solution.replace(/\\\\Line:/g, 'Line:');
                  modified = true;
                }
              }
            }
          }
          if (modified) {
            console.log(`Cleaned up double backslash in ${row.title}`);
            await client.query(
              `UPDATE solved_exercises SET sections = $1 WHERE id = $2`,
              [JSON.stringify(sec), row.id]
            );
          }
        }
      }
    }

    console.log('Database cleanup completed!');
  } finally {
    client.release();
    await pool.end();
  }
}

main();
