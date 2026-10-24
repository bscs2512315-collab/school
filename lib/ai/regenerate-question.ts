import { randomUUID } from "crypto";
import {
  generateGeminiContentWithRetry,
  getGeminiPaperModelsToTry,
} from "@/lib/ai/gemini";
import { sanitizeJsonEscapes } from "@/lib/ai/sanitize-json";
import type { GeneratedSloPaperQuestion } from "@/lib/paper/slo-paper-generator";

export interface RegenerateSingleQuestionParams {
  question: {
    id: string;
    questionNumber?: number;
    questionPart?: string | null;
    questionText: string;
    questionType?: string;
    marks?: number;
    sloNumber?: string | null;
    chapterName?: string | null;
    chapterId?: string | null;
    imageUrl?: string | null;
    mcqOptions?: Array<{ id: string; text: string }> | string[] | null;
    correctAnswer?: string | null;
    paperIIData?: {
      betterResponse?: string;
      weakerResponse?: string;
      markingNotes?: string;
    } | null;
  };
  paperType: "1" | "2";
  subject: string;
  classLevel: string;
  board: string;
  chapterName?: string;
  instruction?: string;
  difficulty?: "Alpha" | "Beta" | "Gamma";
  excludeQuestionTexts?: string[];
}

function stripJsonFences(text: string): string {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function normalizeOptions(raw: unknown): Array<{ id: string; text: string }> {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [
      { id: "A", text: "" },
      { id: "B", text: "" },
      { id: "C", text: "" },
      { id: "D", text: "" },
    ];
  }
  return raw.map((opt, index) => {
    if (opt && typeof opt === "object" && "id" in (opt as object)) {
      const o = opt as { id: string; text: string };
      return { id: String(o.id || String.fromCharCode(65 + index)), text: String(o.text ?? "") };
    }
    const text = String(opt ?? "");
    const letter = String.fromCharCode(65 + index);
    const cleaned = text.replace(/^[A-D][).:\-]\s*/i, "").trim() || text;
    return { id: letter, text: cleaned };
  });
}

