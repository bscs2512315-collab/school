import {
  generateGeminiContentWithRetry,
  getGeminiChatModelsToTry,
  streamGeminiContent,
} from "@/lib/ai/gemini";
import { fetchImageAsBase64 } from "@/lib/ai/vision-image";
import { fetchAttachmentForAi } from "@/lib/ai/attachment-loader";
import type { ChatMessageAttachment } from "@/lib/nova/chat-messages";
export type { ChatMessageAttachment };
import { quickIntentCheck, shouldBlockIntent } from "@/lib/ai/bot-guardrails";
import { retrieveKnowledge } from "@/lib/ai/bot-knowledge";
import { parseBotQuery, inferSubjectFromTopic } from "@/lib/ai/bot-query-parser";
import { fetchStructuredContext } from "@/lib/ai/bot-structured-data";
import {
  buildImagePaperWizard,
  isImagePaperIntent,
  parseImagePaperPrefs,
} from "@/lib/ai/bot-image-paper";
import { getBotSettings } from "@/lib/bot/schema";
import { db } from "@/lib/db";
import type { ChatAction, ChatSource } from "@/types/bot";
import { BOT_QUERY_INTENT } from "@/types/bot";
import { randomUUID } from "crypto";
import { UserRole } from "@/types/enums";
import { rateLimitDistributed } from "@/lib/security/rate-limit";

export class ChatSessionNotFoundError extends Error {
  constructor() { super("Chat session not found"); }
}

export class ChatImagesTooLargeError extends Error {
  constructor() { super("Keep all attached files under 19MB total"); }
}

const IMAGE_ONLY_MESSAGE = "Please help me understand this question from the image.";
const DOCUMENT_ONLY_MESSAGE = "Please help me understand and solve this document.";

const ATTACHMENT_INSTRUCTIONS = `ATTACHED FILES / DOCUMENTS / IMAGES (IMPORTANT — you CAN see and read all attached files):
The user attached one or more files (PDF document, study notes, past paper, question photo, diagram, or text file). This is a study/practice/coaching tool, NOT a live exam, so it is completely fine to fully solve it.
- Read the attached file(s) thoroughly. If it's a PDF, examine the text, headings, diagrams, questions, and formulas.
- If the user asks a question about the document (such as "summarize this chapter", "solve question 3", "explain section 2", "make a practice test from this PDF"), answer directly and accurately based on the content of the attached file.
- For MCQs: state the correct option and briefly explain why it is correct and why the others are wrong.
- For numericals: show the formula, substitution, working, units, and final answer.
- Explain the underlying concept so the student learns the method, at Pakistani board level (Class IX–XII).
- NEVER say you cannot see, open, or read attached files or PDFs. Only ask for a clearer file/photo if it is genuinely unreadable.`;

async function loadAndPrepareAttachments(userAttachments: ChatMessageAttachment[]): Promise<{
  visualParts: Array<{ inlineData: { mimeType: string; data: string } }>;
  attachedTextBlocks: string;
}> {
  if (userAttachments.length === 0) {
    return { visualParts: [], attachedTextBlocks: "" };
  }

  const loaded = await Promise.all(userAttachments.map((att) => fetchAttachmentForAi(att)));

  const totalBase64Bytes = loaded.reduce(
    (bytes, att) => bytes + (att.base64 ? att.base64.length : 0),
    0,
  );
  if (totalBase64Bytes > 19 * 1024 * 1024) {
    throw new ChatImagesTooLargeError();
  }

  const visualParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
  let attachedTextBlocks = "";

  for (const att of loaded) {
    if (att.base64) {
      visualParts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.base64,
        },
      });
    }
    if (att.textContent) {
      const label = att.type === "pdf" ? `PDF EXTRACTED TEXT (${att.fileName || "Document"})` : `ATTACHED FILE (${att.fileName || "File"})`;
      attachedTextBlocks += `\n\n--- ${label} ---\n${att.textContent.slice(0, 30000)}\n--- END ${label} ---`;
    }
  }

  return { visualParts, attachedTextBlocks };
}

async function insertUserMessage(
  sessionId: string,
  content: string,
  attachments: ChatMessageAttachment[] = [],
): Promise<void> {
  await db.query(
    `INSERT INTO chat_messages (id, session_id, role, content, attachments) VALUES ($1, $2, 'user', $3, $4)`,
    [randomUUID(), sessionId, content, JSON.stringify(attachments)],
  );
}

export function checkRateLimit(userId: string, limit: number): Promise<boolean> {
  return rateLimitDistributed(`chat:${userId}`, limit, 3600);
}

export async function getStudentScope(userId: string): Promise<{
  board: string | null;
  classLevel: string | null;
  subject: string | null;
  name: string;
  stream: string | null;
  role: string | null;
  subjects: string[];
  classes: string[];
  progressSummary: string;
}> {
  const { rows } = await db.query(
    `SELECT name, board, class, stream, role, subjects, classes, points, rank
     FROM users WHERE id = $1`,
    [userId],
  );

  if (rows.length === 0) {
    return {
      board: null,
      classLevel: null,
      subject: null,
      name: "Student",
      stream: null,
      role: null,
      subjects: [],
      classes: [],
      progressSummary: "No progress data is available.",
    };
  }

  let progressSummary = "No completed paper attempts yet.";
  if (rows[0].role === UserRole.STUDENT) {
    try {
      const { rows: progressRows } = await db.query<{
        subject: string;
        attempts: number;
        percentage: number | null;
      }>(
        `SELECT subject, COUNT(*)::int AS attempts,
                ROUND(100.0 * SUM(score) / NULLIF(SUM(total_marks), 0), 1)::float AS percentage
         FROM exam_attempts
         WHERE user_id = $1
           AND COALESCE(grading_status, 'graded') = 'graded'
         GROUP BY subject
         ORDER BY MAX(created_at) DESC
         LIMIT 6`,
        [userId],
      );
      if (progressRows.length > 0) {
        progressSummary = progressRows
          .map(
            (item) =>
              `${item.subject}: ${item.percentage ?? 0}% across ${item.attempts} attempt(s)`,
          )
          .join("; ");
      }
    } catch (error) {
      console.warn("Nova could not load learner progress context", error);
    }
  }

  return {
    name: rows[0].name ?? "Student",
    board: rows[0].board ?? null,
    classLevel: rows[0].class ?? null,
    subject: null,
    stream: rows[0].stream ?? null,
    role: rows[0].role ?? null,
    subjects: Array.isArray(rows[0].subjects) ? rows[0].subjects : [],
    classes: Array.isArray(rows[0].classes) ? rows[0].classes : [],
    progressSummary,
  };
}

function inferConversationSubject(
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = [],
): string | null {
  const current = inferSubjectFromTopic(message);
  if (current) return current;

  for (const item of [...history].reverse()) {
    const inferred = inferSubjectFromTopic(item.content);
    if (inferred) return inferred;
  }
  return null;
}

/** Prevent model-level branding/greetings from delaying the actual answer. */
export function cleanNovaReply(value: string): string {
  return value
    .trim()
    .replace(
      /^(?:hi|hello|hey)(?:\s+there)?[,!]?[\s]+(?:[\p{L}][\p{L}\s.'-]{0,40}?[,!]?\s+)?i(?:'m| am)\s+nova(?:\s*,?\s*(?:(?:your|the)\s+)?(?:exboard\s+)?ai\s+tutor)?[!.]*\s*/iu,
      "",
    )
    .replace(/^(?:hi|hello|hey)(?:\s+there)?[,!]?[\s]+/iu, "")
    .replace(
      /^i(?:'m| am)\s+nova(?:\s*,?\s*(?:(?:your|the)\s+)?(?:exboard\s+)?ai\s+tutor)?[!.]*\s*/iu,
      "",
    )
    .trim();
}

async function getLatestSessionImageUrl(sessionId: string, userId: string): Promise<string | null> {
  const { rows } = await db.query(
    `SELECT cm.attachments FROM chat_messages cm
     JOIN chat_sessions cs ON cm.session_id = cs.id
     WHERE cm.session_id = $1 AND cs.user_id = $2 AND cm.role = 'user'
     ORDER BY cm.created_at DESC
     LIMIT 30`,
    [sessionId, userId],
  );

  for (const row of rows) {
    const attachments = row.attachments;
    const list = Array.isArray(attachments)
      ? attachments
      : typeof attachments === "string"
        ? (JSON.parse(attachments) as unknown[])
        : [];
    for (const item of list) {
      if (
        item &&
        typeof item === "object" &&
        (item as { type?: string; url?: string }).type === "image" &&
        typeof (item as { url?: string }).url === "string"
      ) {
        return (item as { url: string }).url;
      }
    }
  }
  return null;
}

export async function generateNovaReply(params: {
  userId: string;
  message: string;
  sessionId?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  imageUrl?: string;
  imageUrls?: string[];
  imageMimeType?: string;
  attachments?: ChatMessageAttachment[];
  userRole?: string;
}): Promise<{
  reply: string;
  sources: ChatSource[];
  actions: ChatAction[];
  sessionId: string;
  blocked: boolean;
}> {
  // Parallelize session validation with settings + scope fetch to save round-trips.
  const sessionCheckPromise = params.sessionId
    ? db.query(
        "SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2",
        [params.sessionId, params.userId],
      )
    : null;

  const [settings, scope, sessionCheck] = await Promise.all([
    getBotSettings(),
    getStudentScope(params.userId),
    sessionCheckPromise,
  ]);

  if (sessionCheck && sessionCheck.rows.length === 0) {
    throw new ChatSessionNotFoundError();
  }

  const trimmedMessage = params.message.trim();
  const rawAttachments: ChatMessageAttachment[] = [
    ...(params.attachments ?? []),
    ...([...new Set([...(params.imageUrls ?? []), ...(params.imageUrl ? [params.imageUrl] : [])])].map((url) => ({
      type: "image" as const,
      url,
    }))),
  ];
  const seenUrls = new Set<string>();
  const userAttachments: ChatMessageAttachment[] = [];
  for (const att of rawAttachments) {
    if (att.url && !seenUrls.has(att.url)) {
      seenUrls.add(att.url);
      userAttachments.push(att);
    }
  }
  const imageUrls = userAttachments
    .filter((a) => a.type === "image" || a.mimeType?.startsWith("image/"))
    .map((a) => a.url);
  const hasAttachments = userAttachments.length > 0;
  const isDoc = userAttachments.some(
    (a) => a.type === "file" || a.fileName?.toLowerCase().endsWith(".pdf") || a.mimeType === "application/pdf",
  );
  const defaultPrompt = isDoc ? DOCUMENT_ONLY_MESSAGE : IMAGE_ONLY_MESSAGE;
  const effectiveMessage = trimmedMessage || (hasAttachments ? defaultPrompt : "");
  const isTeacher = params.userRole === UserRole.TEACHER;

  if (!effectiveMessage && !hasAttachments) {
    return {
      reply: "Please type a question or attach a file.",
      sources: [],
      actions: [],
      sessionId: params.sessionId ?? "",
      blocked: true,
    };
  }

  if (!(await checkRateLimit(params.userId, settings.rateLimitPerHour))) {
    return {
      reply: "You've reached the hourly message limit. Please try again later or review your syllabus notes in the meantime!",
      sources: [],
      actions: [],
      sessionId: params.sessionId ?? "",
      blocked: true,
    };
  }

  // The supplied session was owner-checked before any rate-limit or AI work.
  let sessionId = params.sessionId;
  if (!sessionId) {
    sessionId = randomUUID();
    await db.query(
      `INSERT INTO chat_sessions (id, user_id, title, board, class, subject) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        sessionId,
        params.userId,
        effectiveMessage.slice(0, 60) || (hasAttachments ? (isDoc ? "Uploaded document" : "Question image") : "New Chat"),
        scope.board,
        scope.classLevel,
        scope.subject,
      ],
    );
  }

  // Fast guardrail check (0ms overhead)
  const quickBlock = !hasAttachments ? quickIntentCheck(effectiveMessage) : null;
  if (quickBlock && shouldBlockIntent(quickBlock, 0.95)) {
    const refusal = cleanNovaReply(
      quickBlock === BOT_QUERY_INTENT.ACADEMIC_DISHONESTY
        ? "Academic Integrity Violation: I cannot solve ExBoard AI's live examination questions."
        : settings.refusalMessage,
    );

    await insertUserMessage(sessionId, effectiveMessage, []);
    await db.query(
      `INSERT INTO chat_messages (id, session_id, role, content, sources) VALUES ($1, $2, 'assistant', $3, '[]')`,
      [randomUUID(), sessionId, refusal],
    );
    await db.query(`UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1`, [sessionId]);

    return { reply: refusal, sources: [], actions: [], sessionId, blocked: true };
  }

  // Image → generate paper/quiz wizard (Paper 1/2 + question count)
  const imageForPaper =
    imageUrls[0] ??
    (isImagePaperIntent(effectiveMessage)
      ? await getLatestSessionImageUrl(sessionId, params.userId)
      : null);

  if (imageForPaper && isImagePaperIntent(effectiveMessage)) {
    await insertUserMessage(sessionId, effectiveMessage, userAttachments);
    const prefs = parseImagePaperPrefs(effectiveMessage);
    const wizard = buildImagePaperWizard({
      paperType: prefs.paperType,
      questionCount: prefs.questionCount,
      role: isTeacher ? "teacher" : "student",
      difficulty: prefs.difficulty,
      userPrompt: prefs.userPrompt,
      isExtractOnly: prefs.isExtractOnly,
    });
    const actions = wizard.actions.map((action) =>
      action.type === "generate_paper_from_image"
        ? {
            ...action,
            imageUrl: imageForPaper,
            difficulty: action.difficulty ?? prefs.difficulty ?? undefined,
            userPrompt: action.userPrompt ?? prefs.userPrompt ?? undefined,
          }
        : action,
    );

    await db.query(
      `INSERT INTO chat_messages (id, session_id, role, content, sources, actions) VALUES ($1, $2, 'assistant', $3, '[]', $4)`,
      [randomUUID(), sessionId, wizard.reply, JSON.stringify(actions)],
    );
    await db.query(`UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1`, [sessionId]);

    return {
      reply: wizard.reply,
      sources: [],
      actions,
      sessionId,
      blocked: false,
    };
  }

  // Greetings need no embedding request, knowledge scan, or model call.
  if (!hasAttachments && /^(?:hi|hello|hey|salam|assalam(?:u)?\s*alaikum)[!.,\s]*$/i.test(effectiveMessage)) {
    await insertUserMessage(sessionId, effectiveMessage, userAttachments);
    const reply = `Hi ${scope.name.split(" ")[0]}! What would you like to study today?`;
    await db.query(
      `INSERT INTO chat_messages (id, session_id, role, content, sources, actions) VALUES ($1, $2, 'assistant', $3, '[]', '[]')`,
      [randomUUID(), sessionId, reply],
    );
    await db.query(`UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1`, [sessionId]);
    return { reply, sources: [], actions: [], sessionId, blocked: false };
  }

  const { visualParts, attachedTextBlocks } = await loadAndPrepareAttachments(userAttachments);
  await insertUserMessage(sessionId, effectiveMessage, userAttachments);

  const contextualSubject = inferConversationSubject(
    effectiveMessage,
    params.history,
  );
  const parsed = parseBotQuery(effectiveMessage, {
    classLevel: scope.classLevel,
    board: scope.board,
    subject: contextualSubject,
  });
  const effectiveBoard = parsed.board ?? scope.board;
  const effectiveClass = parsed.classLevel ?? scope.classLevel;
  const inferredSubject = parsed.subject ?? inferSubjectFromTopic(effectiveMessage);

  // Fetch structured context and knowledge chunks concurrently for maximum speed
  const [structured, ragResult] = await Promise.all([
    fetchStructuredContext({
      message: effectiveMessage,
      board: scope.board,
      classLevel: scope.classLevel,
      subjectHint: contextualSubject,
      isTeacher,
    }),
    retrieveKnowledge({
      query: effectiveMessage,
      board: effectiveBoard,
      classLevel: effectiveClass,
      subject: parsed.subject ?? inferredSubject,
      topK: settings.topKChunks,
    }),
  ]);

  const hasImage = visualParts.length > 0;
  if (structured?.directReply && !hasImage) {
    const directSources = structured.sources ?? [];
    const directActions = structured.actions ?? [];
    await db.query(
      `INSERT INTO chat_messages (id, session_id, role, content, sources, actions) VALUES ($1, $2, 'assistant', $3, $4, $5)`,
      [
        randomUUID(),
        sessionId,
        structured.directReply,
        JSON.stringify(directSources),
        JSON.stringify(directActions),
      ],
    );
    await db.query(`UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1`, [sessionId]);
    return {
      reply: structured.directReply,
      sources: directSources,
      actions: directActions,
      sessionId,
      blocked: false,
    };
  }

  const { chunks, sources: ragSources } = ragResult;

  const structuredSourceIds = new Set((structured?.sources ?? []).map((s) => s.chunkId));
  const sources = [
    ...(structured?.sources ?? []),
    ...ragSources.filter((s) => !structuredSourceIds.has(s.chunkId)),
  ];

  const ragContextBlock =
    chunks.length > 0
      ? chunks.map((c, i) => `[CONTEXT ${i + 1}: ${c.title}]\n${c.content}`).join("\n\n---\n\n")
      : "No additional semantic context retrieved.";

  const databaseFactsBlock =
    structured?.context ??
    "No structured database lookup was needed for this query.";

  const historyBlock = (params.history ?? [])
    .slice(-6)
    .map((m) => `${m.role === "user" ? "Student" : "Nova"}: ${m.content}`)
    .join("\n");

  const prompt = `${settings.systemPrompt}

USER PROFILE (defaults for syllabus/past-paper lookups — NOT a teaching limit):
- Name: ${scope.name}
- Role: ${scope.role ?? params.userRole ?? "Unknown"}
- Board: ${effectiveBoard ?? "Not set"}
- Class: ${effectiveClass ?? "Not set"}
- Group/stream: ${scope.stream ?? "Not set"}
- Teacher subjects: ${scope.subjects.length ? scope.subjects.join(", ") : "Not applicable/not set"}
- Teacher classes: ${scope.classes.length ? scope.classes.join(", ") : "Not applicable/not set"}
- Subject detected in this question: ${inferredSubject ?? "Infer from the question"}
- Recent performance (use only when it genuinely helps personalize the answer): ${scope.progressSummary}

NON-NEGOTIABLE RESPONSE STYLE:
- Start with the answer. Never greet the user, introduce yourself, repeat your name, or say "I'm Nova".
- Answer the exact request before offering optional next steps.
- Be concise by default. Expand when the user asks for detail, notes, derivations, or step-by-step help.
- For bulleted lists, format each bullet point on its own new line starting with '- '. Never write multiple bullet points on the same line or separate points with hyphens.
- Format mathematical and scientific formulas with standard LaTeX: inline variables/expressions as '$...$' (e.g. '$F_c = \\frac{m v^2}{r}$', '$a_c$', '$\\omega$') and major standalone equations as '$$...$$'. Always use proper subscripts (e.g. '$F_c$', '$v_1$'), superscripts (e.g. '$v^2$'), fractions (e.g. '\\frac{a}{b}'), and Greek symbols (e.g. '\\omega', '\\theta', '\\lambda').
- Format practice papers with clear section headings, one MCQ choice per line, and blank lines between questions.
- Put programming solutions in fenced code blocks with the correct language tag, with the opening and closing fences on their own lines.
- For notes, provide useful notes in chat; never replace them with a syllabus list or navigation prompt.
- Use the profile as a smart default, not a restriction. If the user explicitly names another board, class, group, or subject, follow the explicit request.
- When asked what to revise or how the learner is doing, use recent performance to prioritize weaker subjects while clearly stating that the recommendation is based on recorded attempts.
- For teachers, respond as a practical teaching assistant: help plan explanations, questions, marking guidance, and classroom practice without talking to them as if they are a student.

DATABASE & CONTEXT RULES:
- When DATABASE FACTS are provided, they are authoritative for syllabus listings and past paper matches.
- NEVER say you lack access to syllabus or past papers when DATABASE FACTS contain the answer.
- For syllabus listing WITH a subject, give a short summary and link — do NOT paste all chapters in chat.
- If the student asks for syllabus by board only, use profile class: ${effectiveClass ?? "Not set"}.
- If the student asks for syllabus by class only, use profile board: ${effectiveBoard ?? "Not set"} and ask which subject if needed.
- For past paper topic/year questions, use DATABASE FACTS when available.
- If DATABASE FACTS show no records, say what was searched — then still help with the underlying concept if it is a general academic question.
- Answer across ALL subjects. Do NOT refuse because the topic is Chemistry, Biology, etc. if earlier chats were about another subject.

DATABASE FACTS:
${databaseFactsBlock}

RETRIEVED CONTEXT (semantic search — optional supplement):
${ragContextBlock}

${historyBlock ? `RECENT CONVERSATION:\n${historyBlock}\n` : ""}
${hasAttachments ? `${ATTACHMENT_INSTRUCTIONS}\n` : ""}
STUDENT QUESTION (text):
${effectiveMessage}
${hasAttachments ? "\nFiles/documents are attached with this message. Read all attachments carefully and answer the student's question using both the text and the attachments." : ""}
${attachedTextBlocks ? `\n\nATTACHED FILE CONTENT:\n${attachedTextBlocks}` : ""}

Respond as Nova. Be helpful, structured, and exam-focused.`;

  const chatGenerationConfig = {
    temperature: settings.temperature,
    maxOutputTokens: settings.maxTokens,
  };

  let result;
  const chatModelOptions = { modelsToTry: getGeminiChatModelsToTry() };
  if (visualParts.length > 0) {
    result = await generateGeminiContentWithRetry({
      contents: [
        {
          role: "user",
          parts: [
            ...visualParts,
            { text: prompt },
          ],
        },
      ],
      generationConfig: chatGenerationConfig,
    }, chatModelOptions);
  } else {
    result = await generateGeminiContentWithRetry({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: chatGenerationConfig,
    }, chatModelOptions);
  }

  const reply = cleanNovaReply(result.response.text()) || "Please try asking that in a little more detail.";

  const replyActions = structured?.actions ?? [];

  // Fire-and-forget: save the assistant message and update the session timestamp
  // in the background so the response returns to the user immediately.
  void Promise.all([
    db.query(
      `INSERT INTO chat_messages (id, session_id, role, content, sources, actions) VALUES ($1, $2, 'assistant', $3, $4, $5)`,
      [randomUUID(), sessionId, reply, JSON.stringify(sources), JSON.stringify(replyActions)],
    ),
    db.query(`UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1`, [sessionId]),
  ]).catch((err) => console.error("Failed to persist Nova reply:", err));

  return { reply, sources, actions: replyActions, sessionId, blocked: false };
}

/**
 * Streaming version of generateNovaReply.
 * Yields SSE-style JSON events: { type: "meta" | "delta" | "done", ... }
 */
export async function* generateNovaReplyStream(params: {
  userId: string;
  message: string;
  sessionId?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  imageUrl?: string;
  imageUrls?: string[];
  imageMimeType?: string;
  attachments?: ChatMessageAttachment[];
  userRole?: string;
}): AsyncGenerator<string, void, undefined> {
  // --- Pre-processing (same as non-streaming) ---
  const sessionCheckPromise = params.sessionId
    ? db.query(
        "SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2",
        [params.sessionId, params.userId],
      )
    : null;

  const [settings, scope, sessionCheck] = await Promise.all([
    getBotSettings(),
    getStudentScope(params.userId),
    sessionCheckPromise,
  ]);

  if (sessionCheck && sessionCheck.rows.length === 0) {
    throw new ChatSessionNotFoundError();
  }

  const trimmedMessage = params.message.trim();
  const rawAttachments: ChatMessageAttachment[] = [
    ...(params.attachments ?? []),
    ...([...new Set([...(params.imageUrls ?? []), ...(params.imageUrl ? [params.imageUrl] : [])])].map((url) => ({
      type: "image" as const,
      url,
    }))),
  ];
  const seenUrls = new Set<string>();
  const userAttachments: ChatMessageAttachment[] = [];
  for (const att of rawAttachments) {
    if (att.url && !seenUrls.has(att.url)) {
      seenUrls.add(att.url);
      userAttachments.push(att);
    }
  }
  const imageUrls = userAttachments
    .filter((a) => a.type === "image" || a.mimeType?.startsWith("image/"))
    .map((a) => a.url);
  const hasAttachments = userAttachments.length > 0;
  const isDoc = userAttachments.some(
    (a) => a.type === "file" || a.fileName?.toLowerCase().endsWith(".pdf") || a.mimeType === "application/pdf",
  );
  const defaultPrompt = isDoc ? DOCUMENT_ONLY_MESSAGE : IMAGE_ONLY_MESSAGE;
  const effectiveMessage = trimmedMessage || (hasAttachments ? defaultPrompt : "");
  const isTeacher = params.userRole === UserRole.TEACHER;

  if (!effectiveMessage && !hasAttachments) {
    yield JSON.stringify({ type: "meta", sessionId: params.sessionId ?? "", sources: [], actions: [], blocked: true });
    yield JSON.stringify({ type: "delta", text: "Please type a question or attach a file." });
    yield JSON.stringify({ type: "done" });
    return;
  }

  if (!(await checkRateLimit(params.userId, settings.rateLimitPerHour))) {
    yield JSON.stringify({ type: "meta", sessionId: params.sessionId ?? "", sources: [], actions: [], blocked: true });
    yield JSON.stringify({ type: "delta", text: "You've reached the hourly message limit. Please try again later or review your syllabus notes in the meantime!" });
    yield JSON.stringify({ type: "done" });
    return;
  }

  let sessionId = params.sessionId;
  if (!sessionId) {
    sessionId = randomUUID();
    await db.query(
      `INSERT INTO chat_sessions (id, user_id, title, board, class, subject) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        sessionId,
        params.userId,
        effectiveMessage.slice(0, 60) || (hasAttachments ? (isDoc ? "Uploaded document" : "Question image") : "New Chat"),
        scope.board,
        scope.classLevel,
        scope.subject,
      ],
    );
  }

  // Fast guardrail
  const quickBlock = !hasAttachments ? quickIntentCheck(effectiveMessage) : null;
  if (quickBlock && shouldBlockIntent(quickBlock, 0.95)) {
    const refusal = cleanNovaReply(
      quickBlock === BOT_QUERY_INTENT.ACADEMIC_DISHONESTY
        ? "Academic Integrity Violation: I cannot solve ExBoard AI's live examination questions."
        : settings.refusalMessage,
    );
    await insertUserMessage(sessionId, effectiveMessage, []);
    void db.query(
      `INSERT INTO chat_messages (id, session_id, role, content, sources) VALUES ($1, $2, 'assistant', $3, '[]')`,
      [randomUUID(), sessionId, refusal],
    ).catch(() => {});
    void db.query(`UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1`, [sessionId]).catch(() => {});

    yield JSON.stringify({ type: "meta", sessionId, sources: [], actions: [], blocked: true });
    yield JSON.stringify({ type: "delta", text: refusal });
    yield JSON.stringify({ type: "done" });
    return;
  }

  // Image paper wizard
  const imageForPaper =
    imageUrls[0] ??
    (isImagePaperIntent(effectiveMessage)
      ? await getLatestSessionImageUrl(sessionId, params.userId)
      : null);

  if (imageForPaper && isImagePaperIntent(effectiveMessage)) {
    await insertUserMessage(sessionId, effectiveMessage, userAttachments);
    const prefs = parseImagePaperPrefs(effectiveMessage);
    const wizard = buildImagePaperWizard({
      paperType: prefs.paperType,
      questionCount: prefs.questionCount,
      role: isTeacher ? "teacher" : "student",
      difficulty: prefs.difficulty,
      userPrompt: prefs.userPrompt,
      isExtractOnly: prefs.isExtractOnly,
    });
    const actions = wizard.actions.map((action) =>
      action.type === "generate_paper_from_image"
        ? {
            ...action,
            imageUrl: imageForPaper,
            difficulty: action.difficulty ?? prefs.difficulty ?? undefined,
            userPrompt: action.userPrompt ?? prefs.userPrompt ?? undefined,
          }
        : action,
    );
    void db.query(
      `INSERT INTO chat_messages (id, session_id, role, content, sources, actions) VALUES ($1, $2, 'assistant', $3, '[]', $4)`,
      [randomUUID(), sessionId, wizard.reply, JSON.stringify(actions)],
    ).catch(() => {});
    void db.query(`UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1`, [sessionId]).catch(() => {});

    yield JSON.stringify({ type: "meta", sessionId, sources: [], actions, blocked: false });
    yield JSON.stringify({ type: "delta", text: wizard.reply });
    yield JSON.stringify({ type: "done" });
    return;
  }

  // Greetings
  if (!hasAttachments && /^(?:hi|hello|hey|salam|assalam(?:u)?\s*alaikum)[!.,\s]*$/i.test(effectiveMessage)) {
    await insertUserMessage(sessionId, effectiveMessage, userAttachments);
    const reply = `Hi ${scope.name.split(" ")[0]}! What would you like to study today?`;
    void db.query(
      `INSERT INTO chat_messages (id, session_id, role, content, sources, actions) VALUES ($1, $2, 'assistant', $3, '[]', '[]')`,
      [randomUUID(), sessionId, reply],
    ).catch(() => {});
    void db.query(`UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1`, [sessionId]).catch(() => {});

    yield JSON.stringify({ type: "meta", sessionId, sources: [], actions: [], blocked: false });
    yield JSON.stringify({ type: "delta", text: reply });
    yield JSON.stringify({ type: "done" });
    return;
  }

  const { visualParts, attachedTextBlocks } = await loadAndPrepareAttachments(userAttachments);
  await insertUserMessage(sessionId, effectiveMessage, userAttachments);

  const contextualSubject = inferConversationSubject(effectiveMessage, params.history);
  const parsed = parseBotQuery(effectiveMessage, {
    classLevel: scope.classLevel,
    board: scope.board,
    subject: contextualSubject,
  });
  const effectiveBoard = parsed.board ?? scope.board;
  const effectiveClass = parsed.classLevel ?? scope.classLevel;
  const inferredSubject = parsed.subject ?? inferSubjectFromTopic(effectiveMessage);

  const [structured, ragResult] = await Promise.all([
    fetchStructuredContext({
      message: effectiveMessage,
      board: scope.board,
      classLevel: scope.classLevel,
      subjectHint: contextualSubject,
      isTeacher,
    }),
    retrieveKnowledge({
      query: effectiveMessage,
      board: effectiveBoard,
      classLevel: effectiveClass,
      subject: parsed.subject ?? inferredSubject,
      topK: settings.topKChunks,
    }),
  ]);

  const hasImage = visualParts.length > 0;
  if (structured?.directReply && !hasImage) {
    const directSources = structured.sources ?? [];
    const directActions = structured.actions ?? [];
    void db.query(
      `INSERT INTO chat_messages (id, session_id, role, content, sources, actions) VALUES ($1, $2, 'assistant', $3, $4, $5)`,
      [randomUUID(), sessionId, structured.directReply, JSON.stringify(directSources), JSON.stringify(directActions)],
    ).catch(() => {});
    void db.query(`UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1`, [sessionId]).catch(() => {});

    yield JSON.stringify({ type: "meta", sessionId, sources: directSources, actions: directActions, blocked: false });
    yield JSON.stringify({ type: "delta", text: structured.directReply });
    yield JSON.stringify({ type: "done" });
    return;
  }

  const { chunks, sources: ragSources } = ragResult;
  const structuredSourceIds = new Set((structured?.sources ?? []).map((s) => s.chunkId));
  const sources = [
    ...(structured?.sources ?? []),
    ...ragSources.filter((s) => !structuredSourceIds.has(s.chunkId)),
  ];

  const ragContextBlock =
    chunks.length > 0
      ? chunks.map((c, i) => `[CONTEXT ${i + 1}: ${c.title}]\n${c.content}`).join("\n\n---\n\n")
      : "No additional semantic context retrieved.";

  const databaseFactsBlock =
    structured?.context ??
    "No structured database lookup was needed for this query.";

  const historyBlock = (params.history ?? [])
    .slice(-6)
    .map((m) => `${m.role === "user" ? "Student" : "Nova"}: ${m.content}`)
    .join("\n");

  const prompt = `${settings.systemPrompt}

USER PROFILE (defaults for syllabus/past-paper lookups — NOT a teaching limit):
- Name: ${scope.name}
- Role: ${scope.role ?? params.userRole ?? "Unknown"}
- Board: ${effectiveBoard ?? "Not set"}
- Class: ${effectiveClass ?? "Not set"}
- Group/stream: ${scope.stream ?? "Not set"}
- Teacher subjects: ${scope.subjects.length ? scope.subjects.join(", ") : "Not applicable/not set"}
- Teacher classes: ${scope.classes.length ? scope.classes.join(", ") : "Not applicable/not set"}
- Subject detected in this question: ${inferredSubject ?? "Infer from the question"}
- Recent performance (use only when it genuinely helps personalize the answer): ${scope.progressSummary}

NON-NEGOTIABLE RESPONSE STYLE:
- Start with the answer. Never greet the user, introduce yourself, repeat your name, or say "I'm Nova".
- Answer the exact request before offering optional next steps.
- Be concise by default. Expand when the user asks for detail, notes, derivations, or step-by-step help.
- For bulleted lists, format each bullet point on its own new line starting with '- '. Never write multiple bullet points on the same line or separate points with hyphens.
- Format mathematical and scientific formulas with standard LaTeX: inline variables/expressions as '$...$' (e.g. '$F_c = \\frac{m v^2}{r}$', '$a_c$', '$\\omega$') and major standalone equations as '$$...$$'. Always use proper subscripts (e.g. '$F_c$', '$v_1$'), superscripts (e.g. '$v^2$'), fractions (e.g. '\\frac{a}{b}'), and Greek symbols (e.g. '\\omega', '\\theta', '\\lambda').
- Format practice papers with clear section headings, one MCQ choice per line, and blank lines between questions.
- Put programming solutions in fenced code blocks with the correct language tag, with the opening and closing fences on their own lines.
- For notes, provide useful notes in chat; never replace them with a syllabus list or navigation prompt.
- Use the profile as a smart default, not a restriction. If the user explicitly names another board, class, group, or subject, follow the explicit request.
- When asked what to revise or how the learner is doing, use recent performance to prioritize weaker subjects while clearly stating that the recommendation is based on recorded attempts.
- For teachers, respond as a practical teaching assistant: help plan explanations, questions, marking guidance, and classroom practice without talking to them as if they are a student.

DATABASE & CONTEXT RULES:
- When DATABASE FACTS are provided, they are authoritative for syllabus listings and past paper matches.
- NEVER say you lack access to syllabus or past papers when DATABASE FACTS contain the answer.
- For syllabus listing WITH a subject, give a short summary and link — do NOT paste all chapters in chat.
- If the student asks for syllabus by board only, use profile class: ${effectiveClass ?? "Not set"}.
- If the student asks for syllabus by class only, use profile board: ${effectiveBoard ?? "Not set"} and ask which subject if needed.
- For past paper topic/year questions, use DATABASE FACTS when available.
- If DATABASE FACTS show no records, say what was searched — then still help with the underlying concept if it is a general academic question.
- Answer across ALL subjects. Do NOT refuse because the topic is Chemistry, Biology, etc. if earlier chats were about another subject.

DATABASE FACTS:
${databaseFactsBlock}

RETRIEVED CONTEXT (semantic search — optional supplement):
${ragContextBlock}

${historyBlock ? `RECENT CONVERSATION:\n${historyBlock}\n` : ""}
${hasAttachments ? `${ATTACHMENT_INSTRUCTIONS}\n` : ""}
STUDENT QUESTION (text):
${effectiveMessage}
${hasAttachments ? "\nFiles/documents are attached with this message. Read all attachments carefully and answer the student's question using both the text and the attachments." : ""}
${attachedTextBlocks ? `\n\nATTACHED FILE CONTENT:\n${attachedTextBlocks}` : ""}

Respond as Nova. Be helpful, structured, and exam-focused.`;

  const chatGenerationConfig = {
    temperature: settings.temperature,
    maxOutputTokens: settings.maxTokens,
  };

  const replyActions = structured?.actions ?? [];

  // Emit metadata immediately so the frontend can show sessionId / sources / actions
  yield JSON.stringify({ type: "meta", sessionId, sources, actions: replyActions, blocked: false });

  // Stream the LLM response
  const contentRequest = visualParts.length > 0
    ? {
        contents: [{
          role: "user" as const,
          parts: [
            ...visualParts,
            { text: prompt },
          ],
        }],
        generationConfig: chatGenerationConfig,
      }
    : {
        contents: [{ role: "user" as const, parts: [{ text: prompt }] }],
        generationConfig: chatGenerationConfig,
      };

  let fullReply = "";
  for await (const chunk of streamGeminiContent(contentRequest, { modelsToTry: getGeminiChatModelsToTry() })) {
    fullReply += chunk;
    yield JSON.stringify({ type: "delta", text: chunk });
  }

  const cleanedReply = cleanNovaReply(fullReply) || "Please try asking that in a little more detail.";
  // A successful provider stream can contain only non-text chunks. The client
  // needs a delta even in that case; otherwise it displays a transport error.
  if (!fullReply.trim()) {
    yield JSON.stringify({ type: "delta", text: cleanedReply });
  }

  // Fire-and-forget persist
  void Promise.all([
    db.query(
      `INSERT INTO chat_messages (id, session_id, role, content, sources, actions) VALUES ($1, $2, 'assistant', $3, $4, $5)`,
      [randomUUID(), sessionId, cleanedReply, JSON.stringify(sources), JSON.stringify(replyActions)],
    ),
    db.query(`UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1`, [sessionId]),
  ]).catch((err) => console.error("Failed to persist Nova reply:", err));

  yield JSON.stringify({ type: "done" });
}

export async function getChatSessions(userId: string) {
  const { rows } = await db.query(
    `SELECT id, title, created_at, updated_at FROM chat_sessions
     WHERE user_id = $1 AND updated_at >= NOW() - INTERVAL '7 days'
     ORDER BY updated_at DESC LIMIT 50`,
    [userId],
  );
  return rows;
}

export async function getChatMessages(sessionId: string, userId: string) {
  const { rows: sessionRows } = await db.query(
    `SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2 AND updated_at >= NOW() - INTERVAL '7 days'`,
    [sessionId, userId],
  );
  if (sessionRows.length === 0) return null;

  const { rows } = await db.query(
    `SELECT id, role, content, sources, actions, attachments, created_at FROM chat_messages
     WHERE session_id = $1 ORDER BY created_at ASC`,
    [sessionId],
  );
  return rows;
}

export async function getLatestChatSession(userId: string) {
  const { rows } = await db.query(
    `SELECT id, title, created_at, updated_at FROM chat_sessions
     WHERE user_id = $1 AND updated_at >= NOW() - INTERVAL '7 days'
     ORDER BY updated_at DESC LIMIT 1`,
    [userId],
  );
  return rows[0] ?? null;
}
