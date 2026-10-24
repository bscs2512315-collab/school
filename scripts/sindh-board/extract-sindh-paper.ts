import "dotenv/config";
import fs from "fs";
import path from "path";
import { generateGeminiContentWithRetry } from "../../lib/ai/gemini";
import { normalizeScientificNotation } from "../../lib/scientific-notation/normalize";
import { sanitizeJsonEscapes } from "../../lib/ai/sanitize-json";

export interface SindhExtractedMcq {
  questionNumber: number;
  questionText: string;
  mcqOptions: Array<{ id: string; text: string }>;
  correctAnswer: string;
  suggestedChapter?: string;
  marks: number;
}

export interface SindhExtractedTheory {
  questionNumber: number;
  questionPart?: string | null;
  questionText: string;
  questionType: "CRQ" | "ERQ"; // CRQ = Short QnA (Section B), ERQ = Long QnA (Section C)
  marks: number;
  suggestedChapter?: string;
  solutionOrRubric?: string;
}

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

function parseJsonArray<T>(raw: string): T[] {
  let text = raw.trim();
  if (text.startsWith("```json")) text = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  else if (text.startsWith("```")) text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");

  const jsonStart = text.indexOf("[");
  const jsonEnd = text.lastIndexOf("]");
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    text = text.substring(jsonStart, jsonEnd + 1);
  }

  // 1. Direct parse
  try {
    return JSON.parse(text) as T[];
  } catch {}

  // 2. Escape raw newlines & tabs
  try {
    const newlineEscaped = escapeRawNewlines(text);
    return JSON.parse(newlineEscaped) as T[];
  } catch {}

  // 3. Fix unescaped backslashes in LaTeX
  try {
    const sanitized = sanitizeJsonEscapes(escapeRawNewlines(text));
    return JSON.parse(sanitized) as T[];
  } catch {}

  // 4. Fallback regex backslash replacement
  try {
    const sanitized = text.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
    return JSON.parse(escapeRawNewlines(sanitized)) as T[];
  } catch {}

  // 5. Truncated array recovery: trim to last complete object '}'
  try {
    const lastCompleteObj = text.lastIndexOf("}");
    if (lastCompleteObj !== -1) {
      const trimmed = text.substring(0, lastCompleteObj + 1) + "\n]";
      const sanitized = sanitizeJsonEscapes(escapeRawNewlines(trimmed));
      return JSON.parse(sanitized) as T[];
    }
  } catch {}

  // 6. Object-by-object regex extraction fallback
  const objects: T[] = [];
  const objRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
  let match: RegExpExecArray | null;
  while ((match = objRegex.exec(text)) !== null) {
    try {
      const obj = JSON.parse(sanitizeJsonEscapes(escapeRawNewlines(match[0])));
      objects.push(obj as T);
    } catch {}
  }
  if (objects.length > 0) return objects;

  throw new Error(`Failed to parse JSON response: ${text.slice(0, 300)}...`);
}

/**
 * Extract Paper 1 (Section A - MCQs) from image(s) using Gemini Multimodal Vision
 */
export async function extractSindhPaper1MCQs(
  imageBuffers: Buffer[],
  metadata: { classVal: string; subject: string; year: number },
): Promise<SindhExtractedMcq[]> {
  const parts: any[] = [];

  imageBuffers.forEach((buf) => {
    parts.push({
      inlineData: {
        data: buf.toString("base64"),
        mimeType: "image/png",
      },
    });
  });

  const prompt = `You are an expert examiner for the Sindh Board of Secondary Education (BSEK / BIEK Karachi & Sindh Boards).
Your task is to extract all Multiple Choice Questions (MCQs) from this Section A past examination paper image for Class ${metadata.classVal}, Subject: ${metadata.subject}, Year: ${metadata.year}.

CRITICAL REQUIREMENTS:
1. Extract every single MCQ in exact numerical order (Question 1 to N). Do NOT skip any questions.
2. For mathematical/scientific formulas, equations, units, exponents, fractions, use clean standard LaTeX (e.g. $v = f\\lambda$, $\\text{H}_2\\text{SO}_4$, $x^2 + 2x + 1 = 0$, etc.).
3. For Computer Science, preserve exact C keywords, operators, and code formatting.
4. For English, extract grammar, vocabulary, reading context questions verbatim.
5. For Urdu / Islamiat / Pak Studies, preserve exact Urdu or Arabic text correctly.
6. Extract all 4 options: A, B, C, D with their exact text.
7. Solve and determine the single correct answer letter: "A", "B", "C", or "D".
8. Identify the relevant chapter/unit name from the Sindh Textbook Board Class ${metadata.classVal} ${metadata.subject} syllabus.
9. Return a valid JSON array only, without markdown backticks.

JSON Schema:
[
  {
    "questionNumber": 1,
    "questionText": "The unit of electric current in SI system is:",
    "mcqOptions": [
      { "id": "A", "text": "Volt" },
      { "id": "B", "text": "Ampere" },
      { "id": "C", "text": "Ohm" },
      { "id": "D", "text": "Coulomb" }
    ],
    "correctAnswer": "B",
    "suggestedChapter": "Current Electricity",
    "marks": 1
  }
]
`;

  parts.push({ text: prompt });

  console.log(`🤖 Calling Gemini Vision to extract Section A (MCQs) for ${metadata.subject} ${metadata.year}...`);
  const response = await generateGeminiContentWithRetry(parts, {
    modelsToTry: ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-2.5-flash"],
    maxAttempts: 6,
    timeoutMs: 180000,
  });

  const raw = response.response.text();
  const parsed = parseJsonArray<SindhExtractedMcq>(raw);
  return parsed.map((q, idx) => ({
    ...q,
    questionNumber: q.questionNumber || idx + 1,
    questionText: normalizeScientificNotation(q.questionText),
    marks: 1,
    mcqOptions: q.mcqOptions.map((opt) => ({
      id: opt.id.toUpperCase(),
      text: normalizeScientificNotation(opt.text),
    })),
  }));
}

