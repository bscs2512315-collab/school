/**
 * Utility for parsing and managing exam difficulty tiers and levels.
 *
 * Tier Hierarchy:
 * - Alpha = Easy
 * - Beta  = Medium
 * - Gamma = Hard
 */

export type DifficultyTier = "Alpha" | "Beta" | "Gamma";
export type DifficultyLevel = "Easy" | "Medium" | "Hard";

export interface DifficultyInfo {
  tier: DifficultyTier | null;
  level: DifficultyLevel | null;
  /** e.g. "Alpha • Easy", "Beta • Medium", "Gamma • Hard", or "Practice Test" */
  badgeLabel: string;
  /** e.g. "Alpha", "Beta", "Gamma", or "Practice Test" */
  tierOnlyLabel: string;
  /** Cleaned title with tier word removed if title has other meaningful words */
  cleanTitle: string;
  /** Whether an Alpha/Beta/Gamma tier was detected */
  isTiered: boolean;
}

export const DIFFICULTY_TIERS: Record<
  string,
  { tier: DifficultyTier; level: DifficultyLevel }
> = {
  alpha: { tier: "Alpha", level: "Easy" },
  beta: { tier: "Beta", level: "Medium" },
  gamma: { tier: "Gamma", level: "Hard" },
};

/**
 * Extracts difficulty tier (Alpha/Beta/Gamma) and level (Easy/Medium/Hard) from a paper title.
 * Also cleans the title so that the tier is not redundantly repeated when displayed with the badge.
 *
 * Examples:
 * - "Complex Numbers Alpha - Set D" -> { tier: "Alpha", level: "Easy", badgeLabel: "Alpha • Easy", cleanTitle: "Complex Numbers - Set D" }
 * - "Complex Numbers Alpha" -> { tier: "Alpha", level: "Easy", badgeLabel: "Alpha • Easy", cleanTitle: "Complex Numbers" }
 * - "Quadratic Equations Alpha" -> { tier: "Alpha", level: "Easy", badgeLabel: "Alpha • Easy", cleanTitle: "Quadratic Equations" }
 * - "Math Midterm" -> { tier: null, level: null, badgeLabel: "Practice Test", cleanTitle: "Math Midterm" }
 */
export function parsePaperDifficulty(
  title: string,
  fallbackBadge: string = "Practice Test",
): DifficultyInfo {
  if (!title) {
    return {
      tier: null,
      level: null,
      badgeLabel: fallbackBadge,
      tierOnlyLabel: fallbackBadge,
      cleanTitle: "",
      isTiered: false,
    };
  }

  // Find isolated Alpha, Beta, or Gamma
  const match = title.match(/\b(alpha|beta|gamma)\b/i);

  if (!match) {
    return {
      tier: null,
      level: null,
      badgeLabel: fallbackBadge,
      tierOnlyLabel: fallbackBadge,
      cleanTitle: title.trim(),
      isTiered: false,
    };
  }

  const key = match[1].toLowerCase();
  const meta = DIFFICULTY_TIERS[key];
  if (!meta) {
    return {
      tier: null,
      level: null,
      badgeLabel: fallbackBadge,
      tierOnlyLabel: fallbackBadge,
      cleanTitle: title.trim(),
      isTiered: false,
    };
  }

  // Clean the title: remove the tier word with surrounding parentheses/brackets if present
  let cleaned = title
    .replace(/\(\s*(?:alpha|beta|gamma)\s*\)/gi, "")
    .replace(/\[\s*(?:alpha|beta|gamma)\s*\]/gi, "")
    .replace(/\b(?:alpha|beta|gamma)\b/gi, "")
    // Normalize dashes and extra whitespace
    .replace(/\s*[-–—·•]\s*[-–—·•]\s*/g, " - ")
    .replace(/[\s·•\-–—:]+$/, "")
    .replace(/^[\s·•\-–—:]+/, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\[\s*\]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // If cleaning left nothing or just punctuation, keep original title
  if (!cleaned || /^[-–—\s·•]+$/.test(cleaned)) {
    cleaned = title.trim();
  }

  return {
    tier: meta.tier,
    level: meta.level,
    badgeLabel: `${meta.tier} • ${meta.level}`,
    tierOnlyLabel: meta.tier,
    cleanTitle: cleaned,
    isTiered: true,
  };
}
