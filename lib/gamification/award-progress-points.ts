import { db } from "@/lib/db";
import { UserRole } from "@/types/enums";

export interface ComputeProgressPointsOptions {
  score?: number;
  totalMarks?: number;
  percentage?: number;
  paperType?: string;
  questionCount?: number;
  isLate?: boolean;
  matchScore?: number;
  podiumRank?: number;
}

export type ComputeProgressPointsInput = number | ComputeProgressPointsOptions;

export interface PointAwardBreakdown {
  basePoints: number;
  accuracyMultiplier: number;
  accuracyPoints: number;
  sizeBonus: number;
  isLate?: boolean;
  latePenalty?: number;
  totalAwarded: number;
}

/**
 * Shared gamification reward:
 * - Base Effort: +1 point per correct question/mark (Paper 2 scaled by 0.6).
 * - Accuracy Multiplier: <50%: 0.5x, 50-69%: 1.0x, 70-84%: 1.2x, 85-94%: 1.35x, 95-100%: 1.5x.
 * - Exam Size Bonus (when >= 50%): 1-15 Qs: +0, 16-30 Qs: +5, 31+ Qs/Paper 2: +10.
 * - Lightning Round: Speed-Weighted Score (matchScore / 250) + Podium Placement Bonus.
 */
export function computeProgressPointsBreakdown(
  input: ComputeProgressPointsInput,
): PointAwardBreakdown {
  let score: number;
  let totalMarks: number;
  let percentage: number;
  let paperType: string | undefined;
  let questionCount: number | undefined;

  if (typeof input === "number") {
    percentage = Number.isFinite(input) ? Math.max(0, Math.min(100, input)) : 0;
    totalMarks = 10;
    score = Math.round((percentage / 100) * totalMarks);
  } else {
    paperType = input.paperType;
    questionCount = input.questionCount;
    totalMarks =
      input.totalMarks !== undefined ? Number(input.totalMarks) : (questionCount ?? 10);
    score = input.score !== undefined ? Number(input.score) : 0;

    if (input.percentage !== undefined && Number.isFinite(input.percentage)) {
      percentage = Math.max(0, Math.min(100, input.percentage));
    } else {
      percentage =
        totalMarks > 0 ? Math.max(0, Math.min(100, (score / totalMarks) * 100)) : 0;
    }

    // Lightning Round: Speed-Weighted Match Score + Podium Placement Bonus
    if (paperType === "lightning" && input.matchScore !== undefined) {
      const rawMatchScore = Math.max(0, Number(input.matchScore));
      // Each 250 in-game speed/streak points = 1 global leaderboard point
      const speedPoints = Math.round(rawMatchScore / 250);
      const podiumRank = input.podiumRank ?? 0;

      let podiumBonus = 0;
      if (podiumRank === 1) podiumBonus = 10;
      else if (podiumRank === 2) podiumBonus = 6;
      else if (podiumRank === 3) podiumBonus = 3;

      // Must have at least 1 correct answer to earn progress points
      const totalAwarded = score > 0 ? Math.max(1, speedPoints + podiumBonus) : 0;

      return {
        basePoints: speedPoints,
        accuracyMultiplier: 1.0,
        accuracyPoints: speedPoints,
        sizeBonus: podiumBonus,
        totalAwarded,
      };
    }
  }

  // Base Effort Points:
  // For Paper 2 with large mark totals (e.g. 75 or 100 marks), scale by 0.6 to align with standard scale.
  let basePoints = Math.max(0, score);
  if (
    paperType === "paper2" ||
    paperType === "Paper 2" ||
    paperType === "subjective"
  ) {
    basePoints = Math.round(basePoints * 0.6);
  }

  // Accuracy Multiplier:
  let accuracyMultiplier = 1.0;
  if (percentage < 50) {
    accuracyMultiplier = 0.5;
  } else if (percentage < 70) {
    accuracyMultiplier = 1.0;
  } else if (percentage < 85) {
    accuracyMultiplier = 1.2;
  } else if (percentage < 95) {
    accuracyMultiplier = 1.35;
  } else {
    accuracyMultiplier = 1.5;
  }

  const accuracyPoints = Math.round(basePoints * accuracyMultiplier);

  // Paper Size Bonus (only if passed with >= 50%):
  let sizeBonus = 0;
  if (percentage >= 50) {
    const effectiveQuestionCount =
      questionCount ?? (paperType === "paper2" ? 35 : totalMarks);
    if (effectiveQuestionCount >= 31 || paperType === "paper2") {
      sizeBonus = 10;
    } else if (effectiveQuestionCount >= 16) {
      sizeBonus = 5;
    } else {
      sizeBonus = 0;
    }
  }

  const onTimeAwarded = Math.max(0, accuracyPoints + sizeBonus);
  const isLate = typeof input === "object" ? Boolean(input.isLate) : false;
  const latePenalty = isLate ? Math.round(onTimeAwarded * 0.5) : 0;
  const totalAwarded = isLate
    ? Math.max(score > 0 ? 1 : 0, onTimeAwarded - latePenalty)
    : onTimeAwarded;

  return {
    basePoints,
    accuracyMultiplier,
    accuracyPoints,
    sizeBonus,
    isLate,
    latePenalty: isLate ? latePenalty : undefined,
    totalAwarded,
  };
}

