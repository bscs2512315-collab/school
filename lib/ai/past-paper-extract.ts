import { generateGeminiContentWithRetry } from "@/lib/ai/gemini";
import type { ChapterInfo } from "@/types/admin";

/**
 * The original PDF, base64-encoded, to send to Gemini as multimodal input.
 * When provided, the model sees the real page layout (tables, diagrams,
 * super/subscripts) instead of only the flattened `pdf-parse` text — which is
 * what the manual Gemini-chat workflow relied on. Text is still passed as a
 * supplement/fallback.
 */
export interface PdfInlineInput {
  /** Base64-encoded PDF bytes (no data: prefix). */
  data: string;
  /** Usually "application/pdf". */
  mimeType: string;
}

async function callGeminiWithRetry(
  systemPrompt: string,
  userPrompt: string,
  pdfInput?: PdfInlineInput,
): Promise<string> {
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: `${systemPrompt}\n\n${userPrompt}` },
  ];

  if (pdfInput?.data) {
    // Attach the source PDF; the prompt tells the model it is authoritative for
    // layout/tables/figures.
    parts.push({
      inlineData: { mimeType: pdfInput.mimeType || "application/pdf", data: pdfInput.data },
    });
  }

  const result = await generateGeminiContentWithRetry({
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      maxOutputTokens: 65536,
    },
  });

  const text = result.response.text().trim();
  if (!text) throw new Error("Empty response from Gemini API");

  console.log(
    `[Gemini Extract] Response length: ${text.length} chars${pdfInput ? " (multimodal PDF)" : " (text-only)"}`,
  );
  return text;
}

function parseJsonResponse(text: string): Record<string, unknown> {
  let jsonText = text.trim();
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  // 1. Direct parse
  try {
    return JSON.parse(jsonText);
  } catch (initialErr) {
    // 2. Fix unescaped backslashes in chemical equations or LaTeX
    try {
      const sanitized = jsonText.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
      return JSON.parse(sanitized);
    } catch {
      // 3. Escape literal (raw) newlines and tabs embedded inside string values.
      //    Gemini occasionally emits them (e.g. an MCQ option spanning lines),
      //    which is invalid JSON and breaks JSON.parse.
      try {
        const newlineEscaped = escapeRawNewlines(jsonText);
        if (newlineEscaped !== jsonText) {
          return JSON.parse(newlineEscaped);
        }
      } catch {}
      // 3b. Repair MCQ option objects missing the "text" key.
      //     Gemini occasionally drops the key name, producing e.g.
      //     {"id": "C", "(option text)"} instead of {"id": "C", "text": "..."}.
      try {
        const repaired = jsonText.replace(
          /("id":\s*"[A-Da-d]"\s*,\s*)"((?:[^"\\]|\\.)*)"(?=\s*[,}])/g,
          '$1"text": "$2"',
        );
        if (repaired !== jsonText) {
          return JSON.parse(repaired);
        }
      } catch {}
      // 4. Robust recovery for truncated JSON
      try {
        const lastCompleteObj = jsonText.lastIndexOf("}");
        if (lastCompleteObj !== -1) {
          const trimmed = jsonText.substring(0, lastCompleteObj + 1);
          const openBracket = trimmed.indexOf("[");
          if (openBracket !== -1 && trimmed.indexOf("]", openBracket) === -1) {
            const recovered = trimmed + "\n  ],\n  \"removedQuestions\": []\n}";
            const sanitized = recovered.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
            return JSON.parse(sanitized);
          }
        }
      } catch {}
      throw initialErr;
    }
  }
}

/**
 * Escapes literal newline/carriage-return/tab characters that appear inside
 * JSON string values (between a closing-quote pair). Outside of strings the
 * output is left untouched.
 */
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
      if (ch === '"') inString = true;
      out += ch;
    }
  }
  return out;
}

export interface ExtractedMCQQuestion {
  questionNumber: number;
  questionPart: string | null;
  questionText: string;
  questionType: "MCQ";
  suggestedChapter: string;
  confidence: number;
  mcqOptions: Array<{ id: string; text: string }>;
  correctAnswer: string;
  hasImage: boolean;
  pageNumber: number | null;
  imageUrl?: string | null;
}

export interface ExtractedWrittenQuestion {
  questionNumber: number;
  questionPart: string | null;
  questionText: string;
  questionType: string;
  suggestedChapter: string;
  confidence: number;
  mcqOptions?: Array<{ id: string; text: string }>;
  correctAnswer?: string;
  hasImage?: boolean;
  pageNumber?: number | null;
  imageUrl?: string | null;
}

export interface RemovedQuestion {
  questionNumber: number;
  questionText: string;
  reason: string;
}

export interface ExtractionResult<T> {
  questions: T[];
  removedQuestions: RemovedQuestion[];
}

export async function extractMCQQuestionsDetailed(
  pdfText: string,
  curriculumChapters: ChapterInfo[],
  pdfInput?: PdfInlineInput,
): Promise<ExtractionResult<ExtractedMCQQuestion>> {
  const hasCurriculum = curriculumChapters.length > 0;
  const chaptersList = hasCurriculum
    ? curriculumChapters
        .map(
          (ch, idx) =>
            `${idx + 1}. ${ch.chapterName}${ch.description ? ` - ${ch.description}` : ""}`,
        )
        .join("\n")
    : "No explicit curriculum chapters list provided. Categorize each question into standard textbook chapters/topics for this subject.";

  const prompt = `You are analyzing a PAPER I (MCQ) past examination paper. Extract ALL multiple choice questions.

If a PDF file is attached, it is the AUTHORITATIVE source: read tables, diagrams, and super/subscript notation directly from the page layout. The text below is a supplementary transcription that may be missing tables or figures.

Available Chapters & SLOs from Curriculum:
${chaptersList}

EXTRACTION RULES:
1. Extract EVERY MCQ question from the paper.
2. IMPORTANT: Look for the actual question numbers (e.g., 1, 2, 3 or Q1, Q2, Q3). Ensure the first question starts at 1 unless explicitly numbered otherwise in the text.
3. DO NOT be confused by "Paper 1", "Page 1", or exam codes. These are NOT question numbers.
4. For each MCQ, extract the complete question text and ALL options (A, B, C, D).
5. IMPORTANT: Use step-by-step reasoning to determine the CORRECT answer. Consider the scientific principles involved for each option.
6. Map each question to the most relevant curriculum chapter.
7. NOTATION (MANDATORY FORMAT):
   - Superscript: (superscript=text) — e.g., if x² then write x(superscript=2), e.g. e⁻ becomes e(superscript=-)
   - Subscript: (subscript=text) — e.g., if H₂O then write H(subscript=2)O, CO₂ becomes CO(subscript=2)
   - Stacked isotopes/nuclei: (stacked=sup:X,sub:Y)Element — e.g., ¹²₆C becomes (stacked=sup:12,sub:6)C, ¹₁H becomes (stacked=sup:1,sub:1)H, ¹⁶₈O becomes (stacked=sup:16,sub:8)O
8. FIGURES: If a question depends on a diagram, table, graph, or image on the page, set "hasImage" to true and give the 1-based "pageNumber" it appears on. Otherwise set "hasImage" false and "pageNumber" to the page number if known, else null.
${
  hasCurriculum
    ? `9. OUT-OF-SYLLABUS / UNMATCHED QUESTIONS:
   *PLEASE NOTE THAT THERE MAY BE SOME QUESTIONS THAT DO NOT BELONG TO ANY OF THE CHAPTERS IN THE SLO/CURRICULUM, SO PLEASE REMOVE THEM FROM THE ACTIVE QUESTIONS LIST, BUT LIST THEM SEPARATELY IN 'removedQuestions' WITH A CLEAR REASON.*`
    : `9. Include ALL valid examination questions in the 'questions' array. Only place completely illegible questions into 'removedQuestions'.`
}

For each question, provide:
- questionNumber: The ACTUAL question number from the paper (integer).
- questionPart: null.
- questionText: The complete question text (copy exactly as written, excluding the question number and options).
- questionType: Always "MCQ".
- suggestedChapter: Best matching chapter from the curriculum list.
- mcqOptions: Array of 4 options, each with "id" (A, B, C, D) and "text" (the option text only).
- correctAnswer: The id (A, B, C, D) of the correct option.
- hasImage: Boolean — true if the question relies on a diagram/table/figure/image.
- pageNumber: 1-based page number the question appears on, or null if unknown.

Past Paper Content (supplementary transcription):
${pdfText}

Return ONLY a valid JSON object:
{
  "questions": [
    {
      "questionNumber": 1,
      "questionPart": null,
      "questionText": "Sample question text?",
      "questionType": "MCQ",
      "suggestedChapter": "Chapter Name",
      "mcqOptions": [
        {"id": "A", "text": "Option A"},
        {"id": "B", "text": "Option B"},
        {"id": "C", "text": "Option C"},
        {"id": "D", "text": "Option D"}
      ],
      "correctAnswer": "B",
      "hasImage": false,
      "pageNumber": 1
    }
  ],
  "removedQuestions": [
    {
      "questionNumber": 99,
      "questionText": "Out of syllabus question...",
      "reason": "Not covered in syllabus SLOs"
    }
  ]
}`;

  const systemPrompt =
    "You are an expert exam paper analyzer. Extract MCQ questions with their options, select the correct answer based on your knowledge, and match to curriculum chapters. Always return valid JSON with 'questions' and 'removedQuestions' arrays.";

  const text = await callGeminiWithRetry(systemPrompt, prompt, pdfInput);
  const result = parseJsonResponse(text);
  const rawQuestions = (result.questions as unknown[]) || [];
  const rawRemoved = (result.removedQuestions as unknown[]) || [];

  const questions: ExtractedMCQQuestion[] = (rawQuestions as Record<string, unknown>[]).map((q) => ({
    questionNumber: q.questionNumber as number,
    questionPart: (q.questionPart as string | null) || null,
    questionText: q.questionText as string,
    questionType: "MCQ" as const,
    suggestedChapter: q.suggestedChapter as string,
    confidence: q.confidence as number,
    mcqOptions: ((q.mcqOptions as Array<{ id: string; text: string }>) || []).map((opt) => ({
      id: opt.id,
      text: opt.text,
    })),
    correctAnswer: q.correctAnswer as string,
    hasImage: Boolean(q.hasImage),
    pageNumber: typeof q.pageNumber === "number" ? (q.pageNumber as number) : null,
  }));

  const removedQuestions: RemovedQuestion[] = (rawRemoved as Record<string, unknown>[]).map((r) => ({
    questionNumber: (r.questionNumber as number) || 0,
    questionText: (r.questionText as string) || "",
    reason: (r.reason as string) || "Out of syllabus",
  }));

  console.log(
    `[extractMCQQuestionsDetailed] Extracted ${questions.length} active questions, ${removedQuestions.length} removed questions`,
  );
  return { questions, removedQuestions };
}

export async function extractMCQQuestions(
  pdfText: string,
  curriculumChapters: ChapterInfo[],
  pdfInput?: PdfInlineInput,
): Promise<ExtractedMCQQuestion[]> {
  const result = await extractMCQQuestionsDetailed(pdfText, curriculumChapters, pdfInput);
  return result.questions;
}

export async function extractQuestionsDetailed(
  pdfText: string,
  curriculumChapters: ChapterInfo[],
  paperNumber?: number,
  pdfInput?: PdfInlineInput,
): Promise<ExtractionResult<ExtractedWrittenQuestion>> {
  if (paperNumber === 1) {
    const mcqRes = await extractMCQQuestionsDetailed(pdfText, curriculumChapters, pdfInput);
    return mcqRes as ExtractionResult<ExtractedWrittenQuestion>;
  }

  const chaptersList = curriculumChapters
    .map(
      (ch, idx) =>
        `${idx + 1}. ${ch.chapterName}${ch.description ? ` - ${ch.description}` : ""}`,
    )
    .join("\n");

  const prompt = `You are a text extraction tool. Your ONLY job is to copy text EXACTLY as it appears in the PDF. DO NOT interpret, modify, or change ANYTHING.

Available Chapters from Curriculum:
${chaptersList}

CRITICAL EXTRACTION RULES - READ CAREFULLY:

1. EXACT TEXT COPYING (MOST IMPORTANT):
   - Copy the question text CHARACTER-BY-CHARACTER exactly as it appears in the PDF
   - DO NOT convert superscripts - keep them as they appear (², ³, or ^2, ^3)
   - DO NOT "fix" or "correct" mathematical expressions unless you're CERTAIN of the structure
   - DO NOT rewrite or rephrase anything

2. Extract EVERY question part separately, including nested sub-parts:
   - If Question 1 has parts "a" and "b", and part "a" has sub-parts "i" and "ii", create separate entries:
     * Entry 1: questionNumber=1, questionPart="ai", questionText="[EXACT text of sub-part i only]"
     * Entry 2: questionNumber=1, questionPart="aii", questionText="[EXACT text of sub-part ii only]"
     * Entry 3: questionNumber=1, questionPart="b", questionText="[EXACT text of part b only]"

3. OUT-OF-SYLLABUS / UNMATCHED QUESTIONS:
   If any question DOES NOT belong to any of the curriculum chapters listed above, do not put it in "questions". Put it in "removedQuestions" with a reason.

4. For each question entry, provide:
   - questionNumber: The main question number (integer)
   - questionPart: Part identifier ("ai", "aii", "b", etc.) or null
   - questionText: EXACT COPY of the text as written
   - questionType: "CRQ" (Constructed Response/Short Answer) or "ERQ" (Extended Response/Long Answer)
   - suggestedChapter: Match to the most relevant chapter from the curriculum list above
   - confidence: Your confidence (0-1) that this chapter mapping is correct
   - hasImage: boolean if relying on a diagram

Past Paper Content:
${pdfText}

Return ONLY a valid JSON object with this exact structure:
{
  "questions": [
    {
      "questionNumber": 1,
      "questionPart": "ai",
      "questionText": "EXACT COPY of the text as it appears",
      "questionType": "ERQ",
      "suggestedChapter": "Chapter Name from the list above",
      "confidence": 0.85,
      "hasImage": false
    }
  ],
  "removedQuestions": []
}`;

  const systemPrompt =
    "You are a text extraction tool. Copy text exactly as written. Always return valid JSON with 'questions' and 'removedQuestions' arrays.";

  const text = await callGeminiWithRetry(systemPrompt, prompt, pdfInput);
  const result = parseJsonResponse(text);
  const rawQuestions = (result.questions as unknown[]) || [];
  const rawRemoved = (result.removedQuestions as unknown[]) || [];

  const questions = (rawQuestions as Record<string, unknown>[]).map((q) => ({
    questionNumber: q.questionNumber as number,
    questionPart: (q.questionPart as string | null) || null,
    questionText: q.questionText as string,
    questionType: (q.questionType as string) || "CRQ",
    suggestedChapter: (q.suggestedChapter as string) || "",
    confidence: (q.confidence as number) || 0.8,
    hasImage: Boolean(q.hasImage),
    pageNumber: typeof q.pageNumber === "number" ? (q.pageNumber as number) : null,
  }));

  const removedQuestions: RemovedQuestion[] = (rawRemoved as Record<string, unknown>[]).map((r) => ({
    questionNumber: (r.questionNumber as number) || 0,
    questionText: (r.questionText as string) || "",
    reason: (r.reason as string) || "Out of syllabus",
  }));

  console.log(
    `[extractQuestionsDetailed] Extracted ${questions.length} CRQ/ERQ questions, ${removedQuestions.length} removed`,
  );
  return { questions, removedQuestions };
}

export async function extractQuestions(
  pdfText: string,
  curriculumChapters: ChapterInfo[],
  paperNumber?: number,
  pdfInput?: PdfInlineInput,
): Promise<ExtractedWrittenQuestion[]> {
  const res = await extractQuestionsDetailed(pdfText, curriculumChapters, paperNumber, pdfInput);
  return res.questions;
}
