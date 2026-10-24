"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  RotateCcw,
  LoaderCircle,
  X,
  Layers,
} from "lucide-react";
import LogoutSVG from "@/public/svgs/LogoutSVG";
import PracticalIntro from "../_practical/PracticalIntro";
import { playGameCorrectSound, playGameWrongSound } from "@/app/student/lab-game/_scene/labAudio";

export type RabbitPartId = "ovaries" | "oviducts" | "horns" | "cervices" | "vagina";

export type RabbitPart = {
  id: RabbitPartId;
  index: number;
  name: string;
  clue: string;
  description: string;
  x: number;
  y: number;
  lx: number;
  ly: number;
};

// 520x480 coordinate space: Organ on left/center (x: 40..320), Labels on right (x: 350..510)
const RABBIT_PARTS: RabbitPart[] = [
  {
    id: "ovaries",
    index: 1,
    name: "Ovaries (Paired)",
    clue: "Find the small yellowish-orange oval primary sex glands producing ova.",
    description:
      "Paired primary reproductive organs situated in the abdominal cavity near the kidneys. They produce female gametes (ova) and secrete hormones (estrogen and progesterone).",
    x: 311,
    y: 105,
    lx: 350,
    ly: 90,
  },
  {
    id: "oviducts",
    index: 2,
    name: "Oviducts (Fallopian tubes)",
    clue: "Look for the thin, coiled muscular tubes receiving released ova from the ovaries.",
    description:
      "Thin, convoluted tubes lined with ciliated epithelium. Each begins with a funnel-like infundibulum (ostium) near the ovary; site of fertilization where sperm meets the ovum.",
    x: 275,
    y: 145,
    lx: 350,
    ly: 145,
  },
  {
    id: "horns",
    index: 3,
    name: "Uterine horns (Uterus duplex)",
    clue: "Trace the two separate, elongated muscular branches where embryos implant.",
    description:
      "Two distinct elongated uterine cavities (uterus duplex) running downward. In rabbits, the two horns remain completely separate to accommodate large litters of fetuses.",
    x: 232,
    y: 245,
    lx: 350,
    ly: 245,
  },
  {
    id: "cervices",
    index: 4,
    name: "Cervices (Dual necks)",
    clue: "Look for the two distinct muscular neck sphincters closing each uterine horn.",
    description:
      "Each uterine horn terminates in its own distinct muscular cervix (two cervices in total), which independently opens into the shared common vaginal canal.",
    x: 205,
    y: 345,
    lx: 350,
    ly: 345,
  },
  {
    id: "vagina",
    index: 5,
    name: "Vagina (Common canal)",
    clue: "Find the single, wide median muscular passage leading downward to the vestibule.",
    description:
      "A single, wide median muscular tube where both cervices open. It extends posteriorly through the pelvic canal, leading to the urogenital vestibule and external vulva.",
    x: 180,
    y: 415,
    lx: 350,
    ly: 415,
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

export default function RabbitPracticalPage() {
  const [phase, setPhase] = useState<AppPhase>("intro");
  const [tourIndex, setTourIndex] = useState(1);

  // Locating game state (randomized)
  const [quizQueue, setQuizQueue] = useState<RabbitPartId[]>([]);
  const [quizStep, setQuizStep] = useState(0);
  const [foundParts, setFoundParts] = useState<Set<RabbitPartId>>(new Set());
  const [feedback, setFeedback] = useState<{
    type: "correct" | "wrong";
    title: string;
  } | null>(null);
  const wrongTimerRef = useRef<number | null>(null);

  // Quit modal
  const [showQuit, setShowQuit] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);

  const startQuiz = useCallback(() => {
    const shuffled = shuffle(RABBIT_PARTS.map((p) => p.id));
    setQuizQueue(shuffled);
    setQuizStep(0);
    setFoundParts(new Set());
    setFeedback(null);
    setPhase("quiz");
  }, []);

  const handlePlayAgain = useCallback(() => {
    if (wrongTimerRef.current !== null) window.clearTimeout(wrongTimerRef.current);
    setTourIndex(1);
    setQuizStep(0);
    setFoundParts(new Set());
    setFeedback(null);
    setPhase("intro");
  }, []);

  const currentTargetId = quizQueue[quizStep] || "";
  const currentTargetPart = useMemo(
    () => RABBIT_PARTS.find((p) => p.id === currentTargetId),
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
    (id: RabbitPartId) => {
      if (phase !== "quiz" || !currentTargetPart) return;

      const clickedPart = RABBIT_PARTS.find((p) => p.id === id);
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

  const activeTourPart = RABBIT_PARTS[tourIndex - 1];

  return (
    <div className="fixed inset-0 h-[100dvh] w-full overflow-hidden bg-[#eef4f0] select-none text-[#183c29] font-sans">
      {/* Subtle Lab Floor Tile Grid & Ambient Backdrop */}
      <div
        className="absolute inset-0 opacity-45 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#cadfd2 1.5px, transparent 1.5px), linear-gradient(90deg, #cadfd2 1.5px, transparent 1.5px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Main Specimen Display Area: Positioned to the right on landscape & desktop, safe on mobile */}
      <div className="absolute inset-0 flex items-center justify-center landscape:justify-end landscape:pr-[4vw] sm:landscape:pr-[8vw] sm:justify-end sm:pr-8 md:pr-14 lg:pr-20 pt-14 sm:pt-0 pointer-events-none">
        <div className="pointer-events-auto relative w-full max-w-[min(92vw,500px)] sm:max-w-[540px] max-h-[min(68dvh,480px)] sm:max-h-[min(82dvh,540px)] aspect-[520/480] rounded-3xl bg-white/95 p-3 sm:p-5 shadow-[0_12px_45px_rgba(0,0,0,0.12),0_0_80px_rgba(33,91,61,0.08)] border border-white/80 ring-1 ring-[#176b46]/20 backdrop-blur-md transition-all duration-500 ease-out">
          
          {/* Anatomical Model Header */}
          <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-[10px] sm:text-xs font-bold text-[#557b64] pointer-events-none">
            <span className="flex items-center gap-1.5 uppercase tracking-wider font-extrabold text-[#176b46]">
              <span className="size-2 rounded-full bg-[#176b46] shadow-sm animate-pulse" />
              Dissection Model
            </span>
            <span>Uterus Duplex · Front View</span>
          </div>

          {/* Interactive SVG Diagram */}
          <svg
            viewBox="0 0 520 480"
            role="img"
            aria-label="Anatomical model of female rabbit reproductive tract"
            className="w-full h-full pt-4 select-none"
          >
            <defs>
              <linearGradient id="rabbit-horn" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#F5B9C6" />
                <stop offset="1" stopColor="#E894AA" />
              </linearGradient>
              <linearGradient id="rabbit-vagina" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#EFA6B8" />
                <stop offset="1" stopColor="#D9849F" />
              </linearGradient>
              <radialGradient id="rabbit-ovary">
                <stop stopColor="#FFEAA7" />
                <stop offset="1" stopColor="#F4C742" />
              </radialGradient>
            </defs>

            {/* Symmetry Midline Guide at x = 180 */}
            <line x1="180" y1="65" x2="180" y2="455" stroke="#DDEBE3" strokeWidth="2" strokeDasharray="5 7" />

            {/* 1. Uterine Horns (Left & Right Separate Cavities) */}
            <g
              onClick={() => handlePick("horns")}
              className="cursor-pointer transition-opacity hover:opacity-90"
            >
              <path
                d="M122 171 C120 217 133 278 147 331"
                fill="none"
                stroke={foundParts.has("horns") || (phase === "tour" && activeTourPart?.id === "horns") ? "#f6c453" : "#D47D9A"}
                strokeWidth="34"
                strokeLinecap="round"
              />
              <path
                d="M238 171 C240 217 227 278 213 331"
                fill="none"
                stroke={foundParts.has("horns") || (phase === "tour" && activeTourPart?.id === "horns") ? "#f6c453" : "#D47D9A"}
                strokeWidth="34"
                strokeLinecap="round"
              />
              <path d="M122 171 C120 217 133 278 147 331" fill="none" stroke="url(#rabbit-horn)" strokeWidth="28" strokeLinecap="round" />
              <path d="M238 171 C240 217 227 278 213 331" fill="none" stroke="url(#rabbit-horn)" strokeWidth="28" strokeLinecap="round" />
              <path d="M122 174 C121 219 135 284 147 326 M238 174 C239 219 225 284 213 326" fill="none" stroke="#FFF4F4" strokeWidth="4.5" strokeLinecap="round" opacity=".8" />
            </g>

            {/* 2. Coiled Oviducts (Fallopian tubes) */}
            <g
              onClick={() => handlePick("oviducts")}
              className="cursor-pointer transition-opacity hover:opacity-90"
            >
              <path
                d="M119 170 C105 148 93 145 81 151 C69 157 54 146 61 128 C66 115 85 117 91 127 M241 170 C255 148 267 145 279 151 C291 157 306 146 299 128 C294 115 275 117 269 127"
                fill="none"
                stroke={foundParts.has("oviducts") || (phase === "tour" && activeTourPart?.id === "oviducts") ? "#f6c453" : "#D59AA8"}
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M119 170 C105 148 93 145 81 151 C69 157 54 146 61 128 C66 115 85 117 91 127 M241 170 C255 148 267 145 279 151 C291 157 306 146 299 128 C294 115 275 117 269 127"
                fill="none"
                stroke="#F8D3DB"
                strokeWidth="7"
                strokeLinecap="round"
              />
            </g>

            {/* 3. Paired Ovaries */}
            <g
              onClick={() => handlePick("ovaries")}
              className="cursor-pointer transition-opacity hover:opacity-90"
            >
              <ellipse
                cx="49"
                cy="105"
                rx="22"
                ry="28"
                transform="rotate(-22 49 105)"
                fill="url(#rabbit-ovary)"
                stroke={foundParts.has("ovaries") || (phase === "tour" && activeTourPart?.id === "ovaries") ? "#f6c453" : "#B88E28"}
                strokeWidth={foundParts.has("ovaries") || (phase === "tour" && activeTourPart?.id === "ovaries") ? 4 : 2.5}
              />
              <ellipse
                cx="311"
                cy="105"
                rx="22"
                ry="28"
                transform="rotate(22 311 105)"
                fill="url(#rabbit-ovary)"
                stroke={foundParts.has("ovaries") || (phase === "tour" && activeTourPart?.id === "ovaries") ? "#f6c453" : "#B88E28"}
                strokeWidth={foundParts.has("ovaries") || (phase === "tour" && activeTourPart?.id === "ovaries") ? 4 : 2.5}
              />
              <ellipse cx="42" cy="96" rx="5" ry="7" fill="#FFFBE8" opacity=".85" />
              <ellipse cx="304" cy="96" rx="5" ry="7" fill="#FFFBE8" opacity=".85" />
            </g>

            {/* 4. Cervices (Dual External Orifices) */}
            <g
              onClick={() => handlePick("cervices")}
              className="cursor-pointer transition-opacity hover:opacity-90"
            >
              <path
                d="M147 324 C139 335 142 350 150 365 Q160 371 168 365 C172 354 163 337 160 326 Z"
                fill="#D7839F"
                stroke={foundParts.has("cervices") || (phase === "tour" && activeTourPart?.id === "cervices") ? "#f6c453" : "#B66581"}
                strokeWidth={foundParts.has("cervices") || (phase === "tour" && activeTourPart?.id === "cervices") ? 4 : 2}
              />
              <path
                d="M213 324 C221 335 218 350 210 365 Q200 371 192 365 C188 354 197 337 200 326 Z"
                fill="#D7839F"
                stroke={foundParts.has("cervices") || (phase === "tour" && activeTourPart?.id === "cervices") ? "#f6c453" : "#B66581"}
                strokeWidth={foundParts.has("cervices") || (phase === "tour" && activeTourPart?.id === "cervices") ? 4 : 2}
              />
              <line x1="153" y1="336" x2="156" y2="358" stroke="#FBE0E6" strokeWidth="3" strokeLinecap="round" />
              <line x1="207" y1="336" x2="204" y2="358" stroke="#FBE0E6" strokeWidth="3" strokeLinecap="round" />
            </g>

            {/* 5. Vagina (Single Common Canal) */}
            <g
              onClick={() => handlePick("vagina")}
              className="cursor-pointer transition-opacity hover:opacity-90"
            >
              <path
                d="M164 361 C160 384 159 416 163 445 Q180 459 197 445 C201 416 200 384 196 361 Z"
                fill="url(#rabbit-vagina)"
                stroke={foundParts.has("vagina") || (phase === "tour" && activeTourPart?.id === "vagina") ? "#f6c453" : "#BA6C86"}
                strokeWidth={foundParts.has("vagina") || (phase === "tour" && activeTourPart?.id === "vagina") ? 4 : 2}
              />
              <path d="M180 373V440" stroke="#FBE0E6" strokeWidth="5" strokeLinecap="round" opacity=".8" />
            </g>

            {/* Anatomical Leader Line Markers (Standard Primary Brand Green) */}
            {RABBIT_PARTS.map((part, idx) => {
              const isFound = foundParts.has(part.id);
              const isTourFocus = phase === "tour" && tourIndex === idx + 1;
              const showLabel = phase === "tour" ? isTourFocus : isFound || phase === "complete";

              return (
                <g key={part.id} className="transition-all duration-200">
                  {/* Outer Ring on Anchor Dot */}
                  <circle
                    cx={part.x}
                    cy={part.y}
                    r={isFound || isTourFocus || phase === "complete" ? 6.0 : 4.5}
                    fill="none"
                    stroke="#005f02"
                    strokeWidth="1.6"
                    opacity={isFound || isTourFocus || phase === "complete" ? 0.95 : 0.75}
                  />
                  {/* Anchor Dot on Structure */}
                  <circle
                    cx={part.x}
                    cy={part.y}
                    r={isFound || isTourFocus || phase === "complete" ? 3.5 : 2.5}
                    fill="#005f02"
                    stroke="#003d01"
                    strokeWidth="1.2"
                  />
                  {/* Leader Line directly connecting to the Left Edge of the Label Badge at (lx, ly) */}
                  {showLabel && (
                    <line
                      x1={part.x}
                      y1={part.y}
                      x2={part.lx}
                      y2={part.ly}
                      stroke="#005f02"
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      opacity={0.95}
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Overlay Interactive Structure Hotspot Buttons & Labels */}
          {RABBIT_PARTS.map((part, idx) => {
            const isFound = foundParts.has(part.id);
            const isTourFocus = phase === "tour" && tourIndex === idx + 1;
            const showLabel = phase === "tour" ? isTourFocus : isFound || phase === "complete";

            return (
              <div key={part.id}>
                {/* Clickable hotspot over the structure on the diagram */}
                {phase === "quiz" && !isFound && (
                  <button
                    type="button"
                    onClick={() => handlePick(part.id)}
                    aria-label={`Locate ${part.name}`}
                    className="group absolute -translate-x-1/2 -translate-y-1/2 size-10 sm:size-11 rounded-full border border-[#176b46]/30 bg-[#176b46]/10 hover:bg-[#176b46]/30 hover:border-[#176b46] hover:scale-110 transition cursor-pointer"
                    style={{ left: `${(part.x / 520) * 100}%`, top: `${(part.y / 480) * 100}%` }}
                  >
                    <span className="sr-only">{part.name}</span>
                  </button>
                )}

                {/* Label Badge (Starts directly at lx with translate-x-0, perfectly connecting to the line!) */}
                {showLabel && (
                  <div
                    className="absolute -translate-y-1/2 translate-x-0 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] sm:text-xs font-black shadow-lg bg-gradient-to-r from-primary to-primary-dark text-white border-primary/90 ring-1 sm:ring-2 ring-primary/40 whitespace-nowrap transition-all duration-200 pointer-events-none"
                    style={{ left: `${(part.lx / 520) * 100}%`, top: `${(part.ly / 480) * 100}%` }}
                  >
                    <span className="grid size-3.5 sm:size-4 shrink-0 place-items-center rounded-full bg-[#f6c453] text-[#0f2e12] text-[8px] sm:text-[9px] font-black shadow-sm">
                      <Check size={9} strokeWidth={3.5} />
                    </span>
                    <span className="font-bold text-white whitespace-nowrap">{part.name}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Header Bar */}
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
          Biology · Class XII · Rabbit Reproductive Anatomy
        </span>
      </div>

      {/* PHASE 1: Pre-Practical Briefing Screen */}
      {phase === "intro" && (
        <PracticalIntro
          brief={{
            expNo: 5,
            title: "Anatomy of the Female Rabbit Reproductive System",
            object:
              "To identify, dissect, and examine the paired ovaries, coiled oviducts, dual uterine horns (uterus duplex), cervices, and median vagina on a female rabbit model.",
            apparatus: RABBIT_PARTS.map((p) => p.name),
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
          apparatus={RABBIT_PARTS.map((p) => p.name)}
        />
      )}

      {/* PHASE 2: Guided Anatomy Tour Modal (Docked on bottom-left) */}
      {phase === "tour" && (
        <div
          data-ui
          className="pointer-events-none absolute left-2.5 sm:left-4 bottom-2.5 sm:bottom-4 z-30 flex justify-start pb-[max(0.4rem,env(safe-area-inset-bottom,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))]"
        >
          <div className="pointer-events-auto flex w-[min(92vw,350px)] sm:w-[360px] landscape:w-[min(40vw,320px)] max-h-[min(48dvh,240px)] sm:max-h-[280px] landscape:max-h-[min(70dvh,260px)] flex-col rounded-xl sm:rounded-2xl border border-white/25 bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl ring-1 ring-white/25 overflow-hidden backdrop-blur-md">
            <div className="px-3 py-1.5 sm:px-3.5 sm:py-2.5 shrink-0">
              <p className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#f6c453]">
                <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Structure {tourIndex} of {RABBIT_PARTS.length}
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
                      if (tourIndex < RABBIT_PARTS.length) {
                        setTourIndex((i) => i + 1);
                      } else {
                        startQuiz();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-[#f6c453] px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black text-[#0f2e12] shadow-md transition hover:bg-amber-300 active:scale-95 cursor-pointer"
                  >
                    {tourIndex < RABBIT_PARTS.length ? (
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
                  <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Locating Challenge · Question {quizStep + 1} of {RABBIT_PARTS.length}
                </p>
                <h2 className="text-xs sm:text-sm font-black text-white leading-tight mt-0.5">
                  Where is the <span className="text-[#f6c453] underline decoration-[#f6c453]/60">{currentTargetPart?.name}</span>?
                </h2>
              </div>

              <div className="border-t border-white/15 bg-black/20 px-3 py-2 sm:px-3.5 sm:py-2.5 flex-1 overflow-y-auto overscroll-contain">
                <p className="text-[11px] sm:text-xs font-medium leading-relaxed text-white/90">
                  {currentTargetPart?.clue} Tap the anatomical organ directly on the rabbit model.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* PHASE 4: Completion Modal (Docked Left on Desktop/Landscape, Labeled rabbit diagram fully visible at Right) */}
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
              <h2 className="mt-1 text-base sm:text-xl font-black">Rabbit Anatomy Mastered!</h2>
              <p className="mt-0.5 text-[10px] sm:text-xs text-white/80">
                You successfully located all organs of the female rabbit duplex reproductive tract.
              </p>
            </div>

            <div className="border-t border-white/15 bg-black/20 p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 overflow-y-auto overscroll-contain">
              <div className="rounded-xl sm:rounded-2xl bg-black/30 p-2 sm:p-3 border border-white/10 text-xs">
                <p className="font-bold text-[#f6c453] uppercase tracking-wider text-[9px] sm:text-[10px]">Anatomical Architecture</p>
                <div className="mt-1.5 space-y-1.5 text-white/90">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                    <p className="font-bold text-white text-[10px] sm:text-[11px]">Duplex Uterus Mechanism</p>
                    <p className="mt-0.5 text-[9px] sm:text-[10px] text-white/70 leading-tight">
                      Unlike human simplex uterus, rabbits have two completely separate uterine horns, each possessing its own independent cervix.
                    </p>
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
              <p className="text-xs text-white/70">Female Rabbit Reproductive System</p>
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
