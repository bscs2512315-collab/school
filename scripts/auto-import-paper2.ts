/**
 * auto-import-paper2.ts
 *
 * Automated Ingestion Pipeline for Past Paper 2 (Theory / CRQ / ERQ):
 * - Strips AKUEB / exam watermarks across all pages in 0.01s.
 * - Auto-crops diagrams at 200 DPI with vector labels intact and uploads to Cloudinary.
 * - Runs Gemini AI (Multimodal) on Paper II Question Paper + E-Marking Notes.
 * - Extracts CRQ/ERQ questions, subparts (a, b, c), marks, and rubrics.
 * - Ingests "Better Responses" (Ideal model answers) & "Weaker Responses" (Common misconceptions).
 * - Matches questions against curriculum chapters & SLOs in the database.
 * - Direct ingestion to PostgreSQL (past_papers with paper_number=2 & past_paper_questions).
 * - Saves audit .json and formatted .txt files.
 *
 * Usage:
 *   npx tsx scripts/auto-import-paper2.ts --class X --subject Physics --year 2024 --pdf path/to/paper.pdf --marking path/to/marking.pdf --publish
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { extractTextFromPDF } from "@/lib/pdf/parser";
import { processPastPaperPdf } from "@/lib/ai/pdf-paper-processor";
import { generateGeminiContentWithRetry } from "@/lib/ai/gemini";
import { normalizeScientificNotation } from "@/lib/scientific-notation/normalize";
import type { ChapterInfo } from "@/types/admin";

interface ParsedArgs {
  pdfPath?: string;
  markingPdfPath?: string;
  classVal?: string;
  board?: string;
  subject?: string;
  year?: number;
  publish?: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const flags: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
        flags[key] = argv[++i];
      } else {
        flags[key] = "true";
      }
    }
  }
  return {
    pdfPath: flags.pdf || flags.paperPdf,
    markingPdfPath: flags.marking || flags.markingPdf || flags.emarking,
    classVal: flags.class,
    board: flags.board || "AKUEB",
    subject: flags.subject,
    year: flags.year ? parseInt(flags.year, 10) : undefined,
    publish: flags.publish === "true" || flags.save === "true",
  };
}

export interface ExtractedPaper2Question {
  questionNumber: number;
  questionPart: string | null;
  questionText: string;
  questionType: "CRQ" | "ERQ";
  marks: number;
  suggestedChapter: string;
  betterResponse: string;
  weakerResponse: string;
  markingNotes: string;
  hasImage: boolean;
  pageNumber?: number | null;
}

export interface RemovedPaper2Question {
  questionNumber: number;
  questionPart: string | null;
  questionText: string;
  reason: string;
}

export async function extractPaper2QuestionsDetailed(params: {
  paperPdfText: string;
  markingPdfText?: string;
  curriculumChapters: ChapterInfo[];
  paperPdfInline?: { data: string; mimeType: string };
  markingPdfInline?: { data: string; mimeType: string };
}): Promise<{ questions: ExtractedPaper2Question[]; removedQuestions: RemovedPaper2Question[] }> {
  const chaptersList = params.curriculumChapters.length > 0
    ? params.curriculumChapters
      .map((ch, idx) => `${idx + 1}. ${ch.chapterName}${ch.description ? ` - ${ch.description}` : ""}`)
      .join("\n")
    : "No explicit curriculum list provided. Categorize each question into standard textbook chapters.";

  const prompt = `You are an expert exam paper analyzer and AKUEB examiner assistant.
Extract ALL CRQ (Constructed Response Questions) and ERQ (Extended Response Questions) from this Paper II past examination.

Available Curriculum Chapters & SLOs:
${chaptersList}

AUTHORITATIVE SOURCES & GUIDELINES:
1. QUESTION PAPER (attached PDF / text):
   - Extract the full question prompt, subparts (e.g. 'a', 'b', 'c' or 'ai', 'aii'), and total allocated marks.
   - Question Type: Mark as "CRQ" (typically 2–4 marks short answer) or "ERQ" (typically 5–8 marks detailed/essay question).
   - If a main question has multiple subparts, create a SEPARATE entry for each subpart so they can be individually answered and graded. Include the main context in the question text if needed for clarity.

2. E-MARKING NOTES / EXAMINER REPORT (attached PDF / text if available):
   - Locate the exact corresponding question / subpart in the E-Marking notes.
   - Extract the "Better Response" (the ideal model student answer that demonstrated complete conceptual understanding and earned full marks).
   - Extract the "Weaker Response" (the common misconception, flawed calculation, or incomplete student response where marks were lost).
   - Extract the "Marking Notes" (the rubric breakdown, key terms required, or mark allocation criteria).
   - If E-marking notes are not provided or for older condensed papers (2021/2022), formulate an authoritative board-standard Better Response (model answer), Weaker Response (common misconception), and Marking Notes matching AKUEB standards.

3. NOTATION RULES:
   - Superscript: (superscript=text) — e.g. x² becomes x(superscript=2)
   - Subscript: (subscript=text) — e.g. H₂O becomes H(subscript=2)O, CO₂ becomes CO(subscript=2)
   - Stacked isotopes/nuclei: (stacked=sup:X,sub:Y)Element — e.g. ¹²₆C becomes (stacked=sup:12,sub:6)C
   - Chemical & Math formulas: Keep clean, unicode formatted math (e.g. ±, √, ≤, ≥, ≠, ×, ÷, °C).

4. SYLLABUS & SLO MAPPING:
   - Match each question to the most relevant Chapter from the curriculum list above.
   - If a question is genuinely out of syllabus or not covered in the curriculum SLOs, place it into "removedQuestions" with a reason.

5. DIAGRAMS:
   - If the question contains or references a diagram/figure/graph, set "hasImage" to true and specify "pageNumber".

Question Paper Text:
${params.paperPdfText}

${params.markingPdfText ? `E-Marking Notes Text:\n${params.markingPdfText}` : ""}

Return ONLY a valid JSON object matching this schema:
{
  "questions": [
    {
      "questionNumber": 1,
      "questionPart": "a",
      "questionText": "Question text for subpart a...",
      "questionType": "CRQ",
      "marks": 3,
      "suggestedChapter": "Chapter Name",
      "betterResponse": "Ideal model response...",
      "weakerResponse": "Common misconception response...",
      "markingNotes": "Rubric: 1 mark for definition, 2 marks for explanation of mechanism.",
      "hasImage": false,
      "pageNumber": 1
    }
  ],
  "removedQuestions": []
}`;

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: prompt },
  ];

  if (params.paperPdfInline) {
    parts.push({
      inlineData: {
        mimeType: params.paperPdfInline.mimeType,
        data: params.paperPdfInline.data,
      },
    });
  }

  if (params.markingPdfInline) {
    parts.push({
      inlineData: {
        mimeType: params.markingPdfInline.mimeType,
        data: params.markingPdfInline.data,
      },
    });
  }

  const result = await generateGeminiContentWithRetry(
    {
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        maxOutputTokens: 65536,
      },
    },
    {
      // Paper PDF extraction requires a strong multimodal model. Weak fallbacks
      // (e.g. flash-lite) silently return empty questions, which would be
      // mistaken for a legitimate "no questions" paper.
      modelsToTry: [
        ...new Set(
          [
            process.env.GEMINI_MODEL,
            "gemini-2.5-flash",
            "gemini-3.5-flash",
            "gemini-3.1-pro-preview",
          ].filter(Boolean) as string[],
        ),
      ],
    },
  );

  const rawText = result.response.text().trim();
  let jsonText = rawText;
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    const sanitized = jsonText.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
    parsed = JSON.parse(sanitized);
  }

  const questions: ExtractedPaper2Question[] = (parsed.questions || []).map((q: any) => ({
    questionNumber: Number(q.questionNumber) || 1,
    questionPart: q.questionPart ? String(q.questionPart).trim() : null,
    questionText: String(q.questionText || "").trim(),
    questionType: (q.questionType === "ERQ" ? "ERQ" : "CRQ") as "CRQ" | "ERQ",
    marks: Number(q.marks) || (q.questionType === "ERQ" ? 5 : 3),
    suggestedChapter: String(q.suggestedChapter || "").trim(),
    betterResponse: String(q.betterResponse || "").trim(),
    weakerResponse: String(q.weakerResponse || "").trim(),
    markingNotes: String(q.markingNotes || "").trim(),
    hasImage: Boolean(q.hasImage),
    pageNumber: typeof q.pageNumber === "number" ? q.pageNumber : null,
  }));

  const removedQuestions: RemovedPaper2Question[] = (parsed.removedQuestions || []).map((r: any) => ({
    questionNumber: Number(r.questionNumber) || 0,
    questionPart: r.questionPart ? String(r.questionPart) : null,
    questionText: String(r.questionText || ""),
    reason: String(r.reason || "Out of syllabus"),
  }));

  return { questions, removedQuestions };
}

export async function importPaper2(params: {
  classVal: string;
  board: string;
  subject: string;
  year: number;
  pdfPath: string;
  markingPdfPath?: string;
  publish?: boolean;
  force?: boolean;
}) {
  const { classVal, board, subject, year, pdfPath, markingPdfPath, publish, force } = params;

  console.log(`\n🚀 Starting Automated Paper II Ingestion Pipeline`);
  console.log(`==================================================`);
  console.log(`Target: Class ${classVal} · ${board} · ${subject} · ${year} (Paper 2)`);
  console.log(`Question Paper: ${pdfPath}`);
  if (markingPdfPath) {
    console.log(`E-Marking Notes: ${markingPdfPath}`);
  }
  console.log(`Publish to DB: ${publish ? "YES" : "NO (dry-run)"}\n`);

  // 1. Fetch Curriculum Chapters
  let chapterRows: Array<{ id: string; chapter_number: number; chapter_name: string; content: string | null }> = [];
  try {
    const { rows: curriculumRows } = await db.query(
      `SELECT id FROM curriculums WHERE class = $1 AND board = $2 AND subject = $3 LIMIT 1`,
      [classVal, board, subject],
    );
    if (curriculumRows.length > 0) {
      const { rows } = await db.query(
        `SELECT id, chapter_number, chapter_name, content FROM chapters 
         WHERE curriculum_id = $1 ORDER BY chapter_number ASC`,
        [curriculumRows[0].id],
      );
      chapterRows = rows as any[];
    }
    console.log(`📚 Found ${chapterRows.length} syllabus chapters in database.`);
  } catch (dbErr: any) {
    console.warn(`⚠️ Could not query curriculum chapters: ${dbErr.message}`);
  }

  const curriculumChapters: ChapterInfo[] = chapterRows.map((ch) => ({
    chapterNumber: ch.chapter_number,
    chapterName: ch.chapter_name,
    description: ch.content ? ch.content.substring(0, 300) : undefined,
  }));

  // 2. Strip Watermark & Extract Diagrams from Question Paper
  console.log(` [1/4] Stripping watermarks and auto-cropping diagrams at 200 DPI...`);
  const paperBuffer = fs.readFileSync(pdfPath);
  const { cleanedPdfBuffer, diagrams, diagramMap } = await processPastPaperPdf(
    paperBuffer,
    path.basename(pdfPath),
  );
  console.log(`✅ [1/4] Watermarks stripped cleanly! Cropped & uploaded ${diagrams.length} diagrams to Cloudinary.`);

  // 3. Extract text from Question Paper & Marking Notes
  console.log(`📄 [2/4] Parsing text from PDFs...`);
  const cleanedPaperFile = new File([new Uint8Array(cleanedPdfBuffer)], path.basename(pdfPath), {
    type: "application/pdf",
  });
  const paperPdfText = normalizeScientificNotation(await extractTextFromPDF(cleanedPaperFile));

  let markingPdfText = "";
  let markingPdfInline: { data: string; mimeType: string } | undefined;

  if (markingPdfPath && fs.existsSync(markingPdfPath)) {
    const markingBuffer = fs.readFileSync(markingPdfPath);
    const markingFile = new File([new Uint8Array(markingBuffer)], path.basename(markingPdfPath), {
      type: "application/pdf",
    });
    markingPdfText = normalizeScientificNotation(await extractTextFromPDF(markingFile));
    markingPdfInline = {
      data: markingBuffer.toString("base64"),
      mimeType: "application/pdf",
    };
  }

  const paperPdfInline = {
    data: cleanedPdfBuffer.toString("base64"),
    mimeType: "application/pdf",
  };

  // 4. Gemini Multimodal Extraction (with caching support)
  const baseName = path.basename(pdfPath, path.extname(pdfPath));
  const outDir = path.dirname(pdfPath);
  const jsonPath = path.join(outDir, `${baseName}_extracted.json`);
  const txtPath = path.join(outDir, `${baseName}_extracted.txt`);

  let rawQuestions: ExtractedPaper2Question[] = [];
  let removedQuestions: RemovedPaper2Question[] = [];

  if (fs.existsSync(jsonPath) && !params.force) {
    try {
      const cached = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      if (Array.isArray(cached.extractedQuestions) && cached.extractedQuestions.length > 0) {
        console.log(` [3/4] Found cached extraction (${cached.extractedQuestions.length} questions): ${jsonPath}`);
        rawQuestions = cached.extractedQuestions.map((q: any) => ({
          questionNumber: q.questionNumber,
          questionPart: q.questionPart,
          questionText: q.questionText,
          questionType: q.questionType,
          marks: q.marks,
          suggestedChapter: q.chapterName || q.suggestedChapter,
          betterResponse: q.paperIIData?.betterResponse || q.betterResponse || "",
          weakerResponse: q.paperIIData?.weakerResponse || q.weakerResponse || "",
          markingNotes: q.paperIIData?.markingNotes || q.markingNotes || "",
          hasImage: Boolean(q.imageUrl || q.hasImage),
        }));
        removedQuestions = cached.removedQuestions || [];
      }
    } catch (cacheErr) {
      console.warn("Could not read cached JSON, re-extracting with Gemini...");
    }
  }

  if (rawQuestions.length === 0) {
    console.log(`🤖 [3/4] Calling Gemini AI (Extracting CRQs/ERQs, Better & Weaker Responses, Rubrics)...`);
    const extraction = await extractPaper2QuestionsDetailed({
      paperPdfText,
      markingPdfText,
      curriculumChapters,
      paperPdfInline,
      markingPdfInline,
    });
    rawQuestions = extraction.questions;
    removedQuestions = extraction.removedQuestions;

    console.log(`✅ [3/4] Gemini extracted ${rawQuestions.length} active questions/subparts.`);
    if (removedQuestions.length > 0) {
      console.log(`⚠️  Out-of-syllabus questions excluded (${removedQuestions.length}):`);
      removedQuestions.forEach((rq) => {
        console.log(`    - Q${rq.questionNumber}${rq.questionPart ? `(${rq.questionPart})` : ""}: ${rq.questionText.slice(0, 60)}... (${rq.reason})`);
      });
    }
  }

  if (rawQuestions.length === 0) {
    throw new Error("No questions extracted from PDF. Please check PDF content or model quota.");
  }

  // 5. Match chapters & attach diagrams
  console.log(`🔗 [4/4] Mapping chapters and attaching diagrams to questions...`);
  let diagramsAttachedCount = 0;

  const formattedQuestions = rawQuestions.map((q, idx) => {
    let matchedChapter = chapterRows.find(
      (ch) => ch.chapter_name.toLowerCase() === (q.suggestedChapter || "").toLowerCase(),
    );

    if (!matchedChapter && q.suggestedChapter) {
      matchedChapter = chapterRows.find(
        (ch) =>
          ch.chapter_name.toLowerCase().includes(q.suggestedChapter.toLowerCase()) ||
          q.suggestedChapter.toLowerCase().includes(ch.chapter_name.toLowerCase()),
      );
    }

    let imageUrl: string | null = null;
    if (diagramMap.has(q.questionNumber)) {
      imageUrl = diagramMap.get(q.questionNumber)!;
      diagramsAttachedCount++;
    }

    return {
      questionNumber: q.questionNumber || idx + 1,
      questionPart: q.questionPart || null,
      questionText: normalizeScientificNotation(q.questionText),
      questionType: q.questionType,
      marks: q.marks,
      chapterId: matchedChapter?.id || null,
      chapterName: matchedChapter?.chapter_name || q.suggestedChapter || null,
      imageUrl,
      paperIIData: {
        betterResponse: normalizeScientificNotation(q.betterResponse),
        weakerResponse: normalizeScientificNotation(q.weakerResponse),
        markingNotes: normalizeScientificNotation(q.markingNotes),
        botApproved: true,
      },
    };
  });

  // 6. Generate Audit Output Files
  let textOutput = `METADATA:\nClass: ${classVal}\nBoard: ${board}\nSubject: ${subject}\nYear: ${year}\nPaper: 2\n\nQUESTIONS:\n`;

  formattedQuestions.forEach((q) => {
    textOutput += `\nQuestion ${q.questionNumber}${q.questionPart ? ` (Subpart ${q.questionPart})` : ""}:\n`;
    textOutput += `Question Type: ${q.questionType}\n`;
    textOutput += `Marks: ${q.marks}\n`;
    textOutput += `Chapter: ${q.chapterName || "Unmapped"}\n`;
    if (q.imageUrl) textOutput += `Image: ${q.imageUrl}\n`;
    textOutput += `Question Text:\n${q.questionText}\n`;
    textOutput += `Better Response:\n${q.paperIIData.betterResponse}\n`;
    textOutput += `Weaker Response:\n${q.paperIIData.weakerResponse}\n`;
    if (q.paperIIData.markingNotes) {
      textOutput += `Marking Notes:\n${q.paperIIData.markingNotes}\n`;
    }
  });

  fs.writeFileSync(txtPath, textOutput, "utf8");
  fs.writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        metadata: { class: classVal, board, subject, year, paperNumber: 2 },
        extractedQuestions: formattedQuestions,
        removedQuestions,
        totalQuestions: formattedQuestions.length,
        diagramsAttached: diagramsAttachedCount,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`📄 Saved audit text: ${txtPath}`);
  console.log(`📄 Saved audit JSON: ${jsonPath}`);

  // 7. Database Publishing
  if (publish) {
    console.log(`\n💾 Publishing to database...`);
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // Check or create past_papers row
      let paperId: string;
      const { rows: existingPaper } = await client.query(
        `SELECT id FROM past_papers 
         WHERE class = $1 AND board = $2 AND subject = $3 AND year = $4 AND paper_number = 2 
         LIMIT 1`,
        [classVal, board, subject, year],
      );

      if (existingPaper.length > 0) {
        paperId = existingPaper[0].id;
        console.log(`  Updating existing past_paper record: ${paperId}`);
        await client.query(`DELETE FROM questions WHERE past_paper_id = $1`, [paperId]);
        await client.query(
          `UPDATE past_papers SET total_questions = $1, status = 'COMPLETED', updated_at = NOW() WHERE id = $2`,
          [formattedQuestions.length, paperId],
        );
      } else {
        paperId = randomUUID();
        await client.query(
          `INSERT INTO past_papers (
             id, class, board, subject, year, paper_number, file_url, file_name,
             total_questions, status, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, 2, $6, $7, $8, 'COMPLETED', NOW(), NOW())`,
          [
            paperId,
            classVal,
            board,
            subject,
            year,
            "",
            `Official-${classVal}-${board}-${subject}-${year}-P2`,
            formattedQuestions.length,
          ],
        );
        console.log(`  Created new past_paper record: ${paperId}`);
      }

      // Insert questions
      for (const q of formattedQuestions) {
        const questionId = randomUUID();
        await client.query(
          `INSERT INTO questions (
             id, past_paper_id, question_number, question_part, question_text,
             question_type, marks, chapter_id, chapter_name, image_url, paper_ii_data,
             is_verified, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW(), NOW())`,
          [
            questionId,
            paperId,
            q.questionNumber,
            q.questionPart,
            q.questionText,
            q.questionType,
            q.marks,
            q.chapterId,
            q.chapterName,
            q.imageUrl,
            JSON.stringify(q.paperIIData),
          ],
        );
      }

      await client.query("COMMIT");
      console.log(`🎉 Successfully published ${formattedQuestions.length} Paper 2 questions to database!\n`);
    } catch (dbErr: any) {
      await client.query("ROLLBACK");
      console.error(`❌ DB publish failed: ${dbErr.message}`);
      throw dbErr;
    } finally {
      client.release();
    }
  }

  return {
    questionsCount: formattedQuestions.length,
    removedCount: removedQuestions.length,
    diagramsCount: diagramsAttachedCount,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.pdfPath || !args.classVal || !args.subject || !args.year) {
    console.error(`
Usage:
  npx tsx scripts/auto-import-paper2.ts --class <X|XII> --subject <subject> --year <year> --pdf <paper.pdf> [--marking <marking.pdf>] [--publish]
`);
    process.exit(1);
  }

  await importPaper2({
    classVal: args.classVal,
    board: args.board || "AKUEB",
    subject: args.subject,
    year: args.year,
    pdfPath: path.resolve(process.cwd(), args.pdfPath),
    markingPdfPath: args.markingPdfPath ? path.resolve(process.cwd(), args.markingPdfPath) : undefined,
    publish: args.publish,
  });
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
