import { db } from "@/lib/db";
import { extractSlosFromAnalyzedContent } from "@/lib/paper/extract-slos";
import type { SLO } from "@/lib/utils/syllabus-parser";

export interface MappedSloItem {
  sloNumber: string;
  sloText: string;
  cognitiveLevel: string;
  isCovered: boolean;
  isClassroomActivity?: boolean;
  coveredCount: number;
  papersCoveredIn: Array<{
    paperId: string;
    paperTitle: string;
    questionNumber: number;
    questionTextSnippet?: string;
  }>;
  studentPerformance?: {
    totalMarks: number;
    earnedMarks: number;
    masteryPercentage: number;
    status: "mastered" | "needs_practice" | "untested";
  };
}

export interface SubtopicCoverage {
  subtopicNumber: string;
  subtopicName: string;
  totalSlos: number;
  coveredSlos: number;
  slos: MappedSloItem[];
}

export interface ChapterCoverage {
  chapterId: string;
  chapterNumber: number;
  chapterName: string;
  totalSlos: number;
  coveredSlos: number;
  coveragePercentage: number;
  subtopics: SubtopicCoverage[];
}

export interface ClassroomCoverageReport {
  classroom: {
    id: string;
    name: string | null;
    subject: string;
    classLevel: string;
    board: string;
    teacherName?: string;
  };
  summary: {
    totalChapters: number;
    totalSlos: number;
    coveredSlosCount: number;
    uncoveredSlosCount: number;
    coveragePercentage: number;
    totalPapers: number;
    totalQuestions: number;
  };
  chapters: ChapterCoverage[];
}

interface QuestionLike {
  id?: string;
  questionNumber?: number;
  questionText?: string;
  questionType?: string;
  marks?: number;
  sloNumber?: string;
  slo_number?: string;
  sloCode?: string;
  chapterName?: string | null;
  chapterId?: string | null;
}

/**
 * Normalizes text for keyword matching
 */
function extractKeywords(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !["which", "what", "where", "these", "following", "given", "solve", "find"].includes(w));
}

/**
 * Maps a single question to the best matching SLO from a chapter's list of SLOs
 */
function findBestMatchingSlo(
  question: QuestionLike,
  chapterSlos: Array<SLO & { subtopicNumber?: string; subtopicName?: string }>,
): string | null {
  if (chapterSlos.length === 0) return null;

  // 1. Direct match on sloNumber / slo_number / sloCode
  const explicitCode = (question.sloNumber || question.slo_number || question.sloCode || "").trim();
  if (explicitCode) {
    const directMatch = chapterSlos.find(
      (s) => s.sloNumber.toLowerCase() === explicitCode.toLowerCase() || s.sloNumber.includes(explicitCode),
    );
    if (directMatch) return directMatch.sloNumber;
  }

  // 2. Keyword-based matching against questionText
  const qKeywords = extractKeywords(question.questionText || "");
  if (qKeywords.length > 0) {
    let bestMatchNumber: string | null = null;
    let highestScore = 0;

    for (const slo of chapterSlos) {
      const sloKeywords = extractKeywords(slo.sloText);
      let matchCount = 0;
      for (const kw of qKeywords) {
        if (sloKeywords.includes(kw) || slo.sloText.toLowerCase().includes(kw)) {
          matchCount++;
        }
      }

      if (matchCount > highestScore && matchCount >= 1) {
        highestScore = matchCount;
        bestMatchNumber = slo.sloNumber;
      }
    }

    if (bestMatchNumber && highestScore >= 1) {
      return bestMatchNumber;
    }
  }

  return null;
}

/**
 * Compute the full SLO coverage report for a classroom.
 */
