"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getStoredTeacherDrafts,
  startTeacherDraftGeneration,
  retryFailedTeacherDraftSets,
  updateTeacherDraftSetQuestions,
  publishTeacherDraft,
  deleteStoredDraft,
  type TeacherPaperDraft,
  type StartDraftGenerationParams,
} from "@/lib/teacher/teacher-drafts-store";
import type { GeneratedSloPaperQuestion } from "@/lib/paper/slo-paper-generator";

export function useTeacherDrafts(classroomId?: string) {
  const [drafts, setDrafts] = useState<TeacherPaperDraft[]>(() =>
    getStoredTeacherDrafts(classroomId),
  );

  const refreshDrafts = useCallback(() => {
    setDrafts(getStoredTeacherDrafts(classroomId));
  }, [classroomId]);

  useEffect(() => {
    refreshDrafts();

    const handleDraftsChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ classroomId?: string }>;
      if (!classroomId || !customEvent.detail?.classroomId || customEvent.detail.classroomId === classroomId) {
        refreshDrafts();
      }
    };

    window.addEventListener("exboard_teacher_drafts_changed", handleDraftsChanged);
    window.addEventListener("storage", refreshDrafts);

    return () => {
      window.removeEventListener("exboard_teacher_drafts_changed", handleDraftsChanged);
      window.removeEventListener("storage", refreshDrafts);
    };
  }, [classroomId, refreshDrafts]);

  const startDraft = useCallback(
    (params: StartDraftGenerationParams) => {
      return startTeacherDraftGeneration(params);
    },
    [],
  );

  const retryFailed = useCallback(
    async (draftId: string) => {
      if (!classroomId) return;
      await retryFailedTeacherDraftSets(draftId, classroomId);
    },
    [classroomId],
  );

  const updateSetQuestions = useCallback(
    (
      draftId: string,
      setLetter: string,
      questions: GeneratedSloPaperQuestion[],
      title?: string,
    ) => {
      if (!classroomId) return;
      updateTeacherDraftSetQuestions(draftId, classroomId, setLetter, questions, title);
    },
    [classroomId],
  );

  const publish = useCallback(
    async (draftId: string) => {
      if (!classroomId) throw new Error("No classroom ID provided");
      return await publishTeacherDraft(draftId, classroomId);
    },
    [classroomId],
  );

  const deleteDraft = useCallback(
    (draftId: string) => {
      if (!classroomId) return;
      deleteStoredDraft(draftId, classroomId);
    },
    [classroomId],
  );

  const activeDraftsCount = drafts.length;
  const generatingCount = drafts.filter((d) => d.status === "generating").length;
  const readyCount = drafts.filter((d) => d.status === "ready" || d.status === "partial_failed").length;

  return {
    drafts,
    activeDraftsCount,
    generatingCount,
    readyCount,
    startDraft,
    retryFailed,
    updateSetQuestions,
    publish,
    deleteDraft,
    refreshDrafts,
  };
}
