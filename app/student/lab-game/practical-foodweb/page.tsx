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
  ArrowRight,
  Layers,
  Leaf,
  Zap,
} from "lucide-react";
import LogoutSVG from "@/public/svgs/LogoutSVG";
import PracticalIntro from "../_practical/PracticalIntro";
import { playGameCorrectSound, playGameWrongSound } from "@/app/student/lab-game/_scene/labAudio";

type AppPhase = "intro" | "tour" | "quiz" | "complete";
type Tier = "producers" | "primary" | "secondary" | "tertiary" | "decomposers";

type TrophicTier = {
  id: Tier;
  label: string;
  hint: string;
  emoji: string;
  accent: string;
  soft: string;
  energyJoules: string;
  levelNum: number;
};

const TIERS: TrophicTier[] = [
  {
    id: "producers",
    label: "Producers (T1)",
    hint: "Photoautotrophs",
    emoji: "🌿",
    accent: "#005f02",
    soft: "#e6f4e7",
    energyJoules: "10,000 kJ (100%)",
    levelNum: 1,
  },
  {
    id: "primary",
    label: "Primary Consumers (T2)",
    hint: "Herbivores",
    emoji: "🐇",
    accent: "#2f8f3a",
    soft: "#ebf7ec",
    energyJoules: "1,000 kJ (10%)",
    levelNum: 2,
  },
  {
    id: "secondary",
    label: "Secondary Consumers (T3)",
    hint: "Primary Carnivores",
    emoji: "🦊",
    accent: "#d97706",
    soft: "#fef3c7",
    energyJoules: "100 kJ (1%)",
    levelNum: 3,
  },
  {
    id: "tertiary",
    label: "Tertiary Consumers (T4)",
    hint: "Apex Predators",
    emoji: "🦅",
    accent: "#dc2626",
    soft: "#fee2e2",
    energyJoules: "10 kJ (0.1%)",
    levelNum: 4,
  },
  {
    id: "decomposers",
    label: "Decomposers (Saprophytes)",
    hint: "Recyclers",
    emoji: "🍄",
    accent: "#7c3aed",
    soft: "#f3e8ff",
    energyJoules: "Recycles Nutrients",
    levelNum: 0,
  },
];

type Organism = {
  id: string;
  emoji: string;
  name: string;
  tier: Tier;
};

const ORGANISMS: Organism[] = [
  { id: "grass", emoji: "🌱", name: "Green Grass", tier: "producers" },
  { id: "tree", emoji: "🌳", name: "Oak Tree", tier: "producers" },
  { id: "grasshopper", emoji: "🦗", name: "Grasshopper", tier: "primary" },
  { id: "rabbit", emoji: "🐰", name: "Field Rabbit", tier: "primary" },
  { id: "frog", emoji: "🐸", name: "Tree Frog", tier: "secondary" },
  { id: "fox", emoji: "🦊", name: "Red Fox", tier: "secondary" },
  { id: "hawk", emoji: "🦅", name: "Red-tailed Hawk", tier: "tertiary" },
  { id: "snake", emoji: "🐍", name: "Grass Snake", tier: "tertiary" },
  { id: "fungi", emoji: "🍄", name: "Forest Fungi", tier: "decomposers" },
  { id: "bacteria", emoji: "🦠", name: "Soil Bacteria", tier: "decomposers" },
];

type TourStep = {
  index: number;
  title: string;
  description: string;
  focusId: "producers" | "primary" | "secondary" | "tertiary" | "decomposers" | "energy_rule";
};

const TOUR_STEPS: TourStep[] = [
  {
    index: 1,
    title: "Primary Producers (Trophic Level 1)",
    description:
      "Green plants, phytoplankton, and algae convert sunlight photon energy into chemical bond energy via photosynthesis, forming the base of all terrestrial and aquatic food chains (100% baseline energy).",
    focusId: "producers",
  },
  {
    index: 2,
    title: "Primary Consumers (Trophic Level 2)",
    description:
      "Herbivores (e.g. grasshoppers, rabbits) feed directly on primary producers. They obtain organic nutrients and represent the first consumer link in the food chain.",
    focusId: "primary",
  },
  {
    index: 3,
    title: "Secondary Consumers (Trophic Level 3)",
    description:
      "Carnivores and insectivores (e.g. frogs, foxes) prey upon primary consumers to obtain energy and organic biomass.",
    focusId: "secondary",
  },
  {
    index: 4,
    title: "Tertiary Consumers & Apex Predators (T4)",
    description:
      "Top-tier predators (e.g. hawks, snakes, eagles) feed on secondary consumers. They occupy the pinnacle of the food pyramid with virtually no natural predators.",
    focusId: "tertiary",
  },
  {
    index: 5,
    title: "Decomposers & The 10% Energy Transfer Law",
    description:
      "Decomposers (saprophytic bacteria & fungi) break down dead organic matter across all trophic levels, returning minerals to soil. Approximately 90% of energy is lost as metabolic heat at each level (Lindeman's 10% Efficiency).",
    focusId: "energy_rule",
  },
];

type FoodWebQuestion = {
  id: string;
  question: string;
  clue: string;
  options: { label: string; correct: boolean; explanation: string }[];
};

const FOODWEB_QUESTIONS: FoodWebQuestion[] = [
  {
    id: "q1",
    question: "Which organism is a primary producer capable of synthesizing glucose directly from solar photon energy?",
    clue: "Primary producers are photoautotrophs occupying Trophic Level 1.",
    options: [
      { label: "Green Grass / Plants", correct: true, explanation: "Correct! Plants contain chlorophyll to perform photosynthesis and produce glucose." },
      { label: "Grasshopper", correct: false, explanation: "Incorrect. The grasshopper is a herbivorous primary consumer (Trophic Level 2)." },
      { label: "Tree Frog", correct: false, explanation: "Incorrect. The frog is a carnivorous secondary consumer." },
      { label: "Grass Snake", correct: false, explanation: "Incorrect. The snake is a tertiary predator." },
    ],
  },
  {
    id: "q2",
    question: "If green plants capture 10,000 kJ of solar energy, how much energy is transferred to secondary consumers?",
    clue: "Apply Lindeman's 10% Rule across two trophic steps: 10,000 kJ → Primary Consumers → Secondary Consumers.",
    options: [
      { label: "100 kJ (10% of 1,000 kJ)", correct: true, explanation: "Correct! T1 (10,000 kJ) → T2 (1,000 kJ) → T3 (100 kJ)." },
      { label: "1,000 kJ (10% of 10,000 kJ)", correct: false, explanation: "Incorrect. 1,000 kJ is the energy available to Primary Consumers (T2)." },
      { label: "10 kJ (0.1%)", correct: false, explanation: "Incorrect. 10 kJ is the energy available to Tertiary Consumers (T4)." },
      { label: "5,000 kJ (50%)", correct: false, explanation: "Incorrect. Trophic ecological efficiency averages only ~10%, not 50%." },
    ],
  },
  {
    id: "q3",
    question: "What critical ecological function do decomposers (bacteria and fungi) perform in the food web?",
    clue: "Decomposers act on dead detritus from all trophic levels.",
    options: [
      { label: "Break down dead organic matter and recycle mineral nutrients to the soil", correct: true, explanation: "Correct! Saprophytes decompose organic wastes, preventing nutrient lockup." },
      { label: "Produce oxygen and carbohydrates via photosynthesis", correct: false, explanation: "Incorrect. Decomposers are heterotrophic and do not perform photosynthesis." },
      { label: "Act as apex predators hunting secondary consumers", correct: false, explanation: "Incorrect. Decomposers feed on detritus, not live prey." },
      { label: "Consume primary producers exclusively", correct: false, explanation: "Incorrect. Decomposers process organic matter from all trophic levels." },
    ],
  },
  {
    id: "q4",
    question: "Why do natural food chains rarely exceed 4 or 5 trophic levels?",
    clue: "Consider what happens to energy availability as 90% is lost as metabolic heat at every step.",
    options: [
      { label: "90% of energy is lost as heat at each step (10% Law), leaving insufficient energy for higher levels", correct: true, explanation: "Correct! Energy dissipates rapidly, so higher levels cannot support viable populations." },
      { label: "Apex predators refuse to consume other carnivores", correct: false, explanation: "Incorrect. Energy limitation, not predator preference, limits chain length." },
      { label: "Decomposers destroy all available oxygen in the ecosystem", correct: false, explanation: "Incorrect. Decomposers recycle nutrients and maintain ecosystem balance." },
      { label: "Carbon dioxide runs out at the top of the pyramid", correct: false, explanation: "Incorrect. CO2 is utilized by autotrophs at the base, not predators at the top." },
    ],
  },
];

export default function FoodWebPracticalPage() {
  const [phase, setPhase] = useState<AppPhase>("intro");
  const [tourIndex, setTourIndex] = useState(1);

  // Interactive Food Web Placement state
  const [placed, setPlaced] = useState<Record<string, Tier>>({
    grass: "producers",
    grasshopper: "primary",
    frog: "secondary",
  });
  const [selectedOrganism, setSelectedOrganism] = useState<string | null>(null);
  const [wrongTier, setWrongTier] = useState<Tier | null>(null);
  const [justPlaced, setJustPlaced] = useState<string | null>(null);

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

  const pool = ORGANISMS.filter((o) => !placed[o.id]);
  const placedCount = Object.keys(placed).length;
  const isWebComplete = placedCount === ORGANISMS.length;

  const dropInto = useCallback(
    (tier: Tier) => {
      if (!selectedOrganism) return;
      const org = ORGANISMS.find((o) => o.id === selectedOrganism);
      if (!org) return;

      if (org.tier === tier) {
        playGameCorrectSound();
        setPlaced((p) => ({ ...p, [org.id]: tier }));
        setJustPlaced(org.id);
        setTimeout(() => setJustPlaced(null), 600);
        setSelectedOrganism(null);
      } else {
        playGameWrongSound();
        setWrongTier(tier);
        setTimeout(() => setWrongTier(null), 500);
      }
    },
    [selectedOrganism]
  );

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
    setPlaced({
      grass: "producers",
      grasshopper: "primary",
      frog: "secondary",
    });
    setSelectedOrganism(null);
    setWrongTier(null);
    setJustPlaced(null);
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
        colors: ["#005f02", "#2f8f3a", "#d97706", "#dc2626", "#7c3aed"],
      });
    } catch {
      /* ignore */
    }
  }, []);

  const handleAnswer = useCallback(
    (optIdx: number) => {
      if (selectedOption !== null || feedback) return;
      setSelectedOption(optIdx);

      const q = FOODWEB_QUESTIONS[quizStep];
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
          if (quizStep + 1 >= FOODWEB_QUESTIONS.length) {
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
      <style>{`
        @keyframes fwPop { 0%{transform:scale(.4);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        .fw-pop { animation: fwPop .45s cubic-bezier(.34,1.56,.64,1); }
      `}</style>

      {/* Subtle Lab Tile Grid Background */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#cadfd2 1.5px, transparent 1.5px), linear-gradient(90deg, #cadfd2 1.5px, transparent 1.5px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Main Specimen & Trophic Pyramid Area (Shifted to right on landscape & desktop) */}
      <div className="absolute inset-0 flex items-center justify-center landscape:justify-end landscape:pr-[3vw] sm:landscape:pr-[6vw] sm:justify-end sm:pr-8 md:pr-12 lg:pr-16 pt-14 sm:pt-0 pointer-events-none">
        <div className="pointer-events-auto relative w-full max-w-[min(94vw,560px)] sm:max-w-[620px] max-h-[min(70dvh,520px)] sm:max-h-[min(84dvh,580px)] flex flex-col rounded-3xl bg-white/95 p-3.5 sm:p-5 shadow-[0_12px_45px_rgba(0,0,0,0.12),0_0_80px_rgba(0,95,2,0.08)] border border-white/80 ring-1 ring-[#005f02]/20 backdrop-blur-md transition-all duration-500 ease-out overflow-y-auto overscroll-contain">
          
          {/* Header Banner */}
          <div className="flex items-center justify-between border-b border-black/5 pb-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-[#005f02]/10 px-2.5 py-0.5 text-[10px] sm:text-xs font-black text-[#005f02]">
                <Leaf size={13} className="text-[#005f02]" /> Trophic Energy Matrix
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-black/50">10% Ecological Efficiency</span>
            </div>
            <span className="text-[10px] sm:text-xs font-black text-[#005f02]">
              {placedCount}/{ORGANISMS.length} Organisms Placed
            </span>
          </div>

          {/* 1. Organism Selection Pool */}
          <div className="rounded-2xl border border-black/10 bg-[#f8faf8] p-2.5 sm:p-3 mb-2.5 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] sm:text-xs font-black text-black/70">
                {selectedOrganism ? (
                  <span className="text-[#005f02] font-black flex items-center gap-1">
                    <Zap size={12} className="text-[#f6c453] fill-[#f6c453]" /> Tap the matching trophic tier slot below ↓
                  </span>
                ) : (
                  <span>Available Organisms · Tap to classify</span>
                )}
              </p>
              <button
                type="button"
                onClick={() => {
                  setPlaced({});
                  setSelectedOrganism(null);
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-black/5 px-2 py-0.5 text-[10px] font-bold text-black/50 hover:bg-black/10 cursor-pointer"
              >
                <RotateCcw size={10} /> Reset
              </button>
            </div>

            <div className="flex min-h-[2.5rem] flex-wrap gap-1.5 sm:gap-2">
              {pool.length === 0 && (
                <span className="text-xs font-black text-[#005f02] py-1">
                  All organisms successfully categorized in the food web! 🎉
                </span>
              )}
              {pool.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelectedOrganism(selectedOrganism === o.id ? null : o.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] sm:text-xs font-black transition cursor-pointer ${
                    selectedOrganism === o.id
                      ? "border-[#005f02] bg-[#005f02] text-white shadow-md ring-2 ring-[#f6c453] scale-105"
                      : "border-black/10 bg-white text-black/80 hover:border-[#005f02]/40 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-sm">{o.emoji}</span> {o.name}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Trophic Tiers (Pyramid Architecture) */}
          <div className="space-y-1.5 sm:space-y-2">
            {TIERS.map((tier) => {
              const members = ORGANISMS.filter((o) => placed[o.id] === tier.id);
              const isActive = !!selectedOrganism;
              const isWrong = wrongTier === tier.id;

              return (
                <div
                  key={tier.id}
                  onClick={() => dropInto(tier.id)}
                  className={`overflow-hidden rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${
                    isWrong
                      ? "border-red-500 bg-red-50 animate-game-shake"
                      : isActive
                      ? "hover:border-[#005f02] hover:shadow-md border-black/15 bg-white"
                      : "border-black/10 bg-white"
                  }`}
                  style={{
                    backgroundColor: isActive && !isWrong ? tier.soft : undefined,
                    borderColor: isActive && !isWrong ? tier.accent : undefined,
                  }}
                >
                  {/* Tier Header Bar */}
                  <div
                    className="flex items-center justify-between px-3 py-1 text-white"
                    style={{ background: tier.accent }}
                  >
                    <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-black">
                      <span>{tier.emoji}</span> {tier.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-white/80">{tier.hint}</span>
                      <span className="rounded-full bg-black/20 px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider text-amber-200">
                        {tier.energyJoules}
                      </span>
                    </div>
                  </div>

                  {/* Drop Slot with Organisms */}
                  <div className="flex min-h-[2.25rem] flex-wrap items-center gap-1.5 p-2">
                    {members.length === 0 ? (
                      <span className="text-[10px] font-bold text-black/35 italic pl-1">
                        {isActive ? "Tap to assign selected organism here" : "Empty slot"}
                      </span>
                    ) : (
                      members.map((o) => (
                        <span
                          key={o.id}
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] sm:text-[11px] font-black shadow-xs ${
                            justPlaced === o.id ? "fw-pop" : ""
                          }`}
                          style={{
                            background: tier.soft,
                            color: tier.accent,
                            boxShadow: `inset 0 0 0 1.5px ${tier.accent}40`,
                          }}
                        >
                          <span>{o.emoji}</span> {o.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Energy Flow Vector Legend */}
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1 sm:gap-2 text-[10px] font-black text-black/60 bg-[#f8faf8] p-2 rounded-xl border border-black/5">
            <span className="text-black/40">Unidirectional Flow:</span>
            {["🌿 Producers", "🐇 Primary", "🦊 Secondary", "🦅 Apex"].map((s, i) => (
              <span key={s} className="inline-flex items-center gap-1">
                <span className="rounded-md bg-white px-1.5 py-0.5 shadow-2xs border border-black/5">{s}</span>
                {i < 3 && <ArrowRight size={11} className="text-black/30" />}
              </span>
            ))}
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
          Biology · Class XII · Food Web & Ecology
        </span>
      </div>

      {/* PHASE 1: Pre-Practical Briefing Screen */}
      {phase === "intro" && (
        <PracticalIntro
          brief={{
            expNo: 11,
            title: "Trophic Levels & Ecosystem Food Web Construction",
            object:
              "To classify terrestrial and aquatic organisms into appropriate trophic levels, construct interconnected food chains, and analyze unidirectional energy flow (10% Ecological Law).",
            apparatus: [
              "Primary Producers (Photoautotrophs: Grass, Trees)",
              "Primary Consumers (Herbivores: Grasshoppers, Rabbits)",
              "Secondary Consumers (Carnivores: Frogs, Foxes)",
              "Tertiary Consumers (Apex Predators: Hawks, Snakes)",
              "Decomposers (Saprophytes: Fungi, Bacteria)",
              "Trophic Energy Flow Matrix",
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
            "Producers (T1)",
            "Primary Consumers (T2)",
            "Secondary Consumers (T3)",
            "Apex Predators (T4)",
            "Decomposers",
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
                  <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Ecology Challenge · Q{quizStep + 1} of {FOODWEB_QUESTIONS.length}
                </p>
                <h2 className="text-xs sm:text-sm font-black text-white leading-tight mt-0.5">
                  {FOODWEB_QUESTIONS[quizStep].question}
                </h2>
              </div>

              <div className="border-t border-white/15 bg-black/20 p-2 sm:p-2.5 flex-1 overflow-y-auto overscroll-contain space-y-1.5">
                {FOODWEB_QUESTIONS[quizStep].options.map((opt, idx) => {
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
              <h2 className="mt-1 text-base sm:text-xl font-black">Food Web Dynamics Mastered!</h2>
              <p className="mt-0.5 text-[10px] sm:text-xs text-white/80">
                You successfully mapped trophic energy levels and analyzed the 10% ecological transfer efficiency.
              </p>
            </div>

            <div className="border-t border-white/15 bg-black/20 p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 overflow-y-auto overscroll-contain">
              <div className="rounded-xl sm:rounded-2xl bg-black/30 p-2.5 sm:p-3 border border-white/10 text-xs">
                <p className="font-bold text-[#f6c453] uppercase tracking-wider text-[9px] sm:text-[10px]">Ecological Summary</p>
                <div className="mt-1.5 grid grid-cols-2 gap-2 text-white/90">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-center">
                    <p className="text-[9px] text-white/60">Organisms Placed</p>
                    <p className="text-sm font-black text-[#f6c453]">{placedCount} / {ORGANISMS.length}</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-center">
                    <p className="text-[9px] text-white/60">Challenge Score</p>
                    <p className="text-sm font-black text-emerald-400">{score} pts</p>
                  </div>
                </div>

                <div className="mt-2 p-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/80 leading-snug">
                  <p className="font-bold text-white mb-0.5">Ecological Law:</p>
                  Solar energy flows unidirectionally through food chains. Only ~10% transfers to subsequent trophic tiers, limiting food chain length to 4–5 levels.
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
              <p className="text-xs text-white/70">Food Chains & Trophic Food Web</p>
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
