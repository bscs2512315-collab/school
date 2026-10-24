import { db } from "@/lib/db";
import { UserRole } from "@/types/enums";
import { createNotification } from "@/lib/notifications";

export interface ReminderNotification {
  title: string;
  body: string;
  url: string;
  tag: string;
}

export type InactivityTemplateKey =
  | "book_band"
  | "board_exams"
  | "nova_waiting"
  | "streak_warning"
  | "exam_datesheet";

interface InactivityTemplateDef {
  key: InactivityTemplateKey;
  title: string;
  getBody: (firstName: string) => string;
  url: string;
  tag: string;
}

/**
 * Curated GenZ / Roman Urdu daily inactivity and encouragement templates.
 * Note: Nova is male/boy, so we strictly use "baitha hai" and "Nova is waiting for you! 🤖".
 */
export const INACTIVITY_TEMPLATES: InactivityTemplateDef[] = [
  {
    key: "book_band",
    title: "Book band kr k so gaye kya? 👀",
    getBody: (name) =>
      `${name}, aaj papers solve nhi krney? Sirf 10 min do aur past papers clear kro!`,
    url: "/student/generate",
    tag: "daily-inactivity-book-band",
  },
  {
    key: "board_exams",
    title: "Board exams wait nhi krengy 😭",
    getBody: () =>
      "Thori si prep aaj kr lo, exam hall mein regret na ho. Ek quick quiz attempt kro! ⚡",
    url: "/student/generate",
    tag: "daily-inactivity-board-exams",
  },
  {
    key: "nova_waiting",
    title: "Nova is waiting for you! 🤖",
    getBody: (name) =>
      `${name}, Nova tumhare difficult topics ready kr k baitha hai. Let's solve 5 questions today.`,
    url: "/student/dashboard",
    tag: "daily-inactivity-nova-waiting",
  },
  {
    key: "streak_warning",
    title: "Streak toot jayegi yaar! 🔥",
    getBody: (name) =>
      `${name}, consistent raho! Sirf 1 past paper attempt kro aur points boost kro.`,
    url: "/student/generate",
    tag: "daily-inactivity-streak",
  },
  {
    key: "exam_datesheet",
    title: "Exam date sheet yaad hai na? 📅",
    getBody: (name) =>
      `${name}, aakhri raat ratta marnay se behtar hai abhi 10 MCQs practice kr lo!`,
    url: "/student/generate",
    tag: "daily-inactivity-datesheet",
  },
];

