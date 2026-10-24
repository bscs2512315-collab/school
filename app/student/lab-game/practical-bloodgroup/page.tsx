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
  Users,
  PieChart as PieIcon,
  Droplet,
} from "lucide-react";
import LogoutSVG from "@/public/svgs/LogoutSVG";
import PracticalIntro from "../_practical/PracticalIntro";
import { playGameCorrectSound, playGameWrongSound } from "@/app/student/lab-game/_scene/labAudio";

type AppPhase = "intro" | "tour" | "quiz" | "complete";
type Group = "A" | "B" | "AB" | "O";

const GROUPS_CONFIG: { key: Group; label: string; color: string; bgSoft: string; darkText: boolean }[] = [
  { key: "A", label: "Group A", color: "#005F02", bgSoft: "#e6f4e7", darkText: false },
  { key: "B", label: "Group B", color: "#2f8f3a", bgSoft: "#ebf7ec", darkText: false },
  { key: "AB", label: "Group AB", color: "#6fb877", bgSoft: "#f0faf1", darkText: false },
  { key: "O", label: "Group O", color: "#eab308", bgSoft: "#fef9c3", darkText: true },
];

// SVG arc generator for pie chart
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (a: number) => [cx + r * Math.cos(a - Math.PI / 2), cy + r * Math.sin(a - Math.PI / 2)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  if (a1 - a0 >= 2 * Math.PI - 0.0001) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`;
  }
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
};

type TourStep = {
  index: number;
  title: string;
  description: string;
  focusId: "antigens" | "group_a" | "group_b" | "group_ab" | "group_o" | "pie_chart";
};

const TOUR_STEPS: TourStep[] = [
  {
    index: 1,
    title: "ABO Antigens & Plasma Antibodies",
    description:
      "Human blood groups are determined by surface antigens (A and B) on red blood cells and naturally occurring antibodies (anti-A and anti-B) in blood plasma.",
    focusId: "antigens",
  },
  {
    index: 2,
    title: "Blood Group A (Agglutinates in Anti-A)",
    description:
      "Red blood cells have Antigen A on their surface. When mixed with Anti-A antiserum (blue reagent), antibody-antigen binding causes visible clumping (agglutination). Remains smooth in Anti-B.",
    focusId: "group_a",
  },
  {
    index: 3,
    title: "Blood Group B (Agglutinates in Anti-B)",
    description:
      "Red blood cells have Antigen B on their surface. Mixing with Anti-B antiserum (yellow reagent) produces distinct clumping, while Well A remains smooth.",
    focusId: "group_b",
  },
  {
    index: 4,
    title: "Blood Group AB (Universal Recipient)",
    description:
      "Red blood cells possess both Antigen A and Antigen B. Mixing with either Anti-A or Anti-B causes agglutination in both wells. Plasma contains no ABO antibodies.",
    focusId: "group_ab",
  },
  {
    index: 5,
    title: "Blood Group O (Universal Donor)",
    description:
      "Red blood cells have neither A nor B antigens. Both Well A and Well B remain completely smooth and unclumped. Plasma contains both anti-A and anti-B antibodies.",
    focusId: "group_o",
  },
  {
    index: 6,
    title: "Pie Chart Sector Calculation",
    description:
      "Population distribution is represented as a 360° circular chart. The sector angle for each blood group is calculated using the formula: Angle = (Group Count / Total Population) × 360°.",
    focusId: "pie_chart",
  },
];

type BloodQuestion = {
  id: string;
  question: string;
  clue: string;
  options: { label: string; correct: boolean; explanation: string }[];
};

const BLOOD_QUESTIONS: BloodQuestion[] = [
  {
    id: "q1",
    question: "A blood sample clumps in Well A (Anti-A) but remains smooth in Well B (Anti-B). Which blood group is this?",
    clue: "Agglutination indicates the presence of Antigen A on the red blood cells.",
    options: [
      { label: "Blood Group A", correct: true, explanation: "Correct! Agglutination with Anti-A confirms surface Antigen A is present." },
      { label: "Blood Group B", correct: false, explanation: "Incorrect. Group B agglutinates in Well B with Anti-B, not in Well A." },
      { label: "Blood Group AB", correct: false, explanation: "Incorrect. Group AB exhibits agglutination in BOTH Well A and Well B." },
      { label: "Blood Group O", correct: false, explanation: "Incorrect. Group O lacks both antigens and produces no clumping in either well." },
    ],
  },
  {
    id: "q2",
    question: "A blood sample shows NO agglutination in either Well A or Well B. What is the blood type?",
    clue: "Absence of clumping means neither Antigen A nor Antigen B is present on the RBC membrane.",
    options: [
      { label: "Blood Group O", correct: true, explanation: "Correct! Group O red blood cells lack both A and B surface antigens." },
      { label: "Blood Group AB", correct: false, explanation: "Incorrect. Group AB red blood cells express both antigens and clump in both wells." },
      { label: "Blood Group A", correct: false, explanation: "Incorrect. Group A always reacts with Anti-A serum." },
      { label: "Blood Group B", correct: false, explanation: "Incorrect. Group B always reacts with Anti-B serum." },
    ],
  },
  {
    id: "q3",
    question: "Which blood group is known as the Universal Donor because its RBCs lack A and B antigens?",
    clue: "Universal donor blood can be transfused to any recipient without triggering ABO agglutination.",
    options: [
      { label: "Blood Group O", correct: true, explanation: "Correct! Group O RBCs lack A and B antigens, preventing recipient antibody attack." },
      { label: "Blood Group AB", correct: false, explanation: "Incorrect. Group AB is the Universal Recipient because its plasma lacks ABO antibodies." },
      { label: "Blood Group A", correct: false, explanation: "Incorrect. Group A RBCs will be attacked by Anti-A in Group B or O recipients." },
      { label: "Blood Group B", correct: false, explanation: "Incorrect. Group B RBCs will be attacked by Anti-B in Group A or O recipients." },
    ],
  },
  {
    id: "q4",
    question: "In a survey of 40 students, 10 students have Blood Group B. What is the calculated pie chart sector angle?",
    clue: "Apply the formula: Angle = (Count / Total) × 360° → (10 / 40) × 360°.",
    options: [
      { label: "90° (Quarter Circle)", correct: true, explanation: "Correct! (10 / 40) × 360° = 1/4 × 360° = 90°." },
      { label: "45° (Eighth Circle)", correct: false, explanation: "Incorrect. 45° corresponds to 5 out of 40 students (12.5%)." },
      { label: "120° (Third Circle)", correct: false, explanation: "Incorrect. 120° corresponds to approximately 13.3 out of 40 students." },
      { label: "180° (Semicircle)", correct: false, explanation: "Incorrect. 180° corresponds to 20 out of 40 students (50%)." },
    ],
  },
];

export default function BloodGroupPracticalPage() {
  const [phase, setPhase] = useState<AppPhase>("intro");
  const [tourIndex, setTourIndex] = useState(1);

  // Survey data state
  const [tally, setTally] = useState<Record<Group, number>>({ A: 12, B: 10, AB: 4, O: 14 });
  const [activeWellSample, setActiveWellSample] = useState<Group>("A");

  // Quiz state
  const [quizStep, setQuizStep] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<{
    type: "correct" | "wrong";
    title: string;
    explanation: string;
  } | null>(null);

  // Quit modal
  const [showQuit, setShowQuit] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);

  const total = GROUPS_CONFIG.reduce((s, g) => s + tally[g.key], 0);

  const addCount = (g: Group) => setTally((t) => ({ ...t, [g]: t[g] + 1 }));
  const sampleClass = () => setTally({ A: 14, B: 11, AB: 5, O: 10 });
  const resetTally = () => setTally({ A: 0, B: 0, AB: 0, O: 0 });

  const slices = useMemo(() => {
    let a = 0;
    return GROUPS_CONFIG.map((g) => {
      const frac = total ? tally[g.key] / total : 0;
      const a0 = a;
      const a1 = a + frac * 2 * Math.PI;
      const deg = Math.round(frac * 360);
      a = a1;
      return { ...g, count: tally[g.key], frac, a0, a1, deg };
    });
  }, [tally, total]);

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
        colors: ["#005f02", "#2f8f3a", "#eab308", "#6fb877"],
      });
    } catch {
      /* ignore */
    }
  }, []);

  const handleAnswer = useCallback(
    (optIdx: number) => {
      if (selectedOption !== null || feedback) return;
      setSelectedOption(optIdx);

      const q = BLOOD_QUESTIONS[quizStep];
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
          if (quizStep + 1 >= BLOOD_QUESTIONS.length) {
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

  // Determine agglutination state for active well sample
  const isClumpA = activeWellSample === "A" || activeWellSample === "AB";
  const isClumpB = activeWellSample === "B" || activeWellSample === "AB";

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

      {/* Main Specimen & Survey Area (Shifted to right on landscape & desktop) */}
      <div className="absolute inset-0 flex items-center justify-center landscape:justify-end landscape:pr-[3vw] sm:landscape:pr-[6vw] sm:justify-end sm:pr-8 md:pr-12 lg:pr-16 pt-14 sm:pt-0 pointer-events-none">
        <div className="pointer-events-auto relative w-full max-w-[min(94vw,560px)] sm:max-w-[620px] max-h-[min(70dvh,520px)] sm:max-h-[min(84dvh,580px)] flex flex-col rounded-3xl bg-white/95 p-3.5 sm:p-5 shadow-[0_12px_45px_rgba(0,0,0,0.12),0_0_80px_rgba(0,95,2,0.08)] border border-white/80 ring-1 ring-[#005f02]/20 backdrop-blur-md transition-all duration-500 ease-out overflow-y-auto overscroll-contain">
          
          {/* Header Banner */}
          <div className="flex items-center justify-between border-b border-black/5 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-[#005f02]/10 px-2.5 py-0.5 text-[10px] sm:text-xs font-black text-[#005f02]">
                <Droplet size={13} className="text-[#005f02]" /> ABO Typing & Population Survey
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-black/50">Agglutination Test Plate</span>
            </div>
            <span className="text-[10px] sm:text-xs font-black text-[#005f02]">
              {total} Subjects Surveyed
            </span>
          </div>

          {/* 1. Interactive Ceramic Blood Typing Plate */}
          <div
            className={`rounded-2xl border p-3 sm:p-4 transition-all duration-300 ${
              phase === "tour" &&
              (activeTourStep.focusId === "group_a" ||
                activeTourStep.focusId === "group_b" ||
                activeTourStep.focusId === "group_ab" ||
                activeTourStep.focusId === "group_o")
                ? "border-[#f6c453] bg-amber-50/70 ring-4 ring-[#f6c453]/30"
                : "border-black/10 bg-[#f8faf8]"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] sm:text-xs font-black text-black/70">
                Blood Typing Reaction Tile · <span className="text-[#005f02]">Sample {activeWellSample}</span>
              </p>
              <div className="flex items-center gap-1">
                {(["A", "B", "AB", "O"] as Group[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setActiveWellSample(g)}
                    className={`rounded-lg px-2 py-0.5 text-[10px] sm:text-[11px] font-black transition cursor-pointer ${
                      activeWellSample === g
                        ? "bg-[#005f02] text-white shadow-sm"
                        : "bg-black/5 text-black/60 hover:bg-black/10"
                    }`}
                  >
                    Type {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Ceramic Wells (Anti-A Blue, Anti-B Yellow, Anti-D Clear) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-white p-3 rounded-xl border border-black/10 shadow-inner">
              {/* Well Anti-A */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] font-black text-blue-700 mb-1">
                  <span className="size-2 rounded-full bg-blue-500" /> Well Anti-A
                </div>
                <div className="relative mx-auto size-16 sm:size-20 rounded-full border-2 border-slate-300 bg-gradient-to-b from-blue-50 to-slate-100 shadow-[inset_0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center overflow-hidden">
                  {isClumpA ? (
                    <div className="relative size-12 sm:size-14 rounded-full flex flex-wrap items-center justify-center gap-1 p-1 animate-in zoom-in-50 duration-300">
                      {[...Array(9)].map((_, i) => (
                        <span key={i} className="size-2 sm:size-2.5 rounded-full bg-red-800 shadow-sm opacity-90" />
                      ))}
                    </div>
                  ) : (
                    <div className="size-12 sm:size-14 rounded-full bg-red-500/80 shadow-[inset_0_2px_6px_rgba(0,0,0,0.25)] transition-all" />
                  )}
                </div>
                <p className={`mt-1 text-[9px] sm:text-[10px] font-black ${isClumpA ? "text-red-700" : "text-emerald-700"}`}>
                  {isClumpA ? "Agglutination (Clumped)" : "Smooth (No Reaction)"}
                </p>
              </div>

              {/* Well Anti-B */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] font-black text-amber-700 mb-1">
                  <span className="size-2 rounded-full bg-amber-400" /> Well Anti-B
                </div>
                <div className="relative mx-auto size-16 sm:size-20 rounded-full border-2 border-slate-300 bg-gradient-to-b from-amber-50 to-slate-100 shadow-[inset_0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center overflow-hidden">
                  {isClumpB ? (
                    <div className="relative size-12 sm:size-14 rounded-full flex flex-wrap items-center justify-center gap-1 p-1 animate-in zoom-in-50 duration-300">
                      {[...Array(9)].map((_, i) => (
                        <span key={i} className="size-2 sm:size-2.5 rounded-full bg-red-800 shadow-sm opacity-90" />
                      ))}
                    </div>
                  ) : (
                    <div className="size-12 sm:size-14 rounded-full bg-red-500/80 shadow-[inset_0_2px_6px_rgba(0,0,0,0.25)] transition-all" />
                  )}
                </div>
                <p className={`mt-1 text-[9px] sm:text-[10px] font-black ${isClumpB ? "text-red-700" : "text-emerald-700"}`}>
                  {isClumpB ? "Agglutination (Clumped)" : "Smooth (No Reaction)"}
                </p>
              </div>

              {/* Well Anti-D (Rh factor) */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] font-black text-purple-700 mb-1">
                  <span className="size-2 rounded-full bg-purple-400" /> Well Anti-D (Rh+)
                </div>
                <div className="relative mx-auto size-16 sm:size-20 rounded-full border-2 border-slate-300 bg-gradient-to-b from-purple-50 to-slate-100 shadow-[inset_0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center overflow-hidden">
                  <div className="relative size-12 sm:size-14 rounded-full flex flex-wrap items-center justify-center gap-1 p-1">
                    {[...Array(8)].map((_, i) => (
                      <span key={i} className="size-2 sm:size-2.5 rounded-full bg-red-800 shadow-sm opacity-90" />
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-[9px] sm:text-[10px] font-black text-red-700">
                  Rh Positive (D+)
                </p>
              </div>
            </div>
          </div>

          {/* 2. Population Survey & Live Pie Chart */}
          <div
            className={`mt-3 rounded-2xl border p-3 sm:p-4 transition-all duration-300 ${
              phase === "tour" && activeTourStep.focusId === "pie_chart"
                ? "border-[#f6c453] bg-amber-50/70 ring-4 ring-[#f6c453]/30"
                : "border-black/10 bg-white"
            }`}
          >
            {/* Survey Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                {GROUPS_CONFIG.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => addCount(g.key)}
                    className="inline-flex items-center gap-1 rounded-xl px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-black transition hover:opacity-90 active:scale-95 shadow-sm cursor-pointer"
                    style={{ background: g.color, color: g.darkText ? "#0f2e12" : "#ffffff" }}
                  >
                    + {g.key}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={sampleClass}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#005f02]/10 px-2.5 py-1 text-[10px] sm:text-[11px] font-black text-[#005f02] transition hover:bg-[#005f02]/20 cursor-pointer"
                >
                  <Users size={12} /> Sample Class
                </button>
                <button
                  type="button"
                  onClick={resetTally}
                  className="inline-flex items-center gap-1 rounded-xl bg-black/5 px-2 py-1 text-[10px] sm:text-[11px] font-bold text-black/50 transition hover:bg-black/10 cursor-pointer"
                >
                  <RotateCcw size={11} /> Reset
                </button>
              </div>
            </div>

            {/* Live Pie Chart and Legend Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              {/* Dynamic SVG Pie Chart */}
              <div className="flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="size-36 sm:size-44">
                  {total === 0 ? (
                    <circle cx={100} cy={100} r={88} className="fill-black/5" />
                  ) : (
                    slices.map((s) =>
                      s.frac > 0 ? (
                        <path
                          key={s.key}
                          d={arc(100, 100, 88, s.a0, s.a1)}
                          fill={s.color}
                          stroke="#ffffff"
                          strokeWidth={2.5}
                          className="transition-all duration-300 hover:opacity-90"
                        />
                      ) : null
                    )
                  )}
                  {/* Central Donut Hole */}
                  <circle cx={100} cy={100} r={42} className="fill-white shadow-md" />
                  <text x={100} y={96} textAnchor="middle" className="fill-black text-[16px] font-black">
                    {total}
                  </text>
                  <text x={100} y={112} textAnchor="middle" className="fill-black/50 text-[8.5px] font-bold">
                    Subjects
                  </text>
                </svg>
              </div>

              {/* Data Table with Sector Angles */}
              <div className="space-y-1.5">
                {slices.map((s) => (
                  <div key={s.key} className="flex items-center justify-between text-[11px] sm:text-xs font-bold bg-slate-50 p-1.5 rounded-lg border border-black/5">
                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-md shrink-0 shadow-sm" style={{ background: s.color }} />
                      <span className="font-black text-black">{s.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#005f02]">{s.count} ({total ? Math.round(s.frac * 100) : 0}%)</span>
                      <span className="text-[10px] text-black/40 font-mono">θ = {s.deg}°</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
          Biology · Class XII · ABO Blood Grouping
        </span>
      </div>

      {/* PHASE 1: Pre-Practical Briefing Screen */}
      {phase === "intro" && (
        <PracticalIntro
          brief={{
            expNo: 10,
            title: "ABO Blood Grouping Survey & Pie Chart Construction",
            object:
              "To determine human ABO blood group phenotypes via simulated antigen-antibody agglutination tests and construct a representative population distribution pie chart.",
            apparatus: [
              "Blood Typing Ceramic Tile (Wells A, B, Rh)",
              "Anti-A Antiserum (Blue)",
              "Anti-B Antiserum (Yellow)",
              "Anti-D Antiserum (Clear)",
              "Population Survey Counter",
              "Dynamic 360° Pie Chart Model",
            ],
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
          apparatus={[
            "Ceramic Typing Plate",
            "Anti-A / Anti-B Antisera",
            "Survey Counter",
            "Pie Chart Constructor",
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
                  <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Blood Grouping Challenge · Q{quizStep + 1} of {BLOOD_QUESTIONS.length}
                </p>
                <h2 className="text-xs sm:text-sm font-black text-white leading-tight mt-0.5">
                  {BLOOD_QUESTIONS[quizStep].question}
                </h2>
              </div>

              <div className="border-t border-white/15 bg-black/20 p-2 sm:p-2.5 flex-1 overflow-y-auto overscroll-contain space-y-1.5">
                {BLOOD_QUESTIONS[quizStep].options.map((opt, idx) => {
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
              <h2 className="mt-1 text-base sm:text-xl font-black">ABO Blood Grouping Mastered!</h2>
              <p className="mt-0.5 text-[10px] sm:text-xs text-white/80">
                You successfully mastered antigen agglutination typing and population pie chart construction.
              </p>
            </div>

            <div className="border-t border-white/15 bg-black/20 p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 overflow-y-auto overscroll-contain">
              <div className="rounded-xl sm:rounded-2xl bg-black/30 p-2.5 sm:p-3 border border-white/10 text-xs">
                <p className="font-bold text-[#f6c453] uppercase tracking-wider text-[9px] sm:text-[10px]">Statistical & Clinical Summary</p>
                <div className="mt-1.5 grid grid-cols-2 gap-2 text-white/90">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-center">
                    <p className="text-[9px] text-white/60">Surveyed Population</p>
                    <p className="text-sm font-black text-[#f6c453]">{total} Subjects</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-center">
                    <p className="text-[9px] text-white/60">Challenge Score</p>
                    <p className="text-sm font-black text-emerald-400">{score} pts</p>
                  </div>
                </div>

                <div className="mt-2 p-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/80 leading-snug">
                  <p className="font-bold text-white mb-0.5">Clinical Principle:</p>
                  Agglutination occurs when specific serum antibodies bind matching surface antigens. Group O is Universal Donor (no antigens); Group AB is Universal Recipient (no antibodies).
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
              <p className="text-xs text-white/70">ABO Blood Grouping Survey</p>
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
