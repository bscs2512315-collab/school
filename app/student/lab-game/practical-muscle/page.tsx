"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  RotateCcw,
  Play,
  LoaderCircle,
  Layers,
  X,
  ZoomIn,
} from "lucide-react";
import LogoutSVG from "@/public/svgs/LogoutSVG";
import type { MicroscopeSlidePart } from "../_practical/MicroscopeLabScene";
import PracticalIntro from "../_practical/PracticalIntro";
import { playGameCorrectSound, playGameWrongSound } from "@/app/student/lab-game/_scene/labAudio";

const MicroscopeLabScene = dynamic(() => import("../_practical/MicroscopeLabScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#f4f7f5] text-sm font-semibold text-slate-600">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-slate-300 border-t-primary" />
        <span>Loading 3D Microscope Lab & Muscle Slide…</span>
      </div>
    </div>
  ),
});

export type MuscleType = "skeletal" | "smooth" | "cardiac";

// 1. Skeletal Muscle (Striated & Voluntary)
const SKELETAL_PARTS: MicroscopeSlidePart[] = [
  {
    id: "fibre_sk",
    index: 1,
    name: "Muscle fibre",
    clue: "Find the long, cylindrical unbranched muscle fibre bundle running horizontally.",
    description:
      "A long, cylindrical unbranched muscle cell (myocyte) containing numerous parallel myofibrils. In skeletal muscle, fibres are bundled together in parallel arrays.",
    x: 150,
    y: 150,
    lx: 228,
    ly: 150,
  },
  {
    id: "striation_sk",
    index: 2,
    name: "Cross striations",
    clue: "Look for the alternating dark and light transverse bands repeating along each fibre.",
    description:
      "Regular transverse cross-striations caused by the alternating arrangement of thick myosin filaments (dark A-bands) and thin actin filaments (light I-bands) in sarcomeres.",
    x: 105,
    y: 190,
    lx: 68,
    ly: 215,
  },
  {
    id: "nucleus_sk",
    index: 3,
    name: "Peripheral nucleus",
    clue: "Find the elongated flat nucleus pushed against the outer edge beneath the sarcolemma.",
    description:
      "Multiple elongated nuclei located peripherally right beneath the plasma membrane (sarcolemma), formed by the fusion of individual myoblasts during embryogenesis.",
    x: 82,
    y: 42,
    lx: 68,
    ly: 48,
  },
  {
    id: "sarcolemma_sk",
    index: 4,
    name: "Sarcolemma",
    clue: "Locate the thin boundary membrane enclosing each individual muscle fibre.",
    description:
      "The specialized excitable plasma membrane that surrounds each striated muscle fibre, propagating action potentials into T-tubules to trigger contraction.",
    x: 210,
    y: 113,
    lx: 232,
    ly: 60,
  },
];

// 2. Smooth Muscle (Unstriated & Involuntary)
const SMOOTH_PARTS: MicroscopeSlidePart[] = [
  {
    id: "cell_sm",
    index: 1,
    name: "Spindle-shaped cell",
    clue: "Look for an elongated cell with a thick central belly and tapering pointed ends.",
    description:
      "An individual smooth muscle myocyte showing a characteristic fusiform (spindle) shape. The thick central portion of one cell nests adjacent to the tapered end of another.",
    x: 150,
    y: 150,
    lx: 228,
    ly: 150,
  },
  {
    id: "nucleus_sm",
    index: 2,
    name: "Central nucleus",
    clue: "Find the single prominent oval nucleus located in the thickest middle part of the cell.",
    description:
      "Each smooth muscle cell contains a single elongated, cigar-shaped nucleus positioned centrally in the widest zone of the cytoplasm.",
    x: 184,
    y: 60,
    lx: 68,
    ly: 50,
  },
  {
    id: "sarcoplasm_sm",
    index: 3,
    name: "Smooth sarcoplasm",
    clue: "Observe the uniform, non-striated cytoplasm lacking transverse stripes.",
    description:
      "The homogeneous cytoplasm of smooth muscle cells. Myofilaments are dispersed in a lattice-like meshwork rather than regular sarcomeres, so cross-striations are absent.",
    x: 75,
    y: 220,
    lx: 68,
    ly: 215,
  },
];

// 3. Cardiac Muscle (Branched, Involuntary, Striated)
const CARDIAC_PARTS: MicroscopeSlidePart[] = [
  {
    id: "fibre_ca",
    index: 1,
    name: "Branching fibre",
    clue: "Find the interconnected, bifurcating muscle fibres forming a branching network.",
    description:
      "Cylindrical cardiac muscle fibres that split and rejoin to form an interconnected, anastomosing 3D syncytial network capable of coordinated rhythmic contraction.",
    x: 150,
    y: 120,
    lx: 228,
    ly: 120,
  },
  {
    id: "disc_ca",
    index: 2,
    name: "Intercalated disc",
    clue: "Look for the prominent dark transverse junction line where two cardiac cells meet end-to-end.",
    description:
      "Specialized cell-to-cell junctional complexes containing desmosomes (mechanical adhesion) and gap junctions (electrical ion coupling) allowing rapid action potential spread.",
    x: 166,
    y: 112,
    lx: 232,
    ly: 55,
  },
  {
    id: "nucleus_ca",
    index: 3,
    name: "Central nucleus",
    clue: "Locate the single, oval nucleus situated right in the center of the cardiac cell.",
    description:
      "Cardiomyocytes typically possess a single (rarely dual) centrally located oval or quadrangular nucleus surrounded by glycogen-rich perinuclear sarcoplasm.",
    x: 95,
    y: 150,
    lx: 68,
    ly: 150,
  },
  {
    id: "striation_ca",
    index: 4,
    name: "Faint striations",
    clue: "Observe the subtle cross-striations running transversely through the branched fibres.",
    description:
      "Transverse striations formed by repeating sarcomere units, similar to skeletal muscle but less rigidly packed due to branching and abundant mitochondria.",
    x: 215,
    y: 180,
    lx: 228,
    ly: 215,
  },
];

type AppPhase = "intro" | "tour" | "quiz" | "complete";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Microscope-style tissue images with subtle focus highlights for the guided tour.
function renderMuscleSlide(type: MuscleType, foundSet: Set<string>, activeId: string) {
  const suffix = type === "skeletal" ? "sk" : type === "smooth" ? "sm" : "ca";
  const highlighted = (id: string) => foundSet.has(`${id}_${suffix}`) || activeId === `${id}_${suffix}`;
  const gold = "#f6c453";
  const description = type === "skeletal"
    ? "Longitudinal skeletal muscle with cross striations and peripheral nuclei"
    : type === "smooth"
    ? "Smooth muscle with spindle-shaped cells and central nuclei"
    : "Branched cardiac muscle with central nuclei and intercalated discs";

  return (
    <svg viewBox="0 0 300 300" role="img" aria-label={description} className="absolute inset-0 h-full w-full">
      <image href={`/lab/muscle/${type}-micrograph.webp`} x="0" y="0" width="300" height="300" preserveAspectRatio="xMidYMid slice" />
      {type === "skeletal" && (
        <g fill="none" stroke={gold} strokeWidth="1.3" opacity=".82">
          {highlighted("fibre") && <rect x="24" y="135" width="252" height="31" rx="7" />}
          {highlighted("striation") && <rect x="80" y="175" width="52" height="30" rx="4" />}
          {highlighted("nucleus") && <ellipse cx="82" cy="42" rx="13" ry="5" />}
          {highlighted("sarcolemma") && <path d="M176 113 Q208 115 242 112" strokeWidth="2" />}
        </g>
      )}
      {type === "smooth" && (
        <g fill="none" stroke={gold} strokeWidth="1.3" opacity=".82">
          {highlighted("cell") && <path d="M91 153 Q127 139 158 146 Q187 151 209 163 Q164 168 125 161 Z" />}
          {highlighted("nucleus") && <ellipse cx="184" cy="60" rx="12" ry="4.5" />}
          {highlighted("sarcoplasm") && <ellipse cx="75" cy="220" rx="27" ry="7" transform="rotate(-12 75 220)" />}
        </g>
      )}
      {type === "cardiac" && (
        <g fill="none" stroke={gold} strokeWidth="1.3" opacity=".82">
          {highlighted("fibre") && <path d="M83 137 Q119 116 150 118 Q177 121 201 106" strokeWidth="2" />}
          {highlighted("disc") && <path d="M160 101 L166 111 L169 123" strokeWidth="2.2" />}
          {highlighted("nucleus") && <ellipse cx="95" cy="150" rx="8" ry="6" />}
          {highlighted("striation") && <rect x="193" y="164" width="42" height="30" rx="4" />}
        </g>
      )}
    </svg>
  );
}

export default function MuscleLabPage() {
  const [muscleType, setMuscleType] = useState<MuscleType>("skeletal");
  const [mag, setMag] = useState<number>(1);
  const [phase, setPhase] = useState<AppPhase>("intro");
  const [viewMode, setViewMode] = useState<"lab" | "eyepiece">("eyepiece");
  const [tourIndex, setTourIndex] = useState(1);

  // Active parts based on muscle type
  const activeParts =
    muscleType === "skeletal"
      ? SKELETAL_PARTS
      : muscleType === "smooth"
      ? SMOOTH_PARTS
      : CARDIAC_PARTS;

  // Locating game state (randomized)
  const [quizQueue, setQuizQueue] = useState<string[]>([]);
  const [quizStep, setQuizStep] = useState(0);
  const [foundParts, setFoundParts] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{
    type: "correct" | "wrong";
    title: string;
  } | null>(null);
  const wrongTimerRef = useRef<number | null>(null);

  // Quit modal
  const [showQuit, setShowQuit] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);

  const startQuiz = useCallback(() => {
    const shuffled = shuffle(activeParts.map((p) => p.id));
    setQuizQueue(shuffled);
    setQuizStep(0);
    setFoundParts(new Set());
    setFeedback(null);
    setViewMode("eyepiece");
    setPhase("quiz");
  }, [activeParts]);

  const switchType = (t: MuscleType) => {
    setMuscleType(t);
    setTourIndex(1);
    setFoundParts(new Set());
    setFeedback(null);
    if (phase === "quiz") {
      const parts =
        t === "skeletal"
          ? SKELETAL_PARTS
          : t === "smooth"
          ? SMOOTH_PARTS
          : CARDIAC_PARTS;
      setQuizQueue(shuffle(parts.map((p) => p.id)));
      setQuizStep(0);
    }
  };

  const handlePlayAgain = useCallback(() => {
    setTourIndex(1);
    setFoundParts(new Set());
    setFeedback(null);
    setMag(1);
    setPhase("intro");
  }, []);

  const currentTargetId = quizQueue[quizStep] || "";
  const currentTargetPart = useMemo(
    () => activeParts.find((p) => p.id === currentTargetId),
    [activeParts, currentTargetId]
  );

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

  const handlePick = useCallback(
    (id: string) => {
      if (phase !== "quiz" || !currentTargetPart) return;

      const clickedPart = activeParts.find((p) => p.id === id);
      if (!clickedPart) return;

      if (id === currentTargetId) {
        playGameCorrectSound();
        setFoundParts((prev) => new Set(prev).add(id));
        setFeedback({
          type: "correct",
          title: "Correct Choice! ✓",
        });

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
    [phase, currentTargetId, currentTargetPart, activeParts, quizStep, quizQueue.length, triggerConfetti]
  );

  const activeTourPart = activeParts[tourIndex - 1];

  const muscleTitle =
    muscleType === "skeletal"
      ? "Skeletal Muscle (Striated)"
      : muscleType === "smooth"
      ? "Smooth Muscle (Unstriated)"
      : "Cardiac Muscle (Heart)";

  return (
    <div className="fixed inset-0 h-[100dvh] w-full overflow-hidden bg-[#f4f7f5] select-none text-white font-sans">
      {/* 3D Microscope Lab & Eyepiece Scene */}
      <div className="absolute inset-0">
        <MicroscopeLabScene
          parts={activeParts}
          foundSet={foundParts}
          currentId={phase === "tour" ? activeTourPart?.id || "" : ""}
          isTourMode={phase === "tour"}
          activeTourIndex={tourIndex}
          isComplete={phase === "complete"}
          viewMode={viewMode}
          setViewMode={setViewMode}
          mag={mag}
          setMag={setMag}
          slideRenderer={(f, a) => renderMuscleSlide(muscleType, f, a)}
          onPick={handlePick}
          slideTitle={muscleTitle}
        />
      </div>

      {/* Top Bar with Muscle Type Selector & Lens Mag Badges placed towards left */}
      <div
        data-ui
        className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between p-2.5 sm:p-4 pt-[max(0.6rem,env(safe-area-inset-top,0px))] px-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))]"
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowQuit(true)}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white border border-white/15 transition hover:bg-neutral-900 active:scale-95 shadow-xl cursor-pointer shrink-0"
          >
            <LogoutSVG className="size-3.5 shrink-0 text-white" /> Exit Lab
          </button>

          {/* Both Badges placed right next to Exit Lab towards left */}
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
            {/* 1. Muscle Type Selector Pills */}
            <div className="flex items-center gap-1 rounded-full bg-black p-0.5 sm:p-1 border border-white/15 shadow-xl">
              {(["skeletal", "smooth", "cardiac"] as MuscleType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => switchType(t)}
                  className={`rounded-full px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-black transition capitalize cursor-pointer ${
                    muscleType === t ? "bg-[#f6c453] text-[#0f2e12] shadow" : "text-white/70 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* 2. Lens Mag Controls */}
            <div className="flex items-center gap-0.5 sm:gap-1 rounded-full bg-black p-0.5 sm:p-1 border border-white/15 shadow-xl">
              <ZoomIn size={12} className="text-white/60 ml-1.5 mr-0.5 hidden sm:inline" />
              {[1, 1.5, 2].map((m, i) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMag(m)}
                  className={`rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-black transition cursor-pointer ${
                    mag === m ? "bg-[#f6c453] text-[#0f2e12] shadow" : "text-white/70 hover:text-white"
                  }`}
                >
                  {["10×", "20×", "40×"][i]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <span className="pointer-events-auto rounded-full border border-amber-300/70 bg-[#3c301a]/90 px-3.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-100 shadow-md backdrop-blur-md">
          Biology · Class XII · Muscle Histology
        </span>
      </div>

      {/* PHASE 1: Pre-Practical Briefing Screen */}
      {phase === "intro" && (
        <PracticalIntro
          brief={{
            expNo: 4,
            title: "Microscopic Study of Muscle Tissue Types",
            object: "To distinguish and sketch permanent histological slides of striated (skeletal), unstriated (smooth), and cardiac muscle tissues under the compound microscope.",
            apparatus: activeParts.map((p) => p.name),
          }}
          subject="Biology"
          exitHref="/student/lab-game/biology"
          onStart={startQuiz}
          onSlide={(i) => {
            if (i >= 1) {
              setTourIndex(i);
              setViewMode("eyepiece");
              setPhase("tour");
            }
          }}
          apparatus={activeParts.map((p) => p.name)}
        />
      )}

      {/* PHASE 2: Guided Microscope Tour */}
      {phase === "tour" && (
        <div
          data-ui
          className="pointer-events-none absolute left-2.5 sm:left-4 bottom-2.5 sm:bottom-4 z-30 flex justify-start pb-[max(0.4rem,env(safe-area-inset-bottom,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))]"
        >
          <div className="pointer-events-auto flex w-[min(92vw,350px)] sm:w-[360px] landscape:w-[min(40vw,320px)] max-h-[min(48dvh,240px)] sm:max-h-[280px] landscape:max-h-[min(70dvh,260px)] flex-col rounded-xl sm:rounded-2xl border border-white/25 bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl ring-1 ring-white/25 overflow-hidden backdrop-blur-md">
            <div className="px-3 py-1.5 sm:px-3.5 sm:py-2.5 shrink-0">
              <p className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#f6c453]">
                <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Structure {tourIndex} of {activeParts.length}
              </p>
              <h2 className="text-xs sm:text-base font-black leading-tight text-white mt-0.5">
                {activeTourPart.name}
              </h2>
            </div>

            <div className="border-t border-white/15 bg-black/20 px-3 py-2 sm:px-3.5 sm:py-2.5 flex-1 overflow-y-auto overscroll-contain flex flex-col justify-between gap-2">
              <p className="text-[11px] sm:text-xs font-medium leading-relaxed text-white/95">
                {activeTourPart.description}
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
                      if (tourIndex < activeParts.length) {
                        setTourIndex((i) => i + 1);
                      } else {
                        startQuiz();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-[#f6c453] px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black text-[#0f2e12] shadow-md transition hover:bg-amber-300 active:scale-95 cursor-pointer"
                  >
                    {tourIndex < activeParts.length ? (
                      <>
                        Next Structure <ChevronRight size={13} />
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
          {/* Toast Notification at Left Side (Does NOT overlap center model) */}
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
                  <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Locating Challenge · Question {quizStep + 1} of {activeParts.length}
                </p>
                <h2 className="text-xs sm:text-sm font-black text-white leading-tight mt-0.5">
                  Where is the <span className="text-[#f6c453] underline decoration-[#f6c453]/60">{currentTargetPart?.name}</span>?
                </h2>
              </div>

              <div className="border-t border-white/15 bg-black/20 px-3 py-2 sm:px-3.5 sm:py-2.5 flex-1 overflow-y-auto overscroll-contain">
                <p className="text-[11px] sm:text-xs font-medium leading-relaxed text-white/90">
                  {currentTargetPart?.clue} Tap the structure directly on the muscle slide.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* PHASE 4: Completion Modal (Docked Left on Desktop/Landscape, Labeled muscle slide fully visible at Right) */}
      {phase === "complete" && (
        <div
          data-ui
          className="pointer-events-none absolute inset-0 z-40 flex items-end sm:items-center justify-center sm:justify-start landscape:justify-start p-2.5 sm:p-4 md:p-6 overflow-y-auto pr-[max(0.75rem,env(safe-area-inset-right,0px))] pl-[max(0.75rem,env(safe-area-inset-left,0px))] sm:pl-8 md:pl-12 lg:pl-16 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
        >
          <div className="pointer-events-auto w-full max-w-[min(94vw,380px)] sm:max-w-[420px] max-h-[min(94dvh,540px)] flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary to-primary-dark border border-white/25 shadow-2xl text-white my-auto backdrop-blur-md animate-in slide-in-from-left-8 fade-in">
            <div className="p-3 sm:p-4 text-center text-white shrink-0">
              <span className="inline-block rounded-full bg-black/25 px-2.5 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#f6c453]">
                Practical Complete
              </span>
              <h2 className="mt-1 text-base sm:text-xl font-black">{muscleTitle} Mastered!</h2>
              <p className="mt-0.5 text-[10px] sm:text-xs text-white/80">
                You successfully located all histological structures for this muscle slide.
              </p>
            </div>

            <div className="border-t border-white/15 bg-black/20 p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 overflow-y-auto overscroll-contain">
              <div className="rounded-xl sm:rounded-2xl bg-black/30 p-2 sm:p-3 border border-white/10 text-xs">
                <p className="font-bold text-[#f6c453] uppercase tracking-wider text-[9px] sm:text-[10px]">Histological Comparison</p>
                <div className="mt-1.5 grid grid-cols-3 gap-1 sm:gap-1.5 text-white/90">
                  <div className="p-1 sm:p-1.5 rounded-lg bg-white/5 border border-white/10 text-center">
                    <p className="font-bold text-white text-[9px] sm:text-[10px]">Skeletal</p>
                    <p className="mt-0.5 text-[8px] sm:text-[9px] text-white/70 leading-tight">Cylindrical, striated, peripheral multi-nuclei</p>
                  </div>
                  <div className="p-1 sm:p-1.5 rounded-lg bg-white/5 border border-white/10 text-center">
                    <p className="font-bold text-white text-[9px] sm:text-[10px]">Smooth</p>
                    <p className="mt-0.5 text-[8px] sm:text-[9px] text-white/70 leading-tight">Spindle-shaped, unstriated, single central nucleus</p>
                  </div>
                  <div className="p-1 sm:p-1.5 rounded-lg bg-white/5 border border-white/10 text-center">
                    <p className="font-bold text-white text-[9px] sm:text-[10px]">Cardiac</p>
                    <p className="mt-0.5 text-[8px] sm:text-[9px] text-white/70 leading-tight">Branched, intercalated discs, single central nucleus</p>
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
                <button
                  type="button"
                  onClick={() =>
                    switchType(
                      muscleType === "skeletal"
                        ? "smooth"
                        : muscleType === "smooth"
                        ? "cardiac"
                        : "skeletal"
                    )
                  }
                  className="inline-flex min-h-9 sm:min-h-10 items-center justify-center gap-1 rounded-xl border border-white/20 bg-white/10 px-2.5 text-[11px] sm:text-xs font-bold text-white transition hover:bg-white/20 text-center cursor-pointer"
                >
                  <Layers size={13} /> Switch Slide
                </button>
              </div>
              <div className="pt-0.5">
                <Link
                  href="/student/lab-game/biology"
                  className="inline-flex min-h-8 sm:min-h-9 w-full items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/5 px-2.5 text-[10px] sm:text-[11px] font-bold text-white/80 transition hover:bg-white/10 text-center"
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
              <p className="text-xs text-white/70">Muscle Tissue Histology</p>
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
