import { db } from "@/lib/db";

export async function hasGradingAssignment(teacherId: string, studentId: string, subject: string) {
  const { rows } = await db.query(
    `SELECT 1 FROM classroom_members cm
     JOIN teacher_classrooms tc ON tc.id = cm.classroom_id
     WHERE cm.teacher_id = $1 AND cm.student_id = $2 AND cm.subject = $3
       AND cm.status = 'accepted' AND tc.status = 'active'
     LIMIT 1`,
    [teacherId, studentId, subject],
  );
  return rows.length > 0;
}
