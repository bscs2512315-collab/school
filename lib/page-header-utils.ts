const FILLER_WORDS = new Set([
  "MY",
  "THE",
  "A",
  "AN",
  "OF",
  "AND",
  "FOR",
  "TO",
  "IN",
  "ON",
]);

/** Derives large background watermark text from a page title. */
export function getPageWatermarkText(title: string): string {
  const words = title
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0 && !/^\d+$/.test(word));

  if (words.length === 0) {
    return title.slice(0, 12).toUpperCase();
  }

  // Drop filler words so "My Classrooms" → "CLASSROOMS" (not a clipped "OMS")
  const meaningful = words.filter(
    (word) => !FILLER_WORDS.has(word.toUpperCase()),
  );
  const source = meaningful.length > 0 ? meaningful : words;

  if (source.length === 1) {
    return source[0].toUpperCase().slice(0, 14);
  }

  const twoWord = source.slice(0, 2).join(" ").toUpperCase();
  if (twoWord.length <= 14) {
    return twoWord;
  }

  // Prefer the distinctive last word for large right-aligned watermarks
  return source[source.length - 1].toUpperCase().slice(0, 14);
}
