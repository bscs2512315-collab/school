import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { UserRole } from "@/types/enums";

export const AUTH_USER_KEY = "exboard_user";

export function getStoredUser(): { role?: string; [key: string]: unknown } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw || raw === "undefined" || raw === "null") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuthSession(user: object): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("exboard_token"); // Remove sessions issued before HttpOnly cookies.
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  try {
    window.dispatchEvent(new Event("exboard_auth_changed"));
  } catch {
    // ignore in environments without Event constructor
  }
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("exboard_token");
  localStorage.removeItem(AUTH_USER_KEY);

  Object.keys(localStorage)
    .filter((key) => key.startsWith("exboard_nova_session_") || key.startsWith("exboard_active_exam_"))
    .forEach((key) => localStorage.removeItem(key));

  try {
    window.dispatchEvent(new Event("exboard_auth_changed"));
  } catch {
    // ignore in environments without Event constructor
  }
}

export async function logoutAuthSession(): Promise<void> {
  const response = await fetch("/api/auth/logout", {
    method: "POST", credentials: "same-origin", keepalive: true,
  });
  if (!response.ok && response.status !== 401) {
    throw new Error("Could not revoke session. Please try again.");
  }
  clearAuthSession();
}

/**
 * Private pages are cookie-checked by Proxy; this is only a client UI hint.
 */
export function hasConsistentAuthSession(): boolean {
  return Boolean(getStoredUser());
}

/**
 * Returns stored user if present in localStorage; otherwise attempts a live profile fetch
 * and repopulates localStorage to prevent unexpected session-not-found issues.
 */
export async function ensureStoredUser(): Promise<{
  id?: string;
  userId?: string;
  role?: string;
  name?: string;
  email?: string;
  [key: string]: unknown;
} | null> {
  const current = getStoredUser();
  if (current?.id || current?.userId) {
    return current;
  }

  if (typeof window === "undefined") return null;

  try {
    const res = await fetch("/api/user/profile", {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      setAuthSession(json.data);
      return json.data;
    }
  } catch {
    return null;
  }

  return null;
}

export function getDashboardRouteForRole(role?: string): string {
  if (role === UserRole.ADMIN) {
    return FRONTEND_ROUTES.ADMIN_DASHBOARD;
  }
  if (role === UserRole.TEACHER) {
    return FRONTEND_ROUTES.TEACHER_DASHBOARD;
  }
  if (role === UserRole.SCHOOL) {
    return FRONTEND_ROUTES.SCHOOL_DASHBOARD;
  }
  return FRONTEND_ROUTES.STUDENT_DASHBOARD;
}
