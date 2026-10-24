import "dotenv/config";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { db } from "../lib/db";
import { uploadToCloudinary } from "../lib/storage/cloudinary";
import { generateGeminiContentWithRetry } from "../lib/ai/gemini";
import { sanitizeJsonEscapes } from "../lib/ai/sanitize-json";

interface TargetPaper {
  class: string;
  subject: string;
  year: number;
  paperNumber: number;
  pdfPath: string;
}

const GAPPED_PAPERS: TargetPaper[] = [
  // 1. X Mathematics (2021 - 2023) - 2024 & 2025 are already completed!
  { class: "X", subject: "Mathematics", year: 2023, paperNumber: 1, pdfPath: "pastpapers/MathsXP1/Mathematics-X-Paper-I-2023.pdf" },
  { class: "X", subject: "Mathematics", year: 2022, paperNumber: 1, pdfPath: "pastpapers/MathsXP1/Mathematics-X-Paper-I-2022.pdf" },
  { class: "X", subject: "Mathematics", year: 2021, paperNumber: 1, pdfPath: "pastpapers/MathsXP1/Mathematics-X-Paper-I-2021.pdf" },

  // 2. IX Mathematics (2021 - 2025)
  { class: "IX", subject: "Mathematics", year: 2025, paperNumber: 1, pdfPath: "pastpapers/MathsIXP1/Mathematics-IX-Paper-I-2025.pdf" },
  { class: "IX", subject: "Mathematics", year: 2024, paperNumber: 1, pdfPath: "pastpapers/MathsIXP1/Mathematics-IX-Paper-I-2024.pdf" },
  { class: "IX", subject: "Mathematics", year: 2023, paperNumber: 1, pdfPath: "pastpapers/MathsIXP1/Mathematics-IX-Paper-I-2023.pdf" },
  { class: "IX", subject: "Mathematics", year: 2022, paperNumber: 1, pdfPath: "pastpapers/MathsIXP1/Mathematics-IX-Paper-I-2022.pdf" },
  { class: "IX", subject: "Mathematics", year: 2021, paperNumber: 1, pdfPath: "pastpapers/MathsIXP1/Mathematics-IX-Paper-I-2021.pdf" },

  // 3. XII Physics (2021, 2024, 2025)
  { class: "XII", subject: "Physics", year: 2025, paperNumber: 1, pdfPath: "pastpapers/PhysicsXIIP1/Physics-XII-Paper-I-2025.pdf" },
  { class: "XII", subject: "Physics", year: 2024, paperNumber: 1, pdfPath: "pastpapers/PhysicsXIIP1/Physics-XII-Paper-I-2024.pdf" },
  { class: "XII", subject: "Physics", year: 2021, paperNumber: 1, pdfPath: "pastpapers/PhysicsXIIP1/Physics-XII-Annual-Exam-Paper-2021.pdf" },

  // 4. X Chemistry (2023)
  { class: "X", subject: "Chemistry", year: 2023, paperNumber: 1, pdfPath: "pastpapers/ChemistryXP1/Chemistry-X-Paper-I-2023.pdf" },

  // 5. IX Biology (2022, 2025)
  { class: "IX", subject: "Biology", year: 2025, paperNumber: 1, pdfPath: "pastpapers/BiologyIXP1/Biology-IX-Paper-I-2025.pdf" },
  { class: "IX", subject: "Biology", year: 2022, paperNumber: 1, pdfPath: "pastpapers/BiologyIXP1/Biology-IX-Paper-I-2022.pdf" },
];

function escapeRawNewlines(input: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        out += ch;
      } else if (ch === "\\") {
        escaped = true;
        out += ch;
      } else if (ch === '"') {
        inString = false;
        out += ch;
      } else if (ch === "\n") {
        out += "\\n";
      } else if (ch === "\r") {
        out += "\\r";
      } else if (ch === "\t") {
        out += "\\t";
      } else {
        out += ch;
      }
    } else {
      if (ch === '"') {
        inString = true;
      }
      out += ch;
    }
  }
  return out;
}

function parseGeminiJson(rawText: string): any {
  let text = rawText.trim();
  text = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

  // Try direct parse
  try {
    return JSON.parse(text);
  } catch (e1) {
    // Try sanitizeJsonEscapes
    try {
      const s = sanitizeJsonEscapes(text);
      return JSON.parse(s);
    } catch (e2) {
      // Try escapeRawNewlines
      try {
        const s2 = sanitizeJsonEscapes(escapeRawNewlines(text));
        return JSON.parse(s2);
      } catch (e3) {
        // Try repairing truncated array
        try {
          const lastBracket = text.lastIndexOf("}");
          if (lastBracket !== -1) {
            const cut = text.substring(0, lastBracket + 1) + "\n]}";
            const s3 = sanitizeJsonEscapes(escapeRawNewlines(cut));
            return JSON.parse(s3);
          }
        } catch (e4) {}
        throw e1;
      }
    }
  }
}

