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
        <span>Loading 3D Microscope Lab & Chick Slide…</span>
      </div>
    </div>
  ),
});

// 48-Hour Chick Embryo Parts
const CHICK_48_PARTS: MicroscopeSlidePart[] = [
  {
    id: "brain_48",
    name: "Brain vesicles",
    index: 1,
    clue: "Look for the enlarged three-part cephalic brain vesicles at the head end.",
    description: "The primary brain vesicles (prosencephalon, mesencephalon, and rhombencephalon) developing at the anterior cranial region.",
    x: 94,
    y: 71,
    lx: 68,
    ly: 50,
  },
  {
    id: "eye_48",
    name: "Optic vesicle",
    index: 2,
    clue: "Find the lateral bulge forming the primitive eye vesicle beside the forebrain.",
    description: "The lateral evagination of the forebrain that will give rise to the retina and optic nerve.",
    x: 79,
    y: 97,
    lx: 58,
    ly: 105,
  },
  {
    id: "heart_48",
    name: "Looping heart",
    index: 3,
    clue: "Look for the tubular, S-shaped looping heart protruding toward the right.",
    description: "The tubular heart begins contracting and bending into an S-shaped loop (dextral looping), initiating blood circulation.",
    x: 151,
    y: 127,
    lx: 230,
    ly: 90,
  },
  {
    id: "somites_48",
    name: "Somites",
    index: 4,
    clue: "Find the paired blocks of paraxial mesoderm flanking the neural tube.",
    description: "Paired segment blocks (approx. 24-28 pairs) that differentiate into vertebrae, axial muscles, and dorsal dermis.",
    x: 169,
    y: 196,
    lx: 228,
    ly: 215,
  },
  {
    id: "tube_48",
    name: "Neural tube",
    index: 5,
    clue: "The long central neural canal extending through the embryo axis.",
    description: "The closed neuroectodermal tube that develops into the spinal cord.",
    x: 143,
    y: 180,
    lx: 68,
    ly: 210,
  },
];

