"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import {
  Check,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Play,
  HelpCircle,
  LoaderCircle,
  X,
} from "lucide-react";
import LogoutSVG from "@/public/svgs/LogoutSVG";
import AppLogo from "@/components/AppLogo";
import PracticalIntro from "../_practical/PracticalIntro";
import type { BoneDefinition } from "./SkeletonScene";
import { playGameCorrectSound, playGameWrongSound } from "@/app/student/lab-game/_scene/labAudio";

const SkeletonScene = dynamic(() => import("./SkeletonScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#0d1614] text-sm font-semibold text-white/60">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-[#34d399]" />
        <span>Loading 3D Virtual Lab & Skeleton…</span>
      </div>
    </div>
  ),
});

const BONES: readonly BoneDefinition[] = [
  {
    id: "pectoral",
    index: 1,
    name: "Pectoral girdle",
    clue: "The clavicle and scapula connect an arm to the trunk via the glenoid cavity.",
    pos: [0.17, 1.41, 0.06],
    labelPos: [0.38, 1.43, 0.06],
    tourCam: {
      pos: [0, 1.35, 1.6],
      lookAt: [0.12, 1.35, 0],
    },
    tourDescription:
      "The pectoral girdle consists of the clavicle (collarbone) and scapula (shoulder blade). It anchors the upper limb to the axial skeleton with high mobility.",
  },
  {
    id: "humerus",
    index: 2,
    name: "Humerus",
    clue: "The single long bone of the upper arm between shoulder and elbow.",
    pos: [0.28, 1.15, 0.03],
    labelPos: [0.46, 1.18, 0.03],
    tourCam: {
      pos: [0.1, 1.15, 1.6],
      lookAt: [0.24, 1.15, 0],
    },
    tourDescription:
      "The humerus is the single long bone of the brachium (upper arm). Its proximal head forms a ball-and-socket joint with the scapula.",
  },
  {
    id: "forearm",
    index: 3,
    name: "Radius and ulna",
    clue: "Two parallel bones of the forearm between elbow and wrist joints.",
    pos: [0.34, 0.86, 0.03],
    labelPos: [0.50, 0.88, 0.03],
    tourCam: {
      pos: [0.15, 0.86, 1.6],
      lookAt: [0.28, 0.86, 0],
    },
    tourDescription:
      "Two parallel bones form the antebrachium (forearm): the radius on the lateral (thumb) side and the ulna on the medial (pinky) side, allowing pronation and supination.",
  },
  {
    id: "pelvic",
    index: 4,
    name: "Pelvic girdle",
    clue: "The basin-shaped hip bones that anchor the hindlimbs to the sacrum.",
    pos: [0.10, 0.94, 0.08],
    labelPos: [0.36, 0.90, 0.08],
    tourCam: {
      pos: [0, 0.94, 1.6],
      lookAt: [0.08, 0.94, 0],
    },
    tourDescription:
      "The pelvic girdle is formed by two large coxal (hip) bones (ilium, ischium, and pubis). Its deep acetabulum socket provides stable weight support for the legs.",
  },
  {
    id: "femur",
    index: 5,
    name: "Femur",
    clue: "The longest, strongest bone in the human body forming the thigh.",
    pos: [0.14, 0.58, 0.06],
    labelPos: [0.38, 0.58, 0.06],
    tourCam: {
      pos: [0.05, 0.58, 1.6],
      lookAt: [0.14, 0.58, 0],
    },
    tourDescription:
      "The femur (thigh bone) is the heaviest and strongest bone in the body. It bears the body's upright weight and articulates with the pelvis and knee.",
  },
  {
    id: "shin",
    index: 6,
    name: "Tibia and fibula",
    clue: "The two lower leg bones between knee and ankle joints.",
    pos: [0.15, 0.24, 0.05],
    labelPos: [0.38, 0.24, 0.05],
    tourCam: {
      pos: [0.05, 0.28, 1.6],
      lookAt: [0.15, 0.28, 0],
    },
    tourDescription:
      "The shank contains the robust medial tibia (shinbone) for weight-bearing and the slender lateral fibula for muscle attachment and ankle stability.",
  },
] as const;

type AppPhase = "intro" | "tour" | "quiz" | "complete";

