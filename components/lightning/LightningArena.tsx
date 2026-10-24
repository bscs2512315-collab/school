"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Flame } from "lucide-react";
import PlaySVG from "@/public/svgs/PlaySVG";
import ArrowLeftSVG from "@/public/svgs/ArrowLeftSVG";
import StudentsSVG from "@/public/svgs/StudentsSVG";
import BuildingSVG from "@/public/svgs/BuildingSVG";
import GenerateSVG from "@/public/svgs/GenerateSVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import LogoutSVG from "@/public/svgs/LogoutSVG";
import ZapSVG from "@/public/svgs/ZapSVG";
import TrophySVG from "@/public/svgs/TrophySVG";
import CrownSVG from "@/public/svgs/CrownSVG";
import MedalSVG from "@/public/svgs/MedalSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import CloseCircleSVG from "@/public/svgs/CloseCircleSVG";
import StarSVG from "@/public/svgs/StarSVG";
import VolumeDuotoneSVG from "@/components/icons/VolumeDuotoneSVG";
import toast from "react-hot-toast";
import AppButton from "@/components/AppButton";
import UserAvatar from "@/components/UserAvatar";
import QuestionImage from "@/components/exam/QuestionImage";
import { apiGet, apiPost } from "@/lib/api/api-client";
import { cn, formatSchoolName, formatCapitalizeWords } from "@/lib/utils";
import { convertMathToHTML, isUrduText } from "@/lib/utils/math-notation";
import type {
  LightningSessionPhase,
  LightningSessionStatus,
  LightningSourceMode,
} from "@/lib/lightning/lightning-schema";
import {
  playSelectSound,
  playTickSound,
  playCorrectSound,
  playIncorrectSound,
  playTimeoutSound,
  playStreakSound,
  playLeaderboardSound,
  playPodiumSound,
  getLightningMuted,
  setLightningMuted,
} from "@/lib/lightning/lightningAudio";

interface OptionItem {
  id: string;
  text: string;
}

interface QuestionItem {
  id: string;
  questionNumber: number;
  questionText: string;
  options: OptionItem[];
  imageUrl?: string | null;
  marks?: number;
  correctOptionId?: string;
  explanation?: string;
}

interface ParticipantItem {
  id: string;
  userId: string;
  name: string;
  username: string | null;
  profileImage: string | null;
  schoolName?: string | null;
  schoolLogo?: string | null;
  totalPoints: number;
  roundPoints?: number;
  isRoundCorrect?: boolean;
  streak: number;
  highestStreak: number;
  correctCount: number;
  isConnected: boolean;
  leaderboardPoints?: number;
  rank?: number;
}

interface AnswerItem {
  userId?: string;
  user_id?: string;
  selectedOption?: string;
  selected_option?: string;
  isCorrect?: boolean;
  is_correct?: boolean;
  pointsEarned?: number;
  points_earned?: number;
  streakAfter?: number;
  streak_after?: number;
  timeTakenMs?: number;
  time_taken_ms?: number;
}

interface LightningArenaProps {
  sessionId: string;
  userId: string;
  userRole?: "STUDENT" | "TEACHER";
  onExit?: () => void;
}

const OPTION_THEMES = [
  {
    letter: "A",
    gradient: "from-[#f59e0b] via-[#d97706] to-[#b45309]", // Gold / Amber
    border: "border-amber-300/40",
    shadow: "shadow-amber-500/15",
    selectedRing:
      "ring-2 ring-amber-300 border-amber-300 shadow-xl shadow-amber-500/35 brightness-110 scale-[1.01]",
  },
  {
    letter: "B",
    gradient: "from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]", // Royal / Electric Blue
    border: "border-blue-300/40",
    shadow: "shadow-blue-500/15",
    selectedRing:
      "ring-2 ring-blue-300 border-blue-300 shadow-xl shadow-blue-500/35 brightness-110 scale-[1.01]",
  },
  {
    letter: "C",
    gradient: "from-[#a855f7] via-[#9333ea] to-[#7e22ce]", // Royal Purple / Violet
    border: "border-purple-300/40",
    shadow: "shadow-purple-500/15",
    selectedRing:
      "ring-2 ring-purple-300 border-purple-300 shadow-xl shadow-purple-500/35 brightness-110 scale-[1.01]",
  },
  {
    letter: "D",
    gradient: "from-[#10b981] via-[#059669] to-[#047857]", // Emerald / Jade Green
    border: "border-emerald-300/40",
    shadow: "shadow-emerald-500/15",
    selectedRing:
      "ring-2 ring-emerald-300 border-emerald-300 shadow-xl shadow-emerald-500/35 brightness-110 scale-[1.01]",
  },
];

// Helper to assign a strictly monotonic numeric score to game state
function getSessionStateScore(phase: LightningSessionPhase, questionIndex: number): number {
  if (phase === "LOBBY") return 0;
  if (phase === "PODIUM") return 999999;
  const phaseOrder: Record<LightningSessionPhase, number> = {
    LOBBY: 0,
    QUESTION: 1,
    REVEAL: 2,
    LEADERBOARD: 3,
    PODIUM: 4,
  };
  return questionIndex * 10 + (phaseOrder[phase] ?? 0);
}

