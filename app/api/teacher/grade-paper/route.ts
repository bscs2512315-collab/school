import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { createNotification } from "@/lib/notifications";
import { computeProgressPointsBreakdown, refreshStudentProgressStats } from "@/lib/gamification/award-progress-points";
import { hasGradingAssignment } from "@/lib/teacher/grading-access";

export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    const { attemptId, grades, overallFeedback } = await req.json();

    if (!attemptId || !grades) {
      return errorResponse("Attempt ID and grades are required", 400);
    }

    // 1. Fetch attempt info (including student's school for ownership check)
    const { rows: attempts } = await db.query(
      `SELECT ea.*, u.id as student_id, u.school_id as student_school_id
       FROM exam_attempts ea 
       JOIN users u ON ea.user_id = u.id 
       WHERE ea.id = $1`,
      [attemptId]
    );

    if (attempts.length === 0) return errorResponse("Attempt not found", 404);
    const attempt = attempts[0];

    // 2. Validate teacher's access (same school and subject) - prevents IDOR.
    const { rows: teacherData } = await db.query(
      "SELECT subjects, school_id FROM users WHERE id = $1",
      [user.userId]
    );

    if (teacherData.length === 0) {
      return errorResponse("Teacher not found", 404);
    }

    const { subjects, school_id: teacherSchoolId } = teacherData[0];
    const subjectsList =
      typeof subjects === "string" ? JSON.parse(subjects) : subjects || [];
    if (!Array.isArray(subjectsList)) {
      return errorResponse("Teacher profile is misconfigured", 400);
    }
    if (
      !teacherSchoolId ||
      !attempt.student_school_id ||
      attempt.student_school_id !== teacherSchoolId ||
      !subjectsList.includes(attempt.subject) ||
      !(await hasGradingAssignment(user.userId, attempt.student_id, attempt.subject))
    ) {
      return errorResponse("You are not authorized to grade this paper", 403);
    }

    const { rows: paperQuestions } = attempt.generated_paper_id
      ? await db.query("SELECT question_ids FROM generated_papers WHERE id = $1", [attempt.generated_paper_id])
      : await db.query("SELECT id, marks FROM questions WHERE past_paper_id = $1 AND question_type IN ('CRQ', 'ERQ')", [attempt.paper_id]);
    let expectedQuestions = paperQuestions;
    if (attempt.generated_paper_id) {
      const idsRaw = paperQuestions[0]?.question_ids;
      const ids: string[] = typeof idsRaw === "string" ? JSON.parse(idsRaw) : idsRaw;
      if (!Array.isArray(ids) || ids.length === 0) return errorResponse("Paper has no questions", 400);
      const placeholders = ids.map((_, index) => `$${index + 1}`).join(",");
      expectedQuestions = (await db.query(`SELECT id, marks FROM questions WHERE id IN (${placeholders})`, ids)).rows;
    }
    const allowedMarks = new Map(expectedQuestions.map((q) => [String(q.id), Number(q.marks)]));
    if (!grades || typeof grades !== "object" || Array.isArray(grades) ||
        allowedMarks.size === 0 || Object.keys(grades).length !== allowedMarks.size ||
        Object.keys(grades).some((id) => !allowedMarks.has(id))) {
      return errorResponse("Grades must match the paper's questions", 400);
    }

    // 3. Calculate total score from the paper's actual question marks.
    let totalScore = 0;
    let totalMaxMarks = 0;
    const gradingResults: Record<string, any> = {};

    for (const [qId, grade] of Object.entries(grades) as [string, any][]) {
        const score = Number(grade?.score);
        const maxMarks = allowedMarks.get(qId)!;
        if (!Number.isFinite(score) || !Number.isFinite(maxMarks) || maxMarks < 0) {
          return errorResponse("Invalid question marks", 400);
        }
        const clamped = Math.min(Math.max(0, score), maxMarks);
        totalScore += clamped;
        totalMaxMarks += maxMarks;
        
        gradingResults[qId] = {
            score: clamped,
            maxMarks,
            feedback: grade.feedback || "",
            imageUrl: grade.imageUrl || null
        };
    }

    const percentage = totalMaxMarks > 0 ? Math.round((totalScore / totalMaxMarks) * 100) : 0;
    
    // Lock the attempt and record its first reward in the same transaction.
    let pointsAwarded = 0;
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const locked = await client.query("SELECT grading_status FROM exam_attempts WHERE id = $1 FOR UPDATE", [attemptId]);
      if (locked.rows.length === 0) throw new Error("Attempt disappeared during grading");
      await client.query(
        `UPDATE exam_attempts SET score = $1, total_marks = $2, answers_data = $3,
         grading_status = 'graded', manual_grader_id = $4, feedback = $5 WHERE id = $6`,
        [totalScore, totalMaxMarks, JSON.stringify(gradingResults), user.userId, overallFeedback, attemptId],
      );
      if (locked.rows[0].grading_status !== "graded") {
        const reward = computeProgressPointsBreakdown({
          score: totalScore, totalMarks: totalMaxMarks, percentage,
          paperType: "paper2", questionCount: allowedMarks.size,
        }).totalAwarded;
        const inserted = await client.query(
          `INSERT INTO manual_grading_rewards (attempt_id, user_id, points)
           VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING points`,
          [attemptId, attempt.student_id, reward],
        );
        if (inserted.rowCount) {
          await client.query("UPDATE users SET points = COALESCE(points, 0) + $1 WHERE id = $2", [reward, attempt.student_id]);
          pointsAwarded = reward;
        }
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    if (pointsAwarded > 0) {
      await refreshStudentProgressStats(attempt.student_id).catch((error) => {
        console.error("Could not refresh student rank after grading:", error);
      });
    }

    // 5. Notify Student
    try {
        await createNotification({
            userId: attempt.student_id,
            type: "PAPER_GRADED" as any,
            title: "Paper II Hand-Graded! ",
            message: `Your ${attempt.subject} Paper II has been graded by your teacher. Score: ${totalScore}/${totalMaxMarks}`,
            link: `/student/history`,
        });
    } catch (e) {
        console.error("Failed to notify student", e);
    }

    return successResponse({ totalScore, totalMaxMarks, percentage, pointsAwarded }, "Paper graded successfully");

  } catch (error) {
    console.error("Grade paper error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
