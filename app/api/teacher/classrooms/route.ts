import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { Class, Subject, UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import {
  buildClassroomId,
  generateUniqueClassroomPin,
  upsertClassroomRow,
} from "@/lib/teacher/classroom-schema";

const VALID_CLASSES = new Set(Object.values(Class));
const FALLBACK_SUBJECTS = new Set(Object.values(Subject));

async function isValidSubject(subject: string): Promise<boolean> {
  try {
    const { rows } = await db.query(
      `SELECT 1 FROM subjects
       WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
         AND is_active = true
         AND coming_soon = false
       LIMIT 1`,
      [subject],
    );
    if (rows.length > 0) return true;
  } catch {
    // subjects table may be unavailable — fall back to enum
  }
  return FALLBACK_SUBJECTS.has(subject as Subject);
}

/**
 * POST /api/teacher/classrooms
 * Explicitly create a classroom with a unique PIN code.
 */
export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const subject = String(body.subject || "").trim();
    const classLevel = String(body.classLevel || body.class || "")
      .trim()
      .toUpperCase();
    const board = String(body.board || "").trim() || "AKUEB";
    const customName =
      typeof body.name === "string" && body.name.trim() ? body.name.trim() : null;

    if (!subject || !classLevel) {
      return errorResponse("Subject and class are required", 400);
    }
    if (!(await isValidSubject(subject))) {
      return errorResponse("Invalid subject", 400);
    }
    if (!VALID_CLASSES.has(classLevel as Class)) {
      return errorResponse("Invalid class. Use IX, X, XI, or XII", 400);
    }

    const { rows } = await db.query(
      `SELECT id, name, profile_image, school_name, school_id
       FROM users WHERE id = $1 AND role = $2`,
      [user.userId, UserRole.TEACHER],
    );
    if (!rows.length) return errorResponse("Teacher not found", 404);

    const teacher = rows[0];
    const pinCode = await generateUniqueClassroomPin();

    const slug = customName
      ? customName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 20)
      : "";
    const uniqueKey = slug ? `${slug}-${pinCode.toLowerCase()}` : pinCode.toLowerCase();
    const classroomId = buildClassroomId(
      teacher.id,
      subject,
      classLevel,
      "private",
      uniqueKey,
    );

    const finalDisplayName =
      customName || `${subject} - Class ${classLevel}`;

    await upsertClassroomRow({
      id: classroomId,
      teacherId: teacher.id,
      subject,
      classLevel,
      board,
      visibility: "private",
      schoolId: teacher.school_id,
      schoolName: teacher.school_name,
      name: finalDisplayName,
      pinCode,
      reactivate: true,
    });

    return successResponse(
      {
        id: classroomId,
        name: finalDisplayName,
        teacherId: teacher.id,
        teacherName: teacher.name,
        teacherImage: teacher.profile_image,
        subject,
        classLevel,
        board,
        pinCode,
        pin: pinCode,
        visibility: "private",
      },
      "Classroom created successfully",
      201,
    );
  } catch (error) {
    console.error("Create classroom error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
