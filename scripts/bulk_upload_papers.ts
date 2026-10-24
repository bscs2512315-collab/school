import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Pool } from "pg";
import { randomUUID } from "crypto";

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
};

async function findOrCreateChapter(class_name: string, board: string, subject: string, chapterName: string) {
  // First, try to find the chapter
  const { rows } = await db.query(
    `SELECT c.id 
     FROM chapters c
     JOIN curriculums curr ON c.curriculum_id = curr.id
     WHERE (c.chapter_name ILIKE $1 OR $1 ILIKE c.chapter_name || '%')
     AND curr.class = $2 AND curr.board = $3 AND curr.subject = $4`,
    [chapterName, class_name, board, subject]
  );

  if (rows.length > 0) {
    return rows[0].id;
  }

  // If not found, we could create it, but for now we'll just return null 
  // and let the API/DB use the chapterName string if needed.
  // Actually, the questions table has chapter_id and chapter_name.
  return null;
}

async function bulkUpload(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  
  // Basic parsing logic
  const metadataMatch = content.match(/METADATA:\s*([\s\S]*?)\s*QUESTIONS:/i);
  if (!metadataMatch) {
    console.error("Metadata section not found");
    return;
  }

  const metadataLines = metadataMatch[1].split("\n");
  const metadata: any = {};
  metadataLines.forEach(line => {
    const [key, value] = line.split(":").map(s => s.trim());
    if (key && value) {
      metadata[key.toLowerCase().replace(" ", "")] = value;
    }
  });

  const questionsSection = content.split(/QUESTIONS:/i)[1];
  const questionBlocks = questionsSection.split("---").map(b => b.trim()).filter(b => b);

  console.log(`Parsed Metadata:`, metadata);
  console.log(`Found ${questionBlocks.length} questions`);

  const paperNumber = parseInt(metadata.papernumber || metadata.paper || "1");
  const year = parseInt(metadata.year);

  // Check and delete existing paper
  const { rows: existingRows } = await db.query(
    `SELECT id FROM past_papers WHERE class = $1 AND board = $2 AND subject = $3 AND year = $4 AND paper_number = $5`,
    [metadata.class, metadata.board, metadata.subject, year, paperNumber]
  );

  if (existingRows.length > 0) {
    const oldPaperId = existingRows[0].id;
    console.log(`Found existing paper ${oldPaperId}. Deleting...`);
    await db.query(`DELETE FROM questions WHERE past_paper_id = $1`, [oldPaperId]);
    await db.query(`DELETE FROM past_papers WHERE id = $1`, [oldPaperId]);
  }

  // Create Past Paper
  const pastPaperId = randomUUID();
  
  // Get an admin user ID for 'uploaded_by'
  const { rows: adminRows } = await db.query("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
  if (adminRows.length === 0) {
    console.error("No admin user found in database");
    return;
  }
  const adminId = adminRows[0].id;

  await db.query(
    `INSERT INTO past_papers (id, class, board, subject, year, paper_number, file_url, file_name, total_questions, status, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      pastPaperId,
      metadata.class,
      metadata.board,
      metadata.subject,
      year,
      paperNumber,
      "", 
      `Bulk-${metadata.class}-${metadata.board}-${metadata.subject}-${year}-P${paperNumber}`,
      questionBlocks.length,
      "COMPLETED",
      adminId,
    ]
  );

  for (const block of questionBlocks) {
    const lines = block.split("\n").map(l => l.trim()).filter(l => l);
    
    // Parse individual question
    let questionNumber = 1;
    let questionText = "";
    let options: { id: string, text: string }[] = [];
    let correctAnswer = "";
    let chapterName = "";

    const qNumMatch = lines[0].match(/Question\s*(\d+)/i);
    if (qNumMatch) questionNumber = parseInt(qNumMatch[1]);

    let state = "text";
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.match(/^[A-D]\.\s/)) {
            state = "options";
            options.push({ id: line[0], text: line.substring(2).trim() });
        } else if (line.startsWith("Correct Answer:")) {
            correctAnswer = line.split(":")[1].trim();
            state = "metadata";
        } else if (line.startsWith("Chapter:")) {
            chapterName = line.split(":")[1].trim();
            state = "metadata";
        } else {
            if (state === "text") {
                questionText += (questionText ? "\n" : "") + line;
            }
        }
    }

    const questionId = randomUUID();
    const chapterId = await findOrCreateChapter(metadata.class, metadata.board, metadata.subject, chapterName);

    const mcqData = JSON.stringify({
      options: options,
      correctAnswer: correctAnswer,
    });

    try {
        await db.query(
          `INSERT INTO questions (
            id, past_paper_id, question_number, question_part, question_text, 
            question_type, chapter_id, chapter_name, is_verified, verified_by, mcq_data, image_url, marks
          )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            questionId,
            pastPaperId,
            questionNumber,
            null,
            questionText,
            "MCQ",
            chapterId,
            chapterName,
            true,
            adminId,
            mcqData,
            null,
            1
          ]
        );
        console.log(`Inserted Question ${questionNumber}`);
    } catch (err: any) {
        console.error(`Error inserting question ${questionNumber}:`, err.message);
        if (err.hint) console.error("Hint:", err.hint);
        if (err.detail) console.error("Detail:", err.detail);
        throw err;
    }
  }

  console.log("Bulk upload completed successfully!");
  process.exit(0);
}

const filePath = process.argv[2];
if (!filePath) {
  console.error("Please provide a file path: npx tsx scripts/bulk_upload_papers.ts <path>");
} else {
  bulkUpload(filePath).catch(err => {
    console.error("Error during bulk upload:", err);
    process.exit(1);
  });
}
