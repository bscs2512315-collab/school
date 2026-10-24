"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import PageContainer from "@/components/PageContainer";
import { Typography } from "@/components/ui/Typography";
import AppButton from "@/components/AppButton";
import { AlertCircle, Sparkles } from "lucide-react";
import RefreshSVG from "@/public/svgs/RefreshSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import CloseCircleSVG from "@/public/svgs/CloseCircleSVG";
import SyllabusSVG from "@/public/svgs/SyllabusSVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import LogoutSVG from "@/public/svgs/LogoutSVG";
import toast from "react-hot-toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import ExamNavigation from "@/components/exam/ExamNavigation";
import McqOptionButton from "@/components/exam/McqOptionButton";
import { isShortMcqOption } from "@/lib/exam/mcq-options";
import ExamAntiCheatShell from "@/components/exam/ExamAntiCheatShell";
import { SECONDS_PER_QUESTION } from "@/lib/paper/exam-duration";
import QuestionImage from "@/components/exam/QuestionImage";
import { useQuestionDiagramPreloader } from "@/hooks/exam/useQuestionDiagramPreloader";
import { useStudentPastPaperDetail } from "@/hooks/student/useStudentPastPaperDetail";
import { useSubmitPaper1Attempt } from "@/hooks/student/useStudentAttempt";
import type { PastPaperDetail, PastPaperQuestion } from "@/types/past-paper";
import { getSubjectShortName, formatClassLevel } from "@/lib/paper/subject-mapping";
import { convertMathToHTML, isUrduText } from "@/lib/utils/math-notation";
import { cn } from "@/lib/utils";
import AppLoader from "@/components/AppLoader";
import AppState from "@/components/AppState";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import PaperHeaderSponsor from "@/components/exam/PaperHeaderSponsor";
import { ensureStoredUser } from "@/lib/auth-session";
import QuestionQABugButton from "@/components/qa/QuestionQABugButton";

interface QuestionResult {
    correct: boolean;
    correctAnswer: string | null;
    selectedAnswer: string | null;
}

interface ExamResult {
    score: number;
    totalMarks: number;
    percentage: number;
    pointsAwarded: number;
    questionResults: Record<string, QuestionResult>;
}

// ─── Result Screen ──────────────────────────────────────────────────────────────
function ResultScreen({
    paper,
    mcqQuestions,
    result,
    onRetry,
}: {
    paper: PastPaperDetail;
    mcqQuestions: PastPaperQuestion[];
    result: ExamResult;
    onRetry: () => void;
}) {
    const getGradeInfo = (pct: number) => {
        if (pct >= 96) return { grade: "A++", remark: "Exceptional" };
        if (pct >= 91) return { grade: "A+", remark: "Outstanding" };
        if (pct >= 86) return { grade: "A", remark: "Excellent" };
        if (pct >= 81) return { grade: "B++", remark: "Very Good" };
        if (pct >= 76) return { grade: "B+", remark: "Good" };
        if (pct >= 71) return { grade: "B", remark: "Fairly Good" };
        if (pct >= 61) return { grade: "C+", remark: "Above Average" };
        if (pct >= 51) return { grade: "C", remark: "Average" };
        if (pct >= 40) return { grade: "D", remark: "Below Average" };
        return { grade: "U", remark: "Below Pass" };
    };

    const getNovaFeedback = (pct: number, score: number) => {
        if (score === 0) {
            return {
                title: "Keep Your Head High!",
                message: "Every expert started somewhere. Don't be discouraged! Take time to study each solution in the breakdown below, understand the reasoning, and let's try again.",
            };
        }
        if (pct >= 90) {
            return {
                title: "Mastery Achieved! 🌟",
                message: "Outstanding performance! You've conquered this paper with top marks. Keep up this incredible momentum for your exams!",
            };
        }
        if (pct >= 75) {
            return {
                title: "Great Job! 🎯",
                message: "Impressive work! You demonstrated strong conceptual understanding. Review the few questions you missed below to aim for 100%!",
            };
        }
        if (pct >= 60) {
            return {
                title: "Good Effort! 📈",
                message: "Solid attempt! You've passed comfortably, but there are a few areas worth strengthening. Check out the answers below and give it another go!",
            };
        }
        if (pct >= 45) {
            return {
                title: "Passed, Let's Push Further! 💪",
                message: "You cleared the passing benchmark! Revisiting the topics you struggled with and attempting another run will push your score much higher.",
            };
        }
        return {
            title: "Practice Makes Progress! 💡",
            message: "Don't fret over this score! Focus on learning from the answer breakdown below, note down the formulas or rules, and re-attempt to see your growth.",
        };
    };

    const gradeInfo = getGradeInfo(result.percentage);
    const novaFeedback = getNovaFeedback(result.percentage, result.score);

    return (
        <div className="flex w-full flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 sm:gap-6">
            {/* Score Card Hero */}
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                <div className="relative overflow-hidden bg-primary px-4 pt-5 pb-0 sm:px-6 sm:pt-6 sm:pb-0 md:px-7 md:pt-7 md:pb-0 text-primary-foreground">
                    {/* Background Subtle Ambient Glow */}
                    <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-3xl" />

                    {/* Mobile Nova Speech Bubble (< md) */}
                    <div className="relative z-10 mb-3 w-full rounded-2xl border border-primary-foreground/25 bg-primary-foreground/15 p-2.5 sm:p-3 text-left shadow-xs backdrop-blur-md md:hidden">
                        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground/90">
                            <Sparkles className="size-3 text-amber-300 shrink-0" />
                            <span className="shrink-0">Nova AI Tutor</span>
                            <span className="text-primary-foreground/60">•</span>
                            <span className="truncate text-amber-200">{novaFeedback.title}</span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] font-medium leading-snug text-primary-foreground">
                            &ldquo;{novaFeedback.message}&rdquo;
                        </p>
                    </div>

                    {/* Main Content: Score & Subject Info + Desktop Speech Bubble + Nova Mascot */}
                    <div className="relative z-10 flex items-end justify-between gap-4 md:gap-6">
                        {/* Score & Paper Details Section */}
                        <div className="shrink-0 pb-2.5 text-left sm:pb-3 md:pb-3.5">
                            {/* Score Numbers */}
                            <div className="flex items-baseline gap-1.5 sm:gap-2">
                                <span className="text-5xl sm:text-6xl md:text-7xl font-black leading-none tracking-tight">
                                    {result.score}
                                </span>
                                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-foreground/60">
                                    / {result.totalMarks}
                                </span>
                            </div>

                            {/* Grade Remark - Right below score with tight spacing */}
                            <p className="mt-1 text-lg sm:text-xl md:text-2xl font-bold leading-none tracking-tight text-primary-foreground">
                                {gradeInfo.remark}
                            </p>

                            {/* Subject & Paper Info placed below Below Pass */}
                            <div className="mt-2.5 sm:mt-3">
                                <p className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-primary-foreground">
                                    {paper.subject}
                                </p>
                                <p className="mt-0.5 text-xs sm:text-sm font-medium text-primary-foreground/80">
                                    {formatClassLevel(paper.class) || paper.class} • {paper.year}
                                    {paper.board ? ` • ${paper.board}` : ""}
                                    {paper.paperNumber ? ` • Paper ${paper.paperNumber}` : ""}
                                </p>
                            </div>
                        </div>

                        {/* Desktop Nova Speech Bubble (positioned slightly higher on large screens) */}
                        <div className="hidden md:flex flex-1 min-w-0 my-auto self-center md:mb-4 lg:mb-6 flex-col rounded-2xl border border-primary-foreground/25 bg-primary-foreground/15 p-3.5 lg:p-4 text-left shadow-xs backdrop-blur-md">
                            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary-foreground/90">
                                <Sparkles className="size-3.5 text-amber-300 shrink-0" />
                                <span className="shrink-0">Nova AI Tutor</span>
                                <span className="text-primary-foreground/60">•</span>
                                <span className="truncate text-amber-200">{novaFeedback.title}</span>
                            </div>
                            <p className="text-xs lg:text-sm font-medium leading-relaxed text-primary-foreground">
                                &ldquo;{novaFeedback.message}&rdquo;
                            </p>
                        </div>

                        {/* Nova Tutor Mascot - Prominent & flush to bottom */}
                        <div className="relative -mb-px flex h-36 w-28 shrink-0 items-end justify-center self-end sm:h-40 sm:w-32 md:h-48 md:w-40 lg:h-52 lg:w-44">
                            <Image
                                src="/nova-tutor.webp"
                                alt="Nova AI Tutor"
                                fill
                                priority
                                sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, (max-width: 1024px) 176px, 192px"
                                className="object-contain object-bottom drop-shadow-lg"
                            />
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 divide-x divide-border border-t border-border bg-card">
                    {[
                        { label: "Grade", value: gradeInfo.grade },
                        { label: "Accuracy", value: `${result.percentage}%` },
                        { label: "Points", value: `+${result.pointsAwarded}` },
                    ].map((stat) => (
                        <div key={stat.label} className="px-2 py-3 text-center sm:py-4 md:py-5">
                            <div className="text-lg font-bold text-foreground sm:text-2xl md:text-3xl">
                                {stat.value}
                            </div>
                            <div className="mt-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-row items-center gap-3">
                <AppButton
                    onClick={onRetry}
                    className="h-11 sm:h-12 flex-1 rounded-xl sm:rounded-2xl font-semibold"
                >
                    <RefreshSVG className="mr-2 size-4" />
                    Re Attempt
                </AppButton>
            </div>

            {/* Per-question Breakdown */}
            <div>
                <div className="mb-4 flex items-center gap-2.5 sm:mb-5 sm:gap-3">
                    <div className="h-5 sm:h-6 w-1.5 rounded-full bg-primary" />
                    <Typography variant="h3" className="text-base font-bold tracking-tight sm:text-lg md:text-xl">
                        Answer Breakdown
                        <span className="ml-2 text-xs sm:text-sm font-semibold text-muted-foreground">
                            {mcqQuestions.length} questions
                        </span>
                    </Typography>
                </div>
                <div className="space-y-3">
                    {mcqQuestions.map((question, idx) => {
                        const qResult = result.questionResults[question.id];
                        const isCorrect = qResult?.correct ?? false;
                        const selectedOpt = question.mcqOptions?.find(
                            (o) => o.id?.toUpperCase() === qResult?.selectedAnswer?.toUpperCase()
                        );
                        const correctOpt = question.mcqOptions?.find(
                            (o) => o.id?.toUpperCase() === qResult?.correctAnswer?.toUpperCase()
                        );

                        const isUrdu =
                            isUrduText(question.questionText) ||
                            paper.subject?.toLowerCase().includes("urdu") ||
                            question.mcqOptions?.some((opt) => isUrduText(opt.text));

                        return (
                            <div
                                key={question.id}
                                className={cn("rounded-2xl border p-3.5 sm:p-5 transition-all", {
                                    "border-primary/30 bg-primary/5": isCorrect,
                                    "border-destructive/30 bg-destructive/5": !isCorrect,
                                })}
                            >
                                <div className="min-w-0">
                                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                            Q{idx + 1}
                                        </span>
                                        {question.chapterName ? (
                                            <span className="inline-flex items-center rounded-md bg-black text-white dark:bg-white dark:text-black px-2 py-0.5 text-[10px] font-bold shrink-0">
                                                {question.chapterName}
                                            </span>
                                        ) : null}
                                        <span className="text-[10px] font-semibold text-muted-foreground">
                                            · {question.marks} mark{question.marks !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    <div
                                        dir={isUrdu ? "rtl" : "ltr"}
                                        className={cn(
                                            "mb-3 text-xs sm:text-sm font-medium text-foreground",
                                            isUrdu ? "font-urdu text-right leading-[2.2]" : "leading-relaxed text-left"
                                        )}
                                        dangerouslySetInnerHTML={{
                                            __html: convertMathToHTML(question.questionText),
                                        }}
                                    />
                                    {question.imageUrl ? (
                                        <QuestionImage
                                            src={question.imageUrl}
                                            alt="Question diagram"
                                            className="max-h-32 rounded-lg border border-border/40 bg-muted/20"
                                            skeletonHeightClass="h-28 sm:h-32"
                                            containerClassName="mb-3 sm:mb-4"
                                        />
                                    ) : null}
                                    {!qResult?.selectedAnswer ? (
                                        <div
                                            dir={isUrdu ? "rtl" : "ltr"}
                                            className={cn(
                                                "mb-2 inline-flex items-center gap-1.5 rounded-xl bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground",
                                                isUrdu && "font-urdu text-right"
                                            )}
                                        >
                                            <SyllabusSVG className="size-3.5 shrink-0" />
                                            <span>{isUrdu ? "حل نہیں کیا گیا" : "Not attempted"}</span>
                                        </div>
                                    ) : null}

                                    {question.mcqOptions && question.mcqOptions.length > 0 ? (
                                        <div className="mt-2 space-y-2">
                                            {question.mcqOptions.map((opt, optIdx) => {
                                                const normalize = (value?: string | null) =>
                                                    String(value ?? "").trim().toUpperCase();
                                                const optLetter = opt.id || String.fromCharCode(65 + optIdx);
                                                const optIdNorm = normalize(optLetter);
                                                const optTextNorm = normalize(opt.text);

                                                const isCorrectOption =
                                                    (qResult?.correctAnswer != null &&
                                                        (normalize(qResult.correctAnswer) === optIdNorm ||
                                                            normalize(qResult.correctAnswer) === optTextNorm)) ||
                                                    (question.correctAnswer != null &&
                                                        (normalize(question.correctAnswer) === optIdNorm ||
                                                            normalize(question.correctAnswer) === optTextNorm));

                                                const isSelectedOption =
                                                    qResult?.selectedAnswer != null &&
                                                    (normalize(qResult.selectedAnswer) === optIdNorm ||
                                                        normalize(qResult.selectedAnswer) === optTextNorm);

                                                const isOptUrdu = isUrdu || isUrduText(opt.text);
                                                const rawText = (opt.text || "").trim();
                                                const strippedText = rawText
                                                    .replace(/^([A-Da-d][\.\)]|\([A-Da-d]\))\s*/, "")
                                                    .trim();
                                                const displayText = strippedText || rawText;

                                                return (
                                                    <div
                                                        key={opt.id || optIdx}
                                                        dir={isOptUrdu ? "rtl" : "ltr"}
                                                        className={cn(
                                                            "flex items-center justify-between gap-3 rounded-xl border p-2.5 sm:p-3 transition-colors",
                                                            isCorrectOption
                                                                ? "border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-500/20"
                                                                : isSelectedOption
                                                                    ? "border-destructive/50 bg-destructive/10 dark:bg-destructive/20"
                                                                    : "border-border/60 bg-card/60"
                                                        )}
                                                    >
                                                        <div
                                                            className={cn(
                                                                "flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1",
                                                                isOptUrdu && "flex-row-reverse text-right"
                                                            )}
                                                        >
                                                            <span
                                                                className={cn(
                                                                    "flex size-6.5 sm:size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold font-sans select-none",
                                                                    isCorrectOption
                                                                        ? "bg-emerald-600 text-white shadow-xs"
                                                                        : isSelectedOption
                                                                            ? "bg-destructive text-destructive-foreground shadow-xs"
                                                                            : "bg-muted text-muted-foreground border border-border/50"
                                                                )}
                                                            >
                                                                {optLetter}
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    "min-w-0 flex-1 text-xs sm:text-sm",
                                                                    isCorrectOption
                                                                        ? "text-emerald-700 dark:text-emerald-300 font-semibold"
                                                                        : isSelectedOption
                                                                            ? "text-destructive font-semibold"
                                                                            : "text-foreground font-medium",
                                                                    isOptUrdu
                                                                        ? "font-urdu text-right leading-[2.2]"
                                                                        : "text-left leading-relaxed"
                                                                )}
                                                                dangerouslySetInnerHTML={{
                                                                    __html: convertMathToHTML(displayText),
                                                                }}
                                                            />
                                                        </div>

                                                        {/* Status badges */}
                                                        <div className="flex shrink-0 items-center gap-1.5">
                                                            {isCorrectOption && isSelectedOption ? (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                                                                    <CheckCircleSVG className="size-3" />
                                                                    {isOptUrdu ? "صحیح / آپ کا انتخاب" : "Correct / Your Choice"}
                                                                </span>
                                                            ) : isCorrectOption ? (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                                                    <CheckCircleSVG className="size-3" />
                                                                    {isOptUrdu ? "صحیح جواب" : "Correct"}
                                                                </span>
                                                            ) : isSelectedOption ? (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 text-destructive px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                                                    <CloseCircleSVG className="size-3" />
                                                                    {isOptUrdu ? "آپ کا جواب" : "Your Choice"}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className={cn("flex flex-col gap-1.5 sm:gap-2", isUrdu ? "items-end" : "items-start")}>
                                            {!isCorrect && qResult?.selectedAnswer ? (
                                                <div dir={isUrdu ? "rtl" : "ltr"} className={cn("flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive", isUrdu && "font-urdu text-right")}>
                                                    <CloseCircleSVG className="mt-0.5 size-3.5 shrink-0" />
                                                    <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                                                        <span className="font-bold">{isUrdu ? "آپ کا جواب:" : "Your answer:"}</span>
                                                        <div className="break-words">
                                                            <span className="font-semibold">
                                                                {selectedOpt ? `${selectedOpt.id}. ` : (qResult?.selectedAnswer ? `Option ${qResult.selectedAnswer} ` : "— ")}
                                                            </span>
                                                            <span
                                                                dangerouslySetInnerHTML={{
                                                                    __html: convertMathToHTML(selectedOpt?.text ?? ""),
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null}
                                            <div dir={isUrdu ? "rtl" : "ltr"} className={cn("flex items-start gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-medium text-primary", isUrdu && "font-urdu text-right")}>
                                                <CheckCircleSVG className="mt-0.5 size-3.5 shrink-0" />
                                                <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                                                    <span className="font-bold">{isUrdu ? "صحیح جواب:" : "Correct:"}</span>
                                                    <div className="break-words">
                                                        <span className="font-semibold">
                                                            {correctOpt ? `${correctOpt.id}. ` : (qResult?.correctAnswer ? `Option ${qResult.correctAnswer} ` : "— ")}
                                                        </span>
                                                        <span
                                                            dangerouslySetInnerHTML={{
                                                                __html: convertMathToHTML(correctOpt?.text ?? ""),
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Main Exam Page ──────────────────────────────────────────────────────────────
export default function StudentAttemptPaperPage() {
    const router = useRouter();
    const params = useParams();
    const paperId = (params?.id as string) || "";

    const paperQuery = useStudentPastPaperDetail(paperId);
    const submitPaper1Mutation = useSubmitPaper1Attempt();

    const paper = paperQuery.data ?? null;
    const mcqQuestions: PastPaperQuestion[] = useMemo(() => {
        const allQuestions = paper?.questions || [];
        return allQuestions.filter(
            (q) => q.questionType?.toUpperCase() === "MCQ",
        );
    }, [paper]);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeLeft, setTimeLeft] = useState(3600); // 1 hour default
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [examResult, setExamResult] = useState<ExamResult | null>(null);

    const [showResumeModal, setShowResumeModal] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [pendingAnswers, setPendingAnswers] = useState<Record<string, string> | null>(null);
    const [pendingQuestionIndex, setPendingQuestionIndex] = useState<number | null>(null);

    const initializedPaperIdRef = useRef<string | null>(null);

    const safeIndex = mcqQuestions.length > 0
        ? Math.min(Math.max(0, currentQuestionIndex), mcqQuestions.length - 1)
        : 0;

    // Preload next 5 question diagrams silently in the background
    useQuestionDiagramPreloader(mcqQuestions, safeIndex, 5);

    const saveProgress = useCallback((
        currentAnswers?: Record<string, string>,
        time?: number,
        qIndex?: number,
    ) => {
        const storedUser = localStorage.getItem("exboard_user");
        const user = storedUser ? JSON.parse(storedUser) : null;
        const userId = user?.id || user?.userId;
        if (!userId) return;

        const progressKey = `exam_answers_${userId}_${paperId}`;
        const persistentTimeKey = `exam_time_left_${userId}_${paperId}`;
        const qIndexKey = `exam_question_index_${userId}_${paperId}`;

        const toSaveAnswers = currentAnswers ?? answers;
        const toSaveTime = time ?? timeLeft;
        const toSaveIndex = qIndex ?? safeIndex;

        if (Object.keys(toSaveAnswers).length > 0) {
            localStorage.setItem(progressKey, JSON.stringify(toSaveAnswers));
        }
        localStorage.setItem(persistentTimeKey, toSaveTime.toString());
        localStorage.setItem(qIndexKey, toSaveIndex.toString());
    }, [paperId, answers, timeLeft, safeIndex]);

    const handleQuestionIndexChange = (newIndex: number) => {
        const target = Math.min(Math.max(0, newIndex), Math.max(0, mcqQuestions.length - 1));
        setCurrentQuestionIndex(target);
        saveProgress(answers, timeLeft, target);
    };

    const handleSaveAndExit = () => {
        saveProgress(answers, timeLeft, safeIndex);
        toast.success("Progress saved! You can resume anytime.", { icon: "💾" });
        router.push(FRONTEND_ROUTES.STUDENT_PAST_PAPERS_1);
    };

    useEffect(() => {
        if (!paper || mcqQuestions.length === 0) return;
        if (initializedPaperIdRef.current === paperId) return;
        initializedPaperIdRef.current = paperId;

        const storedUser = localStorage.getItem("exboard_user");
        const user = storedUser ? JSON.parse(storedUser) : null;
        const userId = user?.id || user?.userId;

        if (userId) {
            const progressKey = `exam_answers_${userId}_${paperId}`;
            const qIndexKey = `exam_question_index_${userId}_${paperId}`;
            const savedAnswers = localStorage.getItem(progressKey);
            const savedQIndex = localStorage.getItem(qIndexKey);
            if (savedAnswers) {
                try {
                    const parsed = JSON.parse(savedAnswers);
                    if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
                        setPendingAnswers(parsed);
                        if (savedQIndex !== null) {
                            const idx = parseInt(savedQIndex, 10);
                            if (!isNaN(idx) && idx >= 0 && idx < mcqQuestions.length) {
                                setPendingQuestionIndex(idx);
                            }
                        }
                        setShowResumeModal(true);
                    }
                } catch (e) {
                    console.error("Error parsing saved answers", e);
                }
            }
        }

        const totalDuration = Math.min(Math.max(Math.round(mcqQuestions.length * SECONDS_PER_QUESTION), 600), 3600);

        if (userId) {
            const timerKey = `exam_start_${userId}_${paperId}`;
            const persistentTimeKey = `exam_time_left_${userId}_${paperId}`;

            const savedTimeLeft = localStorage.getItem(persistentTimeKey);

            if (savedTimeLeft) {
                const parsedTime = parseInt(savedTimeLeft, 10);
                if (!isNaN(parsedTime) && parsedTime >= 0) {
                    setTimeLeft(parsedTime);
                } else {
                    setTimeLeft(totalDuration);
                }
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
    }, [paper, mcqQuestions, paperId]);

    // Timer countdown (stops when result is shown)
    useEffect(() => {
        if (timeLeft > 0 && !examResult && !isSubmitting && paper && mcqQuestions.length > 0) {
            const timer = setTimeout(() => {
                const newTime = timeLeft - 1;
                setTimeLeft(newTime);

                // Periodically save timeLeft to localStorage
                if (newTime % 5 === 0) {
                    const storedUser = localStorage.getItem("exboard_user");
                    const user = storedUser ? JSON.parse(storedUser) : null;
                    const userId = user?.id || user?.userId;
                    if (userId) {
                        const persistentTimeKey = `exam_time_left_${userId}_${paperId}`;
                        localStorage.setItem(persistentTimeKey, newTime.toString());
                    }
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
        // Auto-submit when time runs out
        if (timeLeft === 0 && !examResult && paper && mcqQuestions.length > 0 && !isSubmitting) {
            handleSubmit();
        }
    }, [timeLeft, examResult, isSubmitting, paper, mcqQuestions.length, paperId]);

    const handleOptionSelect = (questionId: string, optionId: string) => {
        setAnswers((prev) => {
            const newAnswers = { ...prev, [questionId]: optionId };
            saveProgress(newAnswers, timeLeft, safeIndex);
            return newAnswers;
        });
    };

    const handleResume = () => {
        if (pendingAnswers) {
            setAnswers(pendingAnswers);
        }
        if (
            pendingQuestionIndex !== null &&
            !isNaN(pendingQuestionIndex) &&
            pendingQuestionIndex >= 0 &&
            pendingQuestionIndex < mcqQuestions.length
        ) {
            setCurrentQuestionIndex(pendingQuestionIndex);
        }
        setShowResumeModal(false);
        setPendingAnswers(null);
        setPendingQuestionIndex(null);
        toast.success("Resumed your exam progress from where you left off!", { icon: "🎯" });
    };

    const handleReset = () => {
        const storedUser = localStorage.getItem("exboard_user");
        const user = storedUser ? JSON.parse(storedUser) : null;
        const userId = user?.id || user?.userId;
        if (userId) {
            const timerKey = `exam_start_${userId}_${paperId}`;
            const progressKey = `exam_answers_${userId}_${paperId}`;
            const persistentTimeKey = `exam_time_left_${userId}_${paperId}`;
            const qIndexKey = `exam_question_index_${userId}_${paperId}`;
            localStorage.removeItem(timerKey);
            localStorage.removeItem(progressKey);
            localStorage.removeItem(persistentTimeKey);
            localStorage.removeItem(qIndexKey);
            localStorage.setItem(timerKey, Date.now().toString());
        }
        setAnswers({});
        setCurrentQuestionIndex(0);
        setTimeLeft(Math.min(Math.max(Math.round(mcqQuestions.length * SECONDS_PER_QUESTION), 600), 3600));
        setShowResumeModal(false);
        setPendingAnswers(null);
        setPendingQuestionIndex(null);
    };

    const handleSubmitClick = () => {
        const unanswered = mcqQuestions.filter((q) => !answers[q.id]).length;
        if (unanswered > 0 && timeLeft > 0) {
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
            const userAtSubmit = await ensureStoredUser();
            const userIdAtSubmit = userAtSubmit?.id || userAtSubmit?.userId;

            if (!userIdAtSubmit) {
                toast.error("User session not found. Please log in again.");
                router.push("/login");
                return;
            }

            const submissionData = {
                userId: userIdAtSubmit,
                paperId: paper.id,
                answers,
                timeTaken: Math.max(0, Math.round(mcqQuestions.length * SECONDS_PER_QUESTION) - timeLeft),
            };

            const resultData = await submitPaper1Mutation.mutateAsync(submissionData) as ExamResult;

            setExamResult(resultData);
            toast.success(`🎉 Submitted! You scored ${resultData.score}/${resultData.totalMarks}`);

            const timerKey = `exam_start_${userIdAtSubmit}_${paperId}`;
            const progressKey = `exam_answers_${userIdAtSubmit}_${paperId}`;
            const persistentTimeKey = `exam_time_left_${userIdAtSubmit}_${paperId}`;
            const qIndexKey = `exam_question_index_${userIdAtSubmit}_${paperId}`;
            localStorage.removeItem(timerKey);
            localStorage.removeItem(progressKey);
            localStorage.removeItem(persistentTimeKey);
            localStorage.removeItem(qIndexKey);

            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (error: unknown) {
            console.error("Submission error:", error);
            const message = error instanceof Error ? error.message : "Failed to submit exam.";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRetry = () => {
        setAnswers({});
        setCurrentQuestionIndex(0);
        setExamResult(null);
        setTimeLeft(Math.min(Math.max(Math.round(mcqQuestions.length * SECONDS_PER_QUESTION), 600), 3600));
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    if (paperQuery.isLoading) {
        return <AppLoader fullScreen />;
    }

    if (!paper || mcqQuestions.length === 0) {
        return (
            <PageContainer>
                <AppState
                    isEmpty={true}
                    title={!paper ? "Exam Not Available" : "No MCQ Questions"}
                    description={
                        !paper
                            ? "We could not load the exam. Please try again."
                            : "This paper has no MCQ (Paper I) questions to attempt."
                    }
                    icon={AlertCircle}
                    action={{
                        label: "Back to Past Papers",
                        onClick: () => router.push(FRONTEND_ROUTES.STUDENT_PAST_PAPERS_1),
                    }}
                    fullScreen={false}
                />
            </PageContainer>
        );
    }

    // ── Show Result Screen ────────────────────────────────────────────────────
    if (examResult) {
        return (
            <div className="h-full w-full min-h-0 flex-1 overflow-y-auto custom-scrollbar">
                <PageContainer>
                    <ResultScreen
                        paper={paper}
                        mcqQuestions={mcqQuestions}
                        result={examResult}
                        onRetry={handleRetry}
                    />
                </PageContainer>
            </div>
        );
    }

    // ── Exam Interface ─────────────────────────────────────────────────────────
    const currentQuestion = mcqQuestions[safeIndex];
    const answeredCount = Object.keys(answers).length;
    const isLowTime = timeLeft < 300; // < 5 mins
    const options = currentQuestion?.mcqOptions ?? [];
    const useCompactOptions = options.length > 0 && options.every((opt) => isShortMcqOption(opt.text));
    const isCurrentQUrdu =
        isUrduText(currentQuestion?.questionText || "") ||
        paper.subject?.toLowerCase().includes("urdu") ||
        options.some((opt) => isUrduText(opt.text));

    return (
        <ExamAntiCheatShell
            enabled={!isSubmitting}
            strictMode={paper.strictMode ?? false}
            allowResume={paper.allowResume ?? true}
            onSaveProgress={() => saveProgress(answers, timeLeft, safeIndex)}
            onLeaveExam={() => {
                saveProgress(answers, timeLeft, safeIndex);
                if (paper.strictMode && !paper.allowResume) {
                    if (!isSubmitting) handleSubmit();
                }
            }}
            className="h-full min-h-0 bg-background"
        >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 lg:px-6 xl:px-8">
                {/* Timer */}
                <div className="shrink-0 pt-2 pb-1 sm:py-3 lg:py-4">
                    {/* Small screens: Subject, Class, and Year at left, Progress in single line at right */}
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
                                {answeredCount}
                                <span className="font-medium text-muted-foreground"> / {mcqQuestions.length}</span>
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
                            <PaperHeaderSponsor placement="paper_1" />
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4">
                            {/* Progress for Large screens */}
                            <div className="hidden sm:block text-right">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Progress
                                </p>
                                <p className="mt-0.5 text-sm font-bold text-primary sm:text-base">
                                    {answeredCount}
                                    <span className="font-medium text-muted-foreground">
                                        {" "}/ {mcqQuestions.length}
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

                {/* Question + options */}
                <div
                    key={currentQuestionIndex}
                    className="exam-question-scroll mt-1 min-h-0 flex-1 overflow-y-auto p-1 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 sm:mt-3 lg:mt-5"
                >
                    {/* Chapter Name in separate line at top of Question no. on small screens */}
                    {currentQuestion.chapterName ? (
                        <div className="mb-1.5 flex items-center sm:hidden">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-black text-white dark:bg-white dark:text-black px-2.5 py-0.5 text-xs font-bold shadow-xs">
                                <span>{currentQuestion.chapterName}</span>
                            </span>
                        </div>
                    ) : null}

                    <div className="mb-3 flex items-center justify-between gap-3 lg:mb-5">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <span className={cn(
                                "rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground lg:px-4 lg:py-1.5 lg:text-sm shadow-xs",
                                isCurrentQUrdu && "font-urdu"
                            )}>
                                {isCurrentQUrdu ? "س " : "Question "}{currentQuestion.questionNumber}
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
                        <span className="shrink-0 rounded-lg bg-muted/40 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground lg:text-sm">
                            {currentQuestion.marks} Mark{currentQuestion.marks !== 1 ? "s" : ""}
                        </span>
                    </div>

                    <div
                        dir={isCurrentQUrdu ? "rtl" : "ltr"}
                        className={cn(
                            "mb-4 text-sm text-foreground lg:mb-6 lg:text-lg",
                            isCurrentQUrdu ? "font-urdu text-right leading-[2.2]" : "leading-relaxed text-left"
                        )}
                    >
                        <span
                            dangerouslySetInnerHTML={{
                                __html: convertMathToHTML(currentQuestion.questionText),
                            }}
                        />
                    </div>

                    {currentQuestion.imageUrl ? (
                        <QuestionImage
                            src={currentQuestion.imageUrl}
                            alt="Question diagram"
                            className="max-h-72 sm:max-h-96 rounded-lg"
                            skeletonHeightClass="h-72 sm:h-96"
                            containerClassName="mb-3 sm:mb-5"
                        />
                    ) : null}

                    {options.length > 0 ? (
                        <div
                            dir={isCurrentQUrdu ? "rtl" : "ltr"}
                            className="grid grid-cols-1 gap-2 pb-2 lg:gap-4"
                        >
                            {options.map((opt, idx) => {
                                const isSelected = answers[currentQuestion.id] === opt.id;
                                return (
                                    <McqOptionButton
                                        key={opt.id}
                                        option={opt}
                                        index={idx}
                                        isSelected={isSelected}
                                        compact={useCompactOptions}
                                        isUrdu={isCurrentQUrdu}
                                        onSelect={() => handleOptionSelect(currentQuestion.id, opt.id)}
                                    />
                                );
                            })}
                        </div>
                    ) : null}
                </div>
            </div>

            <ExamNavigation
                currentIndex={currentQuestionIndex}
                total={mcqQuestions.length}
                isSubmitting={isSubmitting}
                onPrevious={() => handleQuestionIndexChange(Math.max(0, currentQuestionIndex - 1))}
                onNext={() => handleQuestionIndexChange(Math.min(mcqQuestions.length - 1, currentQuestionIndex + 1))}
                onFinish={handleSubmitClick}
                onQuestionSelect={(idx) => handleQuestionIndexChange(idx)}
                questionStatuses={mcqQuestions.map((question) =>
                    answers[question.id] ? "answered" : "default",
                )}
            />

            <ConfirmationModal
                isOpen={showResumeModal}
                onClose={() => setShowResumeModal(false)}
                onConfirm={handleResume}
                title="Unsubmitted Progress"
                message="You have unsubmitted progress from a previous session. Do you want to continue where you left off or reset and start fresh?"
                confirmLabel="Continue"
                cancelLabel="Reset"
                onCancelClick={handleReset} // Adding a custom cancel handler for this specific case
            />

            <ConfirmationModal
                isOpen={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                onConfirm={handleSubmit}
                title="Unanswered Questions"
                message={`You have ${mcqQuestions.filter((q) => !answers[q.id]).length} unanswered questions. Are you sure you want to submit anyway?`}
                confirmLabel="Submit Anyway"
                cancelLabel="Go Back"
                variant="warning"
            />
        </ExamAntiCheatShell>
    );
}

// Helper to allow custom cancel action in ConfirmationModal easily if needed
// Actually, I should probably update ConfirmationModal to support a custom cancel handler.
