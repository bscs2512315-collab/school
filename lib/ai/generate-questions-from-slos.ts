import { randomUUID } from "crypto";
import {
  generateGeminiContentWithRetry,
  getGeminiPaperModelsToTry,
} from "@/lib/ai/gemini";
import { sanitizeJsonEscapes } from "@/lib/ai/sanitize-json";
import type { SLO } from "@/lib/utils/syllabus-parser";
import { formatSlosForPrompt } from "@/lib/paper/extract-slos";

export interface SloGeneratedQuestion {
  id: string;
  questionNumber: number;
  questionPart: string | null;
  questionText: string;
  questionType: "MCQ" | "CRQ" | "ERQ";
  marks: number;
  sloNumber?: string | null;
  chapterName: string | null;
  chapterId: string | null;
  imageUrl: string | null;
  mcqOptions?: string[] | null;
  correctAnswer?: string | null;
  paperIIData?: {
    betterResponse?: string;
    weakerResponse?: string;
    markingNotes?: string;
  } | null;
}

interface GenerateFromSlosParams {
  paperType: "1" | "2";
  subject: string;
  classLevel: string;
  board: string;
  chapterName: string;
  chapterId: string;
  slos: SLO[];
  count: number;
  strictSloMatch?: boolean;
  difficulty?: "Alpha" | "Beta" | "Gamma";
}

const AI_BATCH_SIZE_PAPER1 = 12;
// Paper 2 CRQs include betterResponse/weakerResponse/markingNotes per question —
// large output. Keep batches small so Gemini responds quickly without truncation.
const AI_BATCH_SIZE_PAPER2 = 5;

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

