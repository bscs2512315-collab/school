"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  RotateCcw,
  Sun,
  MoveDown,
  LoaderCircle,
  X,
} from "lucide-react";
import LogoutSVG from "@/public/svgs/LogoutSVG";
import PracticalIntro from "../_practical/PracticalIntro";
import type { TropismAspect } from "./TropismScene";
import { playGameCorrectSound, playGameWrongSound } from "@/app/student/lab-game/_scene/labAudio";

const TropismScene = dynamic(() => import("./TropismScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#bed4c8] text-sm font-semibold text-slate-700">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-slate-400 border-t-primary" />
        <span>Loading 3D Tropism Virtual Lab…</span>
      </div>
    </div>
  ),
});

// Guided Aspects covering all angles & tropisms
const TROPISM_ASPECTS: readonly TropismAspect[] = [
  {
    id: "photo_left",
    name: "Unilateral Light from Left",
    index: 1,
    mode: "photo",
    sunPosition: "left",
    clue: "Shoot curves left toward the light source (+ve phototropism)",
    description:
      "When light shines from the left, auxin hormone migrates to the shaded (right) side of the stem. Higher auxin concentration on the shaded side accelerates cell elongation, bending the shoot toward the light.",
    targetPos: [-0.38, 2.01, 0],
    labelPos: [0.10, 2.15, 0],
    cameraPos: [0, 1.7, 2.45],
    cameraLookAt: [0, 1.5, 0],
  },
  {
    id: "photo_top",
    name: "Overhead Symmetrical Light",
    index: 2,
    mode: "photo",
    sunPosition: "top",
    clue: "Shoot grows straight upward symmetrically",
    description:
      "When sunlight is directly overhead, both sides of the shoot receive similar light. The shoot grows evenly and stays upright.",
    targetPos: [0, 2.01, 0],
    labelPos: [0.45, 1.95, 0],
    cameraPos: [0, 1.7, 2.45],
    cameraLookAt: [0, 1.5, 0],
  },
  {
    id: "photo_right",
    name: "Unilateral Light from Right",
    index: 3,
    mode: "photo",
    sunPosition: "right",
    clue: "Shoot curves right toward the light source (+ve phototropism)",
    description:
      "Unidirectional illumination from the right causes auxin to redistribute to the shaded (left) side. Increased cell elongation on the left side curves the shoot apex toward the right.",
    targetPos: [0.38, 2.01, 0],
    labelPos: [0.72, 1.95, 0],
    cameraPos: [0, 1.7, 2.45],
    cameraLookAt: [0, 1.5, 0],
  },
  {
    id: "geotropism",
    name: "Gravitropism (Horizontal Pot)",
    index: 4,
    mode: "geo",
    sunPosition: "none",
    clue: "Shoot bends upward (-ve) · Roots bend downward (+ve)",
    description:
      "When placed horizontally, gravity pulls statoliths downward. In the shoot, auxin on the lower side stimulates elongation (curves up). In the root, high auxin on the lower side inhibits cell growth, causing the upper cells to grow faster and bending the root down.",
    targetPos: [0.65, 1.82, 0],
    labelPos: [0.95, 2.00, 0],
    cameraPos: [0, 1.65, 2.5],
    cameraLookAt: [0, 1.4, 0],
  },
] as const;

type QuizQuestion = {
  id: string;
  mode: "photo" | "geo";
  sunPosition: "left" | "top" | "right" | "none";
  question: string;
  clue: string;
  correctChoice: string;
  options: { id: string; label: string }[];
};

