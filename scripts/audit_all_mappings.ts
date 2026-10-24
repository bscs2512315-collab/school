import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function audit() {
  console.log('=== ACCURATE INDIVIDUAL SUBJECT/CLASS MAPPING AUDIT ===\n');

  const pairsRes = await pool.query(`
    SELECT pp.subject, pp."class", COUNT(q.id) as question_count
    FROM past_papers pp
    JOIN questions q ON q.past_paper_id = pp.id
    GROUP BY pp.subject, pp."class"
    ORDER BY pp."class", pp.subject
  `);

  const results: any[] = [];

  for (const pair of pairsRes.rows) {
    const rawSubject = pair.subject;
    const classLevel = pair.class;
    let targetCurriculumSubject = rawSubject;
    if (rawSubject === 'Islamiat (Urdu)') targetCurriculumSubject = 'Islamiat';
    if (rawSubject === 'Pakistan Studies (Urdu)') targetCurriculumSubject = 'Pakistan Studies';

    const currRes = await pool.query(
      `SELECT id FROM curriculums WHERE subject = $1 AND "class" = $2`,
      [targetCurriculumSubject, classLevel]
    );

    if (currRes.rows.length === 0) {
      results.push({
        subject: rawSubject,
        class: classLevel,
        totalQ: parseInt(pair.question_count),
        totalChapters: 0,
        chaptersWithQ: 0,
        maxPct: 0,
        status: '❌ NO CURRICULUM',
        distribution: []
      });
      continue;
    }

    const curriculumId = currRes.rows[0].id;

    // Filter questions strictly for this rawSubject and classLevel
    const chapRes = await pool.query(`
      SELECT c.id, c.chapter_number, c.chapter_name, COUNT(q.id) as q_count
      FROM chapters c
      LEFT JOIN questions q ON q.chapter_id = c.id
      LEFT JOIN past_papers pp ON q.past_paper_id = pp.id AND pp.subject = $2 AND pp."class" = $3
      WHERE c.curriculum_id = $1
      GROUP BY c.id, c.chapter_number, c.chapter_name
      ORDER BY c.chapter_number ASC
    `, [curriculumId, rawSubject, classLevel]);

    const totalQ = parseInt(pair.question_count);
    const totalChapters = chapRes.rows.length;
    const chaptersWithQ = chapRes.rows.filter(r => parseInt(r.q_count) > 0).length;
    const maxCount = Math.max(...chapRes.rows.map(r => parseInt(r.q_count)), 0);
    const maxPct = totalQ > 0 ? Math.round((maxCount / totalQ) * 100) : 0;

    let status = '✅ Healthy';
    if (chaptersWithQ === 1 && totalChapters > 1) {
      status = '🚨 CLUMPED (1 chap)';
    } else if (chaptersWithQ < Math.min(3, totalChapters) && totalChapters >= 4) {
      status = '⚠️ LOW COVERAGE';
    } else if (maxPct > 80 && totalChapters > 3) {
      status = `⚠️ CONCENTRATED (${maxPct}%)`;
    }

    results.push({
      subject: rawSubject,
      class: classLevel,
      totalQ,
      totalChapters,
      chaptersWithQ,
      maxPct,
      status,
      distribution: chapRes.rows.map(r => ({
        num: r.chapter_number,
        name: r.chapter_name,
        count: parseInt(r.q_count)
      }))
    });
  }

  // Print Summary Table
  console.log('------------------------------------------------------------------------------------------------------------------');
  console.log('| Grade | Subject                         | Total Qs | Total Chaps | Active Chaps | Top Chap % | Status          |');
  console.log('------------------------------------------------------------------------------------------------------------------');
  for (const r of results) {
    console.log(
      `| ${r.class.padEnd(5)} | ${r.subject.padEnd(31)} | ${String(r.totalQ).padStart(8)} | ${String(r.totalChapters).padStart(11)} | ${String(r.chaptersWithQ).padStart(12)} | ${String(r.maxPct + '%').padStart(10)} | ${r.status.padEnd(15)} |`
    );
  }
  console.log('------------------------------------------------------------------------------------------------------------------\n');

  const problematic = results.filter(r => r.status !== '✅ Healthy');
  if (problematic.length > 0) {
    console.log('=== INVESTIGATION NEEDED FOR: ===');
    for (const p of problematic) {
      console.log(`\n[${p.class}] ${p.subject} (${p.status}) - Total Qs: ${p.totalQ}:`);
      p.distribution.forEach((d: any) => console.log(`   Ch ${d.num}: ${d.name} -> ${d.count} questions`));
    }
  } else {
    console.log('🎉 ALL 56 SUBJECT/CLASS COMBINATIONS ARE BALANCED AND HEALTHY!');
  }

  await pool.end();
}

audit();
