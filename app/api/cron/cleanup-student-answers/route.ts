import { NextResponse } from "next/server";
import { cleanExpiredStudentAnswers } from "@/lib/services/answer-cleanup-service";
import { cleanFinishedElectionImages } from "@/lib/services/election-cleanup-service";
import { cleanExpiredNovaChats } from "@/lib/services/nova-chat-cleanup-service";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";

/**
 * POST /api/cron/cleanup-student-answers
 * Automatically cleans up expired Cloudinary storage and DB records:
 * 1. Student exam answer photos (after 2 days of grading/approval).
 * 2. Election candidate & voter verification photos (once finished).
 * 3. Nova chat sessions & uploaded attachments (after 7 days).
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
  const retentionDays = Number(searchParams.get("retentionDays") || 2);
  const chatRetentionDays = Number(searchParams.get("chatRetentionDays") || 7);
  const limit = Number(searchParams.get("limit") || 50);
  const dryRun = searchParams.get("dryRun") === "1";

  const [answersResult, electionsResult, chatsResult] = await Promise.all([
    cleanExpiredStudentAnswers({ retentionDays, limit, dryRun }),
    cleanFinishedElectionImages({ dryRun }),
    cleanExpiredNovaChats({ retentionDays: chatRetentionDays, limit: 100, dryRun }),
  ]);

  const totalPurged =
    answersResult.imagesDeleted +
    electionsResult.voterSelfiesDeleted +
    electionsResult.candidateImagesDeleted +
    chatsResult.attachmentsDeleted;

  return NextResponse.json({
    success: answersResult.success && electionsResult.success && chatsResult.success,
    message: dryRun
      ? `Dry run: found ${answersResult.imagesFound} answer photos, ${electionsResult.voterSelfiesFound + electionsResult.candidateImagesFound} election images, and ${chatsResult.attachmentsFound} chat files across ${chatsResult.sessionsScanned} expired chat(s).`
      : `Purged ${totalPurged} Cloudinary assets and deleted ${chatsResult.sessionsDeleted} expired chat sessions older than 7 days.`,
    data: {
      answers: answersResult,
      elections: electionsResult,
      chats: chatsResult,
    },
  });
}



/**
 * GET /api/cron/cleanup-student-answers
 * Read-only monitoring / dry-run endpoint.
 * Returns how many images & attempts are currently eligible for cleanup.
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

  const { searchParams } = new URL(req.url);
  const retentionDays = Number(searchParams.get("retentionDays") || 2);

  const result = await cleanExpiredStudentAnswers({
    retentionDays,
    limit: 100,
    dryRun: true,
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
}
