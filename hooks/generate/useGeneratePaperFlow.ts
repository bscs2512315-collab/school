"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useGeneratePaperChapters } from "@/hooks/challenge/useChallenges";
import {
  useGeneratePaper,
  useSubmitGeneratedPaper,
  type GeneratedPaper,
} from "@/hooks/student/useGeneratePaper";
import { useStudentCurriculums } from "@/hooks/student/useStudentCurriculums";
import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiPost } from "@/lib/api/api-client";
import {
  createUploadItem,
  emptyUploadState,
  MAX_IMAGES_PER_QUESTION,
  removeUploadItem,
  restoreUploadsFromAnswers,
  toUploadItemList,
  uploadsToAnswersData,
  upsertUploadItem,
} from "@/lib/exam/multi-upload";
import type {
  GenerateCurriculum,
  GenerateMode,
  GeneratePaperChapter,
  GeneratePaperSubmitResult,
  GenerateStep,
  PaperType,
  PersistedExamData,
  UploadItem,
  UploadState,
} from "@/types/generate";
import type { CustomUploadedImage } from "@/components/generate/GenerateCustomInputs";
import type { ManualQuestionItem } from "@/components/custom-quiz/ManualQuestionBuilder";
import { examDurationFromQuestions } from "@/lib/paper/exam-duration";
import {
  expandCurriculumSubjects,
  resolveSubjectMapping,
} from "@/lib/paper/subject-mapping";

function restoreUploadsMap(
  uploads: Record<string, UploadState>,
): Record<string, UploadState> {
  const answers: Record<string, unknown> = {};
  for (const [qId, state] of Object.entries(uploads ?? {})) {
    const urls =
      Array.isArray(state?.imageUrls) && state.imageUrls.length > 0
        ? state.imageUrls
        : typeof state?.imageUrl === "string"
          ? [state.imageUrl]
          : [];
    if (urls.length > 0) answers[qId] = { imageUrls: urls };
  }
  return restoreUploadsFromAnswers(answers);
}

