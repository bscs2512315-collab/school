"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  RotateCcw,
  TreeDeciduous,
  LoaderCircle,
  X,
  Sparkles,
} from "lucide-react";
import LogoutSVG from "@/public/svgs/LogoutSVG";
import PracticalIntro from "../_practical/PracticalIntro";
import type { TreeAspect } from "./RingsScene";
import { playGameCorrectSound, playGameWrongSound } from "@/app/student/lab-game/_scene/labAudio";

const RingsScene = dynamic(() => import("./RingsScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#bed4c8] text-sm font-semibold text-slate-700">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-slate-400 border-t-primary" />
        <span>Loading 3D Tree Log & Annual Rings Virtual Lab…</span>
      </div>
    </div>
  ),
});

const TOTAL_RINGS = 12;

const TREE_ASPECTS: readonly TreeAspect[] = [
  {
    id: "bark",
    index: 1,
    name: "Outer Bark & Cork Periderm",
    clue: "Protective outer layer formed by cork cambium (phellogen)",
    description:
      "The outer bark consists of dead, suberized cork cells that prevent water loss, resist pathogen invasion, and protect inner tissues against mechanical damage and temperature fluctuations.",
  },
  {
    id: "cambium",
    index: 2,
    name: "Vascular Cambium (Lateral Meristem)",
    clue: "Meristematic ring generating secondary xylem and phloem",
    description:
      "The vascular cambium is a cylinder of actively dividing lateral meristem between wood and bark. It generates secondary xylem (wood) inward and secondary phloem outward during each growing season.",
  },
  {
    id: "spring_autumn",
    index: 3,
    name: "Springwood vs. Autumnwood",
    clue: "Early wood (wide, light) + Late wood (dense, dark) = 1 Annual Ring",
    description:
      "In spring, active cambium forms springwood (early wood) with wide, thin-walled vessels for rapid sap flow. In autumn, it forms autumnwood (late wood) with dense, thick-walled vessels. Together, they form one annual growth ring.",
  },
  {
    id: "pith",
    index: 4,
    name: "Heartwood (Duramen) & Central Pith",
    clue: "Dark non-conducting structural core and primary stem center",
    description:
      "Older inner xylem becomes heartwood — dark and dense due to accumulated resins, tannins, and oils. It provides massive mechanical strength to the trunk. The exact centre contains the primary pith.",
  },
  {
    id: "dendro",
    index: 5,
    name: "Dendrochronology (Counting Tree Rings)",
    clue: "Determining tree age and historical growth from pith to bark",
    description:
      "By counting concentric annual growth rings from the central pith outward to the vascular cambium, biologists determine the exact age of a tree log (1 complete ring = 1 year of radial growth).",
  },
] as const;

type QuizQuestion = {
  id: string;
  question: string;
  clue: string;
  correctChoice: string;
  options: { id: string; label: string }[];
};

const QUIZ_QUESTIONS: readonly QuizQuestion[] = [
  {
    id: "q_count",
    question: "How many annual growth rings were counted from the central pith outward?",
    clue: "Each distinct annual ring represents one year of secondary growth.",
    correctChoice: "12",
    options: [
      { id: "12", label: "12 Annual Rings (Estimated Age: ~12 Years)" },
      { id: "6", label: "6 Annual Rings (Estimated Age: ~6 Years)" },
      { id: "24", label: "24 Annual Rings (Estimated Age: ~24 Years)" },
    ],
  },
  {
    id: "q_composition",
    question: "What two alternating wood bands together constitute ONE single annual growth ring?",
    clue: "Formed during different climatic conditions of the yearly seasonal cycle.",
    correctChoice: "spring_autumn",
    options: [
      { id: "spring_autumn", label: "Springwood (early wood) + Autumnwood (late wood)" },
      { id: "bark_cork", label: "Outer Bark + Cork Cambium Layer" },
      { id: "pith_cambium", label: "Central Pith + Vascular Cambium" },
    ],
  },
  {
    id: "q_cambium",
    question: "Which secondary meristematic tissue produces annual xylem rings year after year?",
    clue: "The lateral meristem located between secondary xylem and secondary phloem.",
    correctChoice: "cambium",
    options: [
      { id: "cambium", label: "Vascular Cambium" },
      { id: "apical", label: "Shoot Apical Meristem" },
      { id: "phellogen", label: "Cork Cambium (Phellogen)" },
    ],
  },
] as const;

type AppPhase = "intro" | "tour" | "count" | "quiz" | "complete";