const QUIZ_QUESTIONS: readonly QuizQuestion[] = [
  {
    id: "q_left",
    mode: "photo",
    sunPosition: "left",
    question: "Sunlight is shining from the LEFT. Which way will the shoot bend?",
    clue: "Shoots exhibit positive phototropism (+ve phototropism).",
    correctChoice: "left",
    options: [
      { id: "left", label: "Bend Left (Toward Light)" },
      { id: "top", label: "Grow Straight Up" },
      { id: "right", label: "Bend Right (Away from Light)" },
    ],
  },
  {
    id: "q_top",
    mode: "photo",
    sunPosition: "top",
    question: "Sunlight is directly OVERHEAD. How will the seedling grow?",
    clue: "Auxin is distributed symmetrically across the stem.",
    correctChoice: "top",
    options: [
      { id: "left", label: "Bend to Left" },
      { id: "top", label: "Grow Straight Upward" },
      { id: "right", label: "Bend to Right" },
    ],
  },
  {
    id: "q_right",
    mode: "photo",
    sunPosition: "right",
    question: "Sunlight is shining from the RIGHT. Which way will the shoot bend?",
    clue: "Auxin accumulates on the shaded left side.",
    correctChoice: "right",
    options: [
      { id: "left", label: "Bend to Left" },
      { id: "top", label: "Grow Straight Up" },
      { id: "right", label: "Bend Right (Toward Light)" },
    ],
  },
  {
    id: "q_shoot_geo",
    mode: "geo",
    sunPosition: "none",
    question: "The pot is placed HORIZONTALLY. In which direction will the SHOOT grow?",
    clue: "Plant shoots display negative geotropism (against gravity).",
    correctChoice: "shoot_up",
    options: [
      { id: "shoot_up", label: "Curves Upward (Negative Geotropism)" },
      { id: "shoot_down", label: "Curves Downward" },
      { id: "shoot_straight", label: "Grows Horizontally" },
    ],
  },
  {
    id: "q_root_geo",
    mode: "geo",
    sunPosition: "none",
    question: "The pot is placed HORIZONTALLY. In which direction will the ROOTS grow?",
    clue: "Roots display positive geotropism (with gravity).",
    correctChoice: "root_down",
    options: [
      { id: "root_up", label: "Curves Upward" },
      { id: "root_down", label: "Curves Downward (Positive Geotropism)" },
      { id: "root_straight", label: "Grows Horizontally" },
    ],
  },
] as const;

type AppPhase = "intro" | "tour" | "quiz" | "complete";

