"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  RotateCcw,
  Sparkles,
  LoaderCircle,
  X,
  Play,
  Activity,
  Layers,
  Info,
  CheckCircle2,
} from "lucide-react";
import LogoutSVG from "@/public/svgs/LogoutSVG";
import PracticalIntro from "../_practical/PracticalIntro";
import { playGameCorrectSound, playGameWrongSound } from "@/app/student/lab-game/_scene/labAudio";

type AppPhase = "intro" | "tour" | "quiz" | "complete";

export type KidneyPartId =
  | "capsule"
  | "cortex"
  | "pyramids"
  | "pelvis"
  | "ureter"
  | "renal_artery"
  | "renal_vein";

export type KidneyPart = {
  id: KidneyPartId;
  name: string;
  x: number; // Anchor dot on diagram (viewBox 520 x 480)
  y: number;
  lx: number; // Leader label position
  ly: number;
  clue: string;
  description: string;
};

const KIDNEY_PARTS: KidneyPart[] = [
  {
    id: "capsule",
    name: "Renal Capsule",
    x: 105,
    y: 130,
    lx: 25,
    ly: 90,
    clue: "Tough fibrous outer membrane protecting the kidney from physical trauma and infection.",
    description:
      "The renal capsule is a smooth, transparent, tough fibrous connective tissue layer tightly enclosing the exterior of the kidney. It prevents infection from surrounding retroperitoneal tissues and maintains renal shape under internal fluid pressure.",
  },
  {
    id: "cortex",
    name: "Renal Cortex",
    x: 145,
    y: 190,
    lx: 25,
    ly: 190,
    clue: "Granular reddish-brown outer zone containing 1+ million glomeruli and convoluted tubules.",
    description:
      "The renal cortex is the outer metabolic layer of the kidney. Its granular appearance is caused by millions of Malpighian corpuscles (Bowman's capsules and Glomeruli) together with proximal and distal convoluted tubules where ultrafiltration and selective reabsorption occur.",
  },
  {
    id: "pyramids",
    name: "Renal Medulla & Pyramids",
    x: 215,
    y: 155,
    lx: 25,
    ly: 290,
    clue: "Triangular striated pyramids containing Loops of Henle and Collecting Ducts.",
    description:
      "The renal medulla consists of 8 to 18 radially striated triangular masses called Renal (Malpighian) Pyramids. Their striated texture is formed by parallel Loops of Henle and collecting tubules that concentrate urine by the countercurrent multiplier mechanism.",
  },
  {
    id: "pelvis",
    name: "Renal Pelvis",
    x: 305,
    y: 235,
    lx: 380,
    ly: 130,
    clue: "Funnel-shaped central basin collecting urine from major calyces before draining into ureter.",
    description:
      "The renal pelvis is the central cavity located at the renal hilum. Minor and major calyces cup the apex (papilla) of each renal pyramid, funneling collected urine into the pelvis, which then tapers directly into the upper ureter.",
  },
  {
    id: "ureter",
    name: "Ureter",
    x: 345,
    y: 380,
    lx: 380,
    ly: 380,
    clue: "Thick muscular duct carrying urine from kidney to urinary bladder via peristalsis.",
    description:
      "The ureter is a muscular tube (~25–30 cm long) emerging from the renal pelvis at the hilum. Waves of smooth muscle peristalsis propel urine downwards into the urinary bladder regardless of gravitational posture.",
  },
  {
    id: "renal_artery",
    name: "Renal Artery",
    x: 330,
    y: 200,
    lx: 380,
    ly: 200,
    clue: "Major blood vessel branching from abdominal aorta delivering oxygenated blood under high pressure.",
    description:
      "The renal artery delivers ~20–25% of total resting cardiac output directly to the kidneys. It divides into segmental and interlobar arteries to supply afferent arterioles feeding glomerular capillary beds for blood filtration.",
  },
  {
    id: "renal_vein",
    name: "Renal Vein",
    x: 335,
    y: 275,
    lx: 380,
    ly: 290,
    clue: "Blue vessel draining purified deoxygenated blood into the inferior vena cava.",
    description:
      "The renal vein returns purified blood (cleared of metabolic urea, uric acid, and excess ions) from peritubular capillary networks and vasa recta into the inferior vena cava.",
  },
];

export default function PracticalKidneyAnatomy() {
  const [phase, setPhase] = useState<AppPhase>("intro");
  const [tourIndex, setTourIndex] = useState(1);
  const [foundParts, setFoundParts] = useState<Set<KidneyPartId>>(new Set());
  const [quizStep, setQuizStep] = useState(0);
  const [feedback, setFeedback] = useState<{
    type: "correct" | "wrong";
    title: string;
  } | null>(null);

  // Quit modal
  const [showQuit, setShowQuit] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);

  // Target part during quiz
  const currentTargetPart = useMemo(() => {
    return KIDNEY_PARTS[quizStep];
  }, [quizStep]);

  const startQuiz = useCallback(() => {
    setFoundParts(new Set());
    setQuizStep(0);
    setFeedback(null);
    setPhase("quiz");
  }, []);

  const handlePlayAgain = useCallback(() => {
    setTourIndex(1);
    setFoundParts(new Set());
    setQuizStep(0);
    setFeedback(null);
    setPhase("intro");
  }, []);

  const triggerConfetti = useCallback(async () => {
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ["#b91c1c", "#991b1b", "#16a34a", "#0284c7", "#f59e0b"],
      });
    } catch {
      /* ignore */
    }
  }, []);

  const handlePick = useCallback(
    (partId: KidneyPartId) => {
      if (phase !== "quiz" || !currentTargetPart) return;

      if (partId === currentTargetPart.id) {
        playGameCorrectSound();
        setFoundParts((prev) => new Set([...prev, partId]));
        setFeedback({
          type: "correct",
          title: `Correct! Located ${currentTargetPart.name}`,
        });

        window.setTimeout(() => {
          if (quizStep + 1 >= KIDNEY_PARTS.length) {
            setPhase("complete");
            triggerConfetti();
          } else {
            setQuizStep((s) => s + 1);
            setFeedback(null);
          }
        }, 1100);
      } else {
        playGameWrongSound();
        setFeedback({
          type: "wrong",
          title: `That's not the ${currentTargetPart.name}. Try again!`,
        });
        window.setTimeout(() => setFeedback(null), 1800);
      }
    },
    [phase, currentTargetPart, quizStep, triggerConfetti]
  );

  const activeTourPart = KIDNEY_PARTS[tourIndex - 1];

  return (
    <div className="fixed inset-0 h-[100dvh] w-full overflow-hidden bg-[#eef4f0] select-none text-[#183c29] font-sans">
      {/* Subtle Lab Grid Background */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#cadfd2 1.5px, transparent 1.5px), linear-gradient(90deg, #cadfd2 1.5px, transparent 1.5px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Main Specimen Display Area: Positioned to the right on landscape & desktop */}
      <div className="absolute inset-0 flex items-center justify-center landscape:justify-end landscape:pr-[3vw] sm:landscape:pr-[6vw] sm:justify-end sm:pr-8 md:pr-14 lg:pr-20 pt-14 sm:pt-0 pointer-events-none">
        <div className="pointer-events-auto relative w-full max-w-[min(92vw,520px)] sm:max-w-[560px] max-h-[min(68dvh,480px)] sm:max-h-[min(82dvh,540px)] aspect-[520/480] rounded-3xl bg-white/95 p-3 sm:p-5 shadow-[0_12px_45px_rgba(0,0,0,0.12),0_0_80px_rgba(33,91,61,0.08)] border border-white/80 ring-1 ring-[#176b46]/20 backdrop-blur-md transition-all duration-500 ease-out">
          
          {/* Anatomical Model Header */}
          <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-[10px] sm:text-xs font-bold text-[#557b64] pointer-events-none">
            <span className="flex items-center gap-1.5 uppercase tracking-wider font-extrabold text-[#176b46]">
              <span className="size-2 rounded-full bg-[#176b46] shadow-sm animate-pulse" />
              Anatomical Dissection
            </span>
            <span>Mammalian Kidney · L.S.</span>
          </div>

          {/* Interactive SVG Diagram */}
          <svg
            viewBox="0 0 520 480"
            role="img"
            aria-label="Anatomical longitudinal section of mammalian kidney showing cortex, medulla pyramids, pelvis, ureter and vessels"
            className="w-full h-full pt-4 select-none"
          >
            <defs>
              <linearGradient id="kidneyCortex" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#b91c1c" />
                <stop offset="50%" stopColor="#991b1b" />
                <stop offset="100%" stopColor="#7f1d1d" />
              </linearGradient>

              <linearGradient id="kidneyMedulla" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#b91c1c" />
              </linearGradient>

              <linearGradient id="pyramidGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#991b1b" />
                <stop offset="50%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#7f1d1d" />
              </linearGradient>

              <linearGradient id="pelvisWhite" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="100%" stopColor="#fde68a" />
              </linearGradient>
            </defs>

            {/* 1. Outer Fibrous Capsule & Bean Outline */}
            <g
              onClick={() => handlePick("capsule")}
              className="cursor-pointer transition-opacity hover:opacity-95"
            >
              <path
                d="M 230 45 C 100 45 60 160 60 250 C 60 350 110 445 230 445 C 310 445 365 375 345 320 C 330 280 290 260 290 240 C 290 220 330 200 345 160 C 365 105 310 45 230 45 Z"
                fill="url(#kidneyCortex)"
                stroke={foundParts.has("capsule") || (phase === "tour" && activeTourPart?.id === "capsule") ? "#f6c453" : "#450a0a"}
                strokeWidth={foundParts.has("capsule") || (phase === "tour" && activeTourPart?.id === "capsule") ? 5 : 2.5}
              />
            </g>

            {/* 2. Renal Cortex Boundary */}
            <g
              onClick={() => handlePick("cortex")}
              className="cursor-pointer transition-opacity hover:opacity-95"
            >
              <path
                d="M 230 65 C 125 65 85 170 85 250 C 85 335 128 425 230 425 C 295 425 335 365 320 320 C 305 285 270 260 270 240 C 270 220 305 195 320 160 C 335 115 295 65 230 65 Z"
                fill="url(#kidneyMedulla)"
                stroke={foundParts.has("cortex") || (phase === "tour" && activeTourPart?.id === "cortex") ? "#f6c453" : "#7f1d1d"}
                strokeWidth={foundParts.has("cortex") || (phase === "tour" && activeTourPart?.id === "cortex") ? 4 : 1.5}
              />
            </g>

            {/* 3. Renal (Malpighian) Pyramids */}
            <g
              onClick={() => handlePick("pyramids")}
              className="cursor-pointer transition-opacity hover:opacity-95"
            >
              {/* Pyramid 1 (Top Left) */}
              <polygon points="175,85 230,105 220,150" fill="url(#pyramidGrad)" stroke="#450a0a" strokeWidth="1.2" />
              {/* Pyramid 2 */}
              <polygon points="120,140 185,145 200,185" fill="url(#pyramidGrad)" stroke="#450a0a" strokeWidth="1.2" />
              {/* Pyramid 3 (Mid Left) */}
              <polygon points="105,210 170,205 195,235" fill="url(#pyramidGrad)" stroke="#450a0a" strokeWidth="1.2" />
              {/* Pyramid 4 (Lower Mid) */}
              <polygon points="115,285 175,265 200,285" fill="url(#pyramidGrad)" stroke="#450a0a" strokeWidth="1.2" />
              {/* Pyramid 5 */}
              <polygon points="140,355 200,315 225,335" fill="url(#pyramidGrad)" stroke="#450a0a" strokeWidth="1.2" />
              {/* Pyramid 6 (Bottom) */}
              <polygon points="195,405 240,360 260,375" fill="url(#pyramidGrad)" stroke="#450a0a" strokeWidth="1.2" />
            </g>

            {/* 4. Renal Pelvis & Calyces (Center Hilum) */}
            <g
              onClick={() => handlePick("pelvis")}
              className="cursor-pointer transition-opacity hover:opacity-95"
            >
              <path
                d="M 215 155 L 245 180 L 275 200 L 290 235 L 275 270 L 245 295 L 215 320 L 255 285 L 310 260 L 335 250 L 335 230 L 310 220 L 255 195 Z"
                fill="url(#pelvisWhite)"
                stroke={foundParts.has("pelvis") || (phase === "tour" && activeTourPart?.id === "pelvis") ? "#f6c453" : "#d97706"}
                strokeWidth={foundParts.has("pelvis") || (phase === "tour" && activeTourPart?.id === "pelvis") ? 4 : 2}
              />
            </g>

            {/* 5. Renal Artery (Red) */}
            <g
              onClick={() => handlePick("renal_artery")}
              className="cursor-pointer transition-opacity hover:opacity-95"
            >
              <path
                d="M 320 195 L 430 185 L 430 215 L 330 215 Z"
                fill="#dc2626"
                stroke={foundParts.has("renal_artery") || (phase === "tour" && activeTourPart?.id === "renal_artery") ? "#f6c453" : "#991b1b"}
                strokeWidth={foundParts.has("renal_artery") || (phase === "tour" && activeTourPart?.id === "renal_artery") ? 4 : 2}
              />
              <path d="M 320 195 Q 350 170 380 180" stroke="#fca5a5" strokeWidth="2.5" fill="none" />
            </g>

            {/* 6. Renal Vein (Blue) */}
            <g
              onClick={() => handlePick("renal_vein")}
              className="cursor-pointer transition-opacity hover:opacity-95"
            >
              <path
                d="M 325 255 L 430 265 L 430 295 L 325 285 Z"
                fill="#2563eb"
                stroke={foundParts.has("renal_vein") || (phase === "tour" && activeTourPart?.id === "renal_vein") ? "#f6c453" : "#1e40af"}
                strokeWidth={foundParts.has("renal_vein") || (phase === "tour" && activeTourPart?.id === "renal_vein") ? 4 : 2}
              />
              <path d="M 330 265 Q 360 280 410 275" stroke="#93c5fd" strokeWidth="2.5" fill="none" />
            </g>

            {/* 7. Ureter (Emerging downwards from Pelvis) */}
            <g
              onClick={() => handlePick("ureter")}
              className="cursor-pointer transition-opacity hover:opacity-95"
            >
              <path
                d="M 310 260 L 335 250 L 360 350 L 375 440 L 345 440 L 335 350 Z"
                fill="#fde68a"
                stroke={foundParts.has("ureter") || (phase === "tour" && activeTourPart?.id === "ureter") ? "#f6c453" : "#d97706"}
                strokeWidth={foundParts.has("ureter") || (phase === "tour" && activeTourPart?.id === "ureter") ? 4 : 2}
              />
            </g>

            {/* Anatomical Leader Line Markers */}
            {KIDNEY_PARTS.map((part, idx) => {
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
                  {/* Leader Line directly connecting to the Label Badge at (lx, ly) */}
                  {showLabel && (
                    <line
                      x1={part.x}
                      y1={part.y}
                      x2={part.lx > part.x ? part.lx : part.lx + 80}
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
          {KIDNEY_PARTS.map((part, idx) => {
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

                {/* Label Badge */}
                {showLabel && (
                  <div
                    className="absolute -translate-y-1/2 translate-x-0 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] sm:text-xs font-black shadow-lg bg-gradient-to-r from-primary to-primary-dark text-white border-primary/90 ring-1 sm:ring-2 ring-primary/40 whitespace-nowrap transition-all duration-200 pointer-events-none"
                    style={{ left: `${(part.lx / 520) * 100}%`, top: `${(part.ly / 480) * 100}%` }}
                  >
                    <span className="grid size-3.5 sm:size-4 shrink-0 place-items-center rounded-full bg-[#f6c453] text-[#0f2e12] text-[8px] sm:text-[9px] font-black shadow-sm">
                      <Check size={9} strokeWidth={3.5} />
                    </span>
                    <span>{part.name}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lab Header Controls */}
      <div data-ui className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between p-2.5 sm:p-4">
        <button
          type="button"
          onClick={() => setShowQuit(true)}
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-3 py-1.5 text-xs font-bold text-[#183c29] shadow-sm backdrop-blur-md transition hover:bg-white active:scale-95 cursor-pointer"
        >
          <LogoutSVG /> Exit Lab
        </button>

        <span className="pointer-events-auto rounded-full border border-amber-300/70 bg-[#3c301a]/90 px-3.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-100 shadow-md backdrop-blur-md">
          Biology · Class X · Mammalian Kidney L.S.
        </span>
      </div>

      {/* PHASE 1: Practical Introduction Overlay */}
      {phase === "intro" && (
        <PracticalIntro
          subject="Biology"
          exitHref="/student/lab-game/biology"
          onStart={() => setPhase("tour")}
          brief={{
            expNo: 5,
            title: "Gross & Histological Anatomy of the Mammalian Kidney in Longitudinal Section",
            object:
              "To study the longitudinal section (L.S.) of a mammalian kidney, identifying renal capsule, cortex, medullary pyramids, renal pelvis, ureter, and renal blood vessels.",
            theory: [
              "The mammalian kidney is bean-shaped and enveloped by a protective fibrous renal capsule.",
              "Internally, it consists of an outer dark-red renal cortex containing Bowman's capsules and convoluted tubules, and an inner striated medulla containing conical renal pyramids.",
              "Urine flows from renal papillae into calyces, collects in the funnel-shaped renal pelvis, and drains via the ureter to the urinary bladder.",
            ],
            apparatus: [
              "Preserved / Fresh Sheep Kidney Specimen",
              "Dissection Tray with Wax Bottom",
              "Scalpel & Surgical Forceps",
              "Dissecting Pins & Hand Lens / Magnifier",
              "Water Dropper & Blotting Paper",
            ],
          }}
          apparatus={[
            "Preserved / Fresh Sheep Kidney Specimen",
            "Dissection Tray with Wax Bottom",
            "Scalpel & Surgical Forceps",
            "Dissecting Pins & Hand Lens / Magnifier",
            "Water Dropper & Blotting Paper",
          ]}
        />
      )}

      {/* PHASE 2: Guided Tour of All 7 Structures (Docked on bottom-left) */}
      {phase === "tour" && (
        <div
          data-ui
          className="pointer-events-none absolute left-2.5 sm:left-4 bottom-2.5 sm:bottom-4 z-30 flex justify-start pb-[max(0.4rem,env(safe-area-inset-bottom,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))]"
        >
          <div className="pointer-events-auto flex w-[min(92vw,350px)] sm:w-[360px] landscape:w-[min(40vw,320px)] max-h-[min(48dvh,240px)] sm:max-h-[280px] landscape:max-h-[min(70dvh,260px)] flex-col rounded-xl sm:rounded-2xl border border-white/25 bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl ring-1 ring-white/25 overflow-hidden backdrop-blur-md">
            <div className="px-3 py-1.5 sm:px-3.5 sm:py-2.5 shrink-0">
              <p className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#f6c453]">
                <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Structure {tourIndex} of {KIDNEY_PARTS.length}
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
                      if (tourIndex < KIDNEY_PARTS.length) {
                        setTourIndex((i) => i + 1);
                      } else {
                        startQuiz();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-[#f6c453] px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black text-[#0f2e12] shadow-md transition hover:bg-amber-300 active:scale-95 cursor-pointer"
                  >
                    {tourIndex < KIDNEY_PARTS.length ? (
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
                  <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Locating Challenge · Question {quizStep + 1} of {KIDNEY_PARTS.length}
                </p>
                <h2 className="text-xs sm:text-sm font-black text-white leading-tight mt-0.5">
                  Where is the <span className="text-[#f6c453] underline decoration-[#f6c453]/60">{currentTargetPart?.name}</span>?
                </h2>
              </div>

              <div className="border-t border-white/15 bg-black/20 px-3 py-2 sm:px-3.5 sm:py-2.5 flex-1 overflow-y-auto overscroll-contain">
                <p className="text-[11px] sm:text-xs font-medium leading-relaxed text-white/90">
                  {currentTargetPart?.clue} Tap the anatomical structure directly on the kidney cross-section.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* PHASE 4: Completion Modal (Docked Left so it does not overlap actual data) */}
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
              <h2 className="mt-1 text-base sm:text-xl font-black">Kidney Anatomy Mastered!</h2>
              <p className="mt-0.5 text-[10px] sm:text-xs text-white/80">
                You successfully located and identified all anatomical zones of the mammalian kidney in longitudinal section.
              </p>
            </div>

            <div className="border-t border-white/15 bg-black/20 p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 overflow-y-auto overscroll-contain">
              <div className="rounded-xl sm:rounded-2xl bg-black/30 p-2.5 sm:p-3 border border-white/10 text-xs">
                <p className="font-bold text-[#f6c453] uppercase tracking-wider text-[9px] sm:text-[10px]">Renal Physiology Summary</p>
                <div className="mt-1.5 grid grid-cols-2 gap-2 text-white/90">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                    <p className="font-bold text-white text-[10px]">Cortex Function</p>
                    <p className="mt-0.5 text-[9px] text-white/70 leading-tight">Ultrafiltration in Bowman's capsules & selective glucose reabsorption</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                    <p className="font-bold text-white text-[10px]">Medulla Function</p>
                    <p className="mt-0.5 text-[9px] text-white/70 leading-tight">Osmoregulation & water reabsorption in Loops of Henle</p>
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
              <p className="text-xs text-white/70">Mammalian Kidney Anatomy</p>
            </div>
            <div className="border-t border-white/15 bg-black/20 p-3.5 sm:p-5 flex-1 overflow-y-auto overscroll-contain">
              <p className="text-xs leading-relaxed text-white/80">
                Your current session progress will not be saved. Are you sure you want to leave the virtual lab?
              </p>
              <div className="mt-4 sm:mt-5 flex gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowQuit(false)}
                  className="flex-1 rounded-xl border border-white/20 bg-white/10 py-2 sm:py-2.5 text-xs font-black text-white hover:bg-white/20 cursor-pointer"
                >
                  Stay
                </button>
                <Link
                  href="/student/lab-game/biology"
                  className="flex-1 inline-flex items-center justify-center rounded-xl bg-rose-600 py-2 sm:py-2.5 text-xs font-black text-white shadow-lg hover:bg-rose-700 cursor-pointer"
                >
                  Leave Lab
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
