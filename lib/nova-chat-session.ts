export const NOVA_SESSION_KEY_PREFIX = "exboard_nova_session_";

export function getNovaSessionStorageKey(userId: string): string {
  return `${NOVA_SESSION_KEY_PREFIX}${userId}`;
}

export function getStoredNovaSessionId(userId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(getNovaSessionStorageKey(userId));
}

export function setStoredNovaSessionId(userId: string, sessionId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getNovaSessionStorageKey(userId), sessionId);
}

export function clearStoredNovaSessionId(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getNovaSessionStorageKey(userId));
}

export function clearNovaChatSession(): void {
  if (typeof window === "undefined") return;
  Object.keys(localStorage)
    .filter((key) => key.startsWith(NOVA_SESSION_KEY_PREFIX))
    .forEach((key) => localStorage.removeItem(key));
}
