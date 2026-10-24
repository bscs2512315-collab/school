import { db } from "@/lib/db";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import type { ChatAction, ChatSource } from "@/types/bot";
import { parseBotQuery, STRUCTURED_QUERY_TYPE, type ParsedBotQuery } from "@/lib/ai/bot-query-parser";

interface StructuredContextResult {
  context: string;
  sources: ChatSource[];
  directReply?: string;
  actions?: ChatAction[];
}

function formatOrdinal(value: number): string {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  if (value % 10 === 1) return `${value}st`;
  if (value % 10 === 2) return `${value}nd`;
  if (value % 10 === 3) return `${value}rd`;
  return `${value}th`;
}

function buildPracticeActions(params: {
  chapterIds: string[];
  chapterLabel: string;
  subject: string;
  classLevel: string;
  board: string;
  questionCount?: number;
  useSlos?: boolean;
}): ChatAction[] {
  return [
    {
      type: "generate_paper",
      label: "Practice Paper 1 (MCQs)",
      paperType: 1,
      subject: params.subject,
      classLevel: params.classLevel,
      board: params.board,
      chapterIds: params.chapterIds,
      chapterLabel: params.chapterLabel,
      questionCount: params.questionCount,
      useSlos: params.useSlos ?? true,
    },
    {
      type: "generate_paper",
      label: "Practice Paper 2 (CRQ/ERQ)",
      paperType: 2,
      subject: params.subject,
      classLevel: params.classLevel,
      board: params.board,
      chapterIds: params.chapterIds,
      chapterLabel: params.chapterLabel,
      questionCount: params.questionCount,
      useSlos: params.useSlos ?? true,
    },
  ];
}

/** Rebuild a create-paper follow-up message that re-parses cleanly. */
function buildCreatePaperFollowUpMessage(params: {
  paperType?: 1 | 2 | null;
  classLevel?: string | null;
  subject?: string | null;
  paperSource?: "slos" | "past_papers" | null;
  chapterNumber?: number | null;
  chapterNumbers?: number[] | null;
  topic?: string | null;
  questionCount?: number | null;
  practiceMode?: "myself" | "challenge" | null;
  challengeType?: "normal" | "lightning" | null;
  board?: string | null;
}): string {
  const parts: string[] = ["Generate"];
  if (params.paperType) {
    parts.push(`Paper ${params.paperType}`);
  } else {
    parts.push("paper");
  }
  if (params.practiceMode === "myself") {
    parts.push("for myself");
  } else if (params.practiceMode === "challenge") {
    parts.push("to challenge friends");
  }
  if (params.challengeType === "normal") {
    parts.push("in a Blitz Arena");
  } else if (params.challengeType === "lightning") {
    parts.push("in a Lightning Round");
  }
  if (params.classLevel) {
    parts.push(`for class ${params.classLevel}`);
  }
  if (params.subject) {
    parts.push(params.subject);
  }
  if (params.paperSource === "slos") {
    const isSindh =
      (params.board || "").toLowerCase().includes("sindh") ||
      (params.board || "").toLowerCase().includes("karachi");
    parts.push(isSindh ? "from syllabus" : "from SLOs");
  } else if (params.paperSource === "past_papers") {
    parts.push("from past papers");
  }
  if (params.chapterNumbers && params.chapterNumbers.length > 0) {
    parts.push(
      params.chapterNumbers.length === 1
        ? `chapter ${params.chapterNumbers[0]}`
        : `chapters ${params.chapterNumbers.join(", ")}`,
    );
  } else if (params.chapterNumber) {
    parts.push(`chapter ${params.chapterNumber}`);
  } else if (params.topic) {
    parts.push(`chapter ${params.topic}`);
  }
  if (params.questionCount) {
    parts.push(`${params.questionCount} Questions`);
  }
  return parts.join(" ");
}