export function getFirstName(fullName?: string | null): string {
  if (!fullName || !fullName.trim()) return "Champion";
  const cleaned = fullName.trim().replace(/["']/g, "");
  const first = cleaned.split(/\s+/)[0];
  return first && first.length > 1 ? first : "Champion";
}

/**
 * Get daily inactivity notification payload by template key or index
 */
export function getDailyInactivityNotification(
  studentName?: string | null,
  templateKeyOrIndex?: InactivityTemplateKey | number,
): ReminderNotification {
  const firstName = getFirstName(studentName);
  let template: InactivityTemplateDef;

  if (typeof templateKeyOrIndex === "number") {
    template =
      INACTIVITY_TEMPLATES[templateKeyOrIndex % INACTIVITY_TEMPLATES.length];
  } else if (typeof templateKeyOrIndex === "string") {
    template =
      INACTIVITY_TEMPLATES.find((t) => t.key === templateKeyOrIndex) ||
      INACTIVITY_TEMPLATES[0];
  } else {
    // Pick randomly
    const idx = Math.floor(Math.random() * INACTIVITY_TEMPLATES.length);
    template = INACTIVITY_TEMPLATES[idx];
  }

  return {
    title: template.title,
    body: template.getBody(firstName),
    url: template.url,
    tag: template.tag,
  };
}

/**
 * Generate Leaderboard Overtaken notification
 */
export function getLeaderboardOvertakenNotification(
  studentName: string,
  opponentName: string,
  opponentSchool?: string | null,
): ReminderNotification {
  const oppDisplay = opponentSchool
    ? `${opponentName} "${opponentSchool}"`
    : opponentName;

  return {
    title: "Position khatray mein hai! 🚨",
    body: `${oppDisplay} ne tmhe beat krk top position lelii hai, now its time to comeback!`,
    url: "/student/leaderboard",
    tag: "leaderboard-overtaken",
  };
}

/**
 * Generate Leaderboard Leading notification
 */
export function getLeaderboardLeadingNotification(
  studentName: string,
  schoolName?: string | null,
): ReminderNotification {
  const nameDisplay = schoolName ? `${studentName} "${schoolName}"` : studentName;

  return {
    title: "Leaderboard Champion! 🏆",
    body: `${nameDisplay} is leading the leaderboard. Top rank defend karne k liye tayyar raho!`,
    url: "/student/leaderboard",
    tag: "leaderboard-leading",
  };
}

/**
 * Send daily inactivity reminders to students who haven't attempted exams in 24+ hours
 * and haven't received a daily reminder in the last 20 hours.
 */
export async function sendDailyInactivityReminders(options?: {
  dryRun?: boolean;
  limit?: number;
  templateKey?: InactivityTemplateKey;
}): Promise<{
  matchedCount: number;
  sentCount: number;
  errors: number;
}> {
  const limit = options?.limit ?? 100;
  const isDryRun = Boolean(options?.dryRun);

  // Find inactive students (no attempt in last 24h, no reminder in last 20h)
  const { rows: inactiveStudents } = await db.query<{
    id: string;
    name: string | null;
    school_name: string | null;
    has_push: boolean;
  }>(
    `SELECT 
       u.id, 
       u.name, 
       u.school_name,
       EXISTS (SELECT 1 FROM push_subscriptions ps WHERE ps.user_id = u.id) AS has_push
     FROM users u
     WHERE u.role = $1
       -- Created more than 12 hours ago
       AND u.created_at < NOW() - INTERVAL '12 hours'
       -- No attempts completed in the last 24 hours
       AND NOT EXISTS (
         SELECT 1 FROM exam_attempts ea 
         WHERE ea.user_id = u.id 
           AND ea.created_at > NOW() - INTERVAL '24 hours'
       )
       -- No daily reminder sent in the last 20 hours
       AND NOT EXISTS (
         SELECT 1 FROM notifications n 
         WHERE n.user_id = u.id 
           AND n.type = 'DAILY_REMINDER' 
           AND n.created_at > NOW() - INTERVAL '20 hours'
       )
     ORDER BY has_push DESC, u.updated_at DESC
     LIMIT $2`,
    [UserRole.STUDENT, limit],
  );

  let sentCount = 0;
  let errors = 0;

  for (let i = 0; i < inactiveStudents.length; i++) {
    const student = inactiveStudents[i];
    const payload = getDailyInactivityNotification(
      student.name,
      options?.templateKey ?? i % INACTIVITY_TEMPLATES.length,
    );

    if (isDryRun) {
      sentCount++;
      continue;
    }

    try {
      await createNotification({
        userId: student.id,
        type: "DAILY_REMINDER",
        title: payload.title,
        message: payload.body,
        link: payload.url,
        metadata: {
          tag: payload.tag,
          isDailyInactivity: true,
          sentAt: new Date().toISOString(),
        },
      });
      sentCount++;
    } catch (err) {
      console.error(`Failed to send daily inactivity reminder to user ${student.id}:`, err);
      errors++;
    }
  }

  return {
    matchedCount: inactiveStudents.length,
    sentCount,
    errors,
  };
}

/**
 * Check and notify if another student was overtaken on the leaderboard
 */
export async function notifyLeaderboardOvertaken(params: {
  winnerUserId: string;
  winnerName: string;
  winnerSchool?: string | null;
  newRank: number;
}): Promise<void> {
  try {
    // Only trigger overtaking alert if student entered top 10
    if (params.newRank > 10) return;

    // Find the student who was right at this rank or immediately below (rank + 1)
    const { rows: overtakenRows } = await db.query<{
      id: string;
      name: string;
    }>(
      `SELECT u.id, u.name 
       FROM users u
       WHERE u.role = $1 
         AND u.id <> $2
         AND u.rank = $3
       LIMIT 1`,
      [UserRole.STUDENT, params.winnerUserId, params.newRank + 1],
    );

    const overtaken = overtakenRows[0];
    if (!overtaken) return;

    const payload = getLeaderboardOvertakenNotification(
      overtaken.name,
      params.winnerName,
      params.winnerSchool,
    );

    await createNotification({
      userId: overtaken.id,
      type: "LEADERBOARD_ALERT",
      title: payload.title,
      message: payload.body,
      link: payload.url,
      metadata: {
        tag: payload.tag,
        overtakenByUserId: params.winnerUserId,
        rank: params.newRank + 1,
      },
    });
  } catch (err) {
    console.error("Failed to notify leaderboard overtaken:", err);
  }
}
