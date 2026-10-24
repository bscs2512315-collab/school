"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import { Typography } from "@/components/ui/Typography";
import AppButton from "@/components/AppButton";
import ExamNavigation from "@/components/exam/ExamNavigation";
import type { ExamQuestionPillStatus } from "@/components/exam/ExamNavigation";
import ExamUploadZone from "@/components/exam/ExamUploadZone";
import QuestionImage from "@/components/exam/QuestionImage";
import { useQuestionDiagramPreloader } from "@/hooks/exam/useQuestionDiagramPreloader";
import ExamAntiCheatShell from "@/components/exam/ExamAntiCheatShell";
import { usePageTitle } from "@/components/layout/PageTitleContext";
import { AlertCircle } from "lucide-react";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import LogoutSVG from "@/public/svgs/LogoutSVG";
import RefreshSVG from "@/public/svgs/RefreshSVG";
import NovaSVG from "@/public/svgs/NovaSVG";
import { cn } from "@/lib/utils";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import toast from "react-hot-toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useStudentPastPaperDetail } from "@/hooks/student/useStudentPastPaperDetail";
import {
    useUploadStudentAnswer,
    useSubmitPaper2Attempt,
} from "@/hooks/student/useStudentAttempt";
import type { PastPaperDetail, PastPaperQuestion } from "@/types/past-paper";
import { getSubjectShortName, formatClassLevel } from "@/lib/paper/subject-mapping";
import { convertMathToHTML, isUrduText } from "@/lib/utils/math-notation";
import { examDurationFromQuestions } from "@/lib/paper/exam-duration";
import { getChoiceBadgeLabel } from "@/lib/paper/choice-badge";
import AppLoader from "@/components/AppLoader";
import AppState from "@/components/AppState";
import PaperHeaderSponsor from "@/components/exam/PaperHeaderSponsor";
import { ensureStoredUser } from "@/lib/auth-session";
import QuestionQABugButton from "@/components/qa/QuestionQABugButton";

type UploadStatus = "idle" | "uploading" | "uploaded" | "failed";

interface UploadState {
    status: UploadStatus;
    imageUrl: string | null;
    previewUrl: string | null;
    file: File | null;
}