async function fetchAvailableSubjects(
  board: string | null,
  classLevel: string | null,
): Promise<string[]> {
  const filters: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (board) {
    filters.push(`board = $${idx++}`);
    values.push(board);
  }
  if (classLevel) {
    filters.push(`class = $${idx++}`);
    values.push(classLevel);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const { rows } = await db.query(
    `SELECT DISTINCT subject FROM curriculums ${where} ORDER BY subject`,
    values,
  );

  return rows.map((row) => row.subject as string);
}

function buildSubjectPromptReply(params: {
  board: string | null;
  classLevel: string | null;
}): string {
  const scopeParts = [
    params.board ? `${params.board}` : null,
    params.classLevel ? `Class ${params.classLevel}` : null,
  ].filter(Boolean);

  const scopeLabel = scopeParts.length > 0 ? scopeParts.join(" · ") : "your enrolled board and class";

  return `I can list the full syllabus for **${scopeLabel}** — tap a subject below to view it.`;
}

function buildSubjectChips(
  subjects: string[],
  classLevel: string | null,
): ChatAction[] {
  return subjects.map((subject) => ({
    type: "subject_chip" as const,
    label: subject,
    message: classLevel
      ? `${subject} syllabus class ${classLevel}`
      : `${subject} syllabus`,
  }));
}

function buildScopeFilters(
  parsed: ParsedBotQuery,
  board: string | null,
  defaults: { classLevel: string | null },
): { sql: string; values: unknown[] } {
  const filters: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const classLevel = parsed.classLevel ?? defaults.classLevel;
  const subject = parsed.subject;
  const effectiveBoard = parsed.board ?? board;

  if (effectiveBoard) {
    filters.push(`c.board = $${idx++}`);
    values.push(effectiveBoard);
  }
  if (classLevel) {
    filters.push(`c.class = $${idx++}`);
    values.push(classLevel);
  }
  if (subject) {
    filters.push(`c.subject = $${idx++}`);
    values.push(subject);
  }

  return { sql: filters.length ? `WHERE ${filters.join(" AND ")}` : "", values };
}

async function fetchSyllabusContext(
  parsed: ParsedBotQuery,
  board: string | null,
  classLevel: string | null,
): Promise<StructuredContextResult> {
  const effectiveBoard = parsed.board ?? board;
  const effectiveClass = parsed.classLevel ?? classLevel;

  if (!parsed.subject) {
    const subjects = await fetchAvailableSubjects(effectiveBoard, effectiveClass);

    if (subjects.length === 0) {
      return {
        context:
          "DATABASE FACTS: No syllabus subjects found for the resolved board and class. Ask the student to confirm their board/class or contact admin.",
        sources: [],
        directReply: `I couldn't find any syllabus uploaded yet for ${effectiveBoard ?? "your board"}${effectiveClass ? ` Class ${effectiveClass}` : ""}. Please check with your admin or confirm your board and class in Settings.`,
      };
    }

    return {
      context: `DATABASE FACTS: Syllabus listing requested without a subject. Resolved scope: Board ${effectiveBoard ?? "unknown"}, Class ${effectiveClass ?? "unknown"}. Available subjects: ${subjects.join(", ")}. Do NOT dump all subjects — ask the student to pick one.`,
      sources: [],
      directReply: buildSubjectPromptReply({
        board: effectiveBoard,
        classLevel: effectiveClass,
      }),
      actions: buildSubjectChips(subjects, effectiveClass),
    };
  }

  const { sql: scopeSql, values } = buildScopeFilters(parsed, board, { classLevel });

  const { rows: curriculums } = await db.query(
    `SELECT c.id, c.class, c.board, c.subject,
            (SELECT COUNT(*)::int FROM chapters ch WHERE ch.curriculum_id = c.id) AS chapter_count
     FROM curriculums c
     ${scopeSql}
     ORDER BY c.subject
     LIMIT 1`,
    values,
  );

  if (curriculums.length === 0) {
    return {
      context:
        "DATABASE FACTS: No syllabus/curriculum found for the requested board, class, and subject. Tell the student which filters were used and suggest checking admin has uploaded syllabus.",
      sources: [],
      directReply: `I couldn't find a syllabus for **${parsed.subject}**${effectiveClass ? ` Class ${effectiveClass}` : ""}${effectiveBoard ? ` (${effectiveBoard})` : ""}. Please check the Syllabus section or confirm your board and class in Settings.`,
    };
  }

  const curriculum = curriculums[0];
  const syllabusPath = FRONTEND_ROUTES.STUDENT_CURRICULUM(curriculum.id);
  const scopeLabel = `${curriculum.board} Class ${curriculum.class} ${curriculum.subject}`;
  const isSindh =
    (curriculum.board || effectiveBoard || "")
      .toLowerCase()
      .includes("sindh") ||
    (curriculum.board || effectiveBoard || "")
      .toLowerCase()
      .includes("karachi");
  const sloOrUnit = isSindh ? "chapter breakdown" : "SLO breakdown";

  return {
    context: `DATABASE FACTS: Syllabus found for ${scopeLabel} (${curriculum.chapter_count} chapters). Provide a link to view — do NOT list chapters or ${isSindh ? "topics" : "SLOs"} in chat.`,
    sources: [
      {
        chunkId: curriculum.id,
        sourceType: "syllabus_slo",
        title: `${curriculum.subject} Syllabus`,
        label: `${curriculum.subject} — Full Syllabus`,
      },
    ],
    directReply: `Here is the **${scopeLabel}** syllabus with **${curriculum.chapter_count} learning units** and full ${sloOrUnit}.

[Click here to view syllabus](${syllabusPath})`,
  };
}

type ResolvedChapter = {
  id: string;
  chapter_name: string;
  chapter_number: number | null;
};

/**
 * Resolve syllabus chapters for a query.
 * Supports continuous AKUEB-style numbering (XI 1–14, XII 15+):
 * - Prefer exact chapter_number match
 * - If missing, treat "chapter N" as the Nth unit in that class syllabus
 *   (e.g. Class XII "chapter 1" → first XII chapter, often numbered 15)
 */
async function resolveChapters(
  parsed: ParsedBotQuery,
  board: string | null,
  classLevel: string | null,
  subject: string | null,
): Promise<ResolvedChapter[]> {
  const scopeFilters: string[] = [];
  const scopeValues: unknown[] = [];
  let idx = 1;

  if (board) {
    scopeFilters.push(`c.board = $${idx++}`);
    scopeValues.push(board);
  }
  if (classLevel) {
    scopeFilters.push(`c.class = $${idx++}`);
    scopeValues.push(classLevel);
  }
  if (subject) {
    scopeFilters.push(`c.subject = $${idx++}`);
    scopeValues.push(subject);
  }

  const scopeSql = scopeFilters.length
    ? ` AND ${scopeFilters.join(" AND ")}`
    : "";

  if (parsed.chapterNumbers && parsed.chapterNumbers.length > 0) {
    const exactValues = [...scopeValues, parsed.chapterNumbers];
    const { rows: exactRows } = await db.query<ResolvedChapter>(
      `SELECT ch.id, ch.chapter_name, ch.chapter_number
       FROM chapters ch
       JOIN curriculums c ON c.id = ch.curriculum_id
       WHERE ch.chapter_number = ANY($${idx}::int[])${scopeSql}
       ORDER BY ch.chapter_number`,
      exactValues,
    );

    if (exactRows.length > 0) return exactRows;

    // Ordinal fallback: "chapter 1, 2" of XII = 1st and 2nd chapters in XII syllabus order
    const { rows: orderedRows } = await db.query<ResolvedChapter>(
      `SELECT ch.id, ch.chapter_name, ch.chapter_number
       FROM chapters ch
       JOIN curriculums c ON c.id = ch.curriculum_id
       WHERE 1=1${scopeSql}
       ORDER BY ch.chapter_number NULLS LAST, ch.chapter_name`,
      scopeValues,
    );

    const matchedByOrdinal = parsed.chapterNumbers
      .map((num) => orderedRows[num - 1])
      .filter(Boolean);

    if (matchedByOrdinal.length > 0) return matchedByOrdinal;
  }

  if (parsed.chapterNumber) {
    const exactValues = [...scopeValues, parsed.chapterNumber];
    const { rows: exactRows } = await db.query<ResolvedChapter>(
      `SELECT ch.id, ch.chapter_name, ch.chapter_number
       FROM chapters ch
       JOIN curriculums c ON c.id = ch.curriculum_id
       WHERE ch.chapter_number = $${idx}${scopeSql}
       ORDER BY ch.chapter_number`,
      exactValues,
    );

    if (exactRows.length > 0) return exactRows;

    // Ordinal fallback: "chapter 1" of XII = 1st chapter in XII syllabus order
    const ordinal = parsed.chapterNumber;
    const { rows: orderedRows } = await db.query<ResolvedChapter>(
      `SELECT ch.id, ch.chapter_name, ch.chapter_number
       FROM chapters ch
       JOIN curriculums c ON c.id = ch.curriculum_id
       WHERE 1=1${scopeSql}
       ORDER BY ch.chapter_number NULLS LAST, ch.chapter_name
       OFFSET $${idx} LIMIT 1`,
      [...scopeValues, Math.max(ordinal - 1, 0)],
    );

    return orderedRows;
  }

  if (parsed.topic) {
    const topic = parsed.topic.trim();
    const { rows: likeRows } = await db.query<ResolvedChapter>(
      `SELECT ch.id, ch.chapter_name, ch.chapter_number
       FROM chapters ch
       JOIN curriculums c ON c.id = ch.curriculum_id
       WHERE LOWER(ch.chapter_name) LIKE LOWER($${idx})${scopeSql}
       ORDER BY ch.chapter_number NULLS LAST`,
      [...scopeValues, `%${topic}%`],
    );
    if (likeRows.length > 0) return likeRows;

    // Fuzzy: match chapters that contain all significant topic tokens
    // e.g. "Matrices" → "Matrices and Determinants"
    // Also normalize hyphens: "Biostatistics" ↔ "Bio-statistics"
    const normalize = (value: string) =>
      value.toLowerCase().replace(/[^a-z0-9]+/g, "");
    const topicNorm = normalize(topic);
    const tokens = topic
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 3);

    const stemToken = (w: string): string => {
      if (w.endsWith("ies") && w.length > 4) return w.slice(0, -3);
      if (w.endsWith("es") && w.length > 4) return w.slice(0, -2);
      if (w.endsWith("s") && w.length > 3 && !w.endsWith("ss")) return w.slice(0, -1);
      if (w.endsWith("ing") && w.length > 5) return w.slice(0, -3);
      return w;
    };

    const matchTopicToken = (topicToken: string, name: string, nameWords: string[]): boolean => {
      const t = topicToken.toLowerCase();
      const tStem = stemToken(t);
      if (name.includes(t) || name.includes(tStem)) return true;
      return nameWords.some((nw) => {
        const nwStem = stemToken(nw);
        return (
          nw === t ||
          nw.startsWith(t) ||
          t.startsWith(nw) ||
          nwStem === tStem ||
          nwStem.startsWith(tStem) ||
          tStem.startsWith(nwStem) ||
          (t.startsWith("matri") && nw.startsWith("matri"))
        );
      });
    };

    const { rows: scopedRows } = await db.query<ResolvedChapter>(
      `SELECT ch.id, ch.chapter_name, ch.chapter_number
       FROM chapters ch
       JOIN curriculums c ON c.id = ch.curriculum_id
       WHERE 1=1${scopeSql}
       ORDER BY ch.chapter_number NULLS LAST, ch.chapter_name`,
      scopeValues,
    );

    const scored = scopedRows
      .map((row) => {
        const name = (row.chapter_name || "").toLowerCase();
        const nameNorm = normalize(row.chapter_name || "");
        const nameWords = name.split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
        const compactHit =
          topicNorm.length >= 4 &&
          (nameNorm.includes(topicNorm) || topicNorm.includes(nameNorm));
        const hitCount = tokens.filter((t) => matchTopicToken(t, name, nameWords)).length;
        const allTokensHit = tokens.length > 0 && hitCount === tokens.length;
        const partialHitScore = tokens.length > 0 && hitCount > 0 ? (hitCount / tokens.length) * 50 : 0;
        return {
          row,
          score: compactHit ? 100 + topicNorm.length : allTokensHit ? 80 + hitCount : partialHitScore,
        };
      })
      .filter((x) => x.score >= 50)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const aLen = (a.row.chapter_name || "").length;
        const bLen = (b.row.chapter_name || "").length;
        return aLen - bLen;
      });

    return scored.map((x) => x.row);
  }

  return [];
}

async function fetchTutoringChapterContext(
  parsed: ParsedBotQuery,
  board: string | null,
  classLevel: string | null,
): Promise<StructuredContextResult | null> {
  const effectiveBoard = parsed.board ?? board;
  const effectiveClass = parsed.classLevel ?? classLevel;
  const chapters = await resolveChapters(
    parsed,
    effectiveBoard,
    effectiveClass,
    parsed.subject,
  );

  // A topic may be broader than a chapter title. In that case semantic retrieval
  // still gets a chance; do not turn the tutoring request into a syllabus menu.
  if (chapters.length === 0) return null;

  const selected = chapters.slice(0, 2);
  const { rows } = await db.query<{
    id: string;
    chapter_name: string;
    chapter_number: number | null;
    description: string | null;
    analyzed_content: unknown;
    board: string;
    class: string;
    subject: string;
  }>(
    `SELECT ch.id, ch.chapter_name, ch.chapter_number, ch.description,
            ch.analyzed_content, c.board, c.class, c.subject
     FROM chapters ch
     JOIN curriculums c ON c.id = ch.curriculum_id
     WHERE ch.id = ANY($1::uuid[])`,
    [selected.map((chapter) => chapter.id)],
  );

  if (rows.length === 0) return null;

  const facts = rows.map((row) => {
    const analyzed = row.analyzed_content
      ? JSON.stringify(row.analyzed_content).slice(0, 12000)
      : "No detailed SLO JSON is stored.";
    return [
      `${row.board} Class ${row.class} ${row.subject}`,
      `Chapter ${row.chapter_number ?? "?"}: ${row.chapter_name}`,
      row.description ? `Description: ${row.description}` : null,
      `SLO/content data: ${analyzed}`,
    ]
      .filter(Boolean)
      .join("\n");
  });
  const ordinalResolution =
    parsed.chapterNumber != null &&
    rows.some(
      (row) =>
        row.chapter_number != null &&
        Number(row.chapter_number) !== Number(parsed.chapterNumber),
    )
      ? ` The user said chapter ${parsed.chapterNumber}; this was resolved as the ${formatOrdinal(parsed.chapterNumber)} unit within Class ${effectiveClass}, whose official continued board number is ${rows[0].chapter_number}. Briefly clarify this mapping.`
      : "";

  return {
    context: `DATABASE FACTS: The student's request maps to the following syllabus chapter.${ordinalResolution} Use these facts to answer the actual tutoring request (notes, explanation, revision, examples, etc.). Do not respond with a syllabus menu.\n\n${facts.join("\n\n---\n\n")}`,
    sources: rows.map((row) => ({
      chunkId: row.id,
      sourceType: "syllabus_slo",
      title: `Chapter ${row.chapter_number ?? ""}: ${row.chapter_name}`.trim(),
      label: `${row.subject} — ${row.chapter_name}`,
    })),
  };
}

async function fetchPastPaperTopicContext(
  parsed: ParsedBotQuery,
  board: string | null,
  classLevel: string | null,
): Promise<StructuredContextResult> {
  const subject = parsed.subject;
  const effectiveBoard = parsed.board ?? board;
  const effectiveClass = parsed.classLevel ?? classLevel;
  const yearFrom = parsed.yearFrom ?? 2015;
  const yearTo = parsed.yearTo ?? new Date().getFullYear();

  if (!subject) {
    const subjects = await fetchAvailableSubjects(effectiveBoard, effectiveClass);
    const chapterPhrase = parsed.chapterNumber
      ? `chapter ${parsed.chapterNumber}`
      : parsed.topic
        ? `“${parsed.topic}”`
        : "that topic";
    return {
      context: `DATABASE FACTS: A past-paper lookup for ${chapterPhrase} is ambiguous without a subject. Available subjects: ${subjects.join(", ") || "none"}.`,
      sources: [],
      directReply: `Which **subject** should I search for ${chapterPhrase}?`,
      actions: buildSubjectChips(subjects, effectiveClass).map((action) => ({
        ...action,
        message: `${action.label} past paper questions from ${chapterPhrase}${effectiveClass ? ` class ${effectiveClass}` : ""}`,
      })),
    };
  }

  const chapterMatches = await resolveChapters(parsed, effectiveBoard, effectiveClass, subject);

  const filters: string[] = [
    "q.is_verified = true",
    "UPPER(pp.status) = 'COMPLETED'",
    `pp.year BETWEEN $1 AND $2`,
  ];
  const values: unknown[] = [yearFrom, yearTo];
  let idx = 3;

  if (effectiveBoard) {
    filters.push(`pp.board = $${idx++}`);
    values.push(effectiveBoard);
  }
  if (effectiveClass) {
    filters.push(`pp.class = $${idx++}`);
    values.push(effectiveClass);
  }
  if (subject) {
    filters.push(`pp.subject = $${idx++}`);
    values.push(subject);
  }

  if (chapterMatches.length > 0) {
    filters.push(`q.chapter_id = ANY($${idx}::uuid[])`);
    values.push(chapterMatches.map((c) => c.id));
    idx++;
  } else if (parsed.topic) {
    filters.push(`LOWER(q.chapter_name) LIKE LOWER($${idx})`);
    values.push(`%${parsed.topic}%`);
    idx++;
  }

  const { rows: questions } = await db.query(
    `SELECT q.id, q.question_number, q.question_part, q.question_text, q.question_type,
            q.chapter_name, q.marks, pp.year, pp.paper_number, pp.subject, pp.class, pp.board
     FROM questions q
     JOIN past_papers pp ON pp.id = q.past_paper_id
     WHERE ${filters.join(" AND ")}
     ORDER BY pp.year DESC, pp.paper_number, q.question_number, q.question_part NULLS FIRST
     LIMIT 80`,
    values,
  );

  const { rows: countRows } = await db.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE pp.paper_number = 1)::int AS paper1_count,
            COUNT(*) FILTER (WHERE pp.paper_number = 2)::int AS paper2_count
     FROM questions q
     JOIN past_papers pp ON pp.id = q.past_paper_id
     WHERE ${filters.join(" AND ")}`,
    values,
  );

  const total = countRows[0]?.total ?? 0;
  const paper1Count = countRows[0]?.paper1_count ?? 0;
  const paper2Count = countRows[0]?.paper2_count ?? 0;

  const chapterLabel =
    chapterMatches.length > 0
      ? chapterMatches
          .map((c) =>
            c.chapter_number
              ? `Chapter ${c.chapter_number}: ${c.chapter_name}`
              : c.chapter_name,
          )
          .join(", ")
      : parsed.chapterNumber
        ? `Chapter ${parsed.chapterNumber}`
        : parsed.topic ?? "selected topic";
  const remappedFromClassOrdinal =
    parsed.chapterNumber != null &&
    chapterMatches.length > 0 &&
    chapterMatches.some(
      (chapter) =>
        chapter.chapter_number != null &&
        Number(chapter.chapter_number) !== Number(parsed.chapterNumber),
    );
  const chapterMappingNote = remappedFromClassOrdinal
    ? `I treated “chapter ${parsed.chapterNumber}” as the ${formatOrdinal(parsed.chapterNumber!)} chapter taught in Class ${effectiveClass}; its official continued board number is **${chapterMatches[0].chapter_number}**.\n\n`
    : "";

  const scopeLabel = [
    effectiveBoard,
    effectiveClass ? `Class ${effectiveClass}` : null,
    subject,
  ]
    .filter(Boolean)
    .join(" · ");

  const practiceParams =
    chapterMatches.length > 0 && subject && effectiveClass && effectiveBoard
      ? {
          chapterIds: chapterMatches.map((c) => c.id),
          chapterLabel,
          subject,
          classLevel: effectiveClass,
          board: effectiveBoard,
        }
      : null;

  const actions = practiceParams ? buildPracticeActions(practiceParams) : undefined;

  if (total === 0) {
    const scopeParts = [
      effectiveBoard ? `Board: ${effectiveBoard}` : null,
      effectiveClass ? `Class: ${effectiveClass}` : null,
      subject ? `Subject: ${subject}` : null,
      chapterLabel ? `Chapter: ${chapterLabel}` : null,
      `Years: ${yearFrom}-${yearTo}`,
    ].filter(Boolean);

    const directReply = chapterMatches.length > 0
      ? `${chapterMappingNote}I searched verified past papers for **${chapterLabel}** (${scopeLabel}, ${yearFrom}–${yearTo}) and found **no matching questions** in our database yet.

This usually means those years haven't been uploaded or questions aren't mapped to this chapter.

${actions ? "You can still practice this chapter — tap **Paper 1** or **Paper 2** below to generate a practice paper from our question bank." : "Try checking the exact chapter name or a wider year range."}`
      : `I couldn't match a syllabus chapter for your query (${scopeParts.join(" · ")}).

Try asking with the chapter number or name, e.g. *"Chapter 2 Physics past paper questions 2020–2025"*.`;

    return {
      context: `DATABASE FACTS: No verified past paper questions found matching:\n${scopeParts.join("\n")}`,
      sources: [],
      directReply,
      actions,
    };
  }

  const byYear: Record<number, typeof questions> = {};
  for (const q of questions) {
    if (!byYear[q.year]) byYear[q.year] = [];
    byYear[q.year].push(q);
  }

  const yearSummary = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a)
    .map((year) => `${year}: ${byYear[year].length} question(s)`)
    .join(", ");

  const examples = questions
    .slice(0, 5)
    .map((question) => {
      const text = String(question.question_text ?? "").replace(/\s+/g, " ").trim();
      const excerpt = text.length > 180 ? `${text.slice(0, 177)}…` : text;
      return `- **${question.year} · Q${question.question_number}${question.question_part ? `(${question.question_part})` : ""}:** ${excerpt}`;
    })
    .join("\n");

  const directReply = `${chapterMappingNote}Found **${total} verified past paper question(s)** for **${chapterLabel}** (${scopeLabel}, ${yearFrom}–${yearTo}).

- **Paper 1 (MCQ):** ${paper1Count} question(s)
- **Paper 2 (CRQ/ERQ):** ${paper2Count} question(s)

**By year:** ${yearSummary}

${examples ? `**Recent examples:**\n${examples}\n\n` : ""}Tap **Paper 1** or **Paper 2** below to practice this chapter with a generated paper.`;

  const sources: ChatSource[] = questions.slice(0, 10).map((q) => ({
    chunkId: q.id,
    sourceType: q.question_type === "MCQ" ? "past_paper_mcq" : "past_paper_p2",
    title: `${q.year} Q${q.question_number}`,
    label: `${q.year} — ${q.chapter_name ?? "Past Paper"} — Q${q.question_number}`,
  }));

  return {
    context: `DATABASE FACTS: ${total} past paper questions found for ${chapterLabel}. Paper 1: ${paper1Count}, Paper 2: ${paper2Count}. Years: ${yearSummary}. Show only a few representative questions, never dump the whole bank.`,
    sources,
    directReply,
    actions,
  };
}

async function fetchCreatePaperContext(
  parsed: ParsedBotQuery,
  board: string | null,
  classLevel: string | null,
  isTeacher: boolean,
): Promise<StructuredContextResult> {
  const effectiveBoard = parsed.board ?? board;
  const effectiveClass = parsed.classLevel ?? classLevel;
  const isSindhBoard =
    (effectiveBoard || "")
      .toLowerCase()
      .includes("sindh") ||
    (effectiveBoard || "")
      .toLowerCase()
      .includes("karachi");
  const subject = parsed.subject;
  const continuePaper = (
    overrides: Partial<Parameters<typeof buildCreatePaperFollowUpMessage>[0]>,
  ) =>
    buildCreatePaperFollowUpMessage({
      paperType: parsed.paperType,
      classLevel: effectiveClass,
      subject,
      paperSource: parsed.paperSource,
      chapterNumber: parsed.chapterNumber,
      topic: parsed.topic,
      questionCount: parsed.questionCount,
      practiceMode: parsed.practiceMode,
      challengeType: parsed.challengeType,
      board: effectiveBoard,
      ...overrides,
    });

  if (!isTeacher && !parsed.practiceMode) {
    return {
      context: "DATABASE FACTS: A student wants to create a paper. Ask whether this is solo practice or a friend challenge before asking configuration details.",
      sources: [],
      directReply: "How would you like to use this paper?",
      actions: [
        {
          type: "practice_mode_chip",
          label: "Practice for Myself",
          message: continuePaper({ practiceMode: "myself" }),
        },
        {
          type: "practice_mode_chip",
          label: "Challenge Friends",
          message: continuePaper({ practiceMode: "challenge" }),
        },
      ],
    };
  }

  if (!isTeacher && parsed.practiceMode === "challenge") {
    if (!parsed.challengeType) {
      return {
        context: "DATABASE FACTS: The student chose Challenge Friends. Ask which existing Play & Prep challenge mode to use.",
        sources: [],
        directReply: "Which challenge mode do you want?",
        actions: [
          {
            type: "challenge_type_chip",
            label: "Blitz Arena",
            message: continuePaper({
              practiceMode: "challenge",
              challengeType: "normal",
            }),
          },
          {
            type: "challenge_type_chip",
            label: "Lightning Round",
            message: continuePaper({
              practiceMode: "challenge",
              challengeType: "lightning",
            }),
          },
        ],
      };
    }

    const query = new URLSearchParams({
      intent: "challenge",
      challengeType: parsed.challengeType,
    });
    if (subject) query.set("subject", subject);
    if (parsed.paperType) query.set("paperType", String(parsed.paperType));
    if (parsed.paperSource) {
      query.set("mode", parsed.paperSource === "slos" ? "slos" : "past_papers");
    }

    return {
      context: `DATABASE FACTS: Route the student to the existing Play & Prep ${parsed.challengeType} challenge builder.`,
      sources: [],
      directReply: `Your **${parsed.challengeType === "lightning" ? "Lightning Round" : "Blitz Arena"}** is ready to configure. Continue to Play & Prep to choose the subject/chapters and invite players.`,
      actions: [
        {
          type: "navigate",
          label: "Continue in Play & Prep",
          href: `${FRONTEND_ROUTES.STUDENT_GENERATE}?${query.toString()}`,
        },
      ],
    };
  }

  if (!effectiveClass) {
    const defaultTerm = isSindhBoard ? "syllabus" : "syllabus SLOs";
    return {
      context:
        "DATABASE FACTS: Student asked to create/generate a paper but class is missing. Ask for Class IX, X, XI, or XII.",
      sources: [],
      directReply:
        `I can create a practice paper from ${defaultTerm}. Which **class** should I use — **IX, X, XI, or XII**?`,
      actions: [
        {
          type: "class_chip",
          label: "Class IX",
          message: continuePaper({ classLevel: "IX" }),
        },
        {
          type: "class_chip",
          label: "Class X",
          message: continuePaper({ classLevel: "X" }),
        },
        {
          type: "class_chip",
          label: "Class XI",
          message: continuePaper({ classLevel: "XI" }),
        },
        {
          type: "class_chip",
          label: "Class XII",
          message: continuePaper({ classLevel: "XII" }),
        },
      ],
    };
  }

  if (!subject) {
    const subjects = await fetchAvailableSubjects(effectiveBoard, effectiveClass);
    if (subjects.length === 0) {
      return {
        context: `DATABASE FACTS: No syllabus subjects for board=${effectiveBoard}, class=${effectiveClass}.`,
        sources: [],
        directReply: `Sorry — we are still working on syllabi for Class ${effectiveClass}${effectiveBoard ? ` (${effectiveBoard})` : ""}. Other subjects will be available soon. Thank you!`,
      };
    }

    return {
      context: `DATABASE FACTS: Create-paper request missing subject. Available: ${subjects.join(", ")}.`,
      sources: [],
      directReply: `Great — Class **${effectiveClass}**. Which **subject** should I generate the paper for? (Only subjects with an uploaded syllabus are listed.)`,
      actions: subjects.map((s) => ({
        type: "subject_chip" as const,
        label: s,
        message: continuePaper({ classLevel: effectiveClass, subject: s }),
      })),
    };
  }

  const { rows: curriculums } = await db.query(
    `SELECT c.id, c.class, c.board, c.subject
     FROM curriculums c
     WHERE c.subject = $1
       AND c.class = $2
       ${effectiveBoard ? "AND c.board = $3" : ""}
     LIMIT 1`,
    effectiveBoard ? [subject, effectiveClass, effectiveBoard] : [subject, effectiveClass],
  );

  if (curriculums.length === 0) {
    const available = await fetchAvailableSubjects(effectiveBoard, effectiveClass);
    return {
      context: `DATABASE FACTS: No syllabus for ${subject} Class ${effectiveClass}. Available: ${available.join(", ") || "none"}.`,
      sources: [],
      directReply: `Sorry — we are working on **${subject}** for Class ${effectiveClass}, which will be available soon. Thank you!${
        available.length
          ? `\n\nAvailable now: **${available.join(", ")}**.`
          : ""
      }`,
      actions: available.map((s) => ({
        type: "subject_chip" as const,
        label: s,
        message: continuePaper({ classLevel: effectiveClass, subject: s }),
      })),
    };
  }

  const curriculum = curriculums[0];
  const resolvedBoard = curriculum.board as string;

  if (!parsed.paperType) {
    return {
      context: `DATABASE FACTS: Syllabus exists for ${resolvedBoard} Class ${effectiveClass} ${subject}. Ask Paper 1 vs Paper 2.`,
      sources: [],
      directReply: `Syllabus found for **${subject} Class ${effectiveClass}** (${resolvedBoard}). Do you want **Paper 1** (MCQs) or **Paper 2** (CRQ/ERQ)?`,
      actions: [
        {
          type: "paper_type_chip",
          label: "Paper 1 (MCQs)",
          message: continuePaper({
            paperType: 1,
            classLevel: effectiveClass,
            subject,
            paperSource: parsed.paperSource,
            chapterNumber: parsed.chapterNumber,
            topic: parsed.topic,
            questionCount: parsed.questionCount,
          }),
        },
        {
          type: "paper_type_chip",
          label: "Paper 2 (CRQ/ERQ)",
          message: continuePaper({
            paperType: 2,
            classLevel: effectiveClass,
            subject,
            paperSource: parsed.paperSource,
            chapterNumber: parsed.chapterNumber,
            topic: parsed.topic,
            questionCount: parsed.questionCount,
          }),
        },
      ],
    };
  }

  const isSindh =
    (resolvedBoard || effectiveBoard || "")
      .toLowerCase()
      .includes("sindh") ||
    (resolvedBoard || effectiveBoard || "")
      .toLowerCase()
      .includes("karachi");

  const sloTerm = isSindh ? "Syllabus" : "SLOs";
  const sloSourceTerm = isSindh ? "Syllabus" : "syllabus SLOs";
  const sloExplanation = isSindh
    ? "new questions aligned to syllabus topics"
    : "new questions aligned to learning outcomes";

  if (!parsed.paperSource) {
    return {
      context: `DATABASE FACTS: Paper ${parsed.paperType} for ${subject} Class ${effectiveClass}. Ask ${sloTerm} vs Past Papers source.`,
      sources: [],
      directReply: `Should I build **Paper ${parsed.paperType}** for **${subject} Class ${effectiveClass}** from **${sloSourceTerm}** (${sloExplanation}) or from **Past Papers** (real exam questions)?`,
      actions: [
        {
          type: "paper_source_chip",
          label: `From ${sloTerm}`,
          message: continuePaper({
            paperType: parsed.paperType,
            classLevel: effectiveClass,
            subject,
            paperSource: "slos",
            chapterNumber: parsed.chapterNumber,
            topic: parsed.topic,
            questionCount: parsed.questionCount,
            board: resolvedBoard,
          }),
        },
        {
          type: "paper_source_chip",
          label: "From Past Papers",
          message: continuePaper({
            paperType: parsed.paperType,
            classLevel: effectiveClass,
            subject,
            paperSource: "past_papers",
            chapterNumber: parsed.chapterNumber,
            topic: parsed.topic,
            questionCount: parsed.questionCount,
            board: resolvedBoard,
          }),
        },
      ],
    };
  }

  const useSlos = parsed.paperSource === "slos";
  const sourceLabel = useSlos ? sloSourceTerm : "Past Papers";

  const chapters = await resolveChapters(
    parsed,
    resolvedBoard,
    effectiveClass,
    subject,
  );

  const loadChapterOptions = async () => {
    const { rows: allChapters } = await db.query<{
      id: string;
      chapter_name: string;
      chapter_number: number | null;
    }>(
      `SELECT ch.id, ch.chapter_name, ch.chapter_number
       FROM chapters ch
       WHERE ch.curriculum_id = $1
       ORDER BY ch.chapter_number
       LIMIT 20`,
      [curriculum.id],
    );
    return allChapters;
  };

  const buildChapterChips = (
    chapterRows: Array<{
      id: string;
      chapter_name: string;
      chapter_number: number | null;
    }>,
  ): ChatAction[] =>
    chapterRows.slice(0, 16).map((c) => {
      const label = c.chapter_number
        ? `Ch ${c.chapter_number}: ${c.chapter_name}`
        : c.chapter_name;
      return {
        type: "chapter_chip" as const,
        label,
        chapterId: c.id,
        chapterNumber: c.chapter_number,
        chapterName: c.chapter_name,
        message: continuePaper({
          paperType: parsed.paperType,
          classLevel: effectiveClass,
          subject,
          paperSource: parsed.paperSource,
          chapterNumber: c.chapter_number,
          topic: c.chapter_number ? null : c.chapter_name,
          questionCount: parsed.questionCount,
          board: resolvedBoard,
        }),
      };
    });

  if (
    chapters.length === 0 &&
    !parsed.chapterNumber &&
    (!parsed.chapterNumbers || parsed.chapterNumbers.length === 0) &&
    !parsed.topic
  ) {
    const allChapters = await loadChapterOptions();

    if (allChapters.length === 0) {
      const unitsTerm = isSindh ? "chapters" : "chapters/SLOs";
      return {
        context: `DATABASE FACTS: Curriculum exists but has no ${unitsTerm} yet.`,
        sources: [],
        directReply: `I found **${subject} Class ${effectiveClass}**, but ${unitsTerm} are not uploaded yet. Please check back soon — thank you!`,
      };
    }

    return {
      context: `DATABASE FACTS: Ready to generate Paper ${parsed.paperType} from ${sourceLabel} for ${subject} Class ${effectiveClass}. Ask which chapter(s) if not specified.`,
      sources: [],
      directReply: `Ready to create **Paper ${parsed.paperType}** from **${sourceLabel}** for **${subject} Class ${effectiveClass}**. Which **chapter(s)** should I use? Select below or type e.g. **"chapters 1, 2, 3"**.`,
      actions: buildChapterChips(allChapters),
    };
  }

  if (chapters.length === 0) {
    const allChapters = await loadChapterOptions();
    const tried = parsed.topic
      ? `“${parsed.topic}”`
      : parsed.chapterNumbers && parsed.chapterNumbers.length > 1
        ? `chapters ${parsed.chapterNumbers.join(", ")}`
        : parsed.chapterNumber
          ? `chapter ${parsed.chapterNumber}`
          : "that chapter";

    return {
      context: `DATABASE FACTS: Could not match chapter for create-paper request. Tried ${tried}.`,
      sources: [],
      directReply: `I couldn't find ${tried} in the **${subject} Class ${effectiveClass}** syllabus. Tap a chapter below, or try **"chapter 1"** / the exact chapter name.`,
      actions: buildChapterChips(allChapters),
    };
  }

  const chapterLabel = chapters
    .map((c) =>
      c.chapter_number
        ? `Chapter ${c.chapter_number}: ${c.chapter_name}`
        : c.chapter_name,
    )
    .join(", ");

  const remappedFromOrdinal =
    Boolean(parsed.chapterNumber) &&
    chapters.some(
      (c) =>
        c.chapter_number != null &&
        Number(c.chapter_number) !== Number(parsed.chapterNumber),
    );

  const remapNote = remappedFromOrdinal
    ? `\n\n*(Class ${effectiveClass} continues board numbering — your **chapter ${parsed.chapterNumber}** maps to **${chapterLabel}**, the ${formatOrdinal(parsed.chapterNumber!)} unit in this class syllabus.)*`
    : "";

  const chapterSummary =
    chapters.length === 1
      ? `**${chapterLabel}**`
      : `**${chapters.length} chapters** (${chapters.map((c) => (c.chapter_number ? `Ch ${c.chapter_number}` : c.chapter_name)).join(", ")})`;

  const effectiveChapterNumbers = chapters
    .map((c) => c.chapter_number)
    .filter((n): n is number => n !== null);

  const followUpChapterNumber =
    effectiveChapterNumbers.length === 1
      ? effectiveChapterNumbers[0]
      : null;
  const followUpChapterNumbers =
    effectiveChapterNumbers.length > 1
      ? effectiveChapterNumbers
      : null;
  const followUpTopic =
    effectiveChapterNumbers.length === 0
      ? chapters[0]?.chapter_name ?? parsed.topic
      : null;

  if (useSlos && !parsed.questionCount) {
    const countOptions =
      parsed.paperType === 1 ? [10, 15, 20, 25] : [5, 8, 10, 12];

    return {
      context: `DATABASE FACTS: Paper ${parsed.paperType} from ${sourceLabel} for ${chapterLabel} (${subject}, Class ${effectiveClass}). Ask how many questions before generating.`,
      sources: chapters.slice(0, 3).map((c) => ({
        chunkId: c.id,
        sourceType: useSlos ? "syllabus_slo" : "past_paper_mcq",
        title: c.chapter_number ? `Chapter ${c.chapter_number}: ${c.chapter_name}` : c.chapter_name,
        label: `${subject} — ${c.chapter_name}`,
      })),
      directReply: `How many questions should I include in **Paper ${parsed.paperType}** for ${chapterSummary}? Tap a count below, or type e.g. **"15 questions"**.${remapNote}`,
      actions: countOptions.map((count) => ({
        type: "question_count_chip" as const,
        label: `${count} questions`,
        message: continuePaper({
          paperType: parsed.paperType,
          classLevel: effectiveClass,
          subject,
          paperSource: parsed.paperSource,
          chapterNumber: followUpChapterNumber,
          chapterNumbers: followUpChapterNumbers,
          topic: followUpTopic,
          questionCount: count,
          board: resolvedBoard,
        }),
      })),
    };
  }

  const questionCount = parsed.questionCount ?? 25;
  const actionLabel = useSlos
    ? `Start Paper ${parsed.paperType} · ${sloTerm} · ${chapters.length === 1 ? chapterLabel : `${chapters.length} Chapters (${chapters.map((c) => (c.chapter_number ? `Ch ${c.chapter_number}` : c.chapter_name)).join(", ")})`}`
    : `Start Paper ${parsed.paperType} · Past Papers · ${chapters.length === 1 ? chapterLabel : `${chapters.length} Chapters (${chapters.map((c) => (c.chapter_number ? `Ch ${c.chapter_number}` : c.chapter_name)).join(", ")})`}`;

  const action: ChatAction = {
    type: "generate_paper",
    label: actionLabel,
    paperType: parsed.paperType,
    subject,
    classLevel: effectiveClass,
    board: resolvedBoard,
    chapterIds: chapters.map((c) => c.id),
    chapterLabel,
    questionCount,
    useSlos,
  };

  const countSummary = useSlos ? ` (~${questionCount} questions)` : "";

  return {
    context: `DATABASE FACTS: Create Paper ${parsed.paperType} from ${sourceLabel} for ${chapterLabel} (${subject}, Class ${effectiveClass}, ${resolvedBoard}).${
      remappedFromOrdinal
        ? ` User said chapter ${parsed.chapterNumber}; resolved via class-syllabus ordinal to board chapter ${chapters[0].chapter_number}.`
        : ""
    } Question count: ${questionCount}. Prefer generate_paper action.`,
    sources: chapters.slice(0, 3).map((c) => ({
      chunkId: c.id,
      sourceType: useSlos ? "syllabus_slo" : "past_paper_mcq",
      title: c.chapter_number ? `Chapter ${c.chapter_number}: ${c.chapter_name}` : c.chapter_name,
      label: `${subject} — ${c.chapter_name}`,
    })),
    directReply: `I'll build **Paper ${parsed.paperType}** for **${subject} Class ${effectiveClass}** from **${sourceLabel}** of ${chapterSummary}${countSummary}.${remapNote}

Tap below to start — same exam UI as Past Papers Paper ${parsed.paperType}.`,
    actions: [action],
  };
}

export async function fetchStructuredContext(params: {
  message: string;
  board: string | null;
  classLevel: string | null;
  subjectHint?: string | null;
  isTeacher?: boolean;
}): Promise<StructuredContextResult | null> {
  const parsed = parseBotQuery(params.message, {
    classLevel: params.classLevel,
    board: params.board,
    subject: params.subjectHint,
  });

  const effectiveBoard = parsed.board ?? params.board;
  const effectiveClass = parsed.classLevel ?? params.classLevel;

  if (parsed.type === STRUCTURED_QUERY_TYPE.CREATE_PAPER) {
    return fetchCreatePaperContext(
      parsed,
      effectiveBoard,
      effectiveClass,
      params.isTeacher ?? false,
    );
  }

  if (parsed.type === STRUCTURED_QUERY_TYPE.SYLLABUS) {
    return fetchSyllabusContext(parsed, effectiveBoard, effectiveClass);
  }

  if (parsed.type === STRUCTURED_QUERY_TYPE.PAST_PAPER_TOPIC) {
    return fetchPastPaperTopicContext(parsed, effectiveBoard, effectiveClass);
  }

  // Tutoring requests must go to the tutor LLM, even when we infer a subject.
  const isConceptQuestion =
    /\b(what\s+is|what\s+are|what'?s|define|explain|describe|solve|calculate|derive|prove|work\s+out|show\s+how|notes?|summary|summari[sz]e|important|revise|revision|study|prepare|teach|understand|meaning\s+of|difference\s+between|how\s+does|why\s+(?:is|are|do|does))\b/i.test(
      params.message,
    );

  if (
    !isConceptQuestion &&
    parsed.subject &&
    /\b(syllabus|curriculum|slos?|learning\s+objectives?)\b/i.test(params.message) &&
    /\b(what|show|view|list|tell|give|check|get|details?|breakdown|outline)\b/i.test(params.message)
  ) {
    return fetchSyllabusContext(parsed, effectiveBoard, effectiveClass);
  }

  const mentionsPastPapers =
    /\b(past\s*papers?|mcqs?|crqs?|erqs?|exam questions?|came|appear|appeared)\b/i.test(
      params.message,
    );
  const wantsPastPaperLookup =
    parsed.yearFrom !== null ||
    (mentionsPastPapers &&
      (parsed.chapterNumber !== null || parsed.topic !== null || parsed.subject !== null));

  if (wantsPastPaperLookup) {
    return fetchPastPaperTopicContext(parsed, effectiveBoard, effectiveClass);
  }

  const wantsChapterTutoring =
    /\b(notes?|summary|summari[sz]e|key points?|important|revise|revision|teach|explain|understand|prepare)\b/i.test(
      params.message,
    ) && (parsed.chapterNumber !== null || parsed.topic !== null);

  if (wantsChapterTutoring) {
    return fetchTutoringChapterContext(parsed, effectiveBoard, effectiveClass);
  }

  return null;
}
