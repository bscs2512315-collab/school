import "dotenv/config";
import fs from "fs";
import path from "path";
import { db } from "../lib/db";
import { uploadToCloudinary } from "../lib/storage/cloudinary";

const PAPER_ID = "20fc0f9a-df5b-4a9e-bbbd-b466ec039441";
const DIAGRAM_DIR = path.join(process.cwd(), "public", "diagrams", PAPER_ID);

async function main() {
  console.log("🚀 Syncing all 45 questions for Mathematics Class X 2025 Paper 1...");

  // 1. Read extracted JSON
  const rawData = JSON.parse(fs.readFileSync("/tmp/math_x_2025_all_45.json", "utf-8"));
  const questions: Array<{
    questionNumber: number;
    questionText: string;
    options: Array<{ id: string; text: string }>;
    correctAnswer: string;
    suggestedChapter?: string;
  }> = rawData.questions;

  console.log(`Loaded ${questions.length} questions from JSON.`);

  // 2. Fetch Curriculum chapters for Class X Mathematics
  const { rows: currRows } = await db.query<{ id: string }>(
    `SELECT id FROM curriculums WHERE class = 'X' AND board = 'AKUEB' AND subject = 'Mathematics' LIMIT 1`
  );
  let chapters: Array<{ id: string; chapter_name: string }> = [];
  if (currRows.length > 0) {
    const { rows } = await db.query<{ id: string; chapter_name: string }>(
      `SELECT id, chapter_name FROM chapters WHERE curriculum_id = $1`,
      [currRows[0].id]
    );
    chapters = rows;
  }

  // 3. Collect local diagrams on disk
  const diagramFiles = fs.existsSync(DIAGRAM_DIR)
    ? fs.readdirSync(DIAGRAM_DIR).filter((f) => f.endsWith(".png"))
    : [];

  const qNumToDiagramFile = new Map<number, string>();
  for (const f of diagramFiles) {
    const m = f.match(/diagram_p\d+_q(\d+)\.png/);
    if (m) {
      qNumToDiagramFile.set(parseInt(m[1], 10), f);
    }
  }

  // 4. Upload diagrams to Cloudinary
  const qNumToCloudinaryUrl = new Map<number, string>();
  for (const [qNum, fileName] of qNumToDiagramFile.entries()) {
    const filePath = path.join(DIAGRAM_DIR, fileName);
    try {
      const buffer = fs.readFileSync(filePath);
      const res = await uploadToCloudinary(buffer, fileName, "questions");
      qNumToCloudinaryUrl.set(qNum, res.url);
      console.log(`🖼️ Uploaded diagram for Q${qNum}: ${res.url}`);
    } catch (err: any) {
      console.error(`Failed to upload diagram for Q${qNum}:`, err.message);
    }
  }

  // 5. Update past_papers table
  await db.query(
    `UPDATE past_papers SET total_questions = $1, status = 'COMPLETED', updated_at = NOW() WHERE id = $2`,
    [questions.length, PAPER_ID]
  );

  // 6. Delete old questions for this paper and insert all 45 fresh
  await db.query(`DELETE FROM questions WHERE past_paper_id = $1`, [PAPER_ID]);

  for (const q of questions) {
    let chapterId: string | null = null;
    let chapterName: string | null = q.suggestedChapter || null;

    if (q.suggestedChapter) {
      const match = chapters.find(
        (ch) =>
          ch.chapter_name.toLowerCase() === q.suggestedChapter?.toLowerCase() ||
          ch.chapter_name.toLowerCase().includes(q.suggestedChapter?.toLowerCase() || "")
      );
      if (match) {
        chapterId = match.id;
        chapterName = match.chapter_name;
      }
    }

    const imageUrl = qNumToCloudinaryUrl.get(q.questionNumber) || null;

    const mcqData = {
      options: q.options,
      correctAnswer: q.correctAnswer,
    };

    await db.query(
      `INSERT INTO questions (
        past_paper_id,
        question_number,
        question_part,
        question_text,
        question_type,
        chapter_id,
        chapter_name,
        is_verified,
        mcq_data,
        image_url,
        marks,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
      [
        PAPER_ID,
        q.questionNumber,
        null,
        q.questionText,
        "MCQ",
        chapterId,
        chapterName,
        true,
        JSON.stringify(mcqData),
        imageUrl,
        1,
      ]
    );
  }

  console.log(`\n🎉 Successfully synced all ${questions.length} questions for Mathematics Class X 2025 Paper 1!`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
