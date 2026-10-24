import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { hasGradingAssignment } from "@/lib/teacher/grading-access";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    const { attemptId } = await params;

    // 1. Fetch attempt and student info
    const { rows: attempts } = await db.query(
      `SELECT ea.*, u.name as student_name, u.school_id
       FROM exam_attempts ea
       JOIN users u ON ea.user_id = u.id
       WHERE ea.id = $1`,
      [attemptId]
    );

    if (attempts.length === 0) {
      return errorResponse("Attempt not found", 404);
    }

    const attempt = attempts[0];

    // 2. Validate teacher's access (same school and subject)
    const { rows: teacherData } = await db.query(
      "SELECT subjects, school_id FROM users WHERE id = $1",
      [user.userId]
    );

    if (teacherData.length === 0) return errorResponse("Teacher not found", 404);
    
    const { subjects, school_id } = teacherData[0];
    const subjectsList =
      typeof subjects === "string" ? JSON.parse(subjects) : subjects || [];

    if (
      !school_id ||
      !attempt.school_id ||
      attempt.school_id !== school_id ||
      !Array.isArray(subjectsList) ||
      !subjectsList.includes(attempt.subject) ||
      !(await hasGradingAssignment(user.userId, attempt.user_id, attempt.subject))
    ) {
      return errorResponse("You are not authorized to grade this paper", 403);
    }

    // 3. Load questions for this paper (CRQ/ERQ)
    const { rows: questions } = await db.query(
      `SELECT id, question_number, question_part, question_text, question_type, marks
       FROM questions
       WHERE past_paper_id = $1 AND question_type IN ('CRQ', 'ERQ')
       ORDER BY question_number ASC, question_part ASC NULLS FIRST`,
      [attempt.paper_id]
    );

    // 4. Combine answers with questions
    const answersData = typeof attempt.answers_data === "string" 
      ? JSON.parse(attempt.answers_data) 
      : attempt.answers_data || {};

    const formattedQuestions = questions.map(q => ({
      ...q,
      student_answer: answersData[q.id] || null
    }));

    return successResponse({
      attempt: {
        id: attempt.id,
        student_name: attempt.student_name,
        subject: attempt.subject,
        created_at: attempt.created_at,
        status: attempt.grading_status
      },
      questions: formattedQuestions
    }, "Attempt details fetched successfully");

  } catch (error) {
    console.error("Fetch attempt details error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
