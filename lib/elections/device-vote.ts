const STORAGE_PREFIX = "election-voted:";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

function storageKey(slug: string): string {
  return `${STORAGE_PREFIX}${slug}`;
}

function cookieName(slug: string): string {
  return `election_voted_${slug.replace(/[^a-z0-9-]/gi, "")}`;
}

export function hasVotedOnDevice(slug: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(storageKey(slug)) === "1") return true;
  } catch {
    // Private mode or blocked storage.
  }
  return document.cookie
    .split(";")
    .some((part) => part.trim().startsWith(`${cookieName(slug)}=`));
}

export function markVotedOnDevice(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(slug), "1");
  } catch {
    // Private mode or blocked storage.
  }
  document.cookie = `${cookieName(slug)}=1; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}
