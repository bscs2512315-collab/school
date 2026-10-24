import { randomUUID } from "crypto";
import {
  generateGeminiContentWithRetry,
  getGeminiPaperModelsToTry,
} from "@/lib/ai/gemini";
import { fetchImageAsBase64 } from "@/lib/ai/vision-image";
import { sanitizeJsonEscapes } from "@/lib/ai/sanitize-json";
import type { GeneratedSloPaperQuestion } from "@/lib/paper/slo-paper-generator";

export interface CustomPaperGenerationParams {
  paperType: "1" | "2";
  count?: number;
  prompt?: string;
  imageUrls?: string[];
  subject?: string;
  classLevel?: string;
  board?: string;
  includeAnswers?: boolean;
  difficulty?: "Alpha" | "Beta" | "Gamma";
}

function stripJsonFences(text: string): string {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractBalancedObjects(arrayBody: string): string[] {
  const objects: string[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < arrayBody.length; i++) {
    const ch = arrayBody[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }

    if (ch === "}") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        objects.push(arrayBody.slice(start, i + 1));
        start = -1;
      }
    }
  }

  return objects;
}

function parseAiQuestions(text: string): Array<Record<string, unknown>> {
  const clean = sanitizeJsonEscapes(stripJsonFences(text));
  try {
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) return parsed as Array<Record<string, unknown>>;
    if (parsed && typeof parsed === "object") {
      if (Array.isArray(parsed.questions)) {
        return parsed.questions as Array<Record<string, unknown>>;
      }
      if (Array.isArray(parsed.items)) {
        return parsed.items as Array<Record<string, unknown>>;
      }
    }
  } catch {
    // Fall back to balanced object extraction
  }

  const match = clean.match(/"questions"\s*:\s*\[([\s\S]*)/);
  const targetText = match?.[1] || clean;
  const salvaged = extractBalancedObjects(targetText)
    .map((chunk) => {
      try {
        return JSON.parse(chunk) as Record<string, unknown>;
      } catch {
        return null;
      }
    })
    .filter((row): row is Record<string, unknown> => Boolean(row));

  if (salvaged.length > 0) return salvaged;
  throw new Error("Could not parse AI-generated questions. Please try again.");
}

function letterId(index: number): string {
  return String.fromCharCode(65 + index);
}

function mapRawQuestions(
  rawList: Array<Record<string, unknown>>,
  paperType: "1" | "2",
  startIndex: number,
  subject?: string,
): GeneratedSloPaperQuestion[] {
  return rawList.map((raw, idx) => {
    const qIndex = startIndex + idx + 1;
    const questionText = String(raw.questionText || raw.text || raw.question || `Question ${qIndex}`).trim();
    const marks = Number(raw.marks) || (paperType === "1" ? 1 : 4);
    const chapterName = (raw.chapterName as string) || (raw.topic as string) || subject || null;

    if (paperType === "1") {
      const rawOptions = Array.isArray(raw.options) || Array.isArray(raw.mcqOptions)
        ? ((raw.options || raw.mcqOptions) as any[])
        : [];

      const mcqOptions = [0, 1, 2, 3].map((i) => {
        const opt = rawOptions[i];
        if (opt && typeof opt === "object" && "text" in opt) {
          return {
            id: String(opt.id || letterId(i)),
            text: String(opt.text || "").trim() || `Option ${letterId(i)}`,
          };
        }
        const text = String(opt || "").replace(/^[A-D][).:\-]\s*/i, "").trim();
        return {
          id: letterId(i),
          text: text || `Option ${letterId(i)}`,
        };
      });

      let rawCorrect = String(raw.correctAnswer || raw.correctOption || raw.answer || "A")
        .trim()
        .toUpperCase()
        .replace(/[^A-D]/g, "")
        .slice(0, 1);
      if (!["A", "B", "C", "D"].includes(rawCorrect)) {
        rawCorrect = "A";
      }

      return {
        id: randomUUID(),
        questionNumber: qIndex,
        questionPart: null,
        questionText,
        questionType: "MCQ",
        marks: 1,
        chapterName,
        chapterId: null,
        imageUrl: null,
        mcqOptions,
        correctAnswer: rawCorrect,
      };
    }

    const questionType = String(raw.questionType || "CRQ").toUpperCase() === "ERQ" ? "ERQ" : "CRQ";
    const paperII = (raw.paperIIData || raw) as Record<string, unknown>;

    return {
      id: randomUUID(),
      questionNumber: qIndex,
      questionPart: null,
      questionText,
      questionType,
      marks: questionType === "ERQ" ? Math.max(marks, 7) : Math.min(Math.max(marks, 3), 6),
      chapterName,
      chapterId: null,
      imageUrl: null,
      paperIIData: {
        betterResponse: String(paperII.betterResponse || paperII.sampleAnswer || paperII.solution || ""),
        weakerResponse: String(paperII.weakerResponse || paperII.commonMistakes || ""),
        markingNotes: String(paperII.markingNotes || paperII.markingCriteria || paperII.rubric || ""),
      },
    };
  });
}

