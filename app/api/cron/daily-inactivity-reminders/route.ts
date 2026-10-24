import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import {
  sendDailyInactivityReminders,
  type InactivityTemplateKey,
} from "@/lib/push/inactivity-reminders";

/**
 * POST /api/cron/daily-inactivity-reminders
 * Sweeps inactive students (no exam activity in 24+ hours, no reminder in 20+ hours)
 * and dispatches GenZ Roman Urdu encouragement push notifications.
 *
 * Query Params:
 * - limit: max notifications to dispatch (default: 100)
 * - template: optional specific template key ("book_band" | "board_exams" | "nova_waiting" | etc)
 * - dryRun: if "1", computes matching students without sending
 *
 * Authorized for admins, or requests bearing the CRON_SECRET header token.
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
  const limit = Math.min(500, Math.max(1, Number(searchParams.get("limit") || 100)));
  const dryRun = searchParams.get("dryRun") === "1";
  const templateKey = (searchParams.get("template") as InactivityTemplateKey) || undefined;

  try {
    const result = await sendDailyInactivityReminders({
      limit,
      dryRun,
      templateKey,
    });

    return NextResponse.json({
      success: true,
      message: dryRun
        ? `Dry run: found ${result.matchedCount} inactive student(s)`
        : `Sent ${result.sentCount} daily inactivity reminder(s) (${result.errors} error(s))`,
      data: result,
    });
  } catch (error: unknown) {
    console.error("Daily inactivity reminders error:", error);
    const message = error instanceof Error ? error.message : "Inactivity sweep failed";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * GET /api/cron/daily-inactivity-reminders
 * Read-only status report: counts eligible inactive students.
 */
export async function GET(req: Request) {
  const secretToken = process.env.CRON_SECRET;
  const sentToken = req.headers.get("x-cron-secret");
  const viaSecret = Boolean(secretToken && sentToken && sentToken === secretToken);

  const user = await verifyAuth(req);
  const isAdmin = Boolean(user && user.role === UserRole.ADMIN);

  if (!viaSecret && !isAdmin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendDailyInactivityReminders({
      limit: 100,
      dryRun: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        eligibleInactiveStudents: result.matchedCount,
        note: "Use POST with CRON_SECRET or Admin session to trigger notifications",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to query inactive students";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