function parseAiQuestionsPayload(text: string): Array<Record<string, unknown>> {
  const raw = sanitizeJsonEscapes(stripJsonFences(text));

  try {
    const parsed = JSON.parse(raw) as { questions?: unknown };
    if (Array.isArray(parsed.questions)) {
      return parsed.questions as Array<Record<string, unknown>>;
    }
    if (Array.isArray(parsed)) {
      return parsed as Array<Record<string, unknown>>;
    }
  } catch {
    // Fall through to salvage truncated JSON.
  }

  const match = raw.match(/"questions"\s*:\s*\[([\s\S]*)/);
  if (!match?.[1]) {
    throw new Error("Failed to parse AI-generated questions. Please try again.");
  }

  const salvaged = extractBalancedObjects(match[1])
    .map((chunk) => {
      try {
        return JSON.parse(chunk) as Record<string, unknown>;
      } catch {
        return null;
      }
    })
    .filter((row): row is Record<string, unknown> => Boolean(row));

  if (salvaged.length === 0) {
    throw new Error("Failed to parse AI-generated questions. Please try again.");
  }

  return salvaged;
}

function mapRowsToQuestions(
  rows: Array<Record<string, unknown>>,
  params: {
    isPaper1: boolean;
    chapterName: string;
    chapterId: string;
    count: number;
  },
): SloGeneratedQuestion[] {
  const { isPaper1, chapterName, chapterId, count } = params;
  return rows.slice(0, count).map((q, index) => {
    const id = randomUUID();
    if (isPaper1) {
      const options = Array.isArray(q.options)
        ? (q.options as string[])
        : ["A) Option A", "B) Option B", "C) Option C", "D) Option D"];
      const correct =
        String(q.correctAnswer ?? "A")
          .trim()
          .toUpperCase()
          .replace(/[^A-D]/g, "")
          .slice(0, 1) || "A";

      const sloNum = String(q.sloNumber || q.slo_number || q.sloCode || "").trim() || null;
      return {
        id,
        questionNumber: index + 1,
        questionPart: null,
        questionText:
          String(q.questionText ?? "").trim() || `Question ${index + 1}`,
        questionType: "MCQ" as const,
        marks: Number(q.marks) || 1,
        sloNumber: sloNum,
        chapterName,
        chapterId,
        imageUrl: null,
        mcqOptions: options,
        correctAnswer: correct,
      };
    }

    const qType =
      String(q.questionType ?? "CRQ").toUpperCase() === "ERQ" ? "ERQ" : "CRQ";
    const sloNum = String(q.sloNumber || q.slo_number || q.sloCode || "").trim() || null;
    return {
      id,
      questionNumber: index + 1,
      questionPart: null,
      questionText:
        String(q.questionText ?? "").trim() || `Question ${index + 1}`,
      questionType: qType as "CRQ" | "ERQ",
      marks: Number(q.marks) || (qType === "ERQ" ? 8 : 4),
      sloNumber: sloNum,
      chapterName,
      chapterId,
      imageUrl: null,
      paperIIData: {
        betterResponse: String(q.betterResponse ?? ""),
        weakerResponse: String(q.weakerResponse ?? ""),
        markingNotes: String(q.markingNotes ?? ""),
      },
    };
  });
}

async function generateQuestionsBatch(
  params: GenerateFromSlosParams,
): Promise<SloGeneratedQuestion[]> {
  const {
    paperType,
    subject,
    classLevel,
    board,
    chapterName,
    chapterId,
    slos,
    count,
    difficulty = "Beta",
  } = params;

  const sloBlock = formatSlosForPrompt(slos);
  const isPaper1 = paperType === "1";

  const alphaCount = Math.max(1, Math.floor(count / 2));
  const betaCount = count - alphaCount;

  const difficultyPromptRules = (() => {
    switch (difficulty) {
      case "Alpha":
        return `- DIFFICULTY LEVEL: ALPHA (EASY / FOUNDATIONAL)
  * Target Cognitive Levels: 80% Knowledge & Recall, 20% Direct Formula Application.
  * Direct definitions, standard formula recall, terminology, identifying facts, and straightforward single-step calculations.
  * Question phrasing should be clear, direct, and foundational without multi-step traps or complex scenarios.
  * For Paper 2 (Theory): Straightforward descriptive CRQs, direct definitions, stating laws, standard formulas, and simple single-step numericals with clear model answers.`;
      case "Gamma":
        return `- DIFFICULTY LEVEL: GAMMA (HARD / ADVANCED ENTRY-TEST & HIGH-ORDER CONCEPTUAL RIGOR - MDCAT / ECAT / GRIP SERIES LEVEL)
  * Target Cognitive Levels: 0% Basic Recall, 35% Analytical Application, 65% Higher-Order Synthesis, Critical Thinking & Evaluation.
  * STRICT PROHIBITION: NEVER generate simple recall, trivial definitions, or elementary questions (e.g. NEVER ask "Which of the following is NOT a type of charge?").
  * Mandatory Core Question Design Principles (inspired by competitive Pakistani entry-test standards like GRIP Entry Test Series / MDCAT / ECAT):
    1. Multi-Step Conceptual Reasoning: Combine multiple physical/chemical principles or sequential stages (e.g. potential difference combined with kinetic energy change q*ΔV = ΔK.E.; work done moving charge along an equipotential surface or closed loop = 0; dielectric replacement in capacitors; charge conservation during successive contacts).
    2. Proportional Scaling & Ratio Problems: Questions testing how physical quantities change when multiple parameters are altered (e.g. "Two charges are separated by distance d. If one charge is doubled and separation is reduced to one-third, the force becomes...", "If dielectric of constant 5 is replaced with 20, the capacitance becomes...").
    3. Sequential Charge Redistribution & Interactions: (e.g. "Body A with charge q touches neutral body B, then neutral body C; what is the charge on C?", "Two charged spheres of radii 10 cm and 15 cm connected by a thin wire; current ceases when potentials equalize (VA = VB), not charges", "Charges +2C and +6C repel with 12N; adding -2C to each makes one charge 0 so force becomes 0N").
    4. Field Geometry & Equipotentials: (e.g. points A, B, C in uniform field E where AB is perpendicular and BC is parallel to field lines; relationship between electric potentials VA, VB, VC; line of force density comparing field strengths EA vs EB).
    5. Energy & Circuit Traps: (e.g. energy supplied by battery W = qV = CV^2 vs energy stored (1/2)CV^2; series and parallel capacitor charge and voltage distributions).
    6. Diagrammatic Questions: Wherever suitable for the topic (circuits, electric fields, capacitor networks, charge geometries, curves, setups), INCLUDE an inline vector SVG diagram directly inside questionText!
       - Format: <svg viewBox="0 0 280 110" style="max-width:280px;margin:10px auto;display:block;" xmlns="http://www.w3.org/2000/svg">...</svg>
       - Use clean lines and geometric shapes with stroke="currentColor" and stroke-width="1.8".
       - DIAGRAM LABELS & WIRE RULES (CRITICAL):
         * ALWAYS add text-anchor="middle" and dominant-baseline="central" on all <text> elements so labels center accurately.
         * NEVER use raw LaTeX underscores in SVG text (e.g. NEVER write "C_1" or "K_1"). Use clean Unicode subscripts: "C₁", "K₁", "C₂", "K₂", "V₀", "Rₑq", "μF", "Ω".
         * Position labels with at least 15-20px generous breathing room from any divider lines, plates, or boundaries so text NEVER touches or overlaps lines.
         * NEVER draw an unbroken continuous wire straight through components or text. Break wire segments at component terminals, or give component shapes fill="var(--color-card, #ffffff)".
         * For capacitors: draw two distinct parallel plate lines (e.g. 10px apart) with the label placed cleanly above or below.
    7. Plausible Conceptual Distractors: All 4 options must be mathematically and conceptually plausible, targeting common student misconceptions (such as confusing equal potential with equal charge, or confusing energy stored with energy supplied).
    8. For Paper 2 (Theory - CRQ & ERQ): Multi-part analytical scenarios (parts a, b, c), multi-step mathematical derivations, graph/circuit diagram interpretation, comparing competing mechanisms, and detailed marking rubrics (betterResponse showing full derivation and conceptual reasoning, weakerResponse addressing common student pitfalls, markingNotes providing point breakdown).`;
      case "Beta":
      default:
        return `- DIFFICULTY LEVEL: BETA (BALANCED MIDDLE TIER - STRICT 50% ALPHA / 50% BETA SPLIT)
  * RIGID RATIO REQUIREMENT: In this batch of ${count} questions:
    - EXACTLY 50% OF QUESTIONS (Questions 1 to ${alphaCount}) MUST BE ALPHA DIFFICULTY: Foundational recall, core definitions, basic identifying facts, and single-step standard formulas.
    - EXACTLY 50% OF QUESTIONS (Questions ${alphaCount + 1} to ${count}) MUST BE BETA DIFFICULTY: Conceptual understanding, application of principles to new situations, proportional variation (e.g. "if distance is doubled and one charge is halved..."), circuit analysis, and moderate problem solving.
  * For Paper 2 (Theory): Exactly 50% foundational descriptive questions and 50% multi-part conceptual application CRQs/ERQs with standard numerical problem solving.
  * DO NOT generate all simple recall questions! Strictly enforce this 50/50 balance.`;
    }
  })();

  const prompt = isPaper1
    ? `You are an expert Pakistani board exam paper setter (${board}, Class ${classLevel}, ${subject}).

Generate exactly ${count} original Paper 1 MCQ questions based ONLY on these Student Learning Outcomes (SLOs) for "${chapterName}":

${sloBlock}

Rules:
- Each question must assess one or more SLOs above.
- Set sloNumber to the exact number of the SLO assessed by each question. Do not invent SLO numbers or cover content outside the listed outcomes.
- 4 options labeled A, B, C, D.
- Exactly one correct answer.
- Marks = 1 per question.
${difficultyPromptRules}
- Do NOT copy past-paper wording verbatim.
- Provide clear, detailed, and scenario-rich questions. Do NOT truncate problem statements or omit necessary physical context.
- Keep each option clear, concise, and consistent in format.
- NOTATION: Never use LaTeX (no \\frac, \\sqrt, \\times, \\begin{...}, $...$, etc.) since it breaks JSON parsing. Use plain text math instead: "^" for exponents (e.g. "x^2", "10^-8 C"), "_" for subscripts (e.g. "a_1", "V_A"), "sqrt(...)" for roots, "*" for multiplication, "/" for fractions, and matrices as nested arrays like "[[1, 2, 3], [4, 5, 6]]".

Return ONLY valid compact JSON (no markdown):
{"questions":[{"questionText":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correctAnswer":"A","marks":1,"sloNumber":"..."}]}`
    : `You are an expert Pakistani board exam paper setter (${board}, Class ${classLevel}, ${subject}).

Generate exactly ${count} original Paper 2 questions (mix CRQ and ERQ) based ONLY on these SLOs for "${chapterName}":

${sloBlock}

Rules:
- Prefer mostly CRQ (3–5 marks) and at most 1 ERQ (8–10 marks) in this batch.
- Include brief marking guidance (betterResponse, weakerResponse, markingNotes).
- Align each question to SLOs.
- Set sloNumber to the exact number of the SLO assessed by each question. Do not invent SLO numbers or cover content outside the listed outcomes.
${difficultyPromptRules}
- Provide comprehensive questions with realistic scenarios, diagrams where appropriate, and structured rubrics.
- NOTATION: Never use LaTeX (no \\frac, \\sqrt, \\times, \\begin{...}, $...$, etc.) since it breaks JSON parsing. Use plain text math instead: "^" for exponents (e.g. "x^2"), "_" for subscripts (e.g. "a_1"), "sqrt(...)" for roots, "*" for multiplication, "/" for fractions, and matrices as nested arrays like "[[1, 2, 3], [4, 5, 6]]".

Return ONLY valid compact JSON (no markdown):
{"questions":[{"questionText":"...","questionType":"CRQ","marks":4,"sloNumber":"...","betterResponse":"...","weakerResponse":"...","markingNotes":"..."}]}`;

  const result = await generateGeminiContentWithRetry(
    {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: difficulty === "Gamma" ? 0.45 : difficulty === "Beta" ? 0.35 : 0.25,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    },
    { modelsToTry: getGeminiPaperModelsToTry(), maxAttempts: 2, timeoutMs: 35000 },
  );

  const rows = parseAiQuestionsPayload(result.response.text());
  return mapRowsToQuestions(rows, {
    isPaper1,
    chapterName,
    chapterId,
    count,
  });
}

export async function generateQuestionsFromSlos(
  params: GenerateFromSlosParams,
): Promise<SloGeneratedQuestion[]> {
  const { slos, count, paperType, strictSloMatch = false } = params;
  if (slos.length === 0 || count <= 0) return [];

  const batchSize =
    paperType === "1" ? AI_BATCH_SIZE_PAPER1 : AI_BATCH_SIZE_PAPER2;
  const collected: SloGeneratedQuestion[] = [];
  const selectedSloNumbers = new Map(
    slos.map((slo) => [slo.sloNumber.trim().toLowerCase(), slo.sloNumber.trim()]),
  );

  let lastError: unknown = null;
  // Keep retry rounds low: the calling modal already handles client-side retry
  // batching. Extra rounds here multiply Gemini call time and cause 504 timeouts.
  const maxRounds = strictSloMatch ? 2 : 1;
  for (let round = 0; round < maxRounds && collected.length < count; round++) {
    const batchCounts: number[] = [];
    for (let remaining = count - collected.length; remaining > 0; remaining -= batchSize) {
      batchCounts.push(Math.min(batchSize, remaining));
    }

    // Generate at most two batches at once to keep large Paper 2 sets within
    // the request window without flooding the AI provider.
    for (let offset = 0; offset < batchCounts.length; offset += 2) {
      const results = await Promise.allSettled(
        batchCounts.slice(offset, offset + 2).map((batchCount) =>
          generateQuestionsBatch({ ...params, count: batchCount }),
        ),
      );

      for (const result of results) {
        if (result.status === "rejected") {
          lastError = result.reason;
          continue;
        }

        const validBatch = strictSloMatch
          ? result.value.flatMap((question) => {
              const selectedNumber = selectedSloNumbers.get(
                question.sloNumber?.trim().toLowerCase() ?? "",
              );
              return selectedNumber ? [{ ...question, sloNumber: selectedNumber }] : [];
            })
          : result.value;

        for (const question of validBatch) {
          if (collected.length >= count) break;
          collected.push({ ...question, questionNumber: collected.length + 1 });
        }
      }
    }
  }

  if (strictSloMatch && collected.length < count) {
    const detail = lastError instanceof Error ? ` ${lastError.message}` : "";
    throw new Error(`Could not generate ${count} questions tied to the selected SLOs (${collected.length} ready).${detail}`);
  }

  if (collected.length === 0 && lastError) {
    throw lastError;
  }

  return collected.slice(0, count);
}
