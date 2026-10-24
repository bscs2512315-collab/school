import { db } from "@/lib/db";
import { parsePaperVariant } from "@/lib/paper/variant-parser";
import { randomUUID } from "crypto";

export { parsePaperVariant };

/**
 * Deterministic hash for string seeds.
 */
function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export interface PaperRowLike {
  id: string;
  title: string;
  description?: string | null;
  paperType?: string | number;
  paper_type?: string | number;
  subject?: string;
  classLevel?: string;
  class_level?: string;
  board?: string;
  totalMarks?: number;
  total_marks?: number;
  totalQuestions?: number;
  total_questions?: number;
  dueDate?: string | null;
  due_date?: string | null;
  strictMode?: boolean | null;
  strict_mode?: boolean | null;
  allowResume?: boolean | null;
  allow_resume?: boolean | null;
  teacher_id?: string;
  classroom_id?: string | null;
  chapter_ids?: unknown;
  question_ids?: unknown;
  questions_snapshot?: unknown;
  is_remedial?: boolean | null;
  remedial_student_id?: string | null;
  createdAt?: string | Date;
  attemptCount?: number;
  hasApprovedAttempt?: boolean;
  isRemedial?: boolean;
  stepInCycle?: number;
  cycleNumber?: number;
  [key: string]: unknown;
}

/**
 * Normalizes a paper type into "1" or "2". The tier (Alpha/Beta/Gamma) and the
 * paper type are independent, so two variants can share the same title but
 * differ only by paper type. They must therefore live in separate groups.
 */
function paperTypeOf(paper: {
  paperType?: string | number | null;
  paper_type?: string | number | null;
}): "1" | "2" {
  const raw = paper.paperType ?? paper.paper_type ?? "";
  return String(raw).includes("2") ? "2" : "1";
}

interface ExamAttemptRow {
  id: string;
  teacher_paper_id: string;
  grading_status: string;
  answers_data: unknown;
  score: number | null;
  total_marks: number | null;
  manual_grader_id?: string | null;
  created_at: Date;
  questions_snapshot?: unknown;
  title?: string;
  is_remedial?: boolean;
  paper_type?: string | null;
}

/**
 * Determines whether an attempt counts towards progression in the variant cycle.
 * An attempt counts ONLY if:
 * 1. It is fully graded (`grading_status === 'graded'`), AND
 * 2. It has been manually approved / graded by the teacher (`manual_grader_id` is set), OR
 *    The student achieved a score strictly greater than 50% (score / total_marks > 0.5).
 *
 * If a student scored <= 50% without teacher approval, or the attempt is pending approval,
 * the attempt does NOT count and the student must repeat the same test/set upon re-attempting.
 */
export function isCountedAttempt(attempt: {
  grading_status?: string | null;
  manual_grader_id?: string | null;
  score?: number | null;
  total_marks?: number | null;
}): boolean {
  if (!attempt) return false;
  if (attempt.grading_status !== "graded") return false;

  // Teacher explicitly approved / hand-graded
  if (attempt.manual_grader_id && String(attempt.manual_grader_id).trim() !== "") {
    return true;
  }

  // Auto-approved / auto-graded: counts ONLY if score > 50%
  const score = Number(attempt.score) || 0;
  const totalMarks = Number(attempt.total_marks) || 0;
  if (totalMarks > 0) {
    return score / totalMarks > 0.5;
  }

  return false;
}

interface WeakConceptItem {
  conceptIndex: number;
  score: number;
  maxMarks: number;
  scoreRatio: number;
  attemptIndex: number;
  questionId: string;
}

