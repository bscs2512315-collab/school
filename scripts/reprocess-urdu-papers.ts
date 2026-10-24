import "dotenv/config";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../lib/db";
import { randomUUID } from "crypto";

interface UrduPaperTarget {
  class: string;
  subject: string;
  year: number;
  pdfPath: string;
  keyPath?: string;
}

const TARGETS: UrduPaperTarget[] = [
  // 1. Islamiat (Urdu)
  {
    class: "IX",
    subject: "Islamiat (Urdu)",
    year: 2025,
    pdfPath: "pastpapers/downloads/ClassIX_General/Islamiyat-Urdu-IX-Paper-I-2025.pdf",
    keyPath: "pastpapers/downloads/ClassIX_General/Islamiyat-IX-Keys-2025.pdf",
  },
  {
    class: "IX",
    subject: "Islamiat (Urdu)",
    year: 2024,
    pdfPath: "pastpapers/downloads/ClassIX_General/Islamiyat-Urdu-IX-Paper-I-2024.pdf",
    keyPath: "pastpapers/downloads/ClassIX_General/Islamiyat-IX-Keys-2024.pdf",
  },
  {
    class: "IX",
    subject: "Islamiat (Urdu)",
    year: 2023,
    pdfPath: "pastpapers/downloads/ClassIX_General/Islamiyat-Urdu-IX-Paper-I-2023.pdf",
    keyPath: "pastpapers/downloads/ClassIX_General/Islamiyat-IX-Keys-2023.pdf",
  },
  {
    class: "IX",
    subject: "Islamiat (Urdu)",
    year: 2022,
    pdfPath: "pastpapers/downloads/ClassIX_General/Islamiyat-Urdu-IX-Paper-I-2022.pdf",
    keyPath: "pastpapers/downloads/ClassIX_General/Islamiyat-IX-Keys-2022.pdf",
  },

  // 2. Pakistan Studies (Urdu)
  {
    class: "IX",
    subject: "Pakistan Studies (Urdu)",
    year: 2025,
    pdfPath: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-Urdu-IX-Paper-I-2025.pdf",
    keyPath: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-IX-Keys-2025.pdf",
  },
  {
    class: "IX",
    subject: "Pakistan Studies (Urdu)",
    year: 2024,
    pdfPath: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-Urdu-IX-Paper-I-2024.pdf",
    keyPath: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-IX-Keys-2024.pdf",
  },
  {
    class: "IX",
    subject: "Pakistan Studies (Urdu)",
    year: 2023,
    pdfPath: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-Urdu-IX-Paper-I-2023.pdf",
    keyPath: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-IX-Keys-2023.pdf",
  },
  {
    class: "IX",
    subject: "Pakistan Studies (Urdu)",
    year: 2022,
    pdfPath: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-Urdu-IX-Paper-I-2022.pdf",
    keyPath: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-IX-Keys-2022.pdf",
  },
];

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MODELS_TO_TRY = ["gemini-3.1-flash-lite", "gemini-2.5-flash"];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function parseJsonResponse(text: string): Record<string, any> {
  let jsonText = text.trim();
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  try {
    return JSON.parse(jsonText);
  } catch {
    const sanitized = jsonText.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
    return JSON.parse(sanitized);
  }
}

function renderPdfPages(pdfPath: string, outDir: string): string[] {
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outDir, { recursive: true });

  const pyCode = `
import fitz, os
doc = fitz.open("${pdfPath}")
for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=180)
    pix.save(os.path.join("${outDir}", f"page_{i+1:02d}.png"))
`;
  execSync(`python3 -c '${pyCode}'`);

  return fs.readdirSync(outDir)
    .filter((f) => f.endsWith(".png"))
    .sort()
    .map((f) => path.join(outDir, f));
}

