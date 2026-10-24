import { generateGeminiContentWithRetry } from "@/lib/ai/gemini";
import { sanitizeJsonEscapes } from "@/lib/ai/sanitize-json";

export type PracticalSubject = "physics" | "chemistry" | "biology" | "computer-science";
export type ClassLevel = "IX" | "X" | "XI" | "XII";

export interface ObservationTableColumn {
  key: string;
  label: string;
  unit?: string;
}

export interface ObservationTableData {
  title?: string;
  columns: ObservationTableColumn[];
  rows?: Record<string, string | number>[];
  note?: string;
}

export interface PracticalJournalEntry {
  id: string; // route slug (e.g. "ix-phy-vernier-caliper")
  expNo: number;
  subject: PracticalSubject;
  classLevel: ClassLevel;
  board: string;
  title: string;
  object: string;
  apparatus: string;
  theory: string[]; // array of theory paragraphs & formulas
  method: string[]; // step-by-step procedural directions
  observationTable?: ObservationTableData;
  calculation?: string[]; // specimen calculations or formulas applied
  result: string; // concise conclusion or numerical finding
  errors: string[]; // precautions and sources of error
  playRoute?: string; // virtual lab simulation route if available
}

export interface PracticalExtractionResult {
  practicals: PracticalJournalEntry[];
  rawSummary?: string;
}

/**
 * Normalizes subject string into canonical identifier
 */
export function normalizePracticalSubject(raw: string): PracticalSubject {
  const clean = raw.trim().toLowerCase();
  if (clean.includes("phys")) return "physics";
  if (clean.includes("chem")) return "chemistry";
  if (clean.includes("bio")) return "biology";
  if (clean.includes("computer") || /\b(cs|it|ict)\b/.test(clean)) return "computer-science";
  return "physics";
}

/**
 * Normalizes class strings (e.g. 'Grade IX', 'Class 9', 'SSC-I', 'HSSC-II', '9', 'IX')
 * into standard roman numerals: 'IX', 'X', 'XI', 'XII'.
 */
export function normalizeClassLevel(rawClass: string): ClassLevel {
  const clean = rawClass.trim().toUpperCase();
  if (
    clean.includes("SSC-I") ||
    clean.includes("SSC 1") ||
    clean.includes("SSC I") ||
    clean === "9" ||
    clean === "IX" ||
    clean.includes("GRADE IX") ||
    clean.includes("GRADE 9") ||
    clean.includes("CLASS IX") ||
    clean.includes("CLASS 9")
  ) {
    return "IX";
  }
  if (
    clean.includes("SSC-II") ||
    clean.includes("SSC 2") ||
    clean.includes("SSC II") ||
    clean === "10" ||
    clean === "X" ||
    clean.includes("GRADE X") ||
    clean.includes("GRADE 10") ||
    clean.includes("CLASS X") ||
    clean.includes("CLASS 10")
  ) {
    return "X";
  }
  if (
    clean.includes("HSSC-I") ||
    clean.includes("HSSC 1") ||
    clean.includes("HSSC I") ||
    clean === "11" ||
    clean === "XI" ||
    clean.includes("GRADE XI") ||
    clean.includes("GRADE 11") ||
    clean.includes("CLASS XI") ||
    clean.includes("CLASS 11")
  ) {
    return "XI";
  }
  if (
    clean.includes("HSSC-II") ||
    clean.includes("HSSC 2") ||
    clean.includes("HSSC II") ||
    clean === "12" ||
    clean === "XII" ||
    clean.includes("GRADE XII") ||
    clean.includes("GRADE 12") ||
    clean.includes("CLASS XII") ||
    clean.includes("CLASS 12")
  ) {
    return "XII";
  }
  return "XII";
}

function buildPracticalExtractionPrompt(
  textChunk: string,
  subject: PracticalSubject,
  classLevel: ClassLevel,
  board: string = "AKUEB"
): string {
  return `You are an expert high school and college science practical examiner and syllabus curriculum expert specializing in ${board} (Aga Khan University Examination Board / Pakistan National Curriculum).

Your task is to extract or generate ALL practical journal experiments for Subject: "${subject}", Class: "${classLevel}", Board: "${board}" from the provided document/context into a clean, complete, and strictly formatted JSON.

Target Requirements:
- Extract all required practical experiments for Class ${classLevel} ${subject}.
- For each practical experiment, generate standard, rigorous, and complete write-ups matching the official board practical journal format:
  1. "id": A URL-friendly unique slug (e.g., "${classLevel.toLowerCase()}-${subject.slice(0, 3)}-vernier-caliper" or "practical-vernier")
  2. "expNo": Integer number (1, 2, 3...)
  3. "subject": "${subject}"
  4. "classLevel": "${classLevel}"
  5. "board": "${board}"
  6. "title": Exact standard experiment title
  7. "object": Clear, formal statement of aim/objective ("To determine...", "To identify...", "To verify...")
  8. "apparatus": Exhaustive list of apparatus, glassware, measuring instruments, and chemical reagents needed
  9. "theory": Array of theoretical principles, formulas, mathematical relationships, and chemical equations (each paragraph as a string element)
  10. "method": Ordered step-by-step procedural steps (1., 2., 3., etc.) as an array of strings
  11. "observationTable": Object with { "title": string, "columns": [ { "key": string, "label": string, "unit": string } ], "rows": [ ...specimen data rows... ] }
  12. "calculation": Array of calculation steps, formulas applied, or sample arithmetic
  13. "result": Clear, conclusive final result statement with standard units or qualitative outcome
  14. "errors": Array of 4 to 6 critical precautions, experimental limitations, and sources of error

Input Content:
---
${textChunk}
---

Return ONLY valid JSON with this exact schema:
{
  "practicals": [
    {
      "id": "slug-name",
      "expNo": 1,
      "subject": "${subject}",
      "classLevel": "${classLevel}",
      "board": "${board}",
      "title": "Title of Experiment",
      "object": "Object statement",
      "apparatus": "Apparatus list",
      "theory": ["Theory paragraph 1", "Formula: ..."],
      "method": ["Step 1", "Step 2", "Step 3"],
      "observationTable": {
        "title": "Observation & Data Table",
        "columns": [
          { "key": "obsNo", "label": "Obs. No." },
          { "key": "val1", "label": "Measured Quantity", "unit": "cm" }
        ],
        "rows": [
          { "obsNo": 1, "val1": 10.5 }
        ]
      },
      "calculation": ["Calculation formula and substitution"],
      "result": "Final result statement.",
      "errors": [
        "Precaution / error 1",
        "Precaution / error 2"
      ]
    }
  ]
}
`;
}

/**
 * Extracts or synthesizes structured practical journal entries using Gemini AI
 */
export async function extractPracticalsFromText(
  text: string,
  subjectRaw: string,
  classRaw: string,
  board: string = "AKUEB"
): Promise<PracticalExtractionResult> {
  const subject = normalizePracticalSubject(subjectRaw);
  const classLevel = normalizeClassLevel(classRaw);

  const prompt = buildPracticalExtractionPrompt(text, subject, classLevel, board);

  console.log(`[AI] Processing practical journal extraction for ${subject} (${classLevel} - ${board})...`);
  const response = await generateGeminiContentWithRetry(prompt);
  const rawText = response.response.text();

  const cleanedJson = sanitizeJsonEscapes(rawText);
  let parsed: any;
  try {
    parsed = JSON.parse(cleanedJson);
  } catch (err: any) {
    console.error(`[AI] JSON parse failed, attempting regex extraction:`, err.message);
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Failed to extract valid JSON from AI response: ${rawText.slice(0, 300)}`);
    }
    parsed = JSON.parse(sanitizeJsonEscapes(jsonMatch[0]));
  }

  const practicalsList: PracticalJournalEntry[] = (parsed.practicals || []).map(
    (p: any, idx: number) => ({
      id: p.id || `practical-${classLevel.toLowerCase()}-${subject}-${idx + 1}`,
      expNo: typeof p.expNo === "number" ? p.expNo : idx + 1,
      subject: (p.subject || subject) as PracticalSubject,
      classLevel: (p.classLevel || classLevel) as ClassLevel,
      board: p.board || board,
      title: p.title || `Practical ${idx + 1}`,
      object: p.object || "",
      apparatus: p.apparatus || "",
      theory: Array.isArray(p.theory) ? p.theory : [String(p.theory || "")],
      method: Array.isArray(p.method) ? p.method : [String(p.method || "")],
      observationTable: p.observationTable || undefined,
      calculation: Array.isArray(p.calculation)
        ? p.calculation
        : p.calculation
        ? [String(p.calculation)]
        : [],
      result: p.result || "",
      errors: Array.isArray(p.errors) ? p.errors : [],
      playRoute: p.playRoute || undefined,
    })
  );

  return {
    practicals: practicalsList,
    rawSummary: `Extracted ${practicalsList.length} practical experiments for ${subject} Class ${classLevel}`,
  };
}
