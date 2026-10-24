import { randomUUID } from "crypto";
import {
  generateGeminiContentWithRetry,
  getGeminiPaperModelsToTry,
} from "@/lib/ai/gemini";
import { fetchImageAsBase64 } from "@/lib/ai/vision-image";
import { sanitizeJsonEscapes } from "@/lib/ai/sanitize-json";
import type { GeneratedSloPaperQuestion } from "@/lib/paper/slo-paper-generator";
import type { CustomQuizQuestion } from "@/types/custom-quiz";

export interface ImagePaperGenerationParams {
  imageUrl: string;
  imageMimeType?: string;
  paperType: "1" | "2";
  questionCount?: number;
  subjectHint?: string | null;
  classHint?: string | null;
  boardHint?: string | null;
  difficulty?: "Alpha" | "Beta" | "Gamma";
  userPrompt?: string;
}

function clampQuestionCount(paperType: "1" | "2", count?: number): number {
  if (count === undefined || count === null || count <= 0) {
    return paperType === "2" ? 5 : 20;
  }
  if (paperType === "2") return Math.min(Math.max(count, 1), 10);
  return Math.min(Math.max(count, 1), 40);
}

function parseJsonObject(text: string): Record<string, unknown> {
  let jsonText = text.trim();
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/```\n?/g, "").replace(/```\n?/g, "");
  }
  try {
    return JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    return JSON.parse(sanitizeJsonEscapes(jsonText)) as Record<string, unknown>;
  }
}

function letterId(index: number): string {
  return String.fromCharCode(65 + index);
}

/**
 * Uses Gemini vision to turn an uploaded notes/question photo into a structured
 * Paper 1 (MCQ) or Paper 2 (CRQ/ERQ) question set.
 * Supports exact MCQ extraction, diagram/graph/chart SVG recreation, and difficulty filtering.
 */
export async function generatePaperQuestionsFromImage(
  params: ImagePaperGenerationParams,
): Promise<{
  title: string;
  subject: string | null;
  questions: GeneratedSloPaperQuestion[];
}> {
  const isExactCountSpecified = Boolean(params.questionCount && params.questionCount > 0);
  const targetCount = clampQuestionCount(params.paperType, params.questionCount);
  const { base64, mimeType } = await fetchImageAsBase64(
    params.imageUrl,
    params.imageMimeType,
  );

  const paperLabel = params.paperType === "1" ? "Paper 1 (MCQs)" : "Paper 2 (CRQ/ERQ)";
  const profileBits = [
    params.boardHint ? `Board: ${params.boardHint}` : null,
    params.classHint ? `Class: ${params.classHint}` : null,
    params.subjectHint ? `Subject: ${params.subjectHint}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const difficulty = params.difficulty;
  const difficultyRules = (() => {
    switch (difficulty) {
      case "Alpha":
        return `DIFFICULTY FILTER: ALPHA (FOUNDATIONAL / EASY)
- The user requested ALPHA difficulty.
- Target Cognitive Level: Direct Recall, Basic Definitions, Core Terminology, and Single-Step Standard Formulas.
- If the image contains MCQs of different difficulty levels, FILTER AND SELECT ONLY the foundational, straightforward recall and direct formula questions.
- Exclude multi-step traps, complex analysis, or tricky distractors.
- If the image contains fewer Alpha questions than needed, extract all available Alpha questions and generate direct, foundational questions from the image content.`;
      case "Gamma":
        return `DIFFICULTY FILTER: GAMMA (HARD / ADVANCED ENTRY-TEST RIGOR - MDCAT / ECAT / GRIP SERIES)
- The user requested GAMMA difficulty.
- Target Cognitive Level: 0% Basic Recall, 35% Analytical Application, 65% Higher-Order Critical Thinking & Multi-Step Reasoning.
- Strictly exclude simple definitions or 1-step recall.
- If the image contains MCQs of multiple difficulty levels, FILTER AND SELECT ONLY the most challenging, high-order, diagrammatic, and multi-step analytical questions.
- If the image contains fewer Gamma-level MCQs than needed, elevate the questions from the image by testing underlying mechanisms, ratio scaling, or multi-step problem solving based strictly on the image's topics and diagrams!`;
      case "Beta":
        return `DIFFICULTY FILTER: BETA (BALANCED / INTERMEDIATE)
- The user requested BETA difficulty.
- Target Cognitive Level: Conceptual Understanding, Application of Principles, Standard Calculations, and Moderate Circuit/Graph Analysis.
- Filter and select moderate-tier application questions from the image.`;
      default:
        return `DIFFICULTY:
- If the user asked to extract MCQs from the image, extract all matching questions from the image.
- For each question, classify its difficulty accurately as "Alpha", "Beta", or "Gamma" in the "difficulty" field.`;
    }
  })();

  const schemaHint =
    params.paperType === "1"
      ? `{
  "title": "short quiz title",
  "subject": "inferred subject or null",
  "questions": [
    {
      "questionText": "Question stem text. If the question has a diagram, graph, chart, circuit, or visual figure, include the recreated inline vector <svg ...>...</svg> right here inside questionText!",
      "questionType": "MCQ",
      "marks": 1,
      "difficulty": "Alpha | Beta | Gamma",
      "mcqOptions": [
        { "id": "A", "text": "option A text" },
        { "id": "B", "text": "option B text" },
        { "id": "C", "text": "option C text" },
        { "id": "D", "text": "option D text" }
      ],
      "correctAnswer": "A",
      "explanation": "clear, step-by-step why"
    }
  ]
}`
      : `{
  "title": "short paper title",
  "subject": "inferred subject or null",
  "questions": [
    {
      "questionText": "CRQ/ERQ prompt (with inline <svg ...>...</svg> if diagram or graph is referenced)",
      "questionType": "CRQ",
      "marks": 5,
      "difficulty": "Alpha | Beta | Gamma",
      "paperIIData": {
        "betterResponse": "model strong answer",
        "weakerResponse": "common weaker answer",
        "markingNotes": "what examiners look for"
      }
    }
  ]
}`;

  const prompt = `You are Nova, an expert exam paper generator and question extractor for Pakistani board students (Class IX–XII).

The user uploaded an image of notes, a textbook page, an exam/test sheet, or worksheet to create a ${paperLabel} practice set.

${params.userPrompt ? `User's specific instruction: "${params.userPrompt}"` : ""}
${params.difficulty ? `Requested Difficulty Filter: **${params.difficulty}**` : ""}
${profileBits ? `Student defaults: ${profileBits}` : ""}

