import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

export interface PerformanceBadgeDefinition {
  key: string;
  name: string;
  tagline: string;
  description: string;
  criteria: string;
  category: "starter" | "accuracy" | "mastery" | "competitive" | "streak" | "leaderboard";
  tier: "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond" | "Mythic";
  icon: string;
  rewardPoints: number;
  gradient: string;
  borderGlow: string;
  accentColor: string;
  textColor: string;
}

export const PERFORMANCE_BADGES: Record<string, PerformanceBadgeDefinition> = {
  rookie: {
    key: "rookie",
    name: "Rookie",
    tagline: "Mark of Dedicated Discipline",
    description: "Awarded to students who prove their foundational dedication by passing 5 practice exams with high precision.",
    criteria: "Score 75% or higher in at least 5 practice tests, past papers, or exam attempts.",
    category: "starter",
    tier: "Bronze",
    icon: "/badges/rookie.png",
    rewardPoints: 50,
    gradient: "from-[#10b981] via-[#059669] to-[#047857]",
    borderGlow: "shadow-emerald-500/30 hover:shadow-emerald-500/50",
    accentColor: "#10b981",
    textColor: "text-emerald-300",
  },
  skilled: {
    key: "skilled",
    name: "Skilled",
    tagline: "High-Caliber Consistency",
    description: "Demonstrate relentless excellence across at least 10 separate testing sessions with distinction.",
    criteria: "Score 85% or higher in at least 10 practice exams, past papers, or quizzes.",
    category: "accuracy",
    tier: "Silver",
    icon: "/badges/skilled.png",
    rewardPoints: 100,
    gradient: "from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]",
    borderGlow: "shadow-blue-500/30 hover:shadow-blue-500/50",
    accentColor: "#3b82f6",
    textColor: "text-blue-300",
  },
  expert: {
    key: "expert",
    name: "Expert",
    tagline: "Master of Exam Prep",
    description: "Master comprehensive board examination content with outstanding precision across 15 high-distinction exams.",
    criteria: "Score 90% or higher in at least 15 exams or achieve 100% mastery on 3 full past papers.",
    category: "mastery",
    tier: "Gold",
    icon: "/badges/expert.png",
    rewardPoints: 200,
    gradient: "from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9]",
    borderGlow: "shadow-purple-500/30 hover:shadow-purple-500/50",
    accentColor: "#8b5cf6",
    textColor: "text-purple-300",
  },
  mastermind: {
    key: "mastermind",
    name: "Mastermind",
    tagline: "Lightning Speed & Genius",
    description: "Dominate the live Play & Prep multiplayer lightning arena with absolute speed, flawless accuracy, and 5 tournament victories.",
    criteria: "Score 100% accuracy and take Rank #1 in at least 5 Play & Prep Lightning Rounds or Challenge matches.",
    category: "competitive",
    tier: "Platinum",
    icon: "/badges/mastermind.png",
    rewardPoints: 300,
    gradient: "from-[#ef4444] via-[#dc2626] to-[#991b1b]",
    borderGlow: "shadow-red-500/30 hover:shadow-red-500/50",
    accentColor: "#ef4444",
    textColor: "text-rose-300",
  },
  legend: {
    key: "legend",
    name: "Legend",
    tagline: "Unstoppable Perfection",
    description: "Attain supreme perfection across 7 continuous test sessions without losing a single mark.",
    criteria: "Score 100% in 7 consecutive practice papers or exam attempts without a single mistake.",
    category: "streak",
    tier: "Diamond",
    icon: "/badges/legend.png",
    rewardPoints: 500,
    gradient: "from-[#f59e0b] via-[#d97706] to-[#b45309]",
    borderGlow: "shadow-amber-500/40 hover:shadow-amber-500/60",
    accentColor: "#f59e0b",
    textColor: "text-amber-300",
  },
  king: {
    key: "king",
    name: "King",
    tagline: "Reigning Supreme",
    description: "Rule the leaderboard with elite mastery, Top 3 ranking, and 3,000+ accuracy points.",
    criteria: "Reach Top 3 on the Global/School Leaderboard with at least 3,000+ total accuracy points.",
    category: "leaderboard",
    tier: "Mythic",
    icon: "/badges/king.png",
    rewardPoints: 1000,
    gradient: "from-[#fbbf24] via-[#e11d48] to-[#7c2d12]",
    borderGlow: "shadow-yellow-500/40 hover:shadow-rose-500/60",
    accentColor: "#fbbf24",
    textColor: "text-yellow-200",
  },
};

export interface UserBadgeStatus extends PerformanceBadgeDefinition {
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number; // 0 to 100
  currentVal: number;
  targetVal: number;
  progressLabel: string;
}

export interface PeriodicHonorBadge {
  id: string;
  badgeKey: string;
  periodType: "week" | "month" | "year";
  title: string;          // e.g. "Student of the Year 2026", "Student of the Month - October 2026", "Student of the Week 1, October 2026"
  edition: string;        // e.g. "2026", "October 2026", "Week 1, October 2026"
  tagline: string;
  description: string;
  criteria: string;
  tier: "Platinum" | "Diamond" | "Mythic";
  icon: string;           // "/badges/student-of-the-year.svg", "/badges/student-of-the-month.svg", "/badges/student-of-the-week.svg"
  rewardPoints: number;
  unlocked: boolean;
  unlockedAt: string | null;
  gradient: string;
  borderGlow: string;
  accentColor: string;
  textColor: string;
  metadata: {
    year: number;
    month?: number;
    monthName?: string;
    weekOfMonth?: number;
    periodScore?: number;
    accuracy?: number;
    testsCompleted?: number;
    rank?: number;
  };
}