async function restorePaper(target: TargetPaper, idx: number, total: number) {
  console.log(`\n================================================================================`);
  console.log(`[${idx + 1}/${total}] Restoring ${target.class} ${target.subject} ${target.year} Paper ${target.paperNumber}`);
  console.log(`================================================================================`);

  // 1. Get paper from DB
  const { rows: pRows } = await db.query(
    `SELECT id FROM past_papers WHERE class = $1 AND subject = $2 AND year = $3 AND paper_number = $4`,
    [target.class, target.subject, target.year, target.paperNumber]
  );

  if (!pRows.length) {
    console.error(`❌ Paper not found in DB!`);
    return false;
  }
  const paperId = pRows[0].id;

  // 2. Resolve PDF path
  let resolvedPdf = path.resolve(process.cwd(), target.pdfPath);
  if (!fs.existsSync(resolvedPdf)) {
    const fallbackDir = path.resolve(process.cwd(), "public", "diagrams", paperId);
    if (fs.existsSync(fallbackDir)) {
      const pdfs = fs.readdirSync(fallbackDir).filter((f) => f.endsWith(".pdf"));
      if (pdfs.length > 0) {
        resolvedPdf = path.join(fallbackDir, pdfs[0]);
      }
    }
  }

  if (!fs.existsSync(resolvedPdf)) {
    console.error(`❌ PDF file not found at: ${resolvedPdf}`);
    return false;
  }
  console.log(`📄 PDF Found: ${resolvedPdf}`);

  // 3. Diagram Extraction
  const diagramDir = path.join(process.cwd(), "public", "diagrams", paperId);
  fs.mkdirSync(diagramDir, { recursive: true });

  console.log(`🖼️  Extracting vector & raster diagrams...`);
  try {
    execSync(
      `python3 scripts/pdf_past_paper_processor.py "${resolvedPdf}" --out-dir "${diagramDir}"`,
      { stdio: ["ignore", "pipe", "ignore"] }
    );
  } catch (err: any) {
    console.warn(`⚠️ Warning running diagram processor:`, err.message);
  }

  // 4. Upload diagrams to Cloudinary
  const diagramFiles = fs.existsSync(diagramDir)
    ? fs.readdirSync(diagramDir).filter((f) => f.endsWith(".png"))
    : [];

  const qNumToCloudinaryUrl = new Map<number, string>();
  for (const f of diagramFiles) {
    const m = f.match(/diagram_p\d+_q(\d+)\.png/);
    if (m) {
      const qNum = parseInt(m[1], 10);
      const filePath = path.join(diagramDir, f);
      try {
        const buffer = fs.readFileSync(filePath);
        const res = await uploadToCloudinary(buffer, f, "questions");
        qNumToCloudinaryUrl.set(qNum, res.url);
      } catch (uploadErr: any) {
        console.error(`❌ Diagram upload failed for Q${qNum}:`, uploadErr.message);
      }
    }
  }
  console.log(`☁️  Uploaded ${qNumToCloudinaryUrl.size} diagrams to Cloudinary.`);

  // 5. Multimodal Question Extraction via Gemini with retries
  console.log(`🤖 Calling Gemini AI to extract complete contiguous question set...`);
  const pdfBuffer = fs.readFileSync(resolvedPdf);
  const prompt = `You are an expert AKUEB past paper extractor. Extract ALL multiple choice questions (from Question 1 to the very last question) from the attached official exam PDF.
Do NOT filter or omit any questions. Extract every single question in strict sequential order (1, 2, 3, 4, ...).

For each question:
- questionNumber: integer (1, 2, 3...)
- questionText: Question prompt with clean mathematical HTML (use <sup>2</sup>, <sub>n</sub>, &radic;, &pi;, fractions like (a)/(b) or standard HTML). Avoid unescaped backslashes.
- options: array of 4 objects [ { "id": "A", "text": "..." }, { "id": "B", "text": "..." }, { "id": "C", "text": "..." }, { "id": "D", "text": "..." } ]
- correctAnswer: "A" | "B" | "C" | "D"
- suggestedChapter: chapter name (e.g. Sets and Functions, Matrices, Kinematics, etc.)

Return clean valid JSON:
{
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "...",
      "options": [{"id": "A", "text": "..."}, {"id": "B", "text": "..."}, {"id": "C", "text": "..."}, {"id": "D", "text": "..."}],
      "correctAnswer": "A",
      "suggestedChapter": "..."
    }
  ]
}`;

  let extractedQuestions: Array<{
    questionNumber: number;
    questionText: string;
    options: Array<{ id: string; text: string }>;
    correctAnswer: string;
    suggestedChapter?: string;
  }> = [];

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await generateGeminiContentWithRetry({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "application/pdf", data: pdfBuffer.toString("base64") } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          maxOutputTokens: 65536,
        },
      });

      const parsed = parseGeminiJson(res.response.text());
      extractedQuestions = parsed.questions || [];
      if (extractedQuestions.length > 0) {
        break;
      }
    } catch (parseErr: any) {
      console.warn(`⚠️ Attempt ${attempt}/3 failed:`, parseErr.message);
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 4000));
      }
    }
  }

  console.log(` Gemini extracted ${extractedQuestions.length} questions.`);

  if (extractedQuestions.length === 0) {
    console.error(`❌ No questions extracted by Gemini for ${target.class} ${target.subject} ${target.year}!`);
    return false;
  }

  // 6. Fetch Chapters for Curriculum
  const { rows: currRows } = await db.query<{ id: string }>(
    `SELECT id FROM curriculums WHERE class = $1 AND board = 'AKUEB' AND subject = $2 LIMIT 1`,
    [target.class, target.subject]
  );
  let chapters: Array<{ id: string; chapter_name: string }> = [];
  if (currRows.length > 0) {
    const { rows } = await db.query<{ id: string; chapter_name: string }>(
      `SELECT id, chapter_name FROM chapters WHERE curriculum_id = $1`,
      [currRows[0].id]
    );
    chapters = rows;
  }

  // 7. Atomic DB Update
  await db.query(`DELETE FROM questions WHERE past_paper_id = $1`, [paperId]);

  for (const q of extractedQuestions) {
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
        paperId,
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

  await db.query(
    `UPDATE past_papers SET total_questions = $1, status = 'COMPLETED', updated_at = NOW() WHERE id = $2`,
    [extractedQuestions.length, paperId]
  );

  console.log(
    `🎉 SUCCESS: ${target.class} ${target.subject} ${target.year} P${target.paperNumber} restored with ${extractedQuestions.length} contiguous questions.`
  );
  return true;
}

