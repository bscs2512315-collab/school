"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  Dices,
  RotateCcw,
  Sparkles,
  LoaderCircle,
  X,
  HelpCircle,
  BarChart3,
  Leaf,
  Sprout,
  Info,
  BookOpen,
  FlaskConical,
  Zap,
} from "lucide-react";
import LogoutSVG from "@/public/svgs/LogoutSVG";
import PracticalIntro from "../_practical/PracticalIntro";
import { playGameCorrectSound, playGameWrongSound } from "@/app/student/lab-game/_scene/labAudio";

type AppPhase = "intro" | "tour" | "quiz" | "complete";

// Die faces 1–3 → allele "a" (recessive / dwarf), 4–6 → allele "A" (dominant / tall)
const alleleFor = (face: number) => (face <= 3 ? "a" : "A");
const genotypeOf = (a: string, b: string) => [a, b].sort().reverse().join("") as "AA" | "Aa" | "aa";

type Counts = { AA: number; Aa: number; aa: number };
const ZERO_COUNTS: Counts = { AA: 0, Aa: 0, aa: 0 };

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 28], [72, 28], [28, 50], [72, 50], [28, 72], [72, 72]],
};

function Die({ face, rolling, label }: { face: number; rolling: boolean; label: string }) {
  const allele = alleleFor(face);
  const isDominant = allele === "A";

  return (
    <div className="flex flex-col items-center">
      <p className="text-[10px] sm:text-[11px] font-extrabold text-black/60 mb-1">{label}</p>
      <div className={`relative ${rolling ? "dice-tumble" : ""}`}>
        <svg
          viewBox="0 0 100 100"
          className="size-14 sm:size-16 md:size-20 rounded-2xl bg-white shadow-[0_8px_25px_rgba(0,0,0,0.15)] ring-2 ring-black/10 border border-slate-100 transition-all"
        >
          {PIPS[face].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={8.5} className="fill-[#005f02]" />
          ))}
        </svg>
        <div
          className={`absolute -bottom-2 -right-2 grid size-6 sm:size-7 place-items-center rounded-full text-[11px] sm:text-xs font-black shadow-md border-2 border-white transition-all ${
            isDominant ? "bg-[#005f02] text-white" : "bg-[#f6c453] text-[#0f2e12]"
          }`}
        >
          {allele}
        </div>
      </div>
      <div className="mt-2 text-center">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-black ${
            isDominant ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"
          }`}
        >
          {isDominant ? "Dominant (A)" : "Recessive (a)"}
        </span>
        <p className="text-[8.5px] text-black/40 mt-0.5">Face {face} (1–3=a, 4–6=A)</p>
      </div>
    </div>
  );
}

type TourStep = {
  index: number;
  title: string;
  description: string;
  focusId: "intro_story" | "dice_meiosis" | "fertilization" | "punnett" | "phenotype_vs_genotype" | "law_large_numbers";
};

const TOUR_STEPS: TourStep[] = [
  {
    index: 1,
    title: "1. The Biological Story: Mendel's Pea Plants",
    description:
      "Imagine crossing two heterozygous Tall pea plants (Aa × Aa). Both parents look Tall because the dominant allele 'A' (Tall) masks the recessive allele 'a' (Dwarf).",
    focusId: "intro_story",
  },
  {
    index: 2,
    title: "2. Why Use Dice to Model Meiosis?",
    description:
      "In a real flower, meiosis produces eggs and pollen with a 50/50 chance of carrying 'A' or 'a'. A 6-sided die has 6 faces: 1, 2, 3 represent 'a' (50%), while 4, 5, 6 represent 'A' (50%).",
    focusId: "dice_meiosis",
  },
  {
    index: 3,
    title: "3. Random Fertilization (Egg + Pollen = Zygote)",
    description:
      "When we roll both dice simultaneously, we simulate fertilization: one egg from Mother (Die 1) unites with one pollen from Father (Die 2) to produce a diploid seed zygote.",
    focusId: "fertilization",
  },
  {
    index: 4,
    title: "4. The 2×2 Punnett Square Matrix",
    description:
      "There are 4 equally likely combinations: A × A = AA (25%), A × a = Aa (25%), a × A = Aa (25%), and a × a = aa (25%).",
    focusId: "punnett",
  },
  {
    index: 5,
    title: "5. Genotype (1:2:1) vs Phenotype (3:1)",
    description:
      "GENOTYPE is the genetic code (1 AA : 2 Aa : 1 aa). PHENOTYPE is the physical appearance: AA and Aa both grow into Tall plants (75%), while only aa is Dwarf (25%)!",
    focusId: "phenotype_vs_genotype",
  },
  {
    index: 6,
    title: "6. The Law of Large Numbers",
    description:
      "If you roll 4 times, random luck might give unusual results. But as you simulate 50+ or 100+ crosses, the offspring counts converge with high precision directly to Mendel's 3:1 ratio!",
    focusId: "law_large_numbers",
  },
];

type GeneticsQuestion = {
  id: string;
  question: string;
  clue: string;
  options: { label: string; correct: boolean; explanation: string }[];
};

const GENETICS_QUESTIONS: GeneticsQuestion[] = [
  {
    id: "q1",
    question: "If Mother's die rolls 6 ('A') and Father's die rolls 2 ('a'), what is the offspring's genotype & phenotype?",
    clue: "Combine alleles A + a. Remember that allele A is dominant for Tall height.",
    options: [
      { label: "Genotype Aa · Phenotype Tall 🌿", correct: true, explanation: "Correct! The offspring inherits 'A' and 'a' (heterozygous Aa). Because 'A' is dominant, the plant grows Tall!" },
      { label: "Genotype AA · Phenotype Tall 🌿", correct: false, explanation: "Incorrect. Father's die rolled face 2 which gave allele 'a', not 'A'." },
      { label: "Genotype aa · Phenotype Dwarf 🌱", correct: false, explanation: "Incorrect. Mother's die rolled face 6 which gave dominant allele 'A'." },
      { label: "Genotype Aa · Phenotype Dwarf 🌱", correct: false, explanation: "Incorrect. Heterozygous Aa plants are Tall because 'A' completely masks recessive 'a'." },
    ],
  },
  {
    id: "q2",
    question: "Why do heterozygous (Aa) pea plants look identical to homozygous dominant (AA) plants?",
    clue: "Consider Mendel's Law of Dominance.",
    options: [
      { label: "The dominant allele 'A' masks the expression of the recessive allele 'a'", correct: true, explanation: "Correct! In complete dominance, a single dominant allele produces sufficient enzyme/protein to express the dominant trait fully." },
      { label: "The recessive allele 'a' gets physically destroyed in the nucleus", correct: false, explanation: "Incorrect. Recessive alleles remain intact and can still be passed to future generations." },
      { label: "Heterozygous plants produce double the amount of chlorophyll", correct: false, explanation: "Incorrect. Dominance is about gene expression masking, not doubling." },
      { label: "Allele 'a' only functions when the plant is exposed to darkness", correct: false, explanation: "Incorrect. Environmental lighting does not alter Mendelian complete dominance." },
    ],
  },
  {
    id: "q3",
    question: "In an Aa × Aa monohybrid cross, what is the expected ratio of Phenotypes (Tall : Dwarf)?",
    clue: "AA (25%) + Aa (50%) = Tall. aa (25%) = Dwarf.",
    options: [
      { label: "3 Tall : 1 Dwarf (75% Tall : 25% Dwarf)", correct: true, explanation: "Correct! 3 out of 4 possible genetic combinations carry at least one dominant 'A' allele." },
      { label: "1 Tall : 2 Intermediate : 1 Dwarf", correct: false, explanation: "Incorrect. Complete dominance does not produce intermediate height plants." },
      { label: "1 Tall : 1 Dwarf (50% : 50%)", correct: false, explanation: "Incorrect. 1:1 is the result of a test cross (Aa × aa), not Aa × Aa." },
      { label: "9 Tall : 3 Dwarf : 3 Medium : 1 Short", correct: false, explanation: "Incorrect. 9:3:3:1 is for a dihybrid cross involving two separate traits (AaBb × AaBb)." },
    ],
  },
  {
    id: "q4",
    question: "Why does performing 100 dice rolls yield a ratio much closer to 3:1 than performing only 4 rolls?",
    clue: "Think about statistical sample sizes and the Law of Large Numbers.",
    options: [
      { label: "Large sample size dramatically reduces random statistical variation (Law of Large Numbers)", correct: true, explanation: "Correct! As sample size increases, observed experimental frequencies converge tightly onto theoretical mathematical probability." },
      { label: "The dice become physically biased towards dominant alleles over time", correct: false, explanation: "Incorrect. The probability of each face remains exactly 1/6 for every roll." },
      { label: "Recessive alleles are gradually eliminated during prolonged experiments", correct: false, explanation: "Incorrect. Allele frequencies remain constant across all independent trials." },
      { label: "Parent plants adapt to the laboratory environment and produce better seeds", correct: false, explanation: "Incorrect. This is a mathematical genetic model; plants do not Lamarckian-adapt." },
    ],
  },
];

export default function GeneticsPracticalPage() {
  const [phase, setPhase] = useState<AppPhase>("intro");
  const [tourIndex, setTourIndex] = useState(1);
  const [activeTab, setActiveTab] = useState<"simulator" | "statistics" | "guide">("simulator");

  // Dice simulation state
  const [counts, setCounts] = useState<Counts>(ZERO_COUNTS);
  const [dice, setDice] = useState<[number, number]>([5, 2]);
  const [rolling, setRolling] = useState(false);
  const [recentPlants, setRecentPlants] = useState<{ id: number; genotype: "AA" | "Aa" | "aa" }[]>([]);
  const spinRef = useRef<number | null>(null);

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

  const rand = (): number => 1 + Math.floor(Math.random() * 6);

  const rollDice = useCallback((n: number) => {
    if (rolling) return;
    setRolling(true);

    if (spinRef.current) window.clearInterval(spinRef.current);
    spinRef.current = window.setInterval(() => setDice([rand(), rand()]), 65);

    window.setTimeout(() => {
      if (spinRef.current) window.clearInterval(spinRef.current);
      const next = { ...counts };
      let last: [number, number] = dice;
      const newPlants: { id: number; genotype: "AA" | "Aa" | "aa" }[] = [];

      for (let i = 0; i < n; i++) {
        const d: [number, number] = [rand(), rand()];
        const g = genotypeOf(alleleFor(d[0]), alleleFor(d[1]));
        next[g]++;
        last = d;
        if (i < 8) {
          newPlants.push({ id: Date.now() + i, genotype: g });
        }
      }
      setDice(last);
      setCounts(next);
      setRecentPlants((prev) => [...newPlants, ...prev].slice(0, 16));
      setRolling(false);
    }, n === 1 ? 550 : 250);
  }, [counts, dice, rolling]);

  const totalOffspring = counts.AA + counts.Aa + counts.aa;
  const maxCount = Math.max(1, counts.AA, counts.Aa, counts.aa);
  const pct = (n: number) => (totalOffspring ? Math.round((n / totalOffspring) * 100) : 0);

  const tallCount = counts.AA + counts.Aa;
  const dwarfCount = counts.aa;
  const tallPct = totalOffspring ? Math.round((tallCount / totalOffspring) * 100) : 0;
  const dwarfPct = totalOffspring ? Math.round((dwarfCount / totalOffspring) * 100) : 0;

  // Real-time ratio string (e.g. "3.12 : 1")
  const observedRatioStr = dwarfCount > 0 ? `${(tallCount / dwarfCount).toFixed(2)} : 1` : tallCount > 0 ? `${tallCount} : 0` : "0 : 0";

  // Calculate convergence accuracy (% match with theoretical 75% : 25%)
  const convergenceAccuracy = totalOffspring > 0
    ? Math.max(0, Math.min(100, Math.round(100 - Math.abs(tallPct - 75) * 2)))
    : 0;

  const currentGenotype = genotypeOf(alleleFor(dice[0]), alleleFor(dice[1]));
  const currentPhenotype = currentGenotype === "aa" ? "Dwarf Pea Plant 🌱" : "Tall Pea Plant 🌿";

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
    setCounts({ AA: 0, Aa: 0, aa: 0 });
    setRecentPlants([]);
    setPhase("intro");
  }, []);

  const triggerConfetti = useCallback(async () => {
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({
        particleCount: 95,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#005f02", "#f6c453", "#38bdf8", "#34d399", "#10b981"],
      });
    } catch {
      /* ignore */
    }
  }, []);

  const handleAnswer = useCallback(
    (optIdx: number) => {
      if (selectedOption !== null || feedback) return;
      setSelectedOption(optIdx);

      const q = GENETICS_QUESTIONS[quizStep];
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
          if (quizStep + 1 >= GENETICS_QUESTIONS.length) {
            setPhase("complete");
            triggerConfetti();
          } else {
            setQuizStep((s) => s + 1);
            setSelectedOption(null);
            setFeedback(null);
          }
        }, 1600);
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
        }, 2400);
      }
    },
    [selectedOption, feedback, quizStep, streak, triggerConfetti]
  );

  const activeTourStep = TOUR_STEPS[tourIndex - 1];

  return (
    <div className="fixed inset-0 h-[100dvh] w-full overflow-hidden bg-[#eef4f0] select-none text-[#183c29] font-sans">
      <style>{`
        @keyframes diceTumble {
          0%   { transform: rotate(0deg) scale(1); }
          25%  { transform: rotate(-18deg) scale(1.08); }
          50%  { transform: rotate(16deg) scale(0.95); }
          75%  { transform: rotate(-10deg) scale(1.05); }
          100% { transform: rotate(0deg) scale(1); }
        }
        .dice-tumble { animation: diceTumble 0.32s ease-in-out infinite; }
        @keyframes seedPop {
          0% { transform: scale(0.3) translateY(10px); opacity: 0; }
          60% { transform: scale(1.15) translateY(-4px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .seed-pop { animation: seedPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>

      {/* Subtle Lab Tile Grid Backdrop */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#cadfd2 1.5px, transparent 1.5px), linear-gradient(90deg, #cadfd2 1.5px, transparent 1.5px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Main Specimen & Genetics Workbench Area (Shifted right on landscape & desktop) */}
      <div className="absolute inset-0 flex items-center justify-center landscape:justify-end landscape:pr-[3vw] sm:landscape:pr-[6vw] sm:justify-end sm:pr-8 md:pr-12 lg:pr-16 pt-14 sm:pt-0 pointer-events-none">
        <div className="pointer-events-auto relative w-full max-w-[min(94vw,560px)] sm:max-w-[620px] max-h-[min(70dvh,530px)] sm:max-h-[min(84dvh,590px)] flex flex-col rounded-3xl bg-white/95 p-3 sm:p-4 md:p-5 shadow-[0_12px_45px_rgba(0,0,0,0.12),0_0_80px_rgba(0,95,2,0.08)] border border-white/80 ring-1 ring-[#005f02]/20 backdrop-blur-md transition-all duration-500 ease-out overflow-y-auto overscroll-contain">
          
          {/* Header Banner & Concept Pill */}
          <div className="flex items-center justify-between border-b border-black/5 pb-2 mb-2.5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="flex items-center gap-1 rounded-full bg-[#005f02]/10 px-2.5 py-0.5 text-[10px] sm:text-xs font-black text-[#005f02]">
                <Leaf size={12} className="text-[#005f02]" /> Mendel's Pea Plant Cross
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-black/60 hidden sm:inline">
                Parents: Heterozygous Tall (Aa × Aa)
              </span>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1 bg-black/5 p-0.5 rounded-xl text-[10px] font-black">
              <button
                type="button"
                onClick={() => setActiveTab("simulator")}
                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                  activeTab === "simulator" ? "bg-white text-[#005f02] shadow-xs" : "text-black/50 hover:text-black"
                }`}
              >
                Lab Cross
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("statistics")}
                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                  activeTab === "statistics" ? "bg-white text-[#005f02] shadow-xs" : "text-black/50 hover:text-black"
                }`}
              >
                Ratio Stats
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("guide")}
                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                  activeTab === "guide" ? "bg-white text-[#005f02] shadow-xs" : "text-black/50 hover:text-black"
                }`}
              >
                Cheat Sheet
              </button>
            </div>
          </div>

          {/* TAB 1: Main Interactive Cross Simulator */}
          {activeTab === "simulator" && (
            <div className="space-y-2.5">
              {/* Educational Context Banner */}
              <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/80 px-3 py-1.5 text-[10px] sm:text-[11px] text-emerald-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="size-2 rounded-full bg-[#005f02] animate-pulse" />
                  Trait: <b>Stem Height</b> (Allele <b>A = Tall 🌿</b>, Allele <b>a = Dwarf 🌱</b>)
                </span>
                <span className="font-extrabold text-[#005f02]">{totalOffspring} Total Seeds Bred</span>
              </div>

              {/* Dice Fertilization Chamber */}
              <div
                className={`rounded-2xl border p-2.5 sm:p-3.5 transition-all duration-300 ${
                  phase === "tour" &&
                  (activeTourStep.focusId === "dice_meiosis" || activeTourStep.focusId === "fertilization")
                    ? "border-[#f6c453] bg-amber-50/70 ring-4 ring-[#f6c453]/30"
                    : "border-black/10 bg-[#f8faf8]"
                }`}
              >
                <div className="flex items-center justify-around gap-1 sm:gap-3">
                  {/* Mother Plant Egg Gamete */}
                  <Die face={dice[0]} rolling={rolling} label="Mother Plant (Aa) ♀" />

                  <span className="text-xl sm:text-2xl font-black text-black/20 self-center">×</span>

                  {/* Father Plant Pollen Gamete */}
                  <Die face={dice[1]} rolling={rolling} label="Father Plant (Aa) ♂" />

                  <span className="text-xl sm:text-2xl font-black text-black/20 self-center">=</span>

                  {/* Zygote Offspring & Sprouted Plant */}
                  <div className="flex flex-col items-center text-center">
                    <p className="text-[10px] sm:text-[11px] font-extrabold text-black/60 mb-1">Offspring Zygote</p>
                    <div
                      className={`relative size-14 sm:size-16 md:size-20 rounded-2xl bg-gradient-to-br from-[#005f02] to-[#0a380e] text-white shadow-md flex flex-col items-center justify-center p-1 border-2 border-emerald-400/40 transition-transform ${
                        rolling ? "opacity-50 scale-95" : "scale-100 seed-pop"
                      }`}
                    >
                      <span className="text-base sm:text-xl font-black tracking-wider">
                        {rolling ? "?" : currentGenotype}
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-bold text-amber-300 truncate max-w-full">
                        {rolling ? "Fertilizing…" : currentGenotype === "aa" ? "Dwarf 🌱" : "Tall 🌿"}
                      </span>
                    </div>

                    <div className="mt-2 text-center">
                      <span className="inline-block rounded-full bg-black/5 px-2 py-0.5 text-[9px] font-black text-black/70">
                        {currentGenotype === "AA"
                          ? "Homozygous Dominant"
                          : currentGenotype === "Aa"
                          ? "Heterozygous"
                          : "Homozygous Recessive"}
                      </span>
                      <p className="text-[8.5px] font-extrabold text-[#005f02] mt-0.5">{currentPhenotype}</p>
                    </div>
                  </div>
                </div>

                {/* Cross Action Controls */}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 border-t border-black/5 pt-2.5">
                  <button
                    type="button"
                    onClick={() => rollDice(1)}
                    disabled={rolling}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#005f02] px-3.5 py-1.5 text-xs font-black text-white shadow-md transition hover:bg-[#004701] active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Dices size={14} /> Roll Single Cross
                  </button>
                  <button
                    type="button"
                    onClick={() => rollDice(10)}
                    disabled={rolling}
                    className="inline-flex items-center gap-1 rounded-xl bg-[#005f02]/10 px-3 py-1.5 text-xs font-black text-[#005f02] transition hover:bg-[#005f02]/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    +10 Crosses
                  </button>
                  <button
                    type="button"
                    onClick={() => rollDice(50)}
                    disabled={rolling}
                    className="inline-flex items-center gap-1 rounded-xl bg-[#005f02]/10 px-3 py-1.5 text-xs font-black text-[#005f02] transition hover:bg-[#005f02]/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    +50 Crosses
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCounts(ZERO_COUNTS);
                      setRecentPlants([]);
                    }}
                    disabled={rolling || totalOffspring === 0}
                    className="inline-flex items-center gap-1 rounded-xl bg-black/5 px-2.5 py-1.5 text-xs font-bold text-black/50 transition hover:bg-black/10 active:scale-95 disabled:opacity-40 cursor-pointer"
                  >
                    <RotateCcw size={12} /> Reset
                  </button>
                </div>
              </div>

              {/* Punnett Matrix & Live Garden Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 2×2 Punnett Square */}
                <div
                  className={`rounded-2xl border p-2.5 sm:p-3 transition-all duration-300 ${
                    phase === "tour" && activeTourStep.focusId === "punnett"
                      ? "border-[#f6c453] bg-amber-50/70 ring-4 ring-[#f6c453]/30"
                      : "border-black/10 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-black text-black/70 mb-1.5">
                    <span>Punnett Square (Theoretical 25% each)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center text-xs font-black">
                    <div className="p-1 text-black/40 text-[9px] flex items-center justify-center">♀ \ ♂</div>
                    <div className="p-1 rounded bg-[#005f02]/10 text-[#005f02] text-[10px]">A (50%)</div>
                    <div className="p-1 rounded bg-[#f6c453]/30 text-[#0f2e12] text-[10px]">a (50%)</div>

                    <div className="p-1 rounded bg-[#005f02]/10 text-[#005f02] flex items-center justify-center text-[10px]">A</div>
                    <div
                      className={`p-1.5 rounded-lg border font-black transition-all ${
                        alleleFor(dice[0]) === "A" && alleleFor(dice[1]) === "A"
                          ? "bg-[#005f02] text-white ring-2 ring-[#f6c453] scale-105"
                          : "bg-emerald-50 text-[#005f02] border-emerald-200"
                      }`}
                    >
                      <div className="text-[11px]">AA</div>
                      <div className="text-[8px] font-normal opacity-80">Tall 🌿</div>
                    </div>
                    <div
                      className={`p-1.5 rounded-lg border font-black transition-all ${
                        (alleleFor(dice[0]) === "A" && alleleFor(dice[1]) === "a") ||
                        (alleleFor(dice[0]) === "a" && alleleFor(dice[1]) === "A")
                          ? "bg-[#005f02] text-white ring-2 ring-[#f6c453] scale-105"
                          : "bg-emerald-50/60 text-[#005f02] border-emerald-200"
                      }`}
                    >
                      <div className="text-[11px]">Aa</div>
                      <div className="text-[8px] font-normal opacity-80">Tall 🌿</div>
                    </div>

                    <div className="p-1 rounded bg-[#f6c453]/30 text-[#0f2e12] flex items-center justify-center text-[10px]">a</div>
                    <div
                      className={`p-1.5 rounded-lg border font-black transition-all ${
                        (alleleFor(dice[0]) === "A" && alleleFor(dice[1]) === "a") ||
                        (alleleFor(dice[0]) === "a" && alleleFor(dice[1]) === "A")
                          ? "bg-[#005f02] text-white ring-2 ring-[#f6c453] scale-105"
                          : "bg-emerald-50/60 text-[#005f02] border-emerald-200"
                      }`}
                    >
                      <div className="text-[11px]">Aa</div>
                      <div className="text-[8px] font-normal opacity-80">Tall 🌿</div>
                    </div>
                    <div
                      className={`p-1.5 rounded-lg border font-black transition-all ${
                        alleleFor(dice[0]) === "a" && alleleFor(dice[1]) === "a"
                          ? "bg-[#f6c453] text-[#0f2e12] ring-2 ring-[#005f02] scale-105"
                          : "bg-amber-50 text-amber-900 border-amber-200"
                      }`}
                    >
                      <div className="text-[11px]">aa</div>
                      <div className="text-[8px] font-normal opacity-80">Dwarf 🌱</div>
                    </div>
                  </div>
                </div>

                {/* Phenotype Summary Gauge */}
                <div
                  className={`rounded-2xl border p-2.5 sm:p-3 transition-all duration-300 ${
                    phase === "tour" && activeTourStep.focusId === "phenotype_vs_genotype"
                      ? "border-[#f6c453] bg-amber-50/70 ring-4 ring-[#f6c453]/30"
                      : "border-black/10 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-black text-black/70 mb-1">
                    <span>Observed Phenotypes</span>
                    <span className="text-[#005f02] font-black">Ratio: {observedRatioStr}</span>
                  </div>

                  <div className="space-y-2 mt-2">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-black/70 mb-0.5">
                        <span className="flex items-center gap-1">🌿 Tall Plants (AA + Aa)</span>
                        <span className="font-black text-[#005f02]">{tallCount} ({tallPct}%)</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-black/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#005f02] transition-all duration-300"
                          style={{ width: `${tallPct}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-black/70 mb-0.5">
                        <span className="flex items-center gap-1">🌱 Dwarf Plants (aa)</span>
                        <span className="font-black text-amber-700">{dwarfCount} ({dwarfPct}%)</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-black/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#f6c453] transition-all duration-300"
                          style={{ width: `${dwarfPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[9px] text-black/50 border-t border-black/5">
                      <span>Mendel Target: <b>75% Tall : 25% Dwarf (3 : 1)</b></span>
                      <span className="font-bold text-[#005f02]">{convergenceAccuracy}% Match</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Detailed Ratio Statistics & Convergence Analysis */}
          {activeTab === "statistics" && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-black/10 bg-[#f8faf8] p-3">
                <h3 className="text-xs font-black text-black mb-2 flex items-center gap-1.5">
                  <BarChart3 size={14} className="text-[#005f02]" /> Genotypic Breakdown (AA : Aa : aa)
                </h3>
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-black/80 mb-0.5">
                      <span>AA (Homozygous Dominant)</span>
                      <span className="font-black text-[#005f02]">{counts.AA} count · {pct(counts.AA)}% (Target: 25%)</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-black/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#005f02] transition-all duration-300"
                        style={{ width: `${(counts.AA / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-black/80 mb-0.5">
                      <span>Aa (Heterozygous Carrier)</span>
                      <span className="font-black text-[#2f8f3a]">{counts.Aa} count · {pct(counts.Aa)}% (Target: 50%)</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-black/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#2f8f3a] transition-all duration-300"
                        style={{ width: `${(counts.Aa / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-black/80 mb-0.5">
                      <span>aa (Homozygous Recessive)</span>
                      <span className="font-black text-[#f6c453]">{counts.aa} count · {pct(counts.aa)}% (Target: 25%)</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-black/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#f6c453] transition-all duration-300"
                        style={{ width: `${(counts.aa / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Law of Large Numbers Explanation Card */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950">
                <p className="font-black text-[#005f02] mb-1 flex items-center gap-1.5">
                  <Sparkles size={13} /> The Law of Large Numbers:
                </p>
                <p className="leading-relaxed text-[11px] text-emerald-900/90">
                  With small sample sizes (e.g. 4 rolls), random variation can produce anomalous distributions like 4 AA or 0 aa. 
                  However, as you generate 50 to 100+ offspring, the observed counts converge directly onto the theoretical <b>1 : 2 : 1</b> genotypic and <b>3 : 1</b> phenotypic ratios.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Biology Concept Cheat Sheet */}
          {activeTab === "guide" && (
            <div className="space-y-2 text-xs">
              <div className="rounded-xl border border-black/10 bg-white p-2.5">
                <p className="font-black text-[#005f02] text-[11px] mb-0.5">🧬 What is a Gene vs Allele?</p>
                <p className="text-[10.5px] text-black/70 leading-snug">
                  A <b>Gene</b> controls a trait (e.g., plant height). <b>Alleles</b> are different versions of that gene: <b>A</b> produces Tall plants, while <b>a</b> produces Dwarf plants.
                </p>
              </div>

              <div className="rounded-xl border border-black/10 bg-white p-2.5">
                <p className="font-black text-[#005f02] text-[11px] mb-0.5">👑 Dominant vs Recessive</p>
                <p className="text-[10.5px] text-black/70 leading-snug">
                  <b>Dominant (A)</b>: Always expressed even if only one copy is present (AA and Aa are both Tall).<br />
                  <b>Recessive (a)</b>: Only expressed when homozygous (aa is Dwarf).
                </p>
              </div>

              <div className="rounded-xl border border-black/10 bg-white p-2.5">
                <p className="font-black text-[#005f02] text-[11px] mb-0.5">🎲 Why do Dice faces 1–3 = a and 4–6 = A?</p>
                <p className="text-[10.5px] text-black/70 leading-snug">
                  During meiosis, chromosomes separate equally. Each gamete has a 50% probability (1/2) of receiving 'A' and 50% of receiving 'a'. The 6-sided die perfectly simulates this 3/6 (50%) probability.
                </p>
              </div>
            </div>
          )}
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
          Biology · Class XII · Gene Mixing & Genetics
        </span>
      </div>

      {/* PHASE 1: Pre-Practical Briefing Screen */}
      {phase === "intro" && (
        <PracticalIntro
          brief={{
            expNo: 8,
            title: "Gene Mixing & Mendelian Monohybrid Cross Simulation",
            object:
              "To investigate the random segregation and union of alleles in heterozygous parents (Aa × Aa) using gamete dice models, verifying the 1:2:1 genotypic and 3:1 phenotypic ratios.",
            apparatus: [
              "Two Gamete Dice (Faces 1–3 = 'a', Faces 4–6 = 'A')",
              "Fertilization Incubator Model",
              "Punnett Square Matrix",
              "Genotype Frequency Counter",
              "Phenotype Ratio Calculator",
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
            "Gamete Dice Model",
            "Punnett Square Matrix",
            "Genotype Tally Bars",
            "Offspring Calculator",
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
                  <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Genetics Challenge · Q{quizStep + 1} of {GENETICS_QUESTIONS.length}
                </p>
                <h2 className="text-xs sm:text-sm font-black text-white leading-tight mt-0.5">
                  {GENETICS_QUESTIONS[quizStep].question}
                </h2>
              </div>

              <div className="border-t border-white/15 bg-black/20 p-2 sm:p-2.5 flex-1 overflow-y-auto overscroll-contain space-y-1.5">
                {GENETICS_QUESTIONS[quizStep].options.map((opt, idx) => {
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
              <h2 className="mt-1 text-base sm:text-xl font-black">Mendelian Genetics Mastered!</h2>
              <p className="mt-0.5 text-[10px] sm:text-xs text-white/80">
                You successfully verified allele segregation, Punnett combinations, and the 1:2:1 genotypic ratio.
              </p>
            </div>

            <div className="border-t border-white/15 bg-black/20 p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 overflow-y-auto overscroll-contain">
              <div className="rounded-xl sm:rounded-2xl bg-black/30 p-2.5 sm:p-3 border border-white/10 text-xs">
                <p className="font-bold text-[#f6c453] uppercase tracking-wider text-[9px] sm:text-[10px]">Statistical Summary</p>
                <div className="mt-1.5 grid grid-cols-2 gap-2 text-white/90">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-center">
                    <p className="text-[9px] text-white/60">Total Crosses</p>
                    <p className="text-sm font-black text-[#f6c453]">{totalOffspring} Seeds</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-center">
                    <p className="text-[9px] text-white/60">Observed Ratio</p>
                    <p className="text-sm font-black text-emerald-400">{observedRatioStr}</p>
                  </div>
                </div>

                <div className="mt-2 p-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/80 leading-snug">
                  <p className="font-bold text-white mb-0.5">Core Biological Law:</p>
                  Because allele <b>A (Tall)</b> is completely dominant over <b>a (Dwarf)</b>, both AA and Aa produce Tall plants. This produces the signature <b>3 : 1 Phenotypic Ratio</b> in every heterozygous cross!
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
              <p className="text-xs text-white/70">Mendelian Gene Mixing with Dice</p>
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
