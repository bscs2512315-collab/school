import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

let ensureTablePromise: Promise<void> | null = null;

export async function ensurePapersBankTables(): Promise<void> {
  if (!ensureTablePromise) {
    ensureTablePromise = (async () => {
      // 1. Ensure columns exist on generated_papers
      await db.query(`
        CREATE TABLE IF NOT EXISTS generated_papers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          paper_type VARCHAR(10) NOT NULL,
          subject TEXT NOT NULL,
          class TEXT NOT NULL,
          board TEXT NOT NULL,
          chapter_ids JSONB NOT NULL DEFAULT '[]',
          question_ids JSONB NOT NULL DEFAULT '[]',
          questions_snapshot JSONB,
          question_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await db.query(`
        ALTER TABLE generated_papers
        ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS title TEXT,
        ADD COLUMN IF NOT EXISTS mode VARCHAR(50) DEFAULT 'slos',
        ADD COLUMN IF NOT EXISTS creator_role VARCHAR(20) DEFAULT 'STUDENT',
        ADD COLUMN IF NOT EXISTS total_marks INTEGER DEFAULT 25,
        ADD COLUMN IF NOT EXISTS chapter_names JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 0;
      `).catch(() => {});

      // 2. Ensure paper_bank_shares table
      await db.query(`
        CREATE TABLE IF NOT EXISTS paper_bank_shares (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          paper_id UUID NOT NULL,
          sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(paper_id, receiver_id)
        );
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_paper_bank_shares_receiver
        ON paper_bank_shares(receiver_id);
      `);
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_generated_papers_public_lookup
        ON generated_papers(board, class, subject, paper_type, is_public);
      `);
    })()
      .then(() => undefined)
      .catch((error) => {
        ensureTablePromise = null;
        throw error;
      });
  }
  return ensureTablePromise;
}

export interface PaperBankItem {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  board: string;
  paperType: 1 | 2;
  mode: string;
  totalMarks: number;
  totalQuestions: number;
  chapterNames: string[];
  createdAt: string;
  attemptCount: number;
  isPublic: boolean;
  isSharedWithMe?: boolean;
  creator: {
    id: string;
    name: string;
    username: string;
    profileImage: string | null;
    role: string;
  };
}

