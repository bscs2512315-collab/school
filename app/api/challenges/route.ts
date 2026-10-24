import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { randomUUID } from "crypto";
import { createNotification } from "@/lib/notifications";
import { generatePaperLogic } from "@/lib/paper-utils";
import { generateSloAlignedPaper } from "@/lib/paper/slo-paper-generator";
import { generateCustomPaperQuestions } from "@/lib/ai/generate-paper-custom";
import { sendChallengeInviteEmail } from "@/lib/email";

// ── Lazy migration ────────────────────────────────────────────────────────────
async function ensureChallengeTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS challenges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      creator_id TEXT NOT NULL REFERENCES users(id),
      subject TEXT NOT NULL,
      class_level TEXT NOT NULL,
      board TEXT NOT NULL,
      paper_type INT DEFAULT 1,
      chapter_ids TEXT,
      generated_paper_id TEXT,
      paper_data JSONB,
      status TEXT DEFAULT 'WAITING',
      max_wait_minutes INT DEFAULT 5,
      started_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS challenge_participants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      status TEXT DEFAULT 'INVITED',
      score INT,
      total_marks INT,
      percentage DECIMAL(5,2),
      time_taken INT,
      started_at TIMESTAMPTZ,
      submitted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(challenge_id, user_id)
    );
  `);

  // Lazy add column for existing tables
  await db
    .query(
      "ALTER TABLE challenge_participants ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ",
    )
    .catch(() => {});
}

/**
 * POST /api/challenges
 * Create a challenge: generate paper (Past Papers, SLOs, or Custom) + invite friends
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    await ensureChallengeTables();

    const body = await request.json();
    const {
      subject,
      classLevel,
      board,
      paperType = "1",
      chapterIds,
      inviteUsernames,
      mode = "past_papers",
      prompt,
      imageUrls,
    } = body;

    if (
      !subject ||
      !classLevel ||
      !board ||
      !inviteUsernames?.length
    ) {
      return errorResponse(
        "Subject, class, board, and at least one friend username are required",
        400,
      );
    }

    const normalizedType =
      String(paperType) === "2" || paperType === "paper2" ? "2" : "1";

    let paperData: any;

    if (mode === "custom") {
      const hasImages = Array.isArray(imageUrls) && imageUrls.length > 0;
      const hasPrompt = Boolean(prompt && prompt.trim());
      if (!hasImages && !hasPrompt) {
        return errorResponse("Provide at least one reference image or custom prompt", 400);
      }

      const generated = await generateCustomPaperQuestions({
        paperType: normalizedType,
        count: 25,
        prompt: prompt?.trim(),
        imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
        subject,
        classLevel,
        board,
      });

      const generatedPaperId = randomUUID();
      const snapshot = generated.questions.map((q) => ({
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

      await db.query(
        `INSERT INTO generated_papers
           (id, user_id, paper_type, subject, class, board, chapter_ids, question_ids, questions_snapshot, question_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          generatedPaperId,
          user.userId,
          `paper${normalizedType}`,
          subject,
          classLevel,
          board,
          JSON.stringify([]),
          JSON.stringify(generated.questions.map((q) => q.id)),
          JSON.stringify(snapshot),
          generated.questions.length,
        ],
      );

      const clientQuestions = snapshot.map((q) => ({
        id: q.id,
        questionNumber: q.questionNumber,
        questionPart: q.questionPart,
        questionText: q.questionText,
        questionType: q.questionType,
        marks: q.marks,
        chapterName: q.chapterName,
        imageUrl: q.imageUrl,
        mcqOptions: q.mcqOptions,
      }));

      paperData = {
        generatedPaperId,
        paperType: parseInt(normalizedType, 10),
        subject,
        classLevel,
        board,
        totalMarks: generated.totalMarks,
        totalQuestions: clientQuestions.length,
        questions: clientQuestions,
      };
    } else if (mode === "slos") {
      if (!chapterIds?.length) {
        return errorResponse("Select at least one chapter for SLO paper", 400);
      }
      const sloNumbers = Array.isArray(body.sloNumbers)
        ? (body.sloNumbers as unknown[])
            .map(String)
            .filter((n: string) => n.trim().length > 0)
        : undefined;

      paperData = await generateSloAlignedPaper({
        userId: user.userId,
        subject,
        classLevel,
        board,
        paperType: normalizedType,
        chapterIds,
        sloNumbers: sloNumbers && sloNumbers.length > 0 ? sloNumbers : undefined,
        questionCount: 25,
      });
    } else {
      if (!chapterIds?.length) {
        return errorResponse("Select at least one chapter", 400);
      }
      paperData = await generatePaperLogic({
        userId: user.userId,
        subject,
        classLevel,
        board,
        paperType: normalizedType,
        chapterIds,
      });
    }

    // 2. Create the challenge
    const challengeId = randomUUID();
    await db.query(
      `INSERT INTO challenges (id, creator_id, subject, class_level, board, paper_type, chapter_ids, generated_paper_id, paper_data, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'WAITING')`,
      [
        challengeId,
        user.userId,
        subject,
        classLevel,
        board,
        parseInt(normalizedType) || 1,
        JSON.stringify(chapterIds || []),
        paperData.generatedPaperId,
        JSON.stringify(paperData),
      ],
    );

    // 3. Add creator as a participant (auto-accepted)
    await db.query(
      `INSERT INTO challenge_participants (challenge_id, user_id, status)
       VALUES ($1, $2, 'ACCEPTED')`,
      [challengeId, user.userId],
    );

    // 4. Invite friends by username
    const invitedUsers: string[] = [];
    const notFound: string[] = [];

    // Get creator name for notifications
    const { rows: creatorInfo } = await db.query(
      "SELECT name FROM users WHERE id = $1",
      [user.userId],
    );
    const creatorName = creatorInfo[0]?.name || "Someone";

    for (const username of inviteUsernames) {
      const { rows } = await db.query(
        "SELECT id, name, email FROM users WHERE username = $1 AND id != $2",
        [username.trim(), user.userId],
      );
      if (rows.length > 0) {
        const invitedUser = rows[0];
        await db.query(
          `INSERT INTO challenge_participants (challenge_id, user_id, status)
           VALUES ($1, $2, 'INVITED')
           ON CONFLICT (challenge_id, user_id) DO NOTHING`,
          [challengeId, invitedUser.id],
        );
        // Notify invited user via in-app notification
        createNotification({
          userId: invitedUser.id,
          type: "CHALLENGE_INVITE",
          title: "Challenge Invite! ⚔️",
          message: `${creatorName} challenged you in ${subject}`,
          link: `/student/challenge/${challengeId}`,
          metadata: { challengeId, creatorId: user.userId },
        });

        // Notify invited user via Email
        if (invitedUser.email) {
          sendChallengeInviteEmail(
            invitedUser.email,
            invitedUser.name || username.trim(),
            creatorName,
            subject,
            challengeId,
          ).catch((err) =>
            console.error("Failed to send challenge invite email:", err),
          );
        }

        invitedUsers.push(username.trim());
      } else {
        notFound.push(username.trim());
      }
    }

    return successResponse(
      {
        challengeId,
        subject,
        invitedUsers,
        notFound,
        totalQuestions: paperData.totalQuestions,
        totalMarks: paperData.totalMarks,
      },
      "Challenge created!",
    );
  } catch (error) {
    console.error("Create challenge error:", error);
    const message = error instanceof Error ? error.message : "Failed to create challenge";
    return errorResponse(message, 500);
  }
}