export interface ActivePeriodRace {
  periodType: "week" | "month" | "year";
  title: string;           // e.g. "Student of the Week 1, October 2026"
  edition: string;         // e.g. "Week 1 (Oct 1 - Oct 7, 2026)"
  badgeIcon: string;
  tier: "Platinum" | "Diamond" | "Mythic";
  rewardPoints: number;
  gradient: string;
  borderGlow: string;
  accentColor: string;
  textColor: string;
  
  // User's current performance in this active period
  userScore: number;
  userAccuracy: number;
  testsCompleted: number;
  minTestsRequired: number;
  minAccuracyRequired: number;
  isQualified: boolean;
  userRank: number;
  totalCompetitors: number;
  currentLeaderName: string;
  currentLeaderScore: number;
  timeRemainingLabel: string;
  progress: number;        // 0 to 100
}

export interface StudentBadgesResponse {
  performanceBadges: UserBadgeStatus[];
  periodicHonors: PeriodicHonorBadge[];
  activeRaces: ActivePeriodRace[];
  totalBadgesCount: number;
  unlockedBadgesCount: number;
}

let tableEnsured = false;
export async function ensureUserBadgesTable() {
  if (tableEnsured) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_gamification_badges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        badge_key VARCHAR(100) NOT NULL,
        unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB DEFAULT '{}'::jsonb,
        UNIQUE(user_id, badge_key)
      );
      CREATE INDEX IF NOT EXISTS idx_user_gamification_badges_user ON user_gamification_badges(user_id);
    `);
    tableEnsured = true;
  } catch (err) {
    console.error("Error ensuring user_gamification_badges table:", err);
  }
}

/**
 * Calculates date bounds and formatted labels for current periodic honors.
 */
export interface PeriodicDateContext {
  now: Date;
  year: number;
  monthIndex: number;
  monthNumber: number;
  monthName: string;
  dayOfMonth: number;
  weekOfMonth: number;
  
  weekStartDate: Date;
  weekEndDate: Date;
  weekKey: string;
  weekTitle: string;
  weekEdition: string;
  weekTimeRemaining: string;

  monthStartDate: Date;
  monthEndDate: Date;
  monthKey: string;
  monthTitle: string;
  monthEdition: string;
  monthTimeRemaining: string;

  yearStartDate: Date;
  yearEndDate: Date;
  yearKey: string;
  yearTitle: string;
  yearEdition: string;
  yearTimeRemaining: string;
}

export function getPeriodicDateContext(dateInput?: Date): PeriodicDateContext {
  const now = dateInput ? new Date(dateInput) : new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const monthNumber = monthIndex + 1;
  const monthName = now.toLocaleString("en-US", { month: "long" });
  const dayOfMonth = now.getDate();
  const weekOfMonth = Math.min(5, Math.max(1, Math.ceil(dayOfMonth / 7)));

  // Week Bounds (e.g. Week 1: Day 1-7, Week 2: Day 8-14, etc.)
  const weekStartDay = (weekOfMonth - 1) * 7 + 1;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const weekEndDay = Math.min(daysInMonth, weekOfMonth * 7);

  const weekStartDate = new Date(year, monthIndex, weekStartDay, 0, 0, 0, 0);
  const weekEndDate = new Date(year, monthIndex, weekEndDay, 23, 59, 59, 999);
  const weekKey = `student_of_the_week_${year}_${monthNumber}_w${weekOfMonth}`;
  const weekTitle = `Student of the Week ${weekOfMonth}, ${monthName} ${year}`;
  const weekEdition = `Week ${weekOfMonth}, ${monthName} ${year}`;

  const msLeftInWeek = Math.max(0, weekEndDate.getTime() - now.getTime());
  const daysLeftInWeek = Math.ceil(msLeftInWeek / (1000 * 60 * 60 * 24));
  const weekTimeRemaining = daysLeftInWeek <= 1 ? "Closes tonight at 11:59 PM" : `${daysLeftInWeek} days remaining`;

  // Month Bounds
  const monthStartDate = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const monthEndDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  const monthKey = `student_of_the_month_${year}_${monthNumber}`;
  const monthTitle = `Student of the Month - ${monthName} ${year}`;
  const monthEdition = `${monthName} ${year}`;

  const msLeftInMonth = Math.max(0, monthEndDate.getTime() - now.getTime());
  const daysLeftInMonth = Math.ceil(msLeftInMonth / (1000 * 60 * 60 * 24));
  const monthTimeRemaining = `${daysLeftInMonth} days remaining`;

  // Academic Year Bounds (Academic session ends April 30; Student of the Year is decided/awarded on May 1st)
  const isPostMay = monthIndex >= 4; // May (index 4) through Dec (index 11)
  const academicStartYear = isPostMay ? year : year - 1;
  const academicEndYear = academicStartYear + 1; // e.g. 2026–2027 -> awarded May 1, 2027

  const yearStartDate = new Date(academicStartYear, 4, 1, 0, 0, 0, 0); // May 1st
  const yearEndDate = new Date(academicEndYear, 3, 30, 23, 59, 59, 999); // April 30th 23:59:59
  const yearKey = `student_of_the_year_${academicEndYear}`;
  const yearTitle = `Student of the Year ${academicEndYear}`;
  const yearEdition = `${academicStartYear}–${academicEndYear}`;

  const msLeftInYear = Math.max(0, yearEndDate.getTime() - now.getTime());
  const daysLeftInYear = Math.ceil(msLeftInYear / (1000 * 60 * 60 * 24));
  const yearTimeRemaining = `${daysLeftInYear} days remaining (Awarded May 1, ${academicEndYear})`;

  return {
    now,
    year,
    monthIndex,
    monthNumber,
    monthName,
    dayOfMonth,
    weekOfMonth,
    weekStartDate,
    weekEndDate,
    weekKey,
    weekTitle,
    weekEdition,
    weekTimeRemaining,
    monthStartDate,
    monthEndDate,
    monthKey,
    monthTitle,
    monthEdition,
    monthTimeRemaining,
    yearStartDate,
    yearEndDate,
    yearKey,
    yearTitle,
    yearEdition,
    yearTimeRemaining,
  };
}

/**
 * Calculates user's live progress for standard performance badges,
 * awards any newly unlocked badges, and returns the badge status list.
 */
export async function getUserBadges(userId: string): Promise<UserBadgeStatus[]> {
  await ensureUserBadgesTable();

  // 1. Fetch already recorded badges
  const { rows: savedRows } = await db.query<{
    badge_key: string;
    unlocked_at: string;
    metadata: Record<string, unknown> | null;
  }>(
    `SELECT badge_key, unlocked_at, metadata FROM user_gamification_badges WHERE user_id = $1`,
    [userId],
  );

  const unlockedMap = new Map<string, string>();
  for (const r of savedRows) {
    unlockedMap.set(r.badge_key, r.unlocked_at);
  }

  // 2. Fetch user activity metrics to evaluate badge requirements
  const { rows: userRows } = await db.query<{ points: number; rank: number }>(
    `SELECT COALESCE(points, 0)::int as points, COALESCE(rank, 9999)::int as rank FROM users WHERE id = $1`,
    [userId],
  );
  const userPoints = userRows[0]?.points ?? 0;
  const userRank = userRows[0]?.rank ?? 9999;

  const { rows: attempts } = await db.query<{
    id: string;
    score: number;
    total_marks: number;
    created_at: string;
  }>(
    `SELECT id, score, total_marks, created_at 
     FROM exam_attempts 
     WHERE user_id = $1 
     ORDER BY created_at ASC`,
    [userId],
  );

  const totalAttempts = attempts.length;
  let attempts75Count = 0;
  let attempts85Count = 0;
  let attempts90Count = 0;
  let full100PapersCount = 0;
  let maxConsecutive100 = 0;
  let currentConsecutive100 = 0;

  for (const att of attempts) {
    const total = Number(att.total_marks) || 0;
    const score = Number(att.score) || 0;
    const pct = total > 0 ? (score / total) * 100 : 0;

    if (pct >= 75) attempts75Count++;
    if (pct >= 85) attempts85Count++;
    if (pct >= 90) attempts90Count++;
    if (pct >= 99.9 && total >= 15) full100PapersCount++;

    if (pct >= 99.9 && total > 0) {
      currentConsecutive100++;
      if (currentConsecutive100 > maxConsecutive100) {
        maxConsecutive100 = currentConsecutive100;
      }
    } else {
      currentConsecutive100 = 0;
    }
  }

  let lightning100Rank1Count = 0;
  try {
    const { rows: lightningRows } = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text as count 
       FROM lightning_participants 
       WHERE user_id = $1 AND (total_points > 0) AND (streak >= 5 OR correct_count >= 5)`,
      [userId],
    );
    lightning100Rank1Count = Number(lightningRows[0]?.count || 0);
  } catch {
    // lightning_participants might be empty
  }

  // 3. Compute status and newly unlocked badges
  const newlyUnlocked: string[] = [];
  const results: UserBadgeStatus[] = [];

  for (const badge of Object.values(PERFORMANCE_BADGES)) {
    let unlocked = unlockedMap.has(badge.key);
    let unlockedAt = unlockedMap.get(badge.key) || null;
    let progress = 0;
    let currentVal = 0;
    let targetVal = 1;
    let progressLabel = "";

    switch (badge.key) {
      case "rookie": {
        targetVal = 5;
        currentVal = Math.min(targetVal, attempts75Count);
        progress = Math.round((currentVal / targetVal) * 100);
        progressLabel = `${currentVal} / ${targetVal} Exams (≥75%)`;
        if (attempts75Count >= 5) unlocked = true;
        break;
      }

      case "skilled": {
        targetVal = 10;
        currentVal = Math.min(targetVal, attempts85Count);
        progress = Math.round((currentVal / targetVal) * 100);
        progressLabel = `${currentVal} / ${targetVal} Exams (≥85%)`;
        if (attempts85Count >= 10) unlocked = true;
        break;
      }

      case "expert": {
        targetVal = 15;
        if (full100PapersCount >= 3) {
          currentVal = 15;
          progress = 100;
          unlocked = true;
          progressLabel = "3 Full 100% Papers Mastered";
        } else {
          currentVal = Math.min(targetVal, attempts90Count);
          progress = Math.round((currentVal / targetVal) * 100);
          progressLabel = `${currentVal} / ${targetVal} Exams (≥90%)`;
          if (attempts90Count >= 15) unlocked = true;
        }
        break;
      }

      case "mastermind": {
        targetVal = 5;
        currentVal = Math.min(targetVal, lightning100Rank1Count);
        progress = Math.round((currentVal / targetVal) * 100);
        progressLabel = `${currentVal} / ${targetVal} Wins`;
        if (lightning100Rank1Count >= 5) unlocked = true;
        break;
      }

      case "legend": {
        targetVal = 7;
        currentVal = Math.min(targetVal, maxConsecutive100);
        progress = Math.round((currentVal / targetVal) * 100);
        progressLabel = `${currentVal} / ${targetVal} Consecutive 100%`;
        if (maxConsecutive100 >= 7) unlocked = true;
        break;
      }

      case "king": {
        targetVal = 3000;
        currentVal = userPoints;
        const isTop3 = userRank <= 3 && userPoints > 0;
        const isQualified = isTop3 && userPoints >= 3000;
        if (isQualified) {
          progress = 100;
          unlocked = true;
          progressLabel = `Rank #${userRank} (3,000+ PTS)`;
        } else {
          progress = Math.min(99, Math.round((userPoints / 3000) * 100));
          progressLabel = isTop3 ? `${userPoints.toLocaleString()} / 3,000 PTS (Rank #${userRank})` : `${userPoints.toLocaleString()} / 3,000 PTS`;
        }
        break;
      }
    }

    if (unlocked && !unlockedMap.has(badge.key)) {
      newlyUnlocked.push(badge.key);
      unlockedAt = new Date().toISOString();
    }

    results.push({
      ...badge,
      unlocked,
      unlockedAt,
      progress: Math.min(100, Math.max(0, progress)),
      currentVal,
      targetVal,
      progressLabel,
    });
  }

  // 4. Save any newly unlocked badges
  if (newlyUnlocked.length > 0) {
    for (const key of newlyUnlocked) {
      try {
        await db.query(
          `INSERT INTO user_gamification_badges (user_id, badge_key, unlocked_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (user_id, badge_key) DO NOTHING`,
          [userId, key],
        );

        const badgeDef = PERFORMANCE_BADGES[key];
        if (badgeDef) {
          void createNotification({
            userId,
            type: "LEADERBOARD_ALERT",
            title: `🏆 New Badge Unlocked: ${badgeDef.name}!`,
            message: `Congratulations! You unlocked the '${badgeDef.name}' badge (${badgeDef.tagline}). Check your profile achievements.`,
            link: "/student/account",
            metadata: { badgeKey: key, badgeName: badgeDef.name },
          });
        }
      } catch (err) {
        console.error("Error saving newly unlocked badge:", err);
      }
    }
  }

  return results;
}

/**
 * Evaluates performance and crowns/awards Student of the Week, Month, and Year.
 * Returns the active race standing and list of user honors.
 */
export async function evaluatePeriodicHonors(dateInput?: Date): Promise<void> {
  await ensureUserBadgesTable();
  const ctx = getPeriodicDateContext(dateInput);

  const periods = [
    {
      type: "week" as const,
      key: ctx.weekKey,
      title: ctx.weekTitle,
      edition: ctx.weekEdition,
      tagline: "Weekly Academic & Speed Ace",
      description: `Awarded to the top student with the highest performance index, test activity, and accuracy in Week ${ctx.weekOfMonth} of ${ctx.monthName} ${ctx.year}.`,
      criteria: `Rank #1 in Weekly Academic Performance (min. 10 tests completed, ≥85% average accuracy) in ${ctx.weekEdition}. Awarded at end of week.`,
      tier: "Platinum" as const,
      icon: "/badges/student-of-the-week.svg",
      rewardPoints: 15,
      gradient: "from-[#581c87] via-[#7c3aed] to-[#f59e0b]",
      borderGlow: "shadow-purple-500/40 hover:shadow-amber-500/60",
      accentColor: "#8b5cf6",
      textColor: "text-purple-200",
      startDate: ctx.weekStartDate,
      endDate: ctx.weekEndDate,
      minTests: 10,
      minAccuracy: 85,
      year: ctx.year,
      month: ctx.monthNumber,
      monthName: ctx.monthName,
      weekOfMonth: ctx.weekOfMonth,
    },
    {
      type: "month" as const,
      key: ctx.monthKey,
      title: ctx.monthTitle,
      edition: ctx.monthEdition,
      tagline: "Monthly Academic Paragon",
      description: `Awarded to the supreme champion with the highest overall score, consistency, and mastery across ${ctx.monthName} ${ctx.year}.`,
      criteria: `Rank #1 in Monthly Academic Performance (min. 25 tests completed, ≥88% average accuracy) in ${ctx.monthEdition}. Awarded on last date of month.`,
      tier: "Diamond" as const,
      icon: "/badges/student-of-the-month.svg",
      rewardPoints: 30,
      gradient: "from-[#1e3a8a] via-[#2563eb] to-[#f59e0b]",
      borderGlow: "shadow-blue-500/40 hover:shadow-amber-500/60",
      accentColor: "#3b82f6",
      textColor: "text-blue-200",
      startDate: ctx.monthStartDate,
      endDate: ctx.monthEndDate,
      minTests: 25,
      minAccuracy: 88,
      year: ctx.year,
      month: ctx.monthNumber,
      monthName: ctx.monthName,
    },
    {
      type: "year" as const,
      key: ctx.yearKey,
      title: ctx.yearTitle,
      edition: ctx.yearEdition,
      tagline: "Annual Grand Academic Champion",
      description: `The highest academic honor on ExBoard AI, crowning the premier student of the academic year with unrivaled mastery and board exam excellence.`,
      criteria: `Rank #1 in Annual Academic Performance (min. 60 tests completed, ≥90% average accuracy) in ${ctx.yearEdition}. Decided at end of academic year on May 1st.`,
      tier: "Mythic" as const,
      icon: "/badges/student-of-the-year.svg",
      rewardPoints: 100,
      gradient: "from-[#047857] via-[#059669] to-[#fbbf24]",
      borderGlow: "shadow-emerald-500/40 hover:shadow-yellow-500/60",
      accentColor: "#10b981",
      textColor: "text-emerald-200",
      startDate: ctx.yearStartDate,
      endDate: ctx.yearEndDate,
      minTests: 60,
      minAccuracy: 90,
      year: ctx.year,
    },
  ];

  for (const p of periods) {
    try {
      // 1. Check if badge already awarded for this exact period
      const { rows: existing } = await db.query<{ user_id: string }>(
        `SELECT user_id FROM user_gamification_badges WHERE badge_key = $1 LIMIT 1`,
        [p.key],
      );

      // 2. Query student performances in this period
      const { rows: contenders } = await db.query<{
        user_id: string;
        name: string;
        test_count: string;
        total_score: string;
        total_max: string;
        user_total_points: string;
      }>(
        `WITH period_attempts AS (
           SELECT 
             user_id,
             COUNT(*) as test_count,
             SUM(COALESCE(score, 0)) as total_score,
             SUM(COALESCE(total_marks, 0)) as total_max
           FROM exam_attempts
           WHERE created_at >= $1 AND created_at <= $2
           GROUP BY user_id
         )
         SELECT 
           u.id as user_id,
           u.name,
           COALESCE(pa.test_count, 0)::text as test_count,
           COALESCE(pa.total_score, 0)::text as total_score,
           COALESCE(pa.total_max, 0)::text as total_max,
           COALESCE(u.points, 0)::text as user_total_points
         FROM users u
         LEFT JOIN period_attempts pa ON pa.user_id = u.id
         WHERE u.role = 'STUDENT' AND u.role != 'QA'
           AND (COALESCE(pa.test_count, 0) > 0 OR COALESCE(u.points, 0) > 0)
         ORDER BY COALESCE(pa.total_score, 0) DESC, COALESCE(u.points, 0) DESC`,
        [p.startDate.toISOString(), p.endDate.toISOString()],
      );

      if (contenders.length === 0) continue;

      // Calculate composite Periodic Performance Index (PPI)
      const scoredContenders = contenders.map((c) => {
        const tests = Number(c.test_count) || 0;
        const totalScore = Number(c.total_score) || 0;
        const totalMax = Number(c.total_max) || 0;
        const userTotalPoints = Number(c.user_total_points) || 0;
        const accuracy = totalMax > 0 ? (totalScore / totalMax) * 100 : (tests > 0 ? 80 : 0);
        
        // Performance Index = (Points) * (Accuracy / 100) + (Test Count bonus)
        const periodPoints = totalScore > 0 ? totalScore : Math.round(userTotalPoints / 10);
        const ppi = Math.round(periodPoints * (0.5 + 0.5 * (accuracy / 100)) + tests * 15);
        
        const isQualified = tests >= p.minTests && accuracy >= p.minAccuracy;
        return {
          userId: c.user_id,
          name: c.name,
          tests,
          totalScore,
          accuracy: Math.round(accuracy * 10) / 10,
          ppi,
          isQualified,
          userTotalPoints,
        };
      });

      scoredContenders.sort((a, b) => b.ppi - a.ppi || b.tests - a.tests);

      // Periodic honors can only be crowned once the period has concluded
      if (ctx.now < p.endDate) continue;

      // Select champion: must meet qualification criteria
      const champion = scoredContenders.find((c) => c.isQualified);
      if (!champion || champion.ppi <= 0) continue;

      if (existing.length === 0) {
        // Award badge to the champion
        const metadata = {
          type: "periodic_honor",
          periodType: p.type,
          title: p.title,
          edition: p.edition,
          year: p.year,
          month: p.month,
          monthName: p.monthName,
          weekOfMonth: p.weekOfMonth,
          periodScore: champion.ppi,
          accuracy: champion.accuracy,
          testsCompleted: champion.tests,
          icon: p.icon,
          tier: p.tier,
          rewardPoints: 0,
        };

        await db.query(
          `INSERT INTO user_gamification_badges (user_id, badge_key, unlocked_at, metadata)
           VALUES ($1, $2, NOW(), $3)
           ON CONFLICT (user_id, badge_key) DO UPDATE 
           SET metadata = EXCLUDED.metadata, unlocked_at = EXCLUDED.unlocked_at`,
          [champion.userId, p.key, JSON.stringify(metadata)],
        );

        // Award balanced honor bonus points (15 for week, 30 for month, 100 for year)
        if (p.rewardPoints > 0) {
          await db.query(
            `UPDATE users SET points = COALESCE(points, 0) + $1 WHERE id = $2`,
            [p.rewardPoints, champion.userId],
          );
        }

        // Dispatch notification
        void createNotification({
          userId: champion.userId,
          type: "LEADERBOARD_ALERT",
          title: `👑 Crowned ${p.title}!`,
          message: `Incredible achievement! You have been awarded the prestigious '${p.title}' honor (+${p.rewardPoints} pts).`,
          link: "/student/account",
          metadata: { badgeKey: p.key, title: p.title, rewardPoints: p.rewardPoints },
        });
      }
    } catch (err) {
      console.error(`Error evaluating ${p.type} honors:`, err);
    }
  }
}

