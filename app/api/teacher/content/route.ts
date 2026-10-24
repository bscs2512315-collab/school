import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    const { title, description, contentType, subject, targetClasses, questionsData, dueDate } = await req.json();

    if (!title || !contentType || !subject) {
      return errorResponse("Missing required fields", 400);
    }

    // Get teacher's school_id and classes
    const { rows: teacherData } = await db.query(
      "SELECT school_id, classes FROM users WHERE id = $1",
      [user.userId]
    );
    const schoolId = teacherData[0]?.school_id;
    const teacherClasses: string[] = teacherData[0]?.classes || [];

    // Use provided targetClasses or fall back to all teacher's classes
    const assignedClasses: string[] = (targetClasses && targetClasses.length > 0)
      ? targetClasses
      : teacherClasses;

    // Ensure target_classes column exists
    try {
      await db.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'teacher_content' AND column_name = 'target_classes'
          ) THEN
            ALTER TABLE teacher_content ADD COLUMN target_classes TEXT[] DEFAULT '{}';
          END IF;
        END $$;
      `);
    } catch (e) {
      console.error("Migration error:", e);
    }

    const contentId = randomUUID();

    await db.query(
      `INSERT INTO teacher_content (
        id, teacher_id, school_id, title, description, 
        content_type, subject, target_classes, questions_data, due_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        contentId,
        user.userId,
        schoolId,
        title,
        description,
        contentType,
        subject,
        assignedClasses,
        JSON.stringify(questionsData),
        dueDate || null
      ]
    );

    return successResponse({ id: contentId }, "Content created and assigned successfully", 201);
  } catch (error) {
    console.error("Create content error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

export async function GET(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    const { rows: content } = await db.query(
      `SELECT * FROM teacher_content WHERE teacher_id = $1 ORDER BY created_at DESC`,
      [user.userId]
    );

    return successResponse(content, "Content fetched successfully");
  } catch (error) {
    console.error("Fetch content error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
