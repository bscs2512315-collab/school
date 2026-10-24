import { db } from "@/lib/db";
import { embedText, cosineSimilarity } from "@/lib/ai/embeddings";
import { parseBotQuery } from "@/lib/ai/bot-query-parser";
import { ensureBotSchema } from "@/lib/bot/schema";
import { BOT_SOURCE_TYPE, type BotKnowledgeChunk, type ChatSource } from "@/types/bot";
import { randomUUID } from "crypto";

interface ChunkRow {
  id: string;
  source_type: string;
  source_id: string | null;
  board: string | null;
  class: string | null;
  subject: string | null;
  chapter_id: string | null;
  title: string | null;
  content: string;
  metadata: Record<string, unknown>;
  embedding: number[] | null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function upsertChunk(params: {
  sourceType: BOT_SOURCE_TYPE;
  sourceId: string;
  board: string | null;
  classLevel: string | null;
  subject: string | null;
  chapterId?: string | null;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
}): Promise<void> {
  const { rows: existing } = await db.query(
    `SELECT id FROM bot_knowledge_chunks WHERE source_type = $1 AND source_id = $2`,
    [params.sourceType, params.sourceId],
  );

  if (existing.length > 0) {
    await db.query(
      `UPDATE bot_knowledge_chunks SET
        board = $1, class = $2, subject = $3, chapter_id = $4,
        title = $5, content = $6, metadata = $7, embedding = $8,
        is_active = true, updated_at = NOW()
       WHERE id = $9`,
      [
        params.board,
        params.classLevel,
        params.subject,
        params.chapterId ?? null,
        params.title,
        params.content,
        JSON.stringify(params.metadata ?? {}),
        params.embedding ? JSON.stringify(params.embedding) : null,
        existing[0].id,
      ],
    );
    return;
  }

  await db.query(
    `INSERT INTO bot_knowledge_chunks
      (id, source_type, source_id, board, class, subject, chapter_id, title, content, metadata, embedding)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      randomUUID(),
      params.sourceType,
      params.sourceId,
      params.board,
      params.classLevel,
      params.subject,
      params.chapterId ?? null,
      params.title,
      params.content,
      JSON.stringify(params.metadata ?? {}),
      params.embedding ? JSON.stringify(params.embedding) : null,
    ],
  );
}

export async function syncBotKnowledge(): Promise<{
  syllabusChunks: number;
  chapterOverviewChunks: number;
  mcqChunks: number;
  p2Chunks: number;
  crqChunks: number;
  total: number;
}> {
  await ensureBotSchema();

  let syllabusChunks = 0;
  let chapterOverviewChunks = 0;
  let mcqChunks = 0;
  let p2Chunks = 0;
  let crqChunks = 0;

  const { rows: chapters } = await db.query(`
    SELECT ch.id, ch.chapter_name, ch.chapter_number, ch.analyzed_content, ch.description,
           c.board, c.class, c.subject
    FROM chapters ch
    JOIN curriculums c ON c.id = ch.curriculum_id
  `);

  for (const chapter of chapters) {
    const analyzed = chapter.analyzed_content as {
      subtopics?: Array<{
        subtopicNumber?: string;
        subtopicName?: string;
        slos?: Array<{ sloNumber?: string; sloText?: string; cognitiveLevel?: string }>;
      }>;
    } | null;

    const overviewLines = [
      `Syllabus Chapter Overview`,
      `Chapter ${chapter.chapter_number ?? "?"}: ${chapter.chapter_name}`,
      chapter.description ? `Description: ${chapter.description}` : "",
      `Board: ${chapter.board}, Class: ${chapter.class}, Subject: ${chapter.subject}`,
    ];

    if (analyzed?.subtopics?.length) {
      for (const subtopic of analyzed.subtopics) {
        overviewLines.push(
          `Subtopic ${subtopic.subtopicNumber ?? ""}: ${subtopic.subtopicName ?? "Untitled"}`,
        );
        for (const slo of subtopic.slos ?? []) {
          if (slo.sloText) {
            overviewLines.push(`  SLO ${slo.sloNumber ?? ""}: ${slo.sloText}`);
          }
        }
      }
    }

    const overviewContent = overviewLines.filter(Boolean).join("\n");
    let overviewEmbedding: number[] | undefined;
    try {
      overviewEmbedding = await embedText(overviewContent);
      await sleep(200);
    } catch {
      overviewEmbedding = undefined;
    }

    await upsertChunk({
      sourceType: BOT_SOURCE_TYPE.SYLLABUS_SLO,
      sourceId: `${chapter.id}-overview`,
      board: chapter.board,
      classLevel: chapter.class,
      subject: chapter.subject,
      chapterId: chapter.id,
      title: `Chapter ${chapter.chapter_number ?? ""}: ${chapter.chapter_name}`,
      content: overviewContent,
      metadata: { chapterNumber: chapter.chapter_number, kind: "chapter_overview" },
      embedding: overviewEmbedding,
    });
    chapterOverviewChunks++;

    if (!analyzed?.subtopics) continue;

    for (const subtopic of analyzed.subtopics) {
      for (const slo of subtopic.slos ?? []) {
        if (!slo.sloText) continue;

        const content = [
          `Chapter ${chapter.chapter_number}: ${chapter.chapter_name}`,
          `Subtopic ${subtopic.subtopicNumber ?? ""}: ${subtopic.subtopicName ?? ""}`,
          `SLO ${slo.sloNumber ?? ""}: ${slo.sloText}`,
          slo.cognitiveLevel ? `Cognitive Level: ${slo.cognitiveLevel}` : "",
          `Board: ${chapter.board}, Class: ${chapter.class}, Subject: ${chapter.subject}`,
        ]
          .filter(Boolean)
          .join("\n");

        const sourceId = `${chapter.id}-${slo.sloNumber ?? slo.sloText.slice(0, 20)}`;
        let embedding: number[] | undefined;
        try {
          embedding = await embedText(content);
          await sleep(200);
        } catch {
          embedding = undefined;
        }

        await upsertChunk({
          sourceType: BOT_SOURCE_TYPE.SYLLABUS_SLO,
          sourceId,
          board: chapter.board,
          classLevel: chapter.class,
          subject: chapter.subject,
          chapterId: chapter.id,
          title: `SLO ${slo.sloNumber ?? ""} — ${chapter.chapter_name}`,
          content,
          metadata: { sloNumber: slo.sloNumber, chapterNumber: chapter.chapter_number },
          embedding,
        });
        syllabusChunks++;
      }
    }
  }

  const { rows: mcqQuestions } = await db.query(`
    SELECT q.id, q.question_number, q.question_text, q.mcq_data, q.chapter_name, q.chapter_id,
           pp.board, pp.class, pp.subject, pp.year
    FROM questions q
    JOIN past_papers pp ON pp.id = q.past_paper_id
    WHERE q.question_type = 'MCQ' AND q.is_verified = true
      AND UPPER(pp.status) = 'COMPLETED'
  `);

  for (const q of mcqQuestions) {
    const mcqData = q.mcq_data as { options?: Array<{ id: string; text: string }>; correctAnswer?: string } | null;
    const optionsText = (mcqData?.options ?? [])
      .map((o) => `${o.id}. ${o.text}`)
      .join("\n");

    const content = [
      `Past Paper MCQ (${q.year}) — Question ${q.question_number}`,
      q.question_text,
      optionsText,
      mcqData?.correctAnswer ? `Correct Answer: ${mcqData.correctAnswer}` : "",
      q.chapter_name ? `Chapter: ${q.chapter_name}` : "",
      `Board: ${q.board}, Class: ${q.class}, Subject: ${q.subject}`,
    ]
      .filter(Boolean)
      .join("\n");

    let embedding: number[] | undefined;
    try {
      embedding = await embedText(content);
      await sleep(200);
    } catch {
      embedding = undefined;
    }

    await upsertChunk({
      sourceType: BOT_SOURCE_TYPE.PAST_PAPER_MCQ,
      sourceId: q.id,
      board: q.board,
      classLevel: q.class,
      subject: q.subject,
      chapterId: q.chapter_id ?? null,
      title: `MCQ Q${q.question_number} (${q.year})`,
      content,
      metadata: { year: q.year, questionNumber: q.question_number, chapterName: q.chapter_name },
      embedding,
    });
    mcqChunks++;
  }

  const { rows: p2Questions } = await db.query(`
    SELECT q.id, q.question_number, q.question_part, q.question_text, q.question_type,
           q.chapter_name, q.chapter_id, q.marks, q.paper_ii_data,
           pp.board, pp.class, pp.subject, pp.year
    FROM questions q
    JOIN past_papers pp ON pp.id = q.past_paper_id
    WHERE pp.paper_number = 2 AND q.is_verified = true
      AND UPPER(pp.status) = 'COMPLETED'
  `);

  for (const q of p2Questions) {
    const paperII = q.paper_ii_data as {
      betterResponse?: string;
      weakerResponse?: string;
      botApproved?: boolean;
      markingNotes?: string;
    } | null;

    const hasExemplars = paperII?.betterResponse || paperII?.weakerResponse;

    const content = [
      `Past Paper II (${q.year}) — Question ${q.question_number}${q.question_part ? ` (${q.question_part})` : ""}`,
      `Type: ${q.question_type ?? "CRQ/ERQ"}, Marks: ${q.marks ?? "?"}`,
      q.question_text,
      q.chapter_name ? `Chapter: ${q.chapter_name}` : "",
      paperII?.betterResponse ? `Better Response:\n${paperII.betterResponse}` : "",
      paperII?.weakerResponse ? `Weaker Response:\n${paperII.weakerResponse}` : "",
      paperII?.markingNotes ? `Marking Notes:\n${paperII.markingNotes}` : "",
      `Board: ${q.board}, Class: ${q.class}, Subject: ${q.subject}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    let embedding: number[] | undefined;
    try {
      embedding = await embedText(content);
      await sleep(200);
    } catch {
      embedding = undefined;
    }

    await upsertChunk({
      sourceType: BOT_SOURCE_TYPE.PAST_PAPER_P2,
      sourceId: q.id,
      board: q.board,
      classLevel: q.class,
      subject: q.subject,
      chapterId: q.chapter_id ?? null,
      title: `Paper II Q${q.question_number} (${q.year})`,
      content,
      metadata: {
        year: q.year,
        questionNumber: q.question_number,
        chapterName: q.chapter_name,
        botApproved: paperII?.botApproved ?? Boolean(hasExemplars),
      },
      embedding,
    });
    p2Chunks++;
  }

  const { rows: crqQuestions } = await db.query(`
    SELECT q.id, q.question_number, q.question_part, q.question_text, q.question_type,
           q.chapter_name, q.chapter_id, q.marks,
           pp.board, pp.class, pp.subject, pp.year, pp.paper_number
    FROM questions q
    JOIN past_papers pp ON pp.id = q.past_paper_id
    WHERE q.question_type IN ('CRQ', 'ERQ') AND q.is_verified = true
      AND UPPER(pp.status) = 'COMPLETED'
  `);

  for (const q of crqQuestions) {
    const content = [
      `Past Paper ${q.paper_number} (${q.year}) — Question ${q.question_number}${q.question_part ? ` (${q.question_part})` : ""}`,
      `Type: ${q.question_type}, Marks: ${q.marks ?? "?"}`,
      q.question_text,
      q.chapter_name ? `Chapter: ${q.chapter_name}` : "",
      `Board: ${q.board}, Class: ${q.class}, Subject: ${q.subject}`,
    ]
      .filter(Boolean)
      .join("\n");

    let embedding: number[] | undefined;
    try {
      embedding = await embedText(content);
      await sleep(200);
    } catch {
      embedding = undefined;
    }

    await upsertChunk({
      sourceType: BOT_SOURCE_TYPE.PAST_PAPER_P2,
      sourceId: `crq-${q.id}`,
      board: q.board,
      classLevel: q.class,
      subject: q.subject,
      chapterId: q.chapter_id ?? null,
      title: `${q.question_type} Q${q.question_number} (${q.year})`,
      content,
      metadata: {
        year: q.year,
        questionNumber: q.question_number,
        chapterName: q.chapter_name,
        questionType: q.question_type,
      },
      embedding,
    });
    crqChunks++;
  }

  const total = syllabusChunks + chapterOverviewChunks + mcqChunks + p2Chunks + crqChunks;
  return { syllabusChunks, chapterOverviewChunks, mcqChunks, p2Chunks, crqChunks, total };
}

export async function getKnowledgeStats(): Promise<{
  total: number;
  byType: Record<string, number>;
  withEmbeddings: number;
}> {
  await ensureBotSchema();

  const { rows: totalRows } = await db.query(
    `SELECT COUNT(*)::int AS count FROM bot_knowledge_chunks WHERE is_active = true`,
  );
  const { rows: embedRows } = await db.query(
    `SELECT COUNT(*)::int AS count FROM bot_knowledge_chunks WHERE is_active = true AND embedding IS NOT NULL`,
  );
  const { rows: typeRows } = await db.query(
    `SELECT source_type, COUNT(*)::int AS count FROM bot_knowledge_chunks WHERE is_active = true GROUP BY source_type`,
  );

  const byType: Record<string, number> = {};
  for (const row of typeRows) {
    byType[row.source_type] = row.count;
  }

  return {
    total: totalRows[0]?.count ?? 0,
    withEmbeddings: embedRows[0]?.count ?? 0,
    byType,
  };
}

const QUERY_STOP_WORDS = new Set([
  "what", "which", "when", "where", "from", "with", "this", "that",
  "please", "could", "would", "should", "explain", "about", "tell",
  "give", "help", "answer", "question", "define", "meaning",
]);

function keywordScore(terms: string[], content: string): number {
  if (terms.length === 0) return 0;
  const lower = content.toLowerCase();
  return terms.filter((t) => lower.includes(t)).length / terms.length;
}

export async function retrieveKnowledge(params: {
  query: string;
  board?: string | null;
  classLevel?: string | null;
  subject?: string | null;
  topK?: number;
}): Promise<{ chunks: BotKnowledgeChunk[]; sources: ChatSource[] }> {
  const topK = params.topK ?? 6;
  const terms = params.query.toLowerCase().split(/[^\p{L}\p{N}]+/u)
    .filter((term) => term.length > 3 && !QUERY_STOP_WORDS.has(term));
  if (terms.length === 0) return { chunks: [], sources: [] };

  const filters: string[] = ["is_active = true"];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (params.board) {
    filters.push(`(board IS NULL OR board = $${paramIndex})`);
    values.push(params.board);
    paramIndex++;
  }
  if (params.classLevel) {
    filters.push(`(class IS NULL OR class = $${paramIndex})`);
    values.push(params.classLevel);
    paramIndex++;
  }
  if (params.subject) {
    filters.push(`(subject IS NULL OR subject = $${paramIndex})`);
    values.push(params.subject);
    paramIndex++;
  }

  // Build a SQL keyword relevance filter to avoid loading the entire table.
  // Match rows that contain at least one search term in their content.
  const keywordOrClauses = terms.map((term) => {
    values.push(`%${term}%`);
    return `LOWER(content) LIKE $${paramIndex++}`;
  });
  filters.push(`(${keywordOrClauses.join(" OR ")})`);

  // Fetch WITHOUT the heavy embedding column — only id, content, metadata.
  // Limit to a reasonable candidate set for in-memory scoring.
  const candidateLimit = Math.max(topK * 8, 50);
  type LightChunkRow = Omit<ChunkRow, "embedding">;
  const { rows } = await db.query<LightChunkRow>(
    `SELECT id, source_type, source_id, board, class, subject, chapter_id, title, content, metadata
     FROM bot_knowledge_chunks WHERE ${filters.join(" AND ")}
     LIMIT ${candidateLimit}`,
    values,
  );

  if (rows.length === 0) return { chunks: [], sources: [] };

  const parsed = parseBotQuery(params.query, { classLevel: params.classLevel ?? null });

  // Score candidates by keyword overlap + metadata boosts (no embeddings yet).
  const scored = rows.map((row) => {
    let score = keywordScore(terms, row.content);

    const year = row.metadata?.year as number | undefined;
    if (parsed.yearFrom && year) {
      const yearTo = parsed.yearTo ?? parsed.yearFrom;
      if (year >= parsed.yearFrom && year <= yearTo) {
        score += 0.5;
      }
    }

    if (parsed.topic && row.metadata?.chapterName) {
      const chapterName = String(row.metadata.chapterName).toLowerCase();
      if (chapterName.includes(parsed.topic.toLowerCase())) {
        score += 0.4;
      }
    }

    return { row, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const bestKeywordScore = scored[0]?.score ?? 0;

  // If keyword matches are weak, fall back to embedding similarity on the
  // top candidates only (much faster than loading all embeddings).
  if (bestKeywordScore < 0.75 && scored.length > 0) {
    try {
      const candidateIds = scored.slice(0, topK * 3).map((s) => s.row.id);
      const [queryEmbedding, embeddingRows] = await Promise.all([
        embedText(params.query),
        db.query<{ id: string; embedding: number[] | null }>(
          `SELECT id, embedding FROM bot_knowledge_chunks
           WHERE id = ANY($1::uuid[]) AND embedding IS NOT NULL`,
          [candidateIds],
        ),
      ]);

      if (queryEmbedding && embeddingRows.rows.length > 0) {
        const embeddingMap = new Map(
          embeddingRows.rows.map((r) => [r.id, r.embedding]),
        );
        for (const item of scored) {
          const embedding = embeddingMap.get(item.row.id);
          if (embedding && Array.isArray(embedding)) {
            item.score += cosineSimilarity(queryEmbedding, embedding) * 2;
          }
        }
        scored.sort((a, b) => b.score - a.score);
      }
    } catch {
      // Embedding lookup failed — continue with keyword-only scoring.
    }
  }

  const top = scored.slice(0, topK).filter((s) => s.score > 0.05);
  const fallback = top.length > 0 ? top : scored.slice(0, topK);

  const chunks: BotKnowledgeChunk[] = fallback.map(({ row }) => ({
    id: row.id,
    sourceType: row.source_type as BOT_SOURCE_TYPE,
    sourceId: row.source_id,
    board: row.board,
    class: row.class,
    subject: row.subject,
    chapterId: row.chapter_id,
    title: row.title,
    content: row.content,
    metadata: row.metadata ?? {},
  }));

  const sources: ChatSource[] = chunks.map((chunk) => ({
    chunkId: chunk.id,
    sourceType: chunk.sourceType,
    title: chunk.title ?? "Reference",
    label: chunk.title ?? chunk.sourceType,
  }));

  return { chunks, sources };
}

export async function reindexQuestion(questionId: string): Promise<void> {
  await ensureBotSchema();

  const { rows } = await db.query(
    `SELECT q.*, pp.board, pp.class, pp.subject, pp.year, pp.paper_number
     FROM questions q JOIN past_papers pp ON pp.id = q.past_paper_id WHERE q.id = $1`,
    [questionId],
  );

  if (rows.length === 0) return;
  const q = rows[0];

  if (q.question_type === "MCQ") {
    const mcqData = q.mcq_data as { options?: Array<{ id: string; text: string }>; correctAnswer?: string } | null;
    const content = [
      `Past Paper MCQ (${q.year}) — Question ${q.question_number}`,
      q.question_text,
      ...(mcqData?.options ?? []).map((o) => `${o.id}. ${o.text}`),
      mcqData?.correctAnswer ? `Correct Answer: ${mcqData.correctAnswer}` : "",
    ].join("\n");

    const embedding = await embedText(content);
    await upsertChunk({
      sourceType: BOT_SOURCE_TYPE.PAST_PAPER_MCQ,
      sourceId: q.id,
      board: q.board,
      classLevel: q.class,
      subject: q.subject,
      title: `MCQ Q${q.question_number}`,
      content,
      embedding,
    });
    return;
  }

  if (q.paper_number === 2) {
    const paperII = q.paper_ii_data as {
      betterResponse?: string;
      weakerResponse?: string;
      markingNotes?: string;
    } | null;

    const content = [
      `Past Paper II (${q.year}) — Question ${q.question_number}`,
      q.question_text,
      paperII?.betterResponse ? `Better Response:\n${paperII.betterResponse}` : "",
      paperII?.weakerResponse ? `Weaker Response:\n${paperII.weakerResponse}` : "",
      paperII?.markingNotes ? `Marking Notes:\n${paperII.markingNotes}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const embedding = await embedText(content);
    await upsertChunk({
      sourceType: BOT_SOURCE_TYPE.PAST_PAPER_P2,
      sourceId: q.id,
      board: q.board,
      classLevel: q.class,
      subject: q.subject,
      title: `Paper II Q${q.question_number}`,
      content,
      embedding,
    });
  }
}
