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
  ZoomIn,
  Layers,
  Info,
  CheckCircle2,
} from "lucide-react";
import LogoutSVG from "@/public/svgs/LogoutSVG";
import PracticalIntro from "../_practical/PracticalIntro";
import { playGameCorrectSound, playGameWrongSound } from "@/app/student/lab-game/_scene/labAudio";

type AppPhase = "intro" | "tour" | "quiz" | "complete";

export type MitosisStageId =
  | "interphase"
  | "prophase"
  | "metaphase"
  | "anaphase"
  | "telophase"
  | "cytokinesis";

export type MitosisCell = {
  id: MitosisStageId;
  name: string;
  x: number;
  y: number;
  lx: number;
  ly: number;
  clue: string;
  description: string;
};

const MITOSIS_CELLS: MitosisCell[] = [
  {
    id: "interphase",
    name: "Interphase (G₁ - S - G₂)",
    x: 140,
    y: 110,
    lx: 25,
    ly: 90,
    clue: "Resting cell with intact nuclear envelope, dark nucleolus, and diffuse uncoiled chromatin.",
    description:
      "Interphase is the metabolically active preparatory phase prior to cell division. DNA replication (S phase), organelle duplication, and protein synthesis occur while the nuclear envelope and nucleoli remain intact.",
  },
  {
    id: "prophase",
    name: "Prophase",
    x: 280,
    y: 125,
    lx: 25,
    ly: 190,
    clue: "Chromatin condenses into thick visible chromosomes; nuclear membrane starts dissolving.",
    description:
      "During prophase, chromatin fibers coil tightly and condense into distinct rod-shaped chromosomes, each consisting of two identical sister chromatids joined at a centromere. The nuclear envelope and nucleolus disappear as the mitotic spindle begins organizing.",
  },
  {
    id: "metaphase",
    name: "Metaphase",
    x: 210,
    y: 245,
    lx: 25,
    ly: 290,
    clue: "Chromosomes aligned along the equatorial plane (metaphase plate) attached to spindle fibers.",
    description:
      "In metaphase, chromosomes reach maximum condensation and align symmetrically along the equatorial plane (metaphase plate). Spindle fibers from opposite poles attach firmly to the kinetochore protein complexes of each centromere.",
  },
  {
    id: "anaphase",
    name: "Anaphase",
    x: 350,
    y: 235,
    lx: 380,
    ly: 130,
    clue: "Centromeres split; sister chromatids separate and pull apart toward opposite poles in V-shapes.",
    description:
      "Anaphase begins when centromeres divide simultaneously. Spindle fibers shorten, pulling daughter chromosomes (formerly sister chromatids) toward opposite centrosome poles in characteristic V- or J-shaped configurations.",
  },
  {
    id: "telophase",
    name: "Telophase",
    x: 200,
    y: 375,
    lx: 380,
    ly: 230,
    clue: "Two groups of daughter chromosomes uncoil at poles; new nuclear envelopes reform.",
    description:
      "During telophase, chromosomes reach the poles and decondense back into diffuse chromatin. New nuclear envelopes assemble around each daughter nucleus, nucleoli reappear, and mitotic spindle fibers disintegrate.",
  },
  {
    id: "cytokinesis",
    name: "Cytokinesis (Cell Plate Formation)",
    x: 335,
    y: 370,
    lx: 380,
    ly: 350,
    clue: "Phragmoplast vesicles coalesce to form a middle lamella cell plate dividing two daughter cells.",
    description:
      "In plant cells, cytokinesis occurs via cell plate (phragmoplast) formation. Golgi vesicles filled with pectin fuse along the equatorial line from inside-out, building a new middle lamella and primary cellulose cell wall to partition the two identical daughter cells.",
  },
];

export default function PracticalMitosisStages() {
  const [phase, setPhase] = useState<AppPhase>("intro");
  const [tourIndex, setTourIndex] = useState(1);
  const [foundParts, setFoundParts] = useState<Set<MitosisStageId>>(new Set());
  const [quizStep, setQuizStep] = useState(0);
  const [feedback, setFeedback] = useState<{
    type: "correct" | "wrong";
    title: string;
  } | null>(null);

  // Quit modal
  const [showQuit, setShowQuit] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);

  const currentTargetPart = useMemo(() => {
    return MITOSIS_CELLS[quizStep];
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
        colors: ["#9333ea", "#c084fc", "#16a34a", "#0284c7", "#f59e0b"],
      });
    } catch {
      /* ignore */
    }
  }, []);

  const handlePick = useCallback(
    (partId: MitosisStageId) => {
      if (phase !== "quiz" || !currentTargetPart) return;

      if (partId === currentTargetPart.id) {
        playGameCorrectSound();
        setFoundParts((prev) => new Set([...prev, partId]));
        setFeedback({
          type: "correct",
          title: `Correct! Located ${currentTargetPart.name}`,
        });

        window.setTimeout(() => {
          if (quizStep + 1 >= MITOSIS_CELLS.length) {
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

  const activeTourPart = MITOSIS_CELLS[tourIndex - 1];

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

      {/* Main Microscope Lens Viewport Area (Positioned to the right on landscape & desktop) */}
      <div className="absolute inset-0 flex items-center justify-center landscape:justify-end landscape:pr-[3vw] sm:landscape:pr-[6vw] sm:justify-end sm:pr-8 md:pr-14 lg:pr-20 pt-14 sm:pt-0 pointer-events-none">
        <div className="pointer-events-auto relative w-full max-w-[min(92vw,520px)] sm:max-w-[560px] max-h-[min(68dvh,480px)] sm:max-h-[min(82dvh,540px)] aspect-[520/480] rounded-3xl bg-white/95 p-3 sm:p-5 shadow-[0_12px_45px_rgba(0,0,0,0.12),0_0_80px_rgba(33,91,61,0.08)] border border-white/80 ring-1 ring-[#176b46]/20 backdrop-blur-md transition-all duration-500 ease-out">
          
          {/* Microscope Header */}
          <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-[10px] sm:text-xs font-bold text-[#557b64] pointer-events-none">
            <span className="flex items-center gap-1.5 uppercase tracking-wider font-extrabold text-[#176b46]">
              <span className="size-2 rounded-full bg-purple-600 shadow-sm animate-pulse" />
              Acetocarmine Squash
            </span>
            <span>Onion Root Tip · Mitotic Stages (400×)</span>
          </div>

          {/* Interactive SVG Diagram simulating Circular Microscope Lens Field */}
          <svg
            viewBox="0 0 520 480"
            role="img"
            aria-label="Microscopic view of mitotic stages in onion root tip"
            className="w-full h-full pt-4 select-none"
          >
            <defs>
              {/* Circular Optical Lens Gradients */}
              <radialGradient id="microscopeField" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fdf4ff" />
                <stop offset="70%" stopColor="#fae8ff" />
                <stop offset="96%" stopColor="#f0abfc" />
                <stop offset="100%" stopColor="#c084fc" />
              </radialGradient>

              <linearGradient id="cellBg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#faf5ff" />
                <stop offset="100%" stopColor="#f3e8ff" />
              </linearGradient>

              <linearGradient id="chromatinDark" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7e22ce" />
                <stop offset="100%" stopColor="#581c87" />
              </linearGradient>
            </defs>

            {/* Circular Microscope Eyepiece Aperture Rim */}
            <circle cx="260" cy="240" r="215" fill="#1e1b4b" stroke="#0f172a" strokeWidth="8" />
            <circle cx="260" cy="240" r="208" fill="url(#microscopeField)" stroke="#9333ea" strokeWidth="2.5" />

            {/* Microscopic Grid of Meristematic Cells */}
            {/* 1. INTERPHASE CELL (Top-Left, x=140, y=110) */}
            <g
              onClick={() => handlePick("interphase")}
              className="cursor-pointer transition-opacity hover:opacity-90"
            >
              {/* Rectangular Cell Wall */}
              <rect
                x="80"
                y="55"
                width="110"
                height="105"
                rx="8"
                fill="url(#cellBg)"
                stroke={foundParts.has("interphase") || (phase === "tour" && activeTourPart?.id === "interphase") ? "#f6c453" : "#c084fc"}
                strokeWidth={foundParts.has("interphase") || (phase === "tour" && activeTourPart?.id === "interphase") ? 4 : 2}
              />
              {/* Intact Nuclear Envelope */}
              <circle cx="135" cy="108" r="32" fill="#f5d0fe" stroke="#a855f7" strokeWidth="1.8" />
              {/* Dark Stained Nucleolus */}
              <circle cx="145" cy="102" r="8" fill="#6b21a8" />
              {/* Diffuse fine chromatin granules */}
              <circle cx="125" cy="112" r="3" fill="#7e22ce" opacity="0.8" />
              <circle cx="135" cy="122" r="2.5" fill="#7e22ce" opacity="0.7" />
              <circle cx="148" cy="118" r="2.8" fill="#7e22ce" opacity="0.7" />
            </g>

            {/* 2. PROPHASE CELL (Top-Right, x=280, y=125) */}
            <g
              onClick={() => handlePick("prophase")}
              className="cursor-pointer transition-opacity hover:opacity-90"
            >
              <rect
                x="220"
                y="65"
                width="120"
                height="115"
                rx="8"
                fill="url(#cellBg)"
                stroke={foundParts.has("prophase") || (phase === "tour" && activeTourPart?.id === "prophase") ? "#f6c453" : "#c084fc"}
                strokeWidth={foundParts.has("prophase") || (phase === "tour" && activeTourPart?.id === "prophase") ? 4 : 2}
              />
              {/* Disintegrating nuclear boundary (dashed) */}
              <circle cx="280" cy="122" r="36" fill="#fdf4ff" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4 3" />
              {/* Thick Coiled Condensed Chromosome Strands */}
              <path d="M 260 100 Q 275 110 268 135" fill="none" stroke="url(#chromatinDark)" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M 290 98 Q 282 120 300 138" fill="none" stroke="url(#chromatinDark)" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M 255 125 Q 280 128 295 115" fill="none" stroke="url(#chromatinDark)" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M 270 110 Q 285 135 275 148" fill="none" stroke="url(#chromatinDark)" strokeWidth="4.5" strokeLinecap="round" />
            </g>

            {/* 3. METAPHASE CELL (Mid-Left, x=210, y=245) */}
            <g
              onClick={() => handlePick("metaphase")}
              className="cursor-pointer transition-opacity hover:opacity-90"
            >
              <rect
                x="145"
                y="185"
                width="125"
                height="115"
                rx="8"
                fill="url(#cellBg)"
                stroke={foundParts.has("metaphase") || (phase === "tour" && activeTourPart?.id === "metaphase") ? "#f6c453" : "#c084fc"}
                strokeWidth={foundParts.has("metaphase") || (phase === "tour" && activeTourPart?.id === "metaphase") ? 4 : 2}
              />
              {/* Spindle Fibers converging at poles */}
              <line x1="207" y1="195" x2="207" y2="285" stroke="#e879f9" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="175" y1="242" x2="207" y2="195" stroke="#e879f9" strokeWidth="1" opacity="0.6" />
              <line x1="240" y1="242" x2="207" y2="195" stroke="#e879f9" strokeWidth="1" opacity="0.6" />
              <line x1="175" y1="242" x2="207" y2="285" stroke="#e879f9" strokeWidth="1" opacity="0.6" />
              <line x1="240" y1="242" x2="207" y2="285" stroke="#e879f9" strokeWidth="1" opacity="0.6" />

              {/* Equatorial Plate of Aligned Chromosomes (Horizontal Line at y=242) */}
              <g transform="translate(207, 242)">
                <ellipse cx="-24" cy="0" rx="7" ry="4" fill="url(#chromatinDark)" />
                <ellipse cx="-8" cy="0" rx="8" ry="4.5" fill="url(#chromatinDark)" />
                <ellipse cx="8" cy="0" rx="8" ry="4.5" fill="url(#chromatinDark)" />
                <ellipse cx="24" cy="0" rx="7" ry="4" fill="url(#chromatinDark)" />
                <line x1="-32" y1="0" x2="32" y2="0" stroke="#581c87" strokeWidth="5.5" strokeLinecap="round" />
              </g>
            </g>

            {/* 4. ANAPHASE CELL (Mid-Right, x=350, y=235) */}
            <g
              onClick={() => handlePick("anaphase")}
              className="cursor-pointer transition-opacity hover:opacity-90"
            >
              <rect
                x="290"
                y="180"
                width="125"
                height="115"
                rx="8"
                fill="url(#cellBg)"
                stroke={foundParts.has("anaphase") || (phase === "tour" && activeTourPart?.id === "anaphase") ? "#f6c453" : "#c084fc"}
                strokeWidth={foundParts.has("anaphase") || (phase === "tour" && activeTourPart?.id === "anaphase") ? 4 : 2}
              />
              {/* Spindle Poles */}
              <line x1="352" y1="190" x2="352" y2="285" stroke="#e879f9" strokeWidth="1" strokeDasharray="2 2" />

              {/* Upper Pole Migrating V-shaped Daughter Chromosomes */}
              <g transform="translate(352, 212)">
                <path d="M-22 8 L-16 0 L-10 8" fill="none" stroke="url(#chromatinDark)" strokeWidth="4.5" strokeLinecap="round" />
                <path d="M-6 8 L0 0 L6 8" fill="none" stroke="url(#chromatinDark)" strokeWidth="4.5" strokeLinecap="round" />
                <path d="M10 8 L16 0 L22 8" fill="none" stroke="url(#chromatinDark)" strokeWidth="4.5" strokeLinecap="round" />
              </g>

              {/* Lower Pole Migrating Inverted V-shaped Chromosomes */}
              <g transform="translate(352, 262)">
                <path d="M-22 -8 L-16 0 L-10 -8" fill="none" stroke="url(#chromatinDark)" strokeWidth="4.5" strokeLinecap="round" />
                <path d="M-6 -8 L0 0 L6 -8" fill="none" stroke="url(#chromatinDark)" strokeWidth="4.5" strokeLinecap="round" />
                <path d="M10 -8 L16 0 L22 -8" fill="none" stroke="url(#chromatinDark)" strokeWidth="4.5" strokeLinecap="round" />
              </g>
            </g>

            {/* 5. TELOPHASE CELL (Bottom-Left, x=200, y=375) */}
            <g
              onClick={() => handlePick("telophase")}
              className="cursor-pointer transition-opacity hover:opacity-90"
            >
              <rect
                x="140"
                y="315"
                width="125"
                height="115"
                rx="8"
                fill="url(#cellBg)"
                stroke={foundParts.has("telophase") || (phase === "tour" && activeTourPart?.id === "telophase") ? "#f6c453" : "#c084fc"}
                strokeWidth={foundParts.has("telophase") || (phase === "tour" && activeTourPart?.id === "telophase") ? 4 : 2}
              />
              {/* Upper Daughter Nucleus Forming */}
              <circle cx="202" cy="345" r="20" fill="#fae8ff" stroke="#a855f7" strokeWidth="1.5" />
              <ellipse cx="202" cy="345" rx="10" ry="8" fill="url(#chromatinDark)" opacity="0.8" />

              {/* Lower Daughter Nucleus Forming */}
              <circle cx="202" cy="400" r="20" fill="#fae8ff" stroke="#a855f7" strokeWidth="1.5" />
              <ellipse cx="202" cy="400" rx="10" ry="8" fill="url(#chromatinDark)" opacity="0.8" />
            </g>

            {/* 6. CYTOKINESIS CELL (Bottom-Right, x=335, y=370) */}
            <g
              onClick={() => handlePick("cytokinesis")}
              className="cursor-pointer transition-opacity hover:opacity-90"
            >
              <rect
                x="280"
                y="310"
                width="125"
                height="120"
                rx="8"
                fill="url(#cellBg)"
                stroke={foundParts.has("cytokinesis") || (phase === "tour" && activeTourPart?.id === "cytokinesis") ? "#f6c453" : "#c084fc"}
                strokeWidth={foundParts.has("cytokinesis") || (phase === "tour" && activeTourPart?.id === "cytokinesis") ? 4 : 2}
              />
              {/* Growing Middle Lamella / Cell Plate across equator (Phragmoplast) */}
              <line x1="282" y1="370" x2="403" y2="370" stroke="#16a34a" strokeWidth="3" strokeDasharray="5 3" />
              
              {/* Reconstituted Nuclei */}
              <circle cx="342" cy="340" r="18" fill="#f5d0fe" stroke="#9333ea" strokeWidth="1.5" />
              <circle cx="344" cy="338" r="4.5" fill="#581c87" />

              <circle cx="342" cy="400" r="18" fill="#f5d0fe" stroke="#9333ea" strokeWidth="1.5" />
              <circle cx="344" cy="398" r="4.5" fill="#581c87" />
            </g>

            {/* Anatomical Leader Line Markers */}
            {MITOSIS_CELLS.map((part, idx) => {
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
                  {/* Leader Line */}
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
          {MITOSIS_CELLS.map((part, idx) => {
            const isFound = foundParts.has(part.id);
            const isTourFocus = phase === "tour" && tourIndex === idx + 1;
            const showLabel = phase === "tour" ? isTourFocus : isFound || phase === "complete";

            return (
              <div key={part.id}>
                {/* Clickable hotspot over the cell on the slide */}
                {phase === "quiz" && !isFound && (
                  <button
                    type="button"
                    onClick={() => handlePick(part.id)}
                    aria-label={`Locate ${part.name}`}
                    className="group absolute -translate-x-1/2 -translate-y-1/2 size-11 sm:size-12 rounded-full border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/30 hover:border-purple-600 hover:scale-110 transition cursor-pointer"
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
          Biology · Class X · Mitosis in Onion Root Tip
        </span>
      </div>

      {/* PHASE 1: Practical Introduction Overlay */}
      {phase === "intro" && (
        <PracticalIntro
          subject="Biology"
          exitHref="/student/lab-game/biology"
          onStart={() => setPhase("tour")}
          brief={{
            expNo: 7,
            title: "Microscopic Observation of Mitotic Cell Division Stages in Allium cepa",
            object:
              "To observe and identify the sequential stages of mitosis (Prophase, Metaphase, Anaphase, Telophase, and Cytokinesis) under high magnification in onion root tip squash preparations.",
            theory: [
              "Mitosis is an equational cell division occurring in somatic cells, preserving constant chromosome numbers.",
              "Onion root tips contain rapidly dividing apical meristem tissue ideal for studying chromosome behavior.",
              "Stages include Prophase (chromosome condensation), Metaphase (equatorial plate alignment), Anaphase (sister chromatid separation), Telophase (nuclear reformation), and Cytokinesis (cell plate formation).",
            ],
            apparatus: [
              "Compound Light Microscope (100× & 400×)",
              "Prepared / Fresh Acetocarmine Onion Root Tip Slide",
              "Root Apical Meristem (Allium cepa)",
              "Slide, Coverslip, Filter Paper, Dissecting Needle",
            ],
          }}
          apparatus={[
            "Compound Light Microscope (100× & 400×)",
            "Prepared / Fresh Acetocarmine Onion Root Tip Slide",
            "Root Apical Meristem (Allium cepa)",
            "Slide, Coverslip, Filter Paper, Dissecting Needle",
          ]}
        />
      )}

      {/* PHASE 2: Guided Tour of All Mitotic Stages (Docked on bottom-left) */}
      {phase === "tour" && (
        <div
          data-ui
          className="pointer-events-none absolute left-2.5 sm:left-4 bottom-2.5 sm:bottom-4 z-30 flex justify-start pb-[max(0.4rem,env(safe-area-inset-bottom,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))]"
        >
          <div className="pointer-events-auto flex w-[min(92vw,350px)] sm:w-[360px] landscape:w-[min(40vw,320px)] max-h-[min(48dvh,240px)] sm:max-h-[280px] landscape:max-h-[min(70dvh,260px)] flex-col rounded-xl sm:rounded-2xl border border-white/25 bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl ring-1 ring-white/25 overflow-hidden backdrop-blur-md">
            <div className="px-3 py-1.5 sm:px-3.5 sm:py-2.5 shrink-0">
              <p className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#f6c453]">
                <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Stage {tourIndex} of {MITOSIS_CELLS.length}
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
                      if (tourIndex < MITOSIS_CELLS.length) {
                        setTourIndex((i) => i + 1);
                      } else {
                        startQuiz();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-[#f6c453] px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black text-[#0f2e12] shadow-md transition hover:bg-amber-300 active:scale-95 cursor-pointer"
                  >
                    {tourIndex < MITOSIS_CELLS.length ? (
                      <>
                        Next Stage <ChevronRight size={13} />
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
                  <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Locating Challenge · Question {quizStep + 1} of {MITOSIS_CELLS.length}
                </p>
                <h2 className="text-xs sm:text-sm font-black text-white leading-tight mt-0.5">
                  Where is the <span className="text-[#f6c453] underline decoration-[#f6c453]/60">{currentTargetPart?.name}</span>?
                </h2>
              </div>

              <div className="border-t border-white/15 bg-black/20 px-3 py-2 sm:px-3.5 sm:py-2.5 flex-1 overflow-y-auto overscroll-contain">
                <p className="text-[11px] sm:text-xs font-medium leading-relaxed text-white/90">
                  {currentTargetPart?.clue} Tap the dividing cell directly under the microscope lens.
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
              <h2 className="mt-1 text-base sm:text-xl font-black">Mitosis Stages Mastered!</h2>
              <p className="mt-0.5 text-[10px] sm:text-xs text-white/80">
                You successfully located and identified all mitotic cell division stages in the apical meristem of onion root tip.
              </p>
            </div>

            <div className="border-t border-white/15 bg-black/20 p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 overflow-y-auto overscroll-contain">
              <div className="rounded-xl sm:rounded-2xl bg-black/30 p-2.5 sm:p-3 border border-white/10 text-xs">
                <p className="font-bold text-[#f6c453] uppercase tracking-wider text-[9px] sm:text-[10px]">Mitosis Summary: 2n → 2n (Equational Division)</p>
                <div className="mt-1.5 grid grid-cols-2 gap-2 text-white/90">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                    <p className="font-bold text-white text-[10px]">Karyokinesis</p>
                    <p className="mt-0.5 text-[9px] text-white/70 leading-tight">Prophase → Metaphase → Anaphase → Telophase nuclear division</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                    <p className="font-bold text-white text-[10px]">Cytokinesis</p>
                    <p className="mt-0.5 text-[9px] text-white/70 leading-tight">Phragmoplast cell plate partitions 2 identical daughter cells</p>
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
              <p className="text-xs text-white/70">Mitosis in Onion Root Tip</p>
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
