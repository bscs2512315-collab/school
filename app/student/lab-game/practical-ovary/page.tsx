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
        <span>Loading 3D Virtual Lab & Microscope…</span>
      </div>
    </div>
  ),
});

// Mammalian Ovary Histology Structures
const OVARY_PARTS: MicroscopeSlidePart[] = [
  {
    id: "primary",
    index: 1,
    name: "Primary follicle",
    clue: "Look for the small early follicle near the outer edge with a single cell layer.",
    description:
      "An early growing follicle. A simple cuboidal layer of granulosa cells surrounds the immature primary oocyte.",
    x: 67,
    y: 72,
    lx: 72,
    ly: 46,
  },
  {
    id: "secondary",
    index: 2,
    name: "Secondary follicle",
    clue: "Find the medium-sized circle with several stratified granulosa layers and fluid spaces.",
    description:
      "The growing follicle. Follicular cells proliferate into stratified layers, and small fluid-filled cavities (vesicles) begin to coalesce.",
    x: 158,
    y: 82,
    lx: 232,
    ly: 58,
  },
  {
    id: "graafian",
    index: 3,
    name: "Graafian follicle",
    clue: "The largest, fully mature follicle dominating the ovary section, ready for ovulation.",
    description:
      "The mature tertiary (Graafian) follicle. It contains a massive fluid-filled antrum, thick theca layers, and an oocyte perched on the cumulus oophorus.",
    x: 170,
    y: 259,
    lx: 78,
    ly: 228,
  },
  {
    id: "oocyte",
    index: 4,
    name: "Oocyte (egg cell)",
    clue: "The developing female gamete held within the cumulus oophorus near the follicle wall.",
    description:
      "The primary oocyte with a distinct nucleus. It is supported by the corona radiata and held near the follicular wall ready to be released during ovulation.",
    x: 191,
    y: 227,
    lx: 230,
    ly: 228,
  },
  {
    id: "antrum",
    index: 5,
    name: "Antrum",
    clue: "The broad, crescent-shaped fluid cavity inside the Graafian follicle.",
    description:
      "The follicular antrum is a large cavity filled with liquor folliculi (estrogens, electrolytes, and nutrients secreted by the granulosa cells).",
    x: 243,
    y: 183,
    lx: 242,
    ly: 155,
  },
];

function CellRing({
  cx,
  cy,
  radius,
  count,
  size = 3,
}: {
  cx: number;
  cy: number;
  radius: number;
  count: number;
  size?: number;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const angle = ((index + (index % 3) * 0.12) / count) * Math.PI * 2;
        const irregularRadius = radius + ((index * 7) % 5) - 2;
        const x = Number((cx + Math.cos(angle) * irregularRadius).toFixed(3));
        const y = Number((cy + Math.sin(angle) * irregularRadius).toFixed(3));
        return (
          <ellipse
            key={index}
            cx={x}
            cy={y}
            rx={size * (index % 4 === 0 ? 1.25 : 0.82)}
            ry={size * (index % 5 === 0 ? 0.7 : 1.15)}
            transform={`rotate(${(index * 41) % 180} ${x} ${y})`}
            fill={index % 4 === 0 ? "#B66B8D" : "#D58BA7"}
            opacity=".8"
          />
        );
      })}
    </>
  );
}

function renderOvarySlide(foundSet: Set<string>, activeId: string) {
  const isTarget = (id: string) => foundSet.has(id) || activeId === id;
  const HL = "#f6c453";

  return (
    <svg
      viewBox="0 0 300 300"
      role="img"
      aria-label="Mammalian ovary histology slide"
      className="absolute inset-0 h-full w-full"
    >
      <defs>
        <radialGradient id="ovary-tissue">
          <stop stopColor="#FFF4F3" />
          <stop offset=".72" stopColor="#F4DCE2" />
          <stop offset="1" stopColor="#EBCDD8" />
        </radialGradient>
        <radialGradient id="ovary-antrum">
          <stop stopColor="#F8FCFC" />
          <stop offset="1" stopColor="#C9DFE8" />
        </radialGradient>
        <radialGradient id="ovary-oocyte">
          <stop stopColor="#FFE3BB" />
          <stop offset="1" stopColor="#E6B488" />
        </radialGradient>
      </defs>
      <rect width="300" height="300" fill="url(#ovary-tissue)" />
      <path
        d="M-12 159 C54 132 66 188 113 166 S181 120 217 142 S270 160 316 128 M-10 247 C64 219 87 257 129 239 S196 267 246 244 S286 230 318 249"
        fill="none"
        stroke="#DAAAB9"
        strokeWidth="13"
        opacity=".2"
      />
      <path
        d="M-12 168 C58 141 66 193 116 174 S181 129 220 151 S275 169 317 139 M-9 254 C58 228 84 265 129 247 S190 274 244 252"
        fill="none"
        stroke="#B57E9B"
        strokeWidth="1.5"
        opacity=".28"
      />

      {/* Stroma cells */}
      {Array.from({ length: 110 }, (_, index) => {
        const x = (index * 97 + 11) % 300;
        const y = (index * 59 + 31) % 300;
        return (
          <ellipse
            key={index}
            cx={x}
            cy={y}
            rx={index % 7 === 0 ? 3 : 1.8}
            ry={index % 5 === 0 ? 1.1 : 0.75}
            transform={`rotate(${(index * 37) % 180} ${x} ${y})`}
            fill={index % 6 === 0 ? "#A86F8E" : "#C58CA5"}
            opacity={index % 5 === 0 ? 0.28 : 0.38}
          />
        );
      })}

      {/* 1. Primary follicle */}
      <path
        d="M39 72 C38 53 52 42 68 43 C84 42 95 54 95 71 C97 89 86 100 68 101 C50 102 38 91 39 72 Z"
        fill="#F6D7DC"
        stroke={isTarget("primary") ? HL : "#A9748C"}
        strokeWidth={isTarget("primary") ? 3.5 : 2}
      />
      <path
        d="M45 68 C46 52 58 47 70 48 C85 49 90 58 89 73 C89 88 79 95 67 95 C52 95 44 84 45 68 Z"
        fill="#E9B5C7"
        stroke="#C68DA4"
        strokeWidth="1.5"
      />
      <CellRing cx={67} cy={72} radius={19} count={17} size={3.1} />
      <circle cx={67} cy={72} r="11" fill="url(#ovary-oocyte)" stroke="#EFD9D4" strokeWidth="3" />
      <ellipse cx={69} cy={72} rx="4.5" ry="3.8" fill="#815376" />

      {/* 2. Secondary follicle */}
      <path
        d="M118 81 C116 56 134 41 158 40 C184 38 198 55 199 81 C201 105 185 123 159 124 C135 123 117 107 118 81 Z"
        fill="#E8BDD0"
        stroke={isTarget("secondary") ? HL : "#9F6A83"}
        strokeWidth={isTarget("secondary") ? 3.5 : 2.5}
      />
      <path
        d="M124 81 C123 60 137 47 158 46 C181 45 193 61 193 81 C194 103 180 117 159 118 C138 116 124 102 124 81 Z"
        fill="#F2CFDA"
        stroke="#BF8DA3"
        strokeWidth="1.5"
      />
      <CellRing cx={158} cy={82} radius={32} count={23} size={3.1} />
      <CellRing cx={158} cy={82} radius={25} count={20} size={2.9} />
      <path
        d="M171 89 Q180 86 182 96 Q177 103 170 99 Z M135 89 Q127 84 131 78 Q137 76 140 83 Z"
        fill="#D9EAF0"
        opacity=".95"
      />
      <circle cx={158} cy={82} r="13" fill="url(#ovary-oocyte)" stroke="#F8E6D9" strokeWidth="3" />
      <ellipse cx={159} cy={82} rx="5" ry="4" fill="#815376" />

      {/* 3. Mature Graafian follicle */}
      <path
        d="M131 207 C131 168 154 141 189 135 C224 126 256 143 271 174 C286 201 280 241 255 265 C232 288 190 284 160 270 C140 257 130 234 131 207 Z"
        fill="#EABCCB"
        stroke={isTarget("graafian") ? HL : "#94647F"}
        strokeWidth={isTarget("graafian") ? 3.5 : 3}
      />
      <path
        d="M138 206 C140 171 159 145 192 141 C228 137 252 151 266 178 C277 204 273 236 250 259 C226 279 191 277 163 263 C145 251 137 232 138 206 Z"
        fill="#F1CBD6"
        stroke="#BC819C"
        strokeWidth="1.5"
      />
      <CellRing cx={205} cy={207} radius={66} count={34} size={3.1} />
      <CellRing cx={205} cy={207} radius={58} count={31} size={2.7} />

      {/* 5. Antrum */}
      <path
        d="M196 153 C223 141 251 153 264 180 C274 199 262 226 245 240 C226 255 209 244 190 235 C176 228 180 205 178 190 C177 174 184 160 196 153 Z"
        fill="url(#ovary-antrum)"
        stroke={isTarget("antrum") ? "#38bdf8" : "#B5D0DE"}
        strokeWidth={isTarget("antrum") ? 3 : 1.6}
      />

      {/* Cumulus oophorus and 4. Oocyte */}
      <path
        d="M167 232 C169 210 181 207 198 209 M170 239 Q174 246 184 244"
        fill="none"
        stroke="#DCA1B4"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <CellRing cx={191} cy={227} radius={24} count={16} size={3.5} />
      <circle
        cx={191}
        cy={227}
        r="18"
        fill="url(#ovary-oocyte)"
        stroke={isTarget("oocyte") ? HL : "#F9E8D3"}
        strokeWidth={isTarget("oocyte") ? 3.5 : 3}
      />
      <circle cx={192} cy={227} r="6" fill="#805272" opacity=".88" />
    </svg>
  );
}

type AppPhase = "intro" | "tour" | "quiz" | "complete";

function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function OvaryLabPage() {
  const [mag, setMag] = useState<number>(1);
  const [phase, setPhase] = useState<AppPhase>("intro");
  const [viewMode, setViewMode] = useState<"lab" | "eyepiece">("eyepiece");
  const [tourIndex, setTourIndex] = useState(1);

  // Locating challenge state (randomized)
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
    const shuffled = shuffle(OVARY_PARTS.map((p: MicroscopeSlidePart) => p.id));
    setQuizQueue(shuffled);
    setQuizStep(0);
    setFoundParts(new Set());
    setFeedback(null);
    setViewMode("eyepiece");
    setPhase("quiz");
  }, []);

  const handlePlayAgain = useCallback(() => {
    if (wrongTimerRef.current !== null) window.clearTimeout(wrongTimerRef.current);
    setTourIndex(1);
    setQuizStep(0);
    setFoundParts(new Set());
    setFeedback(null);
    setMag(1);
    setPhase("intro");
  }, []);

  const currentTargetId = quizQueue[quizStep] || "";
  const currentTargetPart = useMemo(
    () => OVARY_PARTS.find((p: MicroscopeSlidePart) => p.id === currentTargetId),
    [currentTargetId]
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

      const clickedPart = OVARY_PARTS.find((p: MicroscopeSlidePart) => p.id === id);
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

        if (wrongTimerRef.current) window.clearTimeout(wrongTimerRef.current);
        wrongTimerRef.current = window.setTimeout(() => {
          setFeedback(null);
        }, 2500);
      }
    },
    [phase, currentTargetId, currentTargetPart, quizStep, quizQueue.length, triggerConfetti]
  );

  const activeTourPart = OVARY_PARTS[tourIndex - 1];

  return (
    <div className="fixed inset-0 h-[100dvh] w-full overflow-hidden bg-[#f4f7f5] select-none text-white font-sans">
      {/* 3D Microscope Lab & Eyepiece Scene */}
      <div className="absolute inset-0">
        <MicroscopeLabScene
          parts={OVARY_PARTS}
          foundSet={foundParts}
          currentId={phase === "tour" ? activeTourPart?.id || "" : ""}
          isTourMode={phase === "tour"}
          activeTourIndex={tourIndex}
          isComplete={phase === "complete"}
          viewMode={viewMode}
          setViewMode={setViewMode}
          mag={mag}
          setMag={setMag}
          slideRenderer={(f, a) => renderOvarySlide(f, a)}
          onPick={handlePick}
          slideTitle="Mammalian Ovary (T.S.)"
        />
      </div>

      {/* Top Navigation Bar with Controls towards left */}
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

          {/* Lens Mag Controls on Top Bar placed right next to Exit Lab */}
          <div className="pointer-events-auto flex items-center gap-0.5 sm:gap-1 rounded-full bg-black p-0.5 sm:p-1 border border-white/15 shadow-xl">
            <ZoomIn size={12} className="text-white/60 ml-1.5 mr-0.5 hidden sm:inline" />
            {[1, 1.5, 2].map((m, i) => (
              <button
                key={m}
                type="button"
                onClick={() => setMag(m)}
                className={`rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-black transition cursor-pointer ${
                  mag === m ? "bg-[#f6c453] text-[#0f2e12] shadow" : "text-white/70 hover:text-white"
                }`}
              >
                {["10×", "20×", "40×"][i]}
              </button>
            ))}
          </div>
        </div>

        <span className="pointer-events-auto rounded-full border border-amber-300/70 bg-[#3c301a]/90 px-3.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-100 shadow-md backdrop-blur-md">
          Biology · Class XII · Ovary Histology
        </span>
      </div>

      {/* PHASE 1: Pre-Practical Briefing Screen (Matches Chemistry & Physics page UI standard) */}
      {phase === "intro" && (
        <PracticalIntro
          brief={{
            expNo: 6,
            title: "Mammalian Ovary Histology",
            object: "To distinguish and examine permanent stained histological slides of mammalian ovary, identifying the progressive development from primary follicle to mature Graafian follicle containing the oocyte and antrum.",
            apparatus: OVARY_PARTS.map((p) => p.name),
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
          apparatus={OVARY_PARTS.map((p) => p.name)}
        />
      )}

      {/* PHASE 2: Microscope Histology Tour */}
      {phase === "tour" && (
        <div
          data-ui
          className="pointer-events-none absolute left-2.5 sm:left-4 bottom-2.5 sm:bottom-4 z-30 flex justify-start pb-[max(0.4rem,env(safe-area-inset-bottom,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))]"
        >
          <div className="pointer-events-auto flex w-[min(92vw,350px)] sm:w-[360px] landscape:w-[min(40vw,320px)] max-h-[min(48dvh,240px)] sm:max-h-[280px] landscape:max-h-[min(70dvh,260px)] flex-col rounded-xl sm:rounded-2xl border border-white/25 bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl ring-1 ring-white/25 overflow-hidden backdrop-blur-md">
            <div className="px-3 py-1.5 sm:px-3.5 sm:py-2.5 shrink-0">
              <p className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#f6c453]">
                <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Structure {tourIndex} of {OVARY_PARTS.length}
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
                      if (tourIndex < OVARY_PARTS.length) {
                        setTourIndex((i) => i + 1);
                      } else {
                        startQuiz();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-[#f6c453] px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black text-[#0f2e12] shadow-md transition hover:bg-amber-300 active:scale-95 cursor-pointer"
                  >
                    {tourIndex < OVARY_PARTS.length ? (
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
          {/* Toast Notification at Left Side */}
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
                  <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Locating Challenge · Question {quizStep + 1} of {OVARY_PARTS.length}
                </p>
                <h2 className="text-xs sm:text-sm font-black text-white leading-tight mt-0.5">
                  Where is the <span className="text-[#f6c453] underline decoration-[#f6c453]/60">{currentTargetPart?.name}</span>?
                </h2>
              </div>

              <div className="border-t border-white/15 bg-black/20 px-3 py-2 sm:px-3.5 sm:py-2.5 flex-1 overflow-y-auto overscroll-contain">
                <p className="text-[11px] sm:text-xs font-medium leading-relaxed text-white/90">
                  {currentTargetPart?.clue} Tap the structure directly on the ovary histology slide.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* PHASE 4: Completion Modal (Docked Left on Desktop/Landscape, Labeled histological slide fully visible at Right) */}
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
              <h2 className="mt-1 text-base sm:text-xl font-black">Mammalian Ovary Histology Mastered!</h2>
              <p className="mt-0.5 text-[10px] sm:text-xs text-white/80">
                You successfully identified all key developmental follicles and structures of the mammalian ovary.
              </p>
            </div>

            <div className="border-t border-white/15 bg-black/20 p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 overflow-y-auto overscroll-contain">
              <div className="rounded-xl sm:rounded-2xl bg-black/30 p-2 sm:p-3 border border-white/10 text-xs">
                <p className="font-bold text-[#f6c453] uppercase tracking-wider text-[9px] sm:text-[10px]">Histology Summary</p>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:gap-2 text-white/90">
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 border border-white/10">
                    <p className="font-bold text-white text-[10px] sm:text-[11px]">Early Follicles</p>
                    <p className="mt-0.5 text-[9px] sm:text-[10px] text-white/70 leading-tight">Primary & Secondary granulosa layers</p>
                  </div>
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 border border-white/10">
                    <p className="font-bold text-white text-[10px] sm:text-[11px]">Mature Follicle</p>
                    <p className="mt-0.5 text-[9px] sm:text-[10px] text-white/70 leading-tight">Graafian follicle with broad antrum & oocyte</p>
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
              <p className="text-xs text-white/70">Mammalian Ovary Histology</p>
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
