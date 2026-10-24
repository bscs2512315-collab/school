const UNICODE_SUPERSCRIPT_MAP: Record<string, string> = {
  "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4",
  "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9",
  "⁺": "+", "⁻": "-", "⁼": "=", "⁽": "(", "⁾": ")",
  "ᵃ": "a", "ᵇ": "b", "ᶜ": "c", "ᵈ": "d", "ᵉ": "e",
  "ᶠ": "f", "ᵍ": "g", "ʰ": "h", "ⁱ": "i", "ʲ": "j",
  "ᵏ": "k", "ˡ": "l", "ᵐ": "m", "ⁿ": "n", "ᵒ": "o",
  "ᵖ": "p", "ʳ": "r", "ˢ": "s", "ᵗ": "t", "ᵘ": "u",
  "ᵛ": "v", "ʷ": "w", "ˣ": "x", "ʸ": "y", "ᶻ": "z",
};

const UNICODE_SUBSCRIPT_MAP: Record<string, string> = {
  "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4",
  "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
  "₊": "+", "₋": "-", "₌": "=", "₍": "(", "₎": ")",
  "ₐ": "a", "ₑ": "e", "ₕ": "h", "ᵢ": "i", "ⱼ": "j",
  "ₖ": "k", "ₗ": "l", "ₘ": "m", "ₙ": "n", "ₒ": "o",
  "ₚ": "p", "ᵣ": "r", "ₛ": "s", "ₜ": "t", "ᵤ": "u",
  "ᵥ": "v", "ₓ": "x",
};

/**
 * Normalize AI/PDF unicode superscripts/subscripts into explicit notation
 * used across the app: (superscript=n) and (subscript=n)
 */
export function normalizeScientificNotation(text: string): string {
  if (!text) return text;

  let result = text;

  result = result.replace(/([A-Za-z0-9\)\]]+)([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾]+)/g, (_, base, sup) => {
    const normalized = [...sup].map((c) => UNICODE_SUPERSCRIPT_MAP[c] ?? c).join("");
    return `${base}(superscript=${normalized})`;
  });

  result = result.replace(/([A-Za-z])([₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎]+)/g, (_, base, sub) => {
    const normalized = [...sub].map((c) => UNICODE_SUBSCRIPT_MAP[c] ?? c).join("");
    return `${base}(subscript=${normalized})`;
  });

  return result;
}

export function normalizeScientificFields(
  fields: Array<string | null | undefined>,
): string[] {
  return fields.map((field) => normalizeScientificNotation(field ?? ""));
}
