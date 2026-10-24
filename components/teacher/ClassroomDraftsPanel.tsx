"use client";

import { useState } from "react";
import {
  RotateCcw,
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Edit3,
  ArrowLeft,
  Check,
} from "lucide-react";
import AppButton from "@/components/AppButton";
import AppState from "@/components/AppState";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import TeacherPaperPreviewEditor from "@/components/teacher/TeacherPaperPreviewEditor";
import { useTeacherDrafts } from "@/hooks/teacher/useTeacherDrafts";
import type { TeacherPaperDraft, DraftSetItem } from "@/lib/teacher/teacher-drafts-store";
import type { GeneratedSloPaperQuestion } from "@/lib/paper/slo-paper-generator";
import FileDuotoneSVG from "@/public/svgs/FileDuotoneSVG";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import P1SVG from "@/public/svgs/P1SVG";
import P2SVG from "@/public/svgs/P2SCG";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import SyllabusSVG from "@/public/svgs/SyllabusSVG";

interface ClassroomDraftsPanelProps {
  classroomId: string;
  isTeacher: boolean;
  onNavigateToCoverage?: () => void;
  onPaperPublished?: () => void;
}

export default function ClassroomDraftsPanel({
  classroomId,
  isTeacher,
  onNavigateToCoverage,
  onPaperPublished,
}: ClassroomDraftsPanelProps) {
  const {
    drafts,
    retryFailed,
    updateSetQuestions,
    publish,
    deleteDraft,
  } = useTeacherDrafts(classroomId);

  const [expandedDrafts, setExpandedDrafts] = useState<Record<string, boolean>>({});
  const [publishingDraftId, setPublishingDraftId] = useState<string | null>(null);
  const [retryingDraftId, setRetryingDraftId] = useState<string | null>(null);
  const [draftToDelete, setDraftToDelete] = useState<TeacherPaperDraft | null>(null);

  // Preview & Edit state
  const [editingDraft, setEditingDraft] = useState<TeacherPaperDraft | null>(null);
  const [editingSet, setEditingSet] = useState<DraftSetItem | null>(null);
  const [editorQuestions, setEditorQuestions] = useState<GeneratedSloPaperQuestion[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toggleExpand = (draftId: string) => {
    setExpandedDrafts((prev) => ({
      ...prev,
      [draftId]: !prev[draftId],
    }));
  };

  const handlePublishAllReadySets = async (draft: TeacherPaperDraft) => {
    const readySets = draft.sets.filter(
      (s) => s.status === "ready" && Array.isArray(s.questions) && s.questions.length > 0,
    );

    if (readySets.length === 0) {
      toast.error("No ready sets to publish. Please wait for generation or retry failed sets.");
      return;
    }

    setPublishingDraftId(draft.id);
    const toastId = toast.loading(
      readySets.length > 1
        ? `Publishing ${readySets.length} sets to classroom...`
        : "Publishing practice test to classroom...",
    );

    try {
      const result = await publish(draft.id);
      toast.success(
        result.publishedCount > 1
          ? `Successfully published ${result.publishedCount} test sets to classroom!`
          : "Successfully published practice test to classroom!",
        { id: toastId },
      );
      onPaperPublished?.();
    } catch (err) {
      console.error("Publish draft error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to publish draft",
        { id: toastId },
      );
    } finally {
      setPublishingDraftId(null);
    }
  };

  const handleRetryFailed = async (draft: TeacherPaperDraft) => {
    setRetryingDraftId(draft.id);
    try {
      await retryFailed(draft.id);
    } catch (err) {
      console.error("Retry draft error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to retry generation");
    } finally {
      setRetryingDraftId(null);
    }
  };

  const handleOpenEditor = (draft: TeacherPaperDraft, set: DraftSetItem) => {
    setEditingDraft(draft);
    setEditingSet(set);
    setEditorQuestions(set.questions ? JSON.parse(JSON.stringify(set.questions)) : []);
    setIsDirty(false);
  };

  const handleQuestionsChange = (updatedQuestions: GeneratedSloPaperQuestion[]) => {
    setEditorQuestions(updatedQuestions);
    setIsDirty(true);
  };

  const handleSaveQuestions = () => {
    if (!editingDraft || !editingSet) return;
    setIsSaving(true);
    try {
      updateSetQuestions(
        editingDraft.id,
        editingSet.setLetter,
        editorQuestions,
        editingSet.title,
      );
      setEditingSet((prev) =>
        prev
          ? {
            ...prev,
            questions: editorQuestions,
            totalQuestions: editorQuestions.length,
            totalMarks: editorQuestions.reduce(
              (sum, q) =>
                sum + (Number(q.marks) || (editingDraft.paperType === "2" ? 4 : 1)),
              0,
            ),
          }
          : null,
      );
      setIsDirty(false);
      toast.success(`${editingSet.setName} saved successfully!`);
    } catch (err) {
      console.error("Save set error:", err);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseEditor = () => {
    if (isDirty) {
      handleSaveQuestions();
    }
    setEditingDraft(null);
    setEditingSet(null);
    setEditorQuestions([]);
    setIsDirty(false);
  };

  // If currently editing a set, render the full editor view within the dashboard layout (sidebar stays visible!)
  if (editingDraft && editingSet) {
    return (
      <div className="space-y-6 animate-in fade-in-0 duration-200 pb-20">
        {/* Top Sticky Action Bar */}
        <div className="sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/95 p-3 sm:p-4 backdrop-blur-md shadow-xs">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={handleCloseEditor}
              aria-label="Back to drafts"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-bold text-foreground truncate flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="truncate">{editingDraft.chapterName} · {editingSet.setName}</span>
                {isDirty ? (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                    Unsaved Changes
                  </span>
                ) : (
                  <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-primary whitespace-nowrap">
                    Saved
                  </span>
                )}
              </h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-muted-foreground">
                <span>
                  {editingDraft.paperType === "2" ? "Paper II (CRQ & ERQ)" : "Paper I (MCQ)"}
                </span>
                <span>• {editorQuestions.length} Questions</span>
                <span>• Draft Mode</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0">
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCloseEditor}
              className="h-9 font-medium text-xs justify-center"
            >
              {isDirty ? "Done & Save" : "Back to Drafts"}
            </AppButton>
            <AppButton
              type="button"
              size="sm"
              onClick={handleSaveQuestions}
              className="h-9 font-bold shadow-sm text-xs justify-center"
              disabled={!isDirty || isSaving}
            >
              <Check className="size-3.5 mr-1" />
              {isSaving ? "Saving..." : "Save Changes"}
            </AppButton>
          </div>
        </div>

        {/* Header Hero Banner */}
        <div className="rounded-3xl border border-primary/20 bg-linear-to-br from-primary/10 via-primary/5 to-card p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {editingSet.setName} · {editingDraft.difficulty}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
                {editingDraft.paperType === "2" ? <P2SVG className="size-3.5" /> : <P1SVG className="size-3.5" />}
                Paper {editingDraft.paperType === "2" ? "II" : "I"}
              </span>
              <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
                {editingDraft.subject} · Class {editingDraft.classLevel}
              </span>
            </div>
            <div className="text-xs font-bold text-primary">
              {editorQuestions.length} Questions Ready
            </div>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-black text-foreground">
              {(editingDraft.chapterNumber || 0) > 0 ? `Chapter ${editingDraft.chapterNumber}: ` : ""}
              {editingDraft.chapterName}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Review and customize this set before publishing. You can edit questions, adjust marks, reword choices, or remove items. Click <strong>Save Changes</strong> to save your work.
            </p>
          </div>
        </div>

        {/* Questions List Editor */}
        <TeacherPaperPreviewEditor
          paperType={editingDraft.paperType}
          questions={editorQuestions}
          onChange={handleQuestionsChange}
          subject={editingDraft.subject}
          classLevel={editingDraft.classLevel}
          board={editingDraft.board}
        />

        {/* Bottom Actions */}
        <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="text-xs text-muted-foreground">
            {editorQuestions.length} questions in this draft set
          </div>
          <div className="flex items-center gap-2">
            <AppButton
              type="button"
              variant="outline"
              onClick={handleCloseEditor}
            >
              Back to Drafts
            </AppButton>
            <AppButton
              type="button"
              onClick={handleSaveQuestions}
              className="font-bold"
              disabled={!isDirty || isSaving}
            >
              <Check className="size-4 mr-1.5" />
              {isSaving ? "Saving..." : "Save Changes"}
            </AppButton>
          </div>
        </div>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="flex min-h-[440px] sm:min-h-[500px] w-full items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-6 sm:rounded-3xl sm:p-12">
        <AppState
          isEmpty
          title="No pending test drafts"
          description="When you generate practice tests from Create Paper or the Coverage tab, they are placed here as drafts so you can review questions, edit options, and publish them to your students all at once."
          fullScreen={false}
          className="min-h-0 py-0 my-0"
          action={
            onNavigateToCoverage
              ? {
                label: "Go to Coverage & Generate Test",
                onClick: onNavigateToCoverage,
              }
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <section className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            <FileDuotoneSVG className="size-5 text-primary" />
            Classroom Drafts
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-black text-primary">
              {drafts.length}
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review generated question sets, edit content if needed, and publish them to your classroom.
          </p>
        </div>

        {onNavigateToCoverage && (
          <AppButton
            variant="outline"
            size="sm"
            onClick={onNavigateToCoverage}
            className="self-start sm:self-auto text-xs font-semibold"
          >
            <SyllabusSVG />
            Generate More from Coverage
          </AppButton>
        )}
      </div>

      <div className="space-y-4">
        {drafts.map((draft) => {
          const isExpanded = expandedDrafts[draft.id] !== false; // expanded by default
          const isPublishing = publishingDraftId === draft.id;
          const isRetrying = retryingDraftId === draft.id;
          const readySets = draft.sets.filter((s) => s.status === "ready");
          const failedSets = draft.sets.filter((s) => s.status === "failed");
          const generatingSets = draft.sets.filter(
            (s) => s.status === "generating" || s.status === "pending",
          );

          const totalSets = draft.sets.length;
          const readyCount = readySets.length;
          const failedCount = failedSets.length;
          const isAllReady = readyCount === totalSets;
          const isPartiallyReady = readyCount > 0 && failedCount > 0;

          const tierColor =
            draft.difficulty === "Alpha"
              ? "bg-primary/10 text-primary border-primary/20"
              : draft.difficulty === "Beta"
                ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                : "bg-purple-500/10 text-purple-600 border-purple-500/20";

          return (
            <div
              key={draft.id}
              className={cn(
                "rounded-2xl border transition-all duration-200 bg-card overflow-hidden shadow-xs",
                draft.status === "generating"
                  ? "border-primary/40 ring-1 ring-primary/20"
                  : draft.status === "partial_failed"
                    ? "border-amber-500/40"
                    : "border-border hover:border-border/80",
              )}
            >
              {/* Draft Header Card */}
              <div className="p-4 sm:p-5 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider", tierColor)}>
                        {draft.difficulty} Tier
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {draft.paperType === "2" ? <P2SVG className="size-3" /> : <P1SVG className="size-3" />}
                        Paper {draft.paperType} ({draft.paperType === "1" ? "MCQs" : "CRQ/ERQ"})
                      </span>
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {totalSets} {totalSets === 1 ? "Set" : "Variant Sets"} • {draft.questionCount} Qs
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-foreground truncate">
                      {(draft.chapterNumber || 0) > 0 ? `Chapter ${draft.chapterNumber}: ` : ""}
                      {draft.chapterName}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {draft.subject} • Class {draft.classLevel} ({draft.board})
                    </p>
                  </div>

                  {/* Status Badges & Global Publish / Retry Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    {generatingSets.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary animate-pulse">
                        <Loader2 className="size-3.5 animate-spin" />
                        Generating ({readyCount}/{totalSets} ready)
                      </span>
                    ) : isAllReady ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
                        <CheckCircle2 className="size-3.5" />
                        Ready ({readyCount} Sets)
                      </span>
                    ) : isPartiallyReady ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <AlertCircle className="size-3.5" />
                        {readyCount} of {totalSets} ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 border border-destructive/20 px-3 py-1 text-xs font-bold text-destructive">
                        <AlertCircle className="size-3.5" />
                        Failed
                      </span>
                    )}

                    <div className="flex items-center gap-1.5">
                      {/* Single One-Click Publish Button */}
                      {readyCount > 0 && (
                        <AppButton
                          size="sm"
                          onClick={() => handlePublishAllReadySets(draft)}
                          disabled={isPublishing}
                          className="h-9 px-3.5 font-bold rounded-xl shadow-xs text-xs"
                        >
                          {isPublishing ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin" />
                              Publishing...
                            </>
                          ) : (
                            <>
                              <Send className="size-3.5 mr-1" />
                              {readyCount > 1 ? `Publish ${readyCount} Sets` : "Publish to Classroom"}
                            </>
                          )}
                        </AppButton>
                      )}

                      {/* Retry Button for Failed Sets */}
                      {failedCount > 0 && (
                        <AppButton
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetryFailed(draft)}
                          disabled={isRetrying || generatingSets.length > 0}
                          className="h-9 px-2.5 text-xs font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                        >
                          {isRetrying ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="size-3.5" />
                          )}
                          Retry {failedCount}
                        </AppButton>
                      )}

                      {/* Discard Draft Button */}
                      <button
                        type="button"
                        onClick={() => setDraftToDelete(draft)}
                        disabled={isPublishing}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors cursor-pointer"
                        title="Discard this draft"
                        aria-label="Discard this draft"
                      >
                        <DeleteSVG className="size-4" />
                      </button>

                      {/* Accordion toggle */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(draft.id)}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
                        title={isExpanded ? "Collapse sets" : "Expand sets"}
                        aria-label={isExpanded ? "Collapse sets" : "Expand sets"}
                      >
                        {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress bar if generating */}
                {generatingSets.length > 0 && (
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-500 rounded-full animate-pulse"
                      style={{
                        width: `${Math.max(10, Math.round((readyCount / totalSets) * 100))}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Sets List (Accordion Body) */}
              {isExpanded && (
                <div className="border-t border-border/60 bg-muted/20 p-3 sm:p-4 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                    <span>Variant Sets ({readyCount} Ready / {totalSets} Total)</span>
                    <span className="text-[10px] font-medium lowercase text-muted-foreground/80">
                      Click Preview/Edit on any set to customize questions
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {draft.sets.map((set) => {
                      const isSetReady = set.status === "ready" && Array.isArray(set.questions) && set.questions.length > 0;
                      const isSetGenerating = set.status === "generating" || set.status === "pending";
                      const isSetFailed = set.status === "failed";

                      return (
                        <div
                          key={`${draft.id}-${set.setLetter}`}
                          className={cn(
                            "flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-3.5 rounded-xl border transition-colors bg-card",
                            isSetReady
                              ? "border-border hover:border-primary/40 shadow-2xs"
                              : isSetGenerating
                                ? "border-primary/30 bg-primary/5"
                                : "border-destructive/30 bg-destructive/5",
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <span className="font-bold text-sm text-foreground shrink-0 whitespace-nowrap">
                                {set.setName}
                              </span>
                              {isSetReady ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md whitespace-nowrap">
                                  <CheckCircle2 className="size-3" /> Ready ({set.totalQuestions ?? set.questions?.length ?? 0} Qs • {set.totalMarks ?? 0} Marks)
                                </span>
                              ) : isSetGenerating ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md animate-pulse whitespace-nowrap">
                                  <Loader2 className="size-3 animate-spin" /> Generating...
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md whitespace-nowrap" title={set.errorMessage}>
                                  <AlertCircle className="size-3" /> Failed
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {set.title}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            {isSetReady ? (
                              <AppButton
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEditor(draft, set)}
                                className="h-8 px-3 text-xs font-semibold rounded-lg"
                              >
                                <Edit3 className="size-3.5 mr-1" />
                                Preview & Edit
                              </AppButton>
                            ) : isSetFailed ? (
                              <AppButton
                                size="sm"
                                variant="outline"
                                onClick={() => handleRetryFailed(draft)}
                                className="h-8 px-2.5 text-xs font-semibold text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                              >
                                <RotateCcw className="size-3 mr-1" />
                                Retry
                              </AppButton>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Draft Confirmation Modal */}
      {draftToDelete && (
        <DeleteConfirmationModal
          isOpen={Boolean(draftToDelete)}
          onClose={() => setDraftToDelete(null)}
          onConfirm={() => {
            if (draftToDelete) {
              deleteDraft(draftToDelete.id);
              toast.success("Draft discarded");
              setDraftToDelete(null);
            }
          }}
          title="Discard Draft?"
          message={`Are you sure you want to discard the drafts for ${(draftToDelete.chapterNumber || 0) > 0 ? `Chapter ${draftToDelete.chapterNumber}: ` : ""}${draftToDelete.chapterName}? This action cannot be undone.`}
        />
      )}
    </section>
  );
}
