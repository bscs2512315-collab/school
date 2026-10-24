import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import {
  ensureClassroomSchema,
  parseClassroomId,
} from "@/lib/teacher/classroom-schema";
import {
  generateSloAlignedPaper,
  type GeneratedSloPaperQuestion,
} from "@/lib/paper/slo-paper-generator";
import { randomUUID } from "crypto";
import { generateCustomPaperQuestions } from "@/lib/ai/generate-paper-custom";
import { createNotification } from "@/lib/notifications";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { generatePaperLogic } from "@/lib/paper-utils";
import { regenerateSingleQuestionWithAi } from "@/lib/ai/regenerate-question";

// Extend the serverless function timeout to 60 s so Gemini AI calls
// (which take 10–30 s per batch) don't hit the Netlify 10-second limit.
export const maxDuration = 60;

/**
 * GET /api/teacher/papers?classroomId=
 * POST /api/teacher/papers
 *   action: "generate" — draft with correct answers (no classroom publish yet)
 *   action: "publish"  — publish Practice Test into classroom (default)
 */

function normalizeSnapshotQuestions(
  questions: GeneratedSloPaperQuestion[],
): Array<Record<string, unknown>> {
  return questions.map((q, index) => {
    const mcqOptions = Array.isArray(q.mcqOptions)
      ? q.mcqOptions.map((opt, optIndex) => {
          if (opt && typeof opt === "object" && "id" in opt) {
            return {
              id: String(opt.id),
              text: String(opt.text ?? ""),
            };
          }
          const letter = String.fromCharCode(65 + optIndex);
          const text = String(opt ?? "");
          return {
            id: letter,
            text: text.replace(/^[A-D][).:\-]\s*/i, "").trim() || text,
          };
        })
      : null;

    return {
      id: q.id,
      questionNumber: q.questionNumber || index + 1,
      questionPart: q.questionPart ?? null,
      questionText: String(q.questionText ?? "").trim(),
      questionType: q.questionType,
      marks: Number(q.marks) || 1,
      sloNumber: q.sloNumber ?? null,
      chapterName: q.chapterName ?? null,
      chapterId: q.chapterId ?? null,
      imageUrl: q.imageUrl ?? null,
      mcqOptions,
      correctAnswer: q.correctAnswer ?? null,
      paperIIData: q.paperIIData ?? null,
    };
  });
}

export async function GET(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    await ensureClassroomSchema();

    const { searchParams } = new URL(req.url);
    const classroomId = searchParams.get("classroomId");
    const chapterId = searchParams.get("chapterId");

    const values: unknown[] = [user.userId];
    let where = "teacher_id = $1 AND (is_remedial IS NULL OR is_remedial = false)";
    if (classroomId) {
      values.push(decodeURIComponent(classroomId));
      where += ` AND classroom_id = $${values.length}`;
    }
    if (chapterId) {
      values.push(JSON.stringify([chapterId]));
      where += ` AND chapter_ids @> $${values.length}::jsonb`;
    }

    const { rows } = await db.query(
      `SELECT id, classroom_id, title, description, paper_type, subject, class_level, board,
              total_marks, total_questions, due_date, created_at, chapter_ids,
              strict_mode, allow_resume
       FROM teacher_papers
       WHERE ${where}
       ORDER BY created_at DESC`,
      values,
    );

    return successResponse(
      rows.map((row) => ({
        id: row.id,
        classroomId: row.classroom_id,
        title: row.title,
        description: row.description,
        paperType: row.paper_type,
        subject: row.subject,
        classLevel: row.class_level,
        board: row.board,
        totalMarks: row.total_marks,
        totalQuestions: row.total_questions,
        dueDate: row.due_date,
        createdAt: row.created_at,
        chapterIds: row.chapter_ids,
        strictMode: row.strict_mode !== null && row.strict_mode !== undefined ? Boolean(row.strict_mode) : true,
        allowResume: Boolean(row.allow_resume),
        label: "Practice Test",
      })),
      "Teacher papers fetched",
    );
  } catch (error) {
    console.error("Fetch teacher papers error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();

    if (body.action === "regenerate_question") {
      const {
        question,
        paperType,
        subject,
        classLevel,
        board,
        chapterName,
        instruction,
        difficulty,
        excludeQuestionTexts,
      } = body;

      if (!question || !question.questionText) {
        return errorResponse("Question data is required for regeneration", 400);
      }

      const paperTypeKey =
        String(paperType) === "2" || paperType === "paper2" ? "2" : "1";

      const regenerated = await regenerateSingleQuestionWithAi({
        question,
        paperType: paperTypeKey,
        subject: subject || "General",
        classLevel: classLevel || "IX",
        board: board || "AKUEB",
        chapterName: chapterName || question.chapterName,
        instruction: typeof instruction === "string" ? instruction.trim() : "",
        difficulty:
          difficulty === "Alpha" || difficulty === "Gamma" || difficulty === "Beta"
            ? difficulty
            : "Beta",
        excludeQuestionTexts: Array.isArray(excludeQuestionTexts)
          ? excludeQuestionTexts
          : [],
      });

      return successResponse(
        { question: regenerated },
        "Question regenerated successfully with AI",
      );
    }

    const action = body.action === "generate" ? "generate" : "publish";

    const {
      classroomId,
      classroomIds,
      title,
      description,
      paperType,
      subject,
      classLevel,
      board,
      chapterIds,
      questionCount,
      dueDate,
      generatedPaperId,
      questions,
      difficulty,
    } = body;

    const rawClassroomIds = Array.isArray(classroomIds) && classroomIds.length > 0
      ? classroomIds.map(String)
      : (classroomId ? [String(classroomId)] : []);

    if (rawClassroomIds.length === 0 || !paperType || !subject || !classLevel || !board) {
      return errorResponse(
        "classroomId or classroomIds, paperType, subject, classLevel, and board are required",
        400,
      );
    }

    for (const cId of rawClassroomIds) {
      const parsed = parseClassroomId(cId);
      if (parsed && parsed.teacherId === user.userId) {
        continue;
      }
      const { rows: crRows } = await db.query(
        `SELECT teacher_id FROM teacher_classrooms WHERE id = $1`,
        [cId],
      );
      if (crRows.length === 0 || crRows[0].teacher_id !== user.userId) {
        return errorResponse("Access denied to classroom", 403);
      }
    }

    await ensureClassroomSchema();

    const paperTypeKey =
      String(paperType) === "2" || paperType === "paper2" ? "2" : "1";

    if (action === "generate") {
      const mode = body.mode || "past_papers";
      const prompt = body.prompt;
      const imageUrls = body.imageUrls;

      if (mode === "custom") {
        const hasManual = Array.isArray(body.manualQuestions) && body.manualQuestions.length > 0;
        const hasImages = Array.isArray(imageUrls) && imageUrls.length > 0;
        const hasPrompt = Boolean(prompt && prompt.trim());

        if (!hasManual && !hasImages && !hasPrompt) {
          return errorResponse("Provide at least one reference image, prompt, or manual questions", 400);
        }

        let questionsList: GeneratedSloPaperQuestion[] = [];
        let totalQuestions = 25;
        let totalMarks = 25;
        let suggestedTitle = title?.trim() || `Practice Test · ${subject} Class ${classLevel} · Paper ${paperTypeKey}`;

        if (hasManual) {
          const manualQuestions = body.manualQuestions as Array<{
            id?: string;
            questionText?: string;
            marks?: number;
            options?: Array<{ id?: string; text?: string }>;
            correctOptionId?: string;
          }>;
          questionsList = manualQuestions.map((q, idx) => {
            const rawOptions = Array.isArray(q.options) ? q.options : [];
            const options = rawOptions.map((opt, optIdx) => ({
              id: String(opt.id || String.fromCharCode(65 + optIdx)),
              text: String(opt.text || ""),
            }));

            return {
              id: q.id || `q_${idx + 1}`,
              questionNumber: idx + 1,
              questionPart: null,
              questionText: String(q.questionText || `Question ${idx + 1}`),
              questionType: "MCQ",
              marks: Number(q.marks) || 1,
              chapterName: "Manual Quiz",
              chapterId: null,
              imageUrl: null,
              mcqOptions: options,
              correctAnswer: String(q.correctOptionId || "A").toUpperCase(),
              paperIIData: null,
            };
          });
          totalQuestions = questionsList.length;
          totalMarks = questionsList.reduce((acc, q) => acc + (q.marks || 1), 0);
        } else {
          const customGenerated = await generateCustomPaperQuestions({
            paperType: paperTypeKey,
            count: questionCount ? Number(questionCount) : 25,
            prompt: prompt?.trim(),
            imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
            subject,
            classLevel,
            board,
            includeAnswers: true,
            difficulty:
              difficulty === "Alpha" || difficulty === "Gamma" || difficulty === "Beta"
                ? difficulty
                : undefined,
          });
          questionsList = customGenerated.questions;
          totalQuestions = customGenerated.totalQuestions;
          totalMarks = customGenerated.totalMarks;
          if (customGenerated.title && !title?.trim()) {
            suggestedTitle = customGenerated.title;
          }
        }

        const generatedPaperId = randomUUID();
        const snapshot = questionsList.map((q) => ({
          id: q.id,
          questionNumber: q.questionNumber,
          questionPart: q.questionPart,
          questionText: q.questionText,
          questionType: q.questionType,
          marks: q.marks,
          chapterName: q.chapterName,
          chapterId: q.chapterId,
          imageUrl: q.imageUrl,
          mcqOptions: q.mcqOptions ?? null,
          correctAnswer: q.correctAnswer ?? null,
          paperIIData: q.paperIIData ?? null,
        }));

        const isPublic = body?.isPublic !== undefined ? Boolean(body.isPublic) : true;
        const finalTitle = (title?.trim() || suggestedTitle || `${subject} Class ${classLevel} · Paper ${paperTypeKey}`).trim();
        const uniqueChapterNames = Array.from(
          new Set(questionsList.map((q) => q.chapterName).filter(Boolean) as string[])
        );

        await db.query(
          `INSERT INTO generated_papers
             (id, user_id, paper_type, subject, class, board, chapter_ids, question_ids, questions_snapshot, question_count, is_public, title, mode, creator_role, total_marks, chapter_names)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [
            generatedPaperId,
            user.userId,
            `paper${paperTypeKey}`,
            subject,
            classLevel,
            board,
            JSON.stringify([]),
            JSON.stringify(questionsList.map((q) => q.id)),
            JSON.stringify(snapshot),
            questionsList.length,
            isPublic,
            finalTitle,
            hasManual ? "manual" : "custom",
            "TEACHER",
            totalMarks,
            JSON.stringify(uniqueChapterNames.length > 0 ? uniqueChapterNames : [subject]),
          ],
        );

        return successResponse(
          {
            generatedPaperId,
            paperType: parseInt(paperTypeKey, 10),
            subject,
            classLevel,
            board,
            totalQuestions,
            totalMarks,
            source: hasManual ? "manual" : "custom_ai",
            questions: snapshot,
            suggestedTitle: finalTitle,
          },
          "Draft paper generated — preview and edit before publishing",
        );
      }

      if (!Array.isArray(chapterIds) || chapterIds.length === 0) {
        return errorResponse("Select at least one chapter", 400);
      }

      const isPublic = body?.isPublic !== undefined ? Boolean(body.isPublic) : true;
      const finalTitle = (
        title?.trim() ||
        `Practice Test · ${subject} Class ${classLevel} · Paper ${paperTypeKey}`
      ).trim();

      // Fast path: for Past Papers Bank, query real verified past exam questions directly from PostgreSQL.
      // Completes in ~100ms and avoids slow serverless AI loops that trigger 502 Bad Gateway timeouts.
      if (mode === "past_papers" && (!body?.sloNumbers || body.sloNumbers.length === 0) && !difficulty) {
        try {
          const paperData = await generatePaperLogic({
            userId: user.userId,
            subject,
            classLevel,
            board,
            paperType: paperTypeKey,
            chapterIds,
          });

          if (paperData && Array.isArray(paperData.questions) && paperData.questions.length > 0) {
            const formatted = paperData.questions.map((q: any, idx: number) => {
              const correct =
                paperData._correctAnswers?.[q.id] ||
                q.correctAnswer ||
                (paperTypeKey === "1" ? "A" : null);

              return {
                id: q.id,
                questionNumber: idx + 1,
                questionPart: q.questionPart ?? null,
                questionText: q.questionText,
                questionType: q.questionType,
                marks: Number(q.marks) || 1,
                sloNumber: null,
                chapterName: q.chapterName || null,
                imageUrl: q.imageUrl || null,
                mcqOptions: q.mcqOptions || null,
                correctAnswer: correct,
                paperIIData: q.paperIIData || null,
              };
            });

            await db.query(
              `UPDATE generated_papers
               SET questions_snapshot = $1, is_public = $2, title = $3, creator_role = $4, total_marks = $5, question_count = $6
               WHERE id = $7`,
              [
                JSON.stringify(formatted),
                isPublic,
                finalTitle,
                "TEACHER",
                paperData.totalMarks,
                formatted.length,
                paperData.generatedPaperId,
              ],
            );

            return successResponse(
              {
                generatedPaperId: paperData.generatedPaperId,
                paperType: paperData.paperType,
                subject: paperData.subject,
                classLevel: paperData.classLevel,
                board: paperData.board,
                totalQuestions: formatted.length,
                totalMarks: paperData.totalMarks,
                source: "bank",
                questions: formatted,
                suggestedTitle: finalTitle,
              },
              "Draft paper generated from Past Papers Bank",
            );
          }
        } catch (bankErr) {
          console.warn("generatePaperLogic fallback to SLO generator:", bankErr);
        }
      }

      const generated = await generateSloAlignedPaper({
        userId: user.userId,
        subject,
        classLevel,
        board,
        paperType: paperTypeKey,
        chapterIds,
        // Cap per-request question count to match the AI batch size.
        // Paper 2 CRQs produce large output (markingNotes etc.) — keep to 5.
        // Paper 1 MCQs are compact — allow up to 12.
        // The modal handles client-side batching above these limits.
        questionCount: Math.min(
          questionCount ? Number(questionCount) : (paperTypeKey === "2" ? 5 : 12),
          paperTypeKey === "2" ? 5 : 12,
        ),
        sloNumbers: Array.isArray(body?.sloNumbers)
          ? (body.sloNumbers as unknown[]).map(String).filter((n: string) => n.trim().length > 0)
          : undefined,
        aiOnly: body?.mode === "slos" || Boolean(difficulty),
        includeAnswers: true,
        difficulty:
          difficulty === "Alpha" || difficulty === "Gamma" || difficulty === "Beta"
            ? difficulty
            : body?.mode === "slos"
              ? "Beta"
              : undefined,
        isPublic,
        title: finalTitle,
        creatorRole: "TEACHER",
      });

      return successResponse(
        {
          generatedPaperId: generated.generatedPaperId,
          paperType: generated.paperType,
          subject: generated.subject,
          classLevel: generated.classLevel,
          board: generated.board,
          totalQuestions: generated.totalQuestions,
          totalMarks: generated.totalMarks,
          source: generated.source,
          questions: generated.questions,
          suggestedTitle:
            title?.trim() ||
            `Practice Test · ${subject} Class ${classLevel} · Paper ${paperTypeKey}`,
        },
        "Draft paper generated — preview and edit before publishing",
      );
    }

    // publish
    const publishTitle =
      (typeof title === "string" && title.trim()) ||
      `Practice Test · ${subject} Class ${classLevel} · Paper ${paperTypeKey}`;

    let snapshot: Array<Record<string, unknown>> | null = null;
    let questionIds: string[] = [];
    let totalMarks = 0;
    let totalQuestions = 0;
    let chapterIdsToStore = Array.isArray(chapterIds) ? chapterIds : [];
    const sourceGeneratedId =
      typeof generatedPaperId === "string" ? generatedPaperId : null;

    if (Array.isArray(questions) && questions.length > 0) {
      snapshot = normalizeSnapshotQuestions(questions as GeneratedSloPaperQuestion[]);
      questionIds = snapshot.map((q) => String(q.id));
      totalMarks = snapshot.reduce(
        (sum, q) => sum + (Number(q.marks) || 0),
        0,
      );
      totalQuestions = snapshot.length;
    } else if (sourceGeneratedId) {
      const { rows: snapshotRows } = await db.query(
        `SELECT questions_snapshot, question_ids, chapter_ids
         FROM generated_papers WHERE id = $1 AND user_id = $2`,
        [sourceGeneratedId, user.userId],
      );
      if (snapshotRows.length === 0) {
        return errorResponse("Generated draft not found. Generate again.", 404);
      }
      snapshot = snapshotRows[0].questions_snapshot;
      questionIds = Array.isArray(snapshotRows[0].question_ids)
        ? snapshotRows[0].question_ids
        : [];
      if (Array.isArray(snapshot)) {
        totalQuestions = snapshot.length;
        totalMarks = snapshot.reduce(
          (sum, q) => sum + (Number((q as { marks?: number }).marks) || 0),
          0,
        );
      }
      if (!chapterIdsToStore.length && Array.isArray(snapshotRows[0].chapter_ids)) {
        chapterIdsToStore = snapshotRows[0].chapter_ids;
      }
    } else {
      return errorResponse(
        "Provide edited questions or a generatedPaperId to publish",
        400,
      );
    }

    if (!snapshot || totalQuestions === 0) {
      return errorResponse("Cannot publish an empty paper", 400);
    }

    const { rows: teacherUserRows } = await db.query(
      `SELECT exam_strict_mode FROM users WHERE id = $1`,
      [user.userId],
    );
    const resolvedStrictMode =
      body.strictMode !== undefined
        ? Boolean(body.strictMode)
        : Boolean(teacherUserRows[0]?.exam_strict_mode ?? true);
    const resolvedAllowResume =
      body.allowResume !== undefined ? Boolean(body.allowResume) : false;

    const insertedPaperIds: string[] = [];

    for (const targetCid of rawClassroomIds) {
      const { rows: inserted } = await db.query(
        `INSERT INTO teacher_papers
           (teacher_id, classroom_id, title, description, paper_type, subject, class_level, board,
            chapter_ids, question_ids, questions_snapshot, total_marks, total_questions, due_date, strict_mode, allow_resume)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         RETURNING id, created_at`,
        [
          user.userId,
          targetCid,
          publishTitle,
          description || "Practice Test assigned by your teacher",
          `paper${paperTypeKey}`,
          subject,
          classLevel,
          board,
          JSON.stringify(chapterIdsToStore),
          JSON.stringify(questionIds),
          JSON.stringify(snapshot),
          totalMarks,
          totalQuestions,
          dueDate || null,
          resolvedStrictMode,
          resolvedAllowResume,
        ],
      );

      const paperId = inserted[0]?.id;
      if (paperId) insertedPaperIds.push(paperId);

      const { rows: members } = await db.query(
        `SELECT student_id FROM classroom_members
         WHERE classroom_id = $1 AND status = 'accepted'`,
        [targetCid],
      );

      await Promise.all(
        members.map((m) =>
          createNotification({
            userId: m.student_id,
            type: "TEACHER_PAPER_ASSIGNED",
            title: "New Practice Test assigned",
            message: `${publishTitle} — ${subject} Class ${classLevel}`,
            link: FRONTEND_ROUTES.STUDENT_CLASSROOM(targetCid),
            metadata: {
              paperId,
              classroomId: targetCid,
              paperType: paperTypeKey,
              label: "Practice Test",
            },
          }).catch(() => {}),
        ),
      );
    }

    return successResponse(
      {
        id: insertedPaperIds[0],
        ids: insertedPaperIds,
        generatedPaperId: sourceGeneratedId,
        totalQuestions,
        totalMarks,
        title: publishTitle,
        label: "Practice Test",
        classroomsCount: rawClassroomIds.length,
      },
      `Practice Test published to ${rawClassroomIds.length} classroom${rawClassroomIds.length === 1 ? "" : "s"}`,
    );
  } catch (error: unknown) {
    console.error("Create teacher paper error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create paper";
    return errorResponse(message, 500);
  }
}