export async function computeClassroomCoverage(
  classroomId: string,
  studentId?: string | null,
): Promise<ClassroomCoverageReport> {
  // 1. Fetch classroom metadata
  const { rows: roomRows } = await db.query(
    `SELECT tc.id, tc.name, tc.subject, tc.class_level, tc.board, tc.teacher_id, u.name AS teacher_name
     FROM teacher_classrooms tc
     LEFT JOIN users u ON u.id = tc.teacher_id
     WHERE tc.id = $1 LIMIT 1`,
    [classroomId],
  );

  const classroom = roomRows[0] || {
    id: classroomId,
    name: null,
    subject: "Mathematics",
    class_level: "X",
    board: "AKUEB",
    teacher_name: "Teacher",
  };

  const subject = classroom.subject;
  const classLevel = classroom.class_level;
  const board = classroom.board || "AKUEB";

  // 2. Fetch syllabus curriculum and chapters
  // Try exact match first
  let { rows: curRows } = await db.query(
    `SELECT id, class, board, subject FROM curriculums
     WHERE LOWER(TRIM(board)) = LOWER(TRIM($1))
       AND LOWER(TRIM(class)) = LOWER(TRIM($2))
       AND LOWER(TRIM(subject)) = LOWER(TRIM($3))
     LIMIT 1`,
    [board, classLevel, subject],
  );

  // Fallback: match board and subject if class is combined (e.g. SSC / HSSC)
  if (!curRows.length) {
    const { rows: fallbackCur } = await db.query(
      `SELECT id, class, board, subject FROM curriculums
       WHERE LOWER(TRIM(board)) = LOWER(TRIM($1))
         AND LOWER(TRIM(subject)) ILIKE '%' || LOWER(TRIM($2)) || '%'
       ORDER BY (CASE WHEN class = $3 THEN 0 ELSE 1 END) ASC
       LIMIT 1`,
      [board, subject, classLevel],
    );
    curRows = fallbackCur;
  }

  let chapterRows: Array<{
    id: string;
    chapter_number: number;
    chapter_name: string;
    analyzed_content: unknown;
  }> = [];

  if (curRows.length > 0) {
    const { rows } = await db.query<{
      id: string;
      chapter_number: number;
      chapter_name: string;
      analyzed_content: unknown;
    }>(
      `SELECT id, chapter_number, chapter_name, analyzed_content
       FROM chapters
       WHERE curriculum_id = $1
       ORDER BY chapter_number ASC`,
      [curRows[0].id],
    );
    chapterRows = rows;
  }

  // 3. Fetch all active papers assigned to this classroom
  const { rows: paperRows } = await db.query(
    `SELECT id, title, paper_type, chapter_ids, questions_snapshot, total_marks, total_questions
     FROM teacher_papers
     WHERE classroom_id = $1 AND (is_remedial IS FALSE OR is_remedial IS NULL)
     ORDER BY created_at ASC`,
    [classroomId],
  );

  // 4. If studentId provided, fetch their latest graded attempts for scoring per question
  const studentQuestionScores = new Map<string, { earned: number; max: number }>();
  if (studentId) {
    try {
      const { rows: attempts } = await db.query(
        `SELECT ea.teacher_paper_id, ea.answers_data, ea.paper_type
         FROM exam_attempts ea
         JOIN teacher_papers tp ON tp.id = ea.teacher_paper_id
         WHERE tp.classroom_id = $1 AND ea.user_id = $2
         ORDER BY ea.created_at DESC`,
        [classroomId, studentId],
      );

      for (const att of attempts) {
        if (!att.answers_data) continue;
        const ansMap =
          typeof att.answers_data === "string"
            ? JSON.parse(att.answers_data)
            : att.answers_data;
        for (const [qNumStr, ansData] of Object.entries(
          ansMap as Record<string, any>,
        )) {
          const qNum = parseInt(qNumStr, 10);
          const earned =
            typeof ansData?.score === "number"
              ? ansData.score
              : ansData?.correct
                ? 1
                : 0;
          const max =
            typeof ansData?.maxMarks === "number" ? ansData.maxMarks : 1;
          const key = `${att.teacher_paper_id}__${qNum}`;
          if (!studentQuestionScores.has(key)) {
            studentQuestionScores.set(key, { earned, max });
          }
        }
      }
    } catch (e) {
      console.error("Student attempt scoring query error in slo coverage:", e);
    }
  }

  // 5. Structure chapters, subtopics, and SLOs
  let totalCurriculumSlos = 0;
  let coveredSlosCount = 0;
  let totalMappedQuestions = 0;

  const chaptersResult: ChapterCoverage[] = [];

  for (const ch of chapterRows) {
    const rawContent: any =
      typeof ch.analyzed_content === "string"
        ? JSON.parse(ch.analyzed_content || "{}")
        : ch.analyzed_content || {};

    const subtopicsList: any[] = Array.isArray(rawContent.subtopics) ? rawContent.subtopics : [];

    // Flatten all SLOs in this chapter for matching
    const flatChapterSlos: Array<SLO & { subtopicNumber: string; subtopicName: string }> = [];

    const structuredSubtopics: SubtopicCoverage[] = subtopicsList.map((st: any, sIdx: number) => {
      const stNum = st.subtopicNumber || `${ch.chapter_number}.${sIdx + 1}`;
      const stName = st.subtopicName || `Topic ${stNum}`;
      const stSlos = (st.slos || []).map((slo: any, sloIdx: number) => {
        const sloNumber = String(slo.sloNumber || `${stNum}.${sloIdx + 1}`);
        const sloItem: SLO & { subtopicNumber: string; subtopicName: string } = {
          sloNumber,
          sloText: String(slo.sloText || "").trim(),
          cognitiveLevel: String(slo.cognitiveLevel || "U"),
          subtopicNumber: stNum,
          subtopicName: stName,
        };
        flatChapterSlos.push(sloItem);
        return sloItem;
      });

      return {
        subtopicNumber: stNum,
        subtopicName: stName,
        totalSlos: stSlos.length,
        coveredSlos: 0,
        slos: stSlos.map((s: any) => {
          const cog = String(s.cognitiveLevel || "").toUpperCase();
          const isNonExamined = cog === "CA" || cog === "FA";
          return {
            sloNumber: s.sloNumber,
            sloText: s.sloText,
            cognitiveLevel: s.cognitiveLevel,
            isCovered: false,
            isClassroomActivity: isNonExamined,
            coveredCount: 0,
            papersCoveredIn: [],
          };
        }),
      };
    });

    // Map questions from all papers matching this chapter
    const sloMap = new Map<string, MappedSloItem>();
    for (const sub of structuredSubtopics) {
      for (const slo of sub.slos) {
        sloMap.set(slo.sloNumber, slo);
      }
    }

    for (const paper of paperRows) {
      const chapterIds: string[] = Array.isArray(paper.chapter_ids) ? paper.chapter_ids : [];
      const questionsSnapshot: QuestionLike[] = Array.isArray(paper.questions_snapshot)
        ? paper.questions_snapshot
        : [];

      // Check if this paper includes this chapter
      const chapterMatched =
        chapterIds.includes(ch.id) ||
        questionsSnapshot.some(
          (q) =>
            q.chapterId === ch.id ||
            (q.chapterName && q.chapterName.toLowerCase().includes(ch.chapter_name.toLowerCase())),
        ) ||
        chapterIds.length === 0; // If paper covers all chapters

      if (!chapterMatched) continue;

      for (let qIdx = 0; qIdx < questionsSnapshot.length; qIdx++) {
        const q = questionsSnapshot[qIdx];
        const qNum = q.questionNumber || qIdx + 1;

        // Skip if question explicitly belongs to a different chapter
        if (q.chapterId && q.chapterId !== ch.id && !q.chapterName?.toLowerCase().includes(ch.chapter_name.toLowerCase())) {
          continue;
        }

        const matchedSloNumber = findBestMatchingSlo(q, flatChapterSlos);
        if (matchedSloNumber && sloMap.has(matchedSloNumber)) {
          const sloEntry = sloMap.get(matchedSloNumber)!;
          sloEntry.isCovered = true;
          sloEntry.coveredCount += 1;
          totalMappedQuestions += 1;

          sloEntry.papersCoveredIn.push({
            paperId: String(paper.id),
            paperTitle: paper.title,
            questionNumber: qNum,
            questionTextSnippet: (q.questionText || "").slice(0, 80),
          });

          // Student score aggregation
          if (studentId) {
            const scoreKey = `${paper.id}__${qNum}`;
            const studentScore = studentQuestionScores.get(scoreKey);
            if (studentScore) {
              if (!sloEntry.studentPerformance) {
                sloEntry.studentPerformance = {
                  totalMarks: 0,
                  earnedMarks: 0,
                  masteryPercentage: 0,
                  status: "untested",
                };
              }
              sloEntry.studentPerformance.totalMarks += studentScore.max;
              sloEntry.studentPerformance.earnedMarks += studentScore.earned;
            }
          }
        }
      }
    }

    // Calculate subtopic & chapter stats (CA / FA items are Formative Assessments, not tested in exams)
    let chapterTotalSlos = 0;
    let chapterCoveredSlos = 0;

    for (const sub of structuredSubtopics) {
      let subCovered = 0;
      let subTestableTotal = 0;
      for (const slo of sub.slos) {
        const cog = slo.cognitiveLevel?.toUpperCase();
        const isCA = slo.isClassroomActivity || cog === "CA" || cog === "FA";
        if (!isCA) {
          chapterTotalSlos++;
          subTestableTotal++;
          if (slo.isCovered) {
            subCovered++;
            chapterCoveredSlos++;
          }
        }

        if (slo.studentPerformance && slo.studentPerformance.totalMarks > 0) {
          const pct = Math.round(
            (slo.studentPerformance.earnedMarks / slo.studentPerformance.totalMarks) * 100,
          );
          slo.studentPerformance.masteryPercentage = pct;
          slo.studentPerformance.status = pct >= 70 ? "mastered" : "needs_practice";
        }
      }
      sub.totalSlos = subTestableTotal;
      sub.coveredSlos = subCovered;
    }

    totalCurriculumSlos += chapterTotalSlos;
    coveredSlosCount += chapterCoveredSlos;

    const chapterCoveragePct =
      chapterTotalSlos > 0 ? Math.round((chapterCoveredSlos / chapterTotalSlos) * 100) : 100;

    chaptersResult.push({
      chapterId: ch.id,
      chapterNumber: ch.chapter_number,
      chapterName: ch.chapter_name,
      totalSlos: chapterTotalSlos,
      coveredSlos: chapterCoveredSlos,
      coveragePercentage: chapterCoveragePct,
      subtopics: structuredSubtopics,
    });
  }

  const overallCoveragePct =
    totalCurriculumSlos > 0 ? Math.round((coveredSlosCount / totalCurriculumSlos) * 100) : 0;

  return {
    classroom: {
      id: classroom.id,
      name: classroom.name || null,
      subject: classroom.subject,
      classLevel: classroom.class_level,
      board: classroom.board || "AKUEB",
      teacherName: classroom.teacher_name || "Teacher",
    },
    summary: {
      totalChapters: chaptersResult.length,
      totalSlos: totalCurriculumSlos,
      coveredSlosCount,
      uncoveredSlosCount: totalCurriculumSlos - coveredSlosCount,
      coveragePercentage: overallCoveragePct,
      totalPapers: paperRows.length,
      totalQuestions: totalMappedQuestions,
    },
    chapters: chaptersResult,
  };
}
