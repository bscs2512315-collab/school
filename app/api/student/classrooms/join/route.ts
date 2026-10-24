import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { createNotification } from "@/lib/notifications";
import { FRONTEND_ROUTES } from "@/constants/endpoints";

/**
 * POST /api/student/classrooms/join
 * Join a classroom using a 6-character PIN code.
 */
export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const pin = String(body.pin || body.pinCode || body.code || "")
      .trim()
      .toUpperCase();

    if (!pin) {
      return errorResponse("Please enter a classroom PIN code", 400);
    }

    if (pin.length < 4 || pin.length > 12) {
      return errorResponse("Invalid PIN format. Classroom PINs are 6 characters long.", 400);
    }

    // 1. Find classroom by PIN code
    const { rows: classroomRows } = await db.query(
      `SELECT tc.id, tc.name, tc.subject, tc.class_level, tc.board, tc.pin_code,
              tc.teacher_id, u.name AS teacher_name, u.profile_image AS teacher_image
       FROM teacher_classrooms tc
       JOIN users u ON u.id = tc.teacher_id
       WHERE UPPER(TRIM(tc.pin_code)) = $1 AND tc.status != 'deleted'
       LIMIT 1`,
      [pin],
    );

    if (!classroomRows.length) {
      return errorResponse(
        "Invalid classroom PIN. No active classroom found with this code.",
        404,
      );
    }

    const classroom = classroomRows[0];

    // 2. Check if student is already enrolled
    const { rows: existingMember } = await db.query(
      `SELECT id, status FROM classroom_members
       WHERE classroom_id = $1 AND student_id = $2
       LIMIT 1`,
      [classroom.id, user.userId],
    );

    if (existingMember.length > 0 && existingMember[0].status === "accepted") {
      return successResponse(
        {
          classroomId: classroom.id,
          name: (classroom.name || `${classroom.subject} - Class ${classroom.class_level}`).replace(/\s*\(Private\)\s*/gi, "").trim(),
          subject: classroom.subject,
          classLevel: classroom.class_level,
          board: classroom.board || "AKUEB",
          teacherName: classroom.teacher_name,
          alreadyJoined: true,
        },
        "You are already a member of this classroom!",
      );
    }

    // 3. Add student to classroom_members
    await db.query(
      `INSERT INTO classroom_members
         (classroom_id, teacher_id, subject, class_level, student_id, status, accepted_at)
       VALUES ($1, $2, $3, $4, $5, 'accepted', NOW())
       ON CONFLICT (classroom_id, student_id)
       DO UPDATE SET status = 'accepted', accepted_at = NOW()`,
      [
        classroom.id,
        classroom.teacher_id,
        classroom.subject,
        classroom.class_level,
        user.userId,
      ],
    );

    // 4. Notify teacher
    const { rows: studentRows } = await db.query(
      `SELECT name FROM users WHERE id = $1`,
      [user.userId],
    );
    const studentName = studentRows[0]?.name || "A student";
    const cleanRoomName = (classroom.name || `${classroom.subject} - Class ${classroom.class_level}`).replace(/\s*\(Private\)\s*/gi, "").trim();

    try {
      await createNotification({
        userId: classroom.teacher_id,
        type: "CLASSROOM_INVITE_ACCEPTED" as any,
        title: "Student Joined Classroom! 🎓",
        message: `${studentName} joined "${cleanRoomName}" using PIN ${pin}.`,
        link: FRONTEND_ROUTES.TEACHER_CLASSROOM(classroom.id),
        metadata: {
          classroomId: classroom.id,
          studentId: user.userId,
          studentName,
          pin,
        },
      });
    } catch {
      // notification failure shouldn't block join
    }

    return successResponse(
      {
        classroomId: classroom.id,
        name: cleanRoomName,
        subject: classroom.subject,
        classLevel: classroom.class_level,
        board: classroom.board || "AKUEB",
        teacherName: classroom.teacher_name,
        alreadyJoined: false,
      },
      `Successfully joined "${cleanRoomName}"!`,
      201,
    );
  } catch (error) {
    console.error("Join classroom error:", error);
    return errorResponse("Failed to join classroom", 500);
  }
}
