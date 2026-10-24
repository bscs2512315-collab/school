/**
 * Parses paper title into a base title and set identifier if present.
 * Examples:
 * - "Complex Numbers Alpha - Set A" -> { baseTitle: "Complex Numbers Alpha", setLetter: "A" }
 * - "Quadratic Equations Alpha (Set B)" -> { baseTitle: "Quadratic Equations Alpha", setLetter: "B" }
 * - "Math Midterm Set 1" -> { baseTitle: "Math Midterm", setLetter: "1" }
 * - "General Science Test" -> { baseTitle: "General Science Test", setLetter: null }
 */
export function parsePaperVariant(title: string): {
  baseTitle: string;
  setLetter: string | null;
  isRemedial: boolean;
} {
  if (!title) return { baseTitle: "", setLetter: null, isRemedial: false };

  // Helper to clean trailing punctuation/delimiters
  const cleanBase = (s: string) =>
    s.replace(/[\s·•\-–—:|/]+$/, "").replace(/^[\s·•\-–—:|/]+/, "").trim();

  // Titles may or may not carry a leading "Chapter 15:" prefix depending on when
  // they were generated. Strip it from the base title so variants of the same test
  // group collapse into a single group.
  const stripChapterPrefix = (s: string) =>
    s.replace(/^chapter\s*\d+\s*[:\-–—.]?\s*/i, "").trim() || s;

  // Match Weak Areas Practice / Remedial titles
  const remedialMatch = title.match(
    /^(.*?)(?:\s*[-–—·•|]\s*|\s+[([]\s*)(?:Weak Areas Practice|Weak Areas|Remedial Practice|Remedial)[)\]]?$/i,
  );
  if (remedialMatch && remedialMatch[1]) {
    return {
      baseTitle: stripChapterPrefix(cleanBase(remedialMatch[1])),
      setLetter: null,
      isRemedial: true,
    };
  }

  // Match Set / Variant / Copy indicators
  const match = title.match(
    /^(.*?)(?:\s*[-–—·•|]\s*|\s+[([]?|\s+)(?:Set|Copy|Variant)\s+([A-Z0-9]+)[)\]]?$/i,
  );
  if (match && match[1] && match[2]) {
    return {
      baseTitle: stripChapterPrefix(cleanBase(match[1])),
      setLetter: match[2].toUpperCase(),
      isRemedial: false,
    };
  }
  return {
    baseTitle: cleanBase(title),
    setLetter: null,
    isRemedial: false,
  };
}