function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function TreeRingsLabPage() {
  const [phase, setPhase] = useState<AppPhase>("intro");
  const [tourIndex, setTourIndex] = useState(1);

  // 3D Ring Counting State
  const [counted, setCounted] = useState<Set<number>>(new Set());
  const nextTargetIndex = counted.size < TOTAL_RINGS ? counted.size : undefined;

  // Randomized Quiz State
  const [quizQueue, setQuizQueue] = useState<QuizQuestion[]>([]);
  const [quizStep, setQuizStep] = useState(0);

  // Feedback toast
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

  const startCounting = useCallback(() => {
    if (answerTimerRef.current !== null) window.clearTimeout(answerTimerRef.current);
    answerLockedRef.current = false;
    setCounted(new Set());
    setFeedback(null);
    setPhase("count");
  }, []);

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
    setCounted(new Set());
    setTourIndex(1);
    setQuizStep(0);
    setFeedback(null);
    setPhase("intro");
  }, []);

  const triggerConfetti = useCallback(async () => {
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#34d399", "#f59e0b", "#38bdf8", "#fbbf24"],
      });
    } catch {
      /* ignore */
    }
  }, []);

  // Ring Click Handler (from 3D scene or quick button)
  const handleRingClick = useCallback(
    (ringIdx: number) => {
      if (phase !== "count" || answerLockedRef.current) return;

      const expectedIdx = counted.size;

      if (ringIdx === expectedIdx) {
        // Correct next ring in order!
        playGameCorrectSound();
        const nextSet = new Set(counted);
        nextSet.add(ringIdx);
        setCounted(nextSet);

        const newCount = nextSet.size;
        const ringNum = ringIdx + 1;

        if (newCount >= TOTAL_RINGS) {
          setFeedback({
            type: "correct",
            title: `All ${TOTAL_RINGS} Annual Rings Counted! Tree Age: ~12 Years`,
          });
          answerLockedRef.current = true;
          answerTimerRef.current = window.setTimeout(() => {
            answerLockedRef.current = false;
            startQuiz();
          }, 1800);
        } else {
          setFeedback({
            type: "correct",
            title: `Ring ${ringNum} counted (${TOTAL_RINGS - newCount} rings remaining)`,
          });
          if (answerTimerRef.current !== null) window.clearTimeout(answerTimerRef.current);
          answerTimerRef.current = window.setTimeout(() => {
            setFeedback(null);
            answerTimerRef.current = null;
          }, 1400);
        }
      } else if (counted.has(ringIdx)) {
        playGameWrongSound();
        setFeedback({
          type: "wrong",
          title: `Ring ${ringIdx + 1} is already counted! Move outward to Ring ${expectedIdx + 1}.`,
        });
        if (answerTimerRef.current !== null) window.clearTimeout(answerTimerRef.current);
        answerTimerRef.current = window.setTimeout(() => {
          setFeedback(null);
          answerTimerRef.current = null;
        }, 1400);
      } else {
        playGameWrongSound();
        setFeedback({
          type: "wrong",
          title: `That is Ring ${ringIdx + 1}. Count Ring ${expectedIdx + 1} first (nearer the pith).`,
        });
        if (answerTimerRef.current !== null) window.clearTimeout(answerTimerRef.current);
        answerTimerRef.current = window.setTimeout(() => {
          setFeedback(null);
          answerTimerRef.current = null;
        }, 1400);
      }
    },
    [phase, counted, startQuiz]
  );

  const currentQuizQuestion = quizQueue[quizStep] || QUIZ_QUESTIONS[0];

  const handlePickQuizChoice = useCallback(
    (choiceId: string) => {
      if (phase !== "quiz" || !currentQuizQuestion || answerLockedRef.current) return;
      answerLockedRef.current = true;

      if (choiceId === currentQuizQuestion.correctChoice) {
        playGameCorrectSound();
        setFeedback({
          type: "correct",
          title: "Correct Deduction!",
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
        }, 1600);
      } else {
        playGameWrongSound();
        setFeedback({
          type: "wrong",
          title: "Incorrect Answer. Try again!",
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

  const activeTourAspect = TREE_ASPECTS[tourIndex - 1];

  return (
    <div className="fixed inset-0 h-[100dvh] w-full overflow-hidden bg-[#bed4c8] select-none text-white font-sans">
      {/* 3D Virtual Lab Scene */}
      <div className="absolute inset-0">
        <RingsScene
          count={TOTAL_RINGS}
          counted={counted}
          onToggle={handleRingClick}
          activeAspect={phase === "tour" ? activeTourAspect : undefined}
          isTourMode={phase === "tour"}
          nextTargetIndex={phase === "count" ? nextTargetIndex : undefined}
        />
      </div>

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
          Biology · Class XII · Tree Annual Rings
        </span>
      </div>

      {/* Toast Notification at Left Side */}
      {feedback && (
        <div data-ui className="pointer-events-none absolute top-12 sm:top-16 left-2.5 sm:left-4 z-50 pl-[max(0.5rem,env(safe-area-inset-left,0px))]">
          <div
            key={`${feedback.title}-${feedback.type}`}
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

      {/* PHASE 1: Pre-Practical Briefing Screen */}
      {phase === "intro" && (
        <PracticalIntro
          brief={{
            expNo: 1,
            title: "Determination of Age of a Tree by Annual Growth Rings (Dendrochronology)",
            object:
              "To observe the transverse cross-section of a 3D dicot tree log, identify secondary growth tissues (springwood & autumnwood), and estimate the age of the specimen through dendrochronological ring counting.",
            apparatus: [
              "3D Tree Log & Rough Bark Specimen",
              "Vascular Cambium (Lateral Meristem)",
              "Springwood (Early Wood) & Autumnwood (Late Wood)",
              "Central Pith & Mechanical Heartwood Core",
            ],
          }}
          subject="Biology"
          exitHref="/student/lab-game/biology"
          onStart={startCounting}
          onSlide={(i) => {
            if (i >= 1) {
              setTourIndex(i);
              setPhase("tour");
            }
          }}
          apparatus={[
            "Outer Bark & Cork Periderm",
            "Vascular Cambium & Secondary Growth",
            "Springwood vs. Autumnwood",
            "Heartwood & Central Pith",
            "Dendrochronology (Age Counting)",
          ]}
        />
      )}

      {/* PHASE 2: Guided Tour of Anatomical Aspects */}
      {phase === "tour" && (
        <div
          data-ui
          className="pointer-events-none absolute left-2.5 sm:left-4 bottom-2.5 sm:bottom-4 z-30 flex justify-start pb-[max(0.4rem,env(safe-area-inset-bottom,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))]"
        >
          <div className="pointer-events-auto flex w-[min(92vw,350px)] sm:w-[360px] landscape:w-[min(40vw,320px)] max-h-[min(48dvh,240px)] sm:max-h-[280px] landscape:max-h-[min(70dvh,260px)] flex-col rounded-xl sm:rounded-2xl border border-white/25 bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl ring-1 ring-white/25 overflow-hidden backdrop-blur-md">
            <div className="px-3 py-1.5 sm:px-3.5 sm:py-2.5 shrink-0">
              <p className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#f6c453]">
                <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Anatomical Feature {tourIndex} of {TREE_ASPECTS.length}
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
                      if (tourIndex < TREE_ASPECTS.length) {
                        setTourIndex((i) => i + 1);
                      } else {
                        startCounting();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-[#f6c453] px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black text-[#0f2e12] shadow-md transition hover:bg-amber-300 active:scale-95 cursor-pointer"
                  >
                    {tourIndex < TREE_ASPECTS.length ? (
                      <>
                        Next Aspect <ChevronRight size={13} />
                      </>
                    ) : (
                      <>
                        Start Counting
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 3: Interactive 3D Ring Counting Mode */}
      {phase === "count" && (
        <div
          data-ui
          className="pointer-events-none absolute left-2.5 sm:left-4 bottom-2.5 sm:bottom-4 z-30 flex justify-start pb-[max(0.4rem,env(safe-area-inset-bottom,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))]"
        >
          <div className="pointer-events-auto flex w-[min(92vw,350px)] sm:w-[360px] landscape:w-[min(43vw,360px)] flex-col rounded-xl sm:rounded-2xl border border-white/25 bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl ring-1 ring-white/25 overflow-hidden backdrop-blur-md">
            <div className="px-3 py-1.5 sm:px-3.5 sm:py-2 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#f6c453]">
                  <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Ring Counting Challenge
                </p>
                <span className="rounded-full bg-black/30 px-2 py-0.5 text-[9px] font-bold text-amber-200">
                  {counted.size} / {TOTAL_RINGS} Counted
                </span>
              </div>
              <h2 className="text-xs sm:text-sm font-black text-white leading-tight mt-0.5">
                {counted.size < TOTAL_RINGS
                  ? `Find & Count Ring ${counted.size + 1}`
                  : "All Rings Counted!"}
              </h2>
            </div>

            <div className="border-t border-white/15 bg-black/20 px-3 py-2 sm:px-3.5 sm:py-2.5 flex flex-col justify-between gap-2">
              <p className="text-[10px] sm:text-[11px] font-medium leading-relaxed text-white/80">
                {counted.size < TOTAL_RINGS
                  ? "Click on the next concentric ring on the 3D log from the central pith outward, or tap the button below:"
                  : "Excellent! You have traced all 12 growth rings from the pith to the bark."}
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-1.5 pt-1">
                {counted.size < TOTAL_RINGS ? (
                  <button
                    type="button"
                    onClick={() => handleRingClick(counted.size)}
                    className="inline-flex min-h-8 sm:min-h-9 items-center justify-center gap-1.5 rounded-lg sm:rounded-xl bg-[#f6c453] px-3 text-[10px] sm:text-xs font-black text-[#0f2e12] shadow-md transition hover:bg-amber-300 active:scale-95 cursor-pointer"
                  >
                    Count Ring {counted.size + 1} <ChevronRight size={13} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startQuiz}
                    className="inline-flex min-h-8 sm:min-h-9 items-center justify-center gap-1.5 rounded-lg sm:rounded-xl bg-[#f6c453] px-3 text-[10px] sm:text-xs font-black text-[#0f2e12] shadow-md transition hover:bg-amber-300 active:scale-95 cursor-pointer"
                  >
                    Proceed to Dendrochronology Quiz <Sparkles size={13} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setCounted(new Set());
                    setFeedback(null);
                  }}
                  className="inline-flex min-h-7 items-center justify-center gap-1 text-[10px] font-bold text-white/70 hover:text-white transition"
                >
                  <RotateCcw size={11} /> Reset Ring Count
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 4: Conceptual Dendrochronology Quiz */}
      {phase === "quiz" && (
        <div
          data-ui
          className="pointer-events-none absolute left-2.5 sm:left-4 bottom-2.5 sm:bottom-4 z-30 flex justify-start pb-[max(0.4rem,env(safe-area-inset-bottom,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))]"
        >
          <div className="pointer-events-auto flex w-[min(92vw,350px)] sm:w-[360px] landscape:w-[min(43vw,360px)] flex-col rounded-xl sm:rounded-2xl border border-white/25 bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl ring-1 ring-white/25 overflow-hidden backdrop-blur-md">
            <div className="px-3 py-1.5 sm:px-3.5 sm:py-2 shrink-0">
              <p className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#f6c453]">
                <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Dendrochronology Quiz · Question {quizStep + 1} of {quizQueue.length}
              </p>
              <h2 className="text-xs sm:text-sm font-black text-white leading-tight mt-0.5">
                {currentQuizQuestion.question}
              </h2>
            </div>

            <div className="border-t border-white/15 bg-black/20 px-3 py-2 sm:px-3.5 sm:py-2.5 flex flex-col justify-between gap-2">
              <p className="text-[10px] sm:text-[11px] font-medium leading-relaxed text-white/80">
                {currentQuizQuestion.clue}
              </p>

              {/* Option Buttons */}
              <div className="grid grid-cols-1 gap-1.5 pt-1">
                {currentQuizQuestion.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handlePickQuizChoice(opt.id)}
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
      )}

      {/* PHASE 5: Completion Screen (Docked Left, 3D Tree Log visible on Right) */}
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
              <h2 className="mt-1 text-base sm:text-xl font-black">Tree Age & Rings Mastered!</h2>
              <p className="mt-0.5 text-[10px] sm:text-xs text-white/80">
                You successfully inspected the 3D tree trunk cross-section, analyzed secondary growth layers, and determined the tree&apos;s age.
              </p>
            </div>

            <div className="border-t border-white/15 bg-black/20 p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 overflow-y-auto overscroll-contain">
              <div className="rounded-xl sm:rounded-2xl bg-black/30 p-2 sm:p-3 border border-white/10 text-xs">
                <p className="font-bold text-[#f6c453] uppercase tracking-wider text-[9px] sm:text-[10px]">Dendrochronological Summary</p>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:gap-2 text-white/90">
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 border border-white/10">
                    <p className="font-bold text-white text-[10px] sm:text-[11px]">Estimated Age</p>
                    <p className="mt-0.5 text-[9px] sm:text-[10px] text-[#34d399] font-black leading-tight">12 Years Old (12 concentric rings)</p>
                  </div>
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 border border-white/10">
                    <p className="font-bold text-white text-[10px] sm:text-[11px]">Annual Ring</p>
                    <p className="mt-0.5 text-[9px] sm:text-[10px] text-white/70 leading-tight">1 Light Springwood + 1 Dark Autumnwood</p>
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
              <p className="text-xs text-white/70">Tree Annual Rings (Dendrochronology)</p>
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