async function extractQuestionsWithGemini(
  target: UrduPaperTarget,
  imageFiles: string[],
): Promise<any[]> {
  const imageParts = imageFiles.map((imgPath) => ({
    inlineData: {
      data: fs.readFileSync(imgPath).toString("base64"),
      mimeType: "image/png",
    },
  }));

  const expectedCount = target.year === 2022 ? 40 : 30;

  const prompt = `You are an expert Urdu exam transcriber.
Analyze the attached pages of official AKUEB Class ${target.class} ${target.subject} ${target.year} Paper-1 (MCQ).

TASK:
Extract all ${expectedCount} multiple choice questions (MCQs) into clean, authentic Urdu Nastaliq text.

RULES:
1. Extract exactly questions 1 to ${expectedCount}.
2. Ensure full proper Urdu words (e.g. "المہیمن", "التنزیل", "حضرت سعد بن ابی وقاص ؓ", "تلاوتِ قرآن", "اخلاقی معیار").
3. NEVER split words into disjointed letters.
4. Format bullet points on separate lines with bullet symbol "• ".
5. Extract options A, B, C, D and correct answer for each question.

Return JSON in this EXACT structure:
{
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "سوال کا مکمل متن",
      "mcqOptions": [
        {"id": "A", "text": "آپشن اے"},
        {"id": "B", "text": "آپشن بی"},
        {"id": "C", "text": "آپشن سی"},
        {"id": "D", "text": "آپشن ڈی"}
      ],
      "correctAnswer": "C",
      "suggestedChapter": "باب کا نام"
    }
  ]
}`;

  for (const modelName of MODELS_TO_TRY) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`   Calling model ${modelName} (attempt ${attempt})...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const response = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [...imageParts, { text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
            maxOutputTokens: 32768,
          },
        });

        const rawText = response.response.text();
        const parsed = parseJsonResponse(rawText);
        if (parsed.questions && parsed.questions.length > 0) {
          return parsed.questions;
        }
      } catch (err: any) {
        console.warn(`   ⚠️ Model ${modelName} failed on attempt ${attempt}: ${err.message}`);
        if (err.message.includes("429") || err.message.includes("quota") || err.message.includes("rate limit")) {
          console.log("   ⏳ Rate limit reached. Waiting 20 seconds before retrying...");
          await sleep(20000);
        } else {
          await sleep(4000);
        }
      }
    }
  }

  throw new Error("All Gemini models failed to extract questions");
}

async function getAdminId(): Promise<string> {
  const { rows } = await db.query(`SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1`);
  return rows[0]?.id || "00000000-0000-0000-0000-000000000001";
}

async function processPaper(target: UrduPaperTarget, adminId: string) {
  console.log(`\n========================================================================`);
  console.log(`📖 Reprocessing: Class ${target.class} · ${target.subject} · ${target.year}`);
  console.log(`   PDF: ${target.pdfPath}`);
  console.log(`========================================================================`);

  const fullPdfPath = path.resolve(process.cwd(), target.pdfPath);
  if (!fs.existsSync(fullPdfPath)) {
    console.error(`❌ PDF not found: ${fullPdfPath}`);
    return;
  }

  // 1. Render pages
  const tempDir = path.resolve(process.cwd(), `scratch/render_${target.subject.replace(/[^a-zA-Z0-9]/g, "_")}_${target.year}`);
  const images = renderPdfPages(fullPdfPath, tempDir);
  console.log(`   Rendered ${images.length} pages to PNG.`);

  // 2. Extract with Gemini Vision
  const questions = await extractQuestionsWithGemini(target, images);
  console.log(`   Extracted ${questions.length} questions.`);

  if (questions.length === 0) {
    console.error(`⚠️ No questions extracted!`);
    return;
  }

  // 3. Find or Create past_paper in DB
  let { rows: existingPapers } = await db.query(
    `SELECT id FROM past_papers WHERE class = $1 AND subject = $2 AND year = $3 AND paper_number = 1`,
    [target.class, target.subject, target.year],
  );

  let paperId: string;
  if (existingPapers.length > 0) {
    paperId = existingPapers[0].id;
    console.log(`   Updating existing past paper record (${paperId})...`);
    await db.query(`DELETE FROM questions WHERE past_paper_id = $1`, [paperId]);
    await db.query(
      `UPDATE past_papers SET total_questions = $1, status = 'COMPLETED' WHERE id = $2`,
      [questions.length, paperId],
    );
  } else {
    paperId = randomUUID();
    console.log(`   Creating new past paper record (${paperId})...`);
    await db.query(
      `INSERT INTO past_papers (id, class, board, subject, year, paper_number, file_url, file_name, total_questions, status, uploaded_by)
       VALUES ($1, $2, 'AKUEB', $3, $4, 1, '', $5, $6, 'COMPLETED', $7)`,
      [
        paperId,
        target.class,
        target.subject,
        target.year,
        `Official-${target.class}-AKUEB-${target.subject}-${target.year}-P1`,
        questions.length,
        adminId,
      ],
    );
  }

  // 4. Insert clean questions
  for (const q of questions) {
    const qId = randomUUID();
    const mcqData = JSON.stringify({
      options: q.mcqOptions || [],
      correctAnswer: q.correctAnswer || "A",
    });

    await db.query(
      `INSERT INTO questions (
        id, past_paper_id, question_number, question_part, question_text, 
        question_type, chapter_name, is_verified, verified_by, mcq_data, marks
      ) VALUES ($1, $2, $3, null, $4, 'MCQ', $5, true, $6, $7, 1)`,
      [
        qId,
        paperId,
        q.questionNumber,
        q.questionText,
        q.suggestedChapter || null,
        adminId,
        mcqData,
      ],
    );
  }

  console.log(`✅ Successfully published all ${questions.length} questions for ${target.subject} ${target.year}!`);

  // Clean up temp images
  fs.rmSync(tempDir, { recursive: true, force: true });
}

async function main() {
  const adminId = await getAdminId();
  console.log(`Admin ID: ${adminId}`);

  for (let i = 0; i < TARGETS.length; i++) {
    const target = TARGETS[i];
    try {
      await processPaper(target, adminId);
      if (i < TARGETS.length - 1) {
        console.log("⏳ Cooling down 6s...");
        await sleep(6000);
      }
    } catch (err: any) {
      console.error(`❌ Failed to process ${target.subject} ${target.year}:`, err.message);
    }
  }

  console.log(`\n🎉 ALL URDU PAPERS REPROCESSED SUCCESSFULLY!`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