function parseSnapshot(raw: unknown): Array<Record<string, unknown>> {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseAnswersRecord(raw: unknown): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, any>;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Identifies question indices/concepts where the student scored less than full marks
 * (incorrect or semi-correct) across the provided attempts.
 */
function findWeakConceptItems(
  attemptRows: Array<{
    answers_data: unknown;
    questions_snapshot?: unknown;
  }>,
): WeakConceptItem[] {
  const weakItems: WeakConceptItem[] = [];

  attemptRows.forEach((attempt, attemptIdx) => {
    const answers = parseAnswersRecord(attempt.answers_data);
    const snapshot = parseSnapshot(attempt.questions_snapshot);

    snapshot.forEach((q, conceptIndex) => {
      const qId = String(q.id);
      const ans = answers[qId];
      const maxMarks = Number(q.marks) || 1;

      let isWeak = false;
      let score = 0;

      if (!ans) {
        isWeak = true;
        score = 0;
      } else if (typeof ans === "object") {
        if (ans.correct === false) {
          isWeak = true;
          score = 0;
        } else if (ans.score !== undefined) {
          score = Number(ans.score) || 0;
          const totalQMarks = Number(ans.maxMarks) || maxMarks;
          if (score < totalQMarks) {
            isWeak = true;
          }
        } else if (ans.selectedAnswer !== undefined && q.correctAnswer !== undefined) {
          if (
            String(ans.selectedAnswer).trim().toUpperCase() !==
            String(q.correctAnswer).trim().toUpperCase()
          ) {
            isWeak = true;
            score = 0;
          }
        }
      }

      if (isWeak) {
        weakItems.push({
          conceptIndex,
          score,
          maxMarks,
          scoreRatio: maxMarks > 0 ? score / maxMarks : 0,
          attemptIndex: attemptIdx,
          questionId: qId,
        });
      }
    });
  });

  return weakItems;
}

/**
 * Builds a custom remedial questions list targeting weak areas,
 * drawing corresponding questions from unattempted/candidate sibling sets.
 */
function buildRemedialPaperQuestions(
  standardVariants: PaperRowLike[],
  usedVariantIdsInCycle: Set<string>,
  weakItems: WeakConceptItem[],
  targetCount: number,
): Array<Record<string, unknown>> {
  // Candidate sets to draw from: unattempted sets in this cycle (e.g. Sets B & D)
  let candidateVariants = standardVariants.filter(
    (v) => !usedVariantIdsInCycle.has(v.id),
  );
  if (candidateVariants.length === 0) {
    candidateVariants = [...standardVariants];
  }

  // Parse snapshots for all candidate variants
  const candidateSnapshots = candidateVariants.map((v) => ({
    variantId: v.id,
    questions: parseSnapshot(v.questions_snapshot),
  }));

  // Group weak items by conceptIndex and compute priority score
  const weakByConcept = new Map<
    number,
    { count: number; minScoreRatio: number; items: WeakConceptItem[] }
  >();
  for (const item of weakItems) {
    const existing = weakByConcept.get(item.conceptIndex) || {
      count: 0,
      minScoreRatio: 1,
      items: [],
    };
    existing.count += 1;
    existing.minScoreRatio = Math.min(existing.minScoreRatio, item.scoreRatio);
    existing.items.push(item);
    weakByConcept.set(item.conceptIndex, existing);
  }

  // Sort weak concept indices: Failed in both attempts first, then lowest scoreRatio
  const sortedWeakIndices = Array.from(weakByConcept.keys()).sort((a, b) => {
    const dataA = weakByConcept.get(a)!;
    const dataB = weakByConcept.get(b)!;
    if (dataA.count !== dataB.count) {
      return dataB.count - dataA.count; // 2 failures before 1 failure
    }
    return dataA.minScoreRatio - dataB.minScoreRatio; // lower score first
  });

  const selectedQuestions: Array<Record<string, unknown>> = [];
  const selectedConceptIndices = new Set<number>();

  // 1. Add questions for weak areas from candidate sets
  for (let i = 0; i < sortedWeakIndices.length; i++) {
    if (selectedQuestions.length >= targetCount) break;
    const conceptIdx = sortedWeakIndices[i];

    // Pick from candidate variants in round-robin fashion
    const candidateIndex = i % candidateSnapshots.length;
    const cand = candidateSnapshots[candidateIndex];
    const candQuestion = cand.questions[conceptIdx] || cand.questions[0];

    if (candQuestion) {
      selectedQuestions.push(candQuestion);
      selectedConceptIndices.add(conceptIdx);
    }
  }

  // 2. If we need more questions to reach targetCount (e.g. 15 questions),
  // fill remaining concept slots from candidate variants
  if (selectedQuestions.length < targetCount) {
    const maxConcepts = Math.max(
      targetCount,
      ...candidateSnapshots.map((c) => c.questions.length),
    );
    for (let cIdx = 0; cIdx < maxConcepts; cIdx++) {
      if (selectedQuestions.length >= targetCount) break;
      if (selectedConceptIndices.has(cIdx)) continue;

      const candidateIndex = selectedQuestions.length % candidateSnapshots.length;
      const cand = candidateSnapshots[candidateIndex];
      const candQuestion = cand.questions[cIdx];

      if (candQuestion) {
        selectedQuestions.push(candQuestion);
        selectedConceptIndices.add(cIdx);
      }
    }
  }

  // 3. Fallback padding if still under targetCount
  if (selectedQuestions.length < targetCount) {
    for (const cand of candidateSnapshots) {
      for (const q of cand.questions) {
        if (selectedQuestions.length >= targetCount) break;
        selectedQuestions.push(q);
      }
    }
  }

  // 4. Truncate to exact targetCount
  const finalQuestions = selectedQuestions.slice(0, targetCount);

  // 5. Clone each question with a unique ID and clean sequential questionNumber
  return finalQuestions.map((q, index) => ({
    ...q,
    id: randomUUID(),
    questionNumber: index + 1,
    marks: Number(q.marks) || 1,
  }));
}

/**
 * Gets or creates a Weak Areas Remedial Test for the student in this classroom and cycle.
 */
async function getOrCreateRemedialPaperForStudent<T extends PaperRowLike>(
  userId: string,
  classroomId: string,
  baseTitle: string,
  standardVariants: T[],
  countedAttempts: ExamAttemptRow[],
  cycleNumber: number,
  paperType?: "1" | "2",
): Promise<T> {
  // Check if an unsubmitted remedial paper already exists for this student & baseTitle
  const { rows: existingRemedial } = await db.query<T>(
    `SELECT tp.* FROM teacher_papers tp
     LEFT JOIN exam_attempts ea ON ea.teacher_paper_id = tp.id AND ea.user_id = $1
     WHERE tp.classroom_id = $2
       AND tp.is_remedial = true
       AND tp.remedial_student_id = $1
       AND ea.id IS NULL
     ORDER BY tp.created_at DESC
     LIMIT 1`,
    [userId, classroomId],
  );

  if (existingRemedial.length > 0) {
    const existing = existingRemedial[0];
    const { baseTitle: extBase } = parsePaperVariant(existing.title);
    const typeMatches = !paperType || paperTypeOf(existing) === paperType;
    if (typeMatches && extBase.toLowerCase() === baseTitle.toLowerCase()) {
      return existing;
    }
  }

  // Retrieve the 2 preceding counted attempts in this cycle
  const cycleAttempts = countedAttempts.slice(-2);
  const usedVariantIds = new Set(cycleAttempts.map((a) => a.teacher_paper_id));

  // Determine weak items
  const weakItems = findWeakConceptItems(cycleAttempts);

  // Ensure we have full details for standard variants directly from DB if needed
  let variantsToUse = standardVariants;
  if (!standardVariants[0]?.teacher_id || !standardVariants[0]?.questions_snapshot) {
    const { rows: fullVariants } = await db.query<T>(
      `SELECT * FROM teacher_papers
       WHERE classroom_id = $1 AND (is_remedial IS NULL OR is_remedial = false)
       ORDER BY created_at ASC`,
      [classroomId],
    );
    const matching = fullVariants.filter(
      (v) =>
        (!paperType || paperTypeOf(v) === paperType) &&
        parsePaperVariant(v.title).baseTitle.toLowerCase() === baseTitle.toLowerCase(),
    );
    if (matching.length > 0) variantsToUse = matching;
  }

  // Target question count matches standard variants (e.g. 15)
  const masterVariant = variantsToUse[0] || standardVariants[0];
  const masterSnapshot = parseSnapshot(masterVariant.questions_snapshot);
  const targetCount =
    Number(masterVariant.total_questions || masterVariant.totalQuestions) ||
    masterSnapshot.length ||
    15;

  const remedialQuestions = buildRemedialPaperQuestions(
    variantsToUse,
    usedVariantIds,
    weakItems,
    targetCount,
  );

  const totalMarks = remedialQuestions.reduce(
    (sum, q) => sum + (Number(q.marks) || 1),
    0,
  );
  const remedialTitle = `${baseTitle} (Weak Areas Practice)`;
  const remedialDescription = `Remedial practice test focused on weak areas from attempts ${countedAttempts.length - 1} & ${countedAttempts.length}`;

  const paperTypeStr = String(
    masterVariant.paper_type || masterVariant.paperType || "paper1",
  );
  const normalizedPaperType = paperTypeStr.includes("2") ? "paper2" : "paper1";

  const { rows: inserted } = await db.query<T>(
    `INSERT INTO teacher_papers
       (teacher_id, classroom_id, title, description, paper_type, subject, class_level, board,
        chapter_ids, question_ids, questions_snapshot, total_marks, total_questions, due_date,
        strict_mode, allow_resume, is_remedial, remedial_student_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,true,$17)
     RETURNING *`,
    [
      masterVariant.teacher_id,
      classroomId,
      remedialTitle,
      remedialDescription,
      normalizedPaperType,
      masterVariant.subject,
      masterVariant.class_level || masterVariant.classLevel,
      masterVariant.board,
      JSON.stringify(masterVariant.chapter_ids || []),
      JSON.stringify(remedialQuestions.map((q) => q.id)),
      JSON.stringify(remedialQuestions),
      totalMarks,
      remedialQuestions.length,
      masterVariant.due_date || masterVariant.dueDate || null,
      masterVariant.strict_mode !== null && masterVariant.strict_mode !== undefined
        ? Boolean(masterVariant.strict_mode)
        : true,
      Boolean(masterVariant.allow_resume || masterVariant.allowResume),
      userId,
    ],
  );

  return inserted[0];
}

/**
 * For a given student and classroom, selects the specific variant paper
 * for a group of multi-set papers with the 3-Attempt Adaptive Cycle:
 *
 * 1. Checks if student has an active in-progress attempt (teacher_paper_progress) -> retains that set.
 * 2. Checks if student has an attempt awaiting approval / pending -> retains that set until approved.
 * 3. Checks completed & approved attempts (grading_status = 'graded'):
 *    - Cycle Formula: stepInCycle = (approvedCount % 3) + 1
 *    - Step 1 (Attempts 1, 4, 7...): Standard Set (e.g. Set A)
 *    - Step 2 (Attempts 2, 5, 8...): Another Standard Set (e.g. Set C)
 *    - Step 3 (Attempts 3, 6, 9...): Weak Areas Remedial Test from alternate sets (e.g. Sets B & D)
 */
export async function getAssignedVariantForStudent<T extends PaperRowLike>(
  userId: string,
  classroomId: string,
  baseTitle: string,
  variants: T[],
  paperType?: "1" | "2",
): Promise<T> {
  if (!variants.length) {
    throw new Error("No variants provided");
  }

  // Separate standard sets from student-specific remedial tests
  const standardVariants = variants
    .filter((v) => !paperType || paperTypeOf(v) === paperType)
    .filter((v) => !v.is_remedial && !parsePaperVariant(v.title).isRemedial)
    .sort((a, b) => {
      const aSet = parsePaperVariant(a.title).setLetter || a.title;
      const bSet = parsePaperVariant(b.title).setLetter || b.title;
      return aSet.localeCompare(bSet);
    });

  const activeStandardVariants =
    standardVariants.length > 0 ? standardVariants : variants;
  const allVariantIds = variants.map((v) => v.id);

  try {
    // 1. Check if user is actively in the middle of attempting a specific set (in-progress draft)
    const { rows: progressRows } = await db.query(
      `SELECT teacher_paper_id FROM teacher_paper_progress
       WHERE user_id = $1 AND teacher_paper_id = ANY($2::uuid[]) AND status = 'in_progress'
       ORDER BY updated_at DESC
       LIMIT 1`,
      [userId, allVariantIds],
    );

    if (progressRows.length > 0) {
      const activeDraft = variants.find(
        (v) => v.id === progressRows[0].teacher_paper_id,
      );
      if (activeDraft) return activeDraft;
    }

    // 2. Query all completed attempts for this user on this test group
    const { rows: attemptRows } = await db.query<ExamAttemptRow>(
      `SELECT ea.id, ea.teacher_paper_id, ea.grading_status, ea.answers_data, ea.score,
              ea.total_marks, ea.manual_grader_id, ea.created_at, tp.questions_snapshot, tp.title,
              tp.is_remedial, tp.paper_type
       FROM exam_attempts ea
       JOIN teacher_papers tp ON tp.id = ea.teacher_paper_id
       WHERE ea.user_id = $1
         AND (tp.classroom_id = $2 OR ea.teacher_paper_id = ANY($3::uuid[]))
       ORDER BY ea.created_at ASC`,
      [userId, classroomId, allVariantIds],
    );

    // Filter attempts belonging to this baseTitle + paper type test group
    const groupAttempts = attemptRows.filter((a) => {
      const { baseTitle: attBase } = parsePaperVariant(a.title || "");
      if (attBase.toLowerCase() !== baseTitle.toLowerCase()) return false;
      if (paperType) {
        return paperTypeOf({ paper_type: a.paper_type }) === paperType;
      }
      return true;
    });

    // 3. If the latest attempt is not counted (e.g. pending teacher approval, or scored <= 50%
    // without teacher approval), the student MUST receive the exact same test/set to retry it!
    const latestAttempt = groupAttempts[groupAttempts.length - 1];
    if (latestAttempt && !isCountedAttempt(latestAttempt)) {
      let activeVariant = variants.find(
        (v) => v.id === latestAttempt.teacher_paper_id,
      );
      if (!activeVariant) {
        const { rows: directRows } = await db.query<T>(
          `SELECT * FROM teacher_papers WHERE id = $1`,
          [latestAttempt.teacher_paper_id],
        );
        if (directRows.length > 0) {
          activeVariant = directRows[0];
        }
      }
      if (activeVariant) return activeVariant;
    }

    // 4. Calculate counted/approved attempts (grading_status = 'graded' AND (manual_grader_id IS NOT NULL OR score > 50%))
    const countedAttempts = groupAttempts.filter(isCountedAttempt);
    const approvedCount = countedAttempts.length;
    const stepInCycle = (approvedCount % 3) + 1;
    const cycleNumber = Math.floor(approvedCount / 3) + 1;

    // Calculate initial assigned index for this student (deterministic round-robin)
    let memberIndex = -1;
    if (classroomId) {
      const { rows: memberRows } = await db.query(
        `SELECT student_id FROM classroom_members
         WHERE classroom_id = $1 AND status = 'accepted'
         ORDER BY created_at ASC, id ASC`,
        [classroomId],
      );
      memberIndex = memberRows.findIndex((m) => m.student_id === userId);
    }

    const titleOffset = hashSeed(baseTitle) % activeStandardVariants.length;
    const initialIndex =
      memberIndex >= 0
        ? (memberIndex + titleOffset) % activeStandardVariants.length
        : hashSeed(`${userId}:${classroomId || ""}:${baseTitle}`) %
          activeStandardVariants.length;

    // -------------------------------------------------------------
    // Case 1: First Attempt of Cycle (stepInCycle === 1)
    // -------------------------------------------------------------
    if (stepInCycle === 1) {
      if (cycleNumber === 1) {
        return activeStandardVariants[initialIndex];
      }
      // For later cycles (Attempt 4, 7, ...), pick next standard set in rotation
      const cycleOffset = (cycleNumber - 1) * 2;
      const nextIndex =
        (initialIndex + cycleOffset) % activeStandardVariants.length;
      return activeStandardVariants[nextIndex];
    }

    // -------------------------------------------------------------
    // Case 2: Second Attempt of Cycle (stepInCycle === 2)
    // -------------------------------------------------------------
    if (stepInCycle === 2) {
      // Find set used in step 1 of this cycle
      const prevAttempt = countedAttempts[countedAttempts.length - 1];
      const prevPaperId = prevAttempt?.teacher_paper_id;

      // Find next unattempted standard variant
      let chosenVariant: T | null = null;
      for (let step = 1; step <= activeStandardVariants.length; step++) {
        const candIndex = (initialIndex + step) % activeStandardVariants.length;
        const cand = activeStandardVariants[candIndex];
        if (cand.id !== prevPaperId) {
          chosenVariant = cand;
          break;
        }
      }
      return chosenVariant || activeStandardVariants[(initialIndex + 1) % activeStandardVariants.length];
    }

    // -------------------------------------------------------------
    // Case 3: Third Attempt of Cycle (stepInCycle === 3) -> Remedial Test
    // -------------------------------------------------------------
    const remedialPaper = await getOrCreateRemedialPaperForStudent(
      userId,
      classroomId,
      baseTitle,
      activeStandardVariants,
      countedAttempts,
      cycleNumber,
      paperType,
    );

    return remedialPaper;
  } catch (err) {
    console.error("Variant assignment error:", err);
    // Safe deterministic fallback
    const fallbackIndex =
      hashSeed(`${userId}:${baseTitle}`) % activeStandardVariants.length;
    return activeStandardVariants[fallbackIndex];
  }
}

/**
 * Consolidates a classroom's papers for a student.
 * Groups multi-set variants (e.g. Set A, B, C, D) into a single assigned test card.
 * Each student gets their assigned variant with the clean base title,
 * along with attempt metadata (attemptCount, hasApprovedAttempt, isRemedial).
 */
export async function consolidatePapersForStudent<T extends PaperRowLike>(
  userId: string,
  classroomId: string,
  papers: T[],
): Promise<T[]> {
  if (!papers.length) return [];

  // Group papers by baseTitle
  const groups = new Map<string, T[]>();
  for (const paper of papers) {
    const { baseTitle, setLetter, isRemedial } = parsePaperVariant(paper.title);
    // Remedial papers belonging to other students should not appear
    if (
      (paper.is_remedial || isRemedial) &&
      paper.remedial_student_id &&
      paper.remedial_student_id !== userId
    ) {
      continue;
    }
    const groupKey = setLetter || isRemedial || paper.is_remedial
      ? `${baseTitle}::p${paperTypeOf(paper)}`
      : `__single__${paper.id}`;
    const list = groups.get(groupKey) || [];
    list.push(paper);
    groups.set(groupKey, list);
  }

  const consolidated: T[] = [];

  for (const [groupKey, groupPapers] of groups.entries()) {
    if (groupKey.startsWith("__single__") && groupPapers.length === 1 && !groupPapers[0].is_remedial) {
      // Single standalone paper: Check if student has attempts for it
      const singlePaper = groupPapers[0];
      const { rows: attRows } = await db.query(
        `SELECT id, grading_status, score, total_marks, manual_grader_id, created_at
         FROM exam_attempts
         WHERE user_id = $1 AND teacher_paper_id = $2
         ORDER BY created_at ASC`,
        [userId, singlePaper.id],
      );
      const countedCount = attRows.filter(isCountedAttempt).length;
      const approvedAttempts = attRows.filter(isCountedAttempt);
      const latestApproved = approvedAttempts[approvedAttempts.length - 1];
      // Show marks from the latest graded attempt (auto or teacher-graded),
      // regardless of whether it passed, so students always see their result.
      const gradedAttempts = attRows.filter(
        (a) => a.grading_status === "graded" && a.score != null,
      );
      const latestGraded = gradedAttempts[gradedAttempts.length - 1];
      consolidated.push({
        ...singlePaper,
        attemptCount: countedCount,
        hasApprovedAttempt: attRows.length > 0,
        isRemedial: Boolean(singlePaper.is_remedial),
        lastScore: latestGraded?.score ?? latestApproved?.score ?? null,
        lastTotalMarks: latestGraded?.total_marks ?? latestApproved?.total_marks ?? null,
      });
    } else {
      // Multi-set test group or remedial paper group: resolve student's assigned variant
      const { baseTitle } = parsePaperVariant(groupPapers[0].title);
      const groupPaperType = paperTypeOf(groupPapers[0]);
      const assigned = await getAssignedVariantForStudent(
        userId,
        classroomId,
        baseTitle,
        groupPapers,
        groupPaperType,
      );

      const allIds = groupPapers.map((p) => p.id);
      if (assigned.id && !allIds.includes(assigned.id)) {
        allIds.push(assigned.id);
      }

      // Count attempts ONLY on this test group's own variants, otherwise every
      // card in the classroom inherits attempt state from unrelated tests.
      const { rows: attRows } = await db.query(
        `SELECT ea.id, ea.grading_status, ea.score, ea.total_marks, ea.manual_grader_id, ea.created_at
         FROM exam_attempts ea
         WHERE ea.user_id = $1 AND ea.teacher_paper_id = ANY($2::uuid[])
         ORDER BY ea.created_at ASC`,
        [userId, allIds],
      );

      const countedCount = attRows.filter(isCountedAttempt).length;
      const approvedAttempts = attRows.filter(isCountedAttempt);
      const latestApproved = approvedAttempts[approvedAttempts.length - 1];
      // Show marks from the latest graded attempt (auto or teacher-graded),
      // regardless of whether it passed, so students always see their result.
      const gradedAttempts = attRows.filter(
        (a) => a.grading_status === "graded" && a.score != null,
      );
      const latestGraded = gradedAttempts[gradedAttempts.length - 1];
      const isRemedial = Boolean(
        assigned.is_remedial || parsePaperVariant(assigned.title).isRemedial,
      );

      // Return assigned paper with clean baseTitle so student sees single test card
      consolidated.push({
        ...assigned,
        title: baseTitle,
        attemptCount: countedCount,
        hasApprovedAttempt: attRows.length > 0,
        isRemedial,
        stepInCycle: (countedCount % 3) + 1,
        cycleNumber: Math.floor(countedCount / 3) + 1,
        lastScore: latestGraded?.score ?? latestApproved?.score ?? null,
        lastTotalMarks: latestGraded?.total_marks ?? latestApproved?.total_marks ?? null,
      });
    }
  }

  return consolidated;
}

export async function resolveStudentAssignedPaper<
  T extends { id: string; title: string; classroom_id?: string | null; [key: string]: unknown }
>(
  userId: string,
  paper: T,
): Promise<{
  paper: T;
  baseTitle: string;
  isVariant: boolean;
  isRemedial: boolean;
}> {
  const { baseTitle, setLetter, isRemedial: parsedIsRemedial } = parsePaperVariant(
    paper.title,
  );
  if (!setLetter && !parsedIsRemedial && !paper.is_remedial) {
    return { paper, baseTitle: paper.title, isVariant: false, isRemedial: false };
  }

  if (!paper.classroom_id) {
    return {
      paper,
      baseTitle,
      isVariant: Boolean(setLetter),
      isRemedial: Boolean(parsedIsRemedial || paper.is_remedial),
    };
  }

  // Find all papers in the same classroom with matching base title & paper type
  const { rows: siblingRows } = await db.query<T>(
    `SELECT * FROM teacher_papers
     WHERE classroom_id = $1
     ORDER BY created_at ASC`,
    [paper.classroom_id],
  );

  const targetPaperType = paperTypeOf({
    paper_type: paper.paper_type as string | number | undefined,
    paperType: paper.paperType as string | number | undefined,
  });

  const matchingVariants = siblingRows.filter((row) => {
    const parsed = parsePaperVariant(row.title);
    if (parsed.baseTitle.toLowerCase() !== baseTitle.toLowerCase()) return false;
    return (
      paperTypeOf({
        paper_type: row.paper_type as string | number | undefined,
        paperType: row.paperType as string | number | undefined,
      }) === targetPaperType
    );
  });

  if (matchingVariants.length <= 1 && !paper.is_remedial) {
    return { paper, baseTitle: paper.title, isVariant: false, isRemedial: false };
  }

  const assigned = await getAssignedVariantForStudent(
    userId,
    paper.classroom_id,
    baseTitle,
    matchingVariants,
    targetPaperType,
  );

  const isRem = Boolean(
    assigned.is_remedial || parsePaperVariant(assigned.title).isRemedial,
  );

  return {
    paper: assigned,
    baseTitle,
    isVariant: true,
    isRemedial: isRem,
  };
}