// ─── Pending Result Screen ──────────────────────────────────────────────────────
function PendingResultScreen({
    paper,
    onReattempt,
}: {
    paper: PastPaperDetail;
    onReattempt: () => void;
}) {
    const steps = [
        {
            label: "Answers uploaded securely",
            description: "Every question image reached our servers.",
            icon: CheckCircleSVG,
            done: true,
        },
        {
            label: "Nova is grading your answers",
            description: "Marks are compared against exemplar responses.",
            icon: NovaSVG,
            done: false,
        },
        {
            label: "Result lands in your history",
            description: "You will get an email once the report is ready.",
            icon: ClockSVG,
            done: false,
        },
    ];

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 py-6 animate-in fade-in slide-in-from-bottom-4 sm:py-8">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="bg-primary p-5 text-center text-primary-foreground sm:p-8">
                    <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest">
                        <ClockSVG className="size-4" />
                        Grading in progress
                    </span>

                    <div className="mx-auto mt-5 flex size-16 items-center justify-center rounded-2xl bg-primary-foreground/15 sm:size-20">
                        <CheckCircleSVG className="size-8 sm:size-10" />
                    </div>

                    <Typography className="mt-4 text-2xl font-bold sm:text-3xl">
                        Paper II submitted
                    </Typography>
                    <Typography className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-primary-foreground/80">
                        Nova is grading your {paper?.subject || "exam"} Paper II answers. Your
                        scorecard appears in history as soon as grading finishes.
                    </Typography>
                </div>

                <div className="divide-y divide-border">
                    {steps.map((step) => (
                        <div key={step.label} className="flex items-start gap-3 p-4 sm:p-5">
                            <div
                                className={cn(
                                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                                    {
                                        "bg-primary/10 text-primary": step.done,
                                        "bg-muted text-muted-foreground": !step.done,
                                    },
                                )}
                            >
                                <step.icon className="size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p
                                    className={cn("break-words text-sm font-bold", {
                                        "text-foreground": step.done,
                                        "text-muted-foreground": !step.done,
                                    })}
                                >
                                    {step.label}
                                </p>
                                <p className="mt-0.5 break-words text-xs text-muted-foreground">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-5 flex w-full justify-center">
                <AppButton
                    type="button"
                    variant="outline"
                    onClick={onReattempt}
                    className="h-12 w-full rounded-2xl px-3 text-xs font-bold sm:h-14 sm:px-4 sm:text-sm"
                >
                    <RefreshSVG className="size-4 shrink-0" />
                    <span>Re Attempt</span>
                </AppButton>
            </div>
        </div>
    );
}

// ─── Main Paper II Exam Page ────────────────────────────────────────────────────
export default function StudentAttemptPaper2Page() {
    const router = useRouter();
    const params = useParams();
    const paperId = (params?.id as string) || "";

    const paperQuery = useStudentPastPaperDetail(paperId);
    const uploadAnswerMutation = useUploadStudentAnswer();
    const submitPaper2Mutation = useSubmitPaper2Attempt();
    const pageTitleContext = usePageTitle();

    const paper = paperQuery.data ?? null;
    const isSindhBoard = Boolean(paper?.board?.toLowerCase().includes("sindh"));

    const questions: PastPaperQuestion[] = useMemo(() => {
        const allQuestions = paper?.questions || [];
        return allQuestions.filter(
            (q) => q.questionType?.toUpperCase() === "CRQ" || q.questionType?.toUpperCase() === "ERQ",
        );
    }, [paper]);

    // Group choice questions for Sindh Board to calculate required units and accurate progress
    const choiceGroups = useMemo(() => {
        if (!isSindhBoard) {
            return questions.map((q) => ({ ids: [q.id] }));
        }
        const groups: Array<{ ids: string[] }> = [];
        let i = 0;
        while (i < questions.length) {
            const q = questions[i];
            if (!q) {
                i++;
                continue;
            }
            const nextQ = questions[i + 1];
            const nextIsOr =
                nextQ &&
                ((nextQ.questionPart || "").toUpperCase().includes("OR") &&
                    (nextQ.questionNumber === q.questionNumber || !nextQ.questionNumber));

            if (nextIsOr) {
                groups.push({ ids: [q.id, nextQ.id] });
                i += 2;
            } else {
                groups.push({ ids: [q.id] });
                i += 1;
            }
        }
        return groups;
    }, [questions, isSindhBoard]);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(7200); // 2 hours default
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const [showResumeModal, setShowResumeModal] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [pendingUploadsData, setPendingUploadsData] = useState<Record<string, UploadState> | null>(null);
    const [pendingQuestionIndex, setPendingQuestionIndex] = useState<number | null>(null);

    // Upload state per question
    const [uploads, setUploads] = useState<Record<string, UploadState>>({});
    const initializedPaperIdRef = useRef<string | null>(null);

    // Keep safe question index within bounds
    const safeIndex = questions.length > 0
        ? Math.min(Math.max(0, currentQuestionIndex), questions.length - 1)
        : 0;

    // Preload next 5 question diagrams silently in the background
    useQuestionDiagramPreloader(questions, safeIndex, 5);

    const currentQuestion = questions[safeIndex] || null;
    const currentUpload = (currentQuestion ? uploads[currentQuestion.id] : null) || {
        status: "idle",
        imageUrl: null,
        previewUrl: null,
        file: null,
    };

    const saveProgress = useCallback((
        currentUploads?: Record<string, UploadState>,
        time?: number,
        qIndex?: number,
    ) => {
        if (typeof window === "undefined") return;
        const storedUser = localStorage.getItem("exboard_user");
        const user = storedUser ? JSON.parse(storedUser) : null;
        const userId = user?.id || user?.userId;
        if (!userId) return;

        const progressKey = `exam_uploads_${userId}_${paperId}`;
        const persistentTimeKey = `exam_time_left_p2_${userId}_${paperId}`;
        const qIndexKey = `exam_question_index_p2_${userId}_${paperId}`;

        const toSaveUploads = currentUploads ?? uploads;
        const toSaveTime = time ?? timeLeft;
        const toSaveIndex = qIndex ?? safeIndex;

        const persistData: Record<string, { imageUrl: string }> = {};
        Object.keys(toSaveUploads).forEach((qId) => {
            if (toSaveUploads[qId]?.status === "uploaded" && toSaveUploads[qId]?.imageUrl) {
                persistData[qId] = { imageUrl: toSaveUploads[qId].imageUrl! };
            }
        });

        localStorage.setItem(progressKey, JSON.stringify(persistData));
        localStorage.setItem(persistentTimeKey, toSaveTime.toString());
        localStorage.setItem(qIndexKey, toSaveIndex.toString());
    }, [paperId, uploads, timeLeft, safeIndex]);

    const handleQuestionIndexChange = (newIndex: number) => {
        const target = Math.min(Math.max(0, newIndex), Math.max(0, questions.length - 1));
        setCurrentQuestionIndex(target);
        saveProgress(uploads, timeLeft, target);
    };

    const handleSaveAndExit = () => {
        saveProgress(uploads, timeLeft, safeIndex);
        toast.success("Progress saved! You can resume anytime.", { icon: "💾" });
        router.push(FRONTEND_ROUTES.STUDENT_PAST_PAPERS_2);
    };

    // Initialize state when paper and questions become available
    useEffect(() => {
        if (!paper || questions.length === 0) return;
        if (initializedPaperIdRef.current === paperId) return;
        initializedPaperIdRef.current = paperId;

        const estimatedTime = examDurationFromQuestions(questions, {
            paperType: 2,
            minSeconds: 1200,
        });

        const initialUploads: Record<string, UploadState> = {};
        questions.forEach((q) => {
            initialUploads[q.id] = {
                status: "idle",
                imageUrl: null,
                previewUrl: null,
                file: null,
            };
        });

        let initialTime = estimatedTime;
        if (typeof window !== "undefined") {
            try {
                const storedUser = localStorage.getItem("exboard_user");
                const user = storedUser ? JSON.parse(storedUser) : null;
                const userId = user?.id || user?.userId;

                if (userId) {
                    const timerKey = `exam_start_p2_${userId}_${paperId}`;
                    const persistentTimeKey = `exam_time_left_p2_${userId}_${paperId}`;
                    const savedTimeLeft = localStorage.getItem(persistentTimeKey);

                    if (savedTimeLeft) {
                        const parsed = parseInt(savedTimeLeft, 10);
                        if (!isNaN(parsed) && parsed >= 0) {
                            initialTime = parsed;
                        }
                    } else {
                        const existingStart = localStorage.getItem(timerKey);
                        if (existingStart) {
                            const startTime = parseInt(existingStart, 10);
                            const elapsed = Math.floor((Date.now() - startTime) / 1000);
                            initialTime = Math.max(0, estimatedTime - elapsed);
                        } else {
                            localStorage.setItem(timerKey, Date.now().toString());
                            initialTime = estimatedTime;
                        }
                    }

                    const progressKey = `exam_uploads_${userId}_${paperId}`;
                    const qIndexKey = `exam_question_index_p2_${userId}_${paperId}`;
                    const savedUploads = localStorage.getItem(progressKey);
                    const savedQIndex = localStorage.getItem(qIndexKey);

                    if (savedUploads) {
                        const parsed = JSON.parse(savedUploads);
                        if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
                            const resumeData: Record<string, UploadState> = { ...initialUploads };
                            Object.keys(parsed).forEach((qId) => {
                                if (parsed[qId]?.imageUrl) {
                                    resumeData[qId] = {
                                        status: "uploaded",
                                        imageUrl: parsed[qId].imageUrl,
                                        previewUrl: parsed[qId].imageUrl,
                                        file: null,
                                    };
                                }
                            });
                            setPendingUploadsData(resumeData);
                            if (savedQIndex !== null) {
                                const idx = parseInt(savedQIndex, 10);
                                if (!isNaN(idx) && idx >= 0 && idx < questions.length) {
                                    setPendingQuestionIndex(idx);
                                }
                            }
                            setShowResumeModal(true);
                        }
                    }
                }
            } catch (e) {
                console.error("Error parsing saved uploads", e);
            }
        }

        setTimeLeft(initialTime);
        setUploads(initialUploads);
    }, [paper, questions, paperId]);

    // Timer countdown
    useEffect(() => {
        if (timeLeft > 0 && !isSubmitted && !isSubmitting && paper && questions.length > 0) {
            const timer = setTimeout(() => {
                const newTime = timeLeft - 1;
                setTimeLeft(newTime);

                if (newTime % 5 === 0 && typeof window !== "undefined") {
                    const storedUser = localStorage.getItem("exboard_user");
                    const user = storedUser ? JSON.parse(storedUser) : null;
                    const userId = user?.id || user?.userId;
                    if (userId) {
                        const persistentTimeKey = `exam_time_left_p2_${userId}_${paperId}`;
                        localStorage.setItem(persistentTimeKey, newTime.toString());
                    }
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft, isSubmitted, isSubmitting, paper, questions.length, paperId]);

    // Auto-submit on time up
    useEffect(() => {
        if (timeLeft === 0 && paper && questions.length > 0 && !isSubmitting && !isSubmitted) {
            handleSubmit();
        }
    }, [timeLeft, paper, questions.length, isSubmitting, isSubmitted]);

    const uploadAnswer = useCallback(async (questionId: string, file: File) => {
        const previewUrl = URL.createObjectURL(file);
        setUploads((prev) => ({
            ...prev,
            [questionId]: {
                status: "uploading",
                imageUrl: null,
                previewUrl,
                file,
            },
        }));

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("questionId", questionId);

            const data = await uploadAnswerMutation.mutateAsync(formData);

            setUploads((prev) => {
                const newUploads: Record<string, UploadState> = {
                    ...prev,
                    [questionId]: {
                        status: "uploaded" as UploadStatus,
                        imageUrl: data.fileUrl,
                        previewUrl,
                        file,
                    },
                };

                if (typeof window !== "undefined") {
                    const storedUser = localStorage.getItem("exboard_user");
                    const user = storedUser ? JSON.parse(storedUser) : null;
                    const userId = user?.id || user?.userId;
                    if (userId) {
                        const progressKey = `exam_uploads_${userId}_${paperId}`;
                        const persistentTimeKey = `exam_time_left_p2_${userId}_${paperId}`;
                        const persistData: Record<string, { imageUrl: string }> = {};
                        Object.keys(newUploads).forEach((qId) => {
                            if (newUploads[qId]?.status === "uploaded" && newUploads[qId]?.imageUrl) {
                                persistData[qId] = { imageUrl: newUploads[qId].imageUrl! };
                            }
                        });
                        localStorage.setItem(progressKey, JSON.stringify(persistData));
                        localStorage.setItem(persistentTimeKey, timeLeft.toString());
                    }
                }

                return newUploads;
            });
        } catch (error: unknown) {
            console.error(`Upload failed for ${questionId}:`, error);
            const errorMessage = error instanceof Error ? error.message : "Upload failed. You can retry.";
            setUploads((prev) => ({
                ...prev,
                [questionId]: {
                    ...prev[questionId],
                    status: "failed",
                    previewUrl,
                },
            }));
            toast.error(errorMessage);
        }
    }, [paperId, timeLeft, uploadAnswerMutation]);

    const handleFileSelect = (questionId: string, file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file (JPEG, PNG, etc.)");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File must be under 10MB");
            return;
        }
        uploadAnswer(questionId, file);
    };

    const handleRemoveUpload = (questionId: string) => {
        setUploads((prev) => {
            const next: Record<string, UploadState> = {
                ...prev,
                [questionId]: {
                    status: "idle",
                    imageUrl: null,
                    previewUrl: null,
                    file: null,
                },
            };

            if (typeof window !== "undefined") {
                const storedUser = localStorage.getItem("exboard_user");
                const user = storedUser ? JSON.parse(storedUser) : null;
                const userId = user?.id || user?.userId;
                if (userId) {
                    const progressKey = `exam_uploads_${userId}_${paperId}`;
                    const persistData: Record<string, { imageUrl: string }> = {};
                    Object.keys(next).forEach((qId) => {
                        if (next[qId]?.status === "uploaded" && next[qId]?.imageUrl) {
                            persistData[qId] = { imageUrl: next[qId].imageUrl! };
                        }
                    });
                    if (Object.keys(persistData).length > 0) {
                        localStorage.setItem(progressKey, JSON.stringify(persistData));
                    } else {
                        localStorage.removeItem(progressKey);
                    }
                }
            }

            return next;
        });
    };

    const retryUpload = (questionId: string) => {
        const state = uploads[questionId];
        if (state?.file) {
            uploadAnswer(questionId, state.file);
        }
    };

    // Submission helpers
    const pendingUploads = Object.values(uploads).filter((u) => u.status === "uploading");

    useEffect(() => {
        if (paperQuery.isLoading || isSubmitted || !paper || questions.length === 0) {
            return;
        }

        pageTitleContext?.setPageTitle("Attempt");
        return () => pageTitleContext?.setPageTitle(null);
    }, [paperQuery.isLoading, isSubmitted, paper, questions.length, pageTitleContext]);

    const handleResume = () => {
        if (pendingUploadsData) {
            setUploads(pendingUploadsData);
        }
        if (
            pendingQuestionIndex !== null &&
            !isNaN(pendingQuestionIndex) &&
            pendingQuestionIndex >= 0 &&
            pendingQuestionIndex < questions.length
        ) {
            setCurrentQuestionIndex(pendingQuestionIndex);
        }
        setShowResumeModal(false);
        setPendingUploadsData(null);
        setPendingQuestionIndex(null);
        toast.success("Resumed your exam progress from where you left off!", { icon: "📝" });
    };

    const handleReset = () => {
        if (typeof window !== "undefined") {
            const storedUser = localStorage.getItem("exboard_user");
            const user = storedUser ? JSON.parse(storedUser) : null;
            const userId = user?.id || user?.userId;
            if (userId) {
                const timerKey = `exam_start_p2_${userId}_${paperId}`;
                const progressKey = `exam_uploads_${userId}_${paperId}`;
                const persistentTimeKey = `exam_time_left_p2_${userId}_${paperId}`;
                const qIndexKey = `exam_question_index_p2_${userId}_${paperId}`;
                localStorage.removeItem(timerKey);
                localStorage.removeItem(progressKey);
                localStorage.removeItem(persistentTimeKey);
                localStorage.removeItem(qIndexKey);
                localStorage.setItem(timerKey, Date.now().toString());
            }
        }
        const initialUploads: Record<string, UploadState> = {};
        questions.forEach((q) => {
            initialUploads[q.id] = {
                status: "idle",
                imageUrl: null,
                previewUrl: null,
                file: null,
            };
        });
        setUploads(initialUploads);
        setCurrentQuestionIndex(0);
        setShowResumeModal(false);
        setPendingUploadsData(null);
        setPendingQuestionIndex(null);
    };

    const handleReattempt = () => {
        handleReset();
        setCurrentQuestionIndex(0);
        setIsSubmitting(false);
        setIsSubmitted(false);
        setTimeLeft(examDurationFromQuestions(questions, { paperType: 2, minSeconds: 1200 }));
    };

    const handleSubmitClick = () => {
        if (pendingUploads.length > 0) {
            toast.error("Please wait for all uploads to complete before submitting.");
            return;
        }

        const isSindh = Boolean(paper?.board?.toLowerCase().includes("sindh"));
        let missingCount = 0;
        if (isSindh) {
            let i = 0;
            while (i < questions.length) {
                const q = questions[i];
                if (!q) {
                    i++;
                    continue;
                }
                const nextQ = questions[i + 1];
                const nextIsOr =
                    nextQ &&
                    ((nextQ.questionPart || "").toUpperCase().includes("OR") &&
                        (nextQ.questionNumber === q.questionNumber || !nextQ.questionNumber));
                if (nextIsOr) {
                    const answered = uploads[q.id]?.status === "uploaded" || uploads[nextQ.id]?.status === "uploaded";
                    if (!answered) missingCount++;
                    i += 2;
                } else {
                    if (uploads[q.id]?.status !== "uploaded") missingCount++;
                    i += 1;
                }
            }
        } else {
            missingCount = questions.filter((q) => uploads[q.id]?.status !== "uploaded").length;
        }

        if (missingCount > 0 && timeLeft > 0) {
            setShowSubmitModal(true);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        if (!paper) return;
        setShowSubmitModal(false);

        setIsSubmitting(true);
        try {
            const user = await ensureStoredUser();
            const userId = user?.id || user?.userId;

            if (!userId) {
                toast.error("Session expired. Please log in again.");
                router.push("/login");
                return;
            }

            const answersPayload: Record<string, { imageUrl: string }> = {};
            for (const [qId, state] of Object.entries(uploads)) {
                if (state.status === "uploaded" && state.imageUrl) {
                    answersPayload[qId] = { imageUrl: state.imageUrl };
                }
            }

            const maxTime = examDurationFromQuestions(questions, {
                paperType: 2,
                minSeconds: 1200,
            });

            const submissionData = {
                userId,
                paperId: paper.id,
                answers: answersPayload,
                timeTaken: Math.max(0, maxTime - timeLeft),
            };

            await submitPaper2Mutation.mutateAsync(submissionData);

            setIsSubmitted(true);
            toast.success("Paper II submitted! Nova is grading your answers.");

            if (typeof window !== "undefined") {
                const timerKey = `exam_start_p2_${userId}_${paperId}`;
                const progressKey = `exam_uploads_${userId}_${paperId}`;
                const persistentTimeKey = `exam_time_left_p2_${userId}_${paperId}`;
                const qIndexKey = `exam_question_index_p2_${userId}_${paperId}`;
                localStorage.removeItem(timerKey);
                localStorage.removeItem(progressKey);
                localStorage.removeItem(persistentTimeKey);
                localStorage.removeItem(qIndexKey);
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        } catch (error: unknown) {
            console.error("Submission error:", error);
            const message = error instanceof Error ? error.message : "Failed to submit exam.";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // ── Loading & Empty States ──────────────────────────────────────────────────
    if (paperQuery.isLoading) {
        return <AppLoader fullScreen />;
    }

    if (!paper || questions.length === 0) {
        return (
            <PageContainer>
                <AppState
                    isEmpty={true}
                    title={!paper ? "Exam Not Available" : "No CRQ/ERQ Questions"}
                    description={
                        !paper
                            ? "We could not load the exam. Please try again."
                            : "This paper has no CRQ/ERQ (Paper II) questions to attempt."
                    }
                    icon={AlertCircle}
                    action={{
                        label: "Back to Past Papers",
                        onClick: () => router.push(FRONTEND_ROUTES.STUDENT_PAST_PAPERS_2),
                    }}
                    fullScreen={false}
                />
            </PageContainer>
        );
    }

    // ── Submitted State ─────────────────────────────────────────────────────────
    if (isSubmitted) {
        return (
            <PageContainer>
                <PendingResultScreen paper={paper} onReattempt={handleReattempt} />
            </PageContainer>
        );
    }

    // Fallback if currentQuestion is not yet ready
    if (!currentQuestion) {
        return <AppLoader fullScreen />;
    }

    // ── Exam Interface ──────────────────────────────────────────────────────────
    const isLowTime = timeLeft < 300;
    const choiceLabel = getChoiceBadgeLabel(questions, safeIndex, isSindhBoard);

    const totalTargetUnits = choiceGroups.length;
    const completedUnitsCount = choiceGroups.filter((g) =>
        g.ids.some((id) => uploads[id]?.status === "uploaded")
    ).length;
    const unansweredCount = Math.max(0, totalTargetUnits - completedUnitsCount);

    const questionStatuses: ExamQuestionPillStatus[] = questions.map((question) => {
        const upload = uploads[question.id];
        if (upload?.status === "uploaded") return "answered";
        if (upload?.status === "uploading") return "uploading";
        if (upload?.status === "failed") return "failed";
        return "default";
    });

    const isUrdu = isUrduText(currentQuestion.questionText) || Boolean(paper.subject?.toLowerCase().includes("urdu"));

    return (
        <ExamAntiCheatShell
            enabled={!isSubmitting}
            strictMode={false}
            allowResume={true}
            onSaveProgress={() => saveProgress(uploads, timeLeft, safeIndex)}
            onLeaveExam={() => {
                saveProgress(uploads, timeLeft, safeIndex);
            }}
            className="h-full min-h-0 bg-background"
        >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 lg:px-6 xl:px-8">
                {/* Timer Bar */}
                <div className="shrink-0 pt-2 pb-1 sm:py-3 lg:py-4">
                    {/* Small screens: Subject, Class, and Year at left, Progress at right */}
                    <div className="flex sm:hidden items-center justify-between gap-2 pb-1.5 text-[11px] font-semibold text-muted-foreground">
                        <div className="flex min-w-0 items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-foreground shrink-0">
                                {getSubjectShortName(paper.subject)}
                            </span>
                            <span className="size-1 rounded-full bg-muted-foreground/60 shrink-0" aria-hidden="true" />
                            <span className="font-semibold text-foreground/90 shrink-0">
                                {formatClassLevel(paper.class)}
                            </span>
                            <span className="size-1 rounded-full bg-muted-foreground/60 shrink-0" aria-hidden="true" />
                            <span className="font-semibold text-foreground/90 shrink-0">{paper.year}</span>
                            {paper.board ? (
                                <>
                                    <span className="size-1 rounded-full bg-muted-foreground/60 shrink-0" aria-hidden="true" />
                                    <span className="text-muted-foreground shrink-0 truncate max-w-[100px]">{paper.board}</span>
                                </>
                            ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 text-[11px]">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Progress
                            </span>
                            <span className="font-bold text-primary">
                                {completedUnitsCount}
                                <span className="font-medium text-muted-foreground"> / {totalTargetUnits}</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:gap-6 lg:gap-12">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Time Remaining
                            </p>
                            <div
                                className={cn(
                                    "mt-0.5 flex items-center gap-2 font-mono text-lg font-bold sm:text-2xl",
                                    { "text-destructive": isLowTime }
                                )}
                            >
                                <ClockSVG className="size-6 sm:size-7 shrink-0" />
                                {formatTime(timeLeft)}
                            </div>
                        </div>

                        {/* Paper Details Center (Large screens): CS . XII . 2025 . Chapter Name */}
                        <div className="hidden sm:flex flex-col items-center text-center">
                            <div className="flex items-center gap-2 text-xs font-bold text-foreground sm:text-sm">
                                <span className="shrink-0">{getSubjectShortName(paper.subject)}</span>
                                <span className="size-1 sm:size-1.5 rounded-full bg-muted-foreground/60 shrink-0" aria-hidden="true" />
                                <span className="shrink-0">{formatClassLevel(paper.class)}</span>
                                <span className="size-1 sm:size-1.5 rounded-full bg-muted-foreground/60 shrink-0" aria-hidden="true" />
                                <span className="shrink-0">{paper.year}</span>
                                {paper.board ? (
                                    <>
                                        <span className="size-1 sm:size-1.5 rounded-full bg-muted-foreground/60 shrink-0" aria-hidden="true" />
                                        <span className="shrink-0">{paper.board}</span>
                                    </>
                                ) : null}
                                {currentQuestion?.chapterName ? (
                                    <>
                                        <span className="size-1 sm:size-1.5 rounded-full bg-muted-foreground/60 shrink-0" aria-hidden="true" />
                                        <span className="text-primary dark:text-primary-light font-bold">
                                            {currentQuestion.chapterName}
                                        </span>
                                    </>
                                ) : null}
                            </div>
                            <PaperHeaderSponsor placement="paper_2" />
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4">
                            {/* Progress for Large screens */}
                            <div className="hidden sm:block text-right">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Progress
                                </p>
                                <p className="mt-0.5 text-sm font-bold text-primary sm:text-base">
                                    {completedUnitsCount}
                                    <span className="font-medium text-muted-foreground">
                                        {" "}/ {totalTargetUnits}
                                    </span>
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleSaveAndExit}
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-xs font-bold text-muted-foreground shadow-xs transition-all hover:border-primary/50 hover:bg-muted hover:text-foreground active:scale-95"
                                title="Save your progress and exit"
                            >
                                <LogoutSVG className="size-3.5 text-muted-foreground" />
                                <span className="hidden sm:inline">Save & Exit</span>
                                <span className="sm:hidden">Exit</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    key={safeIndex}
                    className="exam-question-scroll mt-1 min-h-0 flex-1 overflow-y-auto overscroll-contain p-1 pb-4 animate-in fade-in slide-in-from-bottom-2 duration-300 sm:mt-3 lg:mt-6"
                >
                    {/* Chapter Name in separate line at top of Question no. on small screens */}
                    {currentQuestion.chapterName ? (
                        <div className="mb-1.5 flex items-center sm:hidden">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-black text-white dark:bg-white dark:text-black px-2.5 py-0.5 text-xs font-bold shadow-xs">
                                <span>{currentQuestion.chapterName}</span>
                            </span>
                        </div>
                    ) : null}

                    {/* Question Header Bar: Left (Question & QA bug button), Center (Choice badge & Short/Long QnA), Right (Marks) */}
                    <div className="relative mb-3 flex items-center justify-between gap-2 lg:mb-5">
                        {/* Left: Question Badge & QA Bug Button */}
                        <div className="flex items-center gap-2.5">
                            <span className={cn(
                                "rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-xs lg:px-4 lg:py-1.5 lg:text-sm",
                                isUrdu && "font-urdu"
                            )}>
                                {isUrdu ? "س " : "Question "}{isSindhBoard ? (safeIndex + 1) : `${currentQuestion.questionNumber ?? (safeIndex + 1)}${currentQuestion.questionPart || ""}`}
                            </span>
                            <QuestionQABugButton
                                questionId={currentQuestion.id}
                                questionNumber={currentQuestion.questionNumber}
                                pastPaperId={paper.id}
                                subject={paper.subject}
                                classNameStr={paper.class}
                                year={paper.year}
                                paperNumber={paper.paperNumber}
                                board={paper.board}
                                currentChapter={currentQuestion.chapterName}
                                questionText={currentQuestion.questionText}
                                imageUrl={currentQuestion.imageUrl}
                            />
                        </div>

                        {/* Center: Choice Badge & Short/Long QnA Badge */}
                        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 pointer-events-none">
                            {choiceLabel && (
                                <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 shadow-xs pointer-events-auto lg:px-4 lg:py-1.5 lg:text-sm">
                                    {choiceLabel}
                                </span>
                            )}
                            {currentQuestion.questionType ? (
                                <span
                                    className={cn(
                                        "rounded-lg border px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-xs pointer-events-auto lg:px-4 lg:py-1.5 lg:text-sm",
                                        currentQuestion.questionType?.toUpperCase() === "ERQ"
                                            ? "border-purple-500/30 bg-purple-500/15 text-purple-600 dark:text-purple-400"
                                            : "border-sky-500/30 bg-sky-500/15 text-sky-600 dark:text-sky-400"
                                    )}
                                >
                                    {isSindhBoard
                                        ? currentQuestion.questionType?.toUpperCase() === "ERQ"
                                            ? "Long QnA"
                                            : "Short QnA"
                                        : currentQuestion.questionType?.toUpperCase()}
                                </span>
                            ) : null}
                        </div>

                        {/* Right: Marks */}
                        <span className="shrink-0 rounded-lg bg-muted/40 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground lg:text-sm">
                            {currentQuestion.marks ?? 5} Mark{currentQuestion.marks !== 1 ? "s" : ""}
                        </span>
                    </div>

                    <div
                        dir={isUrdu ? "rtl" : "ltr"}
                        className={cn(
                            "mb-4 text-sm text-foreground whitespace-pre-line lg:mb-6 lg:text-base leading-relaxed",
                            isUrdu ? "font-urdu text-right leading-[2.2]" : "text-left"
                        )}
                    >
                        <span
                            dangerouslySetInnerHTML={{
                                __html: convertMathToHTML(currentQuestion.questionText || ""),
                            }}
                        />
                    </div>

                    {currentQuestion.imageUrl ? (
                        <QuestionImage
                            src={currentQuestion.imageUrl}
                            alt="Question diagram"
                            className="max-h-72 sm:max-h-96 rounded-lg"
                            skeletonHeightClass="h-72 sm:h-96"
                            containerClassName="mb-4 sm:mb-5"
                        />
                    ) : null}

                    <ExamUploadZone
                        upload={currentUpload}
                        onAddFiles={(files) =>
                            files.length > 0 &&
                            handleFileSelect(currentQuestion.id, files[0])
                        }
                        onRetry={() => retryUpload(currentQuestion.id)}
                        onRemove={() => handleRemoveUpload(currentQuestion.id)}
                    />
                </div>
            </div>

            <ExamNavigation
                currentIndex={safeIndex}
                total={questions.length}
                isSubmitting={isSubmitting}
                finishDisabled={pendingUploads.length > 0}
                onPrevious={() => handleQuestionIndexChange(Math.max(0, safeIndex - 1))}
                onNext={() => handleQuestionIndexChange(Math.min(questions.length - 1, safeIndex + 1))}
                onFinish={handleSubmitClick}
                onQuestionSelect={(idx) => handleQuestionIndexChange(idx)}
                questionStatuses={questionStatuses}
            />

            <ConfirmationModal
                isOpen={showResumeModal}
                onClose={() => setShowResumeModal(false)}
                onConfirm={handleResume}
                title="Unsubmitted Progress"
                message="You have unsubmitted progress from a previous session. Do you want to continue where you left off or reset and start fresh?"
                confirmLabel="Continue"
                cancelLabel="Reset"
                onCancelClick={handleReset}
            />

            <ConfirmationModal
                isOpen={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                onConfirm={handleSubmit}
                title="Unanswered Questions"
                message={`You have ${unansweredCount} unanswered question${unansweredCount !== 1 ? "s" : ""}. Are you sure you want to submit anyway?`}
                confirmLabel="Submit Anyway"
                cancelLabel="Go Back"
                variant="warning"
            />
        </ExamAntiCheatShell>
    );
}
