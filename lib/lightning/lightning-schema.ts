import { db } from "@/lib/db";
import { awardStudentProgressPoints } from "@/lib/gamification/award-progress-points";

export type LightningSessionStatus = "LOBBY" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type LightningSessionPhase = "LOBBY" | "QUESTION" | "REVEAL" | "LEADERBOARD" | "PODIUM";
export type LightningSourceMode = "past_papers" | "slos" | "custom_ai" | "manual";

export interface LightningQuestionOption {
  id: string;
  text: string;
}

export interface LightningQuestion {
  id: string;
  questionNumber: number;
  questionText: string;
  options: LightningQuestionOption[];
  correctOptionId: string; // 'A' | 'B' | 'C' | 'D' or option UUID
  explanation?: string;
  imageUrl?: string | null;
  marks?: number;
}

export interface LightningSession {
  id: string;
  pinCode: string;
  creatorId: string;
  creatorRole: "TEACHER" | "STUDENT";
  title: string;
  subject: string;
  classLevel: string;
  board: string;
  status: LightningSessionStatus;
  phase: LightningSessionPhase;
  sourceMode: LightningSourceMode;
  perQuestionSeconds: number;
  currentQuestionIndex: number;
  currentQuestionStartedAt: string | null;
  paperData: LightningQuestion[];
  classroomId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LightningParticipant {
  id: string;
  sessionId: string;
  userId: string;
  name: string;
  username: string | null;
  profileImage: string | null;
  schoolName?: string | null;
  schoolLogo?: string | null;
  totalPoints: number;
  streak: number;
  highestStreak: number;
  correctCount: number;
  isConnected: boolean;
  lastActiveAt: string;
  createdAt: string;
  rank?: number;
}

export interface LightningAnswer {
  id: string;
  sessionId: string;
  userId: string;
  questionIndex: number;
  selectedOption: string;
  isCorrect: boolean;
  timeTakenMs: number;
  pointsEarned: number;
  streakAfter: number;
  createdAt: string;
}

let ensureSchemaPromise: Promise<void> | null = null;

export function ensureLightningSchema(): Promise<void> {
  if (!ensureSchemaPromise) {
    ensureSchemaPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS lightning_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          pin_code VARCHAR(6) UNIQUE NOT NULL,
          creator_id TEXT NOT NULL,
          creator_role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
          title TEXT NOT NULL,
          subject TEXT NOT NULL,
          class_level VARCHAR(20) NOT NULL,
          board VARCHAR(50) NOT NULL DEFAULT 'AKUEB',
          status VARCHAR(20) NOT NULL DEFAULT 'LOBBY',
          phase VARCHAR(20) NOT NULL DEFAULT 'LOBBY',
          source_mode VARCHAR(30) NOT NULL DEFAULT 'past_papers',
          per_question_seconds INTEGER NOT NULL DEFAULT 20,
          current_question_index INTEGER NOT NULL DEFAULT 0,
          current_question_started_at TIMESTAMP WITH TIME ZONE,
          paper_data JSONB NOT NULL DEFAULT '[]',
          classroom_id TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS lightning_participants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID REFERENCES lightning_sessions(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          username TEXT,
          profile_image TEXT,
          total_points INTEGER NOT NULL DEFAULT 0,
          streak INTEGER NOT NULL DEFAULT 0,
          highest_streak INTEGER NOT NULL DEFAULT 0,
          correct_count INTEGER NOT NULL DEFAULT 0,
          is_connected BOOLEAN NOT NULL DEFAULT true,
          last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(session_id, user_id)
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS lightning_answers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID REFERENCES lightning_sessions(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL,
          question_index INTEGER NOT NULL,
          selected_option TEXT NOT NULL,
          is_correct BOOLEAN NOT NULL,
          time_taken_ms INTEGER NOT NULL,
          points_earned INTEGER NOT NULL DEFAULT 0,
          streak_after INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(session_id, user_id, question_index)
        )
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_lightning_sessions_pin ON lightning_sessions(pin_code);
        CREATE INDEX IF NOT EXISTS idx_lightning_participants_session ON lightning_participants(session_id);
        CREATE INDEX IF NOT EXISTS idx_lightning_answers_session ON lightning_answers(session_id, question_index);
        ALTER TABLE lightning_sessions ADD COLUMN IF NOT EXISTS rewards_finalized BOOLEAN NOT NULL DEFAULT false;
        ALTER TABLE lightning_participants ADD COLUMN IF NOT EXISTS leaderboard_points INTEGER DEFAULT 0;
      `).catch(() => {});
    })().catch((err) => {
      ensureSchemaPromise = null;
      throw err;
    });
  }
  return ensureSchemaPromise;
}

/**
 * Generate a unique 6-digit PIN code for a lobby.
 */
export async function generateUniquePinCode(): Promise<string> {
  await ensureLightningSchema();
  for (let attempt = 0; attempt < 10; attempt++) {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const { rows } = await db.query(
      `SELECT id FROM lightning_sessions WHERE pin_code = $1 AND status != 'COMPLETED'`,
      [pin],
    );
    if (rows.length === 0) {
      return pin;
    }
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Speed-based score calculation:
 * Max 1000 base points.
 * Formula: 500 base + 500 * (timeRemaining / totalTime).
 * Plus Streak Bonus:
 * - Streak 2: +50
 * - Streak 3: +100
 * - Streak 4: +150
 * - Streak 5+: +200
 */
export function calculateSpeedScore(
  isCorrect: boolean,
  timeTakenMs: number,
  perQuestionSeconds: number,
  currentStreak: number,
): { points: number; streakBonus: number; newStreak: number; streakMessage: string } {
  if (!isCorrect) {
    return {
      points: 0,
      streakBonus: 0,
      newStreak: 0,
      streakMessage: "Keep going! You'll get the next one!",
    };
  }

  const totalTimeMs = perQuestionSeconds * 1000;
  const timeRemainingMs = Math.max(0, totalTimeMs - timeTakenMs);
  const speedRatio = totalTimeMs > 0 ? timeRemainingMs / totalTimeMs : 0;
  const basePoints = Math.round(500 + 500 * speedRatio);

  const newStreak = currentStreak + 1;
  let streakBonus = 0;
  let streakMessage = "Correct!";

  if (newStreak === 2) {
    streakBonus = 50;
    streakMessage = "🔥 2 in a row! Superb!";
  } else if (newStreak === 3) {
    streakBonus = 100;
    streakMessage = " 3x Streak! Amazing!";
  } else if (newStreak === 4) {
    streakBonus = 150;
    streakMessage = "🚀 4x Streak! On Fire!";
  } else if (newStreak >= 5) {
    streakBonus = 200;
    streakMessage = `💥 ${newStreak}x Streak! Speed Demon!`;
  }

  return {
    points: basePoints + streakBonus,
    streakBonus,
    newStreak,
    streakMessage,
  };
}

/**
 * Normalizes high in-game Kahoot scores (e.g. 5000-11000 pts) using the Speed-Weighted Formula (score / 250)
 * + Podium Placement Bonus (1st: +10, 2nd: +6, 3rd: +3) and awards permanent Global Leaderboard points.
 */
export async function finalizeLightningGameRewards(sessionId: string): Promise<void> {
  await ensureLightningSchema();

  // Atomically claim finalization so rewards are never awarded twice if multiple event hooks trigger
  const updateRes = await db.query(
    `UPDATE lightning_sessions 
     SET rewards_finalized = true 
     WHERE id = $1 AND (rewards_finalized IS FALSE OR rewards_finalized IS NULL)
     RETURNING id`,
    [sessionId],
  );
  if (updateRes.rows.length === 0) {
    // Already finalized by another process
    return;
  }

  const { rows: sessionRows } = await db.query<{
    paper_data: LightningQuestion[];
    creator_role: string;
  }>(`SELECT paper_data, creator_role FROM lightning_sessions WHERE id = $1`, [sessionId]);

  if (sessionRows.length === 0) return;
  const session = sessionRows[0];
  const questions: LightningQuestion[] = session.paper_data || [];
  const totalQuestions = Math.max(1, questions.length);

  const { rows: participants } = await db.query<{
    user_id: string;
    correct_count: number;
    total_points: number;
  }>(
    `SELECT user_id, correct_count, total_points 
     FROM lightning_participants 
     WHERE session_id = $1
     ORDER BY total_points DESC, correct_count DESC, created_at ASC`,
    [sessionId],
  );

  for (let idx = 0; idx < participants.length; idx++) {
    const p = participants[idx];
    const rank = idx + 1;
    const accuracyPercentage = Math.min(100, Math.round((p.correct_count / totalQuestions) * 100));

    try {
      const awardResult = await awardStudentProgressPoints(p.user_id, {
        score: p.correct_count,
        totalMarks: totalQuestions,
        percentage: accuracyPercentage,
        paperType: "lightning",
        questionCount: totalQuestions,
        matchScore: p.total_points,
        podiumRank: rank,
      });

      await db.query(
        `UPDATE lightning_participants 
         SET leaderboard_points = $1 
         WHERE session_id = $2 AND user_id = $3`,
        [awardResult.pointsAwarded, sessionId, p.user_id],
      );
    } catch (err) {
      console.error(`Failed to award progress points for user ${p.user_id}:`, err);
    }
  }
}