export function computeProgressPoints(input: ComputeProgressPointsInput): number {
  return computeProgressPointsBreakdown(input).totalAwarded;
}

export interface AwardProgressResult {
  pointsAwarded: number;
  totalPoints: number;
  rank: number | null;
  milestoneId: string | null;
  breakdown?: PointAwardBreakdown;
}

/**
 * Awards progress points, syncs milestone, and refreshes the student's leaderboard rank.
 */
export async function awardStudentProgressPoints(
  userId: string,
  input: ComputeProgressPointsInput,
): Promise<AwardProgressResult> {
  const breakdown = computeProgressPointsBreakdown(input);
  const pointsAwarded = breakdown.totalAwarded;

  await db
    .query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0`)
    .catch(() => {});
  await db
    .query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS rank INTEGER`)
    .catch(() => {});
  await db
    .query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS current_milestone_id UUID`)
    .catch(() => {});

  await db.query(
    `UPDATE users SET points = COALESCE(points, 0) + $1, updated_at = NOW() WHERE id = $2`,
    [pointsAwarded, userId],
  );

  // Evaluate performance badges asynchronously
  void (async () => {
    try {
      const { evaluateAndAwardBadges } = await import("@/lib/gamification/badges");
      await evaluateAndAwardBadges(userId);
    } catch (err) {
      console.error("Async badge evaluation error:", err);
    }
  })();

  return { pointsAwarded, ...(await refreshStudentProgressStats(userId)) };
}

export async function refreshStudentProgressStats(userId: string): Promise<{
  totalPoints: number; rank: number | null; milestoneId: string | null;
}> {
  const { rows: userRows } = await db.query<{ points: number | null }>(
    `SELECT COALESCE(points, 0)::int AS points FROM users WHERE id = $1`,
    [userId],
  );
  const totalPoints = Number(userRows[0]?.points ?? 0);

  let milestoneId: string | null = null;
  try {
    const { rows: milestones } = await db.query<{ id: string }>(
      `SELECT id FROM milestones
       WHERE points_required <= $1
       ORDER BY points_required DESC
       LIMIT 1`,
      [totalPoints],
    );
    if (milestones[0]?.id) {
      milestoneId = milestones[0].id;
      await db.query(`UPDATE users SET current_milestone_id = $1 WHERE id = $2`, [
        milestoneId,
        userId,
      ]);
    }
  } catch {
    // milestones table may be missing in some environments
  }

  let rank: number | null = null;
  try {
    const { rows: rankRows } = await db.query<{ rank: string }>(
      `SELECT (COUNT(*) FILTER (
          WHERE role = $1 AND COALESCE(points, 0) > $2
        ) + 1)::text AS rank
       FROM users`,
      [UserRole.STUDENT, totalPoints],
    );
    rank = Number(rankRows[0]?.rank || 1);
    await db.query(`UPDATE users SET rank = $1 WHERE id = $2`, [rank, userId]);

    // If student reached top 10, notify the student immediately behind them
    if (rank <= 10) {
      void (async () => {
        try {
          const { notifyLeaderboardOvertaken } = await import("@/lib/push/inactivity-reminders");
          const { rows: info } = await db.query<{ name: string; school_name: string | null }>(
            "SELECT name, school_name FROM users WHERE id = $1",
            [userId],
          );
          if (info[0]?.name) {
            await notifyLeaderboardOvertaken({
              winnerUserId: userId,
              winnerName: info[0].name,
              winnerSchool: info[0].school_name,
              newRank: rank!,
            });
          }
        } catch (err) {
          console.error("Leaderboard notification dispatch error:", err);
        }
      })();
    }
  } catch {
    // rank column optional
  }

  return { totalPoints, rank, milestoneId };
}
