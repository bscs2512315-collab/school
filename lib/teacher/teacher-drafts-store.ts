import type { GeneratedSloPaperQuestion } from "@/lib/paper/slo-paper-generator";
import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiPost } from "@/lib/api/api-client";
import toast from "react-hot-toast";

export interface DraftSetItem {
  setLetter: string; // "A", "B", "C", "D", "E"
  setName: string; // "Set A", "Set B", "Standard Test"
  title: string;
  description: string;
  status: "pending" | "generating" | "ready" | "failed";
  generatedPaperId?: string;
  questions?: GeneratedSloPaperQuestion[];
  totalQuestions?: number;
  totalMarks?: number;
  errorMessage?: string;
}

export interface TeacherPaperDraft {
  id: string;
  classroomId: string;
  chapterId: string;
  chapterNumber: number;
  chapterName: string;
  chapterIds?: string[];
  subject: string;
  classLevel: string;
  board: string;
  paperType: "1" | "2";
  difficulty?: "Alpha" | "Beta" | "Gamma";
  requestedSetsCount: number;
  questionCount: number;
  sloNumbers: string[];
  createdAt: string;
  updatedAt: string;
  status: "generating" | "ready" | "partial_failed" | "failed";
  sets: DraftSetItem[];
  mode?: "past_papers" | "slos" | "custom";
  prompt?: string;
  imageUrls?: string[];
  manualQuestions?: any[];
  isPublic?: boolean;
  dueDate?: string;
}

const SET_LETTERS = ["A", "B", "C", "D", "E"];

function getStorageKey(classroomId?: string): string {
  return classroomId
    ? `exboard_teacher_drafts_${classroomId}`
    : "exboard_teacher_drafts_all";
}

/**
 * Get all drafts for a classroom (or all classrooms if omitted).
 */
export function getStoredTeacherDrafts(classroomId?: string): TeacherPaperDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(classroomId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save drafts for a classroom and dispatch a custom window event for reactive UI updates.
 */
export function saveTeacherDrafts(
  drafts: TeacherPaperDraft[],
  classroomId?: string,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(classroomId), JSON.stringify(drafts));
    window.dispatchEvent(
      new CustomEvent("exboard_teacher_drafts_changed", {
        detail: { classroomId, drafts },
      }),
    );
  } catch (err) {
    console.error("Failed to save teacher drafts:", err);
  }
}

/**
 * Update a specific draft inside the classroom's drafts list.
 */
export function updateStoredDraft(
  draftId: string,
  classroomId: string,
  updater: (prevDraft: TeacherPaperDraft) => TeacherPaperDraft,
): TeacherPaperDraft | null {
  const drafts = getStoredTeacherDrafts(classroomId);
  const index = drafts.findIndex((d) => d.id === draftId);
  if (index === -1) return null;

  const updated = updater(drafts[index]);
  updated.updatedAt = new Date().toISOString();
  drafts[index] = updated;
  saveTeacherDrafts(drafts, classroomId);
  return updated;
}

/**
 * Delete a draft permanently.
 */
export function deleteStoredDraft(draftId: string, classroomId: string): void {
  const drafts = getStoredTeacherDrafts(classroomId);
  const filtered = drafts.filter((d) => d.id !== draftId);
  saveTeacherDrafts(filtered, classroomId);
}

export interface StartDraftGenerationParams {
  classroomId: string;
  chapterId?: string;
  chapterNumber?: number;
  chapterName?: string;
  chapterIds?: string[];
  subject: string;
  classLevel: string;
  board: string;
  paperType: "1" | "2";
  difficulty?: "Alpha" | "Beta" | "Gamma";
  questionCount: number;
  setsCount: number;
  sloNumbers?: string[];
  mode?: "past_papers" | "slos" | "custom";
  title?: string;
  description?: string;
  prompt?: string;
  imageUrls?: string[];
  manualQuestions?: any[];
  isPublic?: boolean;
  dueDate?: string;
}

