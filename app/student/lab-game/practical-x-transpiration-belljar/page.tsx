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
  Droplet,
  Droplets,
  Sun,
  Layers,
  Info,
  Timer,
  CheckCircle2,
} from "lucide-react";
import LogoutSVG from "@/public/svgs/LogoutSVG";
import PracticalIntro from "../_practical/PracticalIntro";
import { playGameCorrectSound, playGameWrongSound } from "@/app/student/lab-game/_scene/labAudio";

type AppPhase = "intro" | "tour" | "quiz" | "complete";

type TourStep = {
  step: number;
  title: string;
  focusId: "bell_jar" | "plant" | "polythene" | "droplets" | "cocl2_paper";
  description: string;
};

const TOUR_STEPS: TourStep[] = [
  {
    step: 1,
    title: "1. Well-Watered Potted Plant",
    focusId: "plant",
    description:
      "A healthy, leafy potted plant is used for the experiment. Living plant leaves absorb water through roots and conduct it via xylem vessels to foliar mesophyll cells.",
  },
  {
    step: 2,
    title: "2. Polythene Pot Enclosure",
    focusId: "polythene",
    description:
      "The entire soil surface and earthen pot are tightly tied in a waterproof polythene bag up to the base of the stem. This ensures any water evaporated into the bell jar comes solely from the plant leaves, not from soil evaporation.",
  },
  {
    step: 3,
    title: "3. Airtight Glass Bell Jar",
    focusId: "bell_jar",
    description:
      "A clear glass bell jar covers the plant on a smooth glass plate. The rim of the bell jar is sealed with petroleum jelly (vaseline) to create an airtight experimental chamber.",
  },
  {
    step: 4,
    title: "4. Condensation of Water Droplets",
    focusId: "droplets",
    description:
      "Water vapor transpired through microscopic leaf stomata accumulates in the enclosed air. Upon touching the cooler inner glass surface of the bell jar, it condenses into visible liquid water droplets.",
  },
  {
    step: 5,
    title: "5. Cobalt Chloride (CoCl₂) Test Strip",
    focusId: "cocl2_paper",
    description:
      "Dry blue Cobalt Chloride (CoCl₂) paper is applied to the condensed droplets. Contact with moisture rapidly turns the paper from dry blue to hydrated pink (CoCl₂ + 6H₂O → CoCl₂·6H₂O), chemically confirming the liquid is water.",
  },
];

type Question = {
  question: string;
  options: { label: string; correct: boolean; explanation: string }[];
};

const TRANSPIRATION_QUESTIONS: Question[] = [
  {
    question: "Why is the pot and soil wrapped tightly in a polythene bag before placing under the bell jar?",
    options: [
      {
        label: "To prevent direct evaporation of water from the moist soil into the bell jar",
        correct: true,
        explanation: "Wrapping the pot ensures that 100% of the condensed water droplets originate from foliar transpiration.",
      },
      {
        label: "To prevent root respiration gases from escaping",
        correct: false,
        explanation: "The polythene is used specifically to stop soil water evaporation.",
      },
      {
        label: "To keep the plant warm during nighttime photosynthesis",
        correct: false,
        explanation: "Polythene prevents moisture loss, not for thermal incubation.",
      },
      {
        label: "To protect the earthenware pot from cracking under vacuum pressure",
        correct: false,
        explanation: "The bell jar is at atmospheric pressure; wrapping is purely for moisture containment.",
      },
    ],
  },
  {
    question: "What color change confirms that condensed droplets inside the bell jar are water using CoCl₂ paper?",
    options: [
      {
        label: "Blue (anhydrous) turns Pink (hydrated CoCl₂·6H₂O)",
        correct: true,
        explanation: "Anhydrous CoCl₂ is blue and turns pink upon binding 6 water molecules of hydration.",
      },
      {
        label: "Pink turns Dark Blue",
        correct: false,
        explanation: "Heating pink hydrated paper drives off water to turn it blue, not contact with water.",
      },
      {
        label: "Yellow turns Bright Red",
        correct: false,
        explanation: "CoCl₂ paper transitions between blue and pink.",
      },
      {
        label: "Colorless turns Deep Purple",
        correct: false,
        explanation: "Starch turns blue-black with iodine; CoCl₂ specifically turns pink with water.",
      },
    ],
  },
  {
    question: "Through which leaf microscopic structures does the vast majority (90%) of transpiration occur?",
    options: [
      {
        label: "Stomatal pores regulated by guard cells in leaf epidermis",
        correct: true,
        explanation: "Stomata account for over 90% of total foliar transpiration (stomatal transpiration).",
      },
      {
        label: "Bark lenticels on woody stems",
        correct: false,
        explanation: "Lenticular transpiration accounts for only ~1% of water loss in woody plants.",
      },
      {
        label: "Waxy cuticle covering the upper leaf epidermis",
        correct: false,
        explanation: "Cuticular transpiration is very minor (3–10%) because the waxy cuticle is hydrophobic.",
      },
      {
        label: "Root hair zone in the soil",
        correct: false,
        explanation: "Root hairs absorb water; they do not transpire vapor into the air.",
      },
    ],
  },
  {
    question: "What is the expected observation in the control setup where an empty polythene-covered pot is placed under a bell jar?",
    options: [
      {
        label: "The inner glass walls remain completely dry with zero water droplets",
        correct: true,
        explanation: "Without a living transpiring plant, no water vapor is produced to condense on the bell jar.",
      },
      {
        label: "The bell jar fills with red moisture immediately",
        correct: false,
        explanation: "No water is present without a plant.",
      },
      {
        label: "The glass becomes cloudy due to carbon dioxide",
        correct: false,
        explanation: "CO₂ gas is invisible and does not condense into liquid droplets at room temperature.",
      },
      {
        label: "The bell jar shatters from negative vacuum pressure",
        correct: false,
        explanation: "The control setup maintains constant atmospheric equilibrium.",
      },
    ],
  },
];

export default function PracticalTranspirationBellJar() {
  const [phase, setPhase] = useState<AppPhase>("intro");
  const [tourIndex, setTourIndex] = useState(1);
  const [hoursElapsed, setHoursElapsed] = useState(2);
  const [isControl, setIsControl] = useState(false);
  const [cocl2Tested, setCocl2Tested] = useState(false);

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
    setIsControl(false);
    setHoursElapsed(2);
    setCocl2Tested(false);
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
        colors: ["#0284c7", "#38bdf8", "#ec4899", "#16a34a", "#f59e0b"],
      });
    } catch {
      /* ignore */
    }
  }, []);

  const handleAnswer = useCallback(
    (optIdx: number) => {
      if (selectedOption !== null || feedback) return;
      setSelectedOption(optIdx);

      const q = TRANSPIRATION_QUESTIONS[quizStep];
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
          if (quizStep + 1 >= TRANSPIRATION_QUESTIONS.length) {
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

  // Droplet density based on hours (0 to 4 hrs)
  const dropletCount = isControl ? 0 : Math.min(24, Math.floor(hoursElapsed * 6));

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

      {/* Main Bell Jar Transpiration Workbench (Shifted to right on landscape & desktop) */}
      <div className="absolute inset-0 flex items-center justify-center landscape:justify-end landscape:pr-[3vw] sm:landscape:pr-[6vw] sm:justify-end sm:pr-8 md:pr-12 lg:pr-16 pt-14 sm:pt-0 pointer-events-none">
        <div className="pointer-events-auto relative w-full max-w-[min(94vw,580px)] sm:max-w-[640px] max-h-[min(72dvh,540px)] sm:max-h-[min(86dvh,600px)] flex flex-col rounded-3xl bg-white/95 p-3.5 sm:p-5 shadow-[0_12px_45px_rgba(0,0,0,0.12),0_0_80px_rgba(0,95,2,0.08)] border border-white/80 ring-1 ring-[#005f02]/20 backdrop-blur-md transition-all duration-500 ease-out overflow-y-auto overscroll-contain">
          
          {/* Header Banner */}
          <div className="flex items-center justify-between border-b border-black/5 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-[#005f02]/10 px-2.5 py-0.5 text-[10px] sm:text-xs font-black text-[#005f02]">
                <Droplets size={13} className="text-sky-600" /> Bell Jar Potometer
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-black/50">Foliar Stomatal Transpiration</span>
            </div>
            <span className="text-[10px] sm:text-xs font-black text-[#005f02]">
              Class X · Practical 3
            </span>
          </div>

          {/* Setup Controls & CoCl₂ Paper Test Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-[#f8faf8] p-2 sm:p-2.5 rounded-2xl border border-black/5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsControl(false);
                  setCocl2Tested(false);
                }}
                className={`rounded-xl px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-black transition cursor-pointer ${
                  !isControl
                    ? "bg-[#005f02] text-white shadow-sm"
                    : "bg-black/5 text-black/60 hover:bg-black/10"
                }`}
              >
                🌿 Experimental Setup (Plant)
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsControl(true);
                  setCocl2Tested(false);
                }}
                className={`rounded-xl px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-black transition cursor-pointer ${
                  isControl
                    ? "bg-slate-700 text-white shadow-sm"
                    : "bg-black/5 text-black/60 hover:bg-black/10"
                }`}
              >
                🪨 Control Setup (No Plant)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-black/60">
                <Timer size={12} className="text-sky-600" /> {hoursElapsed} Hours
              </span>
              <input
                type="range"
                min="0"
                max="4"
                step="1"
                value={hoursElapsed}
                onChange={(e) => setHoursElapsed(Number(e.target.value))}
                className="w-16 sm:w-24 accent-sky-600 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setCocl2Tested((v) => !v)}
                className={`rounded-xl px-2.5 py-1 text-[10px] sm:text-xs font-black transition flex items-center gap-1 cursor-pointer ${
                  cocl2Tested
                    ? "bg-pink-600 text-white shadow-sm"
                    : "bg-sky-600 text-white hover:bg-sky-700 shadow-sm"
                }`}
              >
                🧪 {cocl2Tested ? "CoCl₂: Pink (Hydrated)" : "Apply CoCl₂ Paper"}
              </button>
            </div>
          </div>

          {/* Bell Jar Apparatus SVG Illustration */}
          <div className="relative w-full aspect-[540/320] bg-gradient-to-b from-[#f0f9ff] to-[#e0f2fe] rounded-2xl border border-black/10 shadow-inner overflow-hidden p-2">
            <svg
              viewBox="0 0 540 320"
              className="w-full h-full select-none"
              role="img"
              aria-label="Bell Jar Transpiration Setup showing Potted Plant with Polythene Covered Pot and Condensation Droplets"
            >
              <defs>
                <linearGradient id="glassWall" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                  <stop offset="20%" stopColor="rgba(224,242,254,0.3)" />
                  <stop offset="80%" stopColor="rgba(224,242,254,0.35)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.75)" />
                </linearGradient>

                <linearGradient id="potClay" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#c2410c" />
                  <stop offset="100%" stopColor="#9a3412" />
                </linearGradient>

                <radialGradient id="sunGlow">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="70%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="rgba(250,204,21,0)" />
                </radialGradient>
              </defs>

              {/* Lab Bench Glass Plate */}
              <rect x="60" y="275" width="420" height="12" rx="4" fill="#94a3b8" opacity="0.6" />
              <line x1="40" y1="287" x2="500" y2="287" stroke="#64748b" strokeWidth="2" />
              {/* Vaseline seal ring */}
              <rect x="135" y="272" width="270" height="4" rx="2" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />

              {/* Sun Light Source (Top Left) */}
              <circle cx="65" cy="45" r="28" fill="url(#sunGlow)" />
              <circle cx="65" cy="45" r="16" fill="#facc15" stroke="#eab308" strokeWidth="2" />

              {/* === CENTRAL APPARATUS === */}
              {/* 1. Polythene Wrapped Pot (Center x=270) */}
              <g
                className={`transition-all duration-300 ${
                  phase === "tour" && activeTourStep.focusId === "polythene"
                    ? "filter drop-shadow-[0_0_10px_rgba(246,196,83,0.9)]"
                    : ""
                }`}
              >
                {/* Earthen Terracotta Pot */}
                <polygon points="230,220 310,220 298,272 242,272" fill="url(#potClay)" stroke="#7c2d12" strokeWidth="2" />
                {/* Pot Rim */}
                <rect x="224" y="214" width="92" height="8" rx="3" fill="#ea580c" stroke="#9a3412" strokeWidth="1.5" />

                {/* Waterproof Polythene Sheet Tied around Pot with String */}
                <path
                  d="M220 212 C220 210 250 206 265 204 L275 204 C290 206 320 210 320 212 L308 273 C306 275 234 275 232 273 Z"
                  fill="rgba(255,255,255,0.7)"
                  stroke="#38bdf8"
                  strokeWidth="1.8"
                  strokeDasharray="4 2"
                />
                {/* String Knot at stem base */}
                <ellipse cx="270" cy="204" rx="14" ry="4" fill="#0284c7" />
                <path d="M260 204 Q255 212 250 216 M280 204 Q285 212 290 216" stroke="#0369a1" strokeWidth="1.8" fill="none" />
              </g>

              {/* 2. Potted Plant Foliage (Stem, branches, lush leaves) */}
              {!isControl && (
                <g
                  className={`transition-all duration-300 ${
                    phase === "tour" && activeTourStep.focusId === "plant"
                      ? "filter drop-shadow-[0_0_10px_rgba(246,196,83,0.9)]"
                      : ""
                  }`}
                >
                  {/* Main stem */}
                  <path d="M270 204 L270 115" stroke="#15803d" strokeWidth="6" strokeLinecap="round" />
                  
                  {/* Leaf Branches with detailed lamina and veins */}
                  {/* Left Bottom Leaf */}
                  <g transform="translate(268, 175) rotate(-35)">
                    <path d="M0 0 Q-28 -18 -45 -12 Q-55 5 0 0" fill="#16a34a" stroke="#14532d" strokeWidth="1.5" />
                    <line x1="0" y1="0" x2="-45" y2="-10" stroke="#86efac" strokeWidth="1" />
                  </g>
                  {/* Right Bottom Leaf */}
                  <g transform="translate(272, 165) rotate(35)">
                    <path d="M0 0 Q28 -18 45 -12 Q55 5 0 0" fill="#16a34a" stroke="#14532d" strokeWidth="1.5" />
                    <line x1="0" y1="0" x2="45" y2="-10" stroke="#86efac" strokeWidth="1" />
                  </g>
                  {/* Left Middle Leaf */}
                  <g transform="translate(268, 140) rotate(-45)">
                    <path d="M0 0 Q-32 -20 -50 -15 Q-60 6 0 0" fill="#22c55e" stroke="#14532d" strokeWidth="1.5" />
                    <line x1="0" y1="0" x2="-50" y2="-12" stroke="#bbf7d0" strokeWidth="1" />
                  </g>
                  {/* Right Middle Leaf */}
                  <g transform="translate(272, 130) rotate(42)">
                    <path d="M0 0 Q32 -20 50 -15 Q60 6 0 0" fill="#22c55e" stroke="#14532d" strokeWidth="1.5" />
                    <line x1="0" y1="0" x2="50" y2="-12" stroke="#bbf7d0" strokeWidth="1" />
                  </g>
                  {/* Top Apex Shoot Leaves */}
                  <g transform="translate(270, 115)">
                    <path d="M0 0 Q-15 -35 -2 -42 Q15 -35 0 0" fill="#4ade80" stroke="#15803d" strokeWidth="1.5" />
                    <path d="M-4 0 Q-22 -22 -35 -24 Q-22 -6 -4 0" fill="#22c55e" stroke="#14532d" strokeWidth="1.5" />
                    <path d="M4 0 Q22 -22 35 -24 Q22 -6 4 0" fill="#22c55e" stroke="#14532d" strokeWidth="1.5" />
                  </g>

                  {/* Microscopic Transpiration Vapor Trails (Animated upward streams) */}
                  {hoursElapsed > 0 && (
                    <g opacity="0.6" className="animate-pulse">
                      <path d="M225 155 Q220 135 228 115 Q235 95 230 75" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                      <path d="M315 145 Q320 125 312 105 Q305 85 310 65" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                      <path d="M270 95 Q265 75 275 55" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                    </g>
                  )}
                </g>
              )}

              {/* 3. Glass Bell Jar Covering the Setup */}
              <g
                className={`transition-all duration-300 ${
                  phase === "tour" && activeTourStep.focusId === "bell_jar"
                    ? "filter drop-shadow-[0_0_12px_rgba(246,196,83,0.9)]"
                    : ""
                }`}
              >
                {/* Bell Jar Dome & Body */}
                <path
                  d="M145 272 L145 100 C145 35 200 25 270 25 C340 25 395 35 395 100 L395 272 Z"
                  fill="url(#glassWall)"
                  stroke="#38bdf8"
                  strokeWidth="2.8"
                />

                {/* Top Glass Knob / Handle */}
                <ellipse cx="270" cy="22" rx="14" ry="7" fill="rgba(255,255,255,0.8)" stroke="#0284c7" strokeWidth="2" />
                <rect x="264" y="24" width="12" height="6" fill="#38bdf8" />
              </g>

              {/* 4. Condensed Liquid Water Droplets on Inner Glass Wall */}
              <g
                className={`transition-all duration-300 ${
                  phase === "tour" && activeTourStep.focusId === "droplets"
                    ? "filter drop-shadow-[0_0_10px_rgba(246,196,83,1)]"
                    : ""
                }`}
              >
                {[
                  { cx: 160, cy: 95, r: 3.5 },
                  { cx: 155, cy: 135, r: 4.2 },
                  { cx: 162, cy: 175, r: 4.8 },
                  { cx: 158, cy: 215, r: 5.2 },
                  { cx: 164, cy: 250, r: 4.5 },
                  { cx: 380, cy: 95, r: 3.5 },
                  { cx: 385, cy: 135, r: 4.2 },
                  { cx: 378, cy: 175, r: 4.8 },
                  { cx: 382, cy: 215, r: 5.2 },
                  { cx: 376, cy: 250, r: 4.5 },
                  { cx: 195, cy: 55, r: 3.8 },
                  { cx: 235, cy: 40, r: 4.0 },
                  { cx: 270, cy: 38, r: 4.2 },
                  { cx: 305, cy: 40, r: 4.0 },
                  { cx: 345, cy: 55, r: 3.8 },
                  { cx: 180, cy: 80, r: 3.2 },
                  { cx: 360, cy: 80, r: 3.2 },
                  { cx: 170, cy: 150, r: 4.0 },
                  { cx: 370, cy: 150, r: 4.0 },
                  { cx: 172, cy: 190, r: 4.5 },
                  { cx: 368, cy: 190, r: 4.5 },
                  { cx: 175, cy: 235, r: 4.2 },
                  { cx: 365, cy: 235, r: 4.2 },
                  { cx: 215, cy: 50, r: 3.5 }
                ].slice(0, dropletCount).map((d, i) => (
                  <g key={i}>
                    <circle cx={d.cx} cy={d.cy} r={d.r} fill="#0284c7" stroke="#bae6fd" strokeWidth="1" opacity="0.85" />
                    <circle cx={d.cx - d.r * 0.3} cy={d.cy - d.r * 0.3} r={d.r * 0.35} fill="#ffffff" opacity="0.9" />
                  </g>
                ))}
              </g>

              {/* 5. Cobalt Chloride (CoCl₂) Test Strip */}
              <g
                transform="translate(398, 140)"
                className={`transition-all duration-300 ${
                  phase === "tour" && activeTourStep.focusId === "cocl2_paper"
                    ? "filter drop-shadow-[0_0_10px_rgba(246,196,83,1)]"
                    : ""
                }`}
              >
                {/* Paper Strip Body */}
                <rect
                  x="0"
                  y="0"
                  width="118"
                  height="44"
                  rx="10"
                  fill={cocl2Tested ? "#db2777" : "#0284c7"}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-colors duration-500 shadow-md"
                />
                <text x="59" y="16" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="900">
                  CoCl₂ PAPER STRIP
                </text>
                <text x="59" y="32" textAnchor="middle" fill="#fef08a" fontSize="11" fontWeight="900">
                  {cocl2Tested ? "HYDRATED PINK (Water ✓)" : "ANHYDROUS BLUE (Dry)"}
                </text>
              </g>

              {/* Apparatus Title Badge */}
              <g transform="translate(210, 290)">
                <rect x="0" y="0" width="120" height="20" rx="10" fill="#005f02" opacity="0.9" />
                <text x="60" y="13" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">
                  {!isControl ? "🌿 Experimental Plant" : "🪨 Control (No Plant)"}
                </text>
              </g>
            </svg>
          </div>

          {/* Biological Principle Summary Card */}
          <div className="mt-3 rounded-2xl bg-[#005f02]/5 border border-[#005f02]/15 p-2.5 sm:p-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-[#005f02] mb-1">
              <Info size={14} /> Foliar Transpiration Mechanism:
            </div>
            <p className="text-[11px] sm:text-xs text-[#183c29]/90 leading-relaxed">
              Transpiration pull drives ascending sap in xylem. Water evaporates from spongy mesophyll cells into substomatal chambers and diffuses out via <span className="font-bold text-[#005f02]">stomatal pores</span>. Enclosed vapor condenses on cold glass, confirmed by <span className="font-bold text-pink-700">CoCl₂ (Blue) + 6H₂O → CoCl₂·6H₂O (Pink)</span>.
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
          Biology · Class X · Bell Jar Transpiration
        </span>
      </div>

      {/* PHASE 1: Practical Introduction Overlay */}
      {phase === "intro" && (
        <PracticalIntro
          subject="Biology"
          exitHref="/student/lab-game/biology"
          onStart={() => setPhase("tour")}
          brief={{
            expNo: 3,
            title: "Demonstration of Stomatal Transpiration in Potted Plants using a Bell Jar",
            object:
              "To demonstrate foliar water transpiration under an airtight glass bell jar, observe condensation on glass walls, and verify water chemically using anhydrous cobalt chloride test strips.",
            theory: [
              "Transpiration is the biological loss of water in the form of water vapor from aerial plant parts, mainly leaves through stomata.",
              "Enclosing the pot in a polythene bag prevents evaporation from soil, isolating transpiration from the foliage.",
              "Transpired water vapor condenses on the cold inner glass bell jar, turning dry blue Cobalt Chloride (CoCl₂) paper pink.",
            ],
            apparatus: [
              "Well-watered Leafy Potted Plant",
              "Transparent Glass Bell Jar with Top Knob",
              "Flat Smooth Glass Plate Base",
              "Waterproof Polythene Sheet & String",
              "Petroleum Jelly (Vaseline for airtight seal)",
              "Dry Blue Cobalt Chloride (CoCl₂) Test Strips",
              "Control Bell Jar (with covered empty pot)",
            ],
          }}
          apparatus={[
            "Well-watered Leafy Potted Plant",
            "Transparent Glass Bell Jar with Top Knob",
            "Flat Smooth Glass Plate Base",
            "Waterproof Polythene Sheet & String",
            "Petroleum Jelly (Vaseline for airtight seal)",
            "Dry Blue Cobalt Chloride (CoCl₂) Test Strips",
            "Control Bell Jar (with covered empty pot)",
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
                  <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Transpiration Challenge · Q{quizStep + 1} of {TRANSPIRATION_QUESTIONS.length}
                </p>
                <h2 className="text-xs sm:text-sm font-black text-white leading-tight mt-0.5">
                  {TRANSPIRATION_QUESTIONS[quizStep].question}
                </h2>
              </div>

              <div className="border-t border-white/15 bg-black/20 p-2 sm:p-2.5 flex-1 overflow-y-auto overscroll-contain space-y-1.5">
                {TRANSPIRATION_QUESTIONS[quizStep].options.map((opt, idx) => {
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
              <h2 className="mt-1 text-base sm:text-xl font-black">Foliar Transpiration Mastered!</h2>
              <p className="mt-0.5 text-[10px] sm:text-xs text-white/80">
                You successfully verified foliar stomatal transpiration and confirmed water condensation with Cobalt Chloride paper.
              </p>
            </div>

            <div className="border-t border-white/15 bg-black/20 p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 overflow-y-auto overscroll-contain">
              <div className="rounded-xl sm:rounded-2xl bg-black/30 p-2.5 sm:p-3 border border-white/10 text-xs">
                <p className="font-bold text-[#f6c453] uppercase tracking-wider text-[9px] sm:text-[10px]">Experimental Findings</p>
                <div className="mt-1.5 grid grid-cols-2 gap-2 text-white/90">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-center">
                    <p className="text-[9px] text-white/60">Droplet Density</p>
                    <p className="text-sm font-black text-sky-400">{dropletCount} Droplets</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-center">
                    <p className="text-[9px] text-white/60">CoCl₂ Test</p>
                    <p className="text-sm font-black text-pink-400">Pink (Positive ✓)</p>
                  </div>
                </div>

                <div className="mt-2 p-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/80 leading-snug">
                  <p className="font-bold text-white mb-0.5">Physiological Conclusion:</p>
                  Transpiration pull creates negative xylem tension, causing water vapor loss through foliar stomata. Condensation on cooler glass confirms continuous transpirational water flux.
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
              <p className="text-xs text-white/70">Bell Jar Foliar Transpiration</p>
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
