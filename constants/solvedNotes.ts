import { normalizeClassLevel } from "@/lib/teacher/class-level";

export interface SolvedNotesSubjectItem {
  key: string;
  title: string;
  slug: string;
}

export const SOLVED_NOTES_SUBJECTS: SolvedNotesSubjectItem[] = [
  { key: "Mathematics", title: "Mathematics", slug: "mathematics" },
  { key: "Physics", title: "Physics", slug: "physics" },
  { key: "Chemistry", title: "Chemistry", slug: "chemistry" },
  { key: "Biology", title: "Biology", slug: "biology" },
  { key: "Computer Science", title: "Computer Science", slug: "computer-science" },
  { key: "English", title: "English", slug: "english" },
  { key: "Urdu", title: "Urdu", slug: "urdu" },
  { key: "Islamiat", title: "Islamiat", slug: "islamiat" },
  { key: "Pakistan Studies", title: "Pakistan Studies", slug: "pakistan-studies" },
];

export function subjectToSlug(subject: string): string {
  if (!subject) return "";
  const found = SOLVED_NOTES_SUBJECTS.find(
    (s) =>
      s.key.toLowerCase() === subject.toLowerCase() ||
      s.title.toLowerCase() === subject.toLowerCase() ||
      s.slug.toLowerCase() === subject.toLowerCase()
  );
  if (found) return found.slug;
  return subject
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugToSubject(slug: string): string {
  if (!slug) return "";
  const clean = decodeURIComponent(slug).toLowerCase().trim();
  const found = SOLVED_NOTES_SUBJECTS.find(
    (s) =>
      s.slug.toLowerCase() === clean ||
      s.key.toLowerCase() === clean ||
      s.title.toLowerCase() === clean ||
      s.key.toLowerCase().replace(/[^a-z0-9]+/g, "") === clean.replace(/[^a-z0-9]+/g, "")
  );
  if (found) return found.title;

  return clean
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function isKnownSubject(slugOrName: string): boolean {
  if (!slugOrName) return false;
  const clean = decodeURIComponent(slugOrName).toLowerCase().trim();
  return SOLVED_NOTES_SUBJECTS.some(
    (s) =>
      s.slug.toLowerCase() === clean ||
      s.key.toLowerCase() === clean ||
      s.title.toLowerCase() === clean ||
      s.key.toLowerCase().replace(/[^a-z0-9]+/g, "") === clean.replace(/[^a-z0-9]+/g, "")
  );
}

export function sanitizeClassLevel(raw?: string | null): string {
  const norm = normalizeClassLevel(raw);
  if (norm === "IX" || norm === "X" || norm === "XI" || norm === "XII") {
    return norm;
  }
  return "X";
}

export function getExerciseDisplayTitle(
  exerciseNumber?: string,
  title?: string,
  chapterName?: string
): string {
  if (exerciseNumber && exerciseNumber.trim()) {
    const clean = exerciseNumber.trim();
    if (/^\d+(\.\d+)?$/.test(clean)) {
      return `Exercise ${clean}`;
    }
    return clean;
  }

  if (title && title.trim()) {
    const match = title.match(/((?:Review\s+)?Exercise\s+\d+(?:\.\d+)?)/i);
    if (match) {
      return match[1];
    }
    let clean = title
      .trim()
      .replace(/\s*[-:–—]\s*Math(ematics)?(\s*Class)?\s*\d+th?/i, "")
      .trim();
    if (chapterName) {
      const escaped = chapterName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      clean = clean.replace(new RegExp(`^${escaped}\\s*[-:–—]\\s*`, "i"), "").trim();
    }
    return clean || "Exercise";
  }

  return "Exercise";
}

export function getExerciseWatermark(exerciseNumber: string): string {
  const match = exerciseNumber.match(/([0-9]+(?:\.[0-9]+)?)/);
  return match ? match[1] : exerciseNumber.slice(0, 2).toUpperCase();
}