function normalizeQuestionTextForDedup(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Execute set generation in background (non-blocking) with strict anti-duplication.
 */
async function generateDraftSet(
  draft: TeacherPaperDraft,
  setIndex: number,
): Promise<{
  generatedPaperId: string;
  questions: GeneratedSloPaperQuestion[];
  totalMarks: number;
  totalQuestions: number;
}> {
  const set = draft.sets[setIndex];
  const batchSize = draft.paperType === "2" ? 5 : 12;
  const batchCount = Math.ceil(draft.questionCount / batchSize);
  const qs: GeneratedSloPaperQuestion[] = [];
  let generatedPaperId = "";

  const effectiveChapterIds =
    draft.mode === "custom"
      ? []
      : Array.isArray(draft.chapterIds) && draft.chapterIds.length > 0
        ? draft.chapterIds
        : draft.chapterId
          ? [draft.chapterId]
          : [];

  // If manual questions are provided in custom mode, return them directly
  if (draft.mode === "custom" && Array.isArray(draft.manualQuestions) && draft.manualQuestions.length > 0) {
    const manualFormatted: GeneratedSloPaperQuestion[] = draft.manualQuestions.map((mq, idx) => ({
      id: mq.id || `mq_${Date.now()}_${idx}`,
      questionNumber: idx + 1,
      questionPart: null,
      questionText: mq.questionText,
      marks: Number(mq.marks) || (draft.paperType === "2" ? 4 : 1),
      questionType: draft.paperType === "2" ? "crq" : "mcq",
      chapterName: null,
      imageUrl: null,
      mcqOptions: mq.options || [],
      correctAnswer: mq.correctAnswer || "A",
    }));

    return {
      generatedPaperId: `manual_${Date.now()}`,
      questions: manualFormatted,
      totalMarks: manualFormatted.reduce((sum, q) => sum + (Number(q.marks) || 1), 0),
      totalQuestions: manualFormatted.length,
    };
  }

  const seenIds = new Set<string>();
  const seenTexts = new Set<string>();
  const maxAttempts = Math.max(batchCount + 2, 4);

  for (let attempt = 0; attempt < maxAttempts && qs.length < draft.questionCount; attempt++) {
    const needed = draft.questionCount - qs.length;
    const batchQuestionCount = Math.min(batchSize, needed);

    const genRes = await apiPost<{
      generatedPaperId: string;
      questions: GeneratedSloPaperQuestion[];
    }>(API_ENDPOINTS.TEACHER.PAPERS, {
      action: "generate",
      classroomId: draft.classroomId,
      classroomIds: [draft.classroomId],
      subject: draft.subject,
      classLevel: draft.classLevel,
      board: draft.board,
      paperType: draft.paperType,
      chapterIds: effectiveChapterIds,
      questionCount: batchQuestionCount,
      sloNumbers: Array.isArray(draft.sloNumbers) && draft.sloNumbers.length > 0 ? draft.sloNumbers : undefined,
      difficulty: draft.difficulty,
      mode: draft.mode || "slos",
      title: set.title,
      description: set.description,
      prompt: draft.prompt,
      imageUrls: draft.imageUrls,
      isPublic: draft.isPublic,
      excludeQuestionIds: Array.from(seenIds),
      excludeQuestionTexts: qs.map((q) => q.questionText).slice(-20),
    });

    if (!genRes.success || !genRes.data) {
      if (qs.length > 0) break;
      throw new Error(
        genRes.message || `Failed to generate ${set.setName} (batch ${attempt + 1})`,
      );
    }

    const batchQuestions = Array.isArray(genRes.data.questions)
      ? genRes.data.questions
      : [];
    if (batchQuestions.length === 0) {
      if (qs.length > 0) break;
      throw new Error(
        `No questions returned for ${set.setName} (batch ${attempt + 1})`,
      );
    }

    generatedPaperId ||= genRes.data.generatedPaperId;

    let addedCount = 0;
    for (const q of batchQuestions) {
      if (qs.length >= draft.questionCount) break;
      const normalized = normalizeQuestionTextForDedup(q.questionText);

      // Skip duplicate question ID or duplicate question text
      if (q.id && seenIds.has(q.id)) continue;
      if (normalized && seenTexts.has(normalized)) continue;

      if (q.id) seenIds.add(q.id);
      if (normalized) seenTexts.add(normalized);

      qs.push({
        ...q,
        questionNumber: qs.length + 1,
      });
      addedCount++;
    }

    // If all questions returned in this batch were duplicates, stop if we reached max batches
    if (addedCount === 0 && attempt >= batchCount) {
      break;
    }
  }

  const totalMarks = qs.reduce(
    (sum, q) => sum + (Number(q.marks) || (draft.paperType === "2" ? 4 : 1)),
    0,
  );

  return {
    generatedPaperId,
    questions: qs,
    totalMarks,
    totalQuestions: qs.length,
  };
}

/**
 * Start background generation for a new draft with multiple variant sets.
 */
export function startTeacherDraftGeneration(
  params: StartDraftGenerationParams,
): TeacherPaperDraft {
  const draftId = `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const setsCount = Math.max(1, params.setsCount || 1);
  const sets: DraftSetItem[] = [];

  const baseTitle = params.title?.trim()
    ? params.title.trim()
    : params.chapterNumber && params.chapterName
      ? `Chapter ${params.chapterNumber}: ${params.chapterName}${params.difficulty ? ` (${params.difficulty})` : ""}`
      : `${params.subject} Practice Test${params.difficulty ? ` (${params.difficulty})` : ""}`;

  const defaultDesc = params.description?.trim()
    ? params.description.trim()
    : `${params.difficulty || "Standard"} practice test for ${params.subject}.`;

  for (let i = 0; i < setsCount; i++) {
    const setLetter = SET_LETTERS[i] || String(i + 1);
    const setLabel = setsCount > 1 ? ` · Set ${setLetter}` : "";
    const setName = setsCount > 1 ? `Set ${setLetter}` : "Standard Test";
    const title = `${baseTitle}${setLabel}`;

    sets.push({
      setLetter,
      setName,
      title,
      description: defaultDesc,
      status: "pending",
    });
  }

  const newDraft: TeacherPaperDraft = {
    id: draftId,
    classroomId: params.classroomId,
    chapterId: params.chapterId || params.chapterIds?.[0] || "",
    chapterNumber: params.chapterNumber || 0,
    chapterName: params.chapterName || baseTitle,
    chapterIds: params.chapterIds || (params.chapterId ? [params.chapterId] : []),
    subject: params.subject,
    classLevel: params.classLevel,
    board: params.board,
    paperType: params.paperType,
    difficulty: params.difficulty,
    requestedSetsCount: setsCount,
    questionCount: params.questionCount,
    sloNumbers: params.sloNumbers || [],
    createdAt: now,
    updatedAt: now,
    status: "generating",
    sets,
    mode: params.mode || "slos",
    prompt: params.prompt,
    imageUrls: params.imageUrls,
    manualQuestions: params.manualQuestions,
    isPublic: params.isPublic,
    dueDate: params.dueDate || undefined,
  };

  const currentDrafts = getStoredTeacherDrafts(params.classroomId);
  saveTeacherDrafts([newDraft, ...currentDrafts.filter((d) => d.id !== draftId)], params.classroomId);

  // Kick off background worker queue
  void runDraftGenerationQueue(draftId, params.classroomId);

  return newDraft;
}

/**
 * Worker queue that iterates over pending/failed sets and generates them sequentially.
 */
async function runDraftGenerationQueue(
  draftId: string,
  classroomId: string,
): Promise<void> {
  const drafts = getStoredTeacherDrafts(classroomId);
  const draft = drafts.find((d) => d.id === draftId);
  if (!draft) return;

  for (let i = 0; i < draft.sets.length; i++) {
    const currentSet = draft.sets[i];
    if (currentSet.status === "ready") continue;

    // Mark set as generating
    updateStoredDraft(draftId, classroomId, (d) => {
      d.sets[i].status = "generating";
      d.status = "generating";
      return d;
    });

    try {
      const result = await generateDraftSet(draft, i);

      // Mark set as ready with generated questions
      updateStoredDraft(draftId, classroomId, (d) => {
        d.sets[i].status = "ready";
        d.sets[i].generatedPaperId = result.generatedPaperId;
        d.sets[i].questions = result.questions;
        d.sets[i].totalMarks = result.totalMarks;
        d.sets[i].totalQuestions = result.totalQuestions;
        d.sets[i].errorMessage = undefined;
        return d;
      });
    } catch (err: unknown) {
      console.error(`Error generating set ${currentSet.setName}:`, err);
      const errMsg = err instanceof Error ? err.message : "Generation failed";

      updateStoredDraft(draftId, classroomId, (d) => {
        d.sets[i].status = "failed";
        d.sets[i].errorMessage = errMsg;
        return d;
      });
    }
  }

  // Finalize overall draft status
  const finalDraft = updateStoredDraft(draftId, classroomId, (d) => {
    const readyCount = d.sets.filter((s) => s.status === "ready").length;
    const failedCount = d.sets.filter((s) => s.status === "failed").length;

    if (readyCount === d.sets.length) {
      d.status = "ready";
    } else if (readyCount > 0 && failedCount > 0) {
      d.status = "partial_failed";
    } else if (readyCount === 0) {
      d.status = "failed";
    } else {
      d.status = "ready";
    }
    return d;
  });

  if (finalDraft) {
    const readyCount = finalDraft.sets.filter((s) => s.status === "ready").length;
    const totalCount = finalDraft.sets.length;
    const label =
      finalDraft.chapterNumber > 0
        ? `Chapter ${finalDraft.chapterNumber}`
        : finalDraft.chapterName || finalDraft.subject || "Practice Test";

    if (readyCount === totalCount) {
      toast.success(
        totalCount > 1
          ? `All ${totalCount} sets for ${label} are ready in Drafts!`
          : `Practice Test for ${label} is ready in Drafts!`,
      );
    } else if (readyCount > 0) {
      toast(
        `${readyCount} of ${totalCount} sets generated. ${totalCount - readyCount} failed — retry them anytime in Drafts.`,
        { icon: "⚠️" },
      );
    } else {
      toast.error(
        `Failed to generate sets for ${label}. Click Retry in Drafts.`,
      );
    }
  }
}

/**
 * Retry generation for only the failed sets in a draft.
 */
export async function retryFailedTeacherDraftSets(
  draftId: string,
  classroomId: string,
): Promise<void> {
  const draft = updateStoredDraft(draftId, classroomId, (d) => {
    d.status = "generating";
    for (const set of d.sets) {
      if (set.status === "failed") {
        set.status = "pending";
        set.errorMessage = undefined;
      }
    }
    return d;
  });

  if (!draft) return;
  toast.loading("Retrying failed sets in background...", { duration: 2500 });
  await runDraftGenerationQueue(draftId, classroomId);
}

/**
 * Update questions / title for a single set inside a draft.
 */
export function updateTeacherDraftSetQuestions(
  draftId: string,
  classroomId: string,
  setLetter: string,
  updatedQuestions: GeneratedSloPaperQuestion[],
  updatedTitle?: string,
): void {
  updateStoredDraft(draftId, classroomId, (d) => {
    const set = d.sets.find((s) => s.setLetter === setLetter);
    if (set) {
      set.questions = updatedQuestions;
      set.totalQuestions = updatedQuestions.length;
      set.totalMarks = updatedQuestions.reduce(
        (sum, q) => sum + (Number(q.marks) || (d.paperType === "2" ? 4 : 1)),
        0,
      );
      if (updatedTitle) set.title = updatedTitle;
    }
    return d;
  });
}

/**
 * Publish all ready sets in a draft to the classroom at once and delete the draft upon success.
 */
export async function publishTeacherDraft(
  draftId: string,
  classroomId: string,
): Promise<{ publishedCount: number }> {
  const drafts = getStoredTeacherDrafts(classroomId);
  const draft = drafts.find((d) => d.id === draftId);
  if (!draft) throw new Error("Draft not found");

  const readySets = draft.sets.filter(
    (s) => s.status === "ready" && Array.isArray(s.questions) && s.questions.length > 0,
  );

  if (readySets.length === 0) {
    throw new Error("No ready sets to publish");
  }

  // Publish each ready set
  for (const set of readySets) {
    const res = await apiPost(API_ENDPOINTS.TEACHER.PAPERS, {
      action: "publish",
      classroomId,
      subject: draft.subject,
      classLevel: draft.classLevel,
      board: draft.board,
      paperType: draft.paperType,
      chapterIds:
        Array.isArray(draft.chapterIds) && draft.chapterIds.length > 0
          ? draft.chapterIds
          : draft.chapterId
            ? [draft.chapterId]
            : [],
      generatedPaperId: set.generatedPaperId,
      questions: set.questions,
      title: set.title,
      description: set.description,
      dueDate: draft.dueDate || undefined,
    });

    if (!res.success) {
      throw new Error(res.message || `Failed to publish ${set.setName}`);
    }
  }

  // Clear draft from storage
  deleteStoredDraft(draftId, classroomId);

  return { publishedCount: readySets.length };
}
