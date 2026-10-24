import type { ScientificToken } from "@/lib/scientific-notation/types";

const TOKEN_PATTERN =
  /(\((?:superscript|subscript)=(?:(?:[^()]+|\([^()]*\))+)\)|\(stacked=[^)]+\)|\^[\w/()+\-]+|_[\w/()+\-]+)/g;

export function parseScientificText(text: string): ScientificToken[] {
  if (!text) return [];

  const parts = text.split(TOKEN_PATTERN);
  const tokens: ScientificToken[] = [];

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith("(superscript=")) {
      const match = part.match(/\(superscript=((?:[^()]+|\([^()]*\))+)\)/);
      if (match) {
        tokens.push({ type: "sup", value: match[1] });
        continue;
      }
    }

    if (part.startsWith("(subscript=")) {
      const match = part.match(/\(subscript=((?:[^()]+|\([^()]*\))+)\)/);
      if (match) {
        tokens.push({ type: "sub", value: match[1] });
        continue;
      }
    }

    if (part.startsWith("(stacked=")) {
      const match = part.match(/\(stacked=(?:sup:([^,)]*))?(?:,sub:([^)]*))?\)/);
      if (match) {
        const sup = match[1] || "";
        const sub = match[2] || "";
        if (sup && !sub) {
          tokens.push({ type: "sup", value: sup });
        } else if (!sup && sub) {
          tokens.push({ type: "sub", value: sub });
        } else {
          tokens.push({ type: "stacked", sup, sub });
        }
        continue;
      }
    }

    if (part.startsWith("^") && !part.startsWith("(")) {
      tokens.push({ type: "sup", value: part.slice(1) });
      continue;
    }

    if (part.startsWith("_") && !part.startsWith("(")) {
      tokens.push({ type: "sub", value: part.slice(1) });
      continue;
    }

    tokens.push({ type: "text", value: part });
  }

  return tokens;
}

export function formatScientificTextForDisplay(text: string): string {
  return text.replace(/->/g, " → ");
}
