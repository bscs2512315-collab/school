import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LEVEL_NAMES = [
  "Novice",
  "Apprentice",
  "Scholar",
  "Warrior",
  "Knight",
  "Hero",
  "Champion",
  "Master",
  "Grandmaster",
  "Elite",
  "Legend",
  "Mythic",
] as const;

export function getLevelName(level: number): string {
  return LEVEL_NAMES[Math.max(0, Math.min(level - 1, LEVEL_NAMES.length - 1))];
}

export function calculateLevel(points: number): number {
  if (points >= 15000) return 12; // Mythic
  if (points >= 10000) return 11; // Legend
  if (points >= 7500) return 10; // Elite
  if (points >= 5000) return 9; // Grandmaster
  if (points >= 3500) return 8; // Master
  if (points >= 2000) return 7; // Champion
  if (points >= 1000) return 6; // Hero
  if (points >= 500) return 5; // Knight
  if (points >= 300) return 4; // Warrior
  if (points >= 150) return 3; // Scholar
  if (points >= 50) return 2; // Apprentice
  return 1; // Novice
}

const KNOWN_INSTITUTE_ACRONYMS = new Set([
  "IISAR",
  "CAS",
  "HPGS",
  "JS",
  "AKU",
  "AKUEB",
  "DPS",
  "BVS",
  "KGS",
  "APS",
  "PAF",
  "FAST",
  "NED",
  "IBA",
  "LUMS",
  "NUST",
  "GIKI",
  "SMIU",
  "UIT",
  "SZABIST",
  "PECHS",
  "DJ",
  "SM",
  "DA",
  "HUF",
  "MIT",
  "UCL",
  "SLO",
  "MCQ",
  "MCQS",
  "ATP",
  "FBISE",
  "BIEK",
  "BSEK",
  "BISE",
  "GIMS",
  "DUHS",
  "JSMU",
  "KMDC",
  "NUMS",
  "UET",
  "PIEAS",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
]);

const ROMAN_NUMERALS = new Set([
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
]);

function formatSingleNameSegment(sub: string): string {
  if (!sub) return "";
  const upper = sub.toUpperCase();
  if (ROMAN_NUMERALS.has(upper)) {
    return upper;
  }
  if (sub.toLowerCase() === "al") return "Al";

  // Handle apostrophes (e.g. O'Connor, D'Souza)
  if (sub.includes("'")) {
    return sub
      .split("'")
      .map((part) =>
        part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : "",
      )
      .join("'");
  }

  return sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase();
}

/**
 * Capitalizes each word in a string for human names (e.g. "zainab batool" -> "Zainab Batool", "MUHAMMAD TAHA" -> "Muhammad Taha", "S.murtaza Ali" -> "S.Murtaza Ali", "S.M Taha" -> "S.M Taha").
 * Standardizes user/student/teacher names into Title Case while properly handling dot initials (e.g. "S.Murtaza", "S.M.", "Dr."), hyphens (e.g. "Abdul-Rehman"), Roman numerals ("II", "III"), and particles like "Al".
 * Users don't have acronyms/short forms as names, so all words are title-cased.
 */
export function formatCapitalizeWords(name: string | null | undefined): string {
  if (!name || name === "—" || typeof name !== "string") return "";
  const trimmed = name.trim();
  if (!trimmed) return "";

  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (!word) return "";
      // Handle hyphens like "Abdul-Rehman", "Al-Murtaza"
      return word
        .split("-")
        .map((hyphenPart) => {
          if (!hyphenPart) return "";
          // Handle dot-separated initials and honorifics like "S.Murtaza", "S.M.", "S.M", "Dr."
          return hyphenPart
            .split(".")
            .map((dotPart) => formatSingleNameSegment(dotPart))
            .join(".");
        })
        .join("-");
    })
    .join(" ");
}

/**
 * Standardizes email display: always trimmed and strictly lowercase everywhere.
 */
export function formatEmail(email: string | null | undefined): string {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

/**
 * Formats institute and school names intelligently:
 * - Preserves user-provided uppercase acronyms and short forms (e.g., "IISAR", "CAS", "HPGS", "JS", "FAST", "NED", "PAF", etc.).
 * - Preserves and capitalizes known institute abbreviations and Roman numerals.
 * - Handles hyphenated acronyms ("CAS-HPGS"), dotted acronyms ("C.A.S.", "J.S."), and parenthetical forms ("(APS)").
 * - Title-cases generic institute words ("School", "College", "Foundation", "Academy", "University") while maintaining acronym casing.
 */
export function formatSchoolName(name: string | null | undefined): string {
  if (!name || name === "—" || typeof name !== "string") return "";
  const trimmed = name.trim();
  if (!trimmed) return "";

  // Check if the entire string was written in ALL CAPS (ignoring non-letters)
  const lettersOnly = trimmed.replace(/[^a-zA-Z]/g, "");
  const isEntireStringAllCaps =
    lettersOnly.length > 0 && lettersOnly === lettersOnly.toUpperCase();

  const words = trimmed.split(/\s+/);

  return words
    .map((word, wordIndex) => {
      if (!word) return "";

      // Handle hyphens like "CAS-HPGS" or "Cas-Hpgs" or "Al-Murtaza"
      return word
        .split("-")
        .map((subPart) => {
          if (!subPart) return "";

          // Extract leading and trailing non-alphanumeric chars (e.g. "(APS)" -> "(", "APS", ")")
          const prefixMatch = subPart.match(/^[^a-zA-Z0-9]+/);
          const prefix = prefixMatch ? prefixMatch[0] : "";
          const suffixMatch = subPart.match(/[^a-zA-Z0-9]+$/);
          const suffix = suffixMatch ? suffixMatch[0] : "";

          const core = subPart.slice(
            prefix.length,
            subPart.length - suffix.length,
          );
          if (!core) return subPart;

          const upperCore = core.toUpperCase();
          const lowerCore = core.toLowerCase();

          // 1. Dotted acronyms like "C.A.S." or "J.S." or "P.E.C.H.S."
          if (/^([a-zA-Z]\.)+[a-zA-Z]?$/.test(core)) {
            return prefix + core.toUpperCase() + suffix;
          }

          // 2. Known institute acronym or Roman numeral
          if (KNOWN_INSTITUTE_ACRONYMS.has(upperCore)) {
            return prefix + upperCore + suffix;
          }

          // 3. Known particle "Al"
          if (lowerCore === "al") {
            return prefix + "Al" + suffix;
          }

          // 4. Minor connector words (e.g., "of", "and", "for", "in", "the", "at") if not the first word
          if (
            wordIndex > 0 &&
            ["of", "and", "for", "in", "the", "at"].includes(lowerCore)
          ) {
            return (
              prefix +
              (core === core.toLowerCase()
                ? lowerCore
                : lowerCore.charAt(0).toUpperCase() + lowerCore.slice(1)) +
              suffix
            );
          }

          // 5. If the entire string was NOT all-caps, but this specific token was entered in ALL UPPERCASE (>= 2 letters)
          const isTokenAllCaps =
            core.length >= 2 && core === upperCore && /[A-Z]/.test(core);
          if (!isEntireStringAllCaps && isTokenAllCaps) {
            return prefix + upperCore + suffix;
          }

          // 6. Default standard word capitalization
          return (
            prefix +
            core.charAt(0).toUpperCase() +
            core.slice(1).toLowerCase() +
            suffix
          );
        })
        .join("-");
    })
    .join(" ");
}
