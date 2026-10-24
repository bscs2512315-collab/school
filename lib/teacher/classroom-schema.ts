import { db } from "@/lib/db";

export type ClassroomVisibility = "school" | "private";

/** Dedicated teacher/student classroom registry — never the legacy school `classrooms` table. */
export const TEACHER_CLASSROOMS_TABLE = "teacher_classrooms";

const globalForClassroom = globalThis as unknown as {
  __classroom_schema_ready?: boolean;
  __classroom_schema_promise?: Promise<void> | null;
};

export async function ensureClassroomSchema(options: { forceMigration?: boolean } = {}): Promise<void> {
  if (globalForClassroom.__classroom_schema_ready && !options.forceMigration) return;
  if (globalForClassroom.__classroom_schema_promise) return globalForClassroom.__classroom_schema_promise;

  globalForClassroom.__classroom_schema_promise = (async () => {
    if (!options.forceMigration) {
      // Existing deployments already have these objects. One read-only catalog
      // query on a cold instance replaces DDL on every serverless process.
      const { rows } = await db.query<{ ready: boolean }>(`
        SELECT
          to_regclass('public.teacher_classrooms') IS NOT NULL
          AND to_regclass('public.classroom_members') IS NOT NULL
          AND to_regclass('public.teacher_papers') IS NOT NULL
          AND to_regclass('public.teacher_paper_progress') IS NOT NULL
          AND to_regclass('public.idx_teacher_classrooms_teacher') IS NOT NULL
          AND to_regclass('public.idx_teacher_classrooms_pin') IS NOT NULL
          AND to_regclass('public.idx_classroom_members_classroom') IS NOT NULL
          AND to_regclass('public.idx_classroom_members_student') IS NOT NULL
          AND to_regclass('public.idx_teacher_papers_classroom') IS NOT NULL
          AND to_regclass('public.idx_teacher_papers_remedial') IS NOT NULL
          AND to_regclass('public.idx_teacher_paper_progress_user_paper') IS NOT NULL
          AND NOT EXISTS (
            SELECT 1
            FROM (VALUES
              ('teacher_classrooms', 'settings'),
              ('teacher_classrooms', 'board'),
              ('teacher_classrooms', 'pin_code'),
              ('teacher_papers', 'strict_mode'),
              ('teacher_papers', 'allow_resume'),
              ('teacher_papers', 'is_remedial'),
              ('teacher_papers', 'remedial_student_id'),
              ('generated_papers', 'questions_snapshot'),
              ('generated_papers', 'question_count')
            ) AS required(table_name, column_name)
            WHERE NOT EXISTS (
              SELECT 1 FROM information_schema.columns c
              WHERE c.table_schema = 'public'
                AND c.table_name = required.table_name
                AND c.column_name = required.column_name
            )
          ) AS ready
      `);
      if (rows[0]?.ready) {
        globalForClassroom.__classroom_schema_ready = true;
        return;
      }
      throw new Error(
        "Classroom schema is not ready. Run npm run db:migrate:classrooms before serving requests.",
      );
    }

    await db.query(`
      CREATE TABLE IF NOT EXISTS teacher_classrooms (
        id TEXT PRIMARY KEY,
        teacher_id TEXT NOT NULL,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        class_level TEXT NOT NULL,
        visibility TEXT NOT NULL DEFAULT 'school',
        school_id TEXT,
        school_name TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Ensure legacy composite constraint is dropped so teachers can have multiple rooms per class
    await db
      .query(`
        ALTER TABLE teacher_classrooms
        DROP CONSTRAINT IF EXISTS teacher_classrooms_teacher_id_subject_class_level_visibilit_key
      `)
      .catch(() => {});

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_teacher_classrooms_teacher
      ON teacher_classrooms(teacher_id, visibility)
    `);

    await db
      .query(`
        ALTER TABLE teacher_classrooms
        ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb
      `)
      .catch(() => {});

    await db
      .query(`
        ALTER TABLE teacher_classrooms
        ADD COLUMN IF NOT EXISTS board TEXT NOT NULL DEFAULT 'AKUEB'
      `)
      .catch(() => {});

    await db
      .query(`
        ALTER TABLE teacher_classrooms
        ADD COLUMN IF NOT EXISTS pin_code VARCHAR(10)
      `)
      .catch(() => {});

    await db
      .query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_classrooms_pin
        ON teacher_classrooms(pin_code)
        WHERE pin_code IS NOT NULL
      `)
      .catch(() => {});

    await db.query(`
      CREATE TABLE IF NOT EXISTS classroom_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        classroom_id TEXT NOT NULL,
        teacher_id TEXT NOT NULL,
        subject TEXT NOT NULL,
        class_level TEXT NOT NULL,
        student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'accepted',
        invited_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        accepted_at TIMESTAMPTZ,
        UNIQUE (classroom_id, student_id)
      )
    `);

    await db.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'classroom_members'
            AND column_name = 'classroom_id'
            AND data_type = 'uuid'
        ) THEN
          ALTER TABLE classroom_members
            ALTER COLUMN classroom_id TYPE TEXT USING classroom_id::text;
        END IF;
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'classroom_members'
            AND column_name = 'teacher_id'
            AND data_type = 'uuid'
        ) THEN
          ALTER TABLE classroom_members
            ALTER COLUMN teacher_id TYPE TEXT USING teacher_id::text;
        END IF;
      END $$;
    `).catch(() => {});

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_classroom_members_classroom
      ON classroom_members(classroom_id, status)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_classroom_members_student
      ON classroom_members(student_id, status)
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS teacher_papers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        teacher_id TEXT NOT NULL,
        classroom_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        paper_type VARCHAR(10) NOT NULL,
        subject TEXT NOT NULL,
        class_level TEXT NOT NULL,
        board TEXT NOT NULL,
        chapter_ids JSONB NOT NULL DEFAULT '[]',
        question_ids JSONB NOT NULL DEFAULT '[]',
        questions_snapshot JSONB,
        total_marks INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 0,
        due_date TIMESTAMPTZ,
        strict_mode BOOLEAN DEFAULT true,
        allow_resume BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'teacher_papers'
            AND column_name = 'classroom_id'
            AND data_type = 'uuid'
        ) THEN
          ALTER TABLE teacher_papers
            ALTER COLUMN classroom_id TYPE TEXT USING classroom_id::text;
        END IF;
      END $$;
    `).catch(() => {});

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_teacher_papers_classroom
      ON teacher_papers(classroom_id, created_at DESC)
    `);

    await db
      .query(`
        ALTER TABLE teacher_papers
        ADD COLUMN IF NOT EXISTS strict_mode BOOLEAN DEFAULT true
      `)
      .catch(() => {});

    await db
      .query(`
        ALTER TABLE teacher_papers
        ADD COLUMN IF NOT EXISTS allow_resume BOOLEAN DEFAULT false
      `)
      .catch(() => {});

    await db
      .query(`
        ALTER TABLE teacher_papers
        ADD COLUMN IF NOT EXISTS is_remedial BOOLEAN DEFAULT false
      `)
      .catch(() => {});

    await db
      .query(`
        ALTER TABLE teacher_papers
        ADD COLUMN IF NOT EXISTS remedial_student_id TEXT
      `)
      .catch(() => {});

    await db
      .query(`
        CREATE INDEX IF NOT EXISTS idx_teacher_papers_remedial
        ON teacher_papers(classroom_id, remedial_student_id)
        WHERE is_remedial = true
      `)
      .catch(() => {});

    await db.query(`
      CREATE TABLE IF NOT EXISTS teacher_paper_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        teacher_paper_id UUID NOT NULL REFERENCES teacher_papers(id) ON DELETE CASCADE,
        answers_data JSONB NOT NULL DEFAULT '{}',
        current_question_index INTEGER DEFAULT 0,
        time_left INTEGER NOT NULL,
        time_spent INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'in_progress',
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (user_id, teacher_paper_id)
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_teacher_paper_progress_user_paper
      ON teacher_paper_progress(user_id, teacher_paper_id)
    `);

    await db
      .query(`
        ALTER TABLE generated_papers
        ADD COLUMN IF NOT EXISTS questions_snapshot JSONB
      `)
      .catch(() => {});

    await db
      .query(`
        ALTER TABLE generated_papers
        ADD COLUMN IF NOT EXISTS question_count INTEGER
      `)
      .catch(() => {});

    globalForClassroom.__classroom_schema_ready = true;
  })();

  try {
    await globalForClassroom.__classroom_schema_promise;
  } finally {
    globalForClassroom.__classroom_schema_promise = null;
  }
}

const PIN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePinCode(length = 6): string {
  let pin = "";
  for (let i = 0; i < length; i++) {
    pin += PIN_CHARS[Math.floor(Math.random() * PIN_CHARS.length)];
  }
  return pin;
}

export async function generateUniqueClassroomPin(): Promise<string> {
  await ensureClassroomSchema();
  for (let attempt = 0; attempt < 20; attempt++) {
    const pin = generatePinCode(6);
    const { rows } = await db.query(
      `SELECT 1 FROM teacher_classrooms WHERE pin_code = $1 LIMIT 1`,
      [pin],
    );
    if (rows.length === 0) {
      return pin;
    }
  }
  return generatePinCode(4) + Math.floor(10 + Math.random() * 90);
}

export function buildClassroomId(
  teacherId: string,
  subject: string,
  classLevel: string,
  _visibility: ClassroomVisibility = "private",
  uniqueKey?: string,
): string {
  const base = uniqueKey
    ? `${teacherId}__${subject}__${classLevel}__${uniqueKey}`
    : `${teacherId}__${subject}__${classLevel}`;
  return base.endsWith("__private") ? base : `${base}__private`;
}

export function parseClassroomId(classroomId: string): {
  teacherId: string;
  subject: string;
  classLevel: string;
  visibility: ClassroomVisibility;
  uniqueKey?: string;
} | null {
  if (!classroomId || typeof classroomId !== "string") return null;
  const parts = classroomId.split("__");
  if (parts.length >= 3) {
    const [teacherId, subject, classLevel, ...rest] = parts;
    if (!teacherId || !subject || !classLevel) return null;
    const cleanRest = rest.filter((p) => p !== "private");
    const uniqueKey = cleanRest.length > 0 ? cleanRest.join("__") : undefined;
    return { teacherId, subject, classLevel, visibility: "private", uniqueKey };
  }
  return null;
}