/**
 * Extract Paper 2 (Section B Short QnA & Section C Long QnA) from image(s) using Gemini Multimodal Vision
 */
export async function extractSindhPaper2Theory(
  imageBuffers: Buffer[],
  metadata: { classVal: string; subject: string; year: number },
): Promise<SindhExtractedTheory[]> {
  const parts: any[] = [];

  imageBuffers.forEach((buf) => {
    parts.push({
      inlineData: {
        data: buf.toString("base64"),
        mimeType: "image/png",
      },
    });
  });

  const prompt = `You are an expert examiner for the Sindh Board of Secondary Education (BSEK / BIEK Karachi & Sindh Boards).
Your task is to extract Section B (Short Answer Questions) and Section C (Detailed/Long Answer Questions) from these examination paper images for Class ${metadata.classVal}, Subject: ${metadata.subject}, Year: ${metadata.year}.

CRITICAL REQUIREMENTS:
1. Extract ALL questions from Section B and Section C in order.
2. Distinguish between Section B (Short Questions -> questionType: "CRQ") and Section C (Detailed/Long Questions -> questionType: "ERQ").
3. Extract question numbers, sub-parts (e.g. (i), (ii), (a), (b)), and complete question text.
4. For numerical problems, scientific definitions, derivations, theorems, chemical equations, programming problems, use clean LaTeX and formatted code.
5. For Section B (Short Questions / CRQ), set marks = 4 or 5. For Section C (Long Questions / ERQ), set marks = 8 or 10.
6. Provide a concise step-by-step marking rubric/solution in "solutionOrRubric" for automated grading.
7. Identify the relevant chapter/unit from the Sindh Textbook Board Class ${metadata.classVal} ${metadata.subject} syllabus.
8. Return a valid JSON array only, without markdown code fencing.

JSON Schema:
[
  {
    "questionNumber": 2,
    "questionPart": "i",
    "questionText": "State Ohm's Law and write its mathematical formula.",
    "questionType": "CRQ",
    "marks": 4,
    "suggestedChapter": "Current Electricity",
    "solutionOrRubric": "Statement: Current is directly proportional to voltage at constant temperature.\\nFormula: $V = IR$."
  },
  {
    "questionNumber": 6,
    "questionPart": null,
    "questionText": "Describe Rutherford's atomic model with a neat diagram and state its two main defects.",
    "questionType": "ERQ",
    "marks": 8,
    "suggestedChapter": "Nuclear Physics",
    "solutionOrRubric": "1. Rutherford alpha scattering experiment description\\n2. Nuclear model observations\\n3. Two defects (continuous spectra & collapsing orbit)."
  }
]
`;

  parts.push({ text: prompt });

  console.log(`🤖 Calling Gemini Vision to extract Section B & Section C (Theory) for ${metadata.subject} ${metadata.year}...`);
  const response = await generateGeminiContentWithRetry(parts, {
    modelsToTry: ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-2.5-flash"],
    maxAttempts: 6,
    timeoutMs: 180000,
  });

  const raw = response.response.text();
  const parsed = parseJsonArray<SindhExtractedTheory>(raw);
  return parsed.map((q, idx) => ({
    ...q,
    questionNumber: q.questionNumber || idx + 1,
    questionText: normalizeScientificNotation(q.questionText),
  }));
}
