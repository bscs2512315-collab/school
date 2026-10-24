import { NextResponse } from "next/server";
import { recoverStuckPendingGradings } from "@/lib/ai/nova-paper2-grade";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { db } from "@/lib/db";

/**
 * POST /api/cron/recover-gradings
 * Sweeps attempts stuck in `pending`/`failed` and re-runs Nova grading.
 * - With `?gradeNow=1` (inline, can take minutes) it grades in this request.
 * - Without it, it re-schedules via `after()` background tasks.
 * Authorized for admins, or any request carrying the CRON_SECRET header token.
 */
export async function POST(req: Request) {
  const secretToken = process.env.CRON_SECRET;
  const sentToken = req.headers.get("x-cron-secret");
  const viaSecret = Boolean(secretToken && sentToken && sentToken === secretToken);

  const user = await verifyAuth(req);
  const isAdmin = Boolean(user && user.role === UserRole.ADMIN);

  if (!viaSecret && !isAdmin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const gradeNow = searchParams.get("gradeNow") === "1";
  const cutoffMinutes = Number(searchParams.get("cutoffMinutes") || 5);
  const limit = Number(searchParams.get("limit") || 10);

  let processed: string[];
  try {
    processed = await recoverStuckPendingGradings({
      cutoffMinutes,
      gradeNow,
      limit,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Recovery failed";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `Re-queued ${processed.length} stuck attempt(s)`,
    data: { processed },
  });
}

/**
 * GET /api/cron/recover-gradings
 * Read-only: reports how many attempts are currently stuck (for monitoring).
 */
export async function GET(req: Request) {
  const secretToken = process.env.CRON_SECRET;
  const sentToken = req.headers.get("x-cron-secret");
  const viaSecret = Boolean(secretToken && sentToken && sentToken === secretToken);

  const user = await verifyAuth(req);
  const isAdmin = Boolean(user && user.role === UserRole.ADMIN);

  if (!viaSecret && !isAdmin && user?.role !== UserRole.TEACHER) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await db.query(
    `SELECT grading_status, COUNT(*)::int AS count
     FROM exam_attempts
     WHERE paper_type = 'paper2'
     GROUP BY grading_status`,
  );

  return NextResponse.json({ success: true, data: rows });
}