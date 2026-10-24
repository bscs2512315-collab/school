import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * GET /api/student/teachers
 * Returns teachers at the student's school whose classes include the student's class
 */
export async function GET(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user || (user.role !== UserRole.STUDENT && user.role !== UserRole.QA && user.role !== "QA")) {
      return errorResponse("Unauthorized", 401);
    }


    // Get student's school_id and class
    const { rows: studentRows } = await db.query(
      `SELECT school_id, school_name, class FROM users WHERE id = $1`,
      [user.userId]
    );

    if (studentRows.length === 0) return errorResponse("Student not found", 404);

    const { school_id, school_name, class: studentClass } = studentRows[0];

    if (!school_id && !school_name) {
      return successResponse([], "No school associated");
    }

    // Fetch teachers at the same school whose classes array contains the student's class
    const { rows: teachers } = await db.query(
      `SELECT id, name, subjects, classes, profile_image, school_name
       FROM users
       WHERE role = $1
         AND (school_id = $2 OR (school_id IS NULL AND school_name = $3))
         AND ($4 = ANY(classes) OR classes IS NULL OR array_length(classes, 1) IS NULL)
       ORDER BY name ASC`,
      [UserRole.TEACHER, school_id, school_name, studentClass]
    );

    return successResponse(teachers, "Teachers fetched successfully");
  } catch (error) {
    console.error("Fetch student teachers error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
