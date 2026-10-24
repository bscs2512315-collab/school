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
  Flame,
  Sprout,
  Thermometer,
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
  focusId: "flask_a" | "flask_b" | "thermometer" | "vacuum_jacket" | "formalin";
  description: string;
};

const TOUR_STEPS: TourStep[] = [
  {
    step: 1,
    title: "1. Vacuum Thermos Flask A (Live Germinating Seeds)",
    focusId: "flask_a",
    description:
      "Flask A contains live germinating pea or gram seeds. As cellular respiration proceeds, glucose is oxidized and a substantial portion of chemical bond energy is released as heat energy (exothermic process).",
  },
  {
    step: 2,
    title: "2. Precision Mercury Thermometer",
    focusId: "thermometer",
    description:
      "A sensitive 0–100°C mercury thermometer is inverted through the cotton plug with its sensing bulb buried deep among the respiring seeds to detect small thermal changes accurately.",
  },
  {
    step: 3,
    title: "3. Double-Walled Vacuum Insulation",
    focusId: "vacuum_jacket",
    description:
      "Vacuum thermos flasks feature a double-walled silvered glass jacket with an evacuated air gap. This prevents heat loss via conduction and convection, ensuring all generated heat is retained.",
  },
  {
    step: 4,
    title: "4. Cotton Wool Stopper",
    focusId: "formalin",
    description:
      "A non-absorbent cotton wool plug seals the mouth. Unlike a solid rubber cork, porous cotton allows atmospheric oxygen diffusion while preventing convective air currents and heat loss.",
  },
  {
    step: 5,
    title: "5. Control Flask B (Boiled Seeds + Antiseptic)",
    focusId: "flask_b",
    description:
      "Flask B contains boiled dead seeds soaked in 1% carbolic acid or formalin. Boiled seeds have denatured respiratory enzymes and antiseptic prevents bacterial decomposition, ensuring zero temperature change.",
  },
];

type Question = {
  question: string;
  options: { label: string; correct: boolean; explanation: string }[];
};

const HEAT_QUESTIONS: Question[] = [
  {
    question: "Why does the temperature rise significantly in Flask A containing germinating seeds?",
    options: [
      {
        label: "Cellular respiration is an exothermic reaction that releases energy as heat",
        correct: true,
        explanation: "During ATP synthesis from glucose breakdown, approximately 60% of metabolic energy dissipates as heat.",
      },
      {
        label: "The seeds absorb sunlight from the laboratory room",
        correct: false,
        explanation: "The reaction occurs in the dark inside insulated thermos flasks without photosynthesis.",
      },
      {
        label: "Water evaporation from the seeds creates hot vapor",
        correct: false,
        explanation: "Evaporation is an endothermic (cooling) process, not a warming mechanism.",
      },
      {
        label: "The thermometer glass reacts chemically with seed coats",
        correct: false,
        explanation: "Thermometers are chemically inert glass instruments that passively measure thermal kinetic energy.",
      },
    ],
  },
  {
    question: "What is the purpose of using double-walled vacuum flasks instead of standard glass beakers?",
    options: [
      {
        label: "To prevent heat dissipation through conduction and convection",
        correct: true,
        explanation: "Vacuum between silvered walls blocks thermal transfer, allowing generated heat to accumulate.",
      },
      {
        label: "To speed up the seed germination rate by 10 times",
        correct: false,
        explanation: "Thermos flasks do not accelerate germination; they simply measure and retain heat.",
      },
      {
        label: "To filter out carbon dioxide from escaping into the room",
        correct: false,
        explanation: "Gas filtration is not the function of vacuum-insulated flasks.",
      },
      {
        label: "To provide artificial light for the germinating seeds",
        correct: false,
        explanation: "Thermos flasks are opaque or silvered and provide no illumination.",
      },
    ],
  },
  {
    question: "Why are boiled seeds in Flask B treated with antiseptic (formalin / carbolic acid)?",
    options: [
      {
        label: "To kill bacteria and fungi so bacterial decay does not generate false heat",
        correct: true,
        explanation: "Microbial decomposition is also exothermic; antiseptic ensures only seed metabolism is tested.",
      },
      {
        label: "To revive the enzymes killed during boiling",
        correct: false,
        explanation: "Formalin is a biocide that denatures proteins and preserves specimens.",
      },
      {
        label: "To increase the moisture level in the control flask",
        correct: false,
        explanation: "Antiseptic is used strictly for microbial sterilization.",
      },
      {
        label: "To dye the seeds for visual differentiation",
        correct: false,
        explanation: "Formalin is a clear solution used for antimicrobial protection.",
      },
    ],
  },
  {
    question: "Why is a cotton wool plug used at the flask neck rather than a solid rubber stopper?",
    options: [
      {
        label: "It permits air/oxygen diffusion while preventing convective heat loss",
        correct: true,
        explanation: "Porous cotton allows aerobic respiration to continue while insulating the flask mouth.",
      },
      {
        label: "Cotton generates heat energy to warm the seeds",
        correct: false,
        explanation: "Cotton is an insulator and cannot generate thermal energy.",
      },
      {
        label: "Rubber stoppers react violently with formalin vapor",
        correct: false,
        explanation: "Rubber is used in other experiments; cotton is chosen here specifically for aeration.",
      },
      {
        label: "To prevent moisture from condensing on the seeds",
        correct: false,
        explanation: "Germinating seeds require continuous moisture to maintain turgor and cellular respiration.",
      },
    ],
  },
];

