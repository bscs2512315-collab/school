import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendGradingResultEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { awardStudentProgressPoints } from "@/lib/gamification/award-progress-points";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getAdminFromRequest(
      req as unknown as Parameters<typeof getAdminFromRequest>[0]
    );
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access required." },
        { status: 401 },
      );
    }

    const { id: attemptId } = await params;
    const { gradingResults } = await req.json();

    // 1. Load the attempt record
    const { rows: attempts } = await db.query(
      `SELECT ea.*, u.email, u.name as student_name 
             FROM exam_attempts ea
             JOIN users u ON ea.user_id = u.id
             WHERE ea.id = $1`,
      [attemptId],
    );

    if (attempts.length === 0) {
      return NextResponse.json(
        { success: false, message: "Attempt not found" },
        { status: 404 },
      );
    }

    const attempt = attempts[0];

    if (attempt.grading_status === "graded") {
      return NextResponse.json(
        { success: false, message: "Attempt is already graded" },
        { status: 400 },
      );
    }

    // 2. Calculate totals
    let totalScore = 0;
    let totalMarks = 0;

    for (const qId in gradingResults) {
      totalScore += gradingResults[qId].score || 0;
      totalMarks += gradingResults[qId].maxMarks || 0;
    }

    const percentage =
      totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;
    const { pointsAwarded } = await awardStudentProgressPoints(
      attempt.user_id,
      {
        score: totalScore,
        totalMarks,
        percentage,
        paperType: "paper2",
        questionCount: Object.keys(gradingResults).length,
      },
    );

    // 3. Update the attempt record
    await db.query(
      `UPDATE exam_attempts
             SET score = $1, total_marks = $2, answers_data = $3, grading_status = 'graded'
             WHERE id = $4`,
      [totalScore, totalMarks, JSON.stringify(gradingResults), attemptId],
    );

    // 5. Send email notification
    try {
      await sendGradingResultEmail(
        attempt.email,
        attempt.student_name || "Student",
        {
          attemptId,
          subject: attempt.subject,
          score: totalScore,
          totalMarks,
          percentage,
          pointsAwarded,
          gradingResults,
        },
      );
    } catch (emailError) {
      console.error("Failed to send grading email:", emailError);
    }

    // 6. In-app notification for student
    await createNotification({
      userId: attempt.user_id,
      type: "PAPER_GRADED" as any,
      title: "Paper II Graded! ",
      message: `Your ${attempt.subject} Paper II has been manually graded: ${totalScore}/${totalMarks} (${percentage}%)`,
      link: `/student/history`,
      metadata: { attemptId, score: totalScore, totalMarks, percentage },
    });

    return NextResponse.json({
      success: true,
      message: "Student exam manually graded successfully.",
      data: {
        attemptId,
        score: totalScore,
        totalMarks,
        percentage,
        pointsAwarded,
      },
    });
  } catch (error: any) {
    console.error("Manual Grading Error:", error);
    return NextResponse.json(
      { success: false, message: "Manual grading failed" },
      { status: 500 },
    );
  }
}
