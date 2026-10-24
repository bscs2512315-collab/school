import "dotenv/config";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { db } from "../lib/db";

async function publishJsonFile(jsonFilePath: string) {
  const resolvedPath = path.resolve(process.cwd(), jsonFilePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    return;
  }

  const raw = fs.readFileSync(resolvedPath, "utf-8");
  const data = JSON.parse(raw);

  const { class: classVal, board = "AKUEB", subject, year, paperNumber = 1 } = data.metadata;
  const formattedQuestions = data.extractedQuestions;

  console.log(`\n📤 Publishing: Class ${classVal} · ${subject} · ${year} (Paper ${paperNumber})`);
  console.log(`   Questions: ${formattedQuestions.length}`);

  const { rows: adminRows } = await db.query(
    `SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1`,
  );
  const adminId = adminRows[0]?.id || null;

  const { rows: existing } = await db.query(
    `SELECT id FROM past_papers WHERE class = $1 AND board = $2 AND subject = $3 AND year = $4 AND paper_number = $5`,
    [classVal, board, subject, year, paperNumber],
  );

  let pastPaperId = existing[0]?.id;
  if (existing.length > 0) {
    console.log(`   - Found existing past paper ID: ${pastPaperId}. Refreshing questions...`);
    await db.query(`DELETE FROM questions WHERE past_paper_id = $1`, [pastPaperId]);
    await db.query(`UPDATE past_papers SET total_questions = $1, status = 'COMPLETED' WHERE id = $2`, [
      formattedQuestions.length,
      pastPaperId,
    ]);
  } else {
    pastPaperId = randomUUID();
    await db.query(
      `INSERT INTO past_papers (id, class, board, subject, year, paper_number, file_url, file_name, total_questions, status, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        pastPaperId,
        classVal,
        board,
        subject,
        year,
        paperNumber,
        "",
        `Official-${classVal}-${board}-${subject}-${year}-P${paperNumber}`,
        formattedQuestions.length,
        "COMPLETED",
        adminId,
      ],
    );
    console.log(`   - Created past paper record: ${pastPaperId}`);
  }

  for (const q of formattedQuestions) {
    const questionId = randomUUID();
    let mcqData = null;
    if (q.questionType === "MCQ" && q.mcqOptions) {
      mcqData = JSON.stringify({
        options: q.mcqOptions,
        correctAnswer: q.correctAnswer,
      });
    }

    await db.query(
      `INSERT INTO questions (
        id, past_paper_id, question_number, question_part, question_text, 
        question_type, chapter_id, chapter_name, is_verified, verified_by, mcq_data, image_url, marks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        questionId,
        pastPaperId,
        q.questionNumber,
        q.questionPart || null,
        q.questionText,
        q.questionType,
        q.chapterId || null,
        q.chapterName || null,
        true,
        adminId,
        mcqData,
        q.imageUrl || null,
        q.marks || 1,
      ],
    );
  }

  console.log(`   ✅ Successfully published ${formattedQuestions.length} questions into past_papers & questions table.`);
}

async function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error("Please pass one or more JSON file paths.");
    process.exit(1);
  }

  for (const f of files) {
    await publishJsonFile(f);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error publishing:", err);
  process.exit(1);
});
