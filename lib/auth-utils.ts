import { verifyJWT } from "@/lib/auth";
import { UserRole } from "@/types/enums";
import { db } from "@/lib/db";
import { getCurrentTokenUser } from "@/lib/security/auth-account";

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

const ALLOWED_ROLES = new Set<string>([
  UserRole.STUDENT,
  UserRole.SCHOOL,
  UserRole.TEACHER,
  UserRole.ADMIN,
  UserRole.QA,
  "student",
  "school",
  "teacher",
  "admin",
  "qa",
  "QA",
]);

export async function verifyAuth(req: Request): Promise<AuthUser | null> {
  const authHeader = req.headers.get("authorization");
  const cookie = req.headers.get("cookie")?.match(/(?:^|;\s*)exboard_token=([^;]+)/)?.[1];
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : cookie ?? null;
  if (!token) return null;

  try {
    const payload = await verifyJWT(token);
    if (!payload?.userId || !payload.role || !ALLOWED_ROLES.has(payload.role)) {
      return null;
    }

    return await getCurrentTokenUser(payload);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message.includes("timed out") || error.message.includes("expired"))
    ) {
      throw error;
    }
    return null;
  }
}