============================================================
CRITICAL INSTRUCTION 1: TRANSCRIBE EXISTING MCQS / QUESTIONS
============================================================
Carefully examine the image to see if it already contains printed, typed, or handwritten questions/MCQs.
- IF THE IMAGE ALREADY CONTAINS MCQs / QUESTIONS:
  * YOU MUST EXTRACT AND CONVERT THE ACTUAL MCQs DIRECTLY FROM THE IMAGE into the ExBoardAI format!
  * Do NOT discard or replace them with unrelated synthetic questions.
  * Extract question text and all 4 options (A, B, C, D). If options in the image are marked (1,2,3,4) or (a,b,c,d), map them cleanly to A, B, C, D.
  * Determine the correct answer (A/B/C/D) based on academic correctness (or indicated answer key if marked on the image).
  * Provide a clear, educational explanation for why that answer is correct.
- IF THE IMAGE CONTAINS NOTES / TEXTBOOK CONTENT (no pre-written MCQs):
  * Formulate high-quality exam questions strictly based on the topics, formulas, and diagrams shown in the image.

============================================================
CRITICAL INSTRUCTION 2: REPRODUCE DIAGRAMS, GRAPHS & CHARTS
============================================================
Many exam questions depend directly on a diagram, graph, chart, circuit, or visual illustration (e.g. Velocity-Time graphs, P-V cycles, force-extension curves, electric circuits, ray optics, geometries).
- If ANY question in the image has or refers to a diagram, graph, chart, circuit, or visual figure:
  * YOU MUST RECREATE AND EMBED AN INLINE VECTOR <svg> DIAGRAM DIRECTLY INSIDE "questionText"!
  * NEVER OMIT THE DIAGRAM. An MCQ referring to "in the given figure" or "from the graph" without the diagram is broken and unsolvable!
  * Diagram Format:
    <svg viewBox="0 0 320 180" style="max-width:320px;width:100%;height:auto;margin:12px auto;display:block;" xmlns="http://www.w3.org/2000/svg">...</svg>
  * Rules for Graphs & Charts:
    - Draw axes with arrowheads: e.g. <line x1="40" y1="150" x2="290" y2="150" stroke="currentColor" stroke-width="1.8"/>
    - Label axes with variable names and units (e.g. "Velocity (m/s)", "Time (s)", "Force (N)", "Extension (m)").
    - Include tick marks, numerical values, and plot the exact line, curve, slope, or bar from the image.
  * Rules for Circuits:
    - Draw circuit loops with clean components: resistors (zigzag/box), capacitors (parallel lines), inductors (loops), DC/AC sources (+/-), switches, and meters (A, V).
    - Do NOT draw continuous wire lines cutting through components or text labels.
  * Rules for SVG Styling & Text:
    - Use stroke="currentColor" and fill="none" (or fill="currentColor" for text/dots/arrows) so it displays crisply in both Dark and Light mode.
    - Set text-anchor="middle" dominant-baseline="central" fill="currentColor" font-size="12" font-family="sans-serif" on <text> elements.
    - NEVER use raw LaTeX inside SVG text (use clean Unicode like "v₁", "C₁", "θ", "Ω", "μF", "m/s²").
    - Give labels 10-15px clearance so text NEVER touches or overlaps lines.

============================================================
CRITICAL INSTRUCTION 3: DIFFICULTY FILTERING & TARGET COUNT
============================================================
${difficultyRules}
- If the user requested a specific difficulty (${difficulty || "any"}), ensure the returned questions strictly adhere to that difficulty tier.
- Target question count: ${isExactCountSpecified ? `exactly ${targetCount}` : `up to ${targetCount} matching questions (if image has fewer, return all of them without adding filler)`}.

