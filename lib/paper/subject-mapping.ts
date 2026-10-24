/**
 * Subject language mapping utilities for ExBoardAI.
 * Normalizes subject names and manages English/Urdu variants for
 * Islamiat and Pakistan Studies across curriculums, question bank, and past papers.
 */

export interface SubjectMappingResult {
  curriculumSubject: string;
  pastPaperSubject: string;
  isUrduMedium: boolean;
}

/**
 * Resolves any subject name (including medium suffixes and user input)
 * into its base curriculum subject (for syllabus chapters) and past paper subject (for questions).
 */
export function resolveSubjectMapping(rawSubject: string): SubjectMappingResult {
  const trimmed = (rawSubject || "").trim();
  const lower = trimmed.toLowerCase();

  // Islamiat Urdu
  if (
    (lower.includes("isl") || lower.includes("islam")) &&
    (lower.includes("urdu") || lower.includes("udu"))
  ) {
    return {
      curriculumSubject: "Islamiat",
      pastPaperSubject: "Islamiat (Urdu)",
      isUrduMedium: true,
    };
  }

  // Islamiat English
  if (
    lower === "isl (eng)" ||
    lower === "isl(eng)" ||
    lower === "isl (english)" ||
    lower === "isl(english)" ||
    lower === "islamiat (english)" ||
    lower === "islamiat (eng)" ||
    lower === "islamiat" ||
    (lower.includes("isl") && (lower.includes("eng") || lower.includes("emg")))
  ) {
    return {
      curriculumSubject: "Islamiat",
      pastPaperSubject: "Islamiat",
      isUrduMedium: false,
    };
  }

  // Pakistan Studies Urdu
  if (
    (lower.includes("pakistan") || lower.includes("pak") || lower.includes("pst") || lower.includes("oakistan")) &&
    (lower.includes("urdu") || lower.includes("udu"))
  ) {
    return {
      curriculumSubject: "Pakistan Studies",
      pastPaperSubject: "Pakistan Studies (Urdu)",
      isUrduMedium: true,
    };
  }

  // Pakistan Studies English
  if (
    lower.includes("pakistan studies (eng") ||
    lower.includes("pakistan studies (english") ||
    lower.includes("oakistan studies") ||
    lower.includes("pakistan studies") ||
    lower.includes("pak studies") ||
    lower === "pst" ||
    (lower.includes("pak") && (lower.includes("eng") || lower.includes("emg")))
  ) {
    return {
      curriculumSubject: "Pakistan Studies",
      pastPaperSubject: "Pakistan Studies",
      isUrduMedium: false,
    };
  }

  // Default passthrough for all other subjects (Physics, Chemistry, etc.)
  return {
    curriculumSubject: trimmed,
    pastPaperSubject: trimmed,
    isUrduMedium: false,
  };
}

export interface ExpandedCurriculumItem {
  id: string;
  class: string;
  board: string;
  subject: string;
  chaptersCount: number;
}

/**
 * Expands base curriculums to provide explicit English and Urdu variants
 * for Islamiat and Pakistan Studies, while deduplicating entries.
 */
export function expandCurriculumSubjects(
  curriculums: ExpandedCurriculumItem[],
  preferredBoard?: string,
): ExpandedCurriculumItem[] {
  // If a preferred board is provided, filter by board first if matching entries exist
  let filtered = curriculums;
  if (preferredBoard) {
    const boardMatches = curriculums.filter(
      (c) => c.board.toLowerCase() === preferredBoard.toLowerCase(),
    );
    if (boardMatches.length > 0) {
      filtered = boardMatches;
    }
  }

  const result: ExpandedCurriculumItem[] = [];
  const seenSubjects = new Set<string>();

  for (const item of filtered) {
    const key = `${item.subject.toLowerCase()}__${item.class.toLowerCase()}`;
    if (seenSubjects.has(key)) {
      continue;
    }
    seenSubjects.add(key);

    const norm = item.subject.toLowerCase().trim();

    if (norm === "islamiat" || norm === "islamiyat") {
      result.push({
        id: `${item.id}_eng`,
        class: item.class,
        board: item.board,
        subject: "Islamiat (English)",
        chaptersCount: item.chaptersCount,
      });
      result.push({
        id: `${item.id}_urdu`,
        class: item.class,
        board: item.board,
        subject: "Islamiat (Urdu)",
        chaptersCount: item.chaptersCount,
      });
    } else if (norm === "pakistan studies" || norm === "pak studies") {
      result.push({
        id: `${item.id}_eng`,
        class: item.class,
        board: item.board,
        subject: "Pakistan Studies (English)",
        chaptersCount: item.chaptersCount,
      });
      result.push({
        id: `${item.id}_urdu`,
        class: item.class,
        board: item.board,
        subject: "Pakistan Studies (Urdu)",
        chaptersCount: item.chaptersCount,
      });
    } else {
      result.push(item);
    }
  }

  return result;
}

/**
 * Formats user-facing option labels for the subject dropdown with
 * prominent acronyms and medium indicators.
 */
