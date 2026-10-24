"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Zap,
  Send,
  Check,
  FileText,
  Globe,
  Lock,
  Sparkles,
  ExternalLink,
  BookOpen,
  AlertCircle,
  X,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getStoredTeacherDrafts,
  saveTeacherDrafts,
  deleteStoredDraft,
  startTeacherDraftGeneration,
  updateTeacherDraftSetQuestions,
  type TeacherPaperDraft,
} from "@/lib/teacher/teacher-drafts-store";
import AppButton from "@/components/AppButton";
import AppInput from "@/components/AppInput";
import AppDateTimePicker from "@/components/AppDateTimePicker";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppSelect from "@/components/AppSelect";
import TeacherPaperPreviewEditor from "@/components/teacher/TeacherPaperPreviewEditor";
import ArrowLeftSVG from "@/public/svgs/ArrowLeftSVG";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import ScrollSVG from "@/public/svgs/ScrollSVG";
import EditSVG from "@/public/svgs/EditSVG";
import P1SVG from "@/public/svgs/P1SVG";
import P2SVG from "@/public/svgs/P2SCG";
import ClassroomSVG from "@/public/svgs/ClassroomSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import GenerateSVG from "@/public/svgs/GenerateSVG";
import SecureExamSVG from "@/public/svgs/SecureExamSVG";
import ChapterMultiSelect from "@/components/generate/ChapterMultiSelect";
import GenerateCustomInputs, {
  type CustomUploadedImage,
  type CustomCreationType,
} from "@/components/generate/GenerateCustomInputs";
import ManualQuestionBuilder, {
  type ManualQuestionItem,
  createEmptyManualQuestion,
} from "@/components/custom-quiz/ManualQuestionBuilder";
import ChapterSloSelector from "@/components/generate/ChapterSloSelector";
import { FRONTEND_ROUTES, API_ENDPOINTS } from "@/constants/endpoints";
import { apiGet, apiPost } from "@/lib/api/api-client";
import { useTeacherClassrooms, type TeacherClassroomOption } from "@/hooks/teacher/useTeacherClassrooms";
import { getSubjectIcon } from "@/lib/generate/subject-icons";
import { cn } from "@/lib/utils";
import type { GeneratedSloPaperQuestion } from "@/lib/paper/slo-paper-generator";
import type { GeneratePaperChapter, PaperType } from "@/types/generate";

export type TeacherActivityType = "paper" | "lightning";
export type TeacherQuestionSource = "past_papers" | "slos" | "custom";

interface GenerateDraftResponse {
  generatedPaperId: string;
  questions: GeneratedSloPaperQuestion[];
  totalQuestions: number;
  totalMarks: number;
  source: string;
  suggestedTitle: string;
}

interface PublishResponse {
  id: string;
  title: string;
  label: string;
  classroomsCount?: number;
}

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

export default function TeacherCreatePaperPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classroomIdParam = searchParams.get("classroomId") || "";
  const paperTypeParam = searchParams.get("paperType");
  const chapterIdsParam = searchParams.get("chapterIds") || "";

  const classroomsQuery = useTeacherClassrooms();
  const classrooms: TeacherClassroomOption[] = useMemo(
    () => classroomsQuery.data ?? [],
    [classroomsQuery.data],
  );

  // Play & Prep 2-Step Flow:
  // Step 1: Activity Type (Practice Paper vs Lightning Round Arena)
  // Step 2: Unified Configure Step (Classroom, Source, Chapters, Format & Settings all-in-one)
  const [activeStep, setActiveStep] = useState<number>(1);

  // Single Classroom Selection
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(
    classroomIdParam ? decodeURIComponent(classroomIdParam) : null,
  );

  // Activity Type (Standard Paper vs Lightning Round) - not pre-selected by default
  const [activityType, setActivityType] = useState<TeacherActivityType | null>(null);

  // Question Source Mode
  const [sourceMode, setSourceMode] = useState<TeacherQuestionSource>("past_papers");

  // Custom Quiz Settings
  const [customCreationType, setCustomCreationType] = useState<CustomCreationType>("ai");
  const [customTitle, setCustomTitle] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [customImages, setCustomImages] = useState<CustomUploadedImage[]>([]);
  const [manualQuestions, setManualQuestions] = useState<ManualQuestionItem[]>([
    createEmptyManualQuestion(1),
  ]);

  // Standard Paper Parameters
  const [paperType, setPaperType] = useState<PaperType>(
    paperTypeParam === "2" ? "2" : "1",
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questionCount, setQuestionCount] = useState(25);
  const [setsCount, setSetsCount] = useState<number>(1);
  const [strictMode, setStrictMode] = useState(true);
  const [allowResume, setAllowResume] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [dueDate, setDueDate] = useState<string>("");
  const [difficulty, setDifficulty] = useState<"Alpha" | "Beta" | "Gamma">("Beta");

  // Lightning Round Parameters
  const [lightningTimer, setLightningTimer] = useState<number>(20);
  const [lightningQuestionCount, setLightningQuestionCount] = useState<number>(10);

  // Selected Classroom details (Subject & Class derived directly from selected classroom)
  const [board, setBoard] = useState("AKUEB");
  const [subject, setSubject] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [chapters, setChapters] = useState<GeneratePaperChapter[]>([]);
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [selectedSloNumbers, setSelectedSloNumbers] = useState<string[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);

  // Draft & Preview state
  const [isPreviewingDraft, setIsPreviewingDraft] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generatedPaperId, setGeneratedPaperId] = useState<string | null>(null);
  const [draftQuestions, setDraftQuestions] = useState<GeneratedSloPaperQuestion[]>([]);
  const [draftSets, setDraftSets] = useState<
    Array<{
      setLetter: string;
      setName: string;
      generatedPaperId: string;
      questions: GeneratedSloPaperQuestion[];
      title: string;
    }>
  >([]);
  const [activePreviewSetIndex, setActivePreviewSetIndex] = useState<number>(0);
  const [createdDraftId, setCreatedDraftId] = useState<string | null>(null);

  // Generation Queued Feedback Modal
  const [showQueuedModal, setShowQueuedModal] = useState(false);
  const [queueModalStatus, setQueueModalStatus] = useState<"queued" | "ready" | "failed">("queued");

  // Selected classroom object
  const selectedClassroom = useMemo(() => {
    return classrooms.find((c) => c.id === selectedClassroomId) || null;
  }, [classrooms, selectedClassroomId]);

  // Dropdown options formatted with subject, class, board, and PIN
  const classroomOptions = useMemo(() => {
    return classrooms.map((c) => {
      const rawName = c.name && !c.name.includes("__") ? c.name.trim() : "";
      const isDefaultName =
        !rawName ||
        rawName.toLowerCase() === `${c.subject} - class ${c.classLevel}`.toLowerCase();
      const pin = c.pinCode || c.pin;

      const label = isDefaultName
        ? `${c.subject} - Class ${c.classLevel} (${c.board || "AKUEB"}${pin ? ` · PIN: ${pin}` : ""})`
        : `${rawName} — ${c.subject} - Class ${c.classLevel} (${c.board || "AKUEB"}${pin ? ` · PIN: ${pin}` : ""})`;

      return {
        value: c.id,
        label,
      };
    });
  }, [classrooms]);

  const isSindh =
    (board || "").toLowerCase().includes("sindh") ||
    (board || "").toLowerCase().includes("karachi");

  const sourceOptions = useMemo(
    () => [
      {
        value: "past_papers" as const,
        label: "Past Papers Bank",
        badge: "Official Exam Board",
        hint: "Curated directly from verified past examination papers and official marking schemes.",
        icon: ScrollSVG,
      },
      {
        value: "slos" as const,
        label: isSindh ? "Syllabus AI Practice" : "Syllabus SLOs AI",
        badge: "Curriculum Aligned",
        hint: isSindh
          ? "AI-generated questions mapped directly to official syllabus topics."
          : "AI-generated questions mapped directly to official Student Learning Outcomes.",
        icon: BookOpenSVG,
      },
      {
        value: "custom" as const,
        label: "Custom Notes / Manual",
        badge: "Custom Teacher Notes",
        hint: "Generate from your custom prompts, uploaded textbook photos/notes, or build manually.",
        icon: EditSVG,
      },
    ],
    [isSindh],
  );

  const selectedSourceOption = useMemo(
    () => sourceOptions.find((s) => s.value === sourceMode) || sourceOptions[0],
    [sourceOptions, sourceMode],
  );

  const isCustom = sourceMode === "custom";
  const isSloMode = sourceMode === "slos";

  // Auto scroll to top on step change or preview toggle
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [activeStep, isPreviewingDraft]);

  // Pre-fill from URL params
  useEffect(() => {
    if (classroomIdParam && !selectedClassroomId) {
      const decoded = decodeURIComponent(classroomIdParam);
      setSelectedClassroomId(decoded);
    }
  }, [classroomIdParam, selectedClassroomId]);

  // When selected classroom changes, auto-derive subject, classLevel, and board
  useEffect(() => {
    if (selectedClassroom) {
      setSubject(selectedClassroom.subject);
      setClassLevel(selectedClassroom.classLevel);
      if (selectedClassroom.board) {
        setBoard(selectedClassroom.board);
      }
    } else if (classrooms.length > 0 && !selectedClassroomId) {
      const first = classrooms[0];
      setSelectedClassroomId(first.id);
      setSubject(first.subject);
      setClassLevel(first.classLevel);
      if (first.board) setBoard(first.board);
    }
  }, [selectedClassroom, classrooms, selectedClassroomId]);

  // Load chapters whenever subject / classLevel / paperType changes
  useEffect(() => {
    if (!subject || !classLevel || !board) return;
    let isCancelled = false;

    const fetchChapters = async () => {
      setLoadingChapters(true);
      try {
        const res = await apiGet<GeneratePaperChapter[]>(
          `${API_ENDPOINTS.STUDENT.GENERATE_PAPER_CHAPTERS}?subject=${encodeURIComponent(
            subject,
          )}&class=${encodeURIComponent(classLevel)}&board=${encodeURIComponent(board)}&paperType=${paperType}`,
        );
        if (!isCancelled && res.success && Array.isArray(res.data)) {
          setChapters(res.data);
        }
      } catch (err) {
        console.error("Failed to load chapters:", err);
      } finally {
        if (!isCancelled) setLoadingChapters(false);
      }
    };

    void fetchChapters();
    return () => {
      isCancelled = true;
    };
  }, [subject, classLevel, board, paperType]);

  // Pre-fill selected chapters from URL param
  useEffect(() => {
    if (!chapterIdsParam) return;
    const wanted = chapterIdsParam
      .split(",")
      .map((s) => decodeURIComponent(s.trim()))
      .filter(Boolean);
    if (wanted.length === 0 || chapters.length === 0) return;
    const available = new Set(chapters.map((c) => c.id));
    const valid = wanted.filter((id) => available.has(id));
    if (valid.length === 0) return;
    setSelectedChapterIds((prev) => Array.from(new Set([...prev, ...valid])));
  }, [chapterIdsParam, chapters]);

  // Classroom selection (Single select)
  const handleSelectClassroom = (id: string) => {
    setSelectedClassroomId(id);
    const cl = classrooms.find((c) => c.id === id);
    if (cl) {
      const subjectChanged = cl.subject.toLowerCase() !== subject.toLowerCase();
      const classChanged = cl.classLevel.toLowerCase() !== classLevel.toLowerCase();
      setSubject(cl.subject);
      setClassLevel(cl.classLevel);
      if (cl.board) setBoard(cl.board);

      if (subjectChanged || classChanged) {
        setSelectedChapterIds([]);
        setSelectedSloNumbers([]);
      }
    }
  };

  const toggleChapter = (chapterId: string) => {
    setSelectedChapterIds((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId],
    );
  };

  const selectAllChapters = () => {
    setSelectedChapterIds(chapters.map((c) => c.id));
  };

  const clearChapters = () => {
    setSelectedChapterIds([]);
  };

  const handleSelectActivity = (type: TeacherActivityType) => {
    setActivityType(type);
    setActiveStep(2);
  };

  // Reactive sync for draft generation: monitors background queue completion
  useEffect(() => {
    if (!createdDraftId || !selectedClassroomId || !generating || isPreviewingDraft) return;

    let isDone = false;

    const syncDraftState = () => {
      if (isDone || isPreviewingDraft) return;

      const drafts = getStoredTeacherDrafts(selectedClassroomId);
      const targetDraft = drafts.find((d) => d.id === createdDraftId);
      if (!targetDraft) return;

      const readySets = targetDraft.sets.filter(
        (s) => s.status === "ready" && Array.isArray(s.questions) && s.questions.length > 0,
      );

      if (readySets.length > 0) {
        setDraftSets(
          targetDraft.sets.map((s) => ({
            setLetter: s.setLetter,
            setName: s.setName,
            generatedPaperId: s.generatedPaperId || "",
            questions: s.questions || [],
            title: s.title,
          })),
        );
        if (readySets[0]?.questions && readySets[0].questions.length > 0) {
          setDraftQuestions(readySets[0].questions);
          setGeneratedPaperId(readySets[0].generatedPaperId || "");
        }
      }

      if (
        targetDraft.status === "ready" ||
        targetDraft.status === "partial_failed" ||
        targetDraft.status === "failed"
      ) {
        isDone = true;
        setGenerating(false);
        setQueueModalStatus(targetDraft.status === "failed" ? "failed" : "ready");
      }
    };

    syncDraftState();
    const interval = setInterval(() => {
      if (isDone || isPreviewingDraft) {
        clearInterval(interval);
        return;
      }
      syncDraftState();
    }, 1500);

    const onDraftsChanged = (e: Event) => {
      if (isDone || isPreviewingDraft) return;
      const customEvent = e as CustomEvent<{ classroomId?: string }>;
      if (
        !customEvent.detail?.classroomId ||
        customEvent.detail.classroomId === selectedClassroomId
      ) {
        syncDraftState();
      }
    };

    window.addEventListener("exboard_teacher_drafts_changed", onDraftsChanged);
    window.addEventListener("storage", syncDraftState);

    return () => {
      clearInterval(interval);
      window.removeEventListener("exboard_teacher_drafts_changed", onDraftsChanged);
      window.removeEventListener("storage", syncDraftState);
    };
  }, [createdDraftId, selectedClassroomId, generating, isPreviewingDraft]);

  // Generate Draft for Standard Practice Test
  const handleGenerateDraft = async () => {
    if (!selectedClassroomId) {
      toast.error("Please select a classroom to assign this paper to");
      return;
    }

    if (isCustom) {
      if (!customTitle.trim()) {
        toast.error("Enter a quiz or paper title");
        return;
      }
      if (customCreationType === "manual") {
        const invalid = manualQuestions.some(
          (q) => !q.questionText.trim() || q.options.some((o) => !o.text.trim()),
        );
        if (invalid) {
          toast.error("Please fill in all questions and options for manual creation");
          return;
        }
      } else {
        const hasImages = customImages.length > 0;
        const hasPrompt = Boolean(customPrompt && customPrompt.trim());
        if (!hasImages && !hasPrompt) {
          toast.error("Upload at least one reference image or enter a prompt");
          return;
        }
      }
    } else {
      if (selectedChapterIds.length === 0) {
        toast.error("Select at least one chapter");
        return;
      }
    }

    const effectiveSubject =
      isCustom && customTitle.trim() ? customTitle.trim() : subject;
    const baseTitle = (isCustom ? customTitle : title).trim();
    const chObj =
      selectedChapterIds.length === 1
        ? chapters.find((c) => c.id === selectedChapterIds[0])
        : null;

    const resolvedChapterName = chObj
      ? chObj.chapterName
      : selectedChapterIds.length > 1
        ? `${selectedChapterIds.length} Syllabus Chapters`
        : baseTitle || effectiveSubject;

    const numSetsToGenerate = Math.max(1, setsCount || 1);

    // Synchronously create and persist draft into localStorage so it is IMMEDIATELY available
    // in the classroom Drafts tab even if the teacher navigates away right away.
    const newStoredDraft = startTeacherDraftGeneration({
      classroomId: selectedClassroomId,
      chapterId: selectedChapterIds[0] || "",
      chapterNumber: chObj?.chapterNumber || 0,
      chapterName: resolvedChapterName,
      chapterIds: isCustom ? [] : selectedChapterIds,
      subject: effectiveSubject,
      classLevel: classLevel || "IX",
      board,
      paperType,
      difficulty: sourceMode !== "past_papers" ? difficulty : undefined,
      questionCount:
        customCreationType === "manual" && isCustom
          ? manualQuestions.length
          : questionCount,
      setsCount: numSetsToGenerate,
      sloNumbers:
        isSloMode && selectedSloNumbers.length > 0 ? selectedSloNumbers : undefined,
      mode: sourceMode,
      title: baseTitle || undefined,
      description: description.trim() || undefined,
      prompt: customPrompt,
      imageUrls: customImages.map((img) => img.fileUrl),
      manualQuestions:
        customCreationType === "manual" && isCustom ? manualQuestions : undefined,
      isPublic,
      dueDate: dueDate || undefined,
    });

    setCreatedDraftId(newStoredDraft.id);
    setGenerating(true);
    setQueueModalStatus("queued");
    setShowQueuedModal(true);

    if (customCreationType === "manual" && isCustom) {
      toast.success("Manual practice test draft saved to Drafts!");
    } else {
      toast.success(
        numSetsToGenerate > 1
          ? `Generating ${numSetsToGenerate} variant sets in background! Viewable in Drafts.`
          : `Generating practice test draft in background! Viewable in Drafts.`,
        { icon: "🚀" },
      );
    }
  };

  // Publish Practice Test to the classroom
  const handlePublish = async () => {
    if (!selectedClassroomId) {
      toast.error("Select a classroom to assign this paper to");
      return;
    }

    const setsToPublish =
      draftSets.length > 0
        ? draftSets
        : [
            {
              setLetter: "A",
              setName: "Standard Test",
              generatedPaperId: generatedPaperId || "",
              questions: draftQuestions,
              title:
                (isCustom ? customTitle : title).trim() ||
                `${subject} Practice Test`,
            },
          ];

    if (setsToPublish.some((s) => s.questions.length === 0)) {
      toast.error("Add at least one question before publishing");
      return;
    }

    setPublishing(true);
    const toastId = toast.loading(
      setsToPublish.length > 1
        ? `Publishing ${setsToPublish.length} variant sets to ${selectedClassroom?.name || "classroom"}…`
        : `Publishing to ${selectedClassroom?.name || "classroom"}…`,
    );

    try {
      for (const setItem of setsToPublish) {
        const res = await apiPost<PublishResponse>(API_ENDPOINTS.TEACHER.PAPERS, {
          action: "publish",
          classroomId: selectedClassroomId,
          classroomIds: [selectedClassroomId],
          generatedPaperId: setItem.generatedPaperId,
          title: setItem.title,
          description:
            description.trim() || "Practice Test assigned by your teacher",
          paperType,
          subject:
            isCustom && customTitle.trim() ? customTitle.trim() : subject,
          classLevel: classLevel || "IX",
          board,
          chapterIds: isCustom ? [] : selectedChapterIds,
          questions: setItem.questions,
          strictMode,
          allowResume,
          dueDate: dueDate || undefined,
        });

        if (!res.success) {
          throw new Error(
            res.message || `Failed to publish ${setItem.setName}`,
          );
        }
      }

      // If draft was previously saved in drafts store, remove it since it's published now
      if (createdDraftId && selectedClassroomId) {
        deleteStoredDraft(createdDraftId, selectedClassroomId);
      }

      toast.success(
        setsToPublish.length > 1
          ? `All ${setsToPublish.length} variant sets published & assigned to ${selectedClassroom?.name || "classroom"}! 🎉`
          : `Practice Test published & assigned to ${selectedClassroom?.name || "classroom"}! 🎉`,
        { id: toastId },
      );

      router.push(FRONTEND_ROUTES.TEACHER_CLASSROOM(selectedClassroomId));
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to publish Practice Test";
      toast.error(message, { id: toastId });
    } finally {
      setPublishing(false);
    }
  };

  // Launch Lightning Round Arena
  const handleLaunchLightning = async () => {
    if (!selectedClassroomId) {
      toast.error("Please select a classroom to host this arena for");
      return;
    }
    if (!subject || !classLevel) {
      toast.error("Subject and Class Level are required");
      return;
    }

    if (isCustom) {
      if (!customTitle.trim()) {
        toast.error("Enter a quiz or paper title");
        return;
      }
      if (customCreationType === "manual") {
        const invalid = manualQuestions.some(
          (q) => !q.questionText.trim() || q.options.some((o) => !o.text.trim()),
        );
        if (invalid) {
          toast.error("Please fill in all manual questions and options");
          return;
        }
      } else if (!customImages.length && !customPrompt.trim()) {
        toast.error("Provide a prompt or reference image for AI generation");
        return;
      }
    } else if (selectedChapterIds.length === 0) {
      toast.error("Please select at least one chapter");
      return;
    }

    setGenerating(true);
    const toastId = toast.loading("Launching live Lightning Round lobby & notifying classroom…");

    try {
      const sessionTitle =
        (isCustom ? customTitle : title).trim() || `${subject} Lightning Round`;

      const res = await apiPost<{
        sessionId: string;
        pinCode: string;
      }>("/lightning/create", {
        title: sessionTitle,
        subject: isCustom && customTitle.trim() ? customTitle.trim() : subject,
        classLevel: classLevel || "IX",
        board,
        sourceMode: isCustom
          ? customCreationType === "manual"
            ? "manual"
            : "custom_ai"
          : sourceMode,
        perQuestionSeconds: lightningTimer,
        difficulty: sourceMode !== "past_papers" ? difficulty : undefined,
        chapterIds: isCustom ? [] : selectedChapterIds,
        sloNumbers: isSloMode && selectedSloNumbers.length > 0 ? selectedSloNumbers : undefined,
        prompt: customPrompt,
        imageUrls: customImages.map((img) => img.fileUrl),
        manualQuestions: isCustom && customCreationType === "manual" ? manualQuestions : undefined,
        classroomIds: [selectedClassroomId],
        classroomId: selectedClassroomId,
        questionCount:
          isCustom && customCreationType === "manual"
            ? manualQuestions.length
            : lightningQuestionCount,
      });

      if (!res.success || !res.data?.sessionId) {
        throw new Error(res.message || "Failed to create Lightning Round");
      }

      toast.success(
        `Lightning Arena launched! In-app alerts sent to ${selectedClassroom?.name || "classroom"}!`,
        { id: toastId },
      );

      router.push(`/teacher/lightning/${res.data.sessionId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to launch Lightning Round";
      toast.error(msg, { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleStepBack = () => {
    if (isPreviewingDraft) {
      setIsPreviewingDraft(false);
      return;
    }
    if (activeStep > 1) {
      setActiveStep(1);
    } else {
      router.back();
    }
  };

  const handleSwitchPreviewSet = (newIndex: number) => {
    if (newIndex === activePreviewSetIndex) return;
    // Persist current edits to active set before switching
    const updatedSets = draftSets.map((s, idx) =>
      idx === activePreviewSetIndex ? { ...s, questions: draftQuestions } : s,
    );
    setDraftSets(updatedSets);
    if (createdDraftId && selectedClassroomId && draftSets[activePreviewSetIndex]) {
      const activeSet = draftSets[activePreviewSetIndex];
      updateTeacherDraftSetQuestions(
        createdDraftId,
        selectedClassroomId,
        activeSet.setLetter,
        draftQuestions,
        activeSet.title,
      );
    }
    setActivePreviewSetIndex(newIndex);
    const targetSet = updatedSets[newIndex];
    if (targetSet) {
      setDraftQuestions(targetSet.questions);
      setGeneratedPaperId(targetSet.generatedPaperId);
    }
  };

  // If in Preview & Edit mode for standard draft
  if (isPreviewingDraft) {
    const totals = {
      count: draftQuestions.length,
      marks: draftQuestions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0),
    };

    return (
      <PageContainer className="w-full max-w-6xl space-y-6 pb-24 animate-in fade-in duration-200 sm:pb-32">
        <div className="flex flex-col gap-3.5 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsPreviewingDraft(false)}
              className="group flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-2xs transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-95 cursor-pointer"
              title="Return to configuration"
              aria-label="Return to configuration"
            >
              <ArrowLeftSVG className="size-4 sm:size-5 transition-transform group-hover:-translate-x-0.5" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary whitespace-nowrap">
                  Draft Preview & Edit
                </span>
                <span className="text-[10px] font-bold text-muted-foreground truncate">
                  {selectedClassroom?.name || `${subject} Class ${classLevel}`}
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-foreground truncate mt-0.5">
                {draftSets[activePreviewSetIndex]?.title || title || `${subject} Practice Test`}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0">
            <AppButton
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewingDraft(false)}
              disabled={publishing}
              className="h-10 rounded-xl px-3 sm:px-4 text-xs font-bold justify-center"
            >
              Edit Settings
            </AppButton>
            <AppButton
              onClick={handlePublish}
              size="sm"
              disabled={publishing}
              className="h-10 rounded-xl px-4 sm:px-6 text-xs font-black uppercase tracking-wider shadow-md active:scale-95 justify-center"
            >
              <Send className="size-3.5 mr-1" />
              {publishing
                ? "Publishing…"
                : draftSets.length > 1
                  ? `Publish ${draftSets.length} Sets`
                  : `Publish Test`}
            </AppButton>
          </div>
        </div>

        {/* Paper Meta Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
              {paperType === "2" ? <P2SVG className="size-3.5" /> : <P1SVG className="size-3.5" />}
              Paper {paperType}
            </span>
            {draftSets.length > 1 && (
              <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                {draftSets.length} Variant Sets
              </span>
            )}
            <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
              {totals.count} Questions {draftSets.length > 1 ? `(${draftSets[activePreviewSetIndex]?.setName || "Active Set"})` : ""}
            </span>
            <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
              {totals.marks} Total Marks
            </span>
            <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
              {sourceMode === "past_papers"
                ? "Past Papers Bank"
                : isSloMode
                  ? "Syllabus SLOs AI"
                  : "Custom Teacher Notes"}
            </span>
            {strictMode && (
              <span className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                Strict Exam Mode
              </span>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            Target: <span className="font-bold text-foreground">{selectedClassroom?.name || "Classroom"}</span>
          </div>
        </div>

        {/* Multi-Set Variant Tabs when multiple sets exist */}
        {draftSets.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/80 bg-card p-3 shadow-2xs">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-primary" />
              Variant Sets:
            </span>
            {draftSets.map((s, idx) => {
              const isSelected = activePreviewSetIndex === idx;
              return (
                <button
                  key={s.setLetter}
                  type="button"
                  onClick={() => handleSwitchPreviewSet(idx)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-black transition-all cursor-pointer",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs ring-1 ring-primary/30"
                      : "border border-border/70 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <span>{s.setName}</span>
                  <span
                    className={cn(
                      "text-[10px] rounded-md px-1.5 py-0.5 font-bold",
                      isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {s.questions.length} Qs
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Question Editor */}
        <TeacherPaperPreviewEditor
          paperType={paperType}
          questions={draftQuestions}
          subject={isCustom && customTitle.trim() ? customTitle.trim() : subject}
          classLevel={classLevel || "IX"}
          board={board || "AKUEB"}
          onChange={(newQuestions) => {
            setDraftQuestions(newQuestions);
            if (draftSets.length > 0) {
              setDraftSets((prev) =>
                prev.map((s, idx) =>
                  idx === activePreviewSetIndex
                    ? { ...s, questions: newQuestions }
                    : s,
                ),
              );
              if (createdDraftId && selectedClassroomId && draftSets[activePreviewSetIndex]) {
                const activeSet = draftSets[activePreviewSetIndex];
                updateTeacherDraftSetQuestions(
                  createdDraftId,
                  selectedClassroomId,
                  activeSet.setLetter,
                  newQuestions,
                  activeSet.title,
                );
              }
            }
          }}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="w-full max-w-6xl space-y-6 pb-24 sm:space-y-8 sm:pb-32">
      <PageHeader
        title="Create Paper"
        description="Assign practice tests or broadcast live Lightning Round arenas to your classroom."
        watermark="TEACHER STUDIO"
        showWatermark={true}
        showLine={true}
      />

      {/* ================= STEP 1: ACTIVITY TYPE SELECTION (PLAY & PREP PRIMARY BG CARDS) ================= */}
      {activeStep === 1 && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
                Step 1 of 2
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Choose Activity Type
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Select whether you want to assign a structured paper or broadcast a live real-time quiz arena
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {[
              {
                id: "paper" as const,
                title: "Practice Test / Paper",
                badge: "Structured Quiz",
                description:
                  "Assign a Paper 1 (MCQs) or Paper 2 (Theory) exam directly to the classroom with optional draft review & scoring.",
                icon: BookOpenSVG,
                features: [
                  "Direct classroom homework / test assignment",
                  "Option of Paper 1 (MCQs) or Paper 2 (Theory)",
                  "Interactive draft question editor prior to publish",
                ],
              },
              {
                id: "lightning" as const,
                title: "Lightning Round Arena",
                badge: "Live Real-Time",
                description:
                  "Host an energetic synchronized live quiz with 6-digit PIN. All enrolled students receive instant alerts!",
                icon: Zap,
                features: [
                  "Live synchronous timer (10s – 30s per question)",
                  "Instant notification broadcast to enrolled students",
                  "Live podium, speed bonus points & class leaderboard",
                ],
              },
            ].map((opt) => {
              const isSelected = activityType === opt.id;
              const Icon = opt.icon;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectActivity(opt.id)}
                  className={cn(
                    "group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-primary p-6 sm:p-7 text-left text-primary-foreground shadow-lg transition-all duration-300 select-none cursor-pointer active:scale-[0.99]",
                    isSelected
                      ? "ring-3 ring-white/95 shadow-2xl scale-[1.01] brightness-105"
                      : "opacity-90 hover:opacity-100 hover:-translate-y-1.5 hover:shadow-2xl hover:brightness-105 ring-1 ring-white/20",
                  )}
                >
                  {/* Ambient Lighting & Watermark Glows */}
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                    <div className="absolute inset-0 bg-linear-to-br from-primary via-primary to-primary-dark" />
                    <div className="absolute -right-8 -top-10 size-48 rounded-full bg-primary-foreground/10 blur-3xl transition-colors duration-700 group-hover:bg-primary-foreground/15" />
                    <div className="absolute -bottom-12 -left-8 size-40 rounded-full bg-primary-foreground/5 blur-2xl" />

                    <Icon
                      aria-hidden
                      className="pointer-events-none absolute -right-4 -top-2 size-36 text-primary-foreground/10 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6 sm:size-40"
                    />
                    <Icon
                      aria-hidden
                      className="pointer-events-none absolute -bottom-6 -left-4 size-24 text-primary-foreground/10 sm:size-28"
                    />
                  </div>

                  <div className="relative z-10">
                    {/* Header: Icon + Badge + Selected Ring */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex size-13 sm:size-14 items-center justify-center rounded-2xl bg-primary-foreground/15 ring-1 ring-primary-foreground/25 backdrop-blur-sm shadow-md transition-transform duration-500 group-hover:scale-105">
                        <Icon className="size-6 sm:size-7 text-primary-foreground" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white backdrop-blur-xs ring-1 ring-white/30 shadow-xs">
                          {opt.badge}
                        </span>
                        {isSelected && (
                          <span className="flex size-6 items-center justify-center rounded-full bg-white text-primary shadow-xs ring-2 ring-white/40">
                            <Check className="size-3.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="mt-5 text-xl sm:text-2xl font-black tracking-tight text-primary-foreground">
                      {opt.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm font-medium leading-relaxed text-primary-foreground/85">
                      {opt.description}
                    </p>

                    {/* Feature Bullets */}
                    <ul className="mt-5 space-y-2 border-t border-white/20 pt-4">
                      {opt.features.map((f, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2.5 text-xs font-semibold text-primary-foreground/90"
                        >
                          <span className="size-1.5 rounded-full bg-white ring-2 ring-white/30 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bottom CTA Arrow */}
                  <div className="relative z-10 mt-6 flex items-center justify-between pt-2">
                    <span className="text-xs font-black uppercase tracking-wider text-primary-foreground/90 transition-colors group-hover:text-primary-foreground">
                      Continue
                    </span>
                    <div className="flex items-center gap-1.5 rounded-full bg-primary-foreground px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-primary shadow-md transition-transform duration-300 group-hover:scale-105">
                      <span>Continue</span>
                      <ArrowRightSVG className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= STEP 2: UNIFIED CONFIGURE STEP (PLAY & PREP DROPDOWN & CLEAN UX) ================= */}
      {activeStep === 2 && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
          {/* Header & Back Action */}
          <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3 sm:pb-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                disabled={generating}
                className="group flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-2xs transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-95 disabled:opacity-40 cursor-pointer"
                title="Back to Activity Type"
                aria-label="Back to Activity Type"
              >
                <ArrowLeftSVG className="size-4.5 sm:size-5 transition-transform group-hover:-translate-x-0.5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-primary">
                    {activityType === "lightning" ? "Live Arena" : "Practice Paper"}
                  </span>
                </div>
                <h2 className="text-base sm:text-xl font-extrabold tracking-tight text-foreground leading-tight mt-0.5">
                  Configure {activityType === "lightning" ? "Live Arena" : "Practice Paper"}
                </h2>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Classroom, source, chapters &amp; settings — all in one clean step
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* SECTION 1: TARGET CLASSROOM */}
            <div className="space-y-3">
              <SectionLabel step={1} title="Target Classroom" />
              {classrooms.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-6 text-center">
                  <ClassroomSVG className="mx-auto mb-2 size-8 text-primary" />
                  <p className="font-bold text-foreground">No classrooms created yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Create a classroom first to assign papers and broadcast live arenas.
                  </p>
                  <AppButton
                    onClick={() => router.push(FRONTEND_ROUTES.TEACHER_CLASSROOMS)}
                    className="mt-4 rounded-xl px-5 text-xs font-bold"
                  >
                    Create Classroom
                  </AppButton>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <AppSelect
                    id="create-paper-classroom-select"
                    searchable
                    value={selectedClassroomId || ""}
                    options={classroomOptions}
                    placeholder="Select a classroom..."
                    onChange={(e) => handleSelectClassroom(e.target.value)}
                    className="w-full text-sm font-semibold"
                  />

                  {selectedClassroom && (
                    <div className="flex items-center gap-3.5 rounded-2xl border border-primary/30 bg-primary/5 p-3.5 sm:p-4 shadow-xs animate-in fade-in duration-200">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                        {React.createElement(getSubjectIcon(selectedClassroom.subject), {
                          className: "size-6",
                        })}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-black uppercase text-primary">
                            Class {selectedClassroom.classLevel}
                          </span>
                          <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                            {selectedClassroom.board || "AKUEB"}
                          </span>
                          {Boolean(selectedClassroom.pinCode || selectedClassroom.pin) && (
                            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                              PIN: {selectedClassroom.pinCode || selectedClassroom.pin}
                            </span>
                          )}
                        </div>
                        <h4 className="mt-1 truncate font-bold text-foreground">
                          {selectedClassroom.name && !selectedClassroom.name.includes("__")
                            ? selectedClassroom.name
                            : `${selectedClassroom.subject} - Class ${selectedClassroom.classLevel}`}
                        </h4>
                        <p className="truncate text-xs text-muted-foreground">
                          {selectedClassroom.subject} · {selectedClassroom.schoolName || "ExBoard Classroom"}
                        </p>
                      </div>

                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                        <Check className="size-3.5 stroke-[3]" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 2: QUESTION SOURCE DROPDOWN */}
            <div className="space-y-3">
              <SectionLabel step={2} title="Question Source" />
              <div className="space-y-2.5">
                <AppSelect
                  id="create-paper-source-select"
                  value={sourceMode}
                  options={sourceOptions.map((s) => ({
                    value: s.value,
                    label: `${s.label} (${s.badge})`,
                  }))}
                  placeholder="Select question source..."
                  onChange={(e) => setSourceMode(e.target.value as TeacherQuestionSource)}
                  className="w-full text-sm font-semibold"
                />

                {/* Selected Source Feature Summary Card */}
                {selectedSourceOption && (
                  <div className="flex items-center gap-3.5 rounded-2xl border border-primary/30 bg-primary/5 p-3.5 sm:p-4 shadow-xs animate-in fade-in duration-200">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                      {React.createElement(selectedSourceOption.icon, {
                        className: "size-6",
                      })}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-black uppercase text-primary">
                          {selectedSourceOption.badge}
                        </span>
                      </div>
                      <h4 className="mt-1 truncate font-bold text-foreground">
                        {selectedSourceOption.label}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {selectedSourceOption.hint}
                      </p>
                    </div>

                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                      <Check className="size-3.5 stroke-[3]" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3: CHAPTERS OR CUSTOM MATERIALS */}
            {isCustom ? (
              <div className="space-y-4 rounded-3xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <SectionLabel step={3} title="Quiz Materials" />
                  <div className="inline-flex rounded-xl border border-border/80 bg-background/80 p-1">
                    <button
                      type="button"
                      disabled={generating}
                      onClick={() => setCustomCreationType("ai")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer",
                        customCreationType === "ai"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <SparklesSVG className="size-3.5" />
                      <span>AI Prompt</span>
                    </button>
                    <button
                      type="button"
                      disabled={generating}
                      onClick={() => setCustomCreationType("manual")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer",
                        customCreationType === "manual"
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
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Quiz / Paper Title *
                  </label>
                  <AppInput
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder={`e.g. ${subject || "Class"} Mid-Term Mock`}
                    className="h-11 rounded-xl bg-background text-sm"
                    disabled={generating}
                  />
                </div>

                {customCreationType === "manual" ? (
                  <ManualQuestionBuilder
                    questions={manualQuestions}
                    onChange={setManualQuestions}
                    disabled={generating}
                  />
                ) : (
                  <GenerateCustomInputs
                    creationType={customCreationType}
                    onCreationTypeChange={setCustomCreationType}
                    prompt={customPrompt}
                    onPromptChange={setCustomPrompt}
                    images={customImages}
                    onImagesChange={setCustomImages}
                    disabled={generating}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <SectionLabel step={3} title="Syllabus Chapters" />

                {!subject ? (
                  <p className="rounded-xl border border-dashed border-border bg-background/40 px-4 py-3 text-xs text-muted-foreground">
                    Select a classroom above to load its curriculum chapters.
                  </p>
                ) : loadingChapters ? (
                  <div className="flex h-12 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span>Loading syllabus chapters for {subject} Class {classLevel}…</span>
                  </div>
                ) : chapters.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border bg-background/40 px-4 py-3 text-xs text-muted-foreground">
                    No chapters found for {subject} Class {classLevel}.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <ChapterMultiSelect
                      chapters={chapters}
                      selectedIds={selectedChapterIds}
                      loading={loadingChapters}
                      disabled={generating}
                      onToggle={toggleChapter}
                      onSelectAll={selectAllChapters}
                      onClear={clearChapters}
                    />

                    {/* Selected Chapter Chips */}
                    {selectedChapterIds.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {selectedChapterIds.slice(0, 6).map((id) => {
                          const ch = chapters.find((c) => c.id === id);
                          if (!ch) return null;
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-primary"
                            >
                              <span>
                                Ch {ch.chapterNumber}: {ch.chapterName}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleChapter(id)}
                                className="text-primary/70 hover:text-primary cursor-pointer"
                                aria-label={`Remove chapter ${ch.chapterNumber}`}
                              >
                                <X className="size-3" />
                              </button>
                            </span>
                          );
                        })}
                        {selectedChapterIds.length > 6 && (
                          <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                            +{selectedChapterIds.length - 6} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Dedicated SLOs Selector when in SLOs mode */}
                    {isSloMode && selectedChapterIds.length > 0 && (
                      <div className="pt-2">
                        <ChapterSloSelector
                          chapters={chapters}
                          selectedChapterIds={selectedChapterIds}
                          selectedSloNumbers={selectedSloNumbers}
                          onChangeSelectedSlos={setSelectedSloNumbers}
                          title={isSindh ? "Target Specific Syllabus Topics (Optional)" : "Target Specific SLOs (Optional)"}
                          description={
                            isSindh
                              ? "Select specific syllabus topics to test, or leave as default to test all topics across the chosen chapters"
                              : "Select specific learning outcomes to test, or leave as default to test all SLOs across the chosen chapters"
                          }
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 4: DIFFICULTY LEVEL (Shown for SLOs and custom modes) */}
            {sourceMode !== "past_papers" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <SectionLabel step={4} title="Difficulty Level" />
                  <span className="text-[11px] font-bold text-primary">Target Cognitive Tier</span>
                </div>
                <div className="grid grid-cols-1 min-[400px]:grid-cols-3 gap-2.5">
                  {(["Alpha", "Beta", "Gamma"] as const).map((tier) => {
                    const colorMap = {
                      Alpha: {
                        ring: "border-primary bg-primary/10 ring-primary/30",
                        badge: "bg-primary/15 text-primary",
                        check: "bg-primary",
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
                        onClick={() => setDifficulty(tier)}
                        className={cn(
                          "p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer",
                          isSelected
                            ? `${c.ring} shadow-xs ring-1`
                            : "border-border/70 bg-muted/20 hover:border-border hover:bg-muted/40",
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

            {/* SECTION 5: FORMAT & PARAMETERS (PRACTICE TEST VS LIGHTNING ARENA) */}
            {activityType === "paper" ? (
              <div className="space-y-5 rounded-3xl border border-border/70 bg-card p-4 sm:p-6 shadow-xs">
                <div className="flex items-center gap-2">
                  <SectionLabel step={sourceMode === "past_papers" ? 4 : 5} title="Paper Format & Settings" />
                </div>

                {/* Exam Format Type (Paper 1 vs Paper 2) */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Exam Format Type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        value: "1" as const,
                        label: "Paper I · MCQ",
                        sub: "Instant auto-grading & scoring",
                        icon: P1SVG,
                      },
                      {
                        value: "2" as const,
                        label: "Paper II · Theory",
                        sub: "CRQ & ERQ constructed responses",
                        icon: P2SVG,
                      },
                    ].map((p) => {
                      const Icon = p.icon;
                      const isSelected = paperType === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          disabled={generating}
                          onClick={() => setPaperType(p.value)}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all cursor-pointer",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground shadow-xs"
                              : "border-border/70 bg-card text-muted-foreground hover:border-border hover:text-foreground hover:bg-muted/30",
                          )}
                        >
                          <div
                            className={cn(
                              "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-primary/10 text-primary",
                            )}
                          >
                            <Icon className="size-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="block text-xs font-black">{p.label}</span>
                            <span
                              className={cn(
                                "block text-[10px] mt-0.5",
                                isSelected
                                  ? "text-primary-foreground/80"
                                  : "text-muted-foreground",
                              )}
                            >
                              {p.sub}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="size-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                              <Check className="size-3 stroke-[3] text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Question Count Pills */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Question Count
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[10, 15, 25, 30].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        disabled={generating}
                        onClick={() => setQuestionCount(cnt)}
                        className={cn(
                          "rounded-xl border p-2.5 text-center text-xs font-black transition-all cursor-pointer",
                          questionCount === cnt
                            ? "border-primary bg-primary text-primary-foreground shadow-xs"
                            : "border-border/70 bg-muted/30 hover:bg-muted/60 text-foreground",
                        )}
                      >
                        {cnt} Questions
                      </button>
                    ))}
                  </div>
                </div>

                {/* Multi-Set Rotation (Number of Sets) */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between gap-2">
                    <span className="truncate">Number of Variant Sets</span>
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 text-[11px] font-bold text-muted-foreground">
                      <SecureExamSVG className="size-3.5 text-primary shrink-0" />
                      Anti-Cheating
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        disabled={generating}
                        onClick={() => setSetsCount(num)}
                        className={cn(
                          "rounded-xl border p-2.5 text-center text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-between gap-0.5",
                          setsCount === num
                            ? "border-primary bg-primary text-primary-foreground shadow-xs ring-1 ring-primary/30"
                            : "border-border/70 bg-muted/30 hover:bg-muted/60 text-foreground font-bold",
                        )}
                      >
                        <span className="block text-xs font-black">
                          {num} {num === 1 ? "Set" : "Sets"}
                        </span>
                        <span
                          className={cn(
                            "block text-[10px]",
                            setsCount === num
                              ? "text-primary-foreground/80 font-semibold"
                              : "text-muted-foreground font-medium",
                          )}
                        >
                          {num === 1
                            ? "Single"
                            : num === 2
                              ? "Set A & B"
                              : `Set A-${String.fromCharCode(64 + num)}`}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Enrolled students will receive randomized sets to foster authentic test completion.
                  </p>
                </div>

                {/* Title & Instructions */}
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                      Test Title
                    </label>
                    <AppInput
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={`${subject || "Class"} Practice Test`}
                      className="h-11 rounded-xl"
                      disabled={generating}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                      Instructions (Optional)
                    </label>
                    <AppInput
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Attempt all questions within 45 mins"
                      className="h-11 rounded-xl"
                      disabled={generating}
                    />
                  </div>
                </div>

                {/* Submission Deadline (Optional) */}
                <div className="space-y-1.5 border-t border-border/60 pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                      Submission Deadline (Optional)
                    </label>
                    {dueDate ? (
                      <button
                        type="button"
                        onClick={() => setDueDate("")}
                        className="text-[11px] font-bold text-destructive hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                  <AppDateTimePicker
                    value={dueDate}
                    onChange={setDueDate}
                    placeholder="Select deadline date & time"
                    disabled={generating}
                  />
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Optional. Students who submit after this deadline receive 50% fewer points.
                  </p>
                </div>

                {/* Anti-cheat Strict Mode & Allow Resume */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-border/60 pt-4">
                  <label className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3.5 cursor-pointer hover:bg-muted/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={strictMode}
                      onChange={(e) => setStrictMode(e.target.checked)}
                      className="size-4 accent-primary rounded cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-bold text-foreground">Strict Exam Mode</p>
                      <p className="text-[10px] text-muted-foreground">Fullscreen lock & anti-cheat tab-switching protection</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3.5 cursor-pointer hover:bg-muted/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={allowResume}
                      onChange={(e) => setAllowResume(e.target.checked)}
                      className="size-4 accent-primary rounded cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-bold text-foreground">Allow Resume</p>
                      <p className="text-[10px] text-muted-foreground">Permit students to pause and continue later</p>
                    </div>
                  </label>
                </div>

                {/* Papers Bank Visibility Option */}
                <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Globe className="size-4 text-primary" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                          Papers Bank Visibility
                        </h4>
                        <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[9px] font-black uppercase text-primary">
                          Public
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed max-w-xl">
                        {isPublic
                          ? "Public — This paper will be discoverable in the Papers Bank so students and other teachers can practice and reuse it directly."
                          : "Private — This paper will be private to your assigned classroom only."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 w-full sm:w-56 rounded-xl border border-border/80 bg-background p-1 shrink-0">
                      <button
                        type="button"
                        disabled={generating}
                        onClick={() => setIsPublic(true)}
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
                        disabled={generating}
                        onClick={() => setIsPublic(false)}
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

                {/* Configuration Summary Callout */}
                {questionCount && paperType && setsCount && (
                  <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <Sparkles className="size-4" />
                    </div>
                    <div className="text-xs font-medium text-foreground min-w-0">
                      <span className="font-bold text-primary">Summary: </span>
                      Will generate{" "}
                      <strong className="font-black text-foreground">
                        {setsCount} {setsCount === 1 ? "set" : "variant sets"}
                      </strong>{" "}
                      ({questionCount} {paperType === "1" ? "MCQs" : "CRQs"} each
                      {sourceMode !== "past_papers" && difficulty ? `, ${difficulty} Tier` : ""}).
                      {setsCount > 1 && (
                        <span>
                          {" "}
                          Each variant will be randomly assigned to classroom students to prevent cheating.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-5 rounded-3xl border border-border/70 bg-card p-4 sm:p-6 shadow-xs">
                <div className="flex items-center gap-2">
                  <SectionLabel step={sourceMode === "past_papers" ? 4 : 5} title="Arena Parameters" />
                </div>

                {/* Per-Question Timer */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Per-Question Timer Countdown
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[10, 20, 30].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        disabled={generating}
                        onClick={() => setLightningTimer(sec)}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-2xl border p-3 transition-all cursor-pointer",
                          lightningTimer === sec
                            ? "border-primary bg-primary/15 text-primary ring-2 ring-primary/30"
                            : "border-border/70 bg-muted/30 hover:bg-muted/60 text-foreground",
                        )}
                      >
                        <span className="text-lg font-black">{sec}s</span>
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {sec === 10 ? "Ultra Fast" : sec === 20 ? "Standard" : "Extended"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Count */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Question Count
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[5, 10, 15, 20].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        disabled={generating}
                        onClick={() => setLightningQuestionCount(cnt)}
                        className={cn(
                          "rounded-xl border p-2.5 text-center text-xs font-black transition-all cursor-pointer",
                          lightningQuestionCount === cnt
                            ? "border-primary bg-primary text-primary-foreground shadow-xs"
                            : "border-border/70 bg-muted/30 hover:bg-muted/60 text-foreground",
                        )}
                      >
                        {cnt} Questions
                      </button>
                    ))}
                  </div>
                </div>

                {/* Session Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Session Title
                  </label>
                  <AppInput
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={`${subject || "Class"} Live Lightning Round`}
                    className="h-11 rounded-xl"
                    disabled={generating}
                  />
                </div>
              </div>
            )}

            {/* BOTTOM ACTIONS BAR - 50/50 WIDTH */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/70 w-full">
              <AppButton
                variant="outline"
                onClick={() => setActiveStep(1)}
                className="h-11 w-full justify-center rounded-xl px-4 text-xs font-black uppercase tracking-wider"
                disabled={generating}
              >
                <ArrowLeftSVG className="size-4 mr-1.5 shrink-0" />
                Back
              </AppButton>
              <AppButton
                onClick={activityType === "lightning" ? handleLaunchLightning : handleGenerateDraft}
                disabled={generating}
                className={cn(
                  "h-11 w-full justify-center rounded-xl px-4 text-xs font-black uppercase tracking-wider shadow-md active:scale-95 cursor-pointer",
                  activityType === "lightning" && "bg-amber-600 hover:bg-amber-700 text-white",
                )}
              >
                {generating ? (
                  <>
                    <div className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-1.5 shrink-0" />
                    {activityType === "lightning"
                      ? "Launching…"
                      : "Generating…"}
                  </>
                ) : (
                  <>
                    {activityType === "lightning" ? (
                      <>
                        <Zap className="size-4 mr-1.5 fill-current shrink-0" />
                        Launch
                      </>
                    ) : (
                      <>
                        Generate
                        <ArrowRightSVG className="size-4 ml-1.5 shrink-0" />
                      </>
                    )}
                  </>
                )}
              </AppButton>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK MODAL FOR PAPER GENERATION */}
      {showQueuedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "flex size-12 items-center justify-center rounded-2xl shadow-xs",
                  queueModalStatus === "ready"
                    ? "bg-primary/15 text-primary"
                    : queueModalStatus === "failed"
                      ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      : "bg-primary/15 text-primary",
                )}
              >
                {queueModalStatus === "ready" ? (
                  <Check className="size-6 stroke-[3]" />
                ) : queueModalStatus === "failed" ? (
                  <AlertCircle className="size-6" />
                ) : (
                  <GenerateSVG className="size-6 text-primary animate-pulse" />
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowQueuedModal(false)}
                className="size-8 rounded-full border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div>
              <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
                {queueModalStatus === "ready"
                  ? "Draft Generation Complete"
                  : queueModalStatus === "failed"
                    ? "Generation Notice"
                    : "Queue Status"}
              </span>
              <h3 className="text-lg font-black text-foreground mt-2">
                {queueModalStatus === "ready"
                  ? draftSets.length > 1
                    ? `Practice Test (${draftSets.length} Sets) Ready!`
                    : "Practice Test Draft Ready!"
                  : queueModalStatus === "failed"
                    ? "Generation Issue"
                    : setsCount > 1
                      ? `Generating ${setsCount} Variant Sets`
                      : "Paper Generation Queued"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {queueModalStatus === "ready" ? (
                  <>
                    Your practice test draft with{" "}
                    {draftSets.length > 1 ? (
                      <span className="font-bold text-foreground">
                        {draftSets.length} variant sets ({draftSets.reduce((sum, s) => sum + s.questions.length, 0)} total questions)
                      </span>
                    ) : (
                      <span className="font-bold text-foreground">
                        {draftQuestions.length} questions
                      </span>
                    )}{" "}
                    is ready. You can review and edit questions now before publishing to{" "}
                    <span className="font-bold text-foreground">
                      {selectedClassroom?.name || selectedClassroom?.subject || "your classroom"}
                    </span>.
                  </>
                ) : queueModalStatus === "failed" ? (
                  <>
                    There was an issue generating questions for the selected criteria. Please check your chapter selection and retry.
                  </>
                ) : (
                  <>
                    {setsCount > 1
                      ? `Generating ${setsCount} variant sets in the background. We will notify you once ready or you can view at the `
                      : "Your paper generation is being processed. We will notify you once ready or you can view at the "}
                    <span className="font-bold text-primary">
                      Draft Tab of {selectedClassroom?.name || selectedClassroom?.subject || "Selected Classroom"}
                    </span>.
                  </>
                )}
              </p>
            </div>

            {queueModalStatus === "queued" && (
              <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3.5">
                <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground">Generating questions…</p>
                  <p className="text-[10px] text-muted-foreground">Extracting syllabus concepts &amp; formatting rubrics</p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              {queueModalStatus === "ready" ? (
                <>
                  <AppButton
                    onClick={() => {
                      setShowQueuedModal(false);
                      setIsPreviewingDraft(true);
                    }}
                    className="h-11 rounded-xl text-xs font-black uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer"
                  >
                    Preview &amp; Edit Draft Now
                  </AppButton>
                  {selectedClassroomId && (
                    <AppButton
                      onClick={() => {
                        setShowQueuedModal(false);
                        router.push(FRONTEND_ROUTES.TEACHER_CLASSROOM(selectedClassroomId) + "?tab=drafts");
                      }}
                      className="h-10 rounded-xl text-xs font-black uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer"
                    >
                      Go to Classroom Draft Tab
                      <ExternalLink className="size-3.5 ml-1.5" />
                    </AppButton>
                  )}
                </>
              ) : queueModalStatus === "failed" ? (
                <AppButton
                  onClick={() => setShowQueuedModal(false)}
                  className="h-11 rounded-xl text-xs font-black uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer"
                >
                  Adjust Settings &amp; Try Again
                </AppButton>
              ) : (
                selectedClassroomId ? (
                  <AppButton
                    onClick={() => {
                      setShowQueuedModal(false);
                      router.push(FRONTEND_ROUTES.TEACHER_CLASSROOM(selectedClassroomId) + "?tab=drafts");
                    }}
                    className="h-11 w-full rounded-xl text-xs font-black uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer"
                  >
                    View Classroom
                  </AppButton>
                ) : (
                  <AppButton
                    onClick={() => setShowQueuedModal(false)}
                    className="h-11 w-full rounded-xl text-xs font-black uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer"
                  >
                    Close
                  </AppButton>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