export function buildClassroomDisplayName(
  subject: string,
  classLevel: string,
  _visibility?: ClassroomVisibility,
): string {
  return `${subject} - Class ${classLevel}`;
}

export async function upsertClassroomRow(params: {
  id: string;
  teacherId: string;
  subject: string;
  classLevel: string;
  visibility?: ClassroomVisibility;
  schoolId?: string | null;
  schoolName?: string | null;
  name?: string | null;
  board?: string | null;
  pinCode?: string | null;
  reactivate?: boolean;
}): Promise<{ pinCode: string }> {
  await ensureClassroomSchema();
  const name =
    params.name?.trim() ||
    buildClassroomDisplayName(
      params.subject,
      params.classLevel,
    );
  const reactivate = params.reactivate ?? false;
  const board = params.board?.trim() || "AKUEB";
  const pinCode = params.pinCode || (await generateUniqueClassroomPin());

  await db.query(
    `INSERT INTO teacher_classrooms
       (id, teacher_id, name, subject, class_level, visibility, school_id, school_name, board, pin_code, status)
     VALUES ($1, $2, $3, $4, $5, 'private', $6, $7, $8, $9, 'active')
     ON CONFLICT (id)
     DO UPDATE SET
       name = EXCLUDED.name,
       subject = EXCLUDED.subject,
       class_level = EXCLUDED.class_level,
       board = COALESCE(EXCLUDED.board, teacher_classrooms.board, 'AKUEB'),
       visibility = 'private',
       pin_code = COALESCE(teacher_classrooms.pin_code, EXCLUDED.pin_code),
       school_id = COALESCE(EXCLUDED.school_id, teacher_classrooms.school_id),
       school_name = COALESCE(EXCLUDED.school_name, teacher_classrooms.school_name),
       status = CASE WHEN $10 THEN 'active' ELSE teacher_classrooms.status END
     WHERE teacher_classrooms.status != 'deleted' OR $10`,
    [
      params.id,
      params.teacherId,
      name,
      params.subject,
      params.classLevel,
      params.schoolId ?? null,
      params.schoolName ?? null,
      board,
      pinCode,
      reactivate,
    ],
  );

  return { pinCode };
}

