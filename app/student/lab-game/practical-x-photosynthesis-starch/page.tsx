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
  Sun,
  Flame,
  Leaf,
  Droplets,
  Info,
  CheckCircle2,
} from "lucide-react";
import LogoutSVG from "@/public/svgs/LogoutSVG";
import PracticalIntro from "../_practical/PracticalIntro";
import { playGameCorrectSound, playGameWrongSound } from "@/app/student/lab-game/_scene/labAudio";

type AppPhase = "intro" | "tour" | "quiz" | "complete";

type TourStep = {
  step: number;
  title: string;
  focusId: "destarching" | "stencil" | "boiling" | "ethanol" | "iodine";
  description: string;
};

const TOUR_STEPS: TourStep[] = [
  {
    step: 1,
    title: "1. Destarching in Dark Chamber (48 Hours)",
    focusId: "destarching",
    description:
      "A potted plant is kept in complete darkness for 48 hours. In the absence of light, photosynthesis ceases and all pre-existing starch stored in leaf chloroplasts is transported to roots or consumed by cellular respiration.",
  },
  {
    step: 2,
    title: "2. Light Screen Stencil & Sunlight Exposure",
    focusId: "stencil",
    description:
      "A black paper stencil (or Ganong's light screen) is clipped over a central portion of a destarched leaf. The plant is placed in bright sunlight for 6 hours so unshaded areas can synthesize new starch.",
  },
  {
    step: 3,
    title: "3. Boiling Water Bath (Cell Lysis)",
    focusId: "boiling",
    description:
      "The detached leaf is boiled in water for 2–3 minutes. High temperature kills protoplasm, denatures enzymes to stop metabolic changes, and ruptures cell membranes to make cells permeable to reagents.",
  },
  {
    step: 4,
    title: "4. Hot Ethanol Bath (Chlorophyll Extraction)",
    focusId: "ethanol",
    description:
      "The leaf is placed in a test tube of 90% ethanol inside a hot water bath. Alcohol dissolves and extracts green chlorophyll pigments, bleaching the leaf pale white/cream so iodine staining is clearly visible.",
  },
  {
    step: 5,
    title: "5. Iodine Staining & Stencil Pattern Revelation",
    focusId: "iodine",
    description:
      "The bleached leaf is rinsed in warm water to soften it and treated with Iodine (I₂/KI) solution. Light-exposed areas turn intense Blue-Black (positive starch test), while the covered stencil area remains Pale Brown (negative starch test).",
  },
];

type Question = {
  question: string;
  options: { label: string; correct: boolean; explanation: string }[];
};

const PHOTOSYNTHESIS_QUESTIONS: Question[] = [
  {
    question: "Why must the potted plant be kept in complete darkness for 48 hours before the experiment?",
    options: [
      {
        label: "To destarch the leaves so any detected starch is synthesized during the experiment",
        correct: true,
        explanation: "Destarching ensures no residual starch remains from previous days.",
      },
      {
        label: "To kill chlorophyll pigments in all leaves",
        correct: false,
        explanation: "Chlorophyll remains intact in the dark; only starch reserves are depleted.",
      },
      {
        label: "To allow the stomata to permanently seal closed",
        correct: false,
        explanation: "Stomata open again when the plant is returned to light.",
      },
      {
        label: "To increase leaf absorption of iodine stain",
        correct: false,
        explanation: "Destarching removes stored polysaccharide carbohydrates, not to modify staining affinity.",
      },
    ],
  },
  {
    question: "Why is the leaf boiled in alcohol (ethanol) using a water bath instead of heating directly over a bunsen flame?",
    options: [
      {
        label: "Alcohol is highly flammable and its vapor catches fire easily over an open flame",
        correct: true,
        explanation: "Ethanol is volatile and flammable; heating in a water bath prevents laboratory fires.",
      },
      {
        label: "Direct flame turns the chlorophyll brown instead of extracting it",
        correct: false,
        explanation: "Water baths are strictly a laboratory safety precaution against alcohol ignition.",
      },
      {
        label: "Water bath slows down the boiling to preserve leaf shape",
        correct: false,
        explanation: "Safety from fire hazard is the fundamental reason.",
      },
      {
        label: "Ethanol only dissolves chlorophyll at exactly 100°C",
        correct: false,
        explanation: "Ethanol boils at ~78°C in a water bath, safely dissolving chlorophyll.",
      },
    ],
  },
  {
    question: "What biochemical result is observed when iodine solution is added to the treated leaf?",
    options: [
      {
        label: "Exposed areas turn Blue-Black; covered stencil area remains Pale Yellow/Brown",
        correct: true,
        explanation: "Starch forms a blue-black polyiodide complex only in regions exposed to light.",
      },
      {
        label: "The whole leaf turns bright pink with no pattern",
        correct: false,
        explanation: "Pink color change occurs with CoCl₂ paper for water, not iodine with starch.",
      },
      {
        label: "Covered areas turn Blue-Black; exposed areas turn Green",
        correct: false,
        explanation: "Covered areas lacked light and could not produce starch, remaining brown.",
      },
      {
        label: "The leaf dissolves completely in the iodine petridish",
        correct: false,
        explanation: "Iodine is a staining reagent that stains polysaccharides without dissolving tissue.",
      },
    ],
  },
  {
    question: "Which chemical equation represents oxygenic photosynthesis in green plant leaves?",
    options: [
      {
        label: "6CO₂ + 6H₂O + Light Energy (Chlorophyll) → C₆H₁₂O₆ + 6O₂",
        correct: true,
        explanation: "Carbon dioxide and water are converted into glucose and oxygen in the presence of light and chlorophyll.",
      },
      {
        label: "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP",
        correct: false,
        explanation: "This is the catabolic equation for cellular respiration.",
      },
      {
        label: "2H₂O → 2H₂ + O₂",
        correct: false,
        explanation: "This is water electrolysis, not complete photosynthesis.",
      },
      {
        label: "CO₂ + 2KOH → K₂CO₃ + H₂O",
        correct: false,
        explanation: "This is the potassium hydroxide carbon dioxide absorption reaction.",
      },
    ],
  },
];

type StarchStep = 1 | 2 | 3 | 4;

export default function PracticalPhotosynthesisStarch() {
  const [phase, setPhase] = useState<AppPhase>("intro");
  const [tourIndex, setTourIndex] = useState(1);
  const [activeStep, setActiveStep] = useState<StarchStep>(1);

  // Quiz state
  const [quizStep, setQuizStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<{
    type: "correct" | "wrong";
    title: string;
    explanation: string;
  } | null>(null);

  // Quit modal
  const [showQuit, setShowQuit] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);

  const startQuiz = useCallback(() => {
    setQuizStep(0);
    setScore(0);
    setStreak(0);
    setSelectedOption(null);
    setFeedback(null);
    setPhase("quiz");
  }, []);

  const handlePlayAgain = useCallback(() => {
    setTourIndex(1);
    setActiveStep(1);
    setQuizStep(0);
    setScore(0);
    setStreak(0);
    setSelectedOption(null);
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
        colors: ["#16a34a", "#1e3a8a", "#eab308", "#15803d", "#0284c7"],
      });
    } catch {
      /* ignore */
    }
  }, []);

  const handleAnswer = useCallback(
    (optIdx: number) => {
      if (selectedOption !== null || feedback) return;
      setSelectedOption(optIdx);

      const q = PHOTOSYNTHESIS_QUESTIONS[quizStep];
      const opt = q.options[optIdx];

      if (opt.correct) {
        playGameCorrectSound();
        setScore((s) => s + 100 + streak * 25);
        setStreak((s) => s + 1);
        setFeedback({
          type: "correct",
          title: "Outstanding! Correct Answer ✓",
          explanation: opt.explanation,
        });

        window.setTimeout(() => {
          if (quizStep + 1 >= PHOTOSYNTHESIS_QUESTIONS.length) {
            setPhase("complete");
            triggerConfetti();
          } else {
            setQuizStep((s) => s + 1);
            setSelectedOption(null);
            setFeedback(null);
          }
        }, 1500);
      } else {
        playGameWrongSound();
        setStreak(0);
        setFeedback({
          type: "wrong",
          title: "Incorrect Choice",
          explanation: opt.explanation,
        });

        window.setTimeout(() => {
          setSelectedOption(null);
          setFeedback(null);
        }, 2200);
      }
    },
    [selectedOption, feedback, quizStep, streak, triggerConfetti]
  );

  const activeTourStep = TOUR_STEPS[tourIndex - 1];

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

      {/* Main Photosynthesis Experiment Visual Area (Shifted to right on landscape & desktop) */}
      <div className="absolute inset-0 flex items-center justify-center landscape:justify-end landscape:pr-[3vw] sm:landscape:pr-[6vw] sm:justify-end sm:pr-8 md:pr-12 lg:pr-16 pt-14 sm:pt-0 pointer-events-none">
        <div className="pointer-events-auto relative w-full max-w-[min(94vw,580px)] sm:max-w-[640px] max-h-[min(72dvh,540px)] sm:max-h-[min(86dvh,600px)] flex flex-col rounded-3xl bg-white/95 p-3.5 sm:p-5 shadow-[0_12px_45px_rgba(0,0,0,0.12),0_0_80px_rgba(0,95,2,0.08)] border border-white/80 ring-1 ring-[#005f02]/20 backdrop-blur-md transition-all duration-500 ease-out overflow-y-auto overscroll-contain">
          
          {/* Header Banner */}
          <div className="flex items-center justify-between border-b border-black/5 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-[#005f02]/10 px-2.5 py-0.5 text-[10px] sm:text-xs font-black text-[#005f02]">
                <Sun size={13} className="text-amber-500" /> Starch Stencil Assay
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-black/50">Light Necessity in Photosynthesis</span>
            </div>
            <span className="text-[10px] sm:text-xs font-black text-[#005f02]">
              Class X · Practical 4
            </span>
          </div>

          {/* Sequential 4-Step Lab Process Tabs */}
          <div className="grid grid-cols-4 gap-1.5 mb-3 bg-[#f8faf8] p-1.5 rounded-2xl border border-black/5">
            {[
              { id: 1 as StarchStep, label: "1. Stencil & Sun", icon: "☀️" },
              { id: 2 as StarchStep, label: "2. Boiling Water", icon: "🫕" },
              { id: 3 as StarchStep, label: "3. Alcohol Bath", icon: "🧪" },
              { id: 4 as StarchStep, label: "4. Iodine Test", icon: "🧫" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStep(tab.id)}
                className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer text-center ${
                  activeStep === tab.id
                    ? "bg-[#005f02] text-white shadow-sm font-black"
                    : "bg-black/5 text-black/60 hover:bg-black/10 font-bold"
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                <span className="text-[9px] sm:text-[10px] mt-0.5 whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Interactive Step Visualization Graphic */}
          <div className="relative w-full aspect-[540/320] bg-gradient-to-b from-[#fbfdfb] to-[#edf7ee] rounded-2xl border border-black/10 shadow-inner overflow-hidden p-2">
            <svg
              viewBox="0 0 540 320"
              className="w-full h-full select-none"
              role="img"
              aria-label="Leaf Starch Test Assay Step Illustration"
            >
              <defs>
                <linearGradient id="leafGreen" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#4ade80" />
                  <stop offset="60%" stopColor="#16a34a" />
                  <stop offset="100%" stopColor="#15803d" />
                </linearGradient>

                <linearGradient id="leafBleached" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fef3c7" />
                  <stop offset="100%" stopColor="#fde68a" />
                </linearGradient>

                <linearGradient id="iodineStain" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1e1b4b" />
                  <stop offset="40%" stopColor="#172554" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>

                <radialGradient id="sunGlowAssay">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="80%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="rgba(250,204,21,0)" />
                </radialGradient>
              </defs>

              {/* Lab Bench Base */}
              <rect x="20" y="290" width="500" height="18" rx="4" fill="#cadfd2" opacity="0.6" />
              <line x1="10" y1="290" x2="530" y2="290" stroke="#9bb8a6" strokeWidth="2" />

              {/* STEP 1: Leaf on Plant with Stencil & Sunlight */}
              {activeStep === 1 && (
                <g className="animate-in fade-in duration-300">
                  {/* Glowing Sun in Sky */}
                  <circle cx="90" cy="55" r="34" fill="url(#sunGlowAssay)" />
                  <circle cx="90" cy="55" r="20" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
                  <text x="90" y="105" textAnchor="middle" fill="#854d0e" fontSize="10" fontWeight="800">
                    ☀️ Sunlight (6 Hours)
                  </text>

                  {/* Healthy Green Leaf */}
                  <g transform="translate(290, 160)">
                    {/* Leaf Shape */}
                    <path
                      d="M-150 0 C-120 -80 60 -85 140 0 C60 85 -120 80 -150 0 Z"
                      fill="url(#leafGreen)"
                      stroke="#14532d"
                      strokeWidth="2.5"
                    />
                    {/* Midrib & Veins */}
                    <path d="M-150 0 L140 0" stroke="#86efac" strokeWidth="3" />
                    <path d="M-90 0 Q-70 -35 -40 -45 M-40 0 Q-20 -40 10 -50 M20 0 Q40 -40 70 -45" stroke="#86efac" strokeWidth="1.5" />
                    <path d="M-90 0 Q-70 35 -40 45 M-40 0 Q-20 40 10 50 M20 0 Q40 40 70 45" stroke="#86efac" strokeWidth="1.5" />

                    {/* Black Paper Stencil Clip across center */}
                    <rect x="-35" y="-85" width="70" height="170" fill="#0f172a" stroke="#334155" strokeWidth="2" rx="4" />
                    {/* Paper clip pins */}
                    <rect x="-30" y="-88" width="60" height="6" fill="#94a3b8" rx="2" />
                    <rect x="-30" y="82" width="60" height="6" fill="#94a3b8" rx="2" />

                    {/* Stencil Cutout Pattern (Star/Cross shape in center of black paper) */}
                    <text x="0" y="8" textAnchor="middle" fill="#facc15" fontSize="26" fontWeight="900">
                      ★
                    </text>
                  </g>

                  {/* Explanatory Annotations */}
                  <g transform="translate(290, 40)">
                    <rect x="-110" y="0" width="220" height="24" rx="12" fill="#005f02" opacity="0.9" />
                    <text x="0" y="16" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800">
                      Black Paper Strip blocks light to central leaf area
                    </text>
                  </g>
                </g>
              )}

              {/* STEP 2: Boiling Water Bath */}
              {activeStep === 2 && (
                <g className="animate-in fade-in duration-300">
                  {/* Bunsen Burner & Blue Flame */}
                  <rect x="245" y="245" width="50" height="45" rx="3" fill="#475569" />
                  <ellipse cx="270" cy="245" rx="14" ry="4" fill="#334155" />
                  <path d="M260 245 Q270 215 270 205 Q270 215 280 245 Z" fill="#38bdf8" opacity="0.85" className="animate-pulse" />
                  <path d="M264 245 Q270 225 270 218 Q270 225 276 245 Z" fill="#fef08a" />

                  {/* Tripod Stand & Wire Gauze */}
                  <line x1="210" y1="205" x2="330" y2="205" stroke="#334155" strokeWidth="4" />
                  <line x1="220" y1="205" x2="190" y2="290" stroke="#334155" strokeWidth="4" />
                  <line x1="320" y1="205" x2="350" y2="290" stroke="#334155" strokeWidth="4" />

                  {/* Glass Beaker with Boiling Water */}
                  <rect x="205" y="95" width="130" height="110" rx="6" fill="rgba(255,255,255,0.7)" stroke="#336644" strokeWidth="2.5" />
                  <rect x="208" y="125" width="124" height="78" rx="3" fill="#bae6fd" opacity="0.75" />
                  {/* Boiling water bubbles & steam */}
                  <circle cx="235" cy="170" r="4" fill="#ffffff" className="animate-bounce" />
                  <circle cx="295" cy="160" r="4.5" fill="#ffffff" className="animate-bounce" />
                  <circle cx="265" cy="140" r="3.5" fill="#ffffff" className="animate-bounce" />
                  <path d="M240 90 Q245 70 240 50 M270 85 Q275 65 270 45 M300 90 Q305 70 300 50" stroke="#94a3b8" strokeWidth="1.8" fill="none" opacity="0.6" strokeDasharray="3 3" />

                  {/* Submerged Leaf */}
                  <g transform="translate(270, 160) scale(0.45)">
                    <path d="M-150 0 C-120 -80 60 -85 140 0 C60 85 -120 80 -150 0 Z" fill="#16a34a" stroke="#14532d" strokeWidth="4" />
                  </g>

                  {/* Explanatory Banner */}
                  <g transform="translate(270, 25)">
                    <rect x="-140" y="0" width="280" height="24" rx="12" fill="#005f02" opacity="0.9" />
                    <text x="0" y="16" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800">
                      Boiling in water kills cell protoplasm and ruptures membranes
                    </text>
                  </g>
                </g>
              )}

              {/* STEP 3: Hot Ethanol Decolorization Bath */}
              {activeStep === 3 && (
                <g className="animate-in fade-in duration-300">
                  {/* Water Bath Beaker */}
                  <rect x="180" y="110" width="180" height="175" rx="6" fill="rgba(255,255,255,0.7)" stroke="#336644" strokeWidth="2.5" />
                  <rect x="183" y="150" width="174" height="132" rx="3" fill="#e0f2fe" opacity="0.8" />
                  <text x="210" y="270" fill="#0369a1" fontSize="9" fontWeight="800">Hot Water Bath (Safe Indirect Heating)</text>

                  {/* Boiling Tube containing Ethanol */}
                  <rect x="250" y="70" width="40" height="180" rx="16" fill="rgba(255,255,255,0.9)" stroke="#15803d" strokeWidth="2" />
                  {/* Green-tinted ethanol dissolving chlorophyll */}
                  <rect x="253" y="130" width="34" height="116" rx="10" fill="#86efac" opacity="0.85" />
                  <circle cx="270" cy="180" r="3" fill="#16a34a" />
                  <circle cx="265" cy="155" r="2.5" fill="#16a34a" />

                  {/* Bleached White Leaf inside tube */}
                  <g transform="translate(270, 190) rotate(75) scale(0.28)">
                    <path d="M-150 0 C-120 -80 60 -85 140 0 C60 85 -120 80 -150 0 Z" fill="url(#leafBleached)" stroke="#d97706" strokeWidth="3" />
                  </g>

                  {/* Banner */}
                  <g transform="translate(270, 25)">
                    <rect x="-140" y="0" width="280" height="24" rx="12" fill="#005f02" opacity="0.9" />
                    <text x="0" y="16" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800">
                      Alcohol extracts green chlorophyll pigments from leaf
                    </text>
                  </g>
                </g>
              )}

              {/* STEP 4: Iodine Starch Pattern Petridish */}
              {activeStep === 4 && (
                <g className="animate-in fade-in duration-300">
                  {/* Glass Petridish Base */}
                  <ellipse cx="270" cy="165" rx="190" ry="110" fill="rgba(255,255,255,0.9)" stroke="#336644" strokeWidth="3" />
                  <ellipse cx="270" cy="165" rx="180" ry="102" fill="#fef9c3" opacity="0.5" />

                  {/* Iodine Dropper Icon */}
                  <g transform="translate(110, 60)">
                    <rect x="0" y="0" width="100" height="24" rx="12" fill="#854d0e" opacity="0.9" />
                    <text x="50" y="16" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="800">
                      🧪 Iodine (I₂/KI) Staining
                    </text>
                  </g>

                  {/* Leaf with Distinct Stencil Starch Pattern */}
                  <g transform="translate(270, 165)">
                    {/* Base Leaf: Bleached Pale Yellow/Brown (Negative Starch in covered zone) */}
                    <path
                      d="M-130 0 C-105 -70 50 -75 120 0 C50 75 -105 70 -130 0 Z"
                      fill="url(#leafBleached)"
                      stroke="#b45309"
                      strokeWidth="2"
                    />

                    {/* Left Exposed Section: Intense Blue-Black Starch */}
                    <path
                      d="M-130 0 C-105 -70 -30 -72 -30 0 C-30 72 -105 70 -130 0 Z"
                      fill="url(#iodineStain)"
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />

                    {/* Right Exposed Section: Intense Blue-Black Starch */}
                    <path
                      d="M30 0 C30 -72 50 -75 120 0 C50 75 30 72 30 0 Z"
                      fill="url(#iodineStain)"
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />

                    {/* Midrib Line */}
                    <path d="M-130 0 L120 0" stroke="#d97706" strokeWidth="2" opacity="0.7" />

                    {/* Star Cutout exposed to light in center: Blue-Black */}
                    <text x="0" y="9" textAnchor="middle" fill="#0f172a" fontSize="28" fontWeight="900">
                      ★
                    </text>

                    {/* Indicator Callouts */}
                    {/* Blue-black callout */}
                    <g transform="translate(70, -60)">
                      <rect x="0" y="0" width="115" height="22" rx="6" fill="#0f172a" opacity="0.95" />
                      <text x="57" y="15" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="900">
                        Blue-Black (Starch ✓)
                      </text>
                    </g>
                    {/* Pale brown callout */}
                    <g transform="translate(-15, 60)">
                      <rect x="0" y="0" width="115" height="22" rx="6" fill="#854d0e" opacity="0.95" />
                      <text x="57" y="15" textAnchor="middle" fill="#fef08a" fontSize="9" fontWeight="900">
                        Pale Brown (No Starch ✗)
                      </text>
                    </g>
                  </g>

                  {/* Final Conclusion Header */}
                  <g transform="translate(270, 25)">
                    <rect x="-145" y="0" width="290" height="24" rx="12" fill="#005f02" opacity="0.9" />
                    <text x="0" y="16" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800">
                      Light is Essential for Starch Synthesis in Photosynthesis
                    </text>
                  </g>
                </g>
              )}
            </svg>
          </div>

          {/* Biological Principle Summary Card */}
          <div className="mt-3 rounded-2xl bg-[#005f02]/5 border border-[#005f02]/15 p-2.5 sm:p-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-[#005f02] mb-1">
              <Info size={14} /> Photosynthetic Photochemistry:
            </div>
            <p className="text-[11px] sm:text-xs text-[#183c29]/90 leading-relaxed">
              <span className="font-extrabold text-[#005f02]">6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂</span>. Light energy excites chlorophyll electrons in thylakoid photosystems to produce ATP & NADPH. Only illuminated leaf zones synthesize starch, turning <span className="font-bold text-indigo-900">Blue-Black with Iodine (I₂/KI)</span>.
            </p>
          </div>
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
          Biology · Class X · Photosynthesis Starch Assay
        </span>
      </div>

      {/* PHASE 1: Practical Introduction Overlay */}
      {phase === "intro" && (
        <PracticalIntro
          subject="Biology"
          exitHref="/student/lab-game/biology"
          onStart={() => setPhase("tour")}
          brief={{
            expNo: 4,
            title: "Demonstration of Light Necessity in Foliar Starch Synthesis",
            object:
              "To prove that sunlight is essential for photosynthesis by testing starch synthesis in light-exposed vs light-shielded zones of a destarched leaf using the iodine assay.",
            theory: [
              "Green plants convert light energy into chemical energy to synthesize glucose, which is stored as starch granules.",
              "Destarching for 48 hours empties pre-existing starch stores so newly formed starch can be directly correlated to light exposure.",
              "Alcohol extraction dissolves green chlorophyll pigment so blue-black coloration with iodine solution can be clearly identified.",
            ],
            apparatus: [
              "Destarched Potted Plant (48h dark acclimatized)",
              "Black Paper Stencil Light Screen & Clips",
              "Beaker & Water Bath Setup",
              "Boiling Tube with 90% Ethanol (Alcohol)",
              "Iodine Solution (I₂/KI reagent)",
              "Petridish, Forceps, and Dropper",
              "Bunsen Burner, Tripod Stand, Wire Gauze",
            ],
          }}
          apparatus={[
            "Destarched Potted Plant (48h dark acclimatized)",
            "Black Paper Stencil Light Screen & Clips",
            "Beaker & Water Bath Setup",
            "Boiling Tube with 90% Ethanol (Alcohol)",
            "Iodine Solution (I₂/KI reagent)",
            "Petridish, Forceps, and Dropper",
            "Bunsen Burner, Tripod Stand, Wire Gauze",
          ]}
        />
      )}

      {/* PHASE 2: Guided Tour Modal (Docked on bottom-left) */}
      {phase === "tour" && (
        <div
          data-ui
          className="pointer-events-none absolute left-2.5 sm:left-4 bottom-2.5 sm:bottom-4 z-30 flex justify-start pb-[max(0.4rem,env(safe-area-inset-bottom,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))]"
        >
          <div className="pointer-events-auto flex w-[min(92vw,350px)] sm:w-[360px] landscape:w-[min(40vw,320px)] max-h-[min(48dvh,240px)] sm:max-h-[280px] landscape:max-h-[min(70dvh,260px)] flex-col rounded-xl sm:rounded-2xl border border-white/25 bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl ring-1 ring-white/25 overflow-hidden backdrop-blur-md">
            <div className="px-3 py-1.5 sm:px-3.5 sm:py-2.5 shrink-0">
              <p className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#f6c453]">
                <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Step {tourIndex} of {TOUR_STEPS.length}
              </p>
              <h2 className="text-xs sm:text-base font-black leading-tight text-white mt-0.5">
                {activeTourStep.title}
              </h2>
            </div>

            <div className="border-t border-white/15 bg-black/20 px-3 py-2 sm:px-3.5 sm:py-2.5 flex-1 overflow-y-auto overscroll-contain flex flex-col justify-between gap-2">
              <p className="text-[11px] sm:text-xs font-medium leading-relaxed text-white/95">
                {activeTourStep.description}
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
                      if (tourIndex < TOUR_STEPS.length) {
                        setTourIndex((i) => i + 1);
                      } else {
                        startQuiz();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-[#f6c453] px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black text-[#0f2e12] shadow-md transition hover:bg-amber-300 active:scale-95 cursor-pointer"
                  >
                    {tourIndex < TOUR_STEPS.length ? (
                      <>
                        Next Concept <ChevronRight size={13} />
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

      {/* PHASE 3: Gamified Challenge Quiz */}
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
            <div className="pointer-events-auto flex w-[min(92vw,350px)] sm:w-[380px] landscape:w-[min(42vw,350px)] max-h-[min(50dvh,260px)] sm:max-h-[300px] landscape:max-h-[min(70dvh,280px)] flex-col rounded-xl sm:rounded-2xl border border-white/25 bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl ring-1 ring-white/25 overflow-hidden backdrop-blur-md">
              <div className="px-3 py-1.5 sm:px-3.5 sm:py-2 shrink-0">
                <p className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#f6c453]">
                  <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Photosynthesis Challenge · Q{quizStep + 1} of {PHOTOSYNTHESIS_QUESTIONS.length}
                </p>
                <h2 className="text-xs sm:text-sm font-black text-white leading-tight mt-0.5">
                  {PHOTOSYNTHESIS_QUESTIONS[quizStep].question}
                </h2>
              </div>

              <div className="border-t border-white/15 bg-black/20 p-2 sm:p-2.5 flex-1 overflow-y-auto overscroll-contain space-y-1.5">
                {PHOTOSYNTHESIS_QUESTIONS[quizStep].options.map((opt, idx) => {
                  const isChosen = selectedOption === idx;
                  const showResult = isChosen && feedback;

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={selectedOption !== null}
                      onClick={() => handleAnswer(idx)}
                      className={`w-full text-left rounded-lg sm:rounded-xl px-2.5 py-1.5 text-[11px] sm:text-xs font-bold transition flex items-center justify-between border cursor-pointer ${
                        showResult
                          ? feedback?.type === "correct"
                            ? "bg-emerald-500/90 border-emerald-300 text-white shadow-md"
                            : "bg-rose-500/90 border-rose-300 text-white shadow-md"
                          : "bg-white/10 hover:bg-white/20 border-white/15 text-white/90"
                      }`}
                    >
                      <span className="flex-1">{opt.label}</span>
                      {showResult && (
                        <span className="shrink-0 ml-1.5">
                          {feedback?.type === "correct" ? <Check size={13} /> : <X size={13} />}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* PHASE 4: Completion Modal (Docked on Left so it does not overlap actual data) */}
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
              <h2 className="mt-1 text-base sm:text-xl font-black">Photosynthesis Starch Assay Mastered!</h2>
              <p className="mt-0.5 text-[10px] sm:text-xs text-white/80">
                You successfully verified that light is indispensable for photosynthetic starch synthesis.
              </p>
            </div>

            <div className="border-t border-white/15 bg-black/20 p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 overflow-y-auto overscroll-contain">
              <div className="rounded-xl sm:rounded-2xl bg-black/30 p-2.5 sm:p-3 border border-white/10 text-xs">
                <p className="font-bold text-[#f6c453] uppercase tracking-wider text-[9px] sm:text-[10px]">Biochemical Findings</p>
                <div className="mt-1.5 grid grid-cols-2 gap-2 text-white/90">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-center">
                    <p className="text-[9px] text-white/60">Light Exposed Zones</p>
                    <p className="text-sm font-black text-indigo-400">Blue-Black (Starch ✓)</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-center">
                    <p className="text-[9px] text-white/60">Covered Stencil Zone</p>
                    <p className="text-sm font-black text-amber-400">Pale Brown (No Starch)</p>
                  </div>
                </div>

                <div className="mt-2 p-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/80 leading-snug">
                  <p className="font-bold text-white mb-0.5">Scientific Conclusion:</p>
                  Chloroplast light reactions convert solar photons into ATP & NADPH, driving the Calvin cycle to generate hexose sugars and polymeric amylose starch.
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
              <p className="text-xs text-white/70">Photosynthesis Starch Assay</p>
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
