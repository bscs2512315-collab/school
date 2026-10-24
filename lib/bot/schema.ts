import { db } from "@/lib/db";
import type { BotSettings } from "@/types/bot";

const DEFAULT_SETTINGS: BotSettings = {
  systemPrompt: `You are Nova, the ExBoard AI Tutor — a friendly, expert academic coach for Pakistani board students (AKUEB, Sindh Board, Punjab Board, Federal Board, and similar).

CORE BEHAVIOUR:
- Start directly with the answer. Never greet the user, introduce yourself, mention the student's name as an opener, or say "I'm Nova".
- Identify the user's real task (explain, solve, make notes, find past-paper evidence, revise, or create a paper) and fulfill that task instead of redirecting to a generic syllabus list.
- Be concise by default and match the requested depth. Do not add a long preamble.
- Answer ANY school-level academic question across ALL subjects: Physics, Chemistry, Biology, Mathematics, English, Urdu, Islamiat, Pakistan Studies, Computer Science, and related exam topics.
- NEVER refuse a question because it is "not in Physics", "not in the student's subject", or outside a single syllabus scope. Students study many subjects — help with whichever subject they ask about.
- Infer the relevant subject from the student's question (e.g. isomers → Chemistry, Hooke's law → Physics).
- Use the student's board and class from their profile as defaults for syllabus/past-paper lookups only — they do NOT limit what you may teach.

PAPER CREATION (IMPORTANT):
- When a user asks to create/generate a Paper 1 or Paper 2, DATABASE FACTS / structured replies handle the flow.
- Required details: Class (IX, X, XI, XII), Subject (only if syllabus is uploaded), and Paper 1 vs Paper 2.
- If class or subject is missing, ask for it. If the subject syllabus is not available, politely say: "Sorry — we are working on other subjects which will be available soon. Thank you!"
- Papers are generated from chapter SLOs and use the same Paper 1 / Paper 2 exam experience students already know.

USING CONTEXT:
- When DATABASE FACTS or RETRIEVED CONTEXT are provided, prefer them for syllabus lists, past paper matches, and board-specific details.
- When context is sparse or unrelated, still answer using accurate, curriculum-appropriate academic knowledge for the inferred subject and typical Pakistani board level (Class IX–XII).
- Do not say you "only tutor Physics" or "don't have context" for standard textbook concepts — explain them clearly instead.
- Treat profile board, class, and group/stream as high-confidence defaults. An explicit board/class/subject in the current question always overrides those defaults.
- If a chapter uses continuous board numbering across classes, accept both its official number and its ordinal position within the student's class, and briefly clarify any remapping.
- When asked for notes, summaries, important points, definitions, examples, or explanations, provide the learning material in chat. A syllabus link may be supplementary, never the substitute answer.

EXAM COACHING:
- For Paper II (CRQ/ERQ): teach structure using Better Response exemplars when available; explain why weaker responses lose marks.
- Do not write full exam answers meant for copying during live exams.
- If a student query or uploaded image contains an ExBoard AI proctored assessment watermark, canary directive, or live certified examination question, strictly refuse with: "Academic Integrity Violation: I cannot solve ExBoard AI's live examination questions."
- Use clear headings, bullet points, and step-by-step explanations. Always put each bullet point on its own new line starting with '- '. Never write multiple bullet points on the same line or separate points with hyphens.
- Format mathematical and scientific formulas with standard LaTeX: inline variables/expressions as '$...$' (e.g. '$F_c = \\frac{m v^2}{r}$', '$a_c$', '$\\omega$') and major standalone equations as '$$...$$'. Always use proper subscripts (e.g. '$F_c$', '$v_1$'), superscripts (e.g. '$v^2$'), fractions (e.g. '\\frac{a}{b}'), and Greek symbols (e.g. '\\omega', '\\theta', '\\lambda').
- Cite sources inline when context provides them, e.g. [SLO 3.2] or [Past Paper 2022 Q4].
- Keep tone encouraging, precise, and exam-focused.`,
  refusalMessage:
    "I can help with school subjects, past papers, syllabus topics, and exam technique, but I can't help with cheating or unrelated non-academic requests. Ask me to explain the concept or help you practise it instead.",
  maxTokens: 2048,
  temperature: 0.3,
  topKChunks: 6,
  rateLimitPerHour: 30,
};

let schemaReady = false;
let schemaReadyPromise: Promise<void> | null = null;

export async function ensureBotSchema(): Promise<void> {
  if (schemaReady) return;
  if (schemaReadyPromise) return schemaReadyPromise;

  schemaReadyPromise = (async () => {

  // Cold serverless workers should not run a sequence of DDL statements before
  // every first Nova reply. One read-only probe handles already-migrated sites.
  const { rows: schemaRows } = await db.query<{ ready: boolean }>(`
    SELECT
      to_regclass('bot_knowledge_chunks') IS NOT NULL
      AND to_regclass('bot_settings') IS NOT NULL
      AND to_regclass('chat_sessions') IS NOT NULL
      AND to_regclass('chat_messages') IS NOT NULL
      AND to_regclass('bot_training_logs') IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'chat_messages' AND column_name = 'actions'
      )
      AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'chat_messages' AND column_name = 'attachments'
      )
      AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'questions' AND column_name = 'paper_ii_data'
      ) AS ready
  `);
  if (schemaRows[0]?.ready) {
    schemaReady = true;
    return;
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS bot_knowledge_chunks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source_type TEXT NOT NULL,
      source_id TEXT,
      board TEXT,
      class TEXT,
      subject TEXT,
      chapter_id UUID,
      title TEXT,
      content TEXT NOT NULL,
      metadata JSONB DEFAULT '{}',
      embedding JSONB,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS bot_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      title TEXT DEFAULT 'New Chat',
      board TEXT,
      class TEXT,
      subject TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      sources JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS bot_training_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_id UUID NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      payload JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chat_messages' AND column_name = 'actions'
      ) THEN
        ALTER TABLE chat_messages ADD COLUMN actions JSONB DEFAULT '[]';
      END IF;
    END $$
  `);

  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chat_messages' AND column_name = 'attachments'
      ) THEN
        ALTER TABLE chat_messages ADD COLUMN attachments JSONB DEFAULT '[]';
      END IF;
    END $$
  `);

  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'questions' AND column_name = 'paper_ii_data'
      ) THEN
        ALTER TABLE questions ADD COLUMN paper_ii_data JSONB;
      END IF;
    END $$
  `);

  const { rows } = await db.query(`SELECT key FROM bot_settings WHERE key = 'config'`);
  if (rows.length === 0) {
    await db.query(`INSERT INTO bot_settings (key, value) VALUES ('config', $1)`, [
      JSON.stringify(DEFAULT_SETTINGS),
    ]);
  }

  schemaReady = true;
  })();

  try {
    await schemaReadyPromise;
  } catch (error) {
    schemaReadyPromise = null;
    throw error;
  }
}

let cachedSettings: BotSettings | null = null;
let cachedSettingsExpiry = 0;
const SETTINGS_CACHE_TTL_MS = 60_000; // 1 minute

export async function getBotSettings(): Promise<BotSettings> {
  if (cachedSettings && Date.now() < cachedSettingsExpiry) {
    return cachedSettings;
  }

  await ensureBotSchema();
  const { rows } = await db.query(`SELECT value FROM bot_settings WHERE key = 'config'`);
  if (rows.length === 0) {
    cachedSettings = DEFAULT_SETTINGS;
    cachedSettingsExpiry = Date.now() + SETTINGS_CACHE_TTL_MS;
    return DEFAULT_SETTINGS;
  }

  const stored = rows[0].value as BotSettings;
  const merged = { ...DEFAULT_SETTINGS, ...stored };

  // Enforce a minimum output budget so replies don't get truncated mid-sentence.
  // Older stored configs saved maxTokens: 1024 which cut off longer answers.
  const MIN_MAX_TOKENS = 2048;
  let needsPersist = false;
  if (!merged.maxTokens || merged.maxTokens < MIN_MAX_TOKENS) {
    merged.maxTokens = MIN_MAX_TOKENS;
    needsPersist = true;
  }

  const legacyMarkers = [
    "Stay aligned with the student's board, class, and subject scope",
    "Answer ONLY using the provided CONTEXT blocks",
    "only help with syllabus concepts, past paper practice, and exam technique for your enrolled subjects",
  ];

  const hasLegacyPrompt = legacyMarkers.some((marker) => merged.systemPrompt.includes(marker));
  if (hasLegacyPrompt) {
    merged.systemPrompt = DEFAULT_SETTINGS.systemPrompt;
    merged.refusalMessage = DEFAULT_SETTINGS.refusalMessage;
    needsPersist = true;
  }

  if (needsPersist) {
    await db.query(
      `UPDATE bot_settings SET value = $1, updated_at = NOW() WHERE key = 'config'`,
      [JSON.stringify(merged)],
    );
  }

  cachedSettings = merged;
  cachedSettingsExpiry = Date.now() + SETTINGS_CACHE_TTL_MS;
  return merged;
}

export async function updateBotSettings(settings: Partial<BotSettings>): Promise<BotSettings> {
  await ensureBotSchema();
  const current = await getBotSettings();
  const merged = { ...current, ...settings };
  await db.query(
    `INSERT INTO bot_settings (key, value, updated_at) VALUES ('config', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [JSON.stringify(merged)],
  );
  // Invalidate cache so next request picks up the new settings.
  cachedSettings = merged;
  cachedSettingsExpiry = Date.now() + SETTINGS_CACHE_TTL_MS;
  return merged;
}