function formatTime(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getUserIdFromStorage() {
  const storedUser = localStorage.getItem("exboard_user");
  if (!storedUser) return "";
  const u = JSON.parse(storedUser);
  return u.id || u.userId || "";
}

export function useGeneratePaperFlow() {
  const searchParams = useSearchParams();
  const requestedMode = searchParams.get("mode");
  const requestedPaperType = searchParams.get("paperType");
  const requestedSubject = searchParams.get("subject") ?? "";

  const [userClass, setUserClass] = useState("");
  const [userBoard, setUserBoard] = useState("AKUEB");
  const [userId, setUserId] = useState("");

  const [mode, setMode] = useState<GenerateMode>(
    requestedMode === "slos" || requestedMode === "custom"
      ? requestedMode
      : "past_papers",
  );
  const [customTitle, setCustomTitle] = useState("");
  const [customCreationType, setCustomCreationType] = useState<"ai" | "manual">("ai");
  const [customPrompt, setCustomPrompt] = useState("");
  const [customImages, setCustomImages] = useState<CustomUploadedImage[]>([]);
  const [manualQuestions, setManualQuestions] = useState<ManualQuestionItem[]>([
    {
      id: "q_1",
      questionText: "",
      options: [
        { id: "A", text: "" },
        { id: "B", text: "" },
        { id: "C", text: "" },
        { id: "D", text: "" },
      ],
      correctOptionId: "A",
      explanation: "",
      marks: 1,
    },
  ]);

  const [difficulty, setDifficulty] = useState<"Alpha" | "Beta" | "Gamma">("Beta");
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [step, setStep] = useState<GenerateStep>("mode");
  const [paperType, setPaperType] = useState<PaperType>(
    requestedPaperType === "2" ? "2" : "1",
  );
  const [subject, setSubject] = useState(requestedSubject);
  const [availableSubjects, setAvailableSubjects] = useState<GenerateCurriculum[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  const [chapters, setChapters] = useState<GeneratePaperChapter[]>([]);
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [selectedSloNumbers, setSelectedSloNumbers] = useState<string[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);

  const [generatedPaper, setGeneratedPaper] = useState<GeneratedPaper | null>(null);
  const [loadingPaper, setLoadingPaper] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploads, setUploads] = useState<Record<string, UploadState>>({});
  const [result, setResult] = useState<GeneratePaperSubmitResult | null>(null);

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [unansweredCount, setUnansweredCount] = useState(0);
  const [persistedExamData, setPersistedExamData] = useState<PersistedExamData | null>(null);

  const isSubmittingRef = useRef(false);
  const handleSubmitRef = useRef<(opts?: { force?: boolean }) => Promise<void>>(async () => {});

  const curriculumsQuery = useStudentCurriculums();

  const resolvedMapping = resolveSubjectMapping(subject);
  const selectedCurriculum =
    availableSubjects.find((c) => c.subject === subject) ||
    availableSubjects.find(
      (c) => c.subject.toLowerCase() === resolvedMapping.pastPaperSubject.toLowerCase(),
    ) ||
    (curriculumsQuery.data as GenerateCurriculum[] | undefined)?.find(
      (c) =>
        c.subject === subject ||
        c.subject.toLowerCase() === resolvedMapping.curriculumSubject.toLowerCase(),
    );
  const effectiveClass = selectedCurriculum?.class || userClass || "IX";
  const effectiveBoard = selectedCurriculum?.board || userBoard || "AKUEB";

  const chaptersQuery = useGeneratePaperChapters(
    { subject, class: effectiveClass, board: effectiveBoard, paperType },
    Boolean(subject && effectiveClass && effectiveBoard),
  );
  const generatePaperMutation = useGeneratePaper();
  const submitGeneratedPaperMutation = useSubmitGeneratedPaper();

  const checkActiveExam = useCallback(() => {
    const uid = getUserIdFromStorage();
    if (!uid) return;

    const activeExamKey = `exboard_active_exam_${uid}`;
    const storedActiveExam = localStorage.getItem(activeExamKey);
    if (!storedActiveExam) return;

    try {
      const data = JSON.parse(storedActiveExam) as PersistedExamData;
      if (data.autoResume || searchParams.get("autoResume") === "1") {
        setPaperType(data.paperType);
        setSubject(data.subject);
        setUserClass(data.userClass);
        setUserBoard(data.userBoard);
        setGeneratedPaper(data.generatedPaper);
        setMcqAnswers(data.mcqAnswers || {});
        setUploads(data.uploads || {});
        setTimeLeft(
          data.timeLeft ||
            examDurationFromQuestions(data.generatedPaper?.questions ?? [], {
              paperType: data.paperType,
            }) ||
            3600,
        );
        setCurrentQuestionIndex(data.currentQuestionIndex || 0);
        setStep("attempt");
        delete data.autoResume;
        localStorage.setItem(activeExamKey, JSON.stringify(data));
        return;
      }
      setPersistedExamData(data);
      setShowResumeModal(true);
    } catch (e) {
      console.error("Error parsing stored active exam", e);
    }
  }, [searchParams]);

  useEffect(() => {
    const storedUser = localStorage.getItem("exboard_user");
    let cls = "IX";
    if (storedUser) {
      const u = JSON.parse(storedUser);
      cls = u.class || "IX";
      setUserClass(cls);
      setUserBoard(u.board || "AKUEB");
      setUserId(u.id || u.userId || "");
    }
    checkActiveExam();
  }, [checkActiveExam]);

  useEffect(() => {
    setLoadingSubjects(curriculumsQuery.isLoading);
    if (!curriculumsQuery.data) return;
    let data = curriculumsQuery.data as GenerateCurriculum[];
    if (userClass) {
      data = data.filter((c) => c.class.toLowerCase() === userClass.toLowerCase());
    }

    const expanded = expandCurriculumSubjects(data, userBoard);
    setAvailableSubjects(expanded);

    if (requestedSubject) {
      const mapping = resolveSubjectMapping(requestedSubject);
      const requested = expanded.find(
        (c) =>
          c.subject.toLowerCase() === requestedSubject.toLowerCase() ||
          c.subject.toLowerCase() === mapping.pastPaperSubject.toLowerCase() ||
          (mapping.isUrduMedium && c.subject.includes("(Urdu)")) ||
          (!mapping.isUrduMedium &&
            c.subject.includes("(English)") &&
            c.subject.toLowerCase().includes(mapping.curriculumSubject.toLowerCase())),
      );
      if (requested) {
        setSubject(requested.subject);
        return;
      }
    }

    // If a subject was previously chosen but is not valid or was legacy base name, migrate it
    if (subject) {
      if (!expanded.some((c) => c.subject === subject)) {
        const mapping = resolveSubjectMapping(subject);
        const migrated = expanded.find(
          (c) =>
            c.subject.toLowerCase() === mapping.pastPaperSubject.toLowerCase() ||
            (mapping.isUrduMedium && c.subject.includes("(Urdu)")) ||
            (!mapping.isUrduMedium &&
              c.subject.includes("(English)") &&
              c.subject.toLowerCase().includes(mapping.curriculumSubject.toLowerCase())),
        );
        if (migrated) {
          setSubject(migrated.subject);
        } else {
          setSubject("");
        }
      }
    }
  }, [curriculumsQuery.data, curriculumsQuery.isLoading, userClass, userBoard, subject, requestedSubject]);

  // Synchronize chapters from query whenever subject or curriculum changes
  useEffect(() => {
    if (!subject) {
      setChapters([]);
      setSelectedChapterIds([]);
      setLoadingChapters(false);
      return;
    }

    setLoadingChapters(chaptersQuery.isLoading || chaptersQuery.isFetching);

    if (chaptersQuery.data) {
      setChapters(chaptersQuery.data);
      // Do not select all by default: keep empty so user chooses their desired units
      setSelectedChapterIds([]);
    }
  }, [
    chaptersQuery.data,
    chaptersQuery.isLoading,
    chaptersQuery.isFetching,
    subject,
  ]);

  useEffect(() => {
    if (step !== "attempt" || !generatedPaper || !userId) return;

    const activeExamKey = `exboard_active_exam_${userId}`;
    const stateToSave: PersistedExamData = {
      generatedPaper,
      mcqAnswers,
      uploads,
      paperType,
      subject,
      userClass,
      userBoard,
      timeLeft,
      currentQuestionIndex,
    };
    localStorage.setItem(activeExamKey, JSON.stringify(stateToSave));
  }, [
    step,
    mcqAnswers,
    uploads,
    timeLeft,
    currentQuestionIndex,
    generatedPaper,
    userId,
    paperType,
    subject,
    userClass,
    userBoard,
  ]);

  useEffect(() => {
    if (step !== "attempt" || timeLeft <= 0 || isSubmitting) return;
    const timer = setTimeout(() => {
      const newTime = timeLeft - 1;
      setTimeLeft(newTime);

      if (newTime % 5 === 0 && userId && generatedPaper) {
        const persistentTimeKey = `gen_paper_time_left_${userId}_${generatedPaper.generatedPaperId}`;
        localStorage.setItem(persistentTimeKey, newTime.toString());
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, step, isSubmitting, userId, generatedPaper]);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  const loadChapters = async () => {
    if (!subject) return;
    setLoadingChapters(true);
    try {
      const queryResult = await chaptersQuery.refetch();
      if (queryResult.data) {
        setChapters(queryResult.data);
        setSelectedChapterIds(queryResult.data.map((c) => c.id));
      } else {
        setChapters([]);
        setSelectedChapterIds([]);
      }
    } catch (e) {
      console.error("Error loading chapters:", e);
      setChapters([]);
      setSelectedChapterIds([]);
    } finally {
      setLoadingChapters(false);
    }
  };

  const goToModeStep = () => setStep("mode");
  const goToConfigureStep = () => setStep("configure");
  const goToChaptersStep = () => {
    void loadChapters();
    setStep("chapters");
  };

  const generatePaper = async (isResuming = false) => {
    const uid = userId || getUserIdFromStorage();
    const activeExamKey = `exboard_active_exam_${uid}`;

    if (!isResuming && localStorage.getItem(activeExamKey) && !isSubmittingRef.current) {
      try {
        const data = JSON.parse(localStorage.getItem(activeExamKey)!);
        setPersistedExamData(data);
        setShowResumeModal(true);
      } catch (e) {
        console.error("Error parsing stored active exam", e);
        localStorage.removeItem(activeExamKey);
        void generatePaper(true);
      }
      return;
    }

    setLoadingPaper(true);
    try {
      const effectiveSubject =
        mode === "custom" ? (customTitle.trim() || "Custom Exam") : subject;

      const data = await generatePaperMutation.mutateAsync({
        userId,
        subject: effectiveSubject,
        title: customTitle.trim() || undefined,
        classLevel: userClass,
        board: userBoard,
        paperType,
        difficulty: mode !== "past_papers" ? difficulty : undefined,
        chapterIds: mode === "custom" ? [] : selectedChapterIds,
        sloNumbers: mode === "slos" && selectedSloNumbers.length > 0 ? selectedSloNumbers : undefined,
        mode,
        prompt: customPrompt,
        imageUrls: customImages.map((img) => img.fileUrl),
        manualQuestions: customCreationType === "manual" && mode === "custom" ? manualQuestions : undefined,
        questionCount: customCreationType === "manual" && mode === "custom" ? manualQuestions.length : 25,
        isPublic,
      });

      setGeneratedPaper(data);
      setCurrentQuestionIndex(0);
      setMcqAnswers({});
      setResult(null);

      const qs = data.questions || [];
      const totalDuration = examDurationFromQuestions(qs, { paperType });

      if (userId) {
        const timerKey = `gen_paper_start_${userId}_${data.generatedPaperId}`;
        const persistentTimeKey = `gen_paper_time_left_${userId}_${data.generatedPaperId}`;
        const savedTimeLeft = localStorage.getItem(persistentTimeKey);

        if (savedTimeLeft) {
          setTimeLeft(parseInt(savedTimeLeft, 10));
        } else {
          const existingStart = localStorage.getItem(timerKey);
          if (existingStart) {
            const startTime = parseInt(existingStart, 10);
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setTimeLeft(Math.max(0, totalDuration - elapsed));
          } else {
            localStorage.setItem(timerKey, Date.now().toString());
            setTimeLeft(totalDuration);
          }
        }
      } else {
        setTimeLeft(totalDuration);
      }

      if (paperType === "2") {
        const init: Record<string, UploadState> = {};
        qs.forEach((q) => {
          init[q.id] = emptyUploadState();
        });
        setUploads(init);
      }

      setStep("attempt");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to generate paper";
      toast.error(message);
    } finally {
      setLoadingPaper(false);
    }
  };

  const resumeExam = () => {
    if (!persistedExamData) return;
    const data = persistedExamData;

    setPaperType(data.paperType);
    setSubject(data.subject);
    setUserClass(data.userClass);
    setUserBoard(data.userBoard);
    setGeneratedPaper(data.generatedPaper);
    setMcqAnswers(data.mcqAnswers || {});
    setUploads(restoreUploadsMap(data.uploads || {}));
    setTimeLeft(
      data.timeLeft ||
        examDurationFromQuestions(data.generatedPaper?.questions ?? [], {
          paperType: data.paperType,
        }) ||
        3600,
    );
    setCurrentQuestionIndex(data.currentQuestionIndex || 0);
    setStep("attempt");
    setShowResumeModal(false);
    setPersistedExamData(null);
  };

  const discardExamAndNew = () => {
    const uid = userId || getUserIdFromStorage();
    const activeExamKey = `exboard_active_exam_${uid}`;
    localStorage.removeItem(activeExamKey);
    setShowResumeModal(false);

    if (uid && persistedExamData?.generatedPaper?.generatedPaperId) {
      const timerKey = `gen_paper_start_${uid}_${persistedExamData.generatedPaper.generatedPaperId}`;
      const persistentTimeKey = `gen_paper_time_left_${uid}_${persistedExamData.generatedPaper.generatedPaperId}`;
      localStorage.removeItem(timerKey);
      localStorage.removeItem(persistentTimeKey);
    }

    setPersistedExamData(null);
    toast.success("Previous session discarded.");
  };

  const selectMCQAnswer = (questionId: string, optionId: string) => {
    setMcqAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const uploadAnswer = useCallback(
    async (
      questionId: string,
      files: File[],
      replaceIds: string[] = [],
    ) => {
      const newItems: UploadItem[] = files.map((file, index) => {
        const item = createUploadItem(file);
        const existingId = replaceIds[index] ?? item.id;
        return { ...item, id: existingId };
      });

      setUploads((prev) => {
        let questionState = prev[questionId];
        for (const item of newItems) {
          questionState = upsertUploadItem(questionState, item);
        }
        return { ...prev, [questionId]: questionState };
      });

      try {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        formData.append("questionId", questionId);
        const res = await apiPost<{
          results?: Array<{ fileUrl: string; fileName: string }>;
        }>(API_ENDPOINTS.STUDENT.ANSWERS_UPLOAD, formData);
        if (res.success && res.data) {
          const results = (res.data.results ?? [])
            .filter((r) => r && typeof r.fileUrl === "string")
            .slice(0, newItems.length);
          if (results.length === 0) {
            throw new Error(res.message || "Upload failed");
          }
          setUploads((prev) => {
            let next = prev;
            results.forEach((r, index) => {
              const item = newItems[index];
              if (!item) return;
              next = {
                ...next,
                [questionId]: upsertUploadItem(next[questionId], {
                  ...item,
                  status: "uploaded" as const,
                  imageUrl: r.fileUrl,
                }),
              };
            });
            return next;
          });
        } else {
          throw new Error(res.message || "Upload failed");
        }
      } catch (err: unknown) {
        setUploads((prev) => {
          let next = prev;
          newItems.forEach((item) => {
            next = {
              ...next,
              [questionId]: upsertUploadItem(next[questionId], {
                ...item,
                status: "failed" as const,
              }),
            };
          });
          return next;
        });
        const errObj = err as { error?: string; message?: string };
        const msg = errObj?.error || errObj?.message || "Upload failed. You can retry.";
        toast.error(msg);
      }
    },
    [],
  );

  const handleFileSelect = (questionId: string, files: File[]) => {
    const existing = uploads[questionId]?.files ?? [];
    const available = Math.max(0, MAX_IMAGES_PER_QUESTION - existing.length);
    const valid: File[] = [];
    for (const file of files) {
      if (valid.length >= available) {
        toast.error(
          `You can upload up to ${MAX_IMAGES_PER_QUESTION} images per question`,
        );
        break;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File must be under 10MB");
        continue;
      }
      valid.push(file);
    }
    if (valid.length > 0) {
      void uploadAnswer(questionId, valid);
    }
  };

  const handleRetryUpload = (questionId: string, uploadId: string) => {
    const item = uploads[questionId]?.files?.find((f) => f.id === uploadId);
    if (item?.file) {
      void uploadAnswer(questionId, [item.file], [uploadId]);
    }
  };

  const handleRemoveUpload = (questionId: string, uploadId: string) => {
    setUploads((prev) => ({
      ...prev,
      [questionId]: removeUploadItem(prev[questionId], uploadId),
    }));
  };

  const pendingUploads = Object.values(uploads)
    .flatMap((u) => (u.files?.length ? u.files : []))
    .filter((f) => f.status === "uploading");
  const uploadedCount = Object.values(uploads).filter((u) =>
    (u.files ?? []).some((f) => f.status === "uploaded"),
  ).length;

  const handleSubmit = useCallback(async (opts?: { force?: boolean }) => {
    if (!generatedPaper) return;

    if (paperType === "2" && pendingUploads.length > 0) {
      toast.error("Please wait for all uploads to complete.");
      return;
    }

    const questions = generatedPaper.questions;
    if (!opts?.force && timeLeft > 0) {
      let unanswered = 0;
      if (paperType === "1") {
        unanswered = questions.filter((q) => !mcqAnswers[q.id]).length;
      } else {
        unanswered = questions.filter(
          (q) =>
            !toUploadItemList(uploads[q.id]).some(
              (item) => item.status === "uploaded",
            ),
        ).length;
      }
      if (unanswered > 0) {
        setUnansweredCount(unanswered);
        setShowSubmitModal(true);
        return;
      }
    }

    setShowSubmitModal(false);
    setIsSubmitting(true);
    try {
      let answersPayload: Record<string, unknown>;
      if (paperType === "1") {
        answersPayload = mcqAnswers;
      } else {
        answersPayload = uploadsToAnswersData(uploads);
      }

      const maxTime = examDurationFromQuestions(questions, { paperType });

      const resultData = await submitGeneratedPaperMutation.mutateAsync({
        userId,
        generatedPaperId: generatedPaper.generatedPaperId,
        paperType: parseInt(paperType, 10),
        subject,
        answers: answersPayload,
        timeTaken: Math.max(0, maxTime - timeLeft),
      });

      const activeExamKey = `exboard_active_exam_${userId}`;
      localStorage.removeItem(activeExamKey);

      const timerKey = `gen_paper_start_${userId}_${generatedPaper.generatedPaperId}`;
      const persistentTimeKey = `gen_paper_time_left_${userId}_${generatedPaper.generatedPaperId}`;
      localStorage.removeItem(timerKey);
      localStorage.removeItem(persistentTimeKey);

      if (paperType === "1") {
        setResult(resultData);
        setStep("result");
        toast.success("🎉 Paper graded!");
      } else {
        setStep("pending");
        toast.success("🎉 Paper submitted! AI grading in progress.");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to submit";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    generatedPaper,
    paperType,
    pendingUploads.length,
    mcqAnswers,
    timeLeft,
    uploads,
    userId,
    subject,
    submitGeneratedPaperMutation,
  ]);

  handleSubmitRef.current = handleSubmit;

  useEffect(() => {
    if (timeLeft === 0 && step === "attempt" && generatedPaper && !isSubmittingRef.current) {
      void handleSubmitRef.current();
    }
  }, [timeLeft, step, generatedPaper]);

  const resetToStart = () => {
    const activeExamKey = `exboard_active_exam_${userId}`;
    localStorage.removeItem(activeExamKey);

    setShowSubmitModal(false);
    setUnansweredCount(0);
    setStep("mode");
    setCustomTitle("");
    setGeneratedPaper(null);
    setResult(null);
    setMcqAnswers({});
    setUploads({});
    setSelectedChapterIds([]);
    setCurrentQuestionIndex(0);
    setCustomPrompt("");
    setCustomImages([]);
  };

  const toggleChapter = (id: string) => {
    const chapter = chapters.find((c) => c.id === id);
    if (!chapter) return;

    setSelectedChapterIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const selectAllChapters = () => {
    setSelectedChapterIds(chapters.map((chapter) => chapter.id));
  };

  const clearChapters = () => {
    setSelectedChapterIds([]);
  };

  const configStepIndex =
    step === "mode"
      ? 0
      : step === "configure"
        ? 1
        : step === "chapters"
          ? 2
          : mode === "custom"
            ? 2
            : 3;

  return {
    step,
    configStepIndex,
    mode,
    customTitle,
    paperType,
    subject,
    userClass,
    userBoard,
    availableSubjects,
    loadingSubjects,
    chapters,
    selectedChapterIds,
    selectedSloNumbers,
    setSelectedSloNumbers,
    loadingChapters,
    loadingPaper,
    generatedPaper,
    currentQuestionIndex,
    mcqAnswers,
    uploads,
    timeLeft,
    isSubmitting,
    result,
    showResumeModal,
    persistedExamData,
    customPrompt,
    customImages,
    customCreationType,
    setCustomCreationType,
    manualQuestions,
    setManualQuestions,
    pendingUploadCount: pendingUploads.length,
    uploadedCount,
    setStep,
    setMode,
    setCustomTitle,
    setPaperType,
    setSubject,
    difficulty,
    setDifficulty,
    isPublic,
    setIsPublic,
    setCustomPrompt,
    setCustomImages,
    setShowResumeModal,
    showSubmitModal,
    setShowSubmitModal,
    unansweredCount,
    confirmSubmit: () => handleSubmit({ force: true }),
    goToModeStep,
    goToConfigureStep,
    goToChaptersStep,
    generatePaper,
    resumeExam,
    discardExamAndNew,
    selectMCQAnswer,
    handleFileSelect,
    handleRetryUpload,
    handleRemoveUpload,
    handleSubmit,
    resetToStart,
    toggleChapter,
    selectAllChapters,
    clearChapters,
    setCurrentQuestionIndex,
    formatTime,
  };
}
