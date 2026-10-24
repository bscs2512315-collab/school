"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Swords, ChevronRight, ChevronLeft, Loader2, CheckCircle2, XCircle, Clock, Send, ArrowLeft, Crown, Medal, Award } from "lucide-react";
import TrophySVG from "@/public/svgs/TrophySVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import PageContainer from "@/components/PageContainer";
import AppButton from "@/components/AppButton";
import AppState from "@/components/AppState";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";
import { convertMathToHTML, isUrduText } from "@/lib/utils/math-notation";
import Image from "next/image";
import AppLoader from "@/components/AppLoader";
import toast from "react-hot-toast";
import {
  useChallengeDetail,
  useRespondChallenge,
  useSubmitChallenge,
} from "@/hooks/challenge/useChallenges";
import ChallengeWaitingRoom from "../components/ChallengeWaitingRoom";
import ExamAntiCheatShell from "@/components/exam/ExamAntiCheatShell";
import QuestionImage from "@/components/exam/QuestionImage";
import { useQuestionDiagramPreloader } from "@/hooks/exam/useQuestionDiagramPreloader";
import ConfirmationModal from "@/components/ConfirmationModal";
import type { ChallengeQuestion, ChallengeSubmitResult } from "@/types/challenge";
import { examDurationFromQuestionCount } from "@/lib/paper/exam-duration";
import { FRONTEND_ROUTES } from "@/constants/endpoints";

