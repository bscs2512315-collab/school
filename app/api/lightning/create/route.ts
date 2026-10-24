import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/response-handlers";
import {
  ensureLightningSchema,
  generateUniquePinCode,
  type LightningQuestion,
  type LightningSourceMode,
} from "@/lib/lightning/lightning-schema";
import { generatePaperLogic } from "@/lib/paper-utils";
import { generateSloAlignedPaper } from "@/lib/paper/slo-paper-generator";
import { generateCustomPaperQuestions } from "@/lib/ai/generate-paper-custom";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request);
    const body = await request.json();

    const {
      userId: bodyUserId,
      title,
      subject,
      classLevel,
      board = "AKUEB",
      sourceMode = "past_papers" as LightningSourceMode,
      perQuestionSeconds = 20,
      chapterIds = [],
      prompt,
      imageUrls = [],
      manualQuestions = [],
      classroomId,
      classroomIds,
      questionCount = 10,
    } = body;

    const creatorId = auth?.userId || bodyUserId;
    if (!creatorId) {
      return errorResponse("Authentication required to create a Lightning Round", 401);
    }

    if (!subject || !classLevel) {
      return errorResponse("Subject and Class Level are required", 400);
    }

    await ensureLightningSchema();

    let finalQuestions: LightningQuestion[] = [];

    if (sourceMode === "manual") {
      if (!Array.isArray(manualQuestions) || manualQuestions.length === 0) {
        return errorResponse("Please add at least 1 question for manual mode", 400);
      }

      finalQuestions = manualQuestions.map((q: any, idx: number) => {
        const rawOptions = Array.isArray(q.options) ? q.options : [];
        const options = rawOptions.map((opt: any, optIdx: number) => ({
          id: String(opt.id || String.fromCharCode(65 + optIdx)),
          text: String(opt.text || ""),
        }));

        let correctOption = String(q.correctOptionId || "A").trim().toUpperCase();
        if (correctOption.length > 1) {
          const foundIdx = options.findIndex((o: any) => o.id === correctOption || o.text === correctOption);
          if (foundIdx >= 0) {
            correctOption = String.fromCharCode(65 + foundIdx);
          }
        }

        return {
          id: q.id || `q_${idx + 1}`,
          questionNumber: idx + 1,
          questionText: q.questionText || `Question ${idx + 1}`,
          options: options.length >= 2 ? options : [
            { id: "A", text: "Option A" },
            { id: "B", text: "Option B" },
            { id: "C", text: "Option C" },
            { id: "D", text: "Option D" },
          ],
          correctOptionId: correctOption,
          explanation: q.explanation || "",
          marks: q.marks || 1,
        };
      });
    } else if (sourceMode === "slos") {
      const sloNumbers = Array.isArray(body?.sloNumbers)
        ? (body.sloNumbers as unknown[])
            .map(String)
            .filter((n: string) => n.trim().length > 0)
        : undefined;

      const targetQuestionCount =
        typeof questionCount === "number" && questionCount > 0 ? questionCount : 10;

      const generated = await generateSloAlignedPaper({
        userId: creatorId,
        subject,
        classLevel,
        board,
        paperType: "1",
        chapterIds: Array.isArray(chapterIds) ? chapterIds : [],
        sloNumbers: sloNumbers && sloNumbers.length > 0 ? sloNumbers : undefined,
        questionCount: targetQuestionCount,
        includeAnswers: true,
      });

      finalQuestions = (generated.questions || []).map((q, idx) => ({
        id: q.id,
        questionNumber: idx + 1,
        questionText: q.questionText,
        options: (q.mcqOptions || []).map((opt, optIdx) => ({
          id: opt.id || String.fromCharCode(65 + optIdx),
          text: opt.text,
        })),
        correctOptionId: (q.correctAnswer || "A").toUpperCase(),
        imageUrl: q.imageUrl,
        marks: q.marks || 1,
      }));
    } else if (sourceMode === "custom_ai") {
      const targetQuestionCount =
        typeof questionCount === "number" && questionCount > 0 ? questionCount : 10;

      const generated = await generateCustomPaperQuestions({
        paperType: "1",
        count: targetQuestionCount,
        prompt: prompt?.trim(),
        imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
        subject,
        classLevel,
        board,
        includeAnswers: true,
      });

      finalQuestions = (generated.questions || []).map((q, idx) => ({
        id: q.id,
        questionNumber: idx + 1,
        questionText: q.questionText,
        options: (q.mcqOptions || []).map((opt, optIdx) => ({
          id: opt.id || String.fromCharCode(65 + optIdx),
          text: opt.text,
        })),
        correctOptionId: (q.correctAnswer || "A").toUpperCase(),
        imageUrl: q.imageUrl,
        marks: q.marks || 1,
      }));
    } else {
      // Past Papers Bank
      if (Array.isArray(chapterIds) && chapterIds.length > 0) {
        try {
          const generated = await generatePaperLogic({
            userId: creatorId,
            subject,
            classLevel,
            board,
            paperType: "1",
            chapterIds,
          });

          if (generated.questions && generated.questions.length > 0) {
            finalQuestions = generated.questions.map((q: any, idx: number) => {
              const rawOpts = q.options || q.mcqOptions || [];
              const options = rawOpts.map((opt: any, optIdx: number) => ({
                id: String(opt.id || opt.optionKey || String.fromCharCode(65 + optIdx)),
                text: String(opt.text || opt.optionText || opt),
              }));

              return {
                id: String(q.id || `q_${idx + 1}`),
                questionNumber: idx + 1,
                questionText: q.questionText || q.text || `Question ${idx + 1}`,
                options,
                correctOptionId: String(q.correctAnswer || q.correctOption || "A").toUpperCase(),
                imageUrl: q.imageUrl || null,
                marks: q.marks || 1,
              };
            });
          }
        } catch (err) {
          console.warn("Could not load from past paper bank, falling back to SLO generator:", err);
        }
      }

      if (finalQuestions.length === 0) {
        const targetQuestionCount =
          typeof questionCount === "number" && questionCount > 0 ? questionCount : 10;

        // Fallback to SLO generated if bank didn't yield
        const generated = await generateSloAlignedPaper({
          userId: creatorId,
          subject,
          classLevel,
          board,
          paperType: "1",
          chapterIds: Array.isArray(chapterIds) ? chapterIds : [],
          questionCount: targetQuestionCount,
          includeAnswers: true,
        });

        finalQuestions = (generated.questions || []).map((q, idx) => ({
          id: q.id,
          questionNumber: idx + 1,
          questionText: q.questionText,
          options: (q.mcqOptions || []).map((opt, optIdx) => ({
            id: opt.id || String.fromCharCode(65 + optIdx),
            text: opt.text,
          })),
          correctOptionId: (q.correctAnswer || "A").toUpperCase(),
          imageUrl: q.imageUrl,
          marks: q.marks || 1,
        }));
      }
    }

    if (finalQuestions.length === 0) {
      return errorResponse("Failed to generate questions for Lightning Round", 400);
    }

    // STRICTLY RESPECT USER'S SELECTED QUESTION COUNT
    const targetCount =
      typeof questionCount === "number" && questionCount > 0 ? questionCount : 10;

    if (sourceMode !== "manual" && finalQuestions.length > targetCount) {
      // Shuffle to provide random variety across selected chapters, then slice to exact user count
      const shuffled = [...finalQuestions].sort(() => Math.random() - 0.5);
      finalQuestions = shuffled.slice(0, targetCount);
    }

    // Ensure sequential question numbering (1, 2, 3... targetCount)
    finalQuestions = finalQuestions.map((q, idx) => ({
      ...q,
      questionNumber: idx + 1,
    }));

    const pinCode = await generateUniquePinCode();
    const cleanSeconds = [10, 15, 20, 30].includes(Number(perQuestionSeconds))
      ? Number(perQuestionSeconds)
      : 20;

    const { rows: creatorRows } = await db.query<{
      name: string;
      username: string | null;
      profile_image: string | null;
      role: string;
    }>(
      `SELECT name, username, profile_image, role FROM users WHERE id = $1`,
      [creatorId],
    );

    const creator = creatorRows[0] || {
      name: "Host",
      username: null,
      profile_image: null,
      role: auth?.role?.toUpperCase() || "STUDENT",
    };

    const creatorRole = creator.role?.toUpperCase() === "TEACHER" ? "TEACHER" : "STUDENT";
    const sessionTitle = title?.trim() || `${subject} Lightning Round`;

    const { rows: sessionRows } = await db.query<{ id: string }>(
      `INSERT INTO lightning_sessions (
        pin_code,
        creator_id,
        creator_role,
        title,
        subject,
        class_level,
        board,
        status,
        phase,
        source_mode,
        per_question_seconds,
        current_question_index,
        paper_data,
        classroom_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'LOBBY', 'LOBBY', $8, $9, 0, $10, $11)
      RETURNING id`,
      [
        pinCode,
        creatorId,
        creatorRole,
        sessionTitle,
        subject,
        classLevel,
        board,
        sourceMode,
        cleanSeconds,
        JSON.stringify(finalQuestions),
        classroomId || null,
      ],
    );

    const sessionId = sessionRows[0].id;

    // Register creator as first participant if creator is not a TEACHER
    // Teachers are session hosts/presenters and should not be student participants attempting questions
    if (creatorRole !== "TEACHER") {
      await db.query(
        `INSERT INTO lightning_participants (
          session_id, user_id, name, username, profile_image, is_connected
        ) VALUES ($1, $2, $3, $4, $5, true)
        ON CONFLICT (session_id, user_id) DO UPDATE SET is_connected = true`,
        [sessionId, creatorId, creator.name, creator.username, creator.profile_image],
      );
    }

    // Notify all students in target classroom(s) via in-app notification & Web Push
    const targetClassroomIds = Array.isArray(classroomIds)
      ? classroomIds.filter(Boolean)
      : classroomId
      ? [classroomId]
      : [];

    if (targetClassroomIds.length > 0) {
      try {
        const { rows: members } = await db.query<{
          student_id: string;
          classroom_id: string;
        }>(
          `SELECT DISTINCT student_id, classroom_id FROM classroom_members
           WHERE classroom_id = ANY($1) AND status = 'accepted'`,
          [targetClassroomIds],
        );

        await Promise.all(
          members.map((m) =>
            createNotification({
              userId: m.student_id,
              type: "CHALLENGE_INVITE",
              title: " Live Lightning Round Starting!",
              message: `${creator.name} started a live quiz! Join PIN: ${pinCode} · ${sessionTitle}`,
              link: `/student/lightning/${sessionId}`,
              metadata: {
                sessionId,
                pinCode,
                classroomId: m.classroom_id,
                title: sessionTitle,
                subject,
              },
            }).catch((err) => {
              console.error("Failed to notify student for lightning round:", err);
            }),
          ),
        );
      } catch (notifErr) {
        console.error("Error dispatching lightning notifications to classroom:", notifErr);
      }
    }

    return successResponse({
      sessionId,
      pinCode,
      title: sessionTitle,
      subject,
      classLevel,
      totalQuestions: finalQuestions.length,
      perQuestionSeconds: cleanSeconds,
      sourceMode,
    });
  } catch (error: any) {
    console.error("Error creating lightning session:", error);
    return errorResponse(error?.message || "Internal server error creating lightning session", 500);
  }
}
