import { generateGeminiContentWithRetry } from "@/lib/ai/gemini";
import { sanitizeJsonEscapes } from "@/lib/ai/sanitize-json";

export interface ExtractedSLO {
  sloNumber: string;
  sloText: string;
  cognitiveLevel: string; // 'R' | 'U' | 'A' | 'FA' (or legacy 'K' | 'CA')
}

export interface ExtractedSubtopic {
  subtopicNumber: string;
  subtopicName: string;
  slos: ExtractedSLO[];
}

export interface ExtractedChapter {
  chapterNumber: number;
  chapterName: string;
  subtopics: ExtractedSubtopic[];
}

export interface ExtractedCurriculum {
  classLevel: string; // 'IX' | 'X' | 'XI' | 'XII'
  board: string; // e.g. 'AKUEB'
  subject: string;
  chapters: ExtractedChapter[];
}

export interface SyllabusExtractionResult {
  curriculums: ExtractedCurriculum[];
  rawSummary?: string;
}

/**
 * Normalizes class strings (e.g. 'Grade IX', 'Class 9', 'SSC-I', 'HSSC-II', '9', 'IX')
 * into standard roman numerals: 'IX', 'X', 'XI', 'XII'.
 */
export function normalizeClassLevel(rawClass: string): string {
  const clean = rawClass.trim().toUpperCase();
  if (clean.includes("SSC-I") || clean.includes("SSC 1") || clean.includes("SSC I") || clean === "9" || clean === "IX" || clean.includes("GRADE IX") || clean.includes("GRADE 9") || clean.includes("CLASS IX") || clean.includes("CLASS 9")) {
    return "IX";
  }
  if (clean.includes("SSC-II") || clean.includes("SSC 2") || clean.includes("SSC II") || clean === "10" || clean === "X" || clean.includes("GRADE X") || clean.includes("GRADE 10") || clean.includes("CLASS X") || clean.includes("CLASS 10")) {
    return "X";
  }
  if (clean.includes("HSSC-I") || clean.includes("HSSC 1") || clean.includes("HSSC I") || clean === "11" || clean === "XI" || clean.includes("GRADE XI") || clean.includes("GRADE 11") || clean.includes("CLASS XI") || clean.includes("CLASS 11")) {
    return "XI";
  }
  if (clean.includes("HSSC-II") || clean.includes("HSSC 2") || clean.includes("HSSC II") || clean === "12" || clean === "XII" || clean.includes("GRADE XII") || clean.includes("GRADE 12") || clean.includes("CLASS XII") || clean.includes("CLASS 12")) {
    return "XII";
  }
  return clean;
}

/**
 * Normalizes cognitive level according to AKUEB official standard:
 * R = Remember (Knowledge / Recall)
 * U = Understand (Comprehension)
 * A = Application & beyond (Apply / Analyse / Evaluate / Create)
 * FA = Formative Assessment (not to be assessed under examination conditions / Classroom Activity)
 */
export function normalizeCognitiveLevel(level?: string | null): string {
  if (!level) return "R";
  const upper = level.trim().toUpperCase();
  if (upper === "R" || upper === "REMEMBER" || upper === "REMEMBERING" || upper === "K" || upper === "KNOWLEDGE" || upper === "RECALL") return "R";
  if (upper === "U" || upper === "UNDERSTAND" || upper === "UNDERSTANDING" || upper === "COMPREHENSION") return "U";
  if (
    upper === "A" ||
    upper === "APPLICATION" ||
    upper === "APPLY" ||
    upper === "AP" ||
    upper.startsWith("A ") ||
    upper === "ANALYSIS" ||
    upper === "ANALYSE" ||
    upper === "AN" ||
    upper === "EVALUATION" ||
    upper === "EVALUATE" ||
    upper === "E" ||
    upper === "CREATE" ||
    upper === "CREATION" ||
    upper === "C"
  ) {
    return "A";
  }
  if (
    upper === "FA" ||
    upper === "FORMATIVE" ||
    upper === "FORMATIVE ASSESSMENT" ||
    upper === "CA" ||
    upper === "ACTIVITY" ||
    upper === "CLASSROOM ACTIVITY"
  ) {
    return "FA";
  }
  return upper.slice(0, 2);
}

/**
 * AI prompt to extract structured chapters, subtopics, and SLOs with cognitive levels.
 */