export default function ChallengeRoom() {
    const { id } = useParams();
    const router = useRouter();
    const challengeId = id as string;

    const challengeQuery = useChallengeDetail(challengeId);
    const respondMutation = useRespondChallenge(challengeId);
    const submitMutation = useSubmitChallenge(challengeId);

    const challenge = challengeQuery.data ?? null;
    const isLoading = challengeQuery.isLoading;
    const error = challengeQuery.isError ? challengeQuery.error?.message ?? "Failed to load challenge" : null;

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({});
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [result, setResult] = useState<ChallengeSubmitResult | null>(null);
    const [hasStartedAttempt, setHasStartedAttempt] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [unansweredCount, setUnansweredCount] = useState(0);

    const isSubmitting = submitMutation.isPending;

    // Preload next 5 question diagrams silently in the background
    useQuestionDiagramPreloader(challenge?.paper?.questions, currentQuestionIndex, 5);

    useEffect(() => {
        if (!challenge) {
            return;
        }

        if (challenge.status === "ACTIVE" && challenge.myStatus === "ACCEPTED" && challenge.paper) {
            const questions = challenge.paper.questions || [];
            const maxTime = examDurationFromQuestionCount(questions.length);
            const effectiveStartTime = challenge.myStartedAt || challenge.startedAt;

            if (effectiveStartTime) {
                const storedUser = localStorage.getItem("exboard_user");
                const user = storedUser ? JSON.parse(storedUser) : null;
                const userId = user?.id || user?.userId;
                const persistentTimeKey = `challenge_time_left_${userId}_${id}`;
                const savedTimeLeft = localStorage.getItem(persistentTimeKey);

                if (savedTimeLeft) {
                    const remaining = parseInt(savedTimeLeft, 10);
                    setTimeLeft((prev) =>
                        prev === null || Math.abs(prev - remaining) > 5 ? remaining : prev,
                    );
                } else {
                    const startTime = new Date(effectiveStartTime).getTime();
                    const elapsed = Math.floor((Date.now() - startTime) / 1000);
                    const remaining = Math.max(0, maxTime - elapsed);
                    setTimeLeft((prev) =>
                        prev === null || Math.abs(prev - remaining) > 5 ? remaining : prev,
                    );
                }
            } else if (!hasStartedAttempt) {
                setTimeLeft(maxTime);
            }
            setHasStartedAttempt(true);
        }
    }, [challenge, id, hasStartedAttempt]);

    useEffect(() => {
        if (!challenge || challenge.status === "COMPLETED") {
            return;
        }
        const interval = setInterval(() => {
            void challengeQuery.refetch();
        }, 5000);
        return () => clearInterval(interval);
    }, [challenge?.status, challengeQuery]);

    // Timer — setInterval is more reliable than a setTimeout chain (no drift/stall)
    useEffect(() => {
        if (!hasStartedAttempt || timeLeft === null || timeLeft <= 0 || isSubmitting || result) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null || prev <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                const newTime = prev - 1;
                // Periodically persist to localStorage
                if (newTime % 5 === 0) {
                    try {
                        const storedUser = localStorage.getItem("exboard_user");
                        const storedUserObj = storedUser ? JSON.parse(storedUser) : null;
                        const userId = storedUserObj?.id || storedUserObj?.userId;
                        if (userId) {
                            const persistentTimeKey = `challenge_time_left_${userId}_${id}`;
                            localStorage.setItem(persistentTimeKey, newTime.toString());
                        }
                    } catch { /* ignore storage errors */ }
                }
                return newTime;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [hasStartedAttempt, isSubmitting, result, id]); // NOTE: intentionally omit timeLeft to avoid restart on every tick

    // Auto-submit on time up
    useEffect(() => {
        if (timeLeft === 0 && hasStartedAttempt && challenge?.paper && !isSubmitting && !result) {
            handleSubmit();
        }
    }, [timeLeft]);

    const handleRespond = async (action: "accept" | "decline") => {
        try {
            await respondMutation.mutateAsync({ action });
            toast.success(action === "accept" ? "Challenge accepted! ⚔️" : "Challenge declined.");
            void challengeQuery.refetch();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Something went wrong");
        }
    };

    const selectMCQAnswer = (questionId: string, optionId: string) => {
        setMcqAnswers(prev => {
            const newAnswers = { ...prev, [questionId]: optionId };

            // Save current time on every interaction for safety
            const storedUser = localStorage.getItem("exboard_user");
            const user = storedUser ? JSON.parse(storedUser) : null;
            const userId = user?.id || user?.userId;
            if (userId && timeLeft !== null) {
                const persistentTimeKey = `challenge_time_left_${userId}_${id}`;
                localStorage.setItem(persistentTimeKey, timeLeft.toString());
            }

            return newAnswers;
        });
    };

    const handleSubmit = async (opts?: { force?: boolean }) => {
        if (!challenge?.paper || isSubmitting) {
            return;
        }

        const questions = challenge.paper.questions;
        const unanswered = questions.filter((q: ChallengeQuestion) => !mcqAnswers[q.id]).length;
        if (
            !opts?.force &&
            unanswered > 0 &&
            timeLeft !== null &&
            timeLeft > 0
        ) {
            setUnansweredCount(unanswered);
            setShowSubmitModal(true);
            return;
        }

        setShowSubmitModal(false);

        try {
            const maxTime = examDurationFromQuestionCount(questions.length);
            const data = await submitMutation.mutateAsync({
                answers: mcqAnswers,
                timeTaken: Math.max(0, maxTime - (timeLeft || 0)),
            });
            setResult(data);
            toast.success("🎉 Challenge submitted!");

            const storedUser = localStorage.getItem("exboard_user");
            const user = storedUser ? JSON.parse(storedUser) : null;
            const userId = user?.id || user?.userId;
            if (userId) {
                const persistentTimeKey = `challenge_time_left_${userId}_${id}`;
                localStorage.removeItem(persistentTimeKey);
            }

            void challengeQuery.refetch();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to submit");
        }
    };

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown className="h-5 w-5 text-amber-500" />;
        if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
        if (rank === 3) return <Award className="h-5 w-5 text-amber-700" />;
        return <span className="text-sm font-black text-muted-foreground">#{rank}</span>;
    };

    // ─── Loading ────────────────────────────────────────────────────────────────
    if (isLoading) return <AppLoader />;
    if (error || !challenge) return <PageContainer><AppState variant="error" title="Error" description={error || "Challenge not found"} fullScreen={false} /></PageContainer>;

    // ─── Result / Leaderboard ───────────────────────────────────────────────────
    if (result || challenge.myStatus === "COMPLETED" || challenge.status === "COMPLETED") {
        const completedParticipants = challenge.participants
            .filter(p => p.status === "COMPLETED")
            .sort((a, b) => {
                if ((b.score ?? 0) !== (a.score ?? 0)) return (b.score ?? 0) - (a.score ?? 0);
                return (a.timeTaken ?? 0) - (b.timeTaken ?? 0);
            });

        return (
            <PageContainer>
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    {/* Your Score */}
                    {result ? (
                        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl mb-6 sm:mb-8 relative">
                            <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                            <div className="p-5 sm:p-8 text-center relative z-10">
                                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-primary/20 mb-4">
                                    <TrophySVG className="size-3" /> Your Score
                                </div>
                                <div className="flex items-end justify-center gap-2 mb-2">
                                    <span className="text-5xl sm:text-6xl font-black text-foreground leading-none">{result.score}</span>
                                    <span className="text-xl sm:text-2xl font-black text-muted-foreground/40 mb-2">/ {result.totalMarks}</span>
                                </div>
                                <Typography className="text-base sm:text-lg font-black text-primary mb-1">{result.percentage}% Accuracy</Typography>
                                <Typography variant="muted" className="text-[10px] sm:text-xs font-bold">+{result.pointsAwarded} points earned</Typography>
                            </div>
                        </div>
                    ) : null}

                    {/* Leaderboard */}
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-6 w-1.5 bg-primary rounded-full" />
                            <Typography variant="h3" className="text-xl font-black tracking-tight">
                                Challenge Leaderboard
                            </Typography>
                        </div>

                        <div className="space-y-3">
                            {completedParticipants.map((p, idx) => (
                                <div
                                    key={p.userId}
                                    className={cn(
                                        "bg-card border rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 transition-all",
                                        idx === 0 ? "border-amber-500/30 bg-amber-500/5 shadow-lg" : "border-border/60"
                                    )}
                                >
                                    <div className="flex items-center justify-center h-10 w-10 shrink-0">
                                        {getRankIcon(idx + 1)}
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                        {p.profileImage ? (
                                            <Image src={p.profileImage} alt="" width={40} height={40} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-black text-primary">{p.name?.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-black truncate">{p.name}</div>
                                        <div className="text-[10px] text-muted-foreground font-bold">@{p.username}</div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-lg font-black text-foreground">{p.score}/{p.totalMarks}</div>
                                        <div className="text-[10px] text-muted-foreground font-bold">
                                            {p.percentage}% · {p.timeTaken ? formatTime(p.timeTaken) : "—"}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Still in progress */}
                            {challenge.participants.filter(p => p.status === "ACCEPTED").map(p => (
                                <div key={p.userId} className="bg-card border border-border/40 rounded-2xl p-4 flex items-center gap-4 opacity-50">
                                    <div className="h-10 w-10 flex items-center justify-center">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        <span className="text-sm font-black text-muted-foreground">{p.name?.charAt(0)}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-muted-foreground">{p.name}</div>
                                        <div className="text-[10px] text-muted-foreground font-bold">Still attempting...</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Answer Breakdown */}
                    {result && challenge.paper ? (
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-6 w-1.5 bg-primary rounded-full" />
                                <Typography variant="h3" className="text-xl font-black tracking-tight">
                                    Your Answers
                                </Typography>
                            </div>
                            <div className="space-y-3">
                                {challenge.paper.questions.map((q: ChallengeQuestion, idx: number) => {
                                    const qResult = result.questionResults[q.id];
                                    const isCorrect = qResult?.correct ?? false;
                                    const isUrdu = isUrduText(q.questionText) || q.mcqOptions?.some((o: any) => isUrduText(o.text));
                                    const selectedOpt = q.mcqOptions?.find((o: any) => o.id === qResult?.selectedAnswer);
                                    const correctOpt = q.mcqOptions?.find((o: any) => o.id === qResult?.correctAnswer);
                                    return (
                                        <div key={q.id} className={cn("rounded-2xl border-2 p-3 sm:p-4 transition-all", isCorrect ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20")}>
                                            <div className="flex items-start gap-3">
                                                <div className={cn("shrink-0 h-7 w-7 rounded-lg flex items-center justify-center", isCorrect ? "bg-emerald-500/10" : "bg-red-500/10")}>
                                                    {isCorrect ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Q{idx + 1}</span>
                                                        <span className="text-[8px] font-bold text-muted-foreground/60">· {q.marks} mark{q.marks !== 1 ? "s" : ""}</span>
                                                    </div>
                                                    <div
                                                        dir={isUrdu ? "rtl" : "ltr"}
                                                        className={cn("text-xs font-medium mb-2", isUrdu ? "font-urdu text-right leading-[2.2]" : "leading-relaxed text-left")}
                                                        dangerouslySetInnerHTML={{ __html: convertMathToHTML(q.questionText) }}
                                                    />
                                                    {q.imageUrl && (
                                                        <div className="mb-4">
                                                            <img src={q.imageUrl} alt="Question diagram" className="max-h-32 rounded-lg border border-border/40 object-contain" />
                                                        </div>
                                                    )}
                                                    {!qResult?.selectedAnswer ? (
                                                        <div dir={isUrdu ? "rtl" : "ltr"} className={cn("mb-2 inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground", isUrdu && "font-urdu text-right")}>
                                                            <p className="min-w-0 flex-1 break-words">{isUrdu ? "حل نہیں کیا گیا" : "Not attempted"}</p>
                                                        </div>
                                                    ) : null}

                                                    {q.mcqOptions && q.mcqOptions.length > 0 ? (
                                                        <div className="mt-2 space-y-1.5 w-full">
                                                            {q.mcqOptions.map((opt: any, optIdx: number) => {
                                                                const normalize = (value?: string | null) =>
                                                                    String(value ?? "").trim().toUpperCase();
                                                                const optLetter = opt.id || String.fromCharCode(65 + optIdx);
                                                                const optIdNorm = normalize(optLetter);
                                                                const optTextNorm = normalize(opt.text);

                                                                const isCorrectOption =
                                                                    (qResult?.correctAnswer != null &&
                                                                        (normalize(qResult.correctAnswer) === optIdNorm ||
                                                                         normalize(qResult.correctAnswer) === optTextNorm)) ||
                                                                    (q.correctAnswer != null &&
                                                                        (normalize(q.correctAnswer) === optIdNorm ||
                                                                         normalize(q.correctAnswer) === optTextNorm));

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
                                                                            "flex items-center justify-between gap-2.5 rounded-xl border p-2 sm:p-2.5 transition-colors text-xs",
                                                                            isCorrectOption
                                                                                ? "border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-500/20"
                                                                                : isSelectedOption
                                                                                  ? "border-destructive/50 bg-destructive/10 dark:bg-destructive/20"
                                                                                  : "border-border/60 bg-card/60"
                                                                        )}
                                                                    >
                                                                        <div className={cn("flex items-center gap-2 min-w-0 flex-1", isOptUrdu && "flex-row-reverse text-right")}>
                                                                            <span
                                                                                className={cn(
                                                                                    "flex size-5.5 sm:size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold font-sans select-none",
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
                                                                                    "min-w-0 flex-1 font-medium",
                                                                                    isCorrectOption
                                                                                        ? "text-emerald-700 dark:text-emerald-300 font-semibold"
                                                                                        : isSelectedOption
                                                                                          ? "text-destructive font-semibold"
                                                                                          : "text-foreground",
                                                                                    isOptUrdu ? "font-urdu text-right leading-[2.2]" : "text-left leading-relaxed"
                                                                                )}
                                                                                dangerouslySetInnerHTML={{
                                                                                    __html: convertMathToHTML(displayText),
                                                                                }}
                                                                            />
                                                                        </div>

                                                                        <div className="flex shrink-0 items-center gap-1">
                                                                            {isCorrectOption && isSelectedOption ? (
                                                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                                                                                    <CheckCircle2 className="size-2.5" />
                                                                                    {isOptUrdu ? "صحیح / آپ کا جواب" : "Correct / Yours"}
                                                                                </span>
                                                                            ) : isCorrectOption ? (
                                                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                                                                                    <CheckCircle2 className="size-2.5" />
                                                                                    {isOptUrdu ? "صحیح" : "Correct"}
                                                                                </span>
                                                                            ) : isSelectedOption ? (
                                                                                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 text-destructive px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                                                                                    <XCircle className="size-2.5" />
                                                                                    {isOptUrdu ? "آپ کا جواب" : "Yours"}
                                                                                </span>
                                                                            ) : null}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className={cn("flex flex-col gap-1 w-full", isUrdu ? "items-end" : "items-start")}>
                                                            {!isCorrect && qResult?.selectedAnswer ? (
                                                                <div dir={isUrdu ? "rtl" : "ltr"} className={cn("flex w-full items-start gap-1 rounded-lg bg-destructive/10 px-2 py-1 text-xs font-bold text-destructive", isUrdu && "font-urdu text-right")}>
                                                                    <XCircle className="mt-0.5 size-3 shrink-0" />
                                                                    <div className="min-w-0 flex-1 break-words">
                                                                        <span className="font-bold">{isUrdu ? "آپ کا جواب: " : "Yours: "}</span>
                                                                        <span className="font-semibold">{selectedOpt ? `${selectedOpt.id}. ` : (qResult?.selectedAnswer ? `Option ${qResult.selectedAnswer} ` : "— ")}</span>
                                                                        <span dangerouslySetInnerHTML={{ __html: convertMathToHTML(selectedOpt?.text ?? "") }} />
                                                                    </div>
                                                                </div>
                                                            ) : null}
                                                            <div dir={isUrdu ? "rtl" : "ltr"} className={cn("flex w-full items-start gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-bold text-primary", isUrdu && "font-urdu text-right")}>
                                                                <CheckCircle2 className="mt-0.5 size-3 shrink-0" />
                                                                <div className="min-w-0 flex-1 break-words">
                                                                    <span className="font-bold">{isUrdu ? "صحیح جواب: " : "Correct: "}</span>
                                                                    <span className="font-semibold">{correctOpt ? `${correctOpt.id}. ` : (qResult?.correctAnswer ? `Option ${qResult.correctAnswer} ` : "— ")}</span>
                                                                    <span dangerouslySetInnerHTML={{ __html: convertMathToHTML(correctOpt?.text ?? "") }} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}

                    <div className="flex gap-3 pb-8">
                        <AppButton variant="outline" onClick={() => router.push(FRONTEND_ROUTES.STUDENT_GENERATE)} className="flex-1 rounded-2xl h-12 font-black border-border/60">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Challenges
                        </AppButton>
                    </div>
                </div>
            </PageContainer>
        );
    }

    // ─── Waiting Room ───────────────────────────────────────────────────────────
    if (challenge.status === "WAITING") {
        const waitTimeMs = (challenge.maxWaitMinutes || 5) * 60 * 1000;
        const createdMs = new Date(challenge.createdAt).getTime();
        const remainingMs = Math.max(0, waitTimeMs - (Date.now() - createdMs));
        const remainingSecs = Math.ceil(remainingMs / 1000);

        return (
            <PageContainer>
                <ChallengeWaitingRoom
                    challenge={challenge}
                    remainingSecs={remainingSecs}
                    formatTime={formatTime}
                    onRespond={handleRespond}
                    onBack={() => router.push(FRONTEND_ROUTES.STUDENT_GENERATE)}
                />
            </PageContainer>
        );
    }

    // ─── Active: Attempt ────────────────────────────────────────────────────────
    if (challenge.status === "ACTIVE" && challenge.paper && challenge.myStatus === "ACCEPTED") {
        const questions = challenge.paper.questions;
        const currentQ = questions[currentQuestionIndex];
        const isLowTime = timeLeft !== null && timeLeft < 600;
        const isLastQ = currentQuestionIndex === questions.length - 1;

        return (
            <PageContainer>
                <ExamAntiCheatShell
                    enabled={!isSubmitting}
                    onLeaveExam={() => {
                        if (!isSubmitting) void handleSubmit({ force: true });
                    }}
                >
                {/* Extra bottom padding so content clears the mobile nav bar */}
                <div className="flex flex-col gap-4 sm:gap-6 pb-28 sm:pb-8">
                    {/* Timer Bar */}
                    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pt-2 pb-3 sm:pb-4 border-b border-border/40 -mt-6 mb-4 sm:mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-1 flex items-center gap-2">
                                    <Swords size={10} /> Challenge Mode
                                </span>
                                <div className={cn("flex items-center gap-3 font-mono font-black text-2xl sm:text-3xl transition-all", isLowTime ? "text-red-500 animate-pulse" : "text-foreground")}>
                                    <ClockSVG className={cn("h-6 w-6 sm:h-8 sm:w-8", isLowTime && "animate-pulse")} />
                                    {formatTime(timeLeft || 0)}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Answered</span>
                                <div className="flex items-center gap-2 bg-muted/30 px-4 py-2 rounded-2xl border border-border/40">
                                    <span className="text-base sm:text-lg font-black text-primary">{Object.keys(mcqAnswers).length}</span>
                                    <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-tighter">/ {questions.length}</span>
                                </div>
                            </div>
                        </div>
                        {/* Question pills */}
                        <div className="mt-3 px-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
                            {questions.map((q: ChallengeQuestion, idx: number) => {
                                const isActive = idx === currentQuestionIndex;
                                const isAnswered = !!mcqAnswers[q.id];
                                return (
                                    <button key={q.id} onClick={() => setCurrentQuestionIndex(idx)} className={cn(
                                        "shrink-0 h-8 w-8 rounded-xl text-[10px] font-black transition-all border-2 flex items-center justify-center",
                                        isActive ? "bg-primary text-background border-primary scale-110" :
                                            isAnswered ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" :
                                                "bg-muted text-muted-foreground border-transparent hover:border-border"
                                    )}>
                                        {isAnswered ? <CheckCircle2 size={12} /> : idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Question Card — scrollable so long questions + images don't get cut off */}
                    <div key={currentQuestionIndex} className="bg-card border border-border/60 rounded-3xl sm:rounded-4xl p-5 sm:p-8 shadow-sm flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-3 duration-300 overflow-hidden">
                        <div className="flex items-center justify-between mb-6 sm:mb-8">
                            <div className="flex items-center gap-3">
                                <span className="bg-primary text-background px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base">
                                    Q{currentQuestionIndex + 1}
                                </span>
                                <span className={cn(
                                    "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border",
                                    "bg-primary/10 text-primary border-primary/20"
                                )}>MCQ</span>
                                {currentQ.chapterName ? (
                                    <span className="px-3 py-1 rounded-xl text-[10px] font-bold text-muted-foreground/60 border border-border/40 hidden sm:inline-block truncate max-w-[200px]">{currentQ.chapterName}</span>
                                ) : null}
                            </div>
                            <span className="text-xs sm:text-sm font-black text-muted-foreground bg-muted px-3 sm:px-4 py-1.5 rounded-xl border border-border/40">
                                {currentQ.marks} Mark{currentQ.marks !== 1 ? "s" : ""}
                            </span>
                        </div>

                        <div className="text-lg sm:text-xl font-medium leading-relaxed mb-6 sm:mb-8 text-foreground">
                            <span dangerouslySetInnerHTML={{ __html: convertMathToHTML(currentQ.questionText) }} />
                        </div>

                        {currentQ.imageUrl ? (
                            <div className="mb-4">
                                <QuestionImage src={currentQ.imageUrl} alt="Question diagram" className="max-h-[300px] rounded-2xl border border-border/40" skeletonHeightClass="h-56 sm:h-72" />
                            </div>
                        ) : null}

                        {/* MCQ Options — overflow-y-auto ensures they scroll on small screens */}
                        <div className="space-y-3 mt-auto overflow-y-auto">
                            <div className="flex items-center gap-2 mb-3">
                                <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Select Answer</Typography>
                            </div>
                            {currentQ.mcqOptions?.map((option: any) => {
                                const isSelected = mcqAnswers[currentQ.id] === option.id;
                                return (
                                    <button key={option.id} onClick={() => selectMCQAnswer(currentQ.id, option.id)} className={cn(
                                        "w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 group",
                                        isSelected ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-border/60 bg-card hover:border-primary/40 hover:bg-primary/2"
                                    )}>
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center text-xs sm:text-sm font-black transition-all shrink-0",
                                                isSelected ? "bg-primary text-background" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                            )}>{option.id}</div>
                                            <span className={cn("text-sm sm:text-base font-medium transition-colors", isSelected ? "text-primary font-bold" : "text-foreground")}
                                                dangerouslySetInnerHTML={{ __html: convertMathToHTML(option.text) }} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between gap-4">
                        <AppButton variant="outline" onClick={() => setCurrentQuestionIndex(p => p - 1)} disabled={currentQuestionIndex === 0} className="rounded-2xl h-12 sm:h-14 px-4 sm:px-8 border-border/60 font-black text-xs sm:text-base shrink-0">
                            <ChevronLeft className="mr-1 h-4 w-4 sm:h-5 sm:w-5" /> Prev
                        </AppButton>
                        <Typography className="font-black text-muted-foreground/60 uppercase text-[10px] sm:text-xs tracking-widest text-center whitespace-nowrap">
                            {currentQuestionIndex + 1} / {questions.length}
                        </Typography>
                        {isLastQ ? (
                            <AppButton onClick={() => handleSubmit()} disabled={isSubmitting} className="rounded-2xl h-12 sm:h-14 px-4 sm:px-8 font-black shadow-lg shadow-primary/20 text-xs sm:text-base shrink-0">
                                {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting</>) : (<>Finish <Send className="ml-2 h-4 w-4" /></>)}
                            </AppButton>
                        ) : (
                            <AppButton onClick={() => setCurrentQuestionIndex(p => p + 1)} className="rounded-2xl h-12 sm:h-14 px-4 sm:px-8 font-black text-xs sm:text-base shrink-0">
                                Next <ChevronRight className="ml-1 h-4 w-4 sm:h-5 sm:w-5" />
                            </AppButton>
                        )}
                    </div>
                </div>

                <ConfirmationModal
                    isOpen={showSubmitModal}
                    onClose={() => setShowSubmitModal(false)}
                    onConfirm={() => void handleSubmit({ force: true })}
                    title="Unanswered Questions"
                    message={`You have ${unansweredCount} unanswered question${unansweredCount !== 1 ? "s" : ""}. Submit anyway?`}
                    confirmLabel="Submit Anyway"
                    cancelLabel="Go Back"
                    variant="warning"
                    isLoading={isSubmitting}
                />
                </ExamAntiCheatShell>
            </PageContainer>
        );
    }

    // ─── Fallback ───────────────────────────────────────────────────────────────
    return (
        <PageContainer>
            <div className="text-center py-20">
                <Typography variant="muted" className="text-sm">This challenge is no longer available or has been cancelled.</Typography>
                <AppButton variant="outline" onClick={() => router.push(FRONTEND_ROUTES.STUDENT_GENERATE)} className="mt-4 rounded-2xl font-black">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Challenges
                </AppButton>
            </div>
        </PageContainer>
    );
}
