/** Normalize class labels: "10", "class x", "X" → "X" */
export function normalizeClassLevel(value: string | null | undefined): string {
  if (!value) return "";
  const v = String(value)
    .trim()
    .toUpperCase()
    .replace(/^CLASS\s+/, "")
    .replace(/\s+/g, "");
  if (v === "9" || v === "IX") return "IX";
  if (v === "10" || v === "X") return "X";
  if (v === "11" || v === "XI") return "XI";
  if (v === "12" || v === "XII") return "XII";
  return v;
}

export function classesMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const left = normalizeClassLevel(a);
  const right = normalizeClassLevel(b);
  if (!left || !right) return true;
  return left === right;
}
