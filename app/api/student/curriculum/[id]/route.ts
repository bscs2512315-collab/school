import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * GET /api/student/curriculum/[id]
 * Get curriculum details for students (read-only)
 * Includes analyzed_content so the SLO page can display subtopics.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized. Please login.", 401);
  }

  const { id } = await params;

  try {
    const { rows: curriculums } = await db.query(
      `SELECT id, class, board, subject,
        CASE WHEN analyzed_content IS NOT NULL THEN true ELSE false END as is_analyzed
       FROM curriculums WHERE id = $1`,
      [id],
    );

    if (curriculums.length === 0) {
      return errorResponse("Curriculum not found", 404);
    }

    const curriculum = curriculums[0] as any;

    // Include analyzed_content so the student SLO page can display subtopics
    const { rows: chapters } = await db.query(
      `SELECT 
        id,
        chapter_number as "chapterNumber",
        chapter_name as "chapterName",
        analyzed_content,
        CASE WHEN analyzed_content IS NOT NULL THEN true ELSE false END as "isAnalyzed"
       FROM chapters 
       WHERE curriculum_id = $1 
       ORDER BY chapter_number ASC`,
      [id],
    );

    // Fetch solved exercises for this curriculum
    const { rows: solvedExercises } = await db.query(
      `SELECT id, chapter_id as "chapterId", chapter_number as "chapterNumber", 
              exercise_number as "exerciseNumber", title, page_count as "pageCount", 
              CASE 
                WHEN sections IS NOT NULL AND json_typeof(sections::json) = 'array' 
                THEN json_array_length(sections::json) 
                ELSE NULL 
              END as "questionCount",
              thumbnail_url as "thumbnailUrl", solution_video_url as "solutionVideoUrl"
       FROM solved_exercises
       WHERE curriculum_id = $1 AND is_published = true
       ORDER BY chapter_number ASC, exercise_number ASC`,
      [id]
    );

    const formattedChapters = chapters.map((ch: any) => {
      let analyzedContent = null;
      if (ch.analyzed_content) {
        try {
          analyzedContent =
            typeof ch.analyzed_content === "string"
              ? JSON.parse(ch.analyzed_content)
              : ch.analyzed_content;
        } catch {
          // ignore parse errors
        }
      }

      const chapterExercises = solvedExercises.filter(
        (ex: any) => ex.chapterId === ch.id || ex.chapterNumber === ch.chapterNumber
      );

      return {
        id: ch.id,
        chapterNumber: ch.chapterNumber,
        chapterName: ch.chapterName,
        isAnalyzed: ch.isAnalyzed,
        analyzedContent,
        exercises: chapterExercises,
        exercisesCount: chapterExercises.length,
      };
    });

    return successResponse({
      id: curriculum.id,
      class: curriculum.class,
      board: curriculum.board,
      subject: curriculum.subject,
      isAnalyzed: curriculum.is_analyzed,
      chaptersCount: formattedChapters.length,
      chapters: formattedChapters,
    });
  } catch (error) {
    console.error("Student fetch curriculum detail error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