/**
 * Generate 25 custom exam questions from text prompt, reference images, or both.
 */
export async function generateCustomPaperQuestions(
  params: CustomPaperGenerationParams,
): Promise<{
  title: string;
  subject: string;
  totalQuestions: number;
  totalMarks: number;
  questions: GeneratedSloPaperQuestion[];
}> {
  const {
    paperType,
    count = 25,
    prompt: userPrompt,
    imageUrls = [],
    subject = "General",
    classLevel = "X",
    board = "AKUEB",
  } = params;

  const targetCount = count;
  const isPaper1 = paperType === "1";

  // 1. Fetch images if provided
  const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
  if (Array.isArray(imageUrls) && imageUrls.length > 0) {
    const fetched = await Promise.allSettled(
      imageUrls.slice(0, 5).map((url) => fetchImageAsBase64(url)),
    );
    for (const res of fetched) {
      if (res.status === "fulfilled") {
        imageParts.push({
          inlineData: {
            mimeType: res.value.mimeType,
            data: res.value.base64,
          },
        });
      }
    }
  }

  const contextBits = [
    `Board / Curriculum: ${board}`,
    `Class: ${classLevel}`,
    `Subject: ${subject}`,
  ].join(" · ");

  const hasImages = imageParts.length > 0;
  const hasPrompt = Boolean(userPrompt && userPrompt.trim());

  if (!hasImages && !hasPrompt) {
    throw new Error("Please provide a prompt or upload at least one reference image.");
  }

  // 2. Batch generate to produce exactly targetCount (e.g. 25 questions)
  const batchSize = isPaper1 ? 13 : 8; // e.g. 13+12 = 25 for Paper 1, 8+8+9 = 25 for Paper 2
  const allQuestions: GeneratedSloPaperQuestion[] = [];

  let batchIteration = 0;
  while (allQuestions.length < targetCount && batchIteration < 5) {
    batchIteration += 1;
    const remainingNeed = targetCount - allQuestions.length;
    const thisBatchCount = Math.min(batchSize, remainingNeed);
    const startIndex = allQuestions.length;

    const sourceInstruction = hasImages && hasPrompt
      ? `The user uploaded reference images AND provided this prompt: "${userPrompt?.trim()}". Synthesize both the image contents and the instructions.`
      : hasImages
        ? `The user uploaded reference image(s) (notes/diagrams/textbook pages). Formulate questions strictly aligned to and based upon the provided image content.`
        : `The user requested: "${userPrompt?.trim()}". Generate questions focusing thoroughly on these topics and instructions.`;

    const formatSchema = isPaper1
      ? `{"questions":[{"questionText":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correctAnswer":"A","marks":1,"topic":"..."}]}`
      : `{"questions":[{"questionText":"...","questionType":"CRQ","marks":4,"topic":"...","betterResponse":"...","weakerResponse":"...","markingNotes":"..."}]}`;

    const difficulty = params.difficulty || "Beta";
    const alphaCount = Math.max(1, Math.floor(thisBatchCount / 2));

    const difficultyPromptRules = (() => {
      switch (difficulty) {
        case "Alpha":
          return `- DIFFICULTY LEVEL: ALPHA (EASY / FOUNDATIONAL)
  * Target Cognitive Levels: 80% Knowledge & Recall, 20% Direct Formula Application.
  * Direct definitions, standard formula recall, terminology, identifying facts, and straightforward single-step calculations.
  * Question phrasing should be clear, direct, and foundational without multi-step traps or complex scenarios.
  * For Paper 2 (Theory): Straightforward descriptive CRQs, direct definitions, stating laws, and simple single-step calculations with clear rubrics.`;
        case "Gamma":
          return `- DIFFICULTY LEVEL: GAMMA (HARD / ADVANCED ENTRY-TEST & HIGH-ORDER CONCEPTUAL RIGOR - MDCAT / ECAT / GRIP SERIES LEVEL)
  * Target Cognitive Levels: 0% Basic Recall, 35% Analytical Application, 65% Higher-Order Synthesis, Critical Thinking & Evaluation.
  * STRICT PROHIBITION: NEVER generate simple recall, trivial definitions, or elementary questions.
  * Mandatory Core Question Design Principles (inspired by competitive Pakistani entry-test standards like GRIP Entry Test Series / MDCAT / ECAT):
    1. Multi-Step Conceptual Reasoning: Combine multiple principles or sequential stages (e.g. potential difference combined with kinetic energy change q*ΔV = ΔK.E.; work done along equipotential surfaces or closed loops; dielectric replacement in capacitors; charge conservation during successive contacts).
    2. Proportional Scaling & Ratio Problems: Questions testing how physical quantities change when multiple parameters are altered (e.g. "Two charges separated by distance d; if one charge is doubled and separation reduced to one-third, force becomes...").
    3. Sequential Processes & Interactions: (e.g. successive contact charge sharing, connected unequal spheres where potentials equalize rather than charges).
    4. Field Geometry & Equipotentials: (e.g. points in uniform field perpendicular vs parallel to field lines; line of force density comparing field strengths).
    5. Diagrammatic Questions: Wherever suitable for the topic (circuits, electric fields, capacitor networks, charge geometries, curves), INCLUDE an inline vector SVG diagram directly inside questionText:
       - Format: <svg viewBox="0 0 280 110" style="max-width:280px;margin:10px auto;display:block;" xmlns="http://www.w3.org/2000/svg">...</svg>
       - Use clean lines and geometric shapes with stroke="currentColor" and stroke-width="1.8".
       - DIAGRAM LABELS & WIRE RULES (CRITICAL):
         * ALWAYS add text-anchor="middle" and dominant-baseline="central" on all <text> elements so labels center accurately.
         * NEVER use raw LaTeX underscores in SVG text (e.g. NEVER write "C_1" or "K_1"). Use clean Unicode subscripts: "C₁", "K₁", "C₂", "K₂", "V₀", "Rₑq", "μF", "Ω".
         * Position labels with at least 15-20px generous breathing room from any divider lines, plates, or boundaries so text NEVER touches or overlaps lines.
         * NEVER draw an unbroken continuous wire straight through components or text. Break wire segments at component terminals, or give component shapes fill="var(--color-card, #ffffff)".
         * For capacitors: draw two distinct parallel plate lines (e.g. 10px apart) with the label placed cleanly above or below.
    6. Plausible Conceptual Distractors: All 4 options must be mathematically and conceptually plausible, targeting common student misconceptions.
    7. For Paper 2 (Theory - CRQ & ERQ): Multi-part analytical scenarios (parts a, b, c), multi-step mathematical derivations, graph/circuit diagram interpretation, comparing competing mechanisms, and detailed marking rubrics (betterResponse showing full derivation and conceptual reasoning, weakerResponse addressing common student pitfalls, markingNotes providing point breakdown).`;
        case "Beta":
        default:
          return `- DIFFICULTY LEVEL: BETA (BALANCED MIDDLE TIER - STRICT 50% ALPHA / 50% BETA SPLIT)
  * RIGID RATIO REQUIREMENT: In this batch of ${thisBatchCount} questions:
    - EXACTLY 50% OF QUESTIONS (Questions 1 to ${alphaCount}) MUST BE ALPHA DIFFICULTY: Foundational recall, core definitions, basic identifying facts, and single-step standard formulas.
    - EXACTLY 50% OF QUESTIONS (Questions ${alphaCount + 1} to ${thisBatchCount}) MUST BE BETA DIFFICULTY: Conceptual understanding, application of principles to new situations, proportional variation (e.g. "if distance is doubled and one charge is halved..."), circuit analysis, and moderate problem solving.
  * For Paper 2 (Theory): Exactly 50% foundational descriptive questions and 50% multi-part conceptual application CRQs/ERQs with standard numerical problem solving.
  * DO NOT generate all simple recall questions! Strictly enforce this 50/50 balance.`;
      }
    })();

    const promptText = `You are Nova, an expert Pakistani board exam paper creator (${board}, Class ${classLevel}, Subject: ${subject}).

${sourceInstruction}
Context: ${contextBits}

Task:
Generate batch ${batchIteration} of questions containing EXACTLY ${thisBatchCount} original ${isPaper1 ? "Paper 1 Multiple Choice Questions (MCQs)" : "Paper 2 Structured Questions (CRQ/ERQ)"}.

Rules:
- Questions must be academic, rigorous, unambiguous, and formatted for Pakistani secondary/higher secondary exams.
${difficultyPromptRules}
${isPaper1 ? `- Each MCQ MUST have 4 options labeled A, B, C, D and exactly one correctAnswer (A, B, C, or D). Marks = 1.` : `- Use CRQ (3-5 marks) for short structured questions, and ERQ (7-10 marks) for comprehensive questions. Include model betterResponse, weakerResponse, and markingNotes.`}
- Provide clear, detailed, and scenario-rich questions. Do NOT truncate problem statements or omit necessary physical context.
- NOTATION: Never use LaTeX (no \\frac, \\sqrt, \\times, \\begin{...}, $...$, etc.) since it breaks JSON parsing. Use plain text math instead: "^" for exponents (e.g. "x^2"), "_" for subscripts (e.g. "a_1"), "sqrt(...)" for roots, "*" for multiplication, "/" for fractions, and matrices as nested arrays like "[[1, 2, 3], [4, 5, 6]]".
- Return ONLY a valid compact JSON object with a "questions" array. No Markdown, no preamble.
Format:
${formatSchema}`;

    const contentParts: any[] = [...imageParts, { text: promptText }];

    const result = await generateGeminiContentWithRetry(
      {
        contents: [{ role: "user", parts: contentParts }],
        generationConfig: {
          temperature: difficulty === "Gamma" ? 0.45 : difficulty === "Beta" ? 0.35 : 0.25,
          responseMimeType: "application/json",
          maxOutputTokens: 8192,
        },
      },
      { modelsToTry: getGeminiPaperModelsToTry() },
    );

    const parsedRows = parseAiQuestions(result.response.text());
    const mapped = mapRawQuestions(parsedRows, paperType, startIndex, subject);
    if (mapped.length === 0) break;
    allQuestions.push(...mapped);
  }

  const finalQuestions = allQuestions.slice(0, targetCount).map((q, idx) => ({
    ...q,
    questionNumber: idx + 1,
  }));

  if (finalQuestions.length === 0) {
    throw new Error("Nova could not generate questions from the provided input. Please try with clearer instructions or images.");
  }

  const generatedTitle = hasPrompt
    ? `${subject} · ${userPrompt!.trim().slice(0, 45)}`
    : `${subject} · Custom Reference Paper`;

  const totalMarks = finalQuestions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  return {
    title: generatedTitle,
    subject,
    totalQuestions: finalQuestions.length,
    totalMarks,
    questions: finalQuestions,
  };
}
