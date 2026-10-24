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
  Flower2,
  Scissors,
  Layers,
  Info,
  CheckCircle2,
} from "lucide-react";
import LogoutSVG from "@/public/svgs/LogoutSVG";
import PracticalIntro from "../_practical/PracticalIntro";
import { playGameCorrectSound, playGameWrongSound } from "@/app/student/lab-game/_scene/labAudio";

type AppPhase = "intro" | "tour" | "quiz" | "complete";

export type FlowerPartId =
  | "calyx"
  | "corolla"
  | "stamens_outer"
  | "stamens_inner"
  | "gynoecium"
  | "thalamus"
  | "pedicel";

export type FlowerPart = {
  id: FlowerPartId;
  name: string;
  x: number;
  y: number;
  lx: number;
  ly: number;
  clue: string;
  description: string;
};

const FLOWER_PARTS: FlowerPart[] = [
  {
    id: "calyx",
    name: "Calyx (4 Sepals)",
    x: 175,
    y: 285,
    lx: 25,
    ly: 285,
    clue: "Outermost whorl of 4 green/yellow sepals arranged in two whorls (2+2) protecting the bud.",
    description:
      "The calyx consists of 4 polysepalous (free) sepals arranged in two concentric pairs (2 outer + 2 inner). They protect delicate inner floral organs during the young bud stage and perform minor photosynthesis.",
  },
  {
    id: "corolla",
    name: "Corolla (4 Cruciform Petals)",
    x: 130,
    y: 130,
    lx: 25,
    ly: 120,
    clue: "Second whorl of 4 bright yellow petals arranged in a characteristic diagonal cross (cruciform).",
    description:
      "The corolla features 4 polypetalous bright yellow petals arranged diagonally opposite each other like a Greek cross (cruciform corolla, family Cruciferae / Brassicaceae). Each petal has a narrow basal claw and an expanded spreading limb to attract insect pollinators.",
  },
  {
    id: "stamens_outer",
    name: "Outer Stamens (2 Short)",
    x: 220,
    y: 220,
    lx: 25,
    ly: 200,
    clue: "Two short lateral stamens forming the outer whorl of the tetradynamous androecium.",
    description:
      "The androecium exhibits a characteristic tetradynamous condition (6 stamens total). The 2 outer stamens have shorter filaments and are situated laterally adjacent to the nectar glands.",
  },
  {
    id: "stamens_inner",
    name: "Inner Stamens (4 Long)",
    x: 300,
    y: 170,
    lx: 380,
    ly: 130,
    clue: "Four tall stamens positioned in median pairs with dithecous yellow anthers.",
    description:
      "The 4 inner stamens have longer erect filaments arranged in an anterior-posterior pair. Their dithecous anthers dehisce longitudinally to shed copious yellow pollen grains for insect pollination.",
  },
  {
    id: "gynoecium",
    name: "Gynoecium (Pistil / Carpel)",
    x: 260,
    y: 145,
    lx: 380,
    ly: 215,
    clue: "Bicarpellary syncarpous pistil with superior ovary, style, and capitate bifid stigma.",
    description:
      "The gynoecium is bicarpellary and syncarpous (2 fused carpels) with a superior ovary. Although originally unilocular with parietal placentation, it becomes bilocular due to the formation of a false septum called the replum.",
  },
  {
    id: "thalamus",
    name: "Thalamus & Nectar Glands",
    x: 260,
    y: 330,
    lx: 380,
    ly: 320,
    clue: "Swollen receptacle apex bearing green nectar glands that secrete sugary nectar.",
    description:
      "The thalamus (receptacle) is the swollen conical stem apex on which all 4 floral whorls are inserted cyclically. Four green disc-shaped nectar glands (nectaries) secrete sweet nectar at the base of the stamens.",
  },
  {
    id: "pedicel",
    name: "Pedicel (Flower Stalk)",
    x: 260,
    y: 410,
    lx: 380,
    ly: 410,
    clue: "Slender stalk connecting individual flower to the main inflorescence raceme.",
    description:
      "The pedicel is a slender cylindrical stalk attaching the flower to the inflorescence axis (corymbose raceme), positioning the blossom optimally for honeybee pollination.",
  },
];

export default function PracticalFlowerWhorls() {
  const [phase, setPhase] = useState<AppPhase>("intro");
  const [tourIndex, setTourIndex] = useState(1);
  const [foundParts, setFoundParts] = useState<Set<FlowerPartId>>(new Set());
  const [quizStep, setQuizStep] = useState(0);
  const [feedback, setFeedback] = useState<{
    type: "correct" | "wrong";
    title: string;
  } | null>(null);

  // Quit modal
  const [showQuit, setShowQuit] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);

  const currentTargetPart = useMemo(() => {
    return FLOWER_PARTS[quizStep];
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
        colors: ["#eab308", "#facc15", "#16a34a", "#84cc16", "#0284c7"],
      });
    } catch {
      /* ignore */
    }
  }, []);

  const handlePick = useCallback(
    (partId: FlowerPartId) => {
      if (phase !== "quiz" || !currentTargetPart) return;

      if (partId === currentTargetPart.id) {
        playGameCorrectSound();
        setFoundParts((prev) => new Set([...prev, partId]));
        setFeedback({
          type: "correct",
          title: `Correct! Located ${currentTargetPart.name}`,
        });

        window.setTimeout(() => {
          if (quizStep + 1 >= FLOWER_PARTS.length) {
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

  const activeTourPart = FLOWER_PARTS[tourIndex - 1];

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
              <span className="size-2 rounded-full bg-amber-500 shadow-sm animate-pulse" />
              Floral Dissection
            </span>
            <span>Brassica campestris · Mustard Flower</span>
          </div>

          {/* Interactive SVG Diagram */}
          <svg
            viewBox="0 0 520 480"
            role="img"
            aria-label="Anatomical dissection diagram of Brassica campestris flower whorls"
            className="w-full h-full pt-4 select-none"
          >
            <defs>
              <linearGradient id="petalGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="40%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#eab308" />
              </linearGradient>

              <linearGradient id="sepalGreen" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#86efac" />
                <stop offset="100%" stopColor="#15803d" />
              </linearGradient>

              <linearGradient id="antherGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>

            {/* 7. Pedicel Floral Stalk */}
            <g
              onClick={() => handlePick("pedicel")}
              className="cursor-pointer transition-opacity hover:opacity-90"
            >
              <path
                d="M 255 350 L 255 450 C 255 455 265 455 265 450 L 265 350 Z"
                fill="#15803d"
                stroke={foundParts.has("pedicel") || (phase === "tour" && activeTourPart?.id === "pedicel") ? "#f6c453" : "#14532d"}
                strokeWidth={foundParts.has("pedicel") || (phase === "tour" && activeTourPart?.id === "pedicel") ? 4 : 2}
              />
            </g>

            {/* 6. Thalamus & Green Nectaries */}
            <g
              onClick={() => handlePick("thalamus")}
              className="cursor-pointer transition-opacity hover:opacity-90"
            >
              {/* Swollen Thalamus */}
              <ellipse
                cx="260"
                cy="335"
                rx="35"
                ry="18"
                fill="#16a34a"
                stroke={foundParts.has("thalamus") || (phase === "tour" && activeTourPart?.id === "thalamus") ? "#f6c453" : "#14532d"}
                strokeWidth={foundParts.has("thalamus") || (phase === "tour" && activeTourPart?.id === "thalamus") ? 4 : 2}
              />
              {/* Green Nectar Gland Dots */}
              <circle cx="240" cy="330" r="5" fill="#4ade80" stroke="#15803d" strokeWidth="1" />
              <circle cx="280" cy="330" r="5" fill="#4ade80" stroke="#15803d" strokeWidth="1" />
            </g>

            {/* 2. Corolla (4 Yellow Cruciform Petals) */}
            <g
              onClick={() => handlePick("corolla")}
              className="cursor-pointer transition-opacity hover:opacity-95"
            >
              {/* Top-Left Petal */}
              <path
                d="M 250 320 C 220 270 140 210 100 130 C 90 90 140 70 170 100 C 210 140 245 270 255 320 Z"
                fill="url(#petalGold)"
                stroke={foundParts.has("corolla") || (phase === "tour" && activeTourPart?.id === "corolla") ? "#f6c453" : "#ca8a04"}
                strokeWidth={foundParts.has("corolla") || (phase === "tour" && activeTourPart?.id === "corolla") ? 4 : 2}
              />
              {/* Top-Right Petal */}
              <path
                d="M 270 320 C 300 270 380 210 420 130 C 430 90 380 70 350 100 C 310 140 275 270 265 320 Z"
                fill="url(#petalGold)"
                stroke={foundParts.has("corolla") || (phase === "tour" && activeTourPart?.id === "corolla") ? "#f6c453" : "#ca8a04"}
                strokeWidth={foundParts.has("corolla") || (phase === "tour" && activeTourPart?.id === "corolla") ? 4 : 2}
              />
              {/* Left Spreading Petal */}
              <path
                d="M 245 325 C 200 315 100 260 80 210 C 65 175 110 145 140 170 C 180 210 235 290 245 325 Z"
                fill="url(#petalGold)"
                stroke={foundParts.has("corolla") || (phase === "tour" && activeTourPart?.id === "corolla") ? "#f6c453" : "#ca8a04"}
                strokeWidth={foundParts.has("corolla") || (phase === "tour" && activeTourPart?.id === "corolla") ? 4 : 2}
              />
              {/* Right Spreading Petal */}
              <path
                d="M 275 325 C 320 315 420 260 440 210 C 455 175 410 145 380 170 C 340 210 285 290 275 325 Z"
                fill="url(#petalGold)"
                stroke={foundParts.has("corolla") || (phase === "tour" && activeTourPart?.id === "corolla") ? "#f6c453" : "#ca8a04"}
                strokeWidth={foundParts.has("corolla") || (phase === "tour" && activeTourPart?.id === "corolla") ? 4 : 2}
              />
            </g>

            {/* 1. Calyx (4 Sepals) */}
            <g
              onClick={() => handlePick("calyx")}
              className="cursor-pointer transition-opacity hover:opacity-90"
            >
              {/* Outer Left Sepal */}
              <path
                d="M 240 330 C 210 320 170 300 160 270 C 170 260 210 285 245 325 Z"
                fill="url(#sepalGreen)"
                stroke={foundParts.has("calyx") || (phase === "tour" && activeTourPart?.id === "calyx") ? "#f6c453" : "#14532d"}
                strokeWidth={foundParts.has("calyx") || (phase === "tour" && activeTourPart?.id === "calyx") ? 4 : 2}
              />
              {/* Outer Right Sepal */}
              <path
                d="M 280 330 C 310 320 350 300 360 270 C 350 260 310 285 275 325 Z"
                fill="url(#sepalGreen)"
                stroke={foundParts.has("calyx") || (phase === "tour" && activeTourPart?.id === "calyx") ? "#f6c453" : "#14532d"}
                strokeWidth={foundParts.has("calyx") || (phase === "tour" && activeTourPart?.id === "calyx") ? 4 : 2}
              />
            </g>

            {/* 3. Outer 2 Short Stamens */}
            <g
              onClick={() => handlePick("stamens_outer")}
              className="cursor-pointer transition-opacity hover:opacity-90"
            >
              {/* Left Short Stamen */}
              <path d="M 245 325 Q 220 280 215 235" fill="none" stroke="#65a30d" strokeWidth="3" strokeLinecap="round" />
              <ellipse cx="215" cy="225" rx="7" ry="9" fill="url(#antherGold)" stroke="#b45309" strokeWidth="1.5" />
              
              {/* Right Short Stamen */}
              <path d="M 275 325 Q 300 280 305 235" fill="none" stroke="#65a30d" strokeWidth="3" strokeLinecap="round" />
              <ellipse cx="305" cy="225" rx="7" ry="9" fill="url(#antherGold)" stroke="#b45309" strokeWidth="1.5" />
            </g>

            {/* 4. Inner 4 Long Stamens */}
            <g
              onClick={() => handlePick("stamens_inner")}
              className="cursor-pointer transition-opacity hover:opacity-90"
            >
              {/* Inner Left Pair */}
              <path d="M 252 325 L 240 180" fill="none" stroke="#65a30d" strokeWidth="3.2" strokeLinecap="round" />
              <ellipse cx="238" cy="170" rx="8" ry="11" fill="url(#antherGold)" stroke="#b45309" strokeWidth="1.5" />

              <path d="M 255 325 L 248 165" fill="none" stroke="#65a30d" strokeWidth="3.2" strokeLinecap="round" />
              <ellipse cx="246" cy="155" rx="8" ry="11" fill="url(#antherGold)" stroke="#b45309" strokeWidth="1.5" />

              {/* Inner Right Pair */}
              <path d="M 265 325 L 272 165" fill="none" stroke="#65a30d" strokeWidth="3.2" strokeLinecap="round" />
              <ellipse cx="274" cy="155" rx="8" ry="11" fill="url(#antherGold)" stroke="#b45309" strokeWidth="1.5" />

              <path d="M 268 325 L 280 180" fill="none" stroke="#65a30d" strokeWidth="3.2" strokeLinecap="round" />
              <ellipse cx="282" cy="170" rx="8" ry="11" fill="url(#antherGold)" stroke="#b45309" strokeWidth="1.5" />
            </g>

            {/* 5. Gynoecium (Central Pistil) */}
            <g
              onClick={() => handlePick("gynoecium")}
              className="cursor-pointer transition-opacity hover:opacity-90"
            >
              {/* Superior Ovary */}
              <ellipse
                cx="260"
                cy="275"
                rx="14"
                ry="45"
                fill="#84cc16"
                stroke={foundParts.has("gynoecium") || (phase === "tour" && activeTourPart?.id === "gynoecium") ? "#f6c453" : "#3f6212"}
                strokeWidth={foundParts.has("gynoecium") || (phase === "tour" && activeTourPart?.id === "gynoecium") ? 4 : 2}
              />
              {/* Slender Style */}
              <line x1="260" y1="230" x2="260" y2="155" stroke="#4d7c0f" strokeWidth="4.5" strokeLinecap="round" />
              {/* Capitate Bifid Stigma */}
              <ellipse cx="260" cy="148" rx="8" ry="5" fill="#a3e635" stroke="#365314" strokeWidth="1.8" />
              <circle cx="257" cy="145" r="3" fill="#65a30d" />
              <circle cx="263" cy="145" r="3" fill="#65a30d" />
            </g>

            {/* Anatomical Leader Line Markers */}
            {FLOWER_PARTS.map((part, idx) => {
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
          {FLOWER_PARTS.map((part, idx) => {
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
          Biology · Class X · Floral Whorls of Brassica
        </span>
      </div>

      {/* PHASE 1: Practical Introduction Overlay */}
      {phase === "intro" && (
        <PracticalIntro
          subject="Biology"
          exitHref="/student/lab-game/biology"
          onStart={() => setPhase("tour")}
          brief={{
            expNo: 6,
            title: "Dissection and Morphological Study of Brassica campestris Floral Whorls",
            object:
              "To dissect the complete flower of Brassica campestris (Mustard) and systematically examine its four concentric floral whorls: Calyx, Corolla, Androecium, and Gynoecium.",
            theory: [
              "Brassica campestris is a complete, bisexual, actinomorphic, tetramerous flower of family Brassicaceae (Cruciferae).",
              "Calyx has 4 polysepalous sepals in two whorls; Corolla has 4 cruciform polypetalous petals arranged in the form of a cross.",
              "Androecium has 6 stamens in tetradynamous condition (2 outer short + 4 inner long stamens); Gynoecium is bicarpellary syncarpous with replum.",
            ],
            apparatus: [
              "Fresh Inflorescence of Brassica campestris (Mustard)",
              "Dissecting Microscope / Hand Magnifying Lens",
              "Dissection Needle, Forceps, and Sharp Razor Blade",
              "Glass Slide, Black Cardboard Display Strip, Water Dropper",
            ],
          }}
          apparatus={[
            "Fresh Inflorescence of Brassica campestris (Mustard)",
            "Dissecting Microscope / Hand Magnifying Lens",
            "Dissection Needle, Forceps, and Sharp Razor Blade",
            "Glass Slide, Black Cardboard Display Strip, Water Dropper",
          ]}
        />
      )}

      {/* PHASE 2: Guided Tour of Floral Whorls (Docked on bottom-left) */}
      {phase === "tour" && (
        <div
          data-ui
          className="pointer-events-none absolute left-2.5 sm:left-4 bottom-2.5 sm:bottom-4 z-30 flex justify-start pb-[max(0.4rem,env(safe-area-inset-bottom,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))]"
        >
          <div className="pointer-events-auto flex w-[min(92vw,350px)] sm:w-[360px] landscape:w-[min(40vw,320px)] max-h-[min(48dvh,240px)] sm:max-h-[280px] landscape:max-h-[min(70dvh,260px)] flex-col rounded-xl sm:rounded-2xl border border-white/25 bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl ring-1 ring-white/25 overflow-hidden backdrop-blur-md">
            <div className="px-3 py-1.5 sm:px-3.5 sm:py-2.5 shrink-0">
              <p className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#f6c453]">
                <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Whorl {tourIndex} of {FLOWER_PARTS.length}
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
                      if (tourIndex < FLOWER_PARTS.length) {
                        setTourIndex((i) => i + 1);
                      } else {
                        startQuiz();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-[#f6c453] px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black text-[#0f2e12] shadow-md transition hover:bg-amber-300 active:scale-95 cursor-pointer"
                  >
                    {tourIndex < FLOWER_PARTS.length ? (
                      <>
                        Next Whorl <ChevronRight size={13} />
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
                  <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Locating Challenge · Question {quizStep + 1} of {FLOWER_PARTS.length}
                </p>
                <h2 className="text-xs sm:text-sm font-black text-white leading-tight mt-0.5">
                  Where is the <span className="text-[#f6c453] underline decoration-[#f6c453]/60">{currentTargetPart?.name}</span>?
                </h2>
              </div>

              <div className="border-t border-white/15 bg-black/20 px-3 py-2 sm:px-3.5 sm:py-2.5 flex-1 overflow-y-auto overscroll-contain">
                <p className="text-[11px] sm:text-xs font-medium leading-relaxed text-white/90">
                  {currentTargetPart?.clue} Tap the floral organ directly on the flower dissection board.
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
              <h2 className="mt-1 text-base sm:text-xl font-black">Brassica Flower Anatomy Mastered!</h2>
              <p className="mt-0.5 text-[10px] sm:text-xs text-white/80">
                You successfully dissected and identified all four concentric floral whorls of Brassica campestris.
              </p>
            </div>

            <div className="border-t border-white/15 bg-black/20 p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 overflow-y-auto overscroll-contain">
              <div className="rounded-xl sm:rounded-2xl bg-black/30 p-2.5 sm:p-3 border border-white/10 text-xs">
                <p className="font-bold text-[#f6c453] uppercase tracking-wider text-[9px] sm:text-[10px]">Floral Formula: ⊕ ⚥ K₂₊₂ C₄ₓ A₂₊₄ G₍₂₎</p>
                <div className="mt-1.5 grid grid-cols-2 gap-2 text-white/90">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                    <p className="font-bold text-white text-[10px]">Cruciform Corolla</p>
                    <p className="mt-0.5 text-[9px] text-white/70 leading-tight">4 clawed petals arranged in Greek cross</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                    <p className="font-bold text-white text-[10px]">Tetradynamous Stamens</p>
                    <p className="mt-0.5 text-[9px] text-white/70 leading-tight">2 short outer + 4 long inner stamens</p>
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
              <p className="text-xs text-white/70">Floral Whorls of Brassica</p>
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