// 72-Hour Chick Embryo Parts
const CHICK_72_PARTS: MicroscopeSlidePart[] = [
  {
    id: "brain_72",
    name: "Enlarged brain",
    index: 1,
    clue: "The prominent 5-vesicle brain with pronounced cranial and cervical flexures.",
    description: "Subdivided into 5 secondary vesicles with pronounced cranial, cervical, and pontine flexures causing the embryo to curl.",
    x: 101,
    y: 70,
    lx: 68,
    ly: 50,
  },
  {
    id: "eye_72",
    name: "Eye and lens",
    index: 2,
    clue: "The double-walled optic cup with an invaginated lens vesicle inside.",
    description: "The double-layered optic cup with an invaginated ectodermal lens vesicle and pigmented retinal layer.",
    x: 77,
    y: 94,
    lx: 58,
    ly: 100,
  },
  {
    id: "heart_72",
    name: "Curved heart",
    index: 3,
    clue: "The large, four-chambered embryonic heart with distinct atrium and ventricle.",
    description: "Advanced cardiac looping showing distinct atrial and ventricular chambers establishing active vitelline circulation.",
    x: 154,
    y: 136,
    lx: 230,
    ly: 90,
  },
  {
    id: "wing_72",
    name: "Wing bud",
    index: 4,
    clue: "The anterior lateral ectodermal swelling for the future wing.",
    description: "The anterior limb bud formed by somatic mesoderm and apical ectodermal ridge (AER), destined to form the wing.",
    x: 205,
    y: 172,
    lx: 235,
    ly: 155,
  },
  {
    id: "leg_72",
    name: "Leg bud",
    index: 5,
    clue: "The posterior lateral swelling for the future hindlimb.",
    description: "The posterior limb bud developing opposite the lower somites to form the leg.",
    x: 205,
    y: 224,
    lx: 228,
    ly: 215,
  },
  {
    id: "tail_72",
    name: "Tail bud",
    index: 6,
    clue: "The tapered caudal extremity extending past the hindlimb level.",
    description: "The curved caudal tail bud marking the posterior termination of the embryo.",
    x: 173,
    y: 258,
    lx: 78,
    ly: 230,
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

const ShellBackground = ({ stage }: { stage: 48 | 72 }) => (
  <g>
    <defs>
      <radialGradient id={`yolk-${stage}`}><stop stopColor="#fffaf0" /><stop offset=".7" stopColor="#f5e6cb" /><stop offset="1" stopColor="#e5cfac" /></radialGradient>
      <linearGradient id={`embryo-${stage}`} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#fff1d7" /><stop offset=".55" stopColor="#efcfae" /><stop offset="1" stopColor="#c99c7c" /></linearGradient>
    </defs>
    <circle cx="150" cy="150" r="150" fill={`url(#yolk-${stage})`} />
    <circle cx="150" cy="150" r="126" fill="none" stroke="#dfc6aa" strokeWidth="8" opacity=".43" />
    <g fill="none" stroke="#ca8b84" strokeLinecap="round" opacity=".7">
      <path d="M140 118 Q103 124 78 165 Q57 200 50 249 M145 124 Q190 127 230 172 Q252 205 259 249" strokeWidth="3" />
      <path d="M116 136 Q72 130 43 158 M106 158 Q71 172 36 204 M90 183 Q65 218 63 270 M176 136 Q218 127 259 145 M201 154 Q237 172 268 203 M220 184 Q249 217 250 273" strokeWidth="1.7" />
    </g>
  </g>
);

function renderChickSlide(stage: 48 | 72, foundSet: Set<string>, activeId: string) {
  const HL = "#f6c453";
  const has = (id: string) => foundSet.has(`${id}_${stage}`) || activeId === `${id}_${stage}`;

  if (stage === 48) {
    return (
      <svg viewBox="0 0 300 300" role="img" aria-label="48-hour chick embryo slide" className="absolute inset-0 h-full w-full">
        <ShellBackground stage={48} />
        <path d="M115 47 Q143 49 145 82 Q145 109 126 118 Q105 127 111 152 Q116 172 148 177 Q181 183 191 212 Q198 235 194 260 Q177 247 178 228 Q172 208 147 205 Q104 199 93 165 Q87 143 104 120 Q67 117 62 92 Q56 62 84 47 Q99 40 115 47Z" fill="url(#embryo-48)" stroke="#b98c75" strokeWidth="2.5" />
        <path d="M112 52 Q135 68 124 93 Q115 111 105 124 Q93 150 115 168 Q139 184 164 189 Q189 204 188 245" fill="none" stroke={has("tube") ? HL : "#ce9e95"} strokeWidth="8" strokeLinecap="round" opacity=".85" />
        <path d="M111 53 Q133 69 122 91 M104 123 Q91 145 114 167" fill="none" stroke="#fff0dd" strokeWidth="3" strokeLinecap="round" />
        <path d="M69 68 Q81 42 107 49 Q128 56 123 79 Q119 101 99 106 Q76 108 66 88Z" fill="url(#embryo-48)" stroke={has("brain") ? HL : "#b98c75"} strokeWidth="2.5" />
        <path d="M106 49 Q116 37 130 46 Q142 54 138 72" fill="none" stroke="#bc917a" strokeWidth="2" />
        <ellipse cx="79" cy="97" rx="11" ry="13" fill="#e8c0a8" stroke={has("eye") ? HL : "#ad806f"} strokeWidth="2.8" />
        <ellipse cx="80" cy="98" rx="5" ry="6" fill="#8b6858" opacity=".8" />
        <path d="M134 112 Q155 102 163 119 Q169 132 152 145 Q135 153 127 139 Q124 126 134 112Z" fill="#c77873" stroke={has("heart") ? HL : "#9f5c59"} strokeWidth="3" />
        <path d="M144 114 Q155 118 151 129 Q145 138 135 139" fill="none" stroke="#f4c0aa" strokeWidth="3" />
        {Array.from({ length: 9 }, (_, i) => {
          const x = 139 + i * 5.8, y = 180 + i * 6.3;
          return <path key={i} d={`M${x - 8} ${y - 5} q-5 5 0 10 l10 3 q4-4 1-9Z`} fill="#dfad8e" stroke={has("somites") ? HL : "#b7896e"} strokeWidth="1.5" />;
        })}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 300 300" role="img" aria-label="72-hour chick embryo slide" className="absolute inset-0 h-full w-full">
      <ShellBackground stage={72} />
      <path d="M121 43 Q151 46 156 74 Q156 95 139 112 Q117 136 129 154 Q145 170 174 173 Q206 181 215 210 Q222 240 181 267 Q162 274 160 261 Q181 239 184 220 Q182 206 155 202 Q106 195 92 159 Q81 132 102 112 Q59 111 57 81 Q57 53 83 44 Q104 38 121 43Z" fill="url(#embryo-72)" stroke="#b98c75" strokeWidth="2.5" />
      <path d="M115 49 Q139 64 129 91 Q119 110 108 127 Q98 150 124 170 Q147 187 174 189 Q202 201 198 228 Q191 246 173 259" fill="none" stroke="#cb9b90" strokeWidth="8" strokeLinecap="round" />
      <path d="M67 65 Q83 38 108 45 Q128 49 129 72 Q130 95 107 109 Q78 112 63 93Z" fill="url(#embryo-72)" stroke={has("brain") ? HL : "#b88b74"} strokeWidth="3" />
      <path d="M110 43 Q125 31 139 47 Q151 58 145 74" fill="none" stroke="#ae806e" strokeWidth="2" />
      <ellipse cx="78" cy="94" rx="13" ry="14" fill="#c69680" stroke={has("eye") ? HL : "#9a6d60"} strokeWidth="3" /><ellipse cx="78" cy="94" rx="7" ry="8" fill="#7d6257" /><circle cx="75" cy="91" r="2.5" fill="#f6e8d4" />
      <path d="M137 116 Q154 108 164 120 Q177 135 156 144 Q143 149 154 160" fill="none" stroke={has("heart") ? HL : "#bd6e69"} strokeWidth="12" strokeLinecap="round" /><path d="M139 117 Q153 116 158 128" fill="none" stroke="#efa9a0" strokeWidth="3" />
      {Array.from({ length: 12 }, (_, i) => {
        const x = 136 + i * 4.6, y = 174 + i * 4.6;
        return <path key={i} d={`M${x - 8} ${y - 4} q-4 4 0 9 l8 3 q4-5 1-9Z`} fill="#dfa987" stroke="#ae7e68" strokeWidth="1.2" />;
      })}
      <path d="M186 161 Q211 155 220 170 Q220 186 196 188 Q185 180 186 161Z" fill="url(#embryo-72)" stroke={has("wing") ? HL : "#b48771"} strokeWidth="3" />
      <path d="M192 216 Q215 204 226 218 Q230 231 208 239 Q194 236 192 216Z" fill="url(#embryo-72)" stroke={has("leg") ? HL : "#b48771"} strokeWidth="3" />
      <path d="M162 257 Q174 254 181 263 Q176 279 163 272Z" fill="url(#embryo-72)" stroke={has("tail") ? HL : "#b48771"} strokeWidth="3" />
    </svg>
  );
}

export default function ChickLabPage() {
  const [stage, setStage] = useState<48 | 72>(48);
  const [mag, setMag] = useState<number>(1);
  const [phase, setPhase] = useState<AppPhase>("intro");
  const [viewMode, setViewMode] = useState<"lab" | "eyepiece">("eyepiece");
  const [tourIndex, setTourIndex] = useState(1);

  // Active parts based on stage
  const activeParts = stage === 48 ? CHICK_48_PARTS : CHICK_72_PARTS;

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

  const handlePlayAgain = useCallback(() => {
    if (wrongTimerRef.current !== null) window.clearTimeout(wrongTimerRef.current);
    setTourIndex(1);
    setFoundParts(new Set());
    setFeedback(null);
    setMag(1);
    setPhase("intro");
  }, []);

  const switchStage = (s: 48 | 72) => {
    setStage(s);
    setTourIndex(1);
    setFoundParts(new Set());
    setFeedback(null);
    if (phase === "quiz") {
      const parts = s === 48 ? CHICK_48_PARTS : CHICK_72_PARTS;
      setQuizQueue(shuffle(parts.map((p) => p.id)));
      setQuizStep(0);
    }
  };

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
          slideRenderer={(f, a) => renderChickSlide(stage, f, a)}
          onPick={handlePick}
          slideTitle={`Chick Embryo (${stage}h)`}
        />
      </div>

      {/* Top Bar with Stage Selector & Lens Mag Badges placed towards left */}
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

          {/* Both Badges at Top placed right next to Exit Lab */}
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
            {/* 1. Stage Selector Pills */}
            <div className="flex items-center gap-1 rounded-full bg-black p-0.5 sm:p-1 border border-white/15 shadow-xl">
              <button
                type="button"
                onClick={() => switchStage(48)}
                className={`rounded-full px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-black transition cursor-pointer ${
                  stage === 48 ? "bg-[#f6c453] text-[#0f2e12] shadow" : "text-white/70 hover:text-white"
                }`}
              >
                48h Stage
              </button>
              <button
                type="button"
                onClick={() => switchStage(72)}
                className={`rounded-full px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-black transition cursor-pointer ${
                  stage === 72 ? "bg-[#f6c453] text-[#0f2e12] shadow" : "text-white/70 hover:text-white"
                }`}
              >
                72h Stage
              </button>
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
          Biology · Class XII · Chick Embryo
        </span>
      </div>

      {/* PHASE 1: Pre-Practical Briefing Screen (Matches Chemistry & Physics page UI standard) */}
      {phase === "intro" && (
        <PracticalIntro
          brief={{
            expNo: 7,
            title: "Chick Embryo Development",
            object: "To examine permanent whole mounts of chick embryos at 48 hours and 72 hours of incubation, distinguishing the emergence of brain vesicles, optic cups, heart looping, somites, and limb buds.",
            apparatus: (stage === 48 ? CHICK_48_PARTS : CHICK_72_PARTS).map((p) => p.name),
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
          apparatus={(stage === 48 ? CHICK_48_PARTS : CHICK_72_PARTS).map((p) => p.name)}
        />
      )}

      {/* PHASE 2: Microscope Embryo Tour */}
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
                  {currentTargetPart?.clue} Tap the structure directly on the chick embryo slide.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* PHASE 4: Completion Modal (Docked Left on Desktop/Landscape, Labeled chick embryo slide fully visible at Right) */}
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
              <h2 className="mt-1 text-base sm:text-xl font-black">Chick Embryo Stage Mastered!</h2>
              <p className="mt-0.5 text-[10px] sm:text-xs text-white/80">
                You successfully located all embryonic organ primordia for the {stage}-hour chick embryo.
              </p>
            </div>

            <div className="border-t border-white/15 bg-black/20 p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 overflow-y-auto overscroll-contain">
              <div className="rounded-xl sm:rounded-2xl bg-black/30 p-2 sm:p-3 border border-white/10 text-xs">
                <p className="font-bold text-[#f6c453] uppercase tracking-wider text-[9px] sm:text-[10px]">Developmental Comparison</p>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:gap-2 text-white/90">
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 border border-white/10">
                    <p className="font-bold text-white text-[10px] sm:text-[11px]">48-Hour Features</p>
                    <p className="mt-0.5 text-[9px] sm:text-[10px] text-white/70 leading-tight">Cranial flexure, heart looping, 24+ somites</p>
                  </div>
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 border border-white/10">
                    <p className="font-bold text-white text-[10px] sm:text-[11px]">72-Hour Features</p>
                    <p className="mt-0.5 text-[9px] sm:text-[10px] text-white/70 leading-tight">Optic cup + lens, wing & leg buds</p>
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
                  onClick={() => switchStage(stage === 48 ? 72 : 48)}
                  className="inline-flex min-h-9 sm:min-h-10 items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-2.5 text-[11px] sm:text-xs font-bold text-white transition hover:bg-white/20 text-center cursor-pointer"
                >
                  <Layers size={13} /> Switch to {stage === 48 ? "72h" : "48h"}
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
              <p className="text-xs text-white/70">Chick Embryo Development</p>
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
