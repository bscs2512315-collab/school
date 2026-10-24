import { Gender } from "@/types/enums";

export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatElectionWindow(startsAt: string, endsAt: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  return `${new Date(startsAt).toLocaleString(undefined, opts)} – ${new Date(endsAt).toLocaleString(undefined, opts)}`;
}

export const CANDIDATE_GENDER_OPTIONS = [
  { value: Gender.MALE, label: "Male" },
  { value: Gender.FEMALE, label: "Female" },
];

export function formatGenderLabel(gender?: Gender | string | null): string | null {
  if (gender === Gender.MALE) return "Male";
  if (gender === Gender.FEMALE) return "Female";
  if (gender === Gender.OTHER) return "Other";
  return null;
}

export function formatCandidateMeta(params: {
  category?: string | null;
  gender?: Gender | null;
  classLevel: string;
}): string {
  const parts = [
    params.category?.trim() || null,
    formatGenderLabel(params.gender),
    `Class ${params.classLevel}`,
  ].filter(Boolean);
  return parts.join(" · ");
}

export function formatCandidateFirstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return fullName;
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function formatVoteTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getTimeRemaining(targetIso: string, now = Date.now()) {
  const diff = Math.max(0, new Date(targetIso).getTime() - now);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
    done: diff <= 0,
  };
}

export function getClientErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}
