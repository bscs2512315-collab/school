import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { UserRole } from "@/types/enums";
import { isPresetAvatarSrc } from "@/constants/presetAvatars";
import { deleteUploadedFile } from "@/lib/storage/file-upload";

function formatDateToYMD(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const year = val.getUTCFullYear();
    const month = String(val.getUTCMonth() + 1).padStart(2, "0");
    const day = String(val.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }
  return null;
}

/**
 * GET /api/user/profile
 * Fetch the current user's full profile
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized. Please login.", 401);
  }

  try {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.email, u.class, u.board, 
              COALESCE(a.name, r.name, u.school_name) as school_name, 
              u.phone, u.address,
              u.student_count, u.points, u.rank, u.role, u.profile_image, u.username, u.city,
              u.father_name, u.dob, u.gender, u.stream, u.subjects, u.classes, u.exam_strict_mode,
              u.created_at, u.updated_at
       FROM users u
       LEFT JOIN admin_schools a ON LOWER(TRIM(a.name)) = LOWER(TRIM(u.school_name))
       LEFT JOIN users r ON r.role = '${UserRole.SCHOOL}' AND LOWER(TRIM(r.name)) = LOWER(TRIM(u.school_name))
       WHERE u.id = $1`,
      [user.userId],
    );

    if (rows.length === 0) {
      return errorResponse("User not found", 404);
    }

    const u = rows[0] as any;

    return successResponse({
      id: u.id,
      name: u.name,
      email: u.email,
      class: u.class || null,
      board: u.board || null,
      schoolName: u.school_name || null,
      phone: u.phone || null,
      address: u.address || null,
      studentCount: u.student_count || null,
      points: u.points || 0,
      rank: u.rank || null,
      role: u.role,
      profileImage: u.profile_image || null,
      username: u.username || null,
      city: u.city || null,
      fatherName: u.father_name || null,
      dob: formatDateToYMD(u.dob),
      gender: u.gender || null,
      stream: u.stream || null,
      subjects: Array.isArray(u.subjects) ? u.subjects : [],
      classes: Array.isArray(u.classes) ? u.classes : [],
      examStrictMode: u.exam_strict_mode ?? true,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

/**
 * PUT /api/user/profile
 * Update the current user's profile
 */