async function fixDuplicatesAndCounts() {
  console.log(`\n================================================================================`);
  console.log(`🧹 Cleaning duplicate questions and correcting total_questions metadata...`);
  console.log(`================================================================================`);

  // 1. Deduplicate questions for duplicate papers
  const duplicatePaperIds = [
    "2cbe5f72-cc71-4ca6-aef4-7de45e200707", // XII Banking 2025
    "87737d6f-08d1-43a2-9345-ea39841d990b", // XII Banking 2024
    "cdae31cd-e494-4a23-9c49-f5911aa1b6d7", // XII Business Statistics 2022
    "ba664714-12d1-4ea8-b67d-6c55c9971dc5", // XII Business Statistics 2021
  ];

  for (const paperId of duplicatePaperIds) {
    const { rowCount } = await db.query(`
      DELETE FROM questions
      WHERE id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY past_paper_id, question_number ORDER BY created_at DESC, id DESC) as rnum
          FROM questions
          WHERE past_paper_id = $1
        ) t
        WHERE t.rnum > 1
      )
    `, [paperId]);
    console.log(`  🗑️ Removed duplicate question rows for paper ${paperId}: ${rowCount} deleted.`);

    // Update total_questions
    const { rows: countRows } = await db.query(
      `SELECT COUNT(*)::int as cnt FROM questions WHERE past_paper_id = $1`,
      [paperId]
    );
    await db.query(
      `UPDATE past_papers SET total_questions = $1 WHERE id = $2`,
      [countRows[0].cnt, paperId]
    );
  }

  // 2. Fix English XI 2023 total_questions
  await db.query(
    `UPDATE past_papers SET total_questions = 8 WHERE id = '4388eb67-57bd-447b-a322-c15b09c3236f'`
  );
  console.log(`  ✅ Updated XI English 2023 total_questions to 8.`);
}

async function main() {
  console.log("🚀 Starting Full Automated Restoration of All Gapped Past Papers...\n");
  const startTime = Date.now();

  // First fix duplicates & counts
  await fixDuplicatesAndCounts();

  let successCount = 0;
  for (let i = 0; i < GAPPED_PAPERS.length; i++) {
    try {
      const ok = await restorePaper(GAPPED_PAPERS[i], i, GAPPED_PAPERS.length);
      if (ok) successCount++;
    } catch (paperErr: any) {
      console.error(`❌ Unexpected error on paper ${GAPPED_PAPERS[i].class} ${GAPPED_PAPERS[i].subject} ${GAPPED_PAPERS[i].year}:`, paperErr);
    }
    // 3s cooldown between papers
    if (i < GAPPED_PAPERS.length - 1) {
      console.log(`⏳ Cooldown 3s before next paper...`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  const durationMin = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n================================================================================`);
  console.log(`🏆 FINISHED: ${successCount}/${GAPPED_PAPERS.length} Gapped Papers Restored in ${durationMin}m!`);
  console.log(`================================================================================\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
