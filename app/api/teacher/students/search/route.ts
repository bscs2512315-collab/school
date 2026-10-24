import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { normalizeClassLevel } from "@/lib/teacher/class-level";

type StudentRow = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  class: string | null;
  profile_image: string | null;
  points: number | null;
  school_id: string | null;
  school_name: string | null;
};

/**
 * GET /api/teacher/students/search?q=&visibility=school|private&classLevel=
 * Search students by name, username, or email for classroom invites.
 */
export async function GET(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const q = String(searchParams.get("q") || "").trim();
    const visibility =
      searchParams.get("visibility") === "private" ? "private" : "school";
    const classLevel = normalizeClassLevel(searchParams.get("classLevel"));

    if (q.length < 2) {
      return errorResponse("Enter at least 2 characters to search", 400);
    }

    const { rows: teacherRows } = await db.query(
      `SELECT school_id, school_name FROM users WHERE id = $1 AND role = $2`,
      [user.userId, UserRole.TEACHER],
    );
    if (!teacherRows.length) return errorResponse("Teacher not found", 404);
    const teacher = teacherRows[0];

    const like = `%${q.toLowerCase()}%`;

    const { rows } = await db.query<StudentRow>(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.username,
         u.class,
         u.profile_image,
         u.points,
         u.school_id,
         u.school_name
       FROM users u
       WHERE u.role = $1
         AND (
           LOWER(u.name) LIKE $2
           OR LOWER(COALESCE(u.username, '')) LIKE $2
           OR LOWER(u.email) LIKE $2
         )
       ORDER BY u.name ASC
       LIMIT 40`,
      [UserRole.STUDENT, like],
    );

    const inTeacherSchool = (row: StudentRow) => {
      if (
        teacher.school_id &&
        row.school_id &&
        row.school_id === teacher.school_id
      ) {
        return true;
      }
      if (
        teacher.school_name &&
        row.school_name &&
        String(row.school_name).trim().toLowerCase() ===
          String(teacher.school_name).trim().toLowerCase()
      ) {
        return true;
      }
      return false;
    };

    let filtered = rows;
    if (visibility === "school") {
      const schoolMatches = rows.filter(inTeacherSchool);
      // Prefer school roster; if school links are missing, still show name matches
      // so teachers can select — invite API enforces school rules.
      filtered = schoolMatches.length > 0 ? schoolMatches : rows;
    }

    const mapped = filtered.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      username: row.username,
      class: row.class,
      profileImage: row.profile_image,
      points: Number(row.points ?? 0),
      inSchool: inTeacherSchool(row),
    }));

    mapped.sort((a, b) => {
      const aClass =
        classLevel && normalizeClassLevel(a.class) === classLevel ? 0 : 1;
      const bClass =
        classLevel && normalizeClassLevel(b.class) === classLevel ? 0 : 1;
      if (a.inSchool !== b.inSchool) return a.inSchool ? -1 : 1;
      if (aClass !== bClass) return aClass - bClass;
      return a.name.localeCompare(b.name);
    });

    return successResponse(mapped, "Students found");
  } catch (error) {
    console.error("Search teacher students error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
