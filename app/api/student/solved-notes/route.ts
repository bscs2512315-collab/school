import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * GET /api/student/solved-notes
 * List solved exercises grouped/filtered by class, board, subject, chapter.
 * For AKUEB, automatically blends published solved notes with the official 2027 syllabus SLOs,
 * marking missing SLOs with isLocked: true and isAvailable: false.
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized. Please login.", 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const classFilter = searchParams.get("class");
    const boardFilter = searchParams.get("board");
    const subjectFilter = searchParams.get("subject");
    const chapterFilter = searchParams.get("chapter");
    const search = searchParams.get("search")?.trim();

    const whereConditions: string[] = ["se.is_published = true"];
    const queryParams: unknown[] = [];

    if (classFilter && classFilter !== "all") {
      queryParams.push(classFilter);
      whereConditions.push(`se.class = $${queryParams.length}`);
    }

    if (boardFilter && boardFilter !== "all") {
      queryParams.push(boardFilter);
      whereConditions.push(`se.board = $${queryParams.length}`);
    }

    if (subjectFilter && subjectFilter !== "all") {
      queryParams.push(subjectFilter);
      whereConditions.push(`se.subject = $${queryParams.length}`);
    }

    if (chapterFilter && chapterFilter !== "all") {
      const chNum = parseInt(chapterFilter, 10);
      if (!isNaN(chNum)) {
        queryParams.push(chNum);
        whereConditions.push(`se.chapter_number = $${queryParams.length}`);
      }
    }

    if (search) {
      queryParams.push(`%${search}%`);
      whereConditions.push(
        `(se.title ILIKE $${queryParams.length} OR se.exercise_number ILIKE $${queryParams.length} OR ch.chapter_name ILIKE $${queryParams.length} OR se.subject ILIKE $${queryParams.length})`
      );
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    const query = `
      SELECT 
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
        se.thumbnail_url as "thumbnailUrl",
        se.solution_video_url as "solutionVideoUrl",
        se.source_credit as "sourceCredit",
        se.created_at as "createdAt",
        ch.chapter_name as "chapterName",
        ch.analyzed_content as "analyzedContent"
      FROM solved_exercises se
      LEFT JOIN chapters ch ON se.chapter_id = ch.id
      ${whereClause}
      ORDER BY se.chapter_number ASC, se.exercise_number ASC
    `;

    const { rows: publishedExercises } = await db.query(query, queryParams);

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

    // Map published exercises
    const exerciseList: any[] = publishedExercises.map((ex: any) => ({
      ...ex,
      isAvailable: true,
      isLocked: false,
      cognitiveLevel: resolveCognitiveLevel(ex),
    }));

    // If board is AKUEB or query is targeted for an AKUEB curriculum:
    // Extract full syllabus chapters and SLOs to generate "Coming Soon" locked items for missing SLOs
    const isAKUEB =
      boardFilter === "AKUEB" ||
      (!boardFilter && (user as { board?: string }).board === "AKUEB");

    if (isAKUEB) {
      const currParams: unknown[] = ["AKUEB"];
      const currConditions: string[] = ["c.board = $1"];

      if (classFilter && classFilter !== "all") {
        currParams.push(classFilter);
        currConditions.push(`c.class = $${currParams.length}`);
      }

      if (subjectFilter && subjectFilter !== "all") {
        currParams.push(subjectFilter);
        currConditions.push(`c.subject = $${currParams.length}`);
      }

      const currQuery = `
        SELECT 
          c.id as "curriculumId",
          c.class,
          c.subject,
          c.board,
          ch.id as "chapterId",
          ch.chapter_number as "chapterNumber",
          ch.chapter_name as "chapterName",
          ch.analyzed_content as "analyzedContent",
          ch.created_at as "createdAt"
        FROM curriculums c
        JOIN chapters ch ON ch.curriculum_id = c.id
        WHERE ${currConditions.join(" AND ")}
        ORDER BY ch.chapter_number ASC
      `;

      const { rows: syllabusChapters } = await db.query(currQuery, currParams);

      // Index all SLO cognitive levels from syllabus chapters to ensure 100% resolution for published & locked notes
      const syllabusSloCogMap = new Map<string, string>();
      for (const ch of syllabusChapters) {
        const subtopics = ch.analyzedContent?.subtopics || [];
        for (const sub of subtopics) {
          for (const slo of sub.slos || []) {
            if (slo.sloNumber && slo.cognitiveLevel) {
              const sloNumClean = String(slo.sloNumber).replace(/^SLO\s*/i, "").trim();
              const cogClean = String(slo.cognitiveLevel).replace(/[\[\]]/g, "").trim().toUpperCase();
              syllabusSloCogMap.set(`${ch.curriculumId}_${ch.chapterNumber}_${sloNumClean}`, cogClean);
              syllabusSloCogMap.set(`${ch.subject}_${ch.class}_${ch.chapterNumber}_${sloNumClean}`, cogClean);
              syllabusSloCogMap.set(`${ch.chapterId}_${sloNumClean}`, cogClean);
            }
          }
        }
      }

      // Backfill cognitiveLevel for any published exercise that missed it
      for (const ex of exerciseList) {
        if (!ex.cognitiveLevel) {
          const exNumClean = String(ex.exerciseNumber || "").replace(/^SLO\s*/i, "").trim();
          const found =
            syllabusSloCogMap.get(`${ex.curriculumId}_${ex.chapterNumber}_${exNumClean}`) ||
            syllabusSloCogMap.get(`${ex.subject}_${ex.class}_${ex.chapterNumber}_${exNumClean}`) ||
            syllabusSloCogMap.get(`${ex.chapterId}_${exNumClean}`);
          if (found) {
            ex.cognitiveLevel = found;
          }
        }
      }

      const publishedKeys = new Set(
        exerciseList.map(
          (ex: any) => `${ex.curriculumId}_${ex.chapterNumber}_${ex.exerciseNumber.trim().toUpperCase()}`
        )
      );

      for (const ch of syllabusChapters) {
        if (chapterFilter && chapterFilter !== "all") {
          const chNum = parseInt(chapterFilter, 10);
          if (ch.chapterNumber !== chNum) continue;
        }

        const subtopics = ch.analyzedContent?.subtopics || [];

        for (const sub of subtopics) {
          const slos = sub.slos || [];
          for (const slo of slos) {
            const sloExNumber = `SLO ${slo.sloNumber}`.toUpperCase();
            const noteKey = `${ch.curriculumId}_${ch.chapterNumber}_${sloExNumber}`;

            if (!publishedKeys.has(noteKey)) {
              const sloTitle = `SLO ${slo.sloNumber}: ${slo.sloText}`;

              // Apply search filter if active
              if (search) {
                const searchLower = search.toLowerCase();
                const matches =
                  sloTitle.toLowerCase().includes(searchLower) ||
                  sloExNumber.toLowerCase().includes(searchLower) ||
                  ch.chapterName.toLowerCase().includes(searchLower) ||
                  ch.subject.toLowerCase().includes(searchLower);
                if (!matches) continue;
              }

              exerciseList.push({
                id: `locked-${ch.curriculumId}-${ch.chapterId}-${slo.sloNumber}`,
                chapterId: ch.chapterId,
                curriculumId: ch.curriculumId,
                board: ch.board || "AKUEB",
                class: ch.class,
                subject: ch.subject,
                chapterNumber: ch.chapterNumber,
                exerciseNumber: `SLO ${slo.sloNumber}`,
                title: sloTitle,
                pageCount: 0,
                questionCount: 0,
                thumbnailUrl: null,
                solutionVideoUrl: null,
                sourceCredit: "AKUEB Examination 2027 Syllabus",
                createdAt: ch.createdAt || new Date().toISOString(),
                chapterName: ch.chapterName,
                isAvailable: false,
                isLocked: true,
                cognitiveLevel: slo.cognitiveLevel
                  ? String(slo.cognitiveLevel).replace(/[\[\]]/g, "").trim().toUpperCase()
                  : null,
              });
            }
          }
        }
      }
    }

    // Sort by chapter number, then natural SLO/exercise number
    exerciseList.sort((a, b) => {
      if (a.chapterNumber !== b.chapterNumber) {
        return a.chapterNumber - b.chapterNumber;
      }
      return a.exerciseNumber.localeCompare(b.exerciseNumber, undefined, { numeric: true, sensitivity: "base" });
    });

    // Calculate aggregated stats
    const totalExercises = exerciseList.length;
    const availableCount = exerciseList.filter((ex) => ex.isAvailable).length;
    const lockedCount = exerciseList.filter((ex) => ex.isLocked).length;
    const totalQuestions = exerciseList.reduce((sum: number, ex: any) => sum + (ex.questionCount || ex.pageCount || 0), 0);
    const totalPages = exerciseList.reduce((sum: number, ex: any) => sum + (ex.pageCount || 0), 0);
    const uniqueChapters = new Set(exerciseList.map((ex: any) => ex.chapterNumber)).size;

    return successResponse({
      exercises: exerciseList,
      stats: {
        totalExercises,
        availableCount,
        lockedCount,
        totalQuestions,
        totalPages,
        totalChapters: uniqueChapters,
      },
    });
  } catch (error: any) {
    console.error("Error fetching solved notes:", error);
    return errorResponse("Failed to fetch solved notes", 500);
  }
}