export async function getClassroomVisibility(
  _classroomId: string,
): Promise<ClassroomVisibility> {
  return "private";
}

export interface ClassroomSettings {
  /** Auto-approve Paper 2 results, skipping teacher review. */
  autoApprovePaper2?: boolean;
  /** Allow teacher to edit marks after the result was approved. */
  allowPostApprovalEdit?: boolean;
  /** Notify teacher when a student submits or retakes a test attempt. */
  notifyOnAttemptSubmission?: boolean;
}

export interface ClassroomDetailsUpdate {
  name?: string;
  board?: string;
  subject?: string;
  classLevel?: string;
}

const DEFAULT_CLASSROOM_SETTINGS: Required<ClassroomSettings> = {
  autoApprovePaper2: false,
  allowPostApprovalEdit: true,
  notifyOnAttemptSubmission: true,
};

function parseSettings(raw: unknown): ClassroomSettings {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as ClassroomSettings;
    } catch {
      return {};
    }
  }
  if (raw && typeof raw === "object") return raw as ClassroomSettings;
  return {};
}

export async function getClassroomSettings(
  classroomId: string,
): Promise<Required<ClassroomSettings>> {
  await ensureClassroomSchema();
  const { rows } = await db.query(
    `SELECT settings FROM teacher_classrooms WHERE id = $1 LIMIT 1`,
    [classroomId],
  );
  const settings = parseSettings(rows[0]?.settings);
  return { ...DEFAULT_CLASSROOM_SETTINGS, ...settings };
}

export async function updateClassroomSettings(
  classroomId: string,
  teacherId: string,
  patch: ClassroomSettings,
): Promise<void> {
  await ensureClassroomSchema();
  const current = await getClassroomSettings(classroomId);
  const merged = { ...current, ...patch };
  await db.query(
    `UPDATE teacher_classrooms
     SET settings = $3
     WHERE id = $1 AND teacher_id = $2`,
    [classroomId, teacherId, JSON.stringify(merged)],
  );
}

export async function updateClassroomDetails(
  classroomId: string,
  teacherId: string,
  details: ClassroomDetailsUpdate,
): Promise<void> {
  await ensureClassroomSchema();
  const updates: string[] = [];
  const values: any[] = [classroomId, teacherId];
  let idx = 3;

  if (typeof details.name === "string" && details.name.trim()) {
    updates.push(`name = $${idx++}`);
    values.push(details.name.trim());
  }
  if (typeof details.board === "string" && details.board.trim()) {
    updates.push(`board = $${idx++}`);
    values.push(details.board.trim());
  }
  if (typeof details.subject === "string" && details.subject.trim()) {
    updates.push(`subject = $${idx++}`);
    values.push(details.subject.trim());
  }
  if (typeof details.classLevel === "string" && details.classLevel.trim()) {
    updates.push(`class_level = $${idx++}`);
    values.push(details.classLevel.trim().toUpperCase());
  }

  if (updates.length > 0) {
    await db.query(
      `UPDATE teacher_classrooms
       SET ${updates.join(", ")}
       WHERE id = $1 AND teacher_id = $2`,
      values,
    );
  }
}
