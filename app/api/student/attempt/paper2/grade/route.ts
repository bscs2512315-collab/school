import { NextResponse } from "next/server";
import { gradePaper2AttemptWithNova } from "@/lib/ai/nova-paper2-grade";
import { verifyAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { UserRole } from "@/types/enums";

/**
 * POST /api/student/attempt/paper2/grade
 * Nova AI grading of Paper II (CRQ/ERQ) answers using Gemini Vision.
 * Called asynchronously after Paper II submission, or manually for retries.
 */
export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { attemptId } = await req.json();

    if (!attemptId) {
      return NextResponse.json(
        { success: false, message: "Missing attemptId" },
        { status: 400 },
      );
    }

    const { rows } = await db.query<{
      user_id: string;
      teacher_id: string | null;
    }>(
      `SELECT ea.user_id, tp.teacher_id
       FROM exam_attempts ea
       LEFT JOIN teacher_papers tp ON tp.id = ea.teacher_paper_id
       WHERE ea.id = $1`,
      [attemptId],
    );
    const attempt = rows[0];
    const canGrade =
      user.role === UserRole.ADMIN ||
      attempt?.user_id === user.userId ||
      (user.role === UserRole.TEACHER &&
        attempt?.teacher_id === user.userId);

    if (!attempt || !canGrade) {
      return NextResponse.json(
        { success: false, message: "Attempt not found" },
        { status: 404 },
      );
    }

    const result = await gradePaper2AttemptWithNova(attemptId);

    return NextResponse.json({
      success: true,
      message: result.alreadyGraded ? "Already graded" : "Paper II graded by Nova",
      data: result,
    });
  } catch (error: unknown) {
    console.error("[Nova] Paper II grading error:", error);
    const message = error instanceof Error ? error.message : "Grading failed";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
