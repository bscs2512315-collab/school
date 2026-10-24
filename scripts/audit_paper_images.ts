import "dotenv/config";
import { db } from "@/lib/db";

async function audit() {
  const duplicates = await db.query(`
    SELECT q.image_url, COUNT(*) as count, 
           array_agg(p.subject || ' ' || p.class || ' ' || p.year || ' Q' || q.question_number ORDER BY p.year, q.question_number) as questions
    FROM questions q
    JOIN past_papers p ON q.past_paper_id = p.id
    WHERE q.image_url IS NOT NULL AND q.image_url != ''
    GROUP BY q.image_url
    HAVING COUNT(*) > 1
    ORDER BY count DESC;
  `);

  import("fs").then(fs => {
    const lines = duplicates.rows.map(r => `[Count ${r.count}] ${r.questions.join(", ")} => ${r.image_url}`);
    fs.writeFileSync("duplicates_audit.txt", lines.join("\n"), "utf8");
    console.log(`Wrote ${lines.length} duplicate clusters to duplicates_audit.txt`);
  });

  // Also count total questions with images vs without images per paper
  const papers = await db.query(`
    SELECT p.id, p.subject, p.class, p.year, p.paper_number,
           COUNT(q.id) as total_q,
           COUNT(CASE WHEN q.image_url IS NOT NULL AND q.image_url != '' THEN 1 END) as with_img
    FROM past_papers p
    LEFT JOIN questions q ON q.past_paper_id = p.id
    GROUP BY p.id, p.subject, p.class, p.year, p.paper_number
    ORDER BY p.subject, p.class, p.year;
  `);

  console.log("\nPapers Overview:");
  for (const p of papers.rows) {
    console.log(`${p.subject} Class ${p.class} ${p.year} (Paper ${p.paper_number}): ${p.total_q} questions, ${p.with_img} with image`);
  }
}

audit().catch(console.error).finally(() => process.exit(0));
