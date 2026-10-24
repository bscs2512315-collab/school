import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";

export async function GET(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    // Get teacher's subjects and school_id
    const { rows: teacherData } = await db.query(
      "SELECT subjects, school_id FROM users WHERE id = $1",
      [user.userId]
    );

    if (teacherData.length === 0) {
      return errorResponse("Teacher data not found", 404);
    }

    const { subjects, school_id } = teacherData[0];

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const rawLimit = searchParams.get("limit");
    const rawPage = searchParams.get("page");

    const queryParams: unknown[] = [subjects, school_id, user.userId];
    let whereClause = `
      WHERE ea.grading_status = 'pending_manual'
      AND ea.paper_type = 'paper2'
      AND ea.subject = ANY($1)
      AND u.school_id = $2
      AND EXISTS (
        SELECT 1 FROM classroom_members cm
        JOIN teacher_classrooms tc ON tc.id = cm.classroom_id
        WHERE cm.teacher_id = $3 AND cm.student_id = ea.user_id
          AND cm.subject = ea.subject AND cm.status = 'accepted' AND tc.status = 'active'
      )
    `;

    if (search) {
      queryParams.push(`%${search}%`);
      whereClause += ` AND (u.name ILIKE $${queryParams.length} OR ea.subject ILIKE $${queryParams.length})`;
    }

    let queryText = `
      SELECT 
        ea.id, 
        ea.user_id, 
        ea.paper_id, 
        ea.subject, 
        ea.created_at, 
        u.name as student_name,
        u.profile_image as student_image
      FROM exam_attempts ea
      JOIN users u ON ea.user_id = u.id
      ${whereClause}
      ORDER BY ea.created_at DESC
    `;

    if (rawLimit) {
      const limit = Math.max(1, parseInt(rawLimit, 10));
      const page = rawPage ? Math.max(1, parseInt(rawPage, 10)) : 1;
      const offset = (page - 1) * limit;
      queryParams.push(limit, offset);
      queryText += ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;
    }

    const { rows: pendingPapers } = await db.query(queryText, queryParams);

    return successResponse(pendingPapers, "Pending papers fetched successfully");
  } catch (error) {
    console.error("Fetch pending papers error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
