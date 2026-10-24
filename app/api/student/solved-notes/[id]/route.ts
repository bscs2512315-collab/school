import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * GET /api/student/solved-notes/[id]
 * Get full exercise details with all high-res page images and adjacent exercises
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized. Please login.", 401);
  }

  const { id } = await params;

  try {
    const { rows } = await db.query(
      `SELECT 
        se.id,
        se.chapter_id as "chapterId",
        se.curriculum_id as "curriculumId",
        se.board,
        se.class,
        se.subject,
        se.chapter_number as "chapterNumber",
        se.exercise_number as "exerciseNumber",
        se.title,
        se.page_count as "pageCount",
        CASE 
          WHEN se.sections IS NOT NULL AND json_typeof(se.sections::json) = 'array' 
          THEN json_array_length(se.sections::json) 
          ELSE NULL 
        END as "questionCount",
        se.image_urls as "imageUrls",
        se.thumbnail_url as "thumbnailUrl",
        se.solution_video_url as "solutionVideoUrl",
        se.source_credit as "sourceCredit",
        se.content_markdown as "contentMarkdown",
        se.sections as "sections",
        se.created_at as "createdAt",
        ch.chapter_name as "chapterName",
        ch.analyzed_content as "analyzedContent"
       FROM solved_exercises se
       LEFT JOIN chapters ch ON se.chapter_id = ch.id
       WHERE se.id = $1 AND se.is_published = true`,
      [id]
    );

    if (rows.length === 0) {
      return errorResponse("Solved exercise not found", 404);
    }

    const currentExercise = rows[0];

    // Helper to resolve cognitive level for an exercise
    function resolveCognitiveLevel(ex: any): string | null {
      const subtopics = ex.analyzedContent?.subtopics || [];
      const exNumClean = String(ex.exerciseNumber || "").replace(/^SLO\s*/i, "").trim();

      for (const sub of subtopics) {
        for (const slo of sub.slos || []) {
          const sloNumClean = String(slo.sloNumber || "").replace(/^SLO\s*/i, "").trim();
          if (sloNumClean === exNumClean) {
            if (slo.cognitiveLevel) {
              return String(slo.cognitiveLevel).replace(/[\[\]]/g, "").trim().toUpperCase();
            }
          }
        }
      }

      // Fallback: Check title or exercise_number for brackets like [U], [A], [K], [R], (U), (A)
      const match = (String(ex.title || "") + " " + String(ex.exerciseNumber || "")).match(/\[([UKARFAukarfa]+)\]|\(([UKARFAukarfa]+)\)/);
      if (match) {
        return (match[1] || match[2]).toUpperCase();
      }

      return null;
    }

    // Find previous and next exercises within the same curriculum
    const { rows: allExercisesInCurriculum } = await db.query(
      `SELECT id, chapter_number as "chapterNumber", exercise_number as "exerciseNumber", title
       FROM solved_exercises
       WHERE curriculum_id = $1 AND is_published = true
       ORDER BY chapter_number ASC, exercise_number ASC`,
      [currentExercise.curriculumId]
    );

    const currentIndex = allExercisesInCurriculum.findIndex((ex: any) => ex.id === id);
    const prevExercise = currentIndex > 0 ? allExercisesInCurriculum[currentIndex - 1] : null;
    const nextExercise =
      currentIndex >= 0 && currentIndex < allExercisesInCurriculum.length - 1
        ? allExercisesInCurriculum[currentIndex + 1]
        : null;

    // Filter exercises for current chapter (fallback to all in curriculum if single exercise)
    const chapterExercises = allExercisesInCurriculum.filter(
      (ex: any) => ex.chapterNumber === currentExercise.chapterNumber
    );

    return successResponse({
      ...currentExercise,
      cognitiveLevel: resolveCognitiveLevel(currentExercise),
      prevExercise,
      nextExercise,
      chapterExercises: chapterExercises.length > 0 ? chapterExercises : allExercisesInCurriculum,
    });
  } catch (error: any) {
    console.error("Error fetching solved exercise detail:", error);
    return errorResponse("Failed to fetch exercise details", 500);
  }
}