/**
 * Returns all periodic honor badges awarded to the student (Week, Month, Year),
 * along with the default flagship honors.
 */
export async function getUserPeriodicHonors(userId: string): Promise<PeriodicHonorBadge[]> {
  await ensureUserBadgesTable();
  const ctx = getPeriodicDateContext();

  // Fetch all periodic honor entries for this user
  const { rows } = await db.query<{
    id: string;
    badge_key: string;
    unlocked_at: string;
    metadata: Record<string, unknown> | null;
  }>(
    `SELECT id, badge_key, unlocked_at, metadata 
     FROM user_gamification_badges 
     WHERE user_id = $1 AND (badge_key LIKE 'student_of_the_%')
     ORDER BY unlocked_at DESC`,
    [userId],
  );

  const awards: PeriodicHonorBadge[] = [];

  for (const r of rows) {
    const meta = typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata || {};
    const key = r.badge_key;

    if (key.includes("student_of_the_year")) {
      awards.push({
        id: r.id,
        badgeKey: key,
        periodType: "year",
        title: meta.title || `Student of the Year ${meta.year || ctx.year}`,
        edition: meta.edition || `${meta.year || ctx.year}`,
        tagline: "Annual Grand Academic Champion",
        description: `The highest academic honor on ExBoard AI, crowning the premier student of ${meta.year || ctx.year} with unrivaled mastery and board exam excellence.`,
        criteria: `Achieve #1 in Annual Academic Performance (min. 60 tests completed, ≥90% average accuracy) in ${meta.year || ctx.year}. Decided at end of academic year on May 1st.`,
        tier: "Mythic",
        icon: "/badges/student-of-the-year.svg",
        rewardPoints: 100,
        unlocked: true,
        unlockedAt: r.unlocked_at,
        gradient: "from-[#f59e0b] via-[#d97706] to-[#b45309]",
        borderGlow: "shadow-amber-500/40 hover:shadow-yellow-400/60",
        accentColor: "#f59e0b",
        textColor: "text-amber-200",
        metadata: meta,
      });
    } else if (key.includes("student_of_the_month")) {
      awards.push({
        id: r.id,
        badgeKey: key,
        periodType: "month",
        title: meta.title || `Student of the Month - ${meta.monthName || ctx.monthName} ${meta.year || ctx.year}`,
        edition: meta.edition || `${meta.monthName || ctx.monthName} ${meta.year || ctx.year}`,
        tagline: "Monthly Academic Paragon",
        description: `Awarded to the supreme champion with the highest overall score, consistency, and mastery across ${meta.monthName || ctx.monthName} ${meta.year || ctx.year}.`,
        criteria: `Rank #1 in Monthly Academic Performance (min. 25 tests completed, ≥88% average accuracy) in ${meta.edition || `${ctx.monthName} ${ctx.year}`}. Awarded on last date of month.`,
        tier: "Diamond",
        icon: "/badges/student-of-the-month.svg",
        rewardPoints: 30,
        unlocked: true,
        unlockedAt: r.unlocked_at,
        gradient: "from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]",
        borderGlow: "shadow-blue-500/40 hover:shadow-cyan-400/60",
        accentColor: "#3b82f6",
        textColor: "text-blue-200",
        metadata: meta,
      });
    } else if (key.includes("student_of_the_week")) {
      awards.push({
        id: r.id,
        badgeKey: key,
        periodType: "week",
        title: meta.title || `Student of the Week ${meta.weekOfMonth || ctx.weekOfMonth}, ${meta.monthName || ctx.monthName} ${meta.year || ctx.year}`,
        edition: meta.edition || `Week ${meta.weekOfMonth || ctx.weekOfMonth}, ${meta.monthName || ctx.monthName} ${meta.year || ctx.year}`,
        tagline: "Weekly Academic & Speed Ace",
        description: `Awarded to the top student with the highest performance index, test activity, and accuracy in Week ${meta.weekOfMonth || ctx.weekOfMonth} of ${meta.monthName || ctx.monthName} ${meta.year || ctx.year}.`,
        criteria: `Rank #1 in Weekly Academic Performance (min. 10 tests completed, ≥85% average accuracy) in ${meta.edition || `Week ${ctx.weekOfMonth}, ${ctx.monthName} ${ctx.year}`}. Awarded at end of week.`,
        tier: "Platinum",
        icon: "/badges/student-of-the-week.svg",
        rewardPoints: 15,
        unlocked: true,
        unlockedAt: r.unlocked_at,
        gradient: "from-[#a855f7] via-[#9333ea] to-[#7e22ce]",
        borderGlow: "shadow-purple-500/40 hover:shadow-pink-400/60",
        accentColor: "#a855f7",
        textColor: "text-purple-200",
        metadata: meta,
      });
    }
  }

  // If the user doesn't have an honor for current Year/Month/Week, include the prospective badges as showcase items
  const hasYear = awards.some((a) => a.periodType === "year");
  const hasMonth = awards.some((a) => a.periodType === "month");
  const hasWeek = awards.some((a) => a.periodType === "week");

  if (!hasYear) {
    awards.push({
      id: "prospect-year",
      badgeKey: ctx.yearKey,
      periodType: "year",
      title: ctx.yearTitle,
      edition: ctx.yearEdition,
      tagline: "Annual Grand Academic Champion",
      description: `The highest academic honor on ExBoard AI, crowning the premier student of the year ${ctx.year} with unrivaled mastery and board exam excellence.`,
      criteria: `Rank #1 in Annual Academic Performance (min. 60 tests completed, ≥90% average accuracy) in ${ctx.yearEdition}. Decided at end of academic year on May 1st.`,
      tier: "Mythic",
      icon: "/badges/student-of-the-year.svg",
      rewardPoints: 100,
      unlocked: false,
      unlockedAt: null,
      gradient: "from-[#f59e0b] via-[#d97706] to-[#b45309]",
      borderGlow: "shadow-amber-500/40 hover:shadow-yellow-400/60",
      accentColor: "#f59e0b",
      textColor: "text-amber-200",
      metadata: { year: ctx.year },
    });
  }

  if (!hasMonth) {
    awards.push({
      id: "prospect-month",
      badgeKey: ctx.monthKey,
      periodType: "month",
      title: ctx.monthTitle,
      edition: ctx.monthEdition,
      tagline: "Monthly Academic Paragon",
      description: `Awarded to the supreme champion with the highest overall score, consistency, and mastery across ${ctx.monthName} ${ctx.year}.`,
      criteria: `Rank #1 in Monthly Academic Performance (min. 25 tests completed, ≥88% average accuracy) in ${ctx.monthEdition}. Awarded on last date of month.`,
      tier: "Diamond",
      icon: "/badges/student-of-the-month.svg",
      rewardPoints: 30,
      unlocked: false,
      unlockedAt: null,
      gradient: "from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]",
      borderGlow: "shadow-blue-500/40 hover:shadow-cyan-400/60",
      accentColor: "#3b82f6",
      textColor: "text-blue-200",
      metadata: { year: ctx.year, month: ctx.monthNumber, monthName: ctx.monthName },
    });
  }

  if (!hasWeek) {
    awards.push({
      id: "prospect-week",
      badgeKey: ctx.weekKey,
      periodType: "week",
      title: ctx.weekTitle,
      edition: ctx.weekEdition,
      tagline: "Weekly Academic & Speed Ace",
      description: `Awarded to the top student with the highest performance index, test activity, and accuracy in Week ${ctx.weekOfMonth} of ${ctx.monthName} ${ctx.year}.`,
      criteria: `Rank #1 in Weekly Academic Performance (min. 10 tests completed, ≥85% average accuracy) in ${ctx.weekEdition}. Awarded at end of week.`,
      tier: "Platinum",
      icon: "/badges/student-of-the-week.svg",
      rewardPoints: 15,
      unlocked: false,
      unlockedAt: null,
      gradient: "from-[#a855f7] via-[#9333ea] to-[#7e22ce]",
      borderGlow: "shadow-purple-500/40 hover:shadow-pink-400/60",
      accentColor: "#a855f7",
      textColor: "text-purple-200",
      metadata: { year: ctx.year, month: ctx.monthNumber, monthName: ctx.monthName, weekOfMonth: ctx.weekOfMonth },
    });
  }

  return awards;
}

