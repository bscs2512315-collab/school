const RESERVED_SLUGS = new Set([
  "login",
  "register",
  "verify-otp",
  "forgot-password",
  "reset-password",
  "dashboard",
  "admin",
  "student",
  "teacher",
  "school",
  "past-papers",
  "practical-journals",
  "curriculum",
  "api-docs",
  "api",
  "elections",
  "account",
  "settings",
  "onboarding",
  "friends",
  "network",
  "leaderboard",
  "challenge",
  "nova",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
  "icon.png",
  "apple-icon.png",
  "og.png",
  "manifest.json",
]);

export function slugifyElectionName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function isReservedElectionSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.trim().toLowerCase());
}

export function isValidElectionSlug(slug: string): boolean {
  const value = slug.trim().toLowerCase();
  if (value.length < 3 || value.length > 80) return false;
  if (isReservedElectionSlug(value)) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function normalizeRollNumber(roll: string): string {
  return roll.trim().toLowerCase().replace(/\s+/g, "");
}
