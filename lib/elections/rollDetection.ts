export interface RollFlag {
  odd: boolean;
  reason: string | null;
  expectedSample: string | null;
}

function fingerprint(roll: string): string {
  let out = "";
  for (const ch of roll) {
    if (ch >= "0" && ch <= "9") out += "D";
    else if (/[a-zA-Z]/.test(ch)) out += "L";
    else out += "X";
  }
  return out;
}

/**
 * Smart detection for suspicious voter roll numbers.
 *
 * College roll numbers tend to share one consistent, mostly-numeric format
 * (e.g. 210121, 210122, 210129). We derive the dominant "shape" of the roll
 * numbers and flag anything that deviates — like "jajkak" (no digits),
 * garbage text, or a completely different format.
 */
export function detectOddRollNumbers(
  rollNumbers: string[],
): Map<string, RollFlag> {
  const flags = new Map<string, RollFlag>();

  const seen = new Map<string, string>();
  for (const roll of rollNumbers) {
    const key = roll.trim().toLowerCase();
    if (!key) continue;
    if (!seen.has(key)) seen.set(key, roll.trim());
  }

  const reference = [...seen.entries()].filter(
    ([, original]) => original.length >= 4 && /\d/.test(original),
  );

  const counts = new Map<string, number>();
  for (const [, original] of reference) {
    const fp = fingerprint(original);
    counts.set(fp, (counts.get(fp) ?? 0) + 1);
  }

  let dominant: string | null = null;
  let dominantCount = 0;
  for (const [fp, count] of counts) {
    if (count > dominantCount) {
      dominant = fp;
      dominantCount = count;
    }
  }

  const expectedSample =
    reference.find(([, original]) => fingerprint(original) === dominant)?.[1] ??
    null;

  for (const [key, original] of seen) {
    if (original.length < 4) {
      flags.set(key, {
        odd: true,
        reason: "Too short to be a roll number",
        expectedSample,
      });
      continue;
    }

    const fp = fingerprint(original);

    if (!dominant) {
      flags.set(key, {
        odd: /[^a-zA-Z0-9]/.test(original),
        reason: /[^a-zA-Z0-9]/.test(original)
          ? "Contains unusual characters"
          : null,
        expectedSample: null,
      });
      continue;
    }

    if (fp !== dominant) {
      flags.set(key, {
        odd: true,
        reason: /\d/.test(original)
          ? "Format doesn't match the expected roll pattern"
          : "No digits — unlikely to be a roll number",
        expectedSample,
      });
      continue;
    }

    flags.set(key, { odd: false, reason: null, expectedSample });
  }

  return flags;
}