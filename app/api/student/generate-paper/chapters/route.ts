import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { resolveSubjectMapping } from "@/lib/paper/subject-mapping";

/**
 * GET /api/student/generate-paper/chapters?subject=X&class=Y&board=Z&paperType=1|2
 * Returns chapters that have questions available in the question bank
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawSubject = searchParams.get("subject");
    const classLevel = searchParams.get("class");
    const board = searchParams.get("board");
    const paperType = searchParams.get("paperType") || "1";

    if (!rawSubject || !classLevel || !board) {
      return NextResponse.json(
        { success: false, message: "subject, class, and board are required" },
        { status: 400 },
      );
    }

    const { curriculumSubject, pastPaperSubject } = resolveSubjectMapping(rawSubject);

    // Determine question types based on paper type
    const questionTypes = paperType === "2" ? "('CRQ', 'ERQ')" : "('MCQ')";

    // All syllabus chapters for this curriculum, with question counts for the selected paper type
    const { rows: chapters } = await db.query(
      `SELECT
         ch.id,
         ch.chapter_number,
         ch.chapter_name,
         ch.analyzed_content,
         COUNT(q.id) AS question_count
       FROM chapters ch
       INNER JOIN curriculums c ON ch.curriculum_id = c.id
       LEFT JOIN (
         SELECT q.id, q.chapter_id
         FROM questions q
         INNER JOIN past_papers pp ON q.past_paper_id = pp.id
         WHERE q.question_type IN ${questionTypes}
           AND pp.class ILIKE $2
           AND pp.board ILIKE $3
           AND (pp.subject ILIKE $4 OR pp.subject ILIKE $1)
       ) q ON q.chapter_id = ch.id
       WHERE (c.subject ILIKE $5 OR c.subject ILIKE $1)
         AND c.class ILIKE $2
         AND c.board ILIKE $3
       GROUP BY ch.id, ch.chapter_number, ch.chapter_name, ch.analyzed_content
       ORDER BY ch.chapter_number ASC`,
      [rawSubject, classLevel, board, pastPaperSubject, curriculumSubject],
    );

    const formattedChapters = chapters.map((ch: any) => {
      let subtopics: any[] = [];
      const flatSlos: any[] = [];

      if (ch.analyzed_content) {
        try {
          const raw =
            typeof ch.analyzed_content === "string"
              ? JSON.parse(ch.analyzed_content)
              : ch.analyzed_content;

          const rawSubtopics: any[] = Array.isArray(raw?.subtopics) ? raw.subtopics : [];
          subtopics = rawSubtopics
            .map((st: any, sIdx: number) => {
              const stNum = String(st.subtopicNumber || `${ch.chapter_number}.${sIdx + 1}`);
              const stName = String(st.subtopicName || `Topic ${stNum}`);
              const stSlos = (Array.isArray(st.slos) ? st.slos : [])
                .map((slo: any, sloIdx: number) => {
                  const sloNumber = String(slo.sloNumber || `${stNum}.${sloIdx + 1}`);
                  const sloText = String(slo.sloText || "").trim();
                  const cog = String(slo.cognitiveLevel || "U").toUpperCase();
                  const item = {
                    sloNumber,
                    sloText,
                    cognitiveLevel: cog,
                    subtopicNumber: stNum,
                    subtopicName: stName,
                  };
                  if (sloText) {
                    flatSlos.push(item);
                  }
                  return item;
                })
                .filter((s: any) => s.sloText);

              return {
                subtopicNumber: stNum,
                subtopicName: stName,
                slos: stSlos,
              };
            })
            .filter((st: any) => st.slos.length > 0);

          if (subtopics.length === 0 && Array.isArray(raw?.learningObjectives)) {
            const genericSlos = raw.learningObjectives
              .map((text: string, idx: number) => {
                const item = {
                  sloNumber: `${ch.chapter_number}.${idx + 1}`,
                  sloText: String(text || "").trim(),
                  cognitiveLevel: "U",
                  subtopicNumber: `${ch.chapter_number}.1`,
                  subtopicName: ch.chapter_name,
                };
                if (item.sloText) flatSlos.push(item);
                return item;
              })
              .filter((s: any) => s.sloText);

            if (genericSlos.length > 0) {
              subtopics = [
                {
                  subtopicNumber: `${ch.chapter_number}.1`,
                  subtopicName: ch.chapter_name,
                  slos: genericSlos,
                },
              ];
            }
          }
        } catch (e) {
          console.error("Failed to parse chapter analyzed_content:", e);
        }
      }

      return {
        id: ch.id,
        chapterNumber: ch.chapter_number,
        chapterName: ch.chapter_name,
        questionCount: parseInt(ch.question_count, 10) || 0,
        subtopics,
        slos: flatSlos,
        totalSlos: flatSlos.length,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedChapters,
    });
  } catch (error: any) {
    console.error("Fetch chapters error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch chapters" },
      { status: 500 },
    );
  }
}