export interface PaperBankFilters {
  board?: string;
  classLevel?: string;
  subject?: string;
  paperType?: 1 | 2;
  search?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

export async function getPapersBankList(filters: PaperBankFilters): Promise<{
  papers: PaperBankItem[];
  total: number;
}> {
  await ensurePapersBankTables();

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  // Visibility clause: paper is public OR created by user OR shared with user
  if (filters.userId) {
    conditions.push(`(
      gp.is_public = true
      OR gp.user_id = $${paramIdx}
      OR EXISTS (
        SELECT 1 FROM paper_bank_shares s
        WHERE s.paper_id = gp.id AND s.receiver_id = $${paramIdx}
      )
    )`);
    params.push(filters.userId);
    paramIdx++;
  } else {
    conditions.push(`gp.is_public = true`);
  }

  if (filters.board && filters.board !== "all") {
    conditions.push(`gp.board ILIKE $${paramIdx}`);
    params.push(filters.board);
    paramIdx++;
  }

  if (filters.classLevel && filters.classLevel !== "all") {
    conditions.push(`gp.class ILIKE $${paramIdx}`);
    params.push(filters.classLevel);
    paramIdx++;
  }

  if (filters.subject && filters.subject !== "all") {
    conditions.push(`gp.subject ILIKE $${paramIdx}`);
    params.push(filters.subject);
    paramIdx++;
  }

  if (filters.paperType) {
    const ptStr = filters.paperType === 2 ? "2" : "1";
    conditions.push(`(gp.paper_type = $${paramIdx} OR gp.paper_type = $${paramIdx + 1})`);
    params.push(ptStr, `paper${ptStr}`);
    paramIdx += 2;
  }

  if (filters.search && filters.search.trim()) {
    const searchPattern = `%${filters.search.trim()}%`;
    conditions.push(`(
      gp.title ILIKE $${paramIdx}
      OR gp.subject ILIKE $${paramIdx}
      OR u.name ILIKE $${paramIdx}
      OR u.username ILIKE $${paramIdx}
      OR CAST(gp.chapter_names AS text) ILIKE $${paramIdx}
    )`);
    params.push(searchPattern);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countQuery = `
    SELECT COUNT(*)::int as total
    FROM generated_papers gp
    LEFT JOIN users u ON u.id = gp.user_id
    ${whereClause}
  `;
  const countRes = await db.query(countQuery, params);
  const total = countRes.rows[0]?.total || 0;

  const limit = Math.min(filters.limit || 20, 50);
  const offset = filters.offset || 0;

  const dataQuery = `
    SELECT
      gp.id,
      COALESCE(gp.title, CONCAT(gp.subject, ' Class ', gp.class, ' · Paper ', CASE WHEN gp.paper_type IN ('2', 'paper2') THEN '2' ELSE '1' END)) AS title,
      gp.subject,
      gp.class AS class_level,
      gp.board,
      CASE WHEN gp.paper_type IN ('2', 'paper2') THEN 2 ELSE 1 END AS paper_type,
      COALESCE(gp.mode, 'slos') AS mode,
      COALESCE(gp.total_marks, 25) AS total_marks,
      COALESCE(gp.question_count, 0) AS total_questions,
      COALESCE(gp.chapter_names, '[]'::jsonb) AS chapter_names,
      gp.created_at,
      COALESCE(gp.attempt_count, 0) AS attempt_count,
      COALESCE(gp.is_public, true) AS is_public,
      u.id AS creator_id,
      COALESCE(u.name, 'ExBoard Educator') AS creator_name,
      COALESCE(u.username, 'creator') AS creator_username,
      u.profile_image AS creator_image,
      COALESCE(u.role, 'STUDENT') AS creator_role,
      ${filters.userId ? `EXISTS (SELECT 1 FROM paper_bank_shares s WHERE s.paper_id = gp.id AND s.receiver_id = $1) AS is_shared_with_me` : `false AS is_shared_with_me`}
    FROM generated_papers gp
    LEFT JOIN users u ON u.id = gp.user_id
    ${whereClause}
    ORDER BY gp.created_at DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  params.push(limit, offset);
  const dataRes = await db.query(dataQuery, params);

  const papers: PaperBankItem[] = dataRes.rows.map((row: any) => {
    let chapterNames: string[] = [];
    if (Array.isArray(row.chapter_names)) {
      chapterNames = row.chapter_names;
    } else if (typeof row.chapter_names === "string") {
      try {
        chapterNames = JSON.parse(row.chapter_names);
      } catch {
        chapterNames = [];
      }
    }

    return {
      id: row.id,
      title: row.title,
      subject: row.subject,
      classLevel: row.class_level,
      board: row.board,
      paperType: row.paper_type,
      mode: row.mode,
      totalMarks: Number(row.total_marks) || 25,
      totalQuestions: Number(row.total_questions) || 0,
      chapterNames,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      attemptCount: Number(row.attempt_count) || 0,
      isPublic: Boolean(row.is_public),
      isSharedWithMe: Boolean(row.is_shared_with_me),
      creator: {
        id: row.creator_id || "",
        name: row.creator_name,
        username: row.creator_username,
        profileImage: row.creator_image,
        role: row.creator_role,
      },
    };
  });

  return { papers, total };
}

export async function getPaperBankDetail(paperId: string, userId?: string): Promise<any | null> {
  await ensurePapersBankTables();

  const query = `
    SELECT
      gp.id,
      COALESCE(gp.title, CONCAT(gp.subject, ' Class ', gp.class, ' · Paper ', CASE WHEN gp.paper_type IN ('2', 'paper2') THEN '2' ELSE '1' END)) AS title,
      gp.subject,
      gp.class AS class_level,
      gp.board,
      CASE WHEN gp.paper_type IN ('2', 'paper2') THEN 2 ELSE 1 END AS paper_type,
      COALESCE(gp.mode, 'slos') AS mode,
      COALESCE(gp.total_marks, 25) AS total_marks,
      COALESCE(gp.question_count, 0) AS total_questions,
      COALESCE(gp.chapter_names, '[]'::jsonb) AS chapter_names,
      gp.chapter_ids,
      gp.questions_snapshot,
      gp.question_ids,
      gp.created_at,
      COALESCE(gp.attempt_count, 0) AS attempt_count,
      COALESCE(gp.is_public, true) AS is_public,
      u.id AS creator_id,
      COALESCE(u.name, 'ExBoard Educator') AS creator_name,
      COALESCE(u.username, 'creator') AS creator_username,
      u.profile_image AS creator_image,
      COALESCE(u.role, 'STUDENT') AS creator_role
    FROM generated_papers gp
    LEFT JOIN users u ON u.id = gp.user_id
    WHERE gp.id = $1
  `;

  const { rows } = await db.query(query, [paperId]);
  if (rows.length === 0) return null;

  const row = rows[0];

  let questions: any[] = [];
  if (row.questions_snapshot) {
    questions =
      typeof row.questions_snapshot === "string"
        ? JSON.parse(row.questions_snapshot)
        : row.questions_snapshot;
  } else if (row.question_ids) {
    const qIds =
      typeof row.question_ids === "string"
        ? JSON.parse(row.question_ids)
        : row.question_ids;
    if (Array.isArray(qIds) && qIds.length > 0) {
      const placeholders = qIds.map((_: string, i: number) => `$${i + 1}`).join(",");
      const { rows: dbQuestions } = await db.query(
        `SELECT q.*, c.name as chapter_name
         FROM questions q
         LEFT JOIN chapters c ON c.id = q.chapter_id
         WHERE q.id IN (${placeholders})`,
        qIds
      );
      questions = dbQuestions.map((q: any, idx: number) => {
        let mcqOptions: any[] = [];
        let correctAnswer: string | null = null;
        if (q.mcq_data) {
          try {
            const data = typeof q.mcq_data === "string" ? JSON.parse(q.mcq_data) : q.mcq_data;
            mcqOptions = data.options || [];
            correctAnswer = data.correctAnswer || null;
          } catch {}
        }
        return {
          id: q.id,
          questionNumber: idx + 1,
          questionPart: q.question_part,
          questionText: q.text || q.question_text,
          questionType: q.question_type || (row.paper_type === 2 ? "CRQ" : "MCQ"),
          marks: q.marks || 1,
          chapterName: q.chapter_name || row.subject,
          imageUrl: q.image_url,
          mcqOptions,
          correctAnswer,
          paperIIData: q.paper_ii_data,
        };
      });
    }
  }

  let chapterNames: string[] = [];
  if (Array.isArray(row.chapter_names)) {
    chapterNames = row.chapter_names;
  } else if (typeof row.chapter_names === "string") {
    try {
      chapterNames = JSON.parse(row.chapter_names);
    } catch {
      chapterNames = [];
    }
  }

  // If chapterNames is empty but questions have chapterName, extract from questions
  if (chapterNames.length === 0 && Array.isArray(questions)) {
    const set = new Set<string>();
    for (const q of questions) {
      if (q.chapterName && q.chapterName !== row.subject) set.add(q.chapterName);
    }
    chapterNames = Array.from(set);
  }

  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    classLevel: row.class_level,
    board: row.board,
    paperType: row.paper_type,
    mode: row.mode,
    totalMarks: Number(row.total_marks) || 25,
    totalQuestions: Number(row.total_questions) || questions.length,
    chapterNames,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    attemptCount: Number(row.attempt_count) || 0,
    isPublic: Boolean(row.is_public),
    creator: {
      id: row.creator_id || "",
      name: row.creator_name,
      username: row.creator_username,
      profileImage: row.creator_image,
      role: row.creator_role,
    },
    questions,
  };
}

export async function sharePaperBankItem(
  paperId: string,
  senderUserId: string,
  targetUserIds: string[]
): Promise<{ sharedCount: number; alreadySharedCount: number }> {
  await ensurePapersBankTables();

  const paper = await getPaperBankDetail(paperId);
  if (!paper) {
    throw new Error("Paper not found");
  }

  const { rows: senderRows } = await db.query(
    `SELECT name, role FROM users WHERE id = $1`,
    [senderUserId]
  );
  const senderName = senderRows[0]?.name || "A user";

  let sharedCount = 0;
  let alreadySharedCount = 0;

  for (const targetId of targetUserIds) {
    if (targetId === senderUserId) continue;

    const insertRes = await db.query(
      `INSERT INTO paper_bank_shares (paper_id, sender_id, receiver_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (paper_id, receiver_id) DO NOTHING
       RETURNING id`,
      [paperId, senderUserId, targetId]
    );

    if (insertRes.rowCount === 0) {
      alreadySharedCount++;
      continue;
    }

    sharedCount++;

    // Fetch target user's role to direct them to appropriate view
    const { rows: targetRows } = await db.query(
      `SELECT role FROM users WHERE id = $1`,
      [targetId]
    );
    const targetRole = targetRows[0]?.role || "STUDENT";
    const targetLink =
      targetRole === "TEACHER"
        ? `/teacher/papers-bank/${paperId}/view`
        : `/student/papers-bank/${paperId}/attempt`;

    await createNotification({
      userId: targetId,
      type: "PAPER_ASSIGNED" as any,
      title: "Shared Exam Paper 📄",
      message: `${senderName} shared the ${paper.subject} (Class ${paper.classLevel}) Paper ${paper.paperType} with you: "${paper.title}"`,
      link: targetLink,
      metadata: {
        paperId,
        senderId: senderUserId,
        subject: paper.subject,
        paperType: paper.paperType,
      },
    }).catch((err) => console.error("Paper share notification error:", err));
  }

  return { sharedCount, alreadySharedCount };
}
