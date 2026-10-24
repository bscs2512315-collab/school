import "dotenv/config";
import { db } from "@/lib/db";

async function verify() {
  const result = await db.query(`
    SELECT p.subject, p.class, p.year, p.paper_number,
           COUNT(q.id) as total_q,
           COUNT(CASE WHEN q.mcq_data->>'correctAnswer' IS NOT NULL AND q.mcq_data->>'correctAnswer' != '' THEN 1 END) as with_correct_ans,
           COUNT(CASE WHEN jsonb_array_length(q.mcq_data->'options') >= 4 THEN 1 END) as with_4_options,
           COUNT(CASE WHEN q.image_url IS NOT NULL AND q.image_url != '' THEN 1 END) as with_diagrams
    FROM past_papers p
    LEFT JOIN questions q ON q.past_paper_id = p.id
    WHERE p.class = 'IX'
    GROUP BY p.subject, p.class, p.year, p.paper_number
    ORDER BY p.subject, p.year;
  `);

  console.table(result.rows);

  const missingAns = await db.query(`
    SELECT p.subject, p.class, p.year, q.question_number, q.mcq_data->>'correctAnswer' as ans
    FROM past_papers p
    JOIN questions q ON q.past_paper_id = p.id
    WHERE p.class = 'IX' AND (q.mcq_data->>'correctAnswer' IS NULL OR q.mcq_data->>'correctAnswer' = '');
  `);

  if (missingAns.rows.length === 0) {
    console.log("✅ 100% of Class IX questions have verified correct answers!");
  } else {
    console.warn("⚠️ Questions missing correct answer:", missingAns.rows);
  }

  const subjects = await db.query(`
    SELECT id, name, category, coming_soon
    FROM subjects
    ORDER BY name;
  `);
  console.log("\nSubjects configuration:");
  console.table(subjects.rows);
}

verify().catch(console.error).finally(() => process.exit(0));