export function formatSubjectOptionLabel(
  subject: string,
  classLevel: string,
  chaptersCount?: number,
): string {
  const unitsText =
    typeof chaptersCount === "number" && chaptersCount > 0
      ? ` (${chaptersCount} units)`
      : "";
  const classText = classLevel ? ` · Class ${classLevel}` : "";

  if (subject === "Islamiat (English)") {
    return `ISL (ENG) · Islamiat (English)${classText}${unitsText}`;
  }
  if (subject === "Islamiat (Urdu)") {
    return `ISL (URDU) · Islamiat (Urdu)${classText}${unitsText}`;
  }
  if (subject === "Pakistan Studies (English)") {
    return `PAKISTAN STUDIES (ENG) · Pakistan Studies (English)${classText}${unitsText}`;
  }
  if (subject === "Pakistan Studies (Urdu)") {
    return `PAKISTAN STUDIES (URDU) · Pakistan Studies (Urdu)${classText}${unitsText}`;
  }

  return `${subject}${classText}${unitsText}`;
}

/**
 * Returns concise, user-friendly short form/acronym for subjects to ensure
 * responsive UI without truncating critical titles on mobile and desktop.
 * Examples:
 * - "Computer Science" -> "CS"
 * - "Mathematics" -> "Maths"
 * - "Business Mathematics" -> "B Maths"
 * - "General Mathematics" -> "Gen Maths"
 * - "Principles of Commerce" -> "POC"
 * - "Principles of Accounting" -> "POA"
 * - "Principles of Economics" -> "POE"
 * - "Business Statistics" -> "B Stats"
 * - "Commercial Geography" -> "Comm Geography"
 * - "Pakistan Studies" -> "Pak Studies"
 */
export function getSubjectShortName(subject?: string | null): string {
  if (!subject) return "";
  const trimmed = subject.trim();
  const lower = trimmed.toLowerCase();

  // Business Mathematics / Business Maths
  if (
    lower.includes("business math") ||
    lower.includes("b.math") ||
    lower.includes("b math")
  ) {
    return "B Maths";
  }
  // General Mathematics / General Maths
  if (lower.includes("general math") || lower.includes("gen math")) {
    return "Gen Maths";
  }
  // Mathematics / Maths
  if (lower.includes("math")) {
    return "Maths";
  }
  // Computer Science
  if (
    lower.includes("computer science") ||
    lower === "cs" ||
    lower.startsWith("cs ") ||
    lower.startsWith("cs-")
  ) {
    return "CS";
  }
  // Pakistan Studies
  if (
    lower.includes("pakistan studies") ||
    lower.includes("pak studies") ||
    lower === "pst"
  ) {
    if (lower.includes("urdu")) return "Pak Studies (Urdu)";
    if (lower.includes("eng")) return "Pak Studies (Eng)";
    return "Pak Studies";
  }
  // Islamiat
  if (lower.includes("islamiat") || lower.includes("islamiyat")) {
    if (lower.includes("urdu")) return "Islamiat (Urdu)";
    if (lower.includes("eng")) return "Islamiat (Eng)";
    return "Islamiat";
  }
  // Commercial Geography
  if (lower.includes("commercial geography") || lower.includes("comm geo")) {
    return "Comm Geography";
  }
  // Principles of Accounting
  if (
    lower.includes("principles of accounting") ||
    lower.includes("principle of accounting") ||
    lower === "poa"
  ) {
    return "POA";
  }
  // Principles of Commerce
  if (
    lower.includes("principles of commerce") ||
    lower.includes("principle of commerce") ||
    lower === "poc"
  ) {
    return "POC";
  }
  // Principles of Economics
  if (
    lower.includes("principles of economics") ||
    lower.includes("principle of economics") ||
    lower === "poe"
  ) {
    return "POE";
  }
  // Business Statistics
  if (
    lower.includes("business statistics") ||
    lower.includes("business stats") ||
    lower.includes("b stats") ||
    lower.includes("b.stats")
  ) {
    return "B Stats";
  }
  // General Science
  if (lower.includes("general science") || lower.includes("gen science")) {
    return "Gen Science";
  }

  return trimmed;
}

/**
 * Normalizes class representation to standard Roman Numerals (IX, X, XI, XII).
 */
export function formatClassLevel(cls?: string | number | null): string {
  if (cls === null || cls === undefined) return "";
  const str = cls.toString().replace(/^Class\s*/i, "").trim().toUpperCase();
  if (str === "9" || str === "IX" || str === "9TH" || str === "GRADE 9") return "IX";
  if (str === "10" || str === "X" || str === "10TH" || str === "GRADE 10") return "X";
  if (
    str === "11" ||
    str === "XI" ||
    str === "11TH" ||
    str === "GRADE 11" ||
    str === "FIRST YEAR" ||
    str === "1ST YEAR"
  )
    return "XI";
  if (
    str === "12" ||
    str === "XII" ||
    str === "12TH" ||
    str === "GRADE 12" ||
    str === "SECOND YEAR" ||
    str === "2ND YEAR"
  )
    return "XII";
  return str;
}

/**
 * Formats top past paper badge header text without "Class" or "Year" prefix.
 * e.g., "CS . XII . 2025"
 */
export function formatPastPaperHeaderInfo(
  subject?: string | null,
  classLevel?: string | number | null,
  year?: string | number | null,
  board?: string | null,
  chapterName?: string | null,
): string {
  const parts: string[] = [];
  const shortSubject = getSubjectShortName(subject);
  if (shortSubject) parts.push(shortSubject);

  const romanClass = formatClassLevel(classLevel);
  if (romanClass) parts.push(romanClass);

  if (year) parts.push(year.toString());
  if (board) parts.push(board);
  if (chapterName) parts.push(chapterName);

  return parts.join(" · ");
}