/**
 * GET /api/challenges
 * List challenges for current user (created + invited)
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    await ensureChallengeTables();

    const { rows } = await db.query(
      `SELECT c.id, c.subject, c.class_level, c.board, c.paper_type, c.status, c.created_at, c.started_at,
              u.name as creator_name, u.username as creator_username, u.profile_image as creator_image,
              cp.status as my_status,
              c.creator_id,
              (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = c.id) as total_participants,
              (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = c.id AND status = 'ACCEPTED') as accepted_count,
              (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = c.id AND status = 'COMPLETED') as completed_count
       FROM challenges c
       JOIN challenge_participants cp ON cp.challenge_id = c.id AND cp.user_id = $1
       JOIN users u ON u.id = c.creator_id
       ORDER BY c.created_at DESC
       LIMIT 50`,
      [user.userId],
    );

    const challenges = rows.map((c: any) => ({
      id: c.id,
      subject: c.subject,
      classLevel: c.class_level,
      board: c.board,
      paperType: c.paper_type,
      status: c.status,
      createdAt: c.created_at,
      startedAt: c.started_at,
      creatorName: c.creator_name,
      creatorUsername: c.creator_username,
      creatorImage: c.creator_image,
      isCreator: c.creator_id === user.userId,
      myStatus: c.my_status,
      totalParticipants: parseInt(c.total_participants),
      acceptedCount: parseInt(c.accepted_count),
      completedCount: parseInt(c.completed_count),
    }));

    return successResponse(challenges);
  } catch (error) {
    console.error("List challenges error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