export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized. Please login.", 401);
  }

  try {
    const body = await request.json();

    // Build dynamic update query based on role
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    // Common editable field: name
    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(body.name);
    }

    // Username (all roles, with uniqueness check)
    if (body.username !== undefined) {
      const { rows: existingUsername } = await db.query(
        "SELECT id FROM users WHERE username = $1 AND id != $2",
        [body.username, user.userId],
      );
      if (existingUsername.length > 0) {
        return errorResponse("This username is already taken", 400);
      }
      updates.push(`username = $${paramIndex++}`);
      values.push(body.username);
    }

    let oldAvatarToClean: string | null = null;
    // Preset avatar paths only (uploaded photos go through /upload-avatar)
    if (body.profileImage !== undefined) {
      if (body.profileImage !== null && body.profileImage !== "" && !isPresetAvatarSrc(body.profileImage)) {
        return errorResponse("Invalid avatar selection", 400);
      }

      // Check if user currently has an uploaded Cloudinary avatar that should be cleaned up
      const { rows: currentRows } = await db.query<{ profile_image: string | null }>(
        `SELECT profile_image FROM users WHERE id = $1`,
        [user.userId],
      );
      const currentAvatar = currentRows[0]?.profile_image;
      if (
        currentAvatar &&
        currentAvatar.includes("res.cloudinary.com") &&
        currentAvatar !== body.profileImage
      ) {
        oldAvatarToClean = currentAvatar;
      }

      updates.push(`profile_image = $${paramIndex++}`);
      values.push(body.profileImage || null);
    }

    // Student-specific fields
    if (user.role === UserRole.STUDENT) {
      if (body.class !== undefined) {
        updates.push(`class = $${paramIndex++}`);
        values.push(body.class);
      }
      if (body.board !== undefined) {
        updates.push(`board = $${paramIndex++}`);
        values.push(body.board);
      }
      if (body.schoolName !== undefined) {
        updates.push(`school_name = $${paramIndex++}`);
        values.push(body.schoolName);
      }
      if (body.city !== undefined) {
        updates.push(`city = $${paramIndex++}`);
        values.push(body.city);
      }
      if (body.fatherName !== undefined) {
        updates.push(`father_name = $${paramIndex++}`);
        values.push(body.fatherName);
      }
      if (body.dob !== undefined) {
        updates.push(`dob = $${paramIndex++}`);
        values.push(formatDateToYMD(body.dob));
      }
      if (body.gender !== undefined) {
        updates.push(`gender = $${paramIndex++}`);
        values.push(body.gender);
      }
      if (body.stream !== undefined) {
        updates.push(`stream = $${paramIndex++}`);
        values.push(body.stream || null);
      }
    }

    // School-specific fields
    if (user.role === UserRole.SCHOOL) {
      if (body.phone !== undefined) {
        updates.push(`phone = $${paramIndex++}`);
        values.push(body.phone);
      }
      if (body.address !== undefined) {
        updates.push(`address = $${paramIndex++}`);
        values.push(body.address);
      }
      if (body.studentCount !== undefined) {
        updates.push(`student_count = $${paramIndex++}`);
        values.push(body.studentCount);
      }
    }

    // Teacher-specific fields (subjects × classes create virtual classrooms)
    if (user.role === UserRole.TEACHER) {
      if (body.board !== undefined) {
        updates.push(`board = $${paramIndex++}`);
        values.push(body.board);
      }
      if (body.schoolName !== undefined) {
        updates.push(`school_name = $${paramIndex++}`);
        values.push(body.schoolName);
      }
      if (body.city !== undefined) {
        updates.push(`city = $${paramIndex++}`);
        values.push(body.city);
      }
      if (Array.isArray(body.subjects)) {
        updates.push(`subjects = $${paramIndex++}`);
        values.push(body.subjects);
      }
      if (Array.isArray(body.classes)) {
        updates.push(`classes = $${paramIndex++}`);
        values.push(body.classes);
      }
    }

    // Teacher & general testing strictness preference
    if (body.examStrictMode !== undefined) {
      updates.push(`exam_strict_mode = $${paramIndex++}`);
      values.push(Boolean(body.examStrictMode));
    }

    if (updates.length === 0) {
      return errorResponse("No valid fields to update", 400);
    }

    // Always update updated_at
    updates.push(`updated_at = NOW()`);

    values.push(user.userId);
    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex}
      RETURNING id, name, email, class, board, school_name, phone, address,
                student_count, points, rank, role, profile_image, username, city,
                father_name, dob, gender, stream, subjects, classes, exam_strict_mode,
                created_at, updated_at`;

    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      return errorResponse("User not found", 404);
    }

    if (oldAvatarToClean) {
      deleteUploadedFile(oldAvatarToClean).catch((err) => {
        console.warn("Failed to delete replaced avatar from Cloudinary:", err?.message || err);
      });
    }

    const u = rows[0] as any;

    return successResponse(
      {
        id: u.id,
        name: u.name,
        email: u.email,
        class: u.class || null,
        board: u.board || null,
        schoolName: u.school_name || null,
        phone: u.phone || null,
        address: u.address || null,
        studentCount: u.student_count || null,
        points: u.points || 0,
        rank: u.rank || null,
        role: u.role,
        profileImage: u.profile_image || null,
        username: u.username || null,
        city: u.city || null,
        fatherName: u.father_name || null,
        dob: formatDateToYMD(u.dob),
        gender: u.gender || null,
        stream: u.stream || null,
        subjects: Array.isArray(u.subjects) ? u.subjects : [],
        classes: Array.isArray(u.classes) ? u.classes : [],
        examStrictMode: u.exam_strict_mode ?? true,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
      },
      "Profile updated successfully",
    );
  } catch (error) {
    console.error("Update profile error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