export async function regenerateSingleQuestionWithAi(
  params: RegenerateSingleQuestionParams,
): Promise<GeneratedSloPaperQuestion> {
  const {
    question,
    paperType,
    subject,
    classLevel,
    board,
    chapterName = question.chapterName || subject,
    instruction = "",
    difficulty = "Beta",
    excludeQuestionTexts = [],
  } = params;

  const isPaper1 = paperType === "1";
  const questionNum = question.questionNumber || 1;
  const targetMarks = Number(question.marks) || (isPaper1 ? 1 : 4);

  const difficultyRules = (() => {
    switch (difficulty) {
      case "Alpha":
        return `DIFFICULTY: ALPHA (Easy / Foundational recall, core definitions, basic formula recall, clear single-step problems).`;
      case "Gamma":
        return `DIFFICULTY: GAMMA (Advanced Entry-Test / High Conceptual Rigor - MDCAT/ECAT level, multi-step analytical problem, proportional scaling, testing deep conceptual misconceptions).`;
      case "Beta":
      default:
        return `DIFFICULTY: BETA (Standard Pakistani board exam rigor, conceptual understanding, standard application and moderate problem solving).`;
    }
  })();

  const cleanExcludeList = excludeQuestionTexts
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t !== question.questionText.trim())
    .slice(0, 20);

  const excludeSection =
    cleanExcludeList.length > 0
      ? `\nCRITICAL ANTI-DUPLICATION RULE:
The newly generated question MUST be completely distinct and NEVER duplicate or test the exact same concept/values as any of these existing questions in the paper:
${cleanExcludeList.map((t, idx) => `[Question ${idx + 1}]: "${t.length > 180 ? t.slice(0, 180) + "..." : t}"`).join("\n")}\n`
      : "";

  const teacherInstructionSection = instruction.trim()
    ? `\nTEACHER'S SPECIFIC MODIFICATION REQUEST:
"${instruction.trim()}"
Please prioritize this instruction carefully (e.g. if the teacher asks to differentiate from another question, change difficulty, switch subtopics, change numericals, or make it more conceptual).\n`
    : `\nTEACHER'S REQUEST:
Generate a fresh, original, non-duplicate replacement question covering "${chapterName}".\n`;

  const prompt = isPaper1
    ? `You are an expert Pakistani board exam question setter (${board}, Class ${classLevel}, ${subject}).

The teacher wants to REGENERATE/REPLACE Question ${questionNum} in a Paper 1 (MCQ) test.

CURRENT QUESTION TO BE REPLACED:
- Question: "${question.questionText}"
- Current Marks: ${targetMarks}
- Chapter/Topic: "${chapterName}"
${question.sloNumber ? `- SLO: ${question.sloNumber}` : ""}
${teacherInstructionSection}
${excludeSection}
${difficultyRules}

RULES:
1. Generate exactly 1 original Multiple Choice Question (MCQ).
2. Provide exactly 4 options labeled A, B, C, D.
3. Clearly specify the correct answer letter ("A", "B", "C", or "D").
4. Marks must be ${targetMarks}.
5. If an SLO number is relevant, include it (e.g. "${question.sloNumber || "1.1"}").
6. NOTATION: Plain text math only (^ for exponents, _ for subscripts, sqrt() for roots, * for multiplication, / for fractions). NEVER use LaTeX or backslashes.

Return ONLY valid compact JSON (no markdown fences):
{
  "questionText": "...",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correctAnswer": "A",
  "marks": ${targetMarks},
  "sloNumber": "${question.sloNumber || ""}"
}`
    : `You are an expert Pakistani board exam question setter (${board}, Class ${classLevel}, ${subject}).

The teacher wants to REGENERATE/REPLACE Question ${questionNum} in a Paper 2 (Theory - CRQ/ERQ) test.

CURRENT QUESTION TO BE REPLACED:
- Question: "${question.questionText}"
- Current Marks: ${targetMarks}
- Chapter/Topic: "${chapterName}"
${question.sloNumber ? `- SLO: ${question.sloNumber}` : ""}
${teacherInstructionSection}
${excludeSection}
${difficultyRules}

RULES:
1. Generate exactly 1 original Theory Question (${targetMarks >= 7 ? "ERQ" : "CRQ"}).
2. Provide marking guidance:
   - betterResponse: A complete model response / calculation showing full steps and reasoning.
   - weakerResponse: A typical incomplete or erroneous student answer highlighting common misconceptions.
   - markingNotes: Clear point-by-point marking rubric (e.g. "1 mark for formula, 1 mark for substitution, 2 marks for correct answer with units").
3. Marks must be ${targetMarks}.
4. If an SLO number is relevant, include it (e.g. "${question.sloNumber || "1.1"}").
5. NOTATION: Plain text math only (^ for exponents, _ for subscripts, sqrt() for roots, * for multiplication, / for fractions). NEVER use LaTeX or backslashes.

Return ONLY valid compact JSON (no markdown fences):
{
  "questionText": "...",
  "questionType": "${targetMarks >= 7 ? "ERQ" : "CRQ"}",
  "marks": ${targetMarks},
  "sloNumber": "${question.sloNumber || ""}",
  "betterResponse": "...",
  "weakerResponse": "...",
  "markingNotes": "..."
}`;

  const result = await generateGeminiContentWithRetry(
    {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: difficulty === "Gamma" ? 0.45 : difficulty === "Beta" ? 0.35 : 0.25,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    },
    { modelsToTry: getGeminiPaperModelsToTry(), maxAttempts: 2, timeoutMs: 30000 },
  );

  const rawText = result.response.text();
  const cleanedText = sanitizeJsonEscapes(stripJsonFences(rawText));

  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(cleanedText);
  } catch (err) {
    console.error("Failed to parse regenerated question JSON:", rawText, err);
    throw new Error("AI returned invalid question format. Please try regenerating again.");
  }

  const generatedQuestionText = String(parsed.questionText || parsed.question || "").trim();
  if (!generatedQuestionText) {
    throw new Error("AI failed to produce a question statement. Please try again.");
  }

  const newId = randomUUID();

  if (isPaper1) {
    const rawOptions = parsed.options || parsed.mcqOptions;
    const options = normalizeOptions(rawOptions);
    const correctRaw = String(parsed.correctAnswer || parsed.correct || "A").trim().toUpperCase();
    const validCorrect = ["A", "B", "C", "D"].includes(correctRaw[0]) ? correctRaw[0] : "A";

    return {
      id: newId,
      questionNumber: questionNum,
      questionPart: null,
      questionText: generatedQuestionText,
      questionType: "MCQ",
      marks: targetMarks,
      sloNumber: (parsed.sloNumber as string) || question.sloNumber || null,
      chapterName: chapterName || question.chapterName || null,
      chapterId: question.chapterId || null,
      imageUrl: null,
      mcqOptions: options,
      correctAnswer: validCorrect,
      paperIIData: null,
    };
  } else {
    const qType = (String(parsed.questionType || (targetMarks >= 7 ? "ERQ" : "CRQ"))).toUpperCase();
    return {
      id: newId,
      questionNumber: questionNum,
      questionPart: null,
      questionText: generatedQuestionText,
      questionType: qType === "ERQ" ? "ERQ" : "CRQ",
      marks: targetMarks,
      sloNumber: (parsed.sloNumber as string) || question.sloNumber || null,
      chapterName: chapterName || question.chapterName || null,
      chapterId: question.chapterId || null,
      imageUrl: null,
      mcqOptions: null,
      correctAnswer: null,
      paperIIData: {
        betterResponse: String(parsed.betterResponse || "").trim(),
        weakerResponse: String(parsed.weakerResponse || "").trim(),
        markingNotes: String(parsed.markingNotes || "").trim(),
      },
    };
  }
}
