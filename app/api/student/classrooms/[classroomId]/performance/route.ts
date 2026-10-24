import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { ClassroomMemberStatus, GradingStatus, UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { ensureClassroomSchema } from "@/lib/teacher/classroom-schema";
import { parsePaperDifficulty } from "@/lib/paper/difficulty";
import { parsePaperVariant } from "@/lib/paper/variant-parser";
import { computeClassroomCoverage } from "@/lib/paper/slo-coverage";

interface ChapterRow {
  id: string;
  chapterNumber: number;
  chapterName: string;
  curriculumId?: string;
  totalSlos?: number;
  coveredSlos?: number;
  sloCoveragePercentage?: number;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ classroomId: string }> },
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    await ensureClassroomSchema();
    const { classroomId: classroomIdParam } = await params;
    const classroomId = decodeURIComponent(classroomIdParam);
    const url = new URL(req.url);
    const requestedStudentId = url.searchParams.get("studentId");

    // 1. Fetch classroom info
    const { rows: classroomRows } = await db.query(
      `SELECT id, name, subject, class_level, teacher_id FROM teacher_classrooms WHERE id = $1`,
      [classroomId],
    );
    if (classroomRows.length === 0) {
      return errorResponse("Classroom not found", 404);
    }
    const classroom = classroomRows[0];

    // Verify student is an accepted member or teacher owns the classroom
    if (user.role === UserRole.STUDENT) {
      const { rows: membership } = await db.query(
        `SELECT id FROM classroom_members
         WHERE classroom_id = $1 AND student_id = $2 AND status = $3
         LIMIT 1`,
        [classroomId, user.userId, ClassroomMemberStatus.ACCEPTED],
      );
      if (membership.length === 0) {
        return errorResponse("You are not a member of this classroom", 403);
      }
    } else if (user.role === UserRole.TEACHER) {
      if (classroom.teacher_id && classroom.teacher_id !== user.userId) {
        return errorResponse("Forbidden: You do not manage this classroom", 403);
      }
    }

    let targetUserId = user.userId;
    if (user.role === UserRole.TEACHER && requestedStudentId) {
      targetUserId = requestedStudentId;
    }

    let studentInfo: { id: string; name: string; email: string } | null = null;
    if (user.role === UserRole.STUDENT || (user.role === UserRole.TEACHER && requestedStudentId)) {
      const { rows: uRows } = await db.query(
        `SELECT id, name, email FROM users WHERE id = $1`,
        [targetUserId],
      );
      if (uRows.length > 0)
        studentInfo = uRows[0] as { id: string; name: string; email: string };
    }

    // 2. Fetch all papers assigned in this classroom
    const { rows: paperRows } = await db.query(
      `SELECT id, title, chapter_ids, total_marks, total_questions, paper_type, questions_snapshot, created_at
       FROM teacher_papers
       WHERE classroom_id = $1
       ORDER BY created_at ASC`,
      [classroomId],
    );

    // 3. Compute SLO Coverage Report from syllabus and assigned papers
    const studentTargetId =
      user.role === UserRole.STUDENT || requestedStudentId ? targetUserId : null;
    let coverageReport;
    try {
      coverageReport = await computeClassroomCoverage(classroomId, studentTargetId);
    } catch (covErr) {
      console.error("Failed to compute SLO coverage report for performance route:", covErr);
    }

    let chaptersMeta: ChapterRow[] = [];
    if (coverageReport && coverageReport.chapters && coverageReport.chapters.length > 0) {
      chaptersMeta = coverageReport.chapters.map((c) => ({
        id: c.chapterId,
        chapterNumber: c.chapterNumber,
        chapterName: c.chapterName,
        totalSlos: c.totalSlos,
        coveredSlos: c.coveredSlos,
        sloCoveragePercentage: c.coveragePercentage,
      }));
    } else {
      // Fallback: Resolve all syllabus chapters for this classroom's curriculum directly
      const normalizedClass = classroom.class_level.trim();
      const classVariants = [normalizedClass];
      if (normalizedClass === "X" || normalizedClass === "10") {
        classVariants.push("X", "10");
      } else if (normalizedClass === "IX" || normalizedClass === "9") {
        classVariants.push("IX", "9");
      } else if (normalizedClass === "XI" || normalizedClass === "11") {
        classVariants.push("XI", "11");
      } else if (normalizedClass === "XII" || normalizedClass === "12") {
        classVariants.push("XII", "12");
      }

      const { rows: curriculumRows } = await db.query(
        `SELECT id FROM curriculums
         WHERE LOWER(subject) = LOWER($1)
           AND class = ANY($2::text[])
         LIMIT 1`,
        [classroom.subject, classVariants],
      );

      if (curriculumRows.length > 0) {
        const { rows: scRows } = await db.query(
          `SELECT id, chapter_number AS "chapterNumber", chapter_name AS "chapterName", curriculum_id AS "curriculumId"
           FROM chapters
           WHERE curriculum_id = $1
           ORDER BY chapter_number ASC`,
          [curriculumRows[0].id],
        );
        chaptersMeta = scRows as ChapterRow[];
      }
    }

    // Also include any chapters referenced by papers that were not in that curriculum
    const allChapterIds: string[] = [];
    paperRows.forEach((p) => {
      if (Array.isArray(p.chapter_ids)) {
        p.chapter_ids.forEach((cid: string) => {
          if (cid && !allChapterIds.includes(cid)) allChapterIds.push(cid);
        });
      }
    });

    const existingMetaIds = new Set(chaptersMeta.map((c) => c.id));
    const missingIds = allChapterIds.filter((id) => !existingMetaIds.has(id));
    if (missingIds.length > 0) {
      const { rows: extraRows } = await db.query(
        `SELECT id, chapter_number AS "chapterNumber", chapter_name AS "chapterName", curriculum_id AS "curriculumId"
         FROM chapters
         WHERE id = ANY($1::uuid[])
         ORDER BY chapter_number ASC`,
        [missingIds],
      );
      chaptersMeta.push(...(extraRows as ChapterRow[]));
    }

    // 4. Fetch all attempts
    const paperIds = paperRows.map((p) => p.id);
    let attempts: Array<{
      id: string;
      teacher_paper_id: string;
      paperTitle: string;
      score: number;
      total_marks: number;
      grading_status: string;
      created_at: string;
      paper_type: string;
    }> = [];

    if (paperIds.length > 0) {
      let querySql = `
        SELECT ea.id, ea.teacher_paper_id, tp.title as "paperTitle",
               ea.score, ea.total_marks, ea.grading_status, ea.created_at, tp.paper_type
        FROM exam_attempts ea
        JOIN teacher_papers tp ON tp.id = ea.teacher_paper_id
        WHERE ea.teacher_paper_id = ANY($1::uuid[])
      `;
      const queryParams: unknown[] = [paperIds];

      if (user.role === UserRole.STUDENT || requestedStudentId) {
        querySql += ` AND ea.user_id = $2`;
        queryParams.push(targetUserId);
      }

      querySql += ` ORDER BY ea.created_at DESC`;
      const { rows: attemptRows } = await db.query(querySql, queryParams);
      attempts = attemptRows as typeof attempts;
    }

    // Group papers and attempts by chapter
    const chapterMap = new Map<
      string,
      {
        chapterId: string;
        chapterNumber: number;
        chapterName: string;
        totalSlos: number;
        coveredSlos: number;
        sloCoveragePercentage: number;
        assignedPaperIds: Set<string>;
        attempts: typeof attempts;
      }
    >();

    // Initialize registered chapters
    chaptersMeta.forEach((ch) => {
      chapterMap.set(ch.id, {
        chapterId: ch.id,
        chapterNumber: ch.chapterNumber,
        chapterName: ch.chapterName,
        totalSlos: ch.totalSlos || 0,
        coveredSlos: ch.coveredSlos || 0,
        sloCoveragePercentage: ch.sloCoveragePercentage || 0,
        assignedPaperIds: new Set<string>(),
        attempts: [],
      });
    });

    // Map each paper to its chapter(s)
    paperRows.forEach((p) => {
      const { baseTitle } = parsePaperVariant(p.title);
      let matchedChapter = false;

      if (Array.isArray(p.chapter_ids) && p.chapter_ids.length > 0) {
        p.chapter_ids.forEach((cid: string) => {
          const entry = chapterMap.get(cid);
          if (entry) {
            entry.assignedPaperIds.add(p.id);
            matchedChapter = true;
          }
        });
      }

      // Fallback matching by title keywords (e.g. "Quadratic", "Complex")
      if (!matchedChapter) {
        for (const entry of chapterMap.values()) {
          if (
            baseTitle.toLowerCase().includes(entry.chapterName.toLowerCase()) ||
            entry.chapterName.toLowerCase().includes(baseTitle.toLowerCase())
          ) {
            entry.assignedPaperIds.add(p.id);
            matchedChapter = true;
            break;
          }
        }
      }

      // If still not matched, check questions_snapshot for chapter info
      if (!matchedChapter && p.questions_snapshot) {
        const snap =
          typeof p.questions_snapshot === "string"
            ? JSON.parse(p.questions_snapshot)
            : p.questions_snapshot;
        if (Array.isArray(snap) && snap[0]?.chapterName) {
          const cName = snap[0].chapterName;
          const cNum = Number(snap[0].chapterNumber) || 1;
          const pseudoId = `pseudo_${cName.toLowerCase().replace(/\s+/g, "_")}`;
          let entry = chapterMap.get(pseudoId);
          if (!entry) {
            entry = {
              chapterId: pseudoId,
              chapterNumber: cNum,
              chapterName: cName,
              totalSlos: 0,
              coveredSlos: 0,
              sloCoveragePercentage: 0,
              assignedPaperIds: new Set<string>(),
              attempts: [],
            };
            chapterMap.set(pseudoId, entry);
          }
          entry.assignedPaperIds.add(p.id);
        }
      }
    });

    // Map attempts to chapter buckets
    attempts.forEach((att) => {
      let bucketFound = false;
      for (const entry of chapterMap.values()) {
        if (entry.assignedPaperIds.has(att.teacher_paper_id)) {
          entry.attempts.push(att);
          bucketFound = true;
          break;
        }
      }
      if (!bucketFound) {
        for (const entry of chapterMap.values()) {
          if (
            att.paperTitle.toLowerCase().includes(entry.chapterName.toLowerCase())
          ) {
            entry.attempts.push(att);
            break;
          }
        }
      }
    });

    // Compute detailed analytics per chapter
    let totalMarksEarnedAll = 0;
    let totalMarksPossibleAll = 0;
    let gradedAttemptsCount = 0;

    const chapterAnalytics = Array.from(chapterMap.values())
      .sort((a, b) => a.chapterNumber - b.chapterNumber)
      .map((c) => {
        let earned = 0;
        let possible = 0;
        let bestPct = 0;

        const difficultyStats = {
          alpha: { attempted: 0, earned: 0, possible: 0 },
          beta: { attempted: 0, earned: 0, possible: 0 },
          gamma: { attempted: 0, earned: 0, possible: 0 },
        };

        c.attempts.forEach((att) => {
          const score = Number(att.score) || 0;
          const marks = Number(att.total_marks) || 0;
          const pct = marks > 0 ? Math.round((score / marks) * 100) : 0;

          if (att.grading_status === GradingStatus.GRADED) {
            earned += score;
            possible += marks;
            totalMarksEarnedAll += score;
            totalMarksPossibleAll += marks;
            gradedAttemptsCount++;
            if (pct > bestPct) bestPct = pct;
          }

          const diff = parsePaperDifficulty(att.paperTitle);
          if (diff.tier === "Alpha") {
            difficultyStats.alpha.attempted++;
            difficultyStats.alpha.earned += score;
            difficultyStats.alpha.possible += marks;
          } else if (diff.tier === "Beta") {
            difficultyStats.beta.attempted++;
            difficultyStats.beta.earned += score;
            difficultyStats.beta.possible += marks;
          } else if (diff.tier === "Gamma") {
            difficultyStats.gamma.attempted++;
            difficultyStats.gamma.earned += score;
            difficultyStats.gamma.possible += marks;
          }
        });

        // Compute unique assigned variant groups for this chapter
        const uniqueTestTitles = new Set<string>();
        c.assignedPaperIds.forEach((pid) => {
          const paper = paperRows.find((p) => p.id === pid);
          if (paper) {
            uniqueTestTitles.add(parsePaperVariant(paper.title).baseTitle);
          }
        });

        const testsAssignedCount = uniqueTestTitles.size;
        const accuracyPct = possible > 0 ? Math.round((earned / possible) * 100) : 0;

        return {
          chapterId: c.chapterId,
          chapterNumber: c.chapterNumber,
          chapterName: c.chapterName,
          totalSlos: c.totalSlos,
          coveredSlos: c.coveredSlos,
          sloCoveragePercentage: c.sloCoveragePercentage,
          testsAssigned: testsAssignedCount,
          testsAttempted: c.attempts.length,
          marksEarned: earned,
          marksPossible: possible,
          accuracyPercentage: accuracyPct,
          bestScorePercentage: bestPct,
          status:
            testsAssignedCount === 0
              ? "Not Assigned"
              : c.attempts.length === 0
                ? "Not Started"
                : accuracyPct >= 80
                  ? "Mastered"
                  : accuracyPct >= 50
                    ? "In Progress"
                    : "Needs Practice",
          difficultyBreakdown: {
            alpha: {
              ...difficultyStats.alpha,
              percentage:
                difficultyStats.alpha.possible > 0
                  ? Math.round(
                      (difficultyStats.alpha.earned /
                        difficultyStats.alpha.possible) *
                        100,
                    )
                  : 0,
            },
            beta: {
              ...difficultyStats.beta,
              percentage:
                difficultyStats.beta.possible > 0
                  ? Math.round(
                      (difficultyStats.beta.earned /
                        difficultyStats.beta.possible) *
                        100,
                    )
                  : 0,
            },
            gamma: {
              ...difficultyStats.gamma,
              percentage:
                difficultyStats.gamma.possible > 0
                  ? Math.round(
                      (difficultyStats.gamma.earned /
                        difficultyStats.gamma.possible) *
                        100,
                    )
                  : 0,
            },
          },
          recentAttempts: c.attempts.slice(0, 5).map((att) => ({
            attemptId: att.id,
            paperTitle: parsePaperDifficulty(att.paperTitle).cleanTitle,
            fullTitle: att.paperTitle,
            score: att.score,
            totalMarks: att.total_marks,
            percentage:
              Number(att.total_marks) > 0
                ? Math.round((Number(att.score) / Number(att.total_marks)) * 100)
                : 0,
            gradingStatus: att.grading_status,
            submittedAt: att.created_at,
          })),
        };
      });

    // Overall metrics
    const overallPercentage =
      totalMarksPossibleAll > 0
        ? Math.round((totalMarksEarnedAll / totalMarksPossibleAll) * 100)
        : 0;

    let strongestChapter: { name: string; percentage: number } | null = null;
    let focusChapter: { name: string; percentage: number } | null = null;

    const attemptedChapters = chapterAnalytics.filter((c) => c.testsAttempted > 0);
    if (attemptedChapters.length > 0) {
      const sorted = [...attemptedChapters].sort(
        (a, b) => b.accuracyPercentage - a.accuracyPercentage,
      );
      strongestChapter = {
        name: sorted[0].chapterName,
        percentage: sorted[0].accuracyPercentage,
      };
      const lowest = sorted[sorted.length - 1];
      focusChapter = {
        name: lowest.chapterName,
        percentage: lowest.accuracyPercentage,
      };
    }

    const totalTestsAssigned = chapterAnalytics.reduce(
      (sum, c) => sum + c.testsAssigned,
      0,
    );
    const totalTestsAttempted = attempts.length;

    // Overall difficulty stats
    const overallDifficulty = {
      alpha: { attempted: 0, earned: 0, possible: 0, percentage: 0 },
      beta: { attempted: 0, earned: 0, possible: 0, percentage: 0 },
      gamma: { attempted: 0, earned: 0, possible: 0, percentage: 0 },
    };
    chapterAnalytics.forEach((c) => {
      (["alpha", "beta", "gamma"] as const).forEach((tier) => {
        overallDifficulty[tier].attempted += c.difficultyBreakdown[tier].attempted;
        overallDifficulty[tier].earned += c.difficultyBreakdown[tier].earned;
        overallDifficulty[tier].possible += c.difficultyBreakdown[tier].possible;
      });
    });
    (["alpha", "beta", "gamma"] as const).forEach((tier) => {
      overallDifficulty[tier].percentage =
        overallDifficulty[tier].possible > 0
          ? Math.round(
              (overallDifficulty[tier].earned / overallDifficulty[tier].possible) * 100,
            )
          : 0;
    });

    const totalSyllabusChapters =
      coverageReport?.summary?.totalChapters || chapterAnalytics.length;
    const assignedChaptersCount = chapterAnalytics.filter((c) => c.testsAssigned > 0).length;
    const unassignedChaptersCount = Math.max(0, totalSyllabusChapters - assignedChaptersCount);

    const totalSlos = coverageReport?.summary?.totalSlos ?? 0;
    const coveredSlosCount = coverageReport?.summary?.coveredSlosCount ?? 0;
    const uncoveredSlosCount = coverageReport?.summary?.uncoveredSlosCount ?? 0;
    const syllabusCoveragePercentage =
      coverageReport && typeof coverageReport.summary?.coveragePercentage === "number"
        ? coverageReport.summary.coveragePercentage
        : totalSyllabusChapters > 0
          ? Math.round((assignedChaptersCount / totalSyllabusChapters) * 100)
          : 0;

    return successResponse(
      {
        classroom: {
          id: classroom.id,
          name: classroom.name,
          subject: classroom.subject,
          classLevel: classroom.class_level,
        },
        student: studentInfo,
        summary: {
          overallPercentage,
          totalMarksEarned: totalMarksEarnedAll,
          totalMarksPossible: totalMarksPossibleAll,
          totalTestsAssigned,
          totalTestsAttempted,
          gradedAttemptsCount,
          strongestChapter,
          focusChapter,
          difficultyBreakdown: overallDifficulty,
          totalSyllabusChapters,
          assignedChaptersCount,
          unassignedChaptersCount,
          totalSlos,
          coveredSlosCount,
          uncoveredSlosCount,
          syllabusCoveragePercentage,
        },
        chapters: chapterAnalytics,
      },
      "Student classroom performance report",
    );
  } catch (error) {
    console.error("Student classroom performance error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
