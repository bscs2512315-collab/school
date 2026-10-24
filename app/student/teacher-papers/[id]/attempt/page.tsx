"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AppLoader from "@/components/AppLoader";
import PageContainer from "@/components/PageContainer";
import GenerateAttemptStep from "@/components/generate/GenerateAttemptStep";
import GenerateResultScreen from "@/components/generate/GenerateResultScreen";
import GeneratePendingScreen from "@/components/generate/GeneratePendingScreen";
import { FRONTEND_ROUTES, API_ENDPOINTS } from "@/constants/endpoints";
import { apiGet, apiPost, apiPut } from "@/lib/api/api-client";
import {
  createUploadItem,
  emptyUploadState,
  MAX_IMAGES_PER_QUESTION,
  removeUploadItem,
  restoreUploadsFromAnswers,
  uploadsToAnswersData,
  upsertUploadItem,
} from "@/lib/exam/multi-upload";
import type {
  GeneratedPaper,
  GeneratePaperSubmitResult,
  PaperType,
  UploadItem,
  UploadState,
} from "@/types/generate";
import { examDurationFromQuestions } from "@/lib/paper/exam-duration";
import { parsePaperVariant } from "@/lib/paper/variant-parser";

type View = "loading" | "attempt" | "result" | "pending";

export default function StudentTeacherPaperAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const paperId = params.id as string;

  const [view, setView] = useState<View>("loading");
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [paperType, setPaperType] = useState<PaperType>("1");
  const [subject, setSubject] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({});
  const [uploads, setUploads] = useState<Record<string, UploadState>>({});
  const [timeLeft, setTimeLeft] = useState(3600);
  const [strictMode, setStrictMode] = useState(true);
  const [allowResume, setAllowResume] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<GeneratePaperSubmitResult | null>(null);
  const startedAt = useRef(Date.now());
  const submittingRef = useRef(false);
  const handleSubmitRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet<{
          id: string;
          title: string;
          paperType: number;
          subject: string;
          classLevel: string;
          board: string;
          classroomId?: string;
          totalMarks: number;
          totalQuestions: number;
          strictMode?: boolean;
          allowResume?: boolean;
          savedProgress?: {
            answers?: Record<string, any>;
            currentQuestionIndex?: number;
            timeLeft?: number;
            timeSpent?: number;
          } | null;
          questions: GeneratedPaper["questions"];
        }>(`/student/teacher-papers/${paperId}`);

        if (!res.success) {
          toast.error(res.message || "Paper not found");
          router.push(FRONTEND_ROUTES.STUDENT_CLASSROOMS);
          return;
        }

        if (res.data.strictMode !== undefined) {
          setStrictMode(Boolean(res.data.strictMode));
        }

        const isResumable = Boolean(res.data.allowResume);
        setAllowResume(isResumable);

        if (res.data.classroomId) {
          setClassroomId(res.data.classroomId);
        }

        const type: PaperType = res.data.paperType === 2 ? "2" : "1";
        const cleanAttemptTitle =
          parsePaperVariant(res.data.title).baseTitle || res.data.title;
        setTitle(cleanAttemptTitle);
        setPaperType(type);
        setSubject(res.data.subject);
        setPaper({
          generatedPaperId: res.data.id,
          paperType: res.data.paperType,
          subject: res.data.subject,
          classLevel: res.data.classLevel,
          board: res.data.board,
          totalMarks: res.data.totalMarks,
          totalQuestions: res.data.totalQuestions,
          questions: res.data.questions,
        });

        let sp = res.data.savedProgress;
        if (!sp || !sp.answers || Object.keys(sp.answers).length === 0) {
          try {
            const localRaw = localStorage.getItem(`exboard_tp_progress_${paperId}`);
            if (localRaw) {
              const localParsed = JSON.parse(localRaw);
              if (localParsed?.answers && Object.keys(localParsed.answers).length > 0) {
                sp = localParsed;
              }
            }
          } catch {}
        }

        let restoredAnswers = false;

        if (type === "2") {
          const savedAnswers =
            sp?.answers && typeof sp.answers === "object"
              ? (sp.answers as Record<string, unknown>)
              : {};
          const restored = restoreUploadsFromAnswers(savedAnswers);
          if (Object.values(restored).some((s) => (s.files ?? []).length > 0)) {
            restoredAnswers = true;
          }
          const init: Record<string, UploadState> = {};
          res.data.questions.forEach((q) => {
            init[q.id] = restored[q.id] ?? emptyUploadState();
          });
          setUploads(init);
        } else if (sp?.answers && Object.keys(sp.answers).length > 0) {
          setMcqAnswers(sp.answers as Record<string, string>);
          restoredAnswers = true;
        }

        if (sp?.currentQuestionIndex !== undefined) {
          setCurrentQuestionIndex(
            Math.min(res.data.questions.length - 1, Math.max(0, sp.currentQuestionIndex)),
          );
        }

        if (sp?.timeLeft !== undefined && sp.timeLeft > 0) {
          setTimeLeft(sp.timeLeft);
        } else {
          setTimeLeft(
            examDurationFromQuestions(res.data.questions, { paperType: type }),
          );
        }

        if (restoredAnswers) {
          toast.success("Resumed your saved exam progress!", { icon: "" });
        }

        setView("attempt");
        startedAt.current = Date.now();
      } catch {
        toast.error("Failed to load paper");
        router.push(FRONTEND_ROUTES.STUDENT_CLASSROOMS);
      }
    })();
  }, [paperId, router]);

  const saveProgress = useCallback(
    async (
      customAnswers?: Record<string, unknown>,
      customQIndex?: number,
      customTimeLeft?: number,
    ) => {
      if (submittingRef.current || view !== "attempt" || !paper) {
        return;
      }

      let answersToSave: Record<string, unknown>;
      if (customAnswers) {
        answersToSave = customAnswers;
      } else if (paperType === "1") {
        answersToSave = mcqAnswers;
      } else {
        answersToSave = uploadsToAnswersData(uploads);
      }

      const qIndex = customQIndex ?? currentQuestionIndex;
      const tLeft = customTimeLeft ?? timeLeft;
      const timeSpent = Math.floor((Date.now() - startedAt.current) / 1000);

      try {
        localStorage.setItem(
          `exboard_tp_progress_${paperId}`,
          JSON.stringify({
            answers: answersToSave,
            currentQuestionIndex: qIndex,
            timeLeft: tLeft,
          }),
        );
      } catch {}

      try {
        await apiPut(`/student/teacher-papers/${paperId}/progress`, {
          answers: answersToSave,
          currentQuestionIndex: qIndex,
          timeLeft: tLeft,
          timeSpent,
        });
      } catch {
        // silent fail on background auto-save
      }
    },
    [
      view,
      paper,
      paperType,
      mcqAnswers,
      uploads,
      currentQuestionIndex,
      timeLeft,
      paperId,
    ],
  );

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
          fileUrl?: string | null;
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
            const answersToSave = uploadsToAnswersData(next);
            void saveProgress(answersToSave);
            try {
              localStorage.setItem(
                `exboard_tp_progress_${paperId}`,
                JSON.stringify({
                  answers: answersToSave,
                  currentQuestionIndex,
                  timeLeft,
                }),
              );
            } catch {}
            return next;
          });
        } else {
          throw new Error(res.message || "Upload failed");
        }
      } catch (err: any) {
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
        const msg = err?.error || err?.message || "Upload failed. You can retry.";
        toast.error(msg);
      }
    },
    [paperId, currentQuestionIndex, timeLeft, saveProgress],
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
    setUploads((prev) => {
      const next = {
        ...prev,
        [questionId]: removeUploadItem(prev[questionId], uploadId),
      };
      const answersToSave = uploadsToAnswersData(next);
      void saveProgress(answersToSave);
      try {
        localStorage.setItem(
          `exboard_tp_progress_${paperId}`,
          JSON.stringify({ answers: answersToSave, currentQuestionIndex, timeLeft }),
        );
      } catch {}
      return next;
    });
  };

  const handleSubmit = useCallback(async () => {
    if (!paper || submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const timeTaken = Math.floor((Date.now() - startedAt.current) / 1000);
      let answers: Record<string, unknown>;
      if (paperType === "1") {
        answers = mcqAnswers;
      } else {
        answers = { ...uploadsToAnswersData(uploads), ...mcqAnswers };
      }

      const res = await apiPost<{
        score?: number;
        totalMarks?: number;
        percentage?: number;
        pointsEarned?: number;
        questionResults?: GeneratePaperSubmitResult["questionResults"];
        gradingStatus?: string;
      }>(`/student/teacher-papers/${paperId}/attempt`, { answers, timeTaken });

      if (!res.success) {
        toast.error(res.message || "Submit failed");
        return;
      }

      try {
        localStorage.removeItem(`exboard_tp_progress_${paperId}`);
      } catch {}

      if (paperType === "2") {
        setView("pending");
      } else {
        setResult({
          score: res.data.score ?? 0,
          totalMarks: res.data.totalMarks ?? 0,
          percentage: res.data.percentage ?? 0,
          pointsAwarded: res.data.pointsEarned ?? 0,
          questionResults: res.data.questionResults ?? {},
        });
        setView("result");
      }
    } catch {
      toast.error("Failed to submit paper");
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  }, [paper, paperType, mcqAnswers, uploads, paperId]);

  handleSubmitRef.current = handleSubmit;

  useEffect(() => {
    if (!allowResume || view !== "attempt") return;
    const interval = setInterval(() => {
      void saveProgress();
    }, 15000);
    return () => clearInterval(interval);
  }, [allowResume, view, saveProgress]);

  const handleSaveAndQuit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await saveProgress();
      toast.success("Progress saved! You can resume your exam anytime.", {
        duration: 4000,
        icon: "💾",
      });
      router.push(
        classroomId
          ? FRONTEND_ROUTES.STUDENT_CLASSROOM(classroomId)
          : FRONTEND_ROUTES.STUDENT_CLASSROOMS,
      );
    } catch {
      toast.error("Failed to save progress. Please try again.");
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  }, [saveProgress, router, classroomId]);

  useEffect(() => {
    if (view !== "attempt") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          void handleSubmitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [view]);

  const handleRetry = useCallback(() => {
    if (!paper) return;
    setResult(null);
    setMcqAnswers({});
    setCurrentQuestionIndex(0);
    setIsSubmitting(false);
    submittingRef.current = false;

    if (paperType === "2") {
      const init: Record<string, UploadState> = {};
      paper.questions.forEach((q) => {
        init[q.id] = emptyUploadState();
      });
      setUploads(init);
    }

    setTimeLeft(
      examDurationFromQuestions(paper.questions, { paperType }),
    );
    startedAt.current = Date.now();
    setView("attempt");
  }, [paper, paperType]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const pendingUploadCount = Object.values(uploads)
  .flatMap((u) => (u.files?.length ? u.files : []))
  .filter((f) => f.status === "uploading").length;
  const uploadedCount = Object.values(uploads).filter((u) =>
    (u.files ?? []).some((f) => f.status === "uploaded"),
  ).length;

  if (view === "loading" || !paper) {
    return <AppLoader />;
  }

  if (view === "pending") {
    return (
      <div className="h-full w-full min-h-0 flex-1 overflow-y-auto custom-scrollbar">
        <PageContainer>
          <GeneratePendingScreen
            subject={subject}
            classLevel={paper?.classLevel}
            board={paper?.board}
            paperNumber={paperType === "2" ? 2 : 1}
            awaitingTeacherApproval
            onReattempt={handleRetry}
            onBack={() =>
              router.push(
                classroomId
                  ? FRONTEND_ROUTES.STUDENT_CLASSROOM(classroomId)
                  : FRONTEND_ROUTES.STUDENT_CLASSROOMS,
              )
            }
          />
        </PageContainer>
      </div>
    );
  }

  if (view === "result" && result) {
    return (
      <div className="h-full w-full min-h-0 flex-1 overflow-y-auto custom-scrollbar">
        <PageContainer>
          <GenerateResultScreen
            result={result}
            paper={paper}
            retryLabel="Re Attempt"
            onRetry={handleRetry}
            onBack={() =>
              router.push(
                classroomId
                  ? FRONTEND_ROUTES.STUDENT_CLASSROOM(classroomId)
                  : FRONTEND_ROUTES.STUDENT_CLASSROOMS,
              )
            }
          />
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-4 pt-4 text-sm font-bold text-muted-foreground">
        {title}
      </div>
      <div className="min-h-0 flex-1">
        <GenerateAttemptStep
          paperType={paperType}
          generatedPaper={paper}
          currentQuestionIndex={currentQuestionIndex}
          mcqAnswers={mcqAnswers}
          uploads={uploads}
          timeLeft={timeLeft}
          isSubmitting={isSubmitting}
          pendingUploadCount={pendingUploadCount}
          uploadedCount={uploadedCount}
          formatTime={formatTime}
          strictMode={strictMode}
          allowResume={allowResume}
          onSaveAndQuit={handleSaveAndQuit}
          onSaveProgress={() => void saveProgress()}
          onSelectMcqAnswer={(questionId, optionId) => {
            const updated = { ...mcqAnswers, [questionId]: optionId };
            setMcqAnswers(updated);
            void saveProgress(updated);
          }}
          onAddFiles={handleFileSelect}
          onRetryUpload={handleRetryUpload}
          onRemoveUpload={handleRemoveUpload}
          onPrevious={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
          onNext={() =>
            setCurrentQuestionIndex((i) =>
              Math.min(paper.questions.length - 1, i + 1),
            )
          }
          onSubmit={() => void handleSubmit()}
          onQuestionIndexChange={setCurrentQuestionIndex}
        />
      </div>
    </div>
  );
}