/**
 * Returns active live races for Week, Month, and Year so students can track their live progress.
 */
export async function getActivePeriodRaces(userId: string): Promise<ActivePeriodRace[]> {
  const ctx = getPeriodicDateContext();

  const configs = [
    {
      periodType: "week" as const,
      title: ctx.weekTitle,
      edition: `Week ${ctx.weekOfMonth} (${ctx.monthName} ${ctx.weekStartDate.getDate()} - ${ctx.weekEndDate.getDate()}, ${ctx.year})`,
      badgeIcon: "/badges/student-of-the-week.svg",
      tier: "Platinum" as const,
      rewardPoints: 15,
      gradient: "from-[#581c87] via-[#7c3aed] to-[#f59e0b]",
      borderGlow: "shadow-purple-500/40 hover:shadow-amber-500/60",
      accentColor: "#8b5cf6",
      textColor: "text-purple-300",
      startDate: ctx.weekStartDate,
      endDate: ctx.weekEndDate,
      minTests: 10,
      minAccuracy: 85,
      timeRemaining: ctx.weekTimeRemaining,
    },
    {
      periodType: "month" as const,
      title: ctx.monthTitle,
      edition: `${ctx.monthName} 1 - ${ctx.monthEndDate.getDate()}, ${ctx.year}`,
      badgeIcon: "/badges/student-of-the-month.svg",
      tier: "Diamond" as const,
      rewardPoints: 30,
      gradient: "from-[#1e3a8a] via-[#2563eb] to-[#f59e0b]",
      borderGlow: "shadow-blue-500/40 hover:shadow-amber-500/60",
      accentColor: "#3b82f6",
      textColor: "text-blue-300",
      startDate: ctx.monthStartDate,
      endDate: ctx.monthEndDate,
      minTests: 25,
      minAccuracy: 88,
      timeRemaining: ctx.monthTimeRemaining,
    },
    {
      periodType: "year" as const,
      title: ctx.yearTitle,
      edition: `Full Year ${ctx.year}`,
      badgeIcon: "/badges/student-of-the-year.svg",
      tier: "Mythic" as const,
      rewardPoints: 100,
      gradient: "from-[#047857] via-[#059669] to-[#fbbf24]",
      borderGlow: "shadow-emerald-500/40 hover:shadow-yellow-500/60",
      accentColor: "#10b981",
      textColor: "text-emerald-300",
      startDate: ctx.yearStartDate,
      endDate: ctx.yearEndDate,
      minTests: 60,
      minAccuracy: 90,
      timeRemaining: ctx.yearTimeRemaining,
    },
  ];

  const races: ActivePeriodRace[] = [];

  for (const cfg of configs) {
    try {
      const { rows } = await db.query<{
        user_id: string;
        name: string;
        test_count: string;
        total_score: string;
        total_max: string;
        user_total_points: string;
      }>(
        `WITH period_attempts AS (
           SELECT 
             user_id,
             COUNT(*) as test_count,
             SUM(COALESCE(score, 0)) as total_score,
             SUM(COALESCE(total_marks, 0)) as total_max
           FROM exam_attempts
           WHERE created_at >= $1 AND created_at <= $2
           GROUP BY user_id
         )
         SELECT 
           u.id as user_id,
           u.name,
           COALESCE(pa.test_count, 0)::text as test_count,
           COALESCE(pa.total_score, 0)::text as total_score,
           COALESCE(pa.total_max, 0)::text as total_max,
           COALESCE(u.points, 0)::text as user_total_points
         FROM users u
         LEFT JOIN period_attempts pa ON pa.user_id = u.id
         WHERE u.role = 'STUDENT' AND u.role != 'QA'
           AND (COALESCE(pa.test_count, 0) > 0 OR COALESCE(u.points, 0) > 0)
         ORDER BY COALESCE(pa.total_score, 0) DESC, COALESCE(u.points, 0) DESC`,
        [cfg.startDate.toISOString(), cfg.endDate.toISOString()],
      );

      const scored = rows.map((r) => {
        const tests = Number(r.test_count) || 0;
        const totalScore = Number(r.total_score) || 0;
        const totalMax = Number(r.total_max) || 0;
        const userTotalPoints = Number(r.user_total_points) || 0;
        const accuracy = totalMax > 0 ? (totalScore / totalMax) * 100 : (tests > 0 ? 80 : 0);
        const periodPoints = totalScore > 0 ? totalScore : Math.round(userTotalPoints / 10);
        const ppi = Math.round(periodPoints * (0.5 + 0.5 * (accuracy / 100)) + tests * 15);
        return {
          userId: r.user_id,
          name: r.name,
          tests,
          accuracy: Math.round(accuracy * 10) / 10,
          ppi,
          isQualified: tests >= cfg.minTests && accuracy >= cfg.minAccuracy,
        };
      });

      scored.sort((a, b) => b.ppi - a.ppi || b.tests - a.tests);

      const userIndex = scored.findIndex((s) => s.userId === userId);
      const userEntry = userIndex >= 0 ? scored[userIndex] : null;
      const leader = scored[0] || { name: "Awaiting Leader", ppi: 0 };

      const userScore = userEntry?.ppi ?? 0;
      const userAccuracy = userEntry?.accuracy ?? 0;
      const testsCompleted = userEntry?.tests ?? 0;
      const isQualified = userEntry?.isQualified ?? false;
      const userRank = userIndex >= 0 ? userIndex + 1 : scored.length + 1;
      const totalCompetitors = Math.max(1, scored.length);

      // Progress towards leading or completing qualification
      const testProg = Math.min(100, Math.round((testsCompleted / cfg.minTests) * 50));
      const accProg = Math.min(50, Math.round((userAccuracy / cfg.minAccuracy) * 50));
      const progress = isQualified ? Math.min(100, 75 + Math.round((userScore / Math.max(1, leader.ppi)) * 25)) : testProg + accProg;

      races.push({
        periodType: cfg.periodType,
        title: cfg.title,
        edition: cfg.edition,
        badgeIcon: cfg.badgeIcon,
        tier: cfg.tier,
        rewardPoints: cfg.rewardPoints,
        gradient: cfg.gradient,
        borderGlow: cfg.borderGlow,
        accentColor: cfg.accentColor,
        textColor: cfg.textColor,
        userScore,
        userAccuracy,
        testsCompleted,
        minTestsRequired: cfg.minTests,
        minAccuracyRequired: cfg.minAccuracy,
        isQualified,
        userRank,
        totalCompetitors,
        currentLeaderName: leader.name,
        currentLeaderScore: leader.ppi,
        timeRemainingLabel: cfg.timeRemaining,
        progress: Math.min(100, Math.max(0, progress)),
      });
    } catch (err) {
      console.error(`Error querying race for ${cfg.periodType}:`, err);
    }
  }

  return races;
}

/**
 * Returns full consolidated student gamification achievement payload.
 */
export async function getCompleteStudentAchievements(userId: string): Promise<StudentBadgesResponse> {
  const [performanceBadges, periodicHonors, activeRaces] = await Promise.all([
    getUserBadges(userId),
    getUserPeriodicHonors(userId),
    getActivePeriodRaces(userId),
  ]);

  const unlockedPerf = performanceBadges.filter((b) => b.unlocked).length;
  const unlockedPeriodic = periodicHonors.filter((p) => p.unlocked).length;

  return {
    performanceBadges,
    periodicHonors,
    activeRaces,
    totalBadgesCount: performanceBadges.length + periodicHonors.length,
    unlockedBadgesCount: unlockedPerf + unlockedPeriodic,
  };
}

/**
 * Trigger badge evaluation in background after an exam or lightning round.
 */
export async function evaluateAndAwardBadges(userId: string): Promise<UserBadgeStatus[]> {
  try {
    const badges = await getUserBadges(userId);
    void evaluatePeriodicHonors();
    return badges;
  } catch (err) {
    console.error("Badge evaluation error for user:", userId, err);
    return [];
  }
}