export default function PracticalRespirationHeat() {
  const [phase, setPhase] = useState<AppPhase>("intro");
  const [tourIndex, setTourIndex] = useState(1);
  const [hoursElapsed, setHoursElapsed] = useState(12);
  const [activeFlask, setActiveFlask] = useState<"A" | "B">("A");

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
    setActiveFlask("A");
    setHoursElapsed(12);
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
        colors: ["#ea580c", "#f97316", "#eab308", "#16a34a", "#0284c7"],
      });
    } catch {
      /* ignore */
    }
  }, []);

  const handleAnswer = useCallback(
    (optIdx: number) => {
      if (selectedOption !== null || feedback) return;
      setSelectedOption(optIdx);

      const q = HEAT_QUESTIONS[quizStep];
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
          if (quizStep + 1 >= HEAT_QUESTIONS.length) {
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

  // Temperature calculation
  // Ambient room temp: 24.0°C
  // Flask A rises from 24.0°C (0h) up to 37.5°C (24h)
  const tempA = Math.min(38.0, 24.0 + (hoursElapsed / 24) * 13.5);
  // Flask B remains steady at 24.0°C ± 0.2°C
  const tempB = 24.0;
  const currentTemp = activeFlask === "A" ? tempA : tempB;

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

      {/* Main Calorimetric Apparatus (Shifted to right on landscape & desktop) */}
      <div className="absolute inset-0 flex items-center justify-center landscape:justify-end landscape:pr-[3vw] sm:landscape:pr-[6vw] sm:justify-end sm:pr-8 md:pr-12 lg:pr-16 pt-14 sm:pt-0 pointer-events-none">
        <div className="pointer-events-auto relative w-full max-w-[min(94vw,580px)] sm:max-w-[640px] max-h-[min(72dvh,540px)] sm:max-h-[min(86dvh,600px)] flex flex-col rounded-3xl bg-white/95 p-3.5 sm:p-5 shadow-[0_12px_45px_rgba(0,0,0,0.12),0_0_80px_rgba(0,95,2,0.08)] border border-white/80 ring-1 ring-[#005f02]/20 backdrop-blur-md transition-all duration-500 ease-out overflow-y-auto overscroll-contain">
          
          {/* Header Banner */}
          <div className="flex items-center justify-between border-b border-black/5 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-[#005f02]/10 px-2.5 py-0.5 text-[10px] sm:text-xs font-black text-[#005f02]">
                <Flame size={13} className="text-orange-600" /> Calorimetric Respirometry
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-black/50">Heat Release in Respiration</span>
            </div>
            <span className="text-[10px] sm:text-xs font-black text-[#005f02]">
              Class X · Practical 2
            </span>
          </div>

          {/* Time & Flask Selector Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-[#f8faf8] p-2 sm:p-2.5 rounded-2xl border border-black/5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveFlask("A")}
                className={`rounded-xl px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-black transition cursor-pointer ${
                  activeFlask === "A"
                    ? "bg-[#ea580c] text-white shadow-sm"
                    : "bg-black/5 text-black/60 hover:bg-black/10"
                }`}
              >
                🔥 Flask A (Live Seeds)
              </button>
              <button
                type="button"
                onClick={() => setActiveFlask("B")}
                className={`rounded-xl px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-black transition cursor-pointer ${
                  activeFlask === "B"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "bg-black/5 text-black/60 hover:bg-black/10"
                }`}
              >
                ❄️ Flask B (Boiled Control)
              </button>
            </div>

            {/* Time Timelapse Slider */}
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-black/60">
                <Timer size={12} className="text-[#ea580c]" /> {hoursElapsed} Hours
              </span>
              <input
                type="range"
                min="0"
                max="24"
                step="2"
                value={hoursElapsed}
                onChange={(e) => setHoursElapsed(Number(e.target.value))}
                className="w-20 sm:w-28 accent-[#ea580c] cursor-pointer"
              />
            </div>
          </div>

          {/* Dual Vacuum Flask SVG Apparatus */}
          <div className="relative w-full aspect-[540/320] bg-gradient-to-b from-[#fbf8f5] to-[#f4ebe1] rounded-2xl border border-black/10 shadow-inner overflow-hidden p-2">
            <svg
              viewBox="0 0 540 320"
              className="w-full h-full select-none"
              role="img"
              aria-label="Thermos Flask Respiration Setup showing Inverted Vacuum Flasks with embedded Thermometers"
            >
              <defs>
                <linearGradient id="thermosSilver" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#e2e8f0" />
                  <stop offset="30%" stopColor="#cbd5e1" />
                  <stop offset="70%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>

                <linearGradient id="mercuryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>

                <radialGradient id="heatGlow">
                  <stop offset="0%" stopColor="rgba(249, 115, 22, 0.4)" />
                  <stop offset="60%" stopColor="rgba(249, 115, 22, 0.1)" />
                  <stop offset="100%" stopColor="rgba(249, 115, 22, 0)" />
                </radialGradient>
              </defs>

              {/* Lab Stand & Base Plate */}
              <rect x="20" y="290" width="500" height="18" rx="4" fill="#cadfd2" opacity="0.6" />
              <line x1="10" y1="290" x2="530" y2="290" stroke="#9bb8a6" strokeWidth="2" />

              {/* === CENTRAL FLASK DISPLAY === */}
              {/* Retort Stand Clamp Arm */}
              <line x1="160" y1="10" x2="160" y2="290" stroke="#475569" strokeWidth="6" strokeLinecap="round" />
              <rect x="120" y="285" width="80" height="12" rx="3" fill="#334155" />
              <line x1="160" y1="130" x2="225" y2="130" stroke="#475569" strokeWidth="4" />
              <circle cx="160" cy="130" r="6" fill="#1e293b" />
              {/* Clamp Grip */}
              <path d="M225 105 C240 105 240 155 225 155" fill="none" stroke="#475569" strokeWidth="5" />

              {/* Inverted Vacuum Thermos Flask */}
              <g
                transform="translate(270, 40)"
                className={`transition-all duration-300 ${
                  phase === "tour" && (activeTourStep.focusId === "flask_a" || activeTourStep.focusId === "flask_b")
                    ? "filter drop-shadow-[0_0_12px_rgba(246,196,83,0.9)]"
                    : ""
                }`}
              >
                {/* Heat Energy Glow inside live flask */}
                {activeFlask === "A" && hoursElapsed > 0 && (
                  <ellipse cx="0" cy="95" rx="58" ry="75" fill="url(#heatGlow)" className="animate-pulse" />
                )}

                {/* Outer Silvered Vacuum Wall */}
                <path
                  d="M-52 35 C-52 5 -35 -15 0 -15 C35 -15 52 5 52 35 L52 145 C52 175 35 185 18 190 L-18 190 C-35 185 -52 175 -52 145 Z"
                  fill="url(#thermosSilver)"
                  stroke="#475569"
                  strokeWidth="2.5"
                />

                {/* Inner Vacuum Gap Line */}
                <path
                  d="M-44 35 C-44 12 -28 -7 0 -7 C28 -7 44 12 44 35 L44 140 C44 165 30 175 14 180 L-14 180 C-30 175 -44 165 -44 140 Z"
                  fill="rgba(255,255,255,0.85)"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                />

                {/* Cotton Wool Stopper at Inverted Neck (Bottom) */}
                <path d="M-18 178 Q0 188 18 178 L14 205 Q0 212 -14 205 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />

                {/* Seeds inside flask */}
                {activeFlask === "A" ? (
                  // Living Germinating Seeds with Sprouting Radicles
                  <g>
                    {[
                      { x: -28, y: 55 }, { x: -8, y: 50 }, { x: 14, y: 52 }, { x: 30, y: 60 },
                      { x: -32, y: 80 }, { x: -12, y: 76 }, { x: 10, y: 78 }, { x: 32, y: 85 },
                      { x: -25, y: 105 }, { x: -5, y: 102 }, { x: 18, y: 106 },
                      { x: -20, y: 130 }, { x: 0, y: 128 }, { x: 22, y: 132 },
                      { x: -12, y: 155 }, { x: 10, y: 156 }
                    ].map((s, idx) => (
                      <g key={idx}>
                        <circle cx={s.x} cy={s.y} r="7.5" fill="#854d0e" stroke="#3e2101" strokeWidth="1" />
                        <path
                          d={`M${s.x + 2} ${s.y - 1} Q${s.x + 7} ${s.y - 6} ${s.x + 5} ${s.y - 10}`}
                          fill="none"
                          stroke="#84cc16"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </g>
                    ))}
                  </g>
                ) : (
                  // Boiled Dead Seeds (Dark, wrinkled, formalin soaked)
                  <g>
                    {[
                      { x: -28, y: 55 }, { x: -8, y: 50 }, { x: 14, y: 52 }, { x: 30, y: 60 },
                      { x: -32, y: 80 }, { x: -12, y: 76 }, { x: 10, y: 78 }, { x: 32, y: 85 },
                      { x: -25, y: 105 }, { x: -5, y: 102 }, { x: 18, y: 106 },
                      { x: -20, y: 130 }, { x: 0, y: 128 }, { x: 22, y: 132 },
                      { x: -12, y: 155 }, { x: 10, y: 156 }
                    ].map((s, idx) => (
                      <g key={idx}>
                        <circle cx={s.x} cy={s.y} r="7.2" fill="#4b5563" stroke="#1f2937" strokeWidth="1" />
                        <line x1={s.x - 3} y1={s.y} x2={s.x + 3} y2={s.y} stroke="#374151" strokeWidth="1" />
                      </g>
                    ))}
                  </g>
                )}

                {/* === INVERTED MERCURY THERMOMETER === */}
                <g
                  className={`transition-all duration-300 ${
                    phase === "tour" && activeTourStep.focusId === "thermometer"
                      ? "filter drop-shadow-[0_0_10px_rgba(246,196,83,1)]"
                      : ""
                  }`}
                >
                  {/* Thermometer Glass Stem penetrating through cotton plug */}
                  <rect x="-3" y="45" width="6" height="195" rx="3" fill="rgba(255,255,255,0.9)" stroke="#475569" strokeWidth="1.2" />
                  
                  {/* Thermometer Bulb embedded in center of seeds */}
                  <circle cx="0" cy="45" r="6" fill="#ef4444" stroke="#991b1b" strokeWidth="1.2" />

                  {/* Red Mercury Column */}
                  {/* Column length dynamically maps from temp 24°C (y=160) to 38°C (y=65) */}
                  <line
                    x1="0"
                    y1="45"
                    x2="0"
                    y2={190 - ((currentTemp - 20) / 25) * 120}
                    stroke="url(#mercuryGrad)"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />

                  {/* Calibration Ticks on Thermometer Stem */}
                  {[-10, 0, 10, 20, 30, 40, 50].map((t, i) => {
                    const yPos = 190 - ((t - 20) / 25) * 120;
                    if (yPos < 55 || yPos > 230) return null;
                    return (
                      <g key={i}>
                        <line x1="3" y1={yPos} x2="7" y2={yPos} stroke="#1e293b" strokeWidth="0.8" />
                      </g>
                    );
                  })}
                </g>
              </g>

              {/* Dynamic Temperature Dial & Readout Card */}
              <g transform="translate(380, 85)">
                <rect x="0" y="0" width="130" height="78" rx="14" fill="#005f02" opacity="0.95" />
                <circle cx="28" cy="38" r="18" fill="#ffffff" opacity="0.15" />
                <text x="28" y="44" textAnchor="middle" fill="#f6c453" fontSize="18" fontWeight="900">
                  🌡️
                </text>
                <text x="56" y="24" fill="#f6c453" fontSize="9" fontWeight="900" letterSpacing="0.05em">
                  TEMPERATURE
                </text>
                <text x="56" y="48" fill="#ffffff" fontSize="22" fontWeight="900">
                  {currentTemp.toFixed(1)}°C
                </text>
                <text x="56" y="64" fill="rgba(255,255,255,0.75)" fontSize="8.5" fontWeight="700">
                  {activeFlask === "A" ? `+${(tempA - 24.0).toFixed(1)}°C rise` : "Steady (ambient)"}
                </text>
              </g>

              {/* Badges and Indicator Labels */}
              <g transform="translate(215, 275)">
                <rect x="0" y="0" width="110" height="22" rx="11" fill="#005f02" opacity="0.9" />
                <text x="55" y="14" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">
                  {activeFlask === "A" ? "🌱 Flask A: Live Seeds" : "🍂 Flask B: Control"}
                </text>
              </g>
            </svg>
          </div>

          {/* Biological Principle Summary Card */}
          <div className="mt-3 rounded-2xl bg-[#005f02]/5 border border-[#005f02]/15 p-2.5 sm:p-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-[#005f02] mb-1">
              <Info size={14} /> Biochemical Thermodynamics:
            </div>
            <p className="text-[11px] sm:text-xs text-[#183c29]/90 leading-relaxed">
              Respiration is an <span className="font-extrabold text-orange-700">exothermic oxidation process</span> (<span className="font-bold">C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + Heat</span>). Thermal energy released by active mitochondrial enzymes raises internal flask temperature, while control dead seeds exhibit no heat output.
            </p>
          </div>
        </div>
      </div>

      {/* Lab Header Controls (Top Left: Exit Lab, Top Center: Subject & Title) */}
      <div data-ui className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between p-2.5 sm:p-4">
        <button
          type="button"
          onClick={() => setShowQuit(true)}
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-3 py-1.5 text-xs font-bold text-[#183c29] shadow-sm backdrop-blur-md transition hover:bg-white active:scale-95 cursor-pointer"
        >
          <LogoutSVG /> Exit Lab
        </button>

        <span className="pointer-events-auto rounded-full border border-amber-300/70 bg-[#3c301a]/90 px-3.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-100 shadow-md backdrop-blur-md">
          Biology · Class X · Respiration Heat Energy
        </span>
      </div>

      {/* PHASE 1: Practical Introduction Overlay */}
      {phase === "intro" && (
        <PracticalIntro
          subject="Biology"
          exitHref="/student/lab-game/biology"
          onStart={() => setPhase("tour")}
          brief={{
            expNo: 2,
            title: "Demonstration of Exothermic Energy Release during Aerobic Respiration",
            object:
              "To investigate the exothermic thermodynamics of cellular respiration in germinating seeds and measure temperature changes using double-walled vacuum thermos flasks.",
            theory: [
              "Cellular respiration is an exothermic biochemical process releasing energy partly trapped as ATP and partly dissipated as heat.",
              "Vacuum thermos flasks minimize heat loss through conduction and radiation.",
              "Live germinating seeds show a significant temperature increase (up to 37.5°C) compared to boiled antiseptic control seeds.",
            ],
            apparatus: [
              "2 Double-Walled Vacuum Thermos Flasks (Flask A & B)",
              "Germinating Gram Seeds (Live respiring sample)",
              "Boiled Dead Gram Seeds (Control sample)",
              "1% Formalin / Carbolic Acid (Antiseptic solution)",
              "2 Precision 0–100°C Mercury Thermometers",
              "Porous Non-Absorbent Cotton Wool Plugs",
              "2 Retort Stands with Clamps",
            ],
          }}
          apparatus={[
            "2 Double-Walled Vacuum Thermos Flasks (Flask A & B)",
            "Germinating Gram Seeds (Live respiring sample)",
            "Boiled Dead Gram Seeds (Control sample)",
            "1% Formalin / Carbolic Acid (Antiseptic solution)",
            "2 Precision 0–100°C Mercury Thermometers",
            "Porous Non-Absorbent Cotton Wool Plugs",
            "2 Retort Stands with Clamps",
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
                  <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Respiration Heat Challenge · Q{quizStep + 1} of {HEAT_QUESTIONS.length}
                </p>
                <h2 className="text-xs sm:text-sm font-black text-white leading-tight mt-0.5">
                  {HEAT_QUESTIONS[quizStep].question}
                </h2>
              </div>

              <div className="border-t border-white/15 bg-black/20 p-2 sm:p-2.5 flex-1 overflow-y-auto overscroll-contain space-y-1.5">
                {HEAT_QUESTIONS[quizStep].options.map((opt, idx) => {
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
              <h2 className="mt-1 text-base sm:text-xl font-black">Respiration Thermodynamics Mastered!</h2>
              <p className="mt-0.5 text-[10px] sm:text-xs text-white/80">
                You successfully verified that cellular respiration is an exothermic reaction releasing metabolic heat.
              </p>
            </div>

            <div className="border-t border-white/15 bg-black/20 p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 overflow-y-auto overscroll-contain">
              <div className="rounded-xl sm:rounded-2xl bg-black/30 p-2.5 sm:p-3 border border-white/10 text-xs">
                <p className="font-bold text-[#f6c453] uppercase tracking-wider text-[9px] sm:text-[10px]">Thermal Summary</p>
                <div className="mt-1.5 grid grid-cols-2 gap-2 text-white/90">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-center">
                    <p className="text-[9px] text-white/60">Live Seeds Temp</p>
                    <p className="text-sm font-black text-orange-400">{tempA.toFixed(1)}°C</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-center">
                    <p className="text-[9px] text-white/60">Control Temp</p>
                    <p className="text-sm font-black text-emerald-400">{tempB.toFixed(1)}°C</p>
                  </div>
                </div>

                <div className="mt-2 p-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/80 leading-snug">
                  <p className="font-bold text-white mb-0.5">Thermodynamic Law:</p>
                  Energy transfer during metabolic reactions is not 100% efficient; unused chemical potential energy is dissipated into the environment as heat energy.
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
              <p className="text-xs text-white/70">Respiration Heat Energy</p>
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
