import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixSindhPaper2QuestionNumbers() {
  console.log("🛠️ Starting Sindh Board Paper 2 Question Number Normalization...");

  const { rows: papers } = await pool.query<{ id: string; year: number; paper_number: number }>(
    `SELECT id, year, paper_number FROM past_papers WHERE board = 'Sindh Board' AND paper_number = 2 ORDER BY year DESC`
  );

  console.log(`Found ${papers.length} Sindh Board Paper 2 records in DB.`);

  for (const paper of papers) {
    // Get all questions in order
    const { rows: questions } = await pool.query<{
      id: string;
      question_number: number;
      question_part: string | null;
      question_type: string;
      marks: number;
      question_text: string;
    }>(
      `SELECT id, question_number, question_part, question_type, marks, question_text
       FROM questions
       WHERE past_paper_id = $1
       ORDER BY question_number ASC, id ASC`,
      [paper.id]
    );

    console.log(`\n📄 Paper ID: ${paper.id} (${paper.year} Paper 2) - ${questions.length} questions.`);

    for (let idx = 0; idx < questions.length; idx++) {
      const q = questions[idx];
      const sequentialNumber = idx + 1;
      
      // Preserve "OR" if present in questionPart or text
      let cleanPart = q.question_part;
      if (cleanPart && cleanPart.toUpperCase().includes("OR")) {
        cleanPart = "OR";
      }

      await pool.query(
        `UPDATE questions 
         SET question_number = $1, question_part = $2
         WHERE id = $3`,
        [sequentialNumber, cleanPart, q.id]
      );
      console.log(`   Q${q.question_number}${q.question_part ? ' (' + q.question_part + ')' : ''} -> Q${sequentialNumber}${cleanPart ? ' [' + cleanPart + ']' : ''}`);
    }
  }

  console.log("\n✅ All Sindh Board Paper 2 question numbers have been successfully normalized to start from Q1 sequentially!");
  await pool.end();
}

fixSindhPaper2QuestionNumbers().catch((err) => {
  console.error("❌ Error updating Sindh Board question numbers:", err);
  process.exit(1);
});