function buildExtractionPrompt(textChunk: string, subjectHint?: string, classHint?: string): string {
  return `You are an expert curriculum and syllabus extraction AI specializing in AKUEB (Aga Khan University Examination Board) syllabi.

Your task is to extract ALL topics/chapters, subtopics, and Student Learning Outcomes (SLOs) from the provided syllabus text into a clean, strictly formatted JSON.

Subject Hint: ${subjectHint || "Detect from text"}
Class / Grade Hint: ${classHint || "Detect from text (IX, X, XI, or XII)"}

Extract with 100% precision:
1. "classLevel": standard Roman numeral: "IX", "X", "XI", or "XII". If the document contains multiple grades (e.g. Part I Grade IX and Part II Grade X), group chapters under their corresponding classLevel in the curriculums array.
2. "chapters": array of units/topics in numerical order:
   - "chapterNumber": integer (e.g., 1, 2, 3...)
   - "chapterName": full title of the topic/chapter
   - "subtopics": array of subtopics:
     - "subtopicNumber": e.g. "1.1", "1.2" (or "1" if no decimal)
     - "subtopicName": title of the subtopic
     - "slos": array of SLO items:
       - "sloNumber": e.g. "1.1.1", "1.1.2", "10.1.1"
       - "sloText": the complete SLO statement (e.g. "define the term 'ideology'")
       - "cognitiveLevel": Standard AKUEB cognitive level:
           * "R" (for Remember / Knowledge / Recall / * in R column)
           * "U" (for Understand / Comprehend / * in U column)
           * "A" (for Application and beyond [Apply, Analyse, Evaluate, Create] / * or A/Ap/An/E/C in A and beyond column)
           * "FA" (for Formative Assessment, not to be assessed under examination conditions / Classroom Activity)

IMPORTANT RULES:
- Include ALL SLOs without skipping any.
- Check the table columns for each SLO carefully:
  - If a checkmark '*' or letter appears in the 'R' column -> "R"
  - If in the 'U' column -> "U"
  - If in the 'A and beyond' column -> "A" (or specific code like Ap, An, E, C -> mapped to "A")
  - If footnote says "Formative Assessment, not to be assessed under examination conditions" or FA -> "FA"
- Preserve Urdu text completely if extracting an Urdu or Islamiat syllabus.
- Preserve mathematical formulas and scientific symbols accurately.
- Return ONLY valid JSON matching this schema:

{
  "curriculums": [
    {
      "classLevel": "IX",
      "board": "AKUEB",
      "subject": "Mathematics",
      "chapters": [
        {
          "chapterNumber": 1,
          "chapterName": "Real and Complex Numbers",
          "subtopics": [
            {
              "subtopicNumber": "1.1",
              "subtopicName": "Real Numbers",
              "slos": [
                {
                  "sloNumber": "1.1.1",
                  "sloText": "recall the set of real numbers as a union of sets of rational and irrational numbers",
                  "cognitiveLevel": "R"
                },
                {
                  "sloNumber": "1.1.2",
                  "sloText": "differentiate between rational and irrational numbers",
                  "cognitiveLevel": "U"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

Syllabus Text:
${textChunk}
`;
}

/**
 * Extracts structured syllabus curriculum from text using Gemini AI.
 */
export async function extractSyllabusFromText(
  text: string,
  options?: {
    subject?: string;
    classLevel?: string;
    board?: string;
  },
): Promise<SyllabusExtractionResult> {
  if (!text || text.trim().length === 0) {
    throw new Error("Syllabus text is empty");
  }

  const prompt = buildExtractionPrompt(text, options?.subject, options?.classLevel);

  const response = await generateGeminiContentWithRetry(
    {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    },
    { timeoutMs: 90000 },
  );

  let rawJson = response.response.text().trim();
  if (rawJson.startsWith("```json")) {
    rawJson = rawJson.replace(/^```json\s*/, "").replace(/```\s*$/, "");
  } else if (rawJson.startsWith("```")) {
    rawJson = rawJson.replace(/^```\s*/, "").replace(/```\s*$/, "");
  }

  const sanitized = sanitizeJsonEscapes(rawJson);
  let parsed: any;
  try {
    parsed = JSON.parse(sanitized);
  } catch (err) {
    console.error("Failed to parse Gemini JSON output:", rawJson.slice(0, 1000));
    throw new Error(`Invalid JSON returned by AI: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Normalize result
  let curriculums: ExtractedCurriculum[] = [];

  if (parsed.curriculums && Array.isArray(parsed.curriculums)) {
    curriculums = parsed.curriculums;
  } else if (parsed.chapters && Array.isArray(parsed.chapters)) {
    curriculums = [
      {
        classLevel: normalizeClassLevel(parsed.classLevel || options?.classLevel || "IX"),
        board: options?.board || parsed.board || "AKUEB",
        subject: options?.subject || parsed.subject || "Subject",
        chapters: parsed.chapters,
      },
    ];
  }

  // Clean and validate curriculums
  curriculums = curriculums.map((c) => {
    const classLevel = normalizeClassLevel(c.classLevel || options?.classLevel || "IX");
    const board = c.board || options?.board || "AKUEB";
    const subject = options?.subject || c.subject || "General";

    const cleanChapters: ExtractedChapter[] = (c.chapters || []).map((ch: any, chIdx: number) => {
      const chapterNumber = typeof ch.chapterNumber === "number" ? ch.chapterNumber : chIdx + 1;
      const chapterName = (ch.chapterName || `Unit ${chapterNumber}`).trim();

      const subtopics: ExtractedSubtopic[] = (ch.subtopics || []).map((st: any, stIdx: number) => {
        const subtopicNumber = st.subtopicNumber || `${chapterNumber}.${stIdx + 1}`;
        const subtopicName = (st.subtopicName || `Topic ${subtopicNumber}`).trim();

        const slos: ExtractedSLO[] = (st.slos || []).map((slo: any, sloIdx: number) => {
          const sloNumber = slo.sloNumber || `${subtopicNumber}.${sloIdx + 1}`;
          const sloText = (slo.sloText || "").trim();
          const cognitiveLevel = normalizeCognitiveLevel(slo.cognitiveLevel);

          return {
            sloNumber,
            sloText,
            cognitiveLevel,
          };
        });

        return {
          subtopicNumber,
          subtopicName,
          slos,
        };
      });

      return {
        chapterNumber,
        chapterName,
        subtopics,
      };
    });

    return {
      classLevel,
      board,
      subject,
      chapters: cleanChapters,
    };
  });

  return { curriculums };
}