// Helper function to shuffle array randomly
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function SkeletonLabPage() {
  const [phase, setPhase] = useState<AppPhase>("intro");
  const [tourIndex, setTourIndex] = useState(1); // 1..6

  // Locating game state (with randomized question queue)
  const [quizQueue, setQuizQueue] = useState<string[]>([]);
  const [quizStep, setQuizStep] = useState(0);
  const [foundBones, setFoundBones] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{
    type: "correct" | "wrong";
    title: string;
  } | null>(null);
  const wrongTimerRef = useRef<number | null>(null);

  // Quit modal
  const [showQuit, setShowQuit] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);

  // Initialize randomized quiz
  const startQuiz = useCallback(() => {
    const shuffledIds = shuffle(BONES.map((b) => b.id));
    setQuizQueue(shuffledIds);
    setQuizStep(0);
    setFoundBones(new Set());
    setFeedback(null);
    setPhase("quiz");
  }, []);

  const handlePlayAgain = useCallback(() => {
    if (wrongTimerRef.current !== null) window.clearTimeout(wrongTimerRef.current);
    setTourIndex(1);
    setQuizStep(0);
    setFoundBones(new Set());
    setFeedback(null);
    setPhase("intro");
  }, []);

  const currentTargetId = quizQueue[quizStep] || "";
  const currentTargetBone = useMemo(
    () => BONES.find((b) => b.id === currentTargetId),
    [currentTargetId]
  );

  // Trigger confetti upon completion
  const triggerConfetti = useCallback(async () => {
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#34d399", "#10b981", "#38bdf8", "#fbbf24", "#f43f5e"],
      });
    } catch {
      /* ignore */
    }
  }, []);

  // Handle bone selection in quiz mode
  const handlePick = useCallback(
    (id: string) => {
      if (phase !== "quiz" || !currentTargetBone) return;

      const clickedBone = BONES.find((b) => b.id === id);
      if (!clickedBone) return;

      if (id === currentTargetId) {
        // Correct choice!
        playGameCorrectSound();
        setFoundBones((prev) => new Set(prev).add(id));
        setFeedback({
          type: "correct",
          title: "Correct Choice! ✓",
        });

        // Advance to next question after short delay
        window.setTimeout(() => {
          if (quizStep + 1 >= quizQueue.length) {
            setPhase("complete");
            triggerConfetti();
          } else {
            setQuizStep((s) => s + 1);
            setFeedback(null);
          }
        }, 1200);
      } else {
        // Wrong choice clicked!
        playGameWrongSound();
        setFeedback({
          type: "wrong",
          title: "No, That's Wrong Choice!",
        });

        // Auto remove toast after 2.5 seconds
        if (wrongTimerRef.current) window.clearTimeout(wrongTimerRef.current);
        wrongTimerRef.current = window.setTimeout(() => {
          setFeedback(null);
        }, 2500);
      }
    },
    [phase, currentTargetId, currentTargetBone, quizStep, quizQueue.length, triggerConfetti]
  );

  // Spot found mapping
  const spotsState = useMemo(() => {
    const map = new Map<string, boolean>();
    BONES.forEach((b) => map.set(b.id, foundBones.has(b.id)));
    return map;
  }, [foundBones]);

  const activeTourBone = BONES[tourIndex - 1];

  return (
    <div className="fixed inset-0 h-[100dvh] w-full overflow-hidden bg-[#0d1614] select-none text-white font-sans">
      {/* 3D Lab Scene Canvas (Full screen POV) */}
      <div className="absolute inset-0">
        <SkeletonScene
          bones={BONES}
          spotsState={spotsState}
          tourActive={phase === "tour"}
          tourIndex={tourIndex}
          isQuizMode={phase === "quiz"}
          isComplete={phase === "complete"}
          onPick={handlePick}
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
          Biology · Class XII · Human Skeleton Anatomy
        </span>
      </div>

      {/* PHASE 1: Pre-Practical Briefing Screen (Matches Chemistry & Physics page UI standard) */}
      {phase === "intro" && (
        <PracticalIntro
          brief={{
            expNo: 3,
            title: "Human Appendicular Skeleton",
            object: "To identify, examine, and locate the articulated bones of the pectoral girdle, pelvic girdle, forelimbs, and hindlimbs in a 3D laboratory environment.",
            apparatus: BONES.map((b) => b.name),
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
          apparatus={BONES.map((b) => b.name)}
        />
      )}

      {/* PHASE 2: Bone Anatomy Tour HUD */}
      {phase === "tour" && (
        <div
          data-ui
          className="pointer-events-none absolute left-2.5 sm:left-4 bottom-2.5 sm:bottom-4 z-30 flex justify-start pb-[max(0.4rem,env(safe-area-inset-bottom,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))]"
        >
          {/* Left-docked Tour Card */}
          <div className="pointer-events-auto flex w-[min(92vw,350px)] sm:w-[360px] landscape:w-[min(40vw,320px)] max-h-[min(48dvh,240px)] sm:max-h-[280px] landscape:max-h-[min(70dvh,260px)] flex-col rounded-xl sm:rounded-2xl border border-white/25 bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl ring-1 ring-white/25 overflow-hidden backdrop-blur-md">
            <div className="px-3 py-1.5 sm:px-3.5 sm:py-2.5 shrink-0">
              <p className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#f6c453]">
                <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Bone {tourIndex} of {BONES.length}
              </p>
              <h2 className="text-xs sm:text-base font-black leading-tight text-white mt-0.5">
                {activeTourBone.name}
              </h2>
            </div>

            <div className="border-t border-white/15 bg-black/20 px-3 py-2 sm:px-3.5 sm:py-2.5 flex-1 overflow-y-auto overscroll-contain flex flex-col justify-between gap-2">
              <p className="text-[11px] sm:text-xs font-medium leading-relaxed text-white/95">
                {activeTourBone.tourDescription}
              </p>

              {/* Navigation Actions */}
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
                      if (tourIndex < BONES.length) {
                        setTourIndex((i) => i + 1);
                      } else {
                        startQuiz();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-[#f6c453] px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black text-[#0f2e12] shadow-md transition hover:bg-amber-300 active:scale-95 cursor-pointer"
                  >
                    {tourIndex < BONES.length ? (
                      <>
                        Next Bone <ChevronRight size={13} />
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

      {/* PHASE 3: Locating Challenge */}
      {phase === "quiz" && (
        <>
          {/* Toast Notification at Left Side (Does NOT overlap skeleton in center) */}
          {feedback && (
            <div data-ui className="pointer-events-none absolute top-12 sm:top-16 left-2.5 sm:left-4 z-50 pl-[max(0.5rem,env(safe-area-inset-left,0px))]">
              <div
                key={`${feedback.type}-${Date.now()}`}
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
            <div className="pointer-events-auto flex w-[min(92vw,350px)] sm:w-[360px] landscape:w-[min(40vw,320px)] max-h-[min(38dvh,180px)] sm:max-h-[220px] landscape:max-h-[min(55dvh,200px)] flex-col rounded-xl sm:rounded-2xl border border-white/25 bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl ring-1 ring-white/25 overflow-hidden backdrop-blur-md">
              <div className="px-3 py-1.5 sm:px-3.5 sm:py-2 shrink-0">
                <p className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#f6c453]">
                  <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Locating Challenge · Question {quizStep + 1} of {BONES.length}
                </p>
                <h2 className="text-xs sm:text-sm font-black text-white leading-tight mt-0.5">
                  Click on Skeleton to identify{" "}
                  <span className="text-[#f6c453] underline decoration-[#f6c453]/60">
                    {currentTargetBone?.name}
                  </span>{" "}
                  bones
                </h2>
              </div>

              <div className="border-t border-white/15 bg-black/20 px-3 py-2 sm:px-3.5 sm:py-2.5 flex-1 overflow-y-auto overscroll-contain">
                <p className="text-[11px] sm:text-xs font-medium leading-relaxed text-white/90">
                  {currentTargetBone?.clue} Click directly on the 3D skeleton to select.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* PHASE 4: Lab Completion / Mastered Card (Docked Left on Desktop/Landscape, Labeled skeleton fully visible at Right) */}
      {phase === "complete" && (
        <div
          data-ui
          className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center sm:justify-start landscape:justify-start p-2.5 sm:p-4 md:p-6 overflow-y-auto pr-[max(0.75rem,env(safe-area-inset-right,0px))] pl-[max(0.75rem,env(safe-area-inset-left,0px))] sm:pl-8 md:pl-12 lg:pl-16 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
        >
          <div className="pointer-events-auto w-full max-w-[min(94vw,380px)] sm:max-w-[400px] max-h-[min(94dvh,520px)] flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary to-primary-dark border border-white/25 shadow-2xl text-white my-auto backdrop-blur-md animate-in slide-in-from-left-8 fade-in">
            <div className="p-3 sm:p-4 text-center text-white shrink-0">
              <span className="inline-block rounded-full bg-black/25 px-2.5 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#f6c453]">
                Practical Complete
              </span>
              <h2 className="mt-1 text-base sm:text-xl font-black">All 6 Regions Mastered!</h2>
              <p className="mt-0.5 text-[10px] sm:text-xs text-white/80">
                You successfully identified all girdles and limb bones of the human appendicular skeleton.
              </p>
            </div>

            <div className="border-t border-white/15 bg-black/20 p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 overflow-y-auto overscroll-contain">
              <div className="rounded-xl sm:rounded-2xl bg-black/30 p-2 sm:p-3 border border-white/10 text-xs">
                <p className="font-bold text-[#f6c453] uppercase tracking-wider text-[9px] sm:text-[10px]">Anatomy Summary</p>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:gap-2 text-white/90">
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 border border-white/10">
                    <p className="font-bold text-white text-[10px] sm:text-[11px]">Upper Limb & Girdle</p>
                    <p className="mt-0.5 text-[9px] sm:text-[10px] text-white/70 leading-tight">Pectoral Girdle, Humerus, Radius & Ulna</p>
                  </div>
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 border border-white/10">
                    <p className="font-bold text-white text-[10px] sm:text-[11px]">Lower Limb & Girdle</p>
                    <p className="mt-0.5 text-[9px] sm:text-[10px] text-white/70 leading-tight">Pelvic Girdle, Femur, Tibia & Fibula</p>
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

      {/* Quit Confirmation Modal */}
      {showQuit && (
        <div data-ui className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-2.5 sm:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-[24rem] max-h-[min(94dvh,450px)] flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary to-primary-dark border border-white/25 shadow-2xl text-white my-auto">
            <div className="p-3.5 sm:p-5 shrink-0">
              <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#f6c453]">Exit Lab</p>
              <h2 className="text-base sm:text-lg font-black leading-tight">Leave Practical?</h2>
              <p className="text-xs text-white/70">Human Appendicular Skeleton</p>
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