export default function LightningArena({
  sessionId,
  userId,
  userRole = "STUDENT",
  onExit,
}: LightningArenaProps) {
  const router = useRouter();

  // Server state
  const [session, setSession] = useState<{
    id: string;
    pinCode: string;
    creatorId: string;
    creatorRole: string;
    title: string;
    subject: string;
    classLevel: string;
    board: string;
    status: LightningSessionStatus;
    phase: LightningSessionPhase;
    sourceMode: LightningSourceMode;
    perQuestionSeconds: number;
    currentQuestionIndex: number;
    totalQuestions: number;
    currentQuestionStartedAt: string | null;
    updatedAt?: string | null;
  } | null>(null);

  const [isHost, setIsHost] = useState(false);
  const [question, setQuestion] = useState<QuestionItem | null>(null);
  const [currentUserAnswer, setCurrentUserAnswer] = useState<AnswerItem | null>(null);
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState<ParticipantItem | null>(null);
  const [answerDistribution, setAnswerDistribution] = useState<Record<string, number> | null>(null);
  const [totalAnsweredCount, setTotalAnsweredCount] = useState(0);

  const isTeacherHost =
    userRole === "TEACHER" || (isHost && session?.creatorRole === "TEACHER");

  // Silent preloading state & caches for zero-latency diagrams and questions
  const [diagramUrls, setDiagramUrls] = useState<string[]>([]);
  const [preloadedDiagramCount, setPreloadedDiagramCount] = useState<number>(0);
  const [diagramPreloadTimeout, setDiagramPreloadTimeout] = useState<boolean>(false);
  const preloadedImagesMapRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const upcomingQuestionsCacheRef = useRef<Map<number, QuestionItem>>(new Map());

  // Client local interaction state
  const [copied, setCopied] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [phaseProgressPercent, setPhaseProgressPercent] = useState<number>(100);
  const [hasCelebratedPodium, setHasCelebratedPodium] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // State guard & timer tracking refs
  const serverOffsetRef = useRef<number>(0);
  const currentQIndexRef = useRef<number>(-1);
  const latestStateScoreRef = useRef<number>(0);
  const activePhaseKeyRef = useRef<string>("");
  const phaseStartTimeRef = useRef<number>(0);
  const questionStartTimeRef = useRef<number>(Date.now());
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const executingActionRef = useRef<string | null>(null);
  const lastTickedSecondRef = useRef<number>(-1);
  const autoTransitioningRef = useRef<string | null>(null);

  // Initialize sound mute preference
  useEffect(() => {
    setIsMuted(getLightningMuted());
  }, []);

  // Safeguard timeout for diagram preloading (ensures start button isn't blocked on broken images)
  useEffect(() => {
    if (diagramUrls.length === 0) {
      setDiagramPreloadTimeout(true);
      return;
    }
    const t = setTimeout(() => setDiagramPreloadTimeout(true), 3500);
    return () => clearTimeout(t);
  }, [diagramUrls]);

  // Silent Diagram Preloading Engine (Runs in Lobby & Active Game)
  useEffect(() => {
    if (!diagramUrls || diagramUrls.length === 0) return;

    diagramUrls.forEach((url) => {
      if (!url || preloadedImagesMapRef.current.has(url)) return;

      const img = new window.Image();
      // Set high fetch priority so browser prioritizes quiz diagrams
      (img as unknown as { fetchPriority?: string }).fetchPriority = "high";
      img.src = url;

      img.onload = () => {
        preloadedImagesMapRef.current.set(url, img);
        setPreloadedDiagramCount(preloadedImagesMapRef.current.size);
      };

      img.onerror = () => {
        // Retry once on failure
        setTimeout(() => {
          const retryImg = new window.Image();
          retryImg.src = url;
          retryImg.onload = () => {
            preloadedImagesMapRef.current.set(url, retryImg);
            setPreloadedDiagramCount(preloadedImagesMapRef.current.size);
          };
        }, 500);
      };
    });
  }, [diagramUrls]);

  // Authoritative State Fetch with Monotonic Forward-Only Lock (Zero Flickering)
  const fetchState = useCallback(async () => {
    try {
      const res = await apiGet<{
        serverTime?: string;
        session: {
          id: string;
          pinCode: string;
          creatorId: string;
          creatorRole: string;
          title: string;
          subject: string;
          classLevel: string;
          board: string;
          status: LightningSessionStatus;
          phase: LightningSessionPhase;
          sourceMode: LightningSourceMode;
          perQuestionSeconds: number;
          currentQuestionIndex: number;
          totalQuestions: number;
          currentQuestionStartedAt: string | null;
          updatedAt?: string | null;
        };
        isHost: boolean;
        question: QuestionItem | null;
        upcomingQuestions?: QuestionItem[];
        diagramUrls?: string[];
        currentUserAnswer: AnswerItem | null;
        totalAnsweredCount: number;
        answerDistribution: Record<string, number> | null;
        participants: ParticipantItem[];
        currentParticipant: ParticipantItem | null;
      }>(`/lightning/${sessionId}?userId=${encodeURIComponent(userId)}`);

      if (res.success && res.data) {
        const data = res.data;
        const incomingScore = getSessionStateScore(
          data.session.phase,
          data.session.currentQuestionIndex
        );

        // Discard any stale out-of-order poll responses to completely stop flickering
        if (incomingScore < latestStateScoreRef.current) {
          return;
        }
        latestStateScoreRef.current = incomingScore;

        // Server clock sync
        if (data.serverTime) {
          const serverMs = new Date(data.serverTime).getTime();
          serverOffsetRef.current = Date.now() - serverMs;
        }

        const newQIndex = data.session.currentQuestionIndex;
        if (currentQIndexRef.current !== newQIndex) {
          currentQIndexRef.current = newQIndex;
          setSelectedOpt(null);
          setIsSubmittingAnswer(false);
          autoTransitioningRef.current = null;
        }

        setSession(data.session);
        setIsHost(data.isHost);
        setQuestion(data.question);
        setTotalAnsweredCount(data.totalAnsweredCount);
        setAnswerDistribution(data.answerDistribution);
        setParticipants(data.participants || []);
        setCurrentParticipant(data.currentParticipant);

        // Store preloaded diagram URLs
        if (Array.isArray(data.diagramUrls)) {
          setDiagramUrls(data.diagramUrls);
        }

        // Cache upcoming sliding window of 5 questions and immediately preload any images
        if (Array.isArray(data.upcomingQuestions)) {
          data.upcomingQuestions.forEach((uq) => {
            upcomingQuestionsCacheRef.current.set(uq.questionNumber - 1, uq);
            if (uq.imageUrl && !preloadedImagesMapRef.current.has(uq.imageUrl)) {
              const img = new window.Image();
              (img as unknown as { fetchPriority?: string }).fetchPriority = "high";
              img.src = uq.imageUrl;
              img.onload = () => {
                preloadedImagesMapRef.current.set(uq.imageUrl!, img);
                setPreloadedDiagramCount(preloadedImagesMapRef.current.size);
              };
            }
          });
        }

        if (data.currentUserAnswer) {
          setCurrentUserAnswer(data.currentUserAnswer);
          if (data.currentUserAnswer.selectedOption) {
            setSelectedOpt(data.currentUserAnswer.selectedOption);
          }
        } else {
          setCurrentUserAnswer(null);
        }
      }
    } catch (err) {
      console.error("Polling error:", err);
    }
  }, [sessionId, userId]);

  // Fast live polling interval
  useEffect(() => {
    void fetchState();
    pollIntervalRef.current = setInterval(fetchState, 600);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [fetchState]);

  // Handle Game Flow Actions (Host or Auto-Transition with CAS verification)
  const handleHostAction = useCallback(
    async (
      action: "start" | "reveal" | "leaderboard" | "next_question" | "finish",
      expectedQuestionIndex?: number
    ) => {
      const qIndex = expectedQuestionIndex ?? session?.currentQuestionIndex ?? 0;
      const actionKey = `${action}_${qIndex}`;
      if (executingActionRef.current === actionKey) return;
      executingActionRef.current = actionKey;
      setIsExecutingAction(true);

      // Pre-advance monotonic lock to immediately block older poll responses
      if (action === "reveal") {
        latestStateScoreRef.current = Math.max(
          latestStateScoreRef.current,
          getSessionStateScore("REVEAL", qIndex)
        );
      } else if (action === "leaderboard") {
        latestStateScoreRef.current = Math.max(
          latestStateScoreRef.current,
          getSessionStateScore("LEADERBOARD", qIndex)
        );
      } else if (action === "next_question") {
        latestStateScoreRef.current = Math.max(
          latestStateScoreRef.current,
          getSessionStateScore("QUESTION", qIndex + 1)
        );
      } else if (action === "finish") {
        latestStateScoreRef.current = 999999;
      }

      try {
        const res = await apiPost<{ success: boolean; idempotent?: boolean }>(
          `/lightning/${sessionId}/action`,
          {
            action,
            userId,
            expectedQuestionIndex: qIndex,
          }
        );

        if (res.success) {
          if (action === "next_question" || action === "start") {
            setSelectedOpt(null);
            setIsSubmittingAnswer(false);
            autoTransitioningRef.current = null;
          }
          await fetchState();
        }
      } catch (err: unknown) {
        console.error("Action error:", err);
      } finally {
        executingActionRef.current = null;
        setIsExecutingAction(false);
      }
    },
    [sessionId, userId, session?.currentQuestionIndex, fetchState]
  );

  const sessionPhase = session?.phase;
  const currentQuestionIndex = session?.currentQuestionIndex ?? 0;
  const currentQuestionStartedAt = session?.currentQuestionStartedAt;
  const perQuestionSeconds = session?.perQuestionSeconds || 10;
  const isLastQuestion = currentQuestionIndex + 1 >= (session?.totalQuestions ?? 1);

  // Reset answer states on new QUESTION phase
  useEffect(() => {
    if (sessionPhase === "QUESTION") {
      setSelectedOpt(null);
      setIsSubmittingAnswer(false);
      autoTransitioningRef.current = null;
      lastTickedSecondRef.current = -1;
      setTimeLeft(perQuestionSeconds);
      questionStartTimeRef.current = currentQuestionStartedAt
        ? new Date(currentQuestionStartedAt).getTime()
        : Date.now() - serverOffsetRef.current;
    }
  }, [sessionPhase, currentQuestionIndex, perQuestionSeconds, currentQuestionStartedAt]);

  // 1. Question Countdown Timer with Clock Skew Resilience + Urgent Audio Ticks
  useEffect(() => {
    if (sessionPhase !== "QUESTION") return;

    const totalSeconds = perQuestionSeconds;
    const startedAt = currentQuestionStartedAt
      ? new Date(currentQuestionStartedAt).getTime()
      : Date.now() - serverOffsetRef.current;

    questionStartTimeRef.current = startedAt;

    const updateTimer = () => {
      const nowServer = Date.now() - serverOffsetRef.current;
      const elapsedSeconds = Math.max(0, Math.floor((nowServer - startedAt) / 1000));
      const remaining = Math.max(0, totalSeconds - elapsedSeconds);
      setTimeLeft(remaining);

      if (remaining <= 5 && remaining > 0 && lastTickedSecondRef.current !== remaining) {
        lastTickedSecondRef.current = remaining;
        playTickSound(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 200);

    return () => clearInterval(interval);
  }, [sessionPhase, currentQuestionIndex, currentQuestionStartedAt, perQuestionSeconds]);

  // 2. Auto-Transition: QUESTION -> REVEAL (Safe & Idempotent)
  useEffect(() => {
    if (sessionPhase !== "QUESTION") return;

    const nowServer = Date.now() - serverOffsetRef.current;
    const elapsedSeconds = Math.max(
      0,
      Math.floor((nowServer - questionStartTimeRef.current) / 1000)
    );

    const allAnswered =
      participants.length > 0 &&
      totalAnsweredCount >= participants.length &&
      elapsedSeconds >= 1;

    // Never auto-reveal if question just started! Must have truly elapsed full duration
    const isDurationExpired = elapsedSeconds >= perQuestionSeconds && timeLeft === 0;
    const shouldAutoReveal = isDurationExpired || allAnswered;
    const transitionKey = `reveal_${currentQuestionIndex}`;

    if (shouldAutoReveal && autoTransitioningRef.current !== transitionKey) {
      autoTransitioningRef.current = transitionKey;
      void handleHostAction("reveal", currentQuestionIndex);
    }
  }, [
    timeLeft,
    sessionPhase,
    totalAnsweredCount,
    participants.length,
    perQuestionSeconds,
    currentQuestionIndex,
    handleHostAction,
  ]);

  // 3 & 4. Continuous Monotonic 5-Second Timer for REVEAL & LEADERBOARD (No Jumping, No Resetting)
  useEffect(() => {
    if (sessionPhase !== "REVEAL" && sessionPhase !== "LEADERBOARD") {
      activePhaseKeyRef.current = "";
      return;
    }

    const currentKey = `${sessionPhase}_${currentQuestionIndex}`;
    if (activePhaseKeyRef.current !== currentKey) {
      activePhaseKeyRef.current = currentKey;
      phaseStartTimeRef.current = Date.now();
      setPhaseProgressPercent(100);

      // Play gamified sounds on initial entrance
      if (sessionPhase === "REVEAL") {
        if (isTeacherHost) {
          playCorrectSound();
        } else {
          const isUserCorrect = Boolean(
            currentUserAnswer?.isCorrect ?? currentUserAnswer?.is_correct
          );
          if (isUserCorrect) {
            playCorrectSound();
            const streak =
              currentUserAnswer?.streakAfter ?? currentUserAnswer?.streak_after ?? 0;
            if (streak > 1) {
              setTimeout(() => playStreakSound(), 320);
            }
          } else if (currentUserAnswer) {
            playIncorrectSound();
          } else {
            playTimeoutSound();
          }
        }
      } else if (sessionPhase === "LEADERBOARD") {
        playLeaderboardSound();
      }
    }

    const DURATION_MS = 5000; // Exactly 5.0 seconds
    const interval = setInterval(() => {
      const elapsed = Date.now() - phaseStartTimeRef.current;
      const remaining = Math.max(0, DURATION_MS - elapsed);
      const pct = Math.max(0, Math.min(100, (remaining / DURATION_MS) * 100));
      setPhaseProgressPercent(pct);

      if (elapsed >= DURATION_MS) {
        clearInterval(interval);
        const transitionKey = `auto_${currentKey}`;
        if (autoTransitioningRef.current !== transitionKey) {
          autoTransitioningRef.current = transitionKey;
          if (sessionPhase === "REVEAL") {
            void handleHostAction("leaderboard", currentQuestionIndex);
          } else if (sessionPhase === "LEADERBOARD") {
            if (isLastQuestion) {
              void handleHostAction("finish", currentQuestionIndex);
            } else {
              setSelectedOpt(null);
              setIsSubmittingAnswer(false);
              void handleHostAction("next_question", currentQuestionIndex);
            }
          }
        }
      }
    }, 40);

    return () => clearInterval(interval);
  }, [
    sessionPhase,
    currentQuestionIndex,
    currentUserAnswer,
    isLastQuestion,
    handleHostAction,
  ]);

  // 5. Grand Finale Podium Celebration: Confetti + Fanfare
  useEffect(() => {
    if (sessionPhase === "PODIUM" && !hasCelebratedPodium) {
      setHasCelebratedPodium(true);
      playPodiumSound();

      void (async () => {
        try {
          const mod = (await import("canvas-confetti")).default;
          if (typeof mod === "function") {
            mod({ particleCount: 130, spread: 90, origin: { y: 0.6 } });
            setTimeout(() => {
              mod({ particleCount: 90, angle: 60, spread: 55, origin: { x: 0 } });
              mod({ particleCount: 90, angle: 120, spread: 55, origin: { x: 1 } });
            }, 400);
            setTimeout(() => {
              mod({ particleCount: 110, spread: 120, origin: { y: 0.5 } });
            }, 900);
          }
        } catch {
          // Graceful fallback
        }
      })();
    }
  }, [sessionPhase, hasCelebratedPodium]);

  // Handle Answer Selection
  const handleAnswer = async (optionKey: string) => {
    if (isTeacherHost || selectedOpt || isSubmittingAnswer || session?.phase !== "QUESTION") return;

    playSelectSound();
    setSelectedOpt(optionKey);
    setIsSubmittingAnswer(true);

    const nowServer = Date.now() - serverOffsetRef.current;
    const timeTakenMs = Math.max(100, nowServer - questionStartTimeRef.current);

    try {
      const res = await apiPost<{
        isCorrect: boolean;
        pointsEarned: number;
        streakBonus: number;
        streak: number;
        newTotalPoints: number;
      }>(`/lightning/${sessionId}/answer`, {
        userId,
        questionIndex: session?.currentQuestionIndex ?? 0,
        selectedOption: optionKey,
        timeTakenMs,
      });

      if (res.success) {
        await fetchState();
      } else {
        setSelectedOpt(null);
      }
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      toast.error(errObj?.message || "Failed to submit answer");
      setSelectedOpt(null);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const copyPin = () => {
    if (!session?.pinCode) return;
    navigator.clipboard.writeText(session.pinCode);
    setCopied(true);
    toast.success("Game PIN copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    setLightningMuted(nextMuted);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="flex min-h-[calc(100dvh-12rem)] w-full flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 animate-pulse">
          <GenerateSVG className="size-7" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-foreground">Entering Live Arena...</h3>
        <p className="text-xs text-muted-foreground">Synchronizing session parameters</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 1: SPACIOUS, MODERN KAHOOT-STYLE LOBBY (NO CLUTTER, GENEROUS BREATHING ROOM)
  // ─────────────────────────────────────────────────────────────────────────────
  if (session.phase === "LOBBY") {
    const formattedPin =
      session.pinCode.length === 6
        ? `${session.pinCode.slice(0, 3)} ${session.pinCode.slice(3)}`
        : session.pinCode;

    return (
      <div className="relative w-full rounded-2xl sm:rounded-3xl bg-linear-to-br from-primary via-primary to-primary-dark p-3 sm:p-6 lg:p-8 text-white shadow-2xl min-h-0 sm:min-h-[calc(100dvh-5rem)] flex flex-col justify-between gap-4 sm:gap-6 border border-white/15 animate-in fade-in duration-300">
        {/* Ambient Subtle Glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
          <div className="absolute -right-20 -top-20 size-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 size-96 rounded-full bg-black/25 blur-3xl" />
        </div>

        {/* Top Header Bar */}
        <div className="relative z-20 flex items-center justify-between gap-2 pb-2.5 sm:pb-3 border-b border-white/15">
          <div className="flex items-center gap-2">
            {onExit && (
              <button
                type="button"
                onClick={onExit}
                aria-label="Back to challenges"
                className="flex size-8 sm:size-10 items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white ring-1 ring-white/25 shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer backdrop-blur-md"
              >
                <ArrowLeftSVG className="size-4 sm:size-5 text-white" />
              </button>
            )}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-white/15 ring-1 ring-white/25 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-black tracking-wide text-white shadow-xs backdrop-blur-md">
              <span className="relative flex size-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              <span>Live Lobby</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleSound}
              className="flex size-8 sm:size-10 items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white ring-1 ring-white/25 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
              title={isMuted ? "Unmute Sound" : "Mute Sound"}
            >
              <VolumeDuotoneSVG muted={isMuted} className="size-4 sm:size-5 text-white" />
            </button>

            {isHost ? (
              <button
                type="button"
                onClick={() => handleHostAction("start")}
                disabled={
                  isExecutingAction ||
                  participants.length === 0 ||
                  (diagramUrls.length > 0 &&
                    preloadedDiagramCount < diagramUrls.length &&
                    !diagramPreloadTimeout)
                }
                className="h-8 sm:h-10 px-3 sm:px-6 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-white text-primary hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed font-black text-xs sm:text-sm shadow-xl transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <PlaySVG className="size-3.5 sm:size-4 text-primary shrink-0" />
                <span>
                  {diagramUrls.length > 0 &&
                  preloadedDiagramCount < diagramUrls.length &&
                  !diagramPreloadTimeout
                    ? `Pre-caching (${preloadedDiagramCount}/${diagramUrls.length})...`
                    : `Start (${participants.length})`}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl bg-white/15 ring-1 ring-white/25 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-white shadow-xs backdrop-blur-md whitespace-nowrap">
                <span className="relative flex size-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-white" />
                </span>
                <span>Waiting for Host...</span>
              </div>
            )}
          </div>
        </div>

        {/* Center Stage: Hero PIN Showcase */}
        <div className="relative z-10 flex flex-col items-center text-center py-1 sm:py-3 max-w-3xl mx-auto w-full">
          {/* Metadata Chips */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            <span className="rounded-lg sm:rounded-xl bg-white/20 ring-1 ring-white/30 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10.5px] sm:text-xs font-bold text-white backdrop-blur-md">
              Class {session.classLevel}
            </span>
            <span className="rounded-lg sm:rounded-xl bg-white/20 ring-1 ring-white/30 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10.5px] sm:text-xs font-bold text-white backdrop-blur-md">
              {session.subject}
            </span>
            {session.board && (
              <span className="rounded-lg sm:rounded-xl bg-white/20 ring-1 ring-white/30 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10.5px] sm:text-xs font-bold text-white backdrop-blur-md">
                {session.board}
              </span>
            )}
            <span className="rounded-lg sm:rounded-xl bg-white/20 ring-1 ring-white/30 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10.5px] sm:text-xs font-bold text-white backdrop-blur-md">
              {session.totalQuestions} Questions
            </span>
            <span className="rounded-lg sm:rounded-xl bg-white/20 ring-1 ring-white/30 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10.5px] sm:text-xs font-bold text-white backdrop-blur-md">
              {session.perQuestionSeconds}s / Question
            </span>
            {diagramUrls.length > 0 && (
              <span className="rounded-lg sm:rounded-xl bg-white/20 ring-1 ring-white/30 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10.5px] sm:text-xs font-bold text-white backdrop-blur-md flex items-center gap-1.5">
                <SparklesSVG className="size-3 text-amber-300" />
                {preloadedDiagramCount >= diagramUrls.length
                  ? `All ${diagramUrls.length} Ready`
                  : `Pre-caching (${preloadedDiagramCount}/${diagramUrls.length})...`}
              </span>
            )}
          </div>

          <h1 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight drop-shadow-sm mb-3 sm:mb-4 px-2">
            {session.title}
          </h1>

          {/* Elevated Game PIN Box */}
          <div className="w-full max-w-sm sm:max-w-md rounded-2xl sm:rounded-3xl bg-black/25 ring-1 ring-white/25 p-3.5 sm:p-5 backdrop-blur-xl shadow-2xl flex flex-col items-center">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/80">
              Join with Game PIN
            </span>

            <button
              type="button"
              onClick={copyPin}
              className="group mt-2 sm:mt-3 flex items-center justify-center gap-3 sm:gap-6 rounded-xl sm:rounded-2xl bg-white/20 hover:bg-white/30 ring-1 ring-white/35 px-4 sm:px-8 py-2 sm:py-3 transition-all active:scale-98 cursor-pointer shadow-inner"
              title="Click to copy Game PIN"
            >
              <span className="font-mono text-2xl sm:text-4xl lg:text-5xl font-black tracking-widest text-white">
                {formattedPin}
              </span>
              <div className="flex size-8 sm:size-10 items-center justify-center rounded-lg sm:rounded-xl bg-white text-primary font-bold shadow-md transition-transform group-hover:scale-110">
                {copied ? <Check className="size-4 sm:size-5 text-emerald-600" /> : <Copy className="size-4 sm:size-5" />}
              </div>
            </button>

            <p className="mt-2 text-[11px] sm:text-xs text-white/80 font-medium">
              {copied ? (
                <span className="font-bold text-emerald-300">Game PIN copied to clipboard!</span>
              ) : (
                <span>Click PIN to copy · Join from Play &amp; Prep</span>
              )}
            </p>
          </div>
        </div>

        {/* Spacious Contenders Lounge */}
        <div className="relative z-10 w-full flex-1 flex flex-col justify-center">
          <div className="w-full rounded-2xl sm:rounded-3xl bg-black/20 ring-1 ring-white/20 p-3 sm:p-5 backdrop-blur-xl shadow-inner min-h-[140px] sm:min-h-[180px]">
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs sm:text-sm font-black text-white/90">
                  {participants.length === 0 ? "Waiting for challengers..." : "Active Contenders"}
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-black text-white ring-1 ring-white/20 shadow-xs">
                <StudentsSVG className="size-3.5 text-white" /> {participants.length} Players
              </span>
            </div>

            {participants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
                <div className="relative flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-white/15 text-white shadow-inner">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-2xl bg-white/20 opacity-50" />
                  <StudentsSVG className="size-6 sm:size-7 text-white" />
                </div>
                <p className="mt-3 text-sm sm:text-base font-bold text-white">No players in lobby yet</p>
                <p className="text-[11px] sm:text-xs text-white/75 mt-1">
                  Share Game PIN <span className="font-mono font-bold text-white">{formattedPin}</span> to battle in real time!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3.5 w-full">
                {participants.map((p, idx) => {
                  const isCurrentUser = p.userId === userId;
                  const isSessionHost = p.userId === session.creatorId;
                  const schoolDisplay =
                    p.schoolName && p.schoolName !== "—"
                      ? formatSchoolName(p.schoolName)
                      : "AKU Examination Board";

                  return (
                    <div
                      key={p.id}
                      style={{ animationDelay: `${idx * 40}ms` }}
                      className="group relative flex flex-col items-center text-center rounded-xl sm:rounded-2xl bg-white/15 hover:bg-white/20 ring-1 ring-white/25 p-2.5 sm:p-3.5 text-white shadow-md backdrop-blur-md transition-all duration-200 animate-in zoom-in-95 fade-in"
                    >
                      <div className="relative mb-1.5 sm:mb-2">
                        <UserAvatar
                          src={p.profileImage}
                          name={p.name}
                          username={p.username || ""}
                          id={p.userId}
                          size={44}
                          className="size-10 sm:size-12 rounded-full ring-2 ring-white/70 shadow-xs"
                          fallbackClassName="text-xs sm:text-sm font-black bg-white text-slate-900"
                        />
                        {isSessionHost && (
                          <span className="absolute -top-1 -right-1 flex size-4 sm:size-5 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow-xs">
                            <CrownSVG className="size-2.5 sm:size-3 text-amber-950" />
                          </span>
                        )}
                      </div>

                      <div className="w-full flex flex-col items-center min-w-0">
                        <h4 className="text-xs sm:text-sm font-black text-white leading-tight truncate w-full text-center">
                          {p.name}
                        </h4>
                        {isCurrentUser && (
                          <span className="mt-0.5 inline-flex items-center rounded-md bg-white/25 px-1.5 py-0.5 text-[8.5px] sm:text-[9px] font-black text-white ring-1 ring-white/40">
                            You
                          </span>
                        )}
                        <p className="mt-0.5 text-[10px] font-medium text-white/75 leading-tight truncate w-full text-center">
                          {schoolDisplay}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="relative z-10 pt-1 flex items-center justify-between text-[11px] sm:text-xs text-white/70">
          <span className="flex items-center gap-1.5">
            <ZapSVG className="size-3.5 text-amber-300" /> Live Gamified Arena
          </span>
          <span>Zero-lag synchronized round transitions</span>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 2: QUESTION PHASE (NO POINTS SHOWN ANYWHERE)
  // ─────────────────────────────────────────────────────────────────────────────
  if (session.phase === "QUESTION") {
    const activeQuestion =
      question || upcomingQuestionsCacheRef.current.get(currentQuestionIndex) || null;
    const isAnswerLocked = Boolean(selectedOpt);
    const progressPercent = Math.max(0, (timeLeft / perQuestionSeconds) * 100);
    const isUrdu = activeQuestion?.questionText ? isUrduText(activeQuestion.questionText) : false;
    const isLowTime = timeLeft <= 5;

    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-1 sm:px-4 lg:px-6 xl:px-8 animate-in fade-in duration-200">
        {/* Top Header: Timer, Paper Details, Progress & Exit */}
        <div className="shrink-0 pt-2 pb-2 sm:py-3 lg:py-4">
          {/* Mobile Info */}
          <div className="flex sm:hidden items-center justify-between gap-2 pb-2 text-[11px] font-semibold text-muted-foreground">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="font-bold text-foreground">
                {session.subject}
                {session.board ? ` • ${session.board}` : ""}
              </span>
              <span className="text-muted-foreground/60">•</span>
              <span className="shrink-0">Class {session.classLevel}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-[11px]">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Question
              </span>
              <span className="font-bold text-primary">
                {currentQuestionIndex + 1}
                <span className="font-medium text-muted-foreground"> / {session.totalQuestions}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 sm:gap-6 lg:gap-12">
            {/* Left: Time Remaining */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Time Remaining
              </p>
              <div
                className={cn(
                  "mt-0.5 flex items-center gap-2 font-mono text-lg font-bold sm:text-2xl transition-colors",
                  isLowTime ? "text-destructive animate-pulse" : "text-foreground"
                )}
              >
                <ClockSVG
                  className={cn(
                    "size-6 sm:size-7 shrink-0",
                    isLowTime ? "text-destructive" : "text-primary"
                  )}
                />
                <span>{timeLeft}s</span>
              </div>
            </div>

            {/* Center: Paper Details (Desktop) */}
            <div className="hidden sm:flex flex-col items-center text-center">
              <p className="text-xs font-bold text-foreground sm:text-sm">
                {session.subject}
                {session.board ? ` • ${session.board}` : ""}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground">
                Class {session.classLevel} · {session.title}
              </p>
            </div>

            {/* Right: Streak, Sound Toggle, Progress & Exit */}
            <div className="flex items-center gap-2 sm:gap-4">
              {isTeacherHost && (
                <div className="hidden xs:flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-black text-primary">
                  <span className="relative flex size-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                  <span>Host View</span>
                </div>
              )}

              {currentParticipant && currentParticipant.streak > 1 && (
                <div className="flex items-center gap-1 rounded-xl bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-xs font-black text-amber-600 dark:text-amber-400">
                  <Flame className="size-3.5 fill-amber-500 text-amber-500" />
                  <span>{currentParticipant.streak}x Streak!</span>
                </div>
              )}

              <button
                type="button"
                onClick={toggleSound}
                className="flex size-8 sm:size-9 items-center justify-center rounded-xl border border-border/80 bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground shadow-xs transition-all active:scale-95 cursor-pointer"
                title={isMuted ? "Unmute Sound" : "Mute Sound"}
              >
                <VolumeDuotoneSVG muted={isMuted} className="size-4 sm:size-4.5 text-primary" />
              </button>

              <div className="hidden sm:block text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Progress
                </p>
                <p className="mt-0.5 text-sm font-bold text-primary sm:text-base">
                  {currentQuestionIndex + 1}
                  <span className="font-medium text-muted-foreground">
                    {" "}/ {session.totalQuestions}
                  </span>
                </p>
              </div>

              {onExit && (
                <button
                  type="button"
                  onClick={onExit}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-xs font-bold text-muted-foreground shadow-xs transition-all hover:border-primary/50 hover:bg-muted hover:text-foreground active:scale-95 cursor-pointer"
                  title="Leave Challenge"
                >
                  <LogoutSVG className="size-3.5 text-muted-foreground" />
                  <span>Exit</span>
                </button>
              )}
            </div>
          </div>

          {/* Question Countdown Progress Bar */}
          <div className="mt-2.5 sm:mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
            <div
              className={cn(
                "h-full transition-all duration-200",
                isLowTime ? "bg-destructive animate-pulse" : "bg-primary"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question & Options Scroll Area */}
        <div
          key={currentQuestionIndex}
          className="mt-2 min-h-0 flex-1 overflow-y-auto p-1 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 sm:mt-3 lg:mt-4"
        >
          {/* Question Indicator Badge */}
          <div className="mb-3 flex items-center justify-between gap-3 lg:mb-5">
            <span
              className={cn(
                "rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground lg:px-4 lg:py-1.5 lg:text-sm",
                isUrdu && "font-urdu"
              )}
            >
              {isUrdu ? "س " : "Question "}{currentQuestionIndex + 1}
            </span>
            <span className="rounded-lg bg-muted/40 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 lg:text-sm">
              <ZapSVG className="size-3.5 text-amber-500" />
              <span>Speed Scored Round</span>
            </span>
          </div>

          {/* Question Text */}
          <div
            dir={isUrdu ? "rtl" : "ltr"}
            className={cn(
              "mb-4 text-sm text-foreground lg:mb-6 lg:text-lg break-words",
              isUrdu ? "font-urdu text-right leading-[2.2]" : "leading-relaxed text-left"
            )}
          >
            <span
              dangerouslySetInnerHTML={{
                __html: convertMathToHTML(activeQuestion?.questionText || "Loading question..."),
              }}
            />
          </div>

          {/* Question Image (if present, served instantly from memory cache) */}
          {activeQuestion?.imageUrl && (
            <QuestionImage
              src={activeQuestion.imageUrl}
              alt="Question diagram"
              className="max-h-72 sm:max-h-96 rounded-lg"
              skeletonHeightClass="h-72 sm:h-96"
              containerClassName="mb-3 sm:mb-5"
            />
          )}

          {/* MCQ Options */}
          <div
            dir={isUrdu ? "rtl" : "ltr"}
            className="flex flex-col gap-2.5 sm:gap-3.5 pb-2 transition-all duration-500"
          >
            {(activeQuestion?.options || []).map((opt, idx) => {
              const optLetter = String.fromCharCode(65 + idx);
              const isSelected = selectedOpt === optLetter || selectedOpt === opt.id;
              const isOptUrdu = isUrduText(opt.text);
              const isOtherHidden = !isTeacherHost && isAnswerLocked && !isSelected;
              const theme = OPTION_THEMES[idx % OPTION_THEMES.length];

              return (
                <div
                  key={opt.id || optLetter}
                  className={cn(
                    "transition-all duration-500 ease-in-out",
                    isOtherHidden
                      ? "max-h-0 opacity-0 my-0 scale-95 pointer-events-none overflow-hidden"
                      : "max-h-48 opacity-100 scale-100"
                  )}
                >
                  <button
                    type="button"
                    disabled={isTeacherHost || isAnswerLocked || isSubmittingAnswer}
                    onClick={() => !isTeacherHost && handleAnswer(optLetter)}
                    dir={isOptUrdu ? "rtl" : "ltr"}
                    className={cn(
                      "group relative flex w-full items-center justify-between overflow-hidden rounded-2xl border p-3.5 sm:p-4 text-left text-white shadow-md select-none transition-all duration-300 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none",
                      theme.border,
                      theme.shadow,
                      isSelected && theme.selectedRing,
                      isTeacherHost
                        ? "cursor-default"
                        : isAnswerLocked
                        ? "cursor-default"
                        : "cursor-pointer active:scale-[0.99] hover:shadow-lg hover:scale-[1.01] hover:brightness-105"
                    )}
                  >
                    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                      <div className={cn("absolute inset-0 bg-linear-to-br", theme.gradient)} />
                      <div className="absolute -top-[35%] -right-[15%] size-[80%] rounded-full bg-white/25 blur-[35px]" />
                      <div className="absolute -bottom-[35%] -left-[15%] size-[70%] rounded-full bg-black/30 blur-[30px]" />
                    </div>

                    <div className="relative z-10 flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                      <div
                        className={cn(
                          "flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-900 font-black text-xs sm:text-sm shadow-md ring-2 ring-white/70 transition-transform group-hover:scale-105 self-center"
                        )}
                      >
                        <span className="leading-none">{optLetter}</span>
                      </div>

                      <span
                        className={cn(
                          "min-w-0 flex-1 text-sm sm:text-base font-bold text-white drop-shadow-xs leading-snug self-center break-words",
                          isOptUrdu && "font-urdu text-right text-base sm:text-lg leading-[2.2]"
                        )}
                        dangerouslySetInnerHTML={{ __html: convertMathToHTML(opt.text) }}
                      />
                    </div>

                    {isSelected && (
                      <div className="relative z-10 ml-2 flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-md animate-in zoom-in-50 self-center">
                        <Check className="size-4 sm:size-5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {isTeacherHost ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 sm:p-4 text-xs sm:text-sm font-bold text-foreground shadow-xs animate-in fade-in duration-300">
              <div className="flex items-center gap-2.5">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
                </span>
                <span>Host Screen · Students are answering on their devices</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-background/80 px-3 py-1.5 text-xs font-black text-primary border border-border/60 shadow-2xs">
                <span>{totalAnsweredCount} / {participants.length} Answered</span>
              </div>
            </div>
          ) : isAnswerLocked ? (
            <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-card p-3.5 text-xs sm:text-sm font-bold text-foreground shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
              </span>
              <span>Answer locked in! Revealing results when timer expires...</span>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 3: REVEAL PHASE (EXACTLY 5 SECONDS - ABSOLUTELY NO POINTS DISPLAYED)
  // Clean full-width layout matching Question view, NO inner boxy card wrappers!
  // ─────────────────────────────────────────────────────────────────────────────
  if (session.phase === "REVEAL") {
    const activeQuestion =
      question || upcomingQuestionsCacheRef.current.get(currentQuestionIndex) || null;
    const isAnswered = Boolean(currentUserAnswer);
    const isCorrect = Boolean(
      currentUserAnswer?.isCorrect ?? currentUserAnswer?.is_correct ?? false
    );
    const correctOpt = (activeQuestion?.correctOptionId || "A").toUpperCase();
    const userChoice =
      currentUserAnswer?.selectedOption?.toUpperCase() ||
      currentUserAnswer?.selected_option?.toUpperCase() ||
      selectedOpt?.toUpperCase() ||
      null;
    const streakAfter =
      currentUserAnswer?.streakAfter ?? currentUserAnswer?.streak_after ?? 0;
    const totalVotes = Object.values(answerDistribution || {}).reduce((a, b) => a + b, 0);
    const isUrdu = activeQuestion?.questionText ? isUrduText(activeQuestion.questionText) : false;

    return (
      <div className="flex w-full flex-col gap-4 animate-in fade-in duration-300 pb-12 px-1 sm:px-4 lg:px-6 xl:px-8">
        {/* Top Header: Round Info & Duotone Sound Toggle */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground min-w-0">
            <span className="rounded-lg bg-primary/10 text-primary px-2.5 py-1 text-xs font-black">
              Round {currentQuestionIndex + 1} / {session.totalQuestions}
            </span>
            <span className="text-foreground font-semibold">
              Answer Reveal
            </span>
          </div>

          <button
            type="button"
            onClick={toggleSound}
            className="flex size-8 sm:size-9 items-center justify-center rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95 cursor-pointer shadow-2xs"
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            <VolumeDuotoneSVG muted={isMuted} className="size-4 text-primary" />
          </button>
        </div>

        {/* 5-Second Monotonic Continuous Progress Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
          <div
            className="h-full bg-emerald-500 rounded-full transition-[width] duration-75 ease-linear"
            style={{ width: `${phaseProgressPercent}%` }}
          />
        </div>

        {/* Outcome Banner (NO POINTS SHOWN ANYWHERE IN THIS STEP) */}
        {isTeacherHost ? (
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-primary via-emerald-600 to-teal-700 p-4 sm:p-5 text-white shadow-md animate-in zoom-in-95 duration-300">
            <div className="pointer-events-none absolute -right-6 -top-6 size-32 rounded-full bg-white/20 blur-2xl" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-md">
                  <CheckCircleSVG className="size-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black tracking-tight leading-tight">
                    Round {currentQuestionIndex + 1} Revealed
                  </h2>
                  <p className="text-xs text-white/90 font-semibold mt-0.5">
                    Correct Answer: Option {correctOpt} · {totalVotes} Student {totalVotes === 1 ? "Answer" : "Answers"} Received
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : isCorrect ? (
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700 p-4 sm:p-5 text-white shadow-md animate-in zoom-in-95 duration-300">
            <div className="pointer-events-none absolute -right-6 -top-6 size-32 rounded-full bg-white/20 blur-2xl" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-md">
                  <CheckCircleSVG className="size-7 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black tracking-tight leading-tight">
                    Correct! Lightning Fast!
                  </h2>
                  <p className="text-xs text-white/90 font-semibold mt-0.5">
                    Option {correctOpt} is the correct answer!
                  </p>
                </div>
              </div>

              {streakAfter > 1 && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/25 px-3 py-1 text-xs font-black text-white ring-1 ring-white/30 backdrop-blur-md shrink-0">
                  <Flame className="size-3.5 fill-amber-300 text-amber-300" />
                  <span>{streakAfter}x Streak!</span>
                </div>
              )}
            </div>
          </div>
        ) : isAnswered ? (
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-rose-600 via-pink-600 to-red-600 p-4 sm:p-5 text-white shadow-md animate-in zoom-in-95 duration-300">
            <div className="pointer-events-none absolute -right-6 -top-6 size-32 rounded-full bg-white/20 blur-2xl" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-md">
                  <CloseCircleSVG className="size-7 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black tracking-tight leading-tight">
                    Incorrect Round
                  </h2>
                  <p className="text-xs text-white/90 font-semibold mt-0.5">
                    Your Choice: Option {userChoice || "—"} · Correct Answer: Option {correctOpt}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-amber-600 via-orange-600 to-amber-700 p-4 sm:p-5 text-white shadow-md animate-in zoom-in-95 duration-300">
            <div className="pointer-events-none absolute -right-6 -top-6 size-32 rounded-full bg-white/20 blur-2xl" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-md">
                  <ClockSVG className="size-7 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black tracking-tight leading-tight">
                    Time&apos;s Up!
                  </h2>
                  <p className="text-xs text-white/90 font-semibold mt-0.5">
                    No answer locked in · Correct Answer: Option {correctOpt}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clean Full-Width Question & Options (NO Boxy Containers or Dividers) */}
        <div className="flex flex-col gap-3 pt-2">
          {/* Question Text */}
          <div
            dir={isUrdu ? "rtl" : "ltr"}
            className={cn(
              "text-sm sm:text-base font-semibold text-foreground leading-relaxed break-words",
              isUrdu && "font-urdu text-right text-base sm:text-lg leading-[2.2]"
            )}
          >
            <span
              dangerouslySetInnerHTML={{
                __html: convertMathToHTML(activeQuestion?.questionText || "Question review"),
              }}
            />
          </div>

          {/* Options with Reveal Status & Percentage Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {(activeQuestion?.options || []).map((opt, idx) => {
              const optLetter = String.fromCharCode(65 + idx);
              const count = answerDistribution?.[optLetter] ?? 0;
              const isThisCorrect =
                correctOpt === optLetter || correctOpt === opt.id.toUpperCase();
              const isUserChoice = userChoice === optLetter;
              const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              const theme = OPTION_THEMES[idx % OPTION_THEMES.length];

              return (
                <div
                  key={opt.id || optLetter}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border p-3.5 transition-all",
                    isThisCorrect
                      ? "border-emerald-500 bg-emerald-500/15 shadow-sm ring-2 ring-emerald-500/40"
                      : isUserChoice
                      ? "border-rose-500/70 dark:border-rose-500/60 bg-rose-500/10 dark:bg-rose-950/40 ring-1 ring-rose-500/30 shadow-xs"
                      : "border-border/70 bg-card/60 opacity-80"
                  )}
                >
                  {/* Subtle vote distribution fill bar */}
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 opacity-20 transition-all duration-500",
                      isThisCorrect ? "bg-emerald-500" : isUserChoice ? "bg-rose-500/30" : "bg-primary"
                    )}
                    style={{ width: `${percent}%` }}
                  />

                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white shadow-xs bg-linear-to-br",
                          theme.gradient
                        )}
                      >
                        {optLetter}
                      </span>
                      <span
                        className={cn(
                          "text-xs sm:text-sm font-semibold break-words",
                          isThisCorrect
                            ? "text-emerald-700 dark:text-emerald-300 font-bold"
                            : isUserChoice
                            ? "text-rose-600 dark:text-rose-300 font-bold"
                            : "text-foreground"
                        )}
                        dangerouslySetInnerHTML={{ __html: convertMathToHTML(opt.text) }}
                      />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isThisCorrect && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-300">
                          <CheckCircleSVG className="size-3" /> Correct
                        </span>
                      )}
                      {!isThisCorrect && isUserChoice && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/20 dark:bg-rose-500/30 border border-rose-500/40 px-2 py-0.5 text-[10px] font-black text-rose-600 dark:text-rose-200 shadow-xs">
                          <CloseCircleSVG className="size-3 text-rose-600 dark:text-rose-200" /> Chosen
                        </span>
                      )}
                      <span className="rounded-md bg-muted/80 px-2 py-0.5 text-[11px] font-bold text-foreground">
                        {count} ({percent}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explanation if present */}
          {activeQuestion?.explanation && (
            <div className="mt-2 rounded-2xl bg-muted/40 p-3.5 text-xs text-muted-foreground leading-relaxed border border-border/40">
              <span className="font-bold text-foreground">Explanation: </span>
              {activeQuestion.explanation}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 4: LEADERBOARD / SCOREBOARD (5 SECONDS - ONLY STEP WHERE POINTS APPEAR)
  // ─────────────────────────────────────────────────────────────────────────────
  if (session.phase === "LEADERBOARD") {
    return (
      <div className="flex w-full flex-col gap-4 animate-in fade-in duration-300 pb-16 px-1 sm:px-4 lg:px-6 xl:px-8">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground min-w-0">
            <span className="rounded-lg bg-primary/10 text-primary px-2.5 py-1 text-xs font-black">
              Round {currentQuestionIndex + 1} / {session.totalQuestions}
            </span>
            <span className="text-foreground font-semibold">
              Live Scoreboard
            </span>
          </div>

          <button
            type="button"
            onClick={toggleSound}
            className="flex size-8 sm:size-9 items-center justify-center rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95 cursor-pointer shadow-2xs"
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            <VolumeDuotoneSVG muted={isMuted} className="size-4 text-primary" />
          </button>
        </div>

        {/* 5-Second Monotonic Continuous Progress Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
          <div
            className="h-full bg-primary rounded-full transition-[width] duration-75 ease-linear"
            style={{ width: `${phaseProgressPercent}%` }}
          />
        </div>

        {/* Scoreboard Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-primary via-emerald-600 to-teal-700 p-4 sm:p-5 text-white shadow-xl">
          <div className="pointer-events-none absolute -right-8 -top-8 size-36 rounded-full bg-white/20 blur-2xl" />
          <div className="pointer-events-none absolute -left-8 -bottom-8 size-36 rounded-full bg-black/20 blur-2xl" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 sm:size-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-xs ring-1 ring-white/30">
                <TrophySVG className="size-5 sm:size-6 text-amber-300" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                  Round {currentQuestionIndex + 1} Points &amp; Standings
                </h2>
                <p className="text-[11px] text-white/85 font-medium mt-0.5">
                  Live scores updated after Round {currentQuestionIndex + 1}
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-black text-white ring-1 ring-white/30 backdrop-blur-md shrink-0">
              <SparklesSVG className="size-3.5 text-amber-300" />
              <span>Standings Updated</span>
            </div>
          </div>
        </div>

        {/* List of Points Received for each user */}
        <div className="flex flex-col gap-2.5">
          {participants.map((p, idx) => {
            const isUser = p.userId === userId;
            const rank = idx + 1;
            const ptsEarned = p.roundPoints ?? 0;
            const hasPoints = ptsEarned > 0;
            const schoolDisplay =
              p.schoolName && p.schoolName !== "—"
                ? formatSchoolName(p.schoolName)
                : "AKU Examination Board";

            return (
              <div
                key={p.id}
                style={{ animationDelay: `${idx * 40}ms` }}
                className={cn(
                  "relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border p-3 sm:p-4 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2",
                  rank === 1
                    ? "border-amber-400/80 bg-linear-to-r from-amber-500/20 via-amber-500/5 to-card ring-1 ring-amber-400/50 shadow-md shadow-amber-500/10"
                    : rank === 2
                    ? "border-blue-400/70 bg-linear-to-r from-blue-500/15 via-blue-500/5 to-card ring-1 ring-blue-400/40 shadow-sm shadow-blue-500/10"
                    : rank === 3
                    ? "border-purple-400/70 bg-linear-to-r from-purple-500/15 via-purple-500/5 to-card ring-1 ring-purple-400/40 shadow-sm shadow-purple-500/10"
                    : isUser
                    ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                    : "border-border/70 bg-card"
                )}
              >
                {/* Left: Rank, Avatar & User Details */}
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                  <div
                    className={cn(
                      "flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-xl font-black text-xs sm:text-sm shadow-xs",
                      rank === 1
                        ? "bg-amber-400 text-amber-950 ring-2 ring-amber-300"
                        : rank === 2
                        ? "bg-blue-500 text-white ring-2 ring-blue-400"
                        : rank === 3
                        ? "bg-purple-500 text-white ring-2 ring-purple-400"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {rank === 1 ? <CrownSVG className="size-4 text-amber-950" /> : `#${rank}`}
                  </div>

                  <UserAvatar
                    src={p.profileImage}
                    name={p.name}
                    username={p.username || ""}
                    id={p.userId}
                    size={40}
                    className={cn(
                      "size-9 sm:size-10 shrink-0 rounded-xl shadow-xs",
                      rank === 1
                        ? "ring-2 ring-amber-400/80"
                        : rank === 2
                        ? "ring-2 ring-blue-400/70"
                        : rank === 3
                        ? "ring-2 ring-purple-400/70"
                        : "ring-1 ring-border"
                    )}
                    fallbackClassName="rounded-xl text-xs font-black"
                  />

                  {/* Details with clean truncation to prevent ugly single-word line breaks */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h4 className="text-xs sm:text-sm font-black text-foreground truncate">
                        {p.name}
                      </h4>
                      {isUser && (
                        <span className="shrink-0 rounded-md bg-primary/15 px-1.5 py-0.5 text-[9px] font-black text-primary border border-primary/25">
                          You
                        </span>
                      )}
                      {p.streak > 1 && (
                        <span className="shrink-0 inline-flex items-center gap-0.5 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-black text-amber-600 dark:text-amber-400 border border-amber-500/25">
                          <Flame className="size-2.5 fill-amber-500 text-amber-500" /> {p.streak}x
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] font-medium text-muted-foreground mt-0.5 truncate block">
                      {schoolDisplay}
                    </p>
                  </div>
                </div>

                {/* Right: Stacked Points Column - ensures wide room for student text */}
                <div className="flex flex-col items-end justify-center shrink-0">
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-sm sm:text-base font-black text-foreground">
                      {p.totalPoints.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground">pts</span>
                  </div>

                  <div
                    className={cn(
                      "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10.5px] font-black shadow-xs mt-0.5 animate-in zoom-in-75 duration-300",
                      hasPoints
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                        : "bg-muted text-muted-foreground border border-border/40"
                    )}
                  >
                    <SparklesSVG className={cn("size-2.5", hasPoints ? "text-emerald-500" : "text-muted-foreground")} />
                    <span>+{ptsEarned} pts</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 5: GRAND FINALE PODIUM (TOP PERFORMERS COLORFUL RADIANT SHOWCASE)
  // ─────────────────────────────────────────────────────────────────────────────
  if (session.phase === "PODIUM") {
    const firstPlace = participants[0];
    const secondPlace = participants[1];
    const thirdPlace = participants[2];

    return (
      <div className="relative w-full space-y-6 sm:space-y-8 pt-8 sm:pt-12 pb-24 sm:pb-36 text-center animate-in zoom-in-95 duration-500 px-2 sm:px-4 lg:px-6">
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-linear-to-b from-amber-500/15 via-primary/10 to-transparent blur-3xl -z-10" />

        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-linear-to-r from-amber-500/20 via-primary/20 to-amber-500/20 px-4 py-1.5 text-xs font-black text-amber-600 dark:text-amber-300 shadow-sm backdrop-blur-md">
            <CrownSVG className="size-4 text-amber-500" />
            <span>Lightning Round Champions</span>
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-5xl">
            Grand Finale Podium
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm font-medium">
            {isTeacherHost ? (
              "All student scores and podium rankings have been recorded!"
            ) : currentParticipant?.leaderboardPoints && currentParticipant.leaderboardPoints > 0 ? (
              <span className="inline-flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                <SparklesSVG className="size-3.5 text-amber-500" />
                <span>You earned <strong>+{currentParticipant.leaderboardPoints} Global Leaderboard points</strong> from this match!</span>
              </span>
            ) : (
              "Leaderboard marks and rankings have been synchronized with your student profile!"
            )}
          </p>
        </div>

        {/* Olympic 3D Pedestals - Top Performer Colorful Radiant Cards */}
        <div className="relative flex items-end justify-center gap-2.5 sm:gap-6 pt-6 pb-2">
          {/* 2nd Place */}
          {secondPlace && (
            <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700">
              <div className="relative mb-2">
                <UserAvatar
                  src={secondPlace.profileImage}
                  name={secondPlace.name}
                  username={secondPlace.username}
                  id={secondPlace.userId}
                  size={52}
                  className="size-12 sm:size-15 shrink-0 rounded-full ring-3 ring-blue-300 shadow-xl shadow-blue-500/35"
                  fallbackClassName="rounded-full text-base font-black"
                />
                <div className="absolute -top-1.5 -right-1.5 flex size-6 sm:size-6.5 items-center justify-center rounded-full bg-linear-to-br from-blue-400 to-blue-600 text-white shadow-md ring-2 ring-white text-[11px] font-black">
                  2
                </div>
              </div>
              <p className="text-xs sm:text-sm font-black text-foreground truncate max-w-[95px] sm:max-w-[130px]">
                {formatCapitalizeWords(secondPlace.name)}
              </p>
              <div className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[11px] font-black text-blue-600 dark:text-blue-400 shadow-xs mt-1">
                <StarSVG className="size-3 text-blue-500" />
                <span>{secondPlace.totalPoints.toLocaleString()} pts</span>
              </div>
              <div className="relative mt-2.5 flex h-36 sm:h-44 w-26 sm:w-36 flex-col items-center justify-between rounded-t-3xl border-t-4 border-blue-200 border-x border-blue-300/40 bg-linear-to-b from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] p-3 text-white shadow-xl shadow-blue-500/30 overflow-hidden">
                <div className="pointer-events-none absolute -top-8 -right-8 size-24 rounded-full bg-white/25 blur-xl" />
                <div className="pointer-events-none absolute -bottom-8 -left-8 size-24 rounded-full bg-black/30 blur-xl" />
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.09] mix-blend-overlay"
                  style={{
                    backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                    backgroundSize: "14px 14px",
                  }}
                />
                <span className="pointer-events-none absolute -top-2 left-2 select-none text-4xl sm:text-5xl font-black text-white/15">
                  #2
                </span>
                <TrophySVG className="pointer-events-none absolute -bottom-3 -right-3 size-16 text-white/10 -rotate-12" />

                <span className="relative z-10 text-xl sm:text-2xl font-black text-white drop-shadow-md">2nd</span>
                <TrophySVG className="relative z-10 size-6 sm:size-7 text-blue-100/80 my-auto drop-shadow-sm" />
                <span className="relative z-10 rounded-full bg-white/20 border border-white/30 px-2.5 py-0.5 text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider text-white shadow-xs backdrop-blur-md">
                  Runner Up 🥈
                </span>
              </div>
            </div>
          )}

          {/* 1st Place (Champion) */}
          {firstPlace && (
            <div className="flex flex-col items-center animate-in slide-in-from-bottom-12 duration-500">
              <div className="relative mb-2">
                <div className="pointer-events-none absolute -inset-1.5 rounded-full bg-amber-400/30 blur-sm animate-pulse" />
                <UserAvatar
                  src={firstPlace.profileImage}
                  name={firstPlace.name}
                  username={firstPlace.username}
                  id={firstPlace.userId}
                  size={68}
                  className="size-16 sm:size-20 shrink-0 rounded-full ring-4 ring-amber-300 shadow-2xl shadow-amber-500/50"
                  fallbackClassName="rounded-full text-xl font-black"
                />
                <div className="absolute -top-3 -right-2 flex size-7 sm:size-8 items-center justify-center rounded-full bg-linear-to-br from-amber-300 via-amber-400 to-amber-500 text-amber-950 shadow-lg ring-2 ring-white text-xs sm:text-sm font-black">
                  👑
                </div>
              </div>
              <p className="text-xs sm:text-base font-black text-foreground truncate max-w-[125px] sm:max-w-[170px]">
                {formatCapitalizeWords(firstPlace.name)}
              </p>
              <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/35 px-3 py-0.5 text-xs font-black text-amber-600 dark:text-amber-300 shadow-xs mt-1">
                <StarSVG className="size-3.5 text-amber-500" />
                <span>{firstPlace.totalPoints.toLocaleString()} pts</span>
              </div>
              <div className="relative mt-2.5 flex h-48 sm:h-58 w-30 sm:w-44 flex-col items-center justify-between rounded-t-3xl border-t-4 border-amber-200 border-x border-amber-300/40 bg-linear-to-b from-[#f59e0b] via-[#d97706] to-[#b45309] p-3 text-white shadow-2xl shadow-amber-500/40 overflow-hidden">
                <div className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-white/30 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-10 -left-10 size-28 rounded-full bg-black/35 blur-2xl" />
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.10] mix-blend-overlay"
                  style={{
                    backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                    backgroundSize: "14px 14px",
                  }}
                />
                <span className="pointer-events-none absolute -top-2 left-2 select-none text-5xl sm:text-6xl font-black text-white/15">
                  #1
                </span>
                <CrownSVG className="pointer-events-none absolute -bottom-4 -right-4 size-20 text-white/10 -rotate-12" />

                <span className="relative z-10 text-2xl sm:text-3xl font-black text-white drop-shadow-md">1st</span>
                <CrownSVG className="relative z-10 size-8 sm:size-10 text-amber-100 my-auto drop-shadow-md" />
                <span className="relative z-10 rounded-full bg-white/25 border border-white/40 px-3 py-1 text-[9.5px] sm:text-[11px] font-black uppercase tracking-wider text-white shadow-xs backdrop-blur-md">
                  Champion 🏆
                </span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {thirdPlace && (
            <div className="flex flex-col items-center animate-in slide-in-from-bottom-6 duration-900">
              <div className="relative mb-2">
                <UserAvatar
                  src={thirdPlace.profileImage}
                  name={thirdPlace.name}
                  username={thirdPlace.username}
                  id={thirdPlace.userId}
                  size={46}
                  className="size-11 sm:size-14 shrink-0 rounded-full ring-3 ring-purple-300 shadow-xl shadow-purple-500/35"
                  fallbackClassName="rounded-full text-sm font-black"
                />
                <div className="absolute -top-1.5 -right-1.5 flex size-6 sm:size-6.5 items-center justify-center rounded-full bg-linear-to-br from-purple-400 to-purple-600 text-white shadow-md ring-2 ring-white text-[11px] font-black">
                  3
                </div>
              </div>
              <p className="text-xs sm:text-sm font-black text-foreground truncate max-w-[95px] sm:max-w-[130px]">
                {formatCapitalizeWords(thirdPlace.name)}
              </p>
              <div className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-[11px] font-black text-purple-600 dark:text-purple-400 shadow-xs mt-1">
                <StarSVG className="size-3 text-purple-500" />
                <span>{thirdPlace.totalPoints.toLocaleString()} pts</span>
              </div>
              <div className="relative mt-2.5 flex h-28 sm:h-36 w-26 sm:w-36 flex-col items-center justify-between rounded-t-3xl border-t-4 border-purple-200 border-x border-purple-300/40 bg-linear-to-b from-[#a855f7] via-[#9333ea] to-[#7e22ce] p-2.5 text-white shadow-xl shadow-purple-500/30 overflow-hidden">
                <div className="pointer-events-none absolute -top-8 -right-8 size-24 rounded-full bg-white/25 blur-xl" />
                <div className="pointer-events-none absolute -bottom-8 -left-8 size-24 rounded-full bg-black/30 blur-xl" />
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.09] mix-blend-overlay"
                  style={{
                    backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                    backgroundSize: "14px 14px",
                  }}
                />
                <span className="pointer-events-none absolute -top-2 left-2 select-none text-4xl sm:text-5xl font-black text-white/15">
                  #3
                </span>
                <MedalSVG className="pointer-events-none absolute -bottom-3 -right-3 size-16 text-white/10 -rotate-12" />

                <span className="relative z-10 text-lg sm:text-xl font-black text-white drop-shadow-md">3rd</span>
                <MedalSVG className="relative z-10 size-6 sm:size-7 text-purple-100/80 my-auto drop-shadow-sm" />
                <span className="relative z-10 rounded-full bg-white/20 border border-white/30 px-2.5 py-0.5 text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider text-white shadow-xs backdrop-blur-md">
                  Finalist 🥉
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Full Rankings Table of All Participants - Styled with Top Performers Cards */}
        <div className="mt-8 max-w-2xl mx-auto text-left">
          <div className="flex items-center justify-between gap-3 mb-3.5 pb-2 border-b border-border/60">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <TrophySVG className="size-3.5 text-primary" />
              <span>Complete Match Standings ({participants.length} {participants.length === 1 ? "Player" : "Players"})</span>
            </h3>
            <span className="text-[11px] font-bold text-muted-foreground">
              Official Leaderboard Result
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {participants.map((p, idx) => {
              const rank = idx + 1;
              const isUser = p.userId === userId;
              const schoolDisplay =
                p.schoolName && p.schoolName !== "—"
                  ? formatSchoolName(p.schoolName)
                  : "AKU Examination Board";
              const WatermarkIcon = rank === 1 ? CrownSVG : rank === 2 ? TrophySVG : MedalSVG;
              const rankGradient =
                rank === 1
                  ? "from-[#f59e0b] via-[#d97706] to-[#b45309]"
                  : rank === 2
                  ? "from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]"
                  : "from-[#a855f7] via-[#9333ea] to-[#7e22ce]";
              const rankBorderClass =
                rank === 1
                  ? "border-amber-300/50 shadow-amber-500/25 ring-1 ring-amber-300/40"
                  : rank === 2
                  ? "border-blue-300/50 shadow-blue-500/25 ring-1 ring-blue-300/35"
                  : "border-purple-300/50 shadow-purple-500/25 ring-1 ring-purple-300/35";

              // Top 3 Rendered as glorious full Top Performer Cards
              if (rank <= 3) {
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "relative flex w-full items-center justify-between overflow-hidden rounded-2xl sm:rounded-3xl border p-3.5 sm:p-4 text-left text-white shadow-lg transition-all",
                      rankBorderClass
                    )}
                  >
                    {/* Top Performer Card Background */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                      <div className={cn("absolute inset-0 bg-linear-to-br", rankGradient)} />
                      <div className="absolute -top-[35%] -right-[15%] size-[80%] rounded-full bg-white/25 blur-[40px]" />
                      <div className="absolute -bottom-[35%] -left-[15%] size-[70%] rounded-full bg-black/30 blur-[35px]" />
                      <div
                        className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
                        style={{
                          backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                          backgroundSize: "16px 16px",
                        }}
                      />
                    </div>

                    {/* Rank Watermark */}
                    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                      <span className="absolute -top-1 left-3 select-none text-4xl sm:text-5xl font-black text-white/15 drop-shadow-xs">
                        #{rank}
                      </span>
                      <WatermarkIcon className="absolute -bottom-2 -right-2 size-20 text-white/10 -rotate-12" />
                      <WatermarkIcon className="absolute top-1 right-24 size-10 text-white/10 rotate-12" />
                    </div>

                    {/* Main Content */}
                    <div className="relative z-10 flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                      {/* Profile Avatar with Rank Ring */}
                      <div className="relative shrink-0">
                        <UserAvatar
                          src={p.profileImage}
                          name={p.name}
                          username={p.username || ""}
                          id={p.userId}
                          size={54}
                          className="size-13 sm:size-14 rounded-full ring-2 ring-white/70 shadow-md"
                        />
                        <span className="absolute -bottom-1 -right-1 flex size-5 sm:size-5.5 items-center justify-center rounded-full bg-white text-[10px] font-black leading-none text-slate-900 shadow-sm ring-1 ring-black/10">
                          #{rank}
                        </span>
                      </div>

                      {/* Text Column */}
                      <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="text-sm sm:text-base font-black text-white drop-shadow-xs leading-tight truncate">
                            {formatCapitalizeWords(p.name)}
                          </h4>
                          {isUser && (
                            <span className="shrink-0 rounded-md bg-white/25 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white border border-white/30 backdrop-blur-md">
                              You
                            </span>
                          )}
                          {p.streak > 1 && (
                            <span className="shrink-0 inline-flex items-center gap-0.5 rounded-md bg-white/20 px-1.5 py-0.5 text-[9px] font-black text-white border border-white/25 backdrop-blur-md">
                              <Flame className="size-2.5 fill-amber-300 text-amber-300" /> {p.streak}x
                            </span>
                          )}
                        </div>

                        {/* School Row with Logo */}
                        <div className="flex items-center gap-1.5 mt-1.5 min-w-0">
                          <div className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/30 bg-white p-0.5 shadow-2xs">
                            {p.schoolLogo ? (
                              <img src={p.schoolLogo} alt="School" className="size-full object-contain" />
                            ) : (
                              <BuildingSVG className="size-3 text-slate-800" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 truncate">
                            <span className="text-[10.5px] sm:text-[11.5px] font-semibold text-white/95 leading-tight drop-shadow-xs truncate block">
                              {schoolDisplay}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Points badge on right */}
                      <div className="shrink-0 flex flex-col items-end justify-center">
                        <span className="inline-flex items-center gap-1 rounded-xl bg-white/20 backdrop-blur-md px-3 py-1 text-xs sm:text-sm font-black text-white border border-white/30 shadow-xs">
                          <StarSVG className="size-3.5 text-amber-200" />
                          <span>{p.totalPoints.toLocaleString()} pts</span>
                        </span>
                        {p.leaderboardPoints !== undefined && p.leaderboardPoints > 0 && (
                          <span className="text-[10px] text-amber-200 font-bold mt-1 tracking-wide">
                            +{p.leaderboardPoints} profile pts
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // Ranks 4 and beyond
              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-2xl border p-3 sm:p-3.5 shadow-2xs transition-all",
                    isUser
                      ? "border-primary/50 bg-primary/10 ring-1 ring-primary/25"
                      : "border-border/70 bg-card hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-black bg-muted text-muted-foreground">
                      #{rank}
                    </span>
                    <UserAvatar
                      src={p.profileImage}
                      name={p.name}
                      username={p.username || ""}
                      id={p.userId}
                      size={36}
                      className="size-8 sm:size-9 shrink-0 rounded-xl"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-black text-foreground truncate">
                          {formatCapitalizeWords(p.name)}
                        </span>
                        {isUser && (
                          <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[9px] font-black text-primary">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate block">
                        {schoolDisplay}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-center shrink-0">
                    <div className="inline-flex items-center gap-1 rounded-lg bg-muted/60 px-2.5 py-1 text-xs font-black text-foreground border border-border/50">
                      <StarSVG className="size-3 text-primary" />
                      <span>{p.totalPoints.toLocaleString()} pts</span>
                    </div>
                    {p.leaderboardPoints !== undefined && p.leaderboardPoints > 0 && (
                      <span className="text-[10px] font-bold text-primary mt-0.5">
                        +{p.leaderboardPoints} profile pts
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Exit CTA */}
        <div className="flex justify-center gap-3 pt-6">
          <AppButton
            size="lg"
            onClick={() => {
              if (onExit) onExit();
              else router.push(isTeacherHost ? "/teacher/papers-bank" : "/student/challenge");
            }}
            className="rounded-2xl px-8 font-black shadow-md shadow-primary/20 cursor-pointer"
          >
            Back to Dashboard
          </AppButton>
        </div>
      </div>
    );
  }

  return null;
}