============================================================
CRITICAL INSTRUCTION 4: MATH NOTATION & JSON RULES
============================================================
- Pakistani board exam style: clear wording, exam-ready.
- NOTATION: Never use LaTeX (no \\frac, \\sqrt, \\times, \\begin{...}, $...$, etc.) since it breaks JSON parsing. Use plain text math instead: "^" for exponents (e.g. "x^2"), "_" for subscripts (e.g. "a_1"), "sqrt(...)" for roots, "*" for multiplication, "/" for fractions, and matrices as nested arrays like "[[1, 2, 3], [4, 5, 6]]".
- Return ONLY valid JSON matching this schema:
${schemaHint}`;

  const result = await generateGeminiContentWithRetry(
    {
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.35,
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
      },
    },
    { modelsToTry: getGeminiPaperModelsToTry() },
  );

  const parsed = parseJsonObject(result.response.text());
  const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
  if (rawQuestions.length === 0) {
    throw new Error("Nova could not extract questions from this image. Try a clearer photo.");
  }

  const title =
    typeof parsed.title === "string" && parsed.title.trim()
      ? parsed.title.trim()
      : difficulty
        ? `${difficulty} Practice · ${paperLabel}`
        : `Practice from image · ${paperLabel}`;
  const subject =
    typeof parsed.subject === "string" && parsed.subject.trim()
      ? parsed.subject.trim()
      : params.subjectHint ?? null;

  const finalQuestionsSlice = isExactCountSpecified
    ? rawQuestions.slice(0, targetCount)
    : rawQuestions.slice(0, 40);

  const questions: GeneratedSloPaperQuestion[] = finalQuestionsSlice
    .map((raw, index) => {
      const q = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
      const questionText = String(q.questionText ?? "").trim();
      const marks = Number(q.marks) || (params.paperType === "1" ? 1 : 5);
      const diffRaw = String(q.difficulty ?? params.difficulty ?? "Beta");
      const diffNormalized = ["Alpha", "Beta", "Gamma"].includes(diffRaw)
        ? (diffRaw as "Alpha" | "Beta" | "Gamma")
        : "Beta";
      const explanation = typeof q.explanation === "string" ? q.explanation.trim() : null;

      if (params.paperType === "1") {
        const rawOptions = Array.isArray(q.mcqOptions) ? q.mcqOptions : [];
        const mcqOptions = [0, 1, 2, 3].map((i) => {
          const opt = rawOptions[i];
          if (opt && typeof opt === "object") {
            const o = opt as { id?: string; text?: string };
            return {
              id: String(o.id || letterId(i)),
              text: String(o.text ?? "").trim() || `Option ${letterId(i)}`,
            };
          }
          return { id: letterId(i), text: `Option ${letterId(i)}` };
        });
        const correctAnswer = String(q.correctAnswer ?? "A")
          .trim()
          .toUpperCase()
          .slice(0, 1);
        return {
          id: randomUUID(),
          questionNumber: index + 1,
          questionPart: null,
          questionText: questionText || `Question ${index + 1}`,
          questionType: "MCQ",
          marks: 1,
          difficulty: diffNormalized,
          explanation,
          chapterName: null,
          chapterId: null,
          imageUrl: q.hasImage ? params.imageUrl : (typeof q.imageUrl === "string" ? q.imageUrl : null),
          mcqOptions,
          correctAnswer: ["A", "B", "C", "D"].includes(correctAnswer)
            ? correctAnswer
            : "A",
        };
      }

      const paperII =
        q.paperIIData && typeof q.paperIIData === "object"
          ? (q.paperIIData as Record<string, unknown>)
          : {};
      const questionType =
        String(q.questionType ?? "CRQ").toUpperCase() === "ERQ" ? "ERQ" : "CRQ";

      return {
        id: randomUUID(),
        questionNumber: index + 1,
        questionPart: null,
        questionText: questionText || `Question ${index + 1}`,
        questionType,
        marks: Math.min(Math.max(marks, 3), 10),
        difficulty: diffNormalized,
        explanation,
        chapterName: null,
        chapterId: null,
        imageUrl: q.hasImage ? params.imageUrl : (typeof q.imageUrl === "string" ? q.imageUrl : null),
        paperIIData: {
          betterResponse: String(paperII.betterResponse ?? ""),
          weakerResponse: String(paperII.weakerResponse ?? ""),
          markingNotes: String(paperII.markingNotes ?? ""),
        },
      };
    });

  return { title, subject, questions };
}

export function toCustomQuizQuestions(
  questions: GeneratedSloPaperQuestion[],
): CustomQuizQuestion[] {
  return questions
    .filter((q) => q.questionType === "MCQ" && q.mcqOptions?.length)
    .map((q) => {
      const options = (q.mcqOptions ?? []).map((opt) => ({
        id: opt.id,
        text: opt.text,
      }));
      const correctOptionId =
        options.find((opt) => opt.id === q.correctAnswer)?.id ?? options[0]?.id ?? "A";
      return {
        id: q.id,
        text: q.questionText,
        options,
        correctOptionId,
        explanation: q.explanation || undefined,
      };
    });
}
