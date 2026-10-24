import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { ClassroomMemberStatus, UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import {
  ensureClassroomSchema,
  getClassroomVisibility,
  parseClassroomId,
} from "@/lib/teacher/classroom-schema";
import { classesMatch } from "@/lib/teacher/class-level";
import { createNotification } from "@/lib/notifications";
import { sendClassroomInviteEmail } from "@/lib/email";
import { FRONTEND_ROUTES } from "@/constants/endpoints";

/**
 * GET /api/teacher/classrooms/[classroomId]/members
 * POST — invite students by id / username / email / name (pending until they join)
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ classroomId: string }> },
) {
  try {
    const user = await verifyAuth(_req);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    const resolvedParams = await params;
    const classroomId = decodeURIComponent(resolvedParams.classroomId);
    const parsed = parseClassroomId(classroomId);
    if (!parsed) return errorResponse("Invalid classroom ID", 400);
    if (parsed.teacherId !== user.userId) {
      return errorResponse("Access denied", 403);
    }

    await ensureClassroomSchema();

    const { rows } = await db.query(
      `SELECT cm.id, cm.student_id, cm.status, cm.created_at, cm.accepted_at,
              u.name, u.email, u.username, u.class, u.profile_image, u.points
       FROM classroom_members cm
       JOIN users u ON u.id = cm.student_id
       WHERE cm.classroom_id = $1
       ORDER BY cm.created_at DESC`,
      [classroomId],
    );

    return successResponse(
      rows.map((row) => ({
        id: row.id,
        studentId: row.student_id,
        status: row.status,
        createdAt: row.created_at,
        acceptedAt: row.accepted_at,
        name: row.name,
        email: row.email,
        username: row.username,
        class: row.class,
        profileImage: row.profile_image,
        points: row.points ?? 0,
      })),
      "Classroom members fetched",
    );
  } catch (error) {
    console.error("Fetch classroom members error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ classroomId: string }> },
) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    const resolvedParams = await params;
    const classroomId = decodeURIComponent(resolvedParams.classroomId);
    const parsed = parseClassroomId(classroomId);
    if (!parsed) return errorResponse("Invalid classroom ID", 400);
    if (parsed.teacherId !== user.userId) {
      return errorResponse("Access denied", 403);
    }

    const body = await req.json();
    const studentIds: string[] = Array.isArray(body.studentIds)
      ? body.studentIds
      : body.studentId
        ? [body.studentId]
        : [];
    const usernames: string[] = Array.isArray(body.usernames)
      ? body.usernames
      : body.username
        ? [body.username]
        : [];
    const emails: string[] = Array.isArray(body.emails)
      ? body.emails
      : body.email
        ? [body.email]
        : [];
    // Invites stay pending until the student joins (opt-in autoAccept for legacy)
    const autoAccept = body.autoAccept === true;

    const identifiers: string[] = Array.isArray(body.identifiers)
      ? body.identifiers
      : body.identifier
        ? [body.identifier]
        : [];

    for (const raw of identifiers) {
      const value = String(raw).trim();
      if (!value) continue;
      if (value.includes("@")) emails.push(value);
      else usernames.push(value.replace(/^@/, ""));
    }

    if (
      studentIds.length === 0 &&
      usernames.length === 0 &&
      emails.length === 0
    ) {
      return errorResponse(
        "Provide studentIds, usernames, or emails to invite",
        400,
      );
    }

    await ensureClassroomSchema();
    const visibility = await getClassroomVisibility(classroomId);

    const { rows: teacherRows } = await db.query(
      `SELECT id, name, school_id, school_name FROM users WHERE id = $1 AND role = $2`,
      [user.userId, UserRole.TEACHER],
    );
    if (!teacherRows.length) return errorResponse("Teacher not found", 404);
    const teacher = teacherRows[0];

    const resolvedIds = new Set<string>(studentIds);

    if (usernames.length > 0) {
      const cleaned = usernames
        .map((u) => String(u).trim().replace(/^@/, "").toLowerCase())
        .filter(Boolean);
      if (cleaned.length) {
        const { rows: byUsername } = await db.query(
          `SELECT id FROM users
           WHERE role = $1 AND LOWER(username) = ANY($2::text[])`,
          [UserRole.STUDENT, cleaned],
        );
        for (const row of byUsername) resolvedIds.add(row.id);

        // Also match by name when username lookup missed (e.g. "muhammad")
        for (const term of cleaned) {
          if (term.length < 2) continue;
          const { rows: byName } = await db.query(
            `SELECT id FROM users
             WHERE role = $1
               AND LOWER(name) LIKE $2
             LIMIT 10`,
            [UserRole.STUDENT, `%${term}%`],
          );
          for (const row of byName) resolvedIds.add(row.id);
        }
      }
    }

    if (emails.length > 0) {
      const cleaned = emails
        .map((e) => String(e).trim().toLowerCase())
        .filter(Boolean);
      if (cleaned.length) {
        const { rows: byEmail } = await db.query(
          `SELECT id FROM users
           WHERE role = $1 AND LOWER(email) = ANY($2::text[])`,
          [UserRole.STUDENT, cleaned],
        );
        for (const row of byEmail) resolvedIds.add(row.id);
      }
    }

    if (resolvedIds.size === 0) {
      return errorResponse(
        "No matching students found. Check name, username, or email.",
        404,
      );
    }

    const { rows: students } = await db.query(
      `SELECT id, name, email, class, school_id, school_name
       FROM users
       WHERE id = ANY($1::text[]) AND role = $2`,
      [[...resolvedIds], UserRole.STUDENT],
    );

    const invited: string[] = [];
    const skipped: Array<{ id: string; reason: string }> = [];

    for (const student of students) {
      if (student.class && !classesMatch(student.class, parsed.classLevel)) {
        skipped.push({
          id: student.id,
          reason: `Student is in Class ${student.class}, classroom is Class ${parsed.classLevel}`,
        });
        continue;
      }

      if (visibility === "school") {
        const studentHasSchool = Boolean(
          student.school_id || student.school_name,
        );
        const sameSchool =
          (teacher.school_id &&
            student.school_id &&
            student.school_id === teacher.school_id) ||
          (teacher.school_name &&
            student.school_name &&
            String(student.school_name).trim().toLowerCase() ===
              String(teacher.school_name).trim().toLowerCase());

        // Allow unassigned students; block only clear other-school matches
        if (studentHasSchool && !sameSchool) {
          skipped.push({
            id: student.id,
            reason: "Student is not in your school",
          });
          continue;
        }
      }

      const { rows: existingRows } = await db.query(
        `SELECT status FROM classroom_members
         WHERE classroom_id = $1 AND student_id = $2
         LIMIT 1`,
        [classroomId, student.id],
      );
      const existingStatus = existingRows[0]?.status as string | undefined;

      if (existingStatus === ClassroomMemberStatus.ACCEPTED) {
        skipped.push({
          id: student.id,
          reason: "Student is already in this classroom",
        });
        continue;
      }

      const status = autoAccept
        ? ClassroomMemberStatus.ACCEPTED
        : ClassroomMemberStatus.PENDING;
      const acceptedAt = autoAccept ? new Date().toISOString() : null;

      await db.query(
        `INSERT INTO classroom_members
           (classroom_id, teacher_id, subject, class_level, student_id, status, invited_by, accepted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (classroom_id, student_id)
         DO UPDATE SET
           status = CASE
             WHEN classroom_members.status = $9
             THEN classroom_members.status
             ELSE EXCLUDED.status
           END,
           invited_by = EXCLUDED.invited_by,
           accepted_at = COALESCE(classroom_members.accepted_at, EXCLUDED.accepted_at)`,
        [
          classroomId,
          user.userId,
          parsed.subject,
          parsed.classLevel,
          student.id,
          status,
          user.userId,
          acceptedAt,
          ClassroomMemberStatus.ACCEPTED,
        ],
      );

      invited.push(student.id);

      const roomLabel =
        visibility === "private"
          ? `${parsed.subject} Class ${parsed.classLevel} (Private)`
          : `${parsed.subject} Class ${parsed.classLevel}`;

      await createNotification({
        userId: student.id,
        type: "CLASSROOM_INVITE",
        title: autoAccept ? "Added to classroom" : "Classroom invitation",
        message: autoAccept
          ? `${teacher.name} added you to ${roomLabel}.`
          : `${teacher.name} invited you to join ${roomLabel}.`,
        link: FRONTEND_ROUTES.STUDENT_CLASSROOM_JOIN(classroomId),
        metadata: {
          classroomId,
          subject: parsed.subject,
          classLevel: parsed.classLevel,
          teacherId: user.userId,
          teacherName: teacher.name,
          visibility,
          status,
          action: "join_classroom",
        },
      });

      if (!autoAccept && student.email) {
        await sendClassroomInviteEmail({
          email: student.email,
          inviteeName: student.name || "Student",
          teacherName: teacher.name || "Your teacher",
          subject: parsed.subject,
          classLevel: parsed.classLevel,
          classroomId,
          visibility,
        }).catch(() => null);
      }
    }

    return successResponse(
      { invited, skipped, count: invited.length, visibility },
      invited.length > 0
        ? `Invited ${invited.length} student(s) — they can join from notifications or email`
        : skipped[0]?.reason || "No students were invited",
    );
  } catch (error) {
    console.error("Invite classroom members error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