function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function TropismLabPage() {
  const [phase, setPhase] = useState<AppPhase>("intro");
  const [tourIndex, setTourIndex] = useState(1);

  // Randomized Quiz Queue
  const [quizQueue, setQuizQueue] = useState<QuizQuestion[]>([]);
  const [quizStep, setQuizStep] = useState(0);
  const [feedback, setFeedback] = useState<{
    type: "correct" | "wrong";
    title: string;
  } | null>(null);
  const answerTimerRef = useRef<number | null>(null);
  const answerLockedRef = useRef(false);

  useEffect(() => () => {
    if (answerTimerRef.current !== null) window.clearTimeout(answerTimerRef.current);
  }, []);

  // Quit modal
  const [showQuit, setShowQuit] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);

  const startQuiz = useCallback(() => {
    if (answerTimerRef.current !== null) window.clearTimeout(answerTimerRef.current);
    answerLockedRef.current = false;
    const shuffled = shuffle(QUIZ_QUESTIONS);
    setQuizQueue(shuffled);
    setQuizStep(0);
    setFeedback(null);
    setPhase("quiz");
  }, []);

  const handlePlayAgain = useCallback(() => {
    if (answerTimerRef.current !== null) window.clearTimeout(answerTimerRef.current);
    answerLockedRef.current = false;
    setTourIndex(1);
    setQuizStep(0);
    setFeedback(null);
    setPhase("intro");
  }, []);

  const currentQuizQuestion = quizQueue[quizStep] || QUIZ_QUESTIONS[0];

  const triggerConfetti = useCallback(async () => {
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#34d399", "#f43f5e", "#38bdf8", "#fbbf24"],
      });
    } catch {
      /* ignore */
    }
  }, []);

  const handlePickChoice = useCallback(
    (choiceId: string) => {
      if (phase !== "quiz" || !currentQuizQuestion || answerLockedRef.current) return;
      answerLockedRef.current = true;

      if (choiceId === currentQuizQuestion.correctChoice) {
        playGameCorrectSound();
        setFeedback({
          type: "correct",
          title: "Correct! Watch the plant respond.",
        });

        answerTimerRef.current = window.setTimeout(() => {
          if (quizStep + 1 >= quizQueue.length) {
            setPhase("complete");
            triggerConfetti();
          } else {
            setQuizStep((s) => s + 1);
            setFeedback(null);
          }
          answerLockedRef.current = false;
          answerTimerRef.current = null;
        }, 2800);
      } else {
        playGameWrongSound();
        setFeedback({
          type: "wrong",
          title: "Incorrect Prediction!",
        });

        answerTimerRef.current = window.setTimeout(() => {
          setFeedback(null);
          answerLockedRef.current = false;
          answerTimerRef.current = null;
        }, 1400);
      }
    },
    [phase, currentQuizQuestion, quizStep, quizQueue.length, triggerConfetti]
  );

  const activeTourAspect = TROPISM_ASPECTS[tourIndex - 1];

  // Active scene mode & sun position
  const sceneMode = phase === "tour" ? activeTourAspect.mode : currentQuizQuestion.mode;
  const sceneSunPos = phase === "tour" ? activeTourAspect.sunPosition : currentQuizQuestion.sunPosition;

  return (
    <div className="fixed inset-0 h-[100dvh] w-full overflow-hidden bg-[#bed4c8] select-none text-white font-sans">
      {/* 3D Virtual Lab Scene */}
      <div className="absolute inset-0">
        <TropismScene
          mode={sceneMode}
          sunPosition={sceneSunPos}
          activeAspect={phase === "tour" ? activeTourAspect : undefined}
          isTourMode={phase === "tour"}
          isQuizQuestion={phase === "quiz"}
          revealedChoice={phase === "quiz" && feedback?.type === "correct" ? currentQuizQuestion.correctChoice : undefined}
          isComplete={phase === "complete"}
        />
      </div>

      {phase === "quiz" && feedback?.type !== "correct" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[radial-gradient(circle_at_50%_35%,#d9e8db,#9bbba8)] px-6 pb-48 sm:pb-0">
          <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-white/60 bg-white/65 px-6 py-5 text-center text-primary-dark shadow-xl backdrop-blur-sm">
            {currentQuizQuestion.mode === "photo" ? <Sun size={32} aria-hidden /> : <MoveDown size={32} aria-hidden />}
            <p className="text-sm font-bold">Make your prediction to reveal the 3D result.</p>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div
        data-ui
        className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between p-2.5 sm:p-4 pt-[max(0.6rem,env(safe-area-inset-top,0px))] px-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))]"
      >
        <button
          type="button"
          onClick={() => setShowQuit(true)}
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white border border-white/15 transition hover:bg-neutral-900 active:scale-95 shadow-xl cursor-pointer shrink-0"
        >
          <LogoutSVG className="size-3.5 shrink-0 text-white" /> Exit Lab
        </button>

        <span className="pointer-events-auto rounded-full border border-amber-300/70 bg-[#3c301a]/90 px-3.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-100 shadow-md backdrop-blur-md">
          Biology · Class XII · Plant Tropisms
        </span>
      </div>

      {/* PHASE 1: Pre-Practical Briefing Screen */}
      {phase === "intro" && (
        <PracticalIntro
          brief={{
            expNo: 2,
            title: "Phototropism & Geotropism in Plants",
            object:
              "To investigate directional growth movements in plant shoot (phototropism) and root (geotropism) in response to unidirectional light and gravitational stimulus in a 3D laboratory.",
            apparatus: [
              "3D Seedling in Terracotta Pot",
              "Unidirectional 3D Light Source (Sun)",
              "Auxin (IAA) Distribution Mechanism",
              "Horizontal Gravitropism Bench",
            ],
          }}
          subject="Biology"
          exitHref="/student/lab-game/biology"
          onStart={startQuiz}
          onSlide={(i) => {
            if (i >= 1) {
              setTourIndex(i);
              setPhase("tour");
            }
          }}
          apparatus={[
            "Phototropism (Left, Overhead, Right Light)",
            "Geotropism (Shoot Upward, Root Downward)",
            "Auxin Asymmetric Elongation",
          ]}
        />
      )}

      {/* PHASE 2: Guided Tour of All Aspects */}
      {phase === "tour" && (
        <div
          data-ui
          className="pointer-events-none absolute left-2.5 sm:left-4 bottom-2.5 sm:bottom-4 z-30 flex justify-start pb-[max(0.4rem,env(safe-area-inset-bottom,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))]"
        >
          <div className="pointer-events-auto flex w-[min(92vw,350px)] sm:w-[360px] landscape:w-[min(40vw,320px)] max-h-[min(48dvh,240px)] sm:max-h-[280px] landscape:max-h-[min(70dvh,260px)] flex-col rounded-xl sm:rounded-2xl border border-white/25 bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl ring-1 ring-white/25 overflow-hidden backdrop-blur-md">
            <div className="px-3 py-1.5 sm:px-3.5 sm:py-2.5 shrink-0">
              <p className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#f6c453]">
                <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Aspect {tourIndex} of {TROPISM_ASPECTS.length}
              </p>
              <h2 className="text-xs sm:text-base font-black leading-tight text-white mt-0.5">
                {activeTourAspect.name}
              </h2>
            </div>

            <div className="border-t border-white/15 bg-black/20 px-3 py-2 sm:px-3.5 sm:py-2.5 flex-1 overflow-y-auto overscroll-contain flex flex-col justify-between gap-2">
              <p className="text-[11px] sm:text-xs font-medium leading-relaxed text-white/95">
                {activeTourAspect.description}
              </p>

              <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-1.5 shrink-0">
                {tourIndex > 1 ? (
                  <button
                    type="button"
                    onClick={() => setTourIndex((i) => i - 1)}
                    className="rounded-lg sm:rounded-xl border border-white/20 bg-white/10 px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-bold text-white transition hover:bg-white/20 cursor-pointer"
                  >
                    Back
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (tourIndex < TROPISM_ASPECTS.length) {
                        setTourIndex((i) => i + 1);
                      } else {
                        startQuiz();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-[#f6c453] px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black text-[#0f2e12] shadow-md transition hover:bg-amber-300 active:scale-95 cursor-pointer"
                  >
                    {tourIndex < TROPISM_ASPECTS.length ? (
                      <>
                        Next Aspect <ChevronRight size={13} />
                      </>
                    ) : (
                      <>
                        Start Challenge
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 3: Locating / Prediction Challenge */}
      {phase === "quiz" && (
        <>
          {/* Toast Notification at Left Side */}
          {feedback && (
            <div data-ui className="pointer-events-none absolute top-12 sm:top-16 left-2.5 sm:left-4 z-50 pl-[max(0.5rem,env(safe-area-inset-left,0px))]">
              <div
                key={`${quizStep}-${feedback.type}`}
                className={`pointer-events-auto flex items-center gap-2 sm:gap-2.5 rounded-xl sm:rounded-2xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-2xl backdrop-blur-xl border transition-all duration-300 animate-in slide-in-from-left-4 fade-in ${
                  feedback.type === "correct"
                    ? "border-emerald-400 bg-gradient-to-r from-emerald-950/95 to-[#064e3b]/95 text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.45)] ring-2 ring-emerald-400/50"
                    : "border-rose-500 bg-gradient-to-r from-rose-950/95 to-[#7f1d1d]/95 text-rose-100 shadow-[0_0_30px_rgba(239,68,68,0.5)] ring-2 ring-rose-500/50 animate-game-shake"
                }`}
              >
                <div
                  className={`grid size-5 sm:size-6 shrink-0 place-items-center rounded-lg font-black ${
                    feedback.type === "correct" ? "bg-emerald-500 text-white shadow" : "bg-rose-600 text-white shadow"
                  }`}
                >
                  {feedback.type === "correct" ? (
                    <Check size={12} strokeWidth={3.5} />
                  ) : (
                    <X size={12} strokeWidth={3.5} />
                  )}
                </div>
                <p className="text-[11px] sm:text-xs font-black tracking-tight whitespace-nowrap">
                  {feedback.title}
                </p>
              </div>
            </div>
          )}

          {/* Left-docked Question Prompt Card */}
          <div
            data-ui
            className="pointer-events-none absolute left-2.5 sm:left-4 bottom-2.5 sm:bottom-4 z-30 flex justify-start pb-[max(0.4rem,env(safe-area-inset-bottom,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))]"
          >
            <div className="pointer-events-auto flex w-[min(92vw,350px)] sm:w-[360px] landscape:w-[min(43vw,360px)] flex-col rounded-xl sm:rounded-2xl border border-white/25 bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl ring-1 ring-white/25 overflow-hidden backdrop-blur-md">
              <div className="px-3 py-1.5 sm:px-3.5 sm:py-2 shrink-0">
                <p className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#f6c453]">
                  <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Tropism Challenge · Question {quizStep + 1} of {quizQueue.length}
                </p>
                <h2 className="text-xs sm:text-sm font-black text-white leading-tight mt-0.5">
                  {currentQuizQuestion.question}
                </h2>
              </div>

              <div className="border-t border-white/15 bg-black/20 px-3 py-2 sm:px-3.5 sm:py-2.5 flex flex-col justify-between gap-2">
                <p className="text-[10px] sm:text-[11px] font-medium leading-relaxed text-white/80">
                  {feedback?.type === "correct" ? "Observe the growth direction in the 3D scene." : `${currentQuizQuestion.clue} Select your prediction below:`}
                </p>

                {/* Option Buttons */}
                <div className="grid grid-cols-1 gap-1.5 pt-1">
                  {currentQuizQuestion.options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handlePickChoice(opt.id)}
                      disabled={feedback !== null}
                      className="inline-flex min-h-8 sm:min-h-9 items-center justify-start rounded-lg sm:rounded-xl border border-white/20 bg-white/10 px-2.5 text-[10px] sm:text-xs font-bold text-white transition hover:bg-white/20 active:scale-95 cursor-pointer text-left disabled:cursor-default disabled:opacity-60"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* PHASE 4: Completion Screen (Docked Left, 3D Plant visible at Right) */}
      {phase === "complete" && (
        <div
          data-ui
          className="pointer-events-none absolute inset-0 z-40 flex items-end sm:items-center justify-center sm:justify-start landscape:justify-start p-2.5 sm:p-4 md:p-6 overflow-y-auto pr-[max(0.75rem,env(safe-area-inset-right,0px))] pl-[max(0.75rem,env(safe-area-inset-left,0px))] sm:pl-8 md:pl-12 lg:pl-16 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
        >
          <div className="pointer-events-auto w-full max-w-[min(94vw,380px)] sm:max-w-[400px] max-h-[min(94dvh,520px)] flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary to-primary-dark border border-white/25 shadow-2xl text-white my-auto backdrop-blur-md animate-in slide-in-from-left-8 fade-in">
            <div className="p-3 sm:p-4 text-center text-white shrink-0">
              <span className="inline-block rounded-full bg-black/25 px-2.5 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#f6c453]">
                Practical Complete
              </span>
              <h2 className="mt-1 text-base sm:text-xl font-black">Plant Tropisms Mastered!</h2>
              <p className="mt-0.5 text-[10px] sm:text-xs text-white/80">
                You successfully predicted shoot phototropism under different angles of sunlight and demonstrated gravitropism in roots and shoots.
              </p>
            </div>

            <div className="border-t border-white/15 bg-black/20 p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 overflow-y-auto overscroll-contain">
              <div className="rounded-xl sm:rounded-2xl bg-black/30 p-2 sm:p-3 border border-white/10 text-xs">
                <p className="font-bold text-[#f6c453] uppercase tracking-wider text-[9px] sm:text-[10px]">Mechanism Summary</p>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:gap-2 text-white/90">
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 border border-white/10">
                    <p className="font-bold text-white text-[10px] sm:text-[11px]">Phototropism</p>
                    <p className="mt-0.5 text-[9px] sm:text-[10px] text-white/70 leading-tight">Shoot curves towards light via auxin on shaded side</p>
                  </div>
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 border border-white/10">
                    <p className="font-bold text-white text-[10px] sm:text-[11px]">Geotropism</p>
                    <p className="mt-0.5 text-[9px] sm:text-[10px] text-white/70 leading-tight">Roots curve down (+ve) · Shoot curves up (-ve)</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handlePlayAgain}
                  className="inline-flex min-h-9 sm:min-h-10 items-center justify-center gap-1.5 rounded-xl bg-[#f6c453] px-2.5 text-[11px] sm:text-xs font-black text-[#0f2e12] shadow-lg transition hover:bg-amber-300 active:scale-95 cursor-pointer text-center"
                >
                  <RotateCcw size={13} /> Play Again
                </button>
                <Link
                  href="/student/lab-game/biology"
                  className="inline-flex min-h-9 sm:min-h-10 items-center justify-center gap-1 rounded-xl border border-white/20 bg-white/10 px-2.5 text-[11px] sm:text-xs font-bold text-white transition hover:bg-white/20 text-center"
                >
                  Return to Lab
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quit Modal */}
      {showQuit && (
        <div data-ui className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-2.5 sm:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-[24rem] max-h-[min(94dvh,450px)] flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary to-primary-dark border border-white/25 shadow-2xl text-white my-auto">
            <div className="p-3.5 sm:p-5 shrink-0">
              <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#f6c453]">Exit Lab</p>
              <h2 className="text-base sm:text-lg font-black leading-tight">Leave Practical?</h2>
              <p className="text-xs text-white/70">Plant Tropisms (Phototropism & Geotropism)</p>
            </div>
            <div className="border-t border-white/15 bg-black/20 p-3.5 sm:p-5 flex-1 overflow-y-auto overscroll-contain">
              <p className="text-xs leading-relaxed text-white/80">
                Your current session progress will not be saved. Are you sure you want to leave the virtual lab?
              </p>
              <div className="mt-4 sm:mt-5 flex gap-2 sm:gap-3">
                <button
                  type="button"
                  disabled={isQuitting}
                  onClick={() => setShowQuit(false)}
                  className="flex-1 rounded-xl sm:rounded-2xl bg-white/10 px-4 py-2 sm:py-2.5 text-xs font-black text-white transition hover:bg-white/20 cursor-pointer"
                >
                  Stay
                </button>
                <Link
                  href="/student/lab-game/biology"
                  onClick={() => setIsQuitting(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-[#f6c453] px-4 py-2 sm:py-2.5 text-xs font-black text-[#0f2e12] shadow-lg transition hover:bg-amber-300"
                >
                  {isQuitting ? <LoaderCircle size={15} className="animate-spin" /> : "Quit"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
