"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import {
  Zap,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Loader2,
  Check,
  Globe,
  Lock,
} from "lucide-react";
import ArrowLeftSVG from "@/public/svgs/ArrowLeftSVG";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import ArrowDownSVG from "@/public/svgs/ArrowDownSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import EditSVG from "@/public/svgs/EditSVG";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import AppButton from "@/components/AppButton";
import AppInput from "@/components/AppInput";
import AppSelect from "@/components/AppSelect";
import AppState from "@/components/AppState";
import UserAvatar from "@/components/UserAvatar";
import GenerateCustomInputs, {
  type CustomUploadedImage,
  type CustomCreationType,
} from "@/components/generate/GenerateCustomInputs";
import ManualQuestionBuilder, {
  type ManualQuestionItem,
} from "@/components/custom-quiz/ManualQuestionBuilder";
import ChapterSloSelector from "@/components/generate/ChapterSloSelector";
import { cn } from "@/lib/utils";
import type { PracticeIntent } from "./PracticeModeSelector";
import type { ChallengeType } from "./ChallengeTypeSelector";
import type { GeneratePaperChapter } from "@/types/challenge";
import { formatSubjectOptionLabel } from "@/lib/paper/subject-mapping";

export type QuestionSourceMode = "past_papers" | "slos" | "custom";

interface Curriculum {
  id: string;
  class: string;
  board: string;
  subject: string;
  chaptersCount: number;
}

interface Chapter {
  id: string;
  chapterNumber: number;
  chapterName: string;
  questionCount: number;
}

interface UserSearchResult {
  id: string;
  name: string;
  username: string;
  profileImage: string | null;
}

interface UnifiedConfigureStepProps {
  intent: PracticeIntent;
  challengeType: ChallengeType | null;
  mode: QuestionSourceMode;
  onModeChange: (mode: QuestionSourceMode) => void;
  // Solo Exam Type
  paperType: "1" | "2";
  onPaperTypeChange: (paperType: "1" | "2") => void;
  // Subject & Chapters
  subject: string;
  onSubjectChange: (subject: string) => void;
  availableSubjects: Curriculum[];
  loadingSubjects: boolean;
  chapters: GeneratePaperChapter[];
  selectedChapterIds: string[];
  selectedSloNumbers?: string[];
  loadingChapters: boolean;
  onToggleChapter: (chapterId: string) => void;
  onSelectAllChapters: () => void;
  onClearChapters: () => void;
  onSelectedSloNumbersChange?: (sloNumbers: string[]) => void;
  // Custom mode
  customTitle: string;
  onCustomTitleChange: (title: string) => void;
  customPrompt: string;
  onCustomPromptChange: (prompt: string) => void;
  customImages: CustomUploadedImage[];
  onCustomImagesChange: (images: CustomUploadedImage[]) => void;
  creationType: CustomCreationType;
  onCreationTypeChange: (type: CustomCreationType) => void;
  manualQuestions: ManualQuestionItem[];
  onManualQuestionsChange: (questions: ManualQuestionItem[]) => void;
  // 1v1 Normal Challenge Invites
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  isSearchingUsers: boolean;
  searchResults: UserSearchResult[];
  invitedUsers: UserSearchResult[];
  onInviteUser: (user: UserSearchResult) => void;
  onRemoveUser: (id: string) => void;
  // Lightning Round Settings
  lightningTimer: number;
  onLightningTimerChange: (seconds: number) => void;
  lightningQuestionCount: number;
  onLightningQuestionCountChange: (count: number) => void;
  // Difficulty Level
  difficulty?: "Alpha" | "Beta" | "Gamma";
  onDifficultyChange?: (difficulty: "Alpha" | "Beta" | "Gamma") => void;
  // Visibility (Public vs Private)
  isPublic?: boolean;
  onIsPublicChange?: (isPublic: boolean) => void;
  // Status & Submit
  board?: string;
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

const SOURCE_OPTIONS: Array<{
  value: QuestionSourceMode;
  label: string;
  hint: string;
}> = [
    {
      value: "past_papers",
      label: "Past Papers Bank",
      hint: "Curated from official board past exam papers & marking schemes",
    },
    {
      value: "slos",
      label: "SLO's AI Practice",
      hint: "AI-generated questions mapped to Student Learning Outcomes",
    },
    {
      value: "custom",
      label: "Custom Notes / Prompt",
      hint: "Generate from your own notes, textbook photos, or manual questions",
    },
  ];

function SectionLabel({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-black text-primary dark:bg-muted dark:text-foreground">
        {step}
      </span>
      <span className="text-xs font-black uppercase tracking-wider text-foreground">
        {title}
      </span>
    </div>
  );
}

interface ChapterMultiSelectProps {
  chapters: Chapter[];
  selectedIds: string[];
  loading: boolean;
  disabled: boolean;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}

function ChapterMultiSelect({
  chapters,
  selectedIds,
  loading,
  disabled,
  onToggle,
  onSelectAll,
  onClear,
}: ChapterMultiSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    width: 0,
    maxHeight: 280,
    preferUp: false,
  });

  const filteredChapters = chapters.filter((c) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return (
      c.chapterName.toLowerCase().includes(term) ||
      String(c.chapterNumber).includes(term)
    );
  });

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 12;

    let width = rect.width;
    let left = rect.left;
    if (width > viewportWidth - padding * 2) {
      width = viewportWidth - padding * 2;
      left = padding;
    } else if (left + width > viewportWidth - padding) {
      left = Math.max(padding, viewportWidth - padding - width);
    } else if (left < padding) {
      left = padding;
    }

    const spaceBelow = viewportHeight - rect.bottom - padding;
    const spaceAbove = rect.top - padding;
    const preferUp = spaceBelow < 240 && spaceAbove > spaceBelow;
    const maxHeight = preferUp
      ? Math.min(320, Math.max(160, spaceAbove - 8))
      : Math.min(320, Math.max(160, spaceBelow - 8));

    setPosition({
      top: rect.bottom + 6,
      bottom: viewportHeight - rect.top + 6,
      left,
      width,
      maxHeight,
      preferUp,
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    updatePosition();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleReposition = () => updatePosition();

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, updatePosition]);

  const triggerLabel =
    selectedIds.length > 0
      ? `${selectedIds.length} of ${chapters.length} chapters selected`
      : "Select chapters";

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-3 rounded-xl border bg-background px-4 text-sm transition-all",
          "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
          {
            "border-primary ring-4 ring-primary/10": open,
            "border-border hover:border-primary/30": !open,
            "cursor-not-allowed opacity-50": disabled,
            "text-muted-foreground": selectedIds.length === 0,
            "text-foreground": selectedIds.length > 0,
          },
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{triggerLabel}</span>
        <ArrowDownSVG
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", {
            "rotate-180 text-primary dark:text-foreground": open,
          })}
          aria-hidden="true"
        />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
          <div
            ref={panelRef}
            role="listbox"
            style={{
              position: "fixed",
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
              zIndex: 99999,
              ...(position.preferUp
                ? { bottom: position.bottom }
                : { top: position.top }),
            }}
            className="flex flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-xl backdrop-blur-md"
          >
            {/* Search */}
            <div className="shrink-0 border-b border-border/60 p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search chapters..."
                  className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>

            {/* Select All / Clear */}
            <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-3 py-1.5">
              <button
                type="button"
                onClick={() => {
                  onSelectAll();
                  setQuery("");
                }}
                className="text-[11px] font-extrabold text-primary hover:underline dark:text-white"
              >
                Select All
              </button>
              <span className="text-[10px] font-semibold text-muted-foreground">
                {selectedIds.length}/{chapters.length} selected
              </span>
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setQuery("");
                }}
                className="text-[11px] font-extrabold text-muted-foreground hover:text-destructive"
              >
                Clear
              </button>
            </div>

            {/* Chapter list */}
            <ul
              style={{
                maxHeight: `${Math.max(150, position.maxHeight - 108)}px`,
              }}
              className="overflow-y-auto py-1 overscroll-contain"
            >
              {filteredChapters.map((ch) => {
                const isSelected = selectedIds.includes(ch.id);
                return (
                  <li key={ch.id}>
                    <button
                      type="button"
                      onClick={() => onToggle(ch.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                        isSelected
                          ? "bg-primary/10 text-primary font-semibold dark:bg-muted dark:text-foreground"
                          : "text-foreground hover:bg-muted",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] font-black text-muted-foreground">
                          {ch.chapterNumber}
                        </span>
                        <span className="truncate">{ch.chapterName}</span>
                      </span>
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border transition-all",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background",
                        )}
                      >
                        {isSelected && <Check className="size-3.5 stroke-[3]" />}
                      </span>
                    </button>
                  </li>
                );
              })}
              {filteredChapters.length === 0 ? (
                <li className="px-3 py-2.5 text-sm text-muted-foreground">
                  No matching chapters
                </li>
              ) : null}
            </ul>
          </div>,
          document.body,
        )
        : null}
    </div>
  );
}

export default function UnifiedConfigureStep({
  intent,
  challengeType,
  mode,
  onModeChange,
  paperType,
  onPaperTypeChange,
  subject,
  onSubjectChange,
  availableSubjects,
  loadingSubjects,
  chapters,
  selectedChapterIds,
  selectedSloNumbers = [],
  loadingChapters,
  onToggleChapter,
  onSelectAllChapters,
  onClearChapters,
  onSelectedSloNumbersChange,
  customTitle,
  onCustomTitleChange,
  customPrompt,
  onCustomPromptChange,
  customImages,
  onCustomImagesChange,
  creationType,
  onCreationTypeChange,
  manualQuestions,
  onManualQuestionsChange,
  searchQuery,
  onSearchQueryChange,
  isSearchingUsers,
  searchResults,
  invitedUsers,
  onInviteUser,
  onRemoveUser,
  lightningTimer,
  onLightningTimerChange,
  lightningQuestionCount,
  onLightningQuestionCountChange,
  difficulty = "Beta",
  onDifficultyChange,
  isPublic = true,
  onIsPublicChange,
  board,
  isSubmitting,
  onBack,
  onSubmit,
}: UnifiedConfigureStepProps) {
  const isSolo = intent === "myself";
  const is1v1 = intent === "challenge" && challengeType === "normal";
  const isLightning = intent === "challenge" && challengeType === "lightning";
  const isCustom = mode === "custom";

  const effectiveBoard = board || availableSubjects[0]?.board || "";
  const isSindh =
    effectiveBoard.toLowerCase().includes("sindh") ||
    effectiveBoard.toLowerCase().includes("karachi");

  const sourceOptions = useMemo(
    () =>
      SOURCE_OPTIONS.map((s) => {
        if (s.value === "slos" && isSindh) {
          return {
            ...s,
            label: "Syllabus AI Practice",
            hint: "AI-generated questions mapped to syllabus topics",
          };
        }
        return s;
      }),
    [isSindh],
  );

  const [isCustomTimer, setIsCustomTimer] = useState(
    ![10, 20, 30].includes(lightningTimer),
  );
  const [customTimerText, setCustomTimerText] = useState<string>(
    String(lightningTimer),
  );

  const isCustomValid =
    creationType === "manual"
      ? manualQuestions.length > 0 &&
      manualQuestions.every(
        (q) => q.questionText.trim() && q.options.every((o) => o.text.trim()),
      )
      : customImages.length > 0 || Boolean(customPrompt.trim());

  const getSubmitButtonLabel = () => {
    if (isSolo) return "Generate Exam 🚀";
    if (is1v1) return "Challenge";
    if (isLightning) return "Launch Arena";
    return "Start Now";
  };

  const handleSubmitAttempt = () => {
    if (isSubmitting) return;
    if (isCustom) {
      if (!customTitle.trim()) {
        toast.error("Please enter a title for your quiz.");
        return;
      }
      if (!isCustomValid) {
        toast.error("Please complete your quiz materials before submitting.");
        return;
      }
    } else {
      if (!subject) {
        toast.error("Please select a subject.");
        return;
      }
      if (selectedChapterIds.length === 0) {
        toast.error("Please select at least one chapter.");
        return;
      }
      if (is1v1 && invitedUsers.length === 0) {
        toast.error("Please invite at least one classmate to challenge.");
        return;
      }
    }
    onSubmit();
  };

  const subjectOptions = availableSubjects.map((c) => ({
    value: c.subject,
    label: formatSubjectOptionLabel(c.subject, c.class, c.chaptersCount),
  }));

  const renderChapters = (step: number) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <SectionLabel step={step} title="Chapters" />
        {!subject ? (
          <p className="rounded-xl border border-dashed border-border bg-background/40 px-4 py-3 text-xs text-muted-foreground">
            Select a subject above to load its chapters.
          </p>
        ) : loadingChapters ? (
          <div className="flex h-12 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary dark:text-foreground" />
            <span>Loading chapters...</span>
          </div>
        ) : chapters.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-background/40 px-4 py-3 text-xs text-muted-foreground">
            No chapters found for {subject}.
          </p>
        ) : (
          <ChapterMultiSelect
            chapters={chapters}
            selectedIds={selectedChapterIds}
            loading={loadingChapters}
            disabled={isSubmitting}
            onToggle={onToggleChapter}
            onSelectAll={onSelectAllChapters}
            onClear={onClearChapters}
          />
        )}
        {subject && chapters.length > 0 ? (
          <p className="text-[11px] text-muted-foreground">
            Pick one or more chapters to include in your round.
          </p>
        ) : null}
      </div>

      {/* Target Specific SLOs Selector when in SLO's AI Practice mode */}
      {subject && mode === "slos" && selectedChapterIds.length > 0 && (
        <ChapterSloSelector
          chapters={chapters}
          selectedChapterIds={selectedChapterIds}
          selectedSloNumbers={selectedSloNumbers}
          onChangeSelectedSlos={onSelectedSloNumbersChange || (() => { })}
          title={isSindh ? "Target Specific Syllabus Topics (Optional)" : "Target Specific SLOs (Optional)"}
          description={
            isSindh
              ? "Select specific syllabus topics to test, or leave as default to test all topics across the chosen chapters"
              : "Select specific learning outcomes to test, or leave as default to test all SLOs across the chosen chapters"
          }
        />
      )}
    </div>
  );

  const renderInvite = (step: number) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionLabel step={step} title="Invite Classmates" />
        <span className="text-xs font-bold text-muted-foreground">
          {invitedUsers.length} invited
        </span>
      </div>

      {/* User Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <AppInput
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Search classmate by name or @username..."
          className="h-11 rounded-xl pl-10 pr-10 bg-background text-xs sm:text-sm"
          disabled={isSubmitting}
        />
        {isSearchingUsers && (
          <Loader2 className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-primary dark:text-foreground" />
        )}

        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-2xl border border-border bg-card p-1.5 shadow-xl">
            {searchResults.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => onInviteUser(u)}
                className="flex w-full items-center justify-between gap-3 rounded-xl p-2.5 text-left hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <UserAvatar
                    src={u.profileImage}
                    name={u.name}
                    username={u.username}
                    id={u.id}
                    size={32}
                    className="size-8 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{u.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">@{u.username}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-extrabold text-primary dark:bg-muted dark:text-foreground">
                  <Plus className="size-3" /> Add
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {invitedUsers.length === 0 ? (
        <p className="py-1 text-center text-xs text-muted-foreground">
          Search and select at least one friend to send this challenge invitation.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {invitedUsers.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between gap-2.5 rounded-xl border border-border/80 bg-background p-2.5 shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <UserAvatar
                  src={u.profileImage}
                  name={u.name}
                  username={u.username}
                  id={u.id}
                  size={30}
                  className="size-7.5 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{u.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">@{u.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveUser(u.id)}
                disabled={isSubmitting}
                className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 cursor-pointer"
                title="Remove invitation"
                aria-label={`Remove ${u.name}`}
              >
                <DeleteSVG className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full space-y-5 sm:space-y-8 pb-1 sm:pb-2 animate-in fade-in duration-200">
      {/* Top Header & Back Navigation */}
      <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3 sm:pb-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="group flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-2xs transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-95 disabled:opacity-40 cursor-pointer"
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeftSVG className="size-4.5 sm:size-5 transition-transform group-hover:-translate-x-0.5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-primary dark:border-border dark:bg-muted dark:text-white">
                {isSolo ? "Solo Study" : is1v1 ? "Blitz Arena" : "Lightning Arena"}
              </span>
            </div>
            <h2 className="text-sm sm:text-lg font-extrabold tracking-tight text-foreground leading-tight mt-0.5">
              Configure {isSolo ? "Your Exam" : is1v1 ? "Your Match" : "Your Arena"}
            </h2>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Source, subject, chapters &amp; settings — all in one step
            </p>
          </div>
        </div>
      </div>

      {/* STEP 1: Question Setup */}
      <div className="space-y-5">
        {/* Question Source Dropdown */}
        <div className="space-y-2">
          <SectionLabel step={1} title="Question Source" />
          <AppSelect
            value={mode}
            options={sourceOptions.map((s) => ({
              value: s.value,
              label: s.label,
            }))}
            placeholder="Select question source"
            disabled={isSubmitting}
            onChange={(e) =>
              onModeChange(e.target.value as QuestionSourceMode)
            }
            aria-label="Question source"
          />
          <p className="text-[11px] text-muted-foreground">
            {sourceOptions.find((s) => s.value === mode)?.hint ??
              "Where should the questions come from?"}
          </p>
        </div>

        {isCustom ? (
          /* Custom Material Inputs */
          <div className="space-y-4 rounded-2xl border border-border/70 bg-background/40 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                Quiz Materials
              </h4>
              <div className="inline-flex rounded-xl border border-border/80 bg-background/80 p-1">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => onCreationTypeChange("ai")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all",
                    creationType === "ai"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <SparklesSVG className="size-3.5" />
                  <span>AI Prompt</span>
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => onCreationTypeChange("manual")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all",
                    creationType === "manual"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <EditSVG className="size-3.5" />
                  <span>Manual Quiz</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-foreground">
                Exam Title / Subject Name
              </label>
              <AppInput
                value={customTitle}
                onChange={(e) => onCustomTitleChange(e.target.value)}
                placeholder="e.g. Physics Chapter 3 Mock, Organic Chemistry Test..."
                className="h-11 rounded-xl bg-background text-sm"
                disabled={isSubmitting}
              />
            </div>

            {creationType === "manual" ? (
              <ManualQuestionBuilder
                questions={manualQuestions}
                onChange={onManualQuestionsChange}
                disabled={isSubmitting}
              />
            ) : (
              <GenerateCustomInputs
                prompt={customPrompt}
                onPromptChange={onCustomPromptChange}
                images={customImages}
                onImagesChange={onCustomImagesChange}
                disabled={isSubmitting}
              />
            )}
          </div>
        ) : (
          <>
            {/* Subject Dropdown */}
            <div className="space-y-2">
              <SectionLabel step={2} title="Subject" />
              {loadingSubjects ? (
                <div className="flex h-12 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-primary dark:text-foreground" />
                  <span>Loading subjects...</span>
                </div>
              ) : availableSubjects.length === 0 ? (
                <AppState
                  isEmpty={true}
                  title="No subjects found"
                  description="We could not load curriculum subjects for your class."
                  icon={AlertCircle}
                  fullScreen={false}
                />
              ) : (
                <AppSelect
                  searchable
                  value={subject}
                  options={subjectOptions}
                  placeholder="Select subject"
                  disabled={isSubmitting}
                  onChange={(e) => onSubjectChange(e.target.value)}
                  aria-label="Subject"
                />
              )}
            </div>

            {/* Chapters + Invite Classmates for Blitz Arena (flat, no child section) */}
            {is1v1 ? (
              <>
                {renderChapters(3)}
                {renderInvite(4)}
              </>
            ) : (
              renderChapters(3)
            )}
          </>
        )}
      </div>

      {/* STEP 2: Mode-Specific Settings */}
      <div className="space-y-4">
        {mode !== "past_papers" && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <SectionLabel step={isCustom ? 2 : 4} title="Difficulty Level" />
              <span className="text-[11px] font-bold text-primary">Target Cognitive Tier</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(["Alpha", "Beta", "Gamma"] as const).map((tier) => {
                const colorMap = {
                  Alpha: {
                    ring: "border-emerald-500 bg-emerald-500/10 ring-emerald-500/30",
                    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                    check: "bg-emerald-600",
                  },
                  Beta: {
                    ring: "border-blue-500 bg-blue-500/10 ring-blue-500/30",
                    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
                    check: "bg-blue-600",
                  },
                  Gamma: {
                    ring: "border-purple-500 bg-purple-500/10 ring-purple-500/30",
                    badge: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
                    check: "bg-purple-600",
                  },
                };
                const labels = {
                  Alpha: { title: "Foundation", desc: "Core definitions & direct solutions" },
                  Beta: { title: "Standard", desc: "50% Foundation & 50% Conceptual application" },
                  Gamma: { title: "Advanced", desc: "Entry-test analytical & diagrammatic questions" },
                };
                const c = colorMap[tier];
                const l = labels[tier];
                const isSelected = difficulty === tier;

                return (
                  <button
                    key={tier}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => onDifficultyChange?.(tier)}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer",
                      isSelected
                        ? `${c.ring} shadow-xs ring-1`
                        : "border-border/80 bg-muted/20 hover:border-border hover:bg-muted/40",
                    )}
                  >
                    <div>
                      <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded-md", c.badge)}>
                        {tier}
                      </span>
                      <p className="text-xs font-black text-foreground mt-1.5">{l.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{l.desc}</p>
                    </div>
                    {isSelected && (
                      <div className={cn("size-4 rounded-full text-white flex items-center justify-center mt-2 ml-auto", c.check)}>
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isSolo && (
          <div className="space-y-3">
            <SectionLabel step={mode === "past_papers" ? (isCustom ? 2 : 4) : (isCustom ? 3 : 5)} title="Paper Format" />
            <div className="inline-flex w-full rounded-xl border border-border/80 bg-background/80 p-1">
              {(
                [
                  { value: "1" as const, label: "Paper I · MCQ", sub: "25 questions · instant marking" },
                  { value: "2" as const, label: "Paper II · Theory", sub: "CRQ & ERQ · image uploads" },
                ]
              ).map((p) => (
                <button
                  key={p.value}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => onPaperTypeChange(p.value)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2.5 text-left transition-all",
                    paperType === p.value
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="block text-xs font-black">{p.label}</span>
                  <span
                    className={cn(
                      "block text-[10px] font-semibold",
                      paperType === p.value
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground",
                    )}
                  >
                    {p.sub}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Paper Bank Visibility Option */}
        <div className="space-y-2.5 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-primary dark:text-foreground" />
                <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Papers Bank Visibility
                </h4>
                <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-400">
                  Public
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed max-w-xl">
                {isPublic
                  ? "Public — This paper will be added to the Papers Bank so you, classmates, and teachers can practice and reuse it anytime without consuming AI generation quota."
                  : "Private — This paper will remain private to your session and directly challenged friends only."}
              </p>
            </div>

            <div className="grid grid-cols-2 w-full sm:w-56 rounded-xl border border-border/80 bg-muted/40 p-1 shrink-0">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onIsPublicChange?.(true)}
                className={cn(
                  "flex w-full items-center justify-center gap-1.5 rounded-lg py-2 sm:py-1.5 text-xs font-bold transition-all cursor-pointer",
                  isPublic
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Globe className="size-3.5 shrink-0" />
                <span>Public</span>
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onIsPublicChange?.(false)}
                className={cn(
                  "flex w-full items-center justify-center gap-1.5 rounded-lg py-2 sm:py-1.5 text-xs font-bold transition-all cursor-pointer",
                  !isPublic
                    ? "bg-card text-foreground shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Lock className="size-3.5 shrink-0" />
                <span>Private</span>
              </button>
            </div>
          </div>
        </div>

        {isLightning && (
          <div className="space-y-4">
            <SectionLabel step={isCustom ? 2 : 4} title="Arena Parameters" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Countdown Timer Dropdown */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Clock className="size-3.5 text-primary dark:text-foreground" />
                  Time Per Question
                </label>
                <AppSelect
                  value={isCustomTimer ? "custom" : String(lightningTimer)}
                  options={[
                    { value: "10", label: "10 seconds" },
                    { value: "20", label: "20 seconds" },
                    { value: "30", label: "30 seconds" },
                    { value: "custom", label: "Custom" },
                  ]}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    if (e.target.value === "custom") {
                      setIsCustomTimer(true);
                      setCustomTimerText(String(lightningTimer));
                    } else {
                      setIsCustomTimer(false);
                      setCustomTimerText(e.target.value);
                      onLightningTimerChange(Number(e.target.value));
                    }
                  }}
                  aria-label="Time per question"
                />

                {isCustomTimer && (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min={5}
                        max={300}
                        value={customTimerText}
                        onChange={(e) => {
                          const text = e.target.value;
                          setCustomTimerText(text);
                          const val = Number(text);
                          if (text !== "" && !isNaN(val) && val >= 5 && val <= 300) {
                            onLightningTimerChange(val);
                          }
                        }}
                        onBlur={() => {
                          const val = Number(customTimerText);
                          if (
                            customTimerText === "" ||
                            isNaN(val) ||
                            val < 5 ||
                            val > 300
                          ) {
                            setCustomTimerText(String(lightningTimer));
                          } else {
                            setCustomTimerText(String(val));
                          }
                        }}
                        className="h-10 w-full rounded-xl border border-primary/40 bg-background px-3 text-xs font-bold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                        placeholder="Seconds (5-300)"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                        sec
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground pr-1">
                      Range: 5s – 300s
                    </span>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground">
                  Answering faster awards higher speed bonus points.
                </p>
              </div>

              {/* Total Question Count Dropdown */}
              {mode !== "custom" || creationType !== "manual" ? (
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Zap className="size-3.5 text-primary dark:text-foreground" />
                    Total Questions
                  </label>
                  <AppSelect
                    value={String(lightningQuestionCount)}
                    options={[5, 10, 15, 20].map((n) => ({
                      value: String(n),
                      label: `${n} Questions`,
                    }))}
                    disabled={isSubmitting}
                    onChange={(e) =>
                      onLightningQuestionCountChange(Number(e.target.value))
                    }
                    aria-label="Total questions"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Live room leaderboard updates after every question.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="mt-6 sm:mt-8 flex flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="group inline-flex h-10 sm:h-11 flex-1 items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-border bg-card px-3.5 sm:px-4 text-xs font-bold text-muted-foreground shadow-2xs transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-95 disabled:opacity-40 cursor-pointer"
          title="Go back"
          aria-label="Go back"
        >
          <ArrowLeftSVG className="size-4 sm:size-4.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back</span>
        </button>

        <AppButton
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmitAttempt}
          className="h-10 sm:h-11 flex-1 gap-2 rounded-xl bg-primary px-4 sm:px-6 text-xs sm:text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-101 active:scale-98 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Preparing Exam...</span>
            </>
          ) : (
            <>
              <span>{getSubmitButtonLabel()}</span>
              <ArrowRightSVG className="size-4" />
            </>
          )}
        </AppButton>
      </div>
    </div>
  );
}