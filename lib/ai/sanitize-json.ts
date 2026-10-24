const VALID_JSON_ESCAPES = new Set(["\"", "\\", "/", "b", "f", "n", "r", "t", "u"]);

/**
 * Gemini sometimes emits LaTeX (e.g. \frac, \sqrt, \times) inside JSON string
 * values, especially for Maths content. Those backslash sequences aren't
 * valid JSON escapes, so JSON.parse throws (or worse, silently mangles the
 * text for sequences like \f/\t/\b that ARE valid escapes but mean something
 * else). Escape any backslash that isn't a real JSON escape so it survives
 * parsing as a literal character instead of breaking it.
 */
export function sanitizeJsonEscapes(text: string): string {
  let result = "";
  let inString = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (!inString) {
      result += ch;
      if (ch === '"') inString = true;
      continue;
    }

    if (ch === '"') {
      result += ch;
      inString = false;
      continue;
    }

    if (ch === "\\") {
      const next = text[i + 1];
      if (next !== undefined && VALID_JSON_ESCAPES.has(next)) {
        if (next === "u") {
          const hex = text.slice(i + 2, i + 6);
          if (/^[0-9a-fA-F]{4}$/.test(hex)) {
            result += "\\u" + hex;
            i += 5;
            continue;
          }
          result += "\\\\";
          continue;
        }
        result += "\\" + next;
        i += 1;
        continue;
      }
      // Not a valid JSON escape (e.g. \frac, \sqrt, \times) — escape the backslash itself.
      result += "\\\\";
      continue;
    }

    result += ch;
  }

  return result;
}
