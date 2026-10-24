"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Play, RotateCcw, X } from "lucide-react";
import PracticalIntro from "../_practical/PracticalIntro";
import { playGameCorrectSound, playGameWrongSound } from "@/app/student/lab-game/_scene/labAudio";
import type { ApparatusId } from "./RespirationScene";

const RespirationScene = dynamic(() => import("./RespirationScene"), { ssr: false });
const TOUR: { name: string; focus: ApparatusId }[] = [
  { name: "Flask A · living seeds", focus: "flask_a" },
  { name: "Empty test tube", focus: "empty_tube" },
  { name: "Potassium hydroxide (KOH)", focus: "koh_box" },
  { name: "Bent glass delivery tube", focus: "delivery_tube" },
  { name: "Receiving beaker A", focus: "beaker_a" },
  { name: "Flask B · boiled seed control", focus: "flask_b" },
  { name: "Receiving beaker B", focus: "beaker_b" },
  { name: "Colored water reagent beaker", focus: "colored_water" },
];
const BRIEF = {
  expNo: 1,
  title: "Investigate respiration in germinating seeds",
  object: "Assemble two sealed respirometers, run the experiment for six hours, and compare living seeds with boiled seeds.",
  theory: [
    "Living seeds consume oxygen and release carbon dioxide while respiring.",
    "The suspended KOH absorbs the carbon dioxide. This lowers pressure in the sealed flask.",
    "Outside air pushes colored water up the delivery tube. The rise shows oxygen uptake.",
  ],
  apparatus: TOUR.map((item) => item.name),
};
const SETUP_STEPS = [
  { title: "Take test tube A", action: "pick up the empty test tube for Flask A", detail: "Use the same rounded glass test tube shown in the apparatus tour." },
  { title: "Add KOH to test tube A", action: "put KOH from the chemical box into test tube A", detail: "KOH will absorb carbon dioxide released by the living seeds." },
  { title: "Seal Flask A", action: "suspend the KOH test tube and fit the rubber stopper", detail: "Keep the KOH away from the moist, germinating seeds." },
  { title: "Connect Flask A", action: "fit the bent glass delivery tube through the stopper", detail: "Its free end must dip into the beaker of colored water." },
  { title: "Take test tube B", action: "pick up the empty test tube for Flask B", detail: "Flask B contains boiled, nonliving seeds for a fair control." },
  { title: "Add KOH to test tube B", action: "put KOH from the chemical box into test tube B", detail: "Add the same amount as in test tube A." },
  { title: "Seal Flask B", action: "suspend the KOH test tube and fit the rubber stopper", detail: "Both flasks must have the same airtight setup." },
  { title: "Connect Flask B", action: "fit the second bent glass delivery tube", detail: "The control also gets a tube dipping into its beaker." },
  { title: "Fill beaker A", action: "pour colored water from its reagent beaker into receiving beaker A", detail: "Watch the water level at the start of the experiment." },
  { title: "Fill beaker B", action: "pour the same colored water into receiving beaker B", detail: "Both beakers now begin at the same level." },
];
type Phase = "intro" | "setup" | "read" | "running" | "result" | "quiz" | "complete";

type Question = {
  question: string;
  options: { label: string; correct: boolean; explanation: string }[];
};

const RESPIRATION_QUESTIONS: Question[] = [
  {
    question: "Why is a suspended tube of Potassium Hydroxide (KOH) placed inside the flask?",
    options: [
      {
        label: "To absorb all CO₂ gas released by germinating seeds",
        correct: true,
        explanation: "KOH reacts with CO₂ to form K₂CO₃, eliminating CO₂ gas pressure to create a partial vacuum.",
      },
      {
        label: "To release oxygen gas for seed germination",
        correct: false,
        explanation: "KOH does not generate oxygen; it acts as a chemical absorbent for acidic CO₂.",
      },
      {
        label: "To maintain moisture and water humidity inside the flask",
        correct: false,
        explanation: "Moist filter paper supplies humidity; KOH is specifically used to absorb carbon dioxide.",
      },
      {
        label: "To act as a nutrient fertilizer for the embryo roots",
        correct: false,
        explanation: "KOH is caustic and suspended away from the seeds solely for gas absorption.",
      },
    ],
  },
  {
    question: "Why does the colored water level rise in the bent delivery tube of Flask A?",
    options: [
      {
        label: "Seeds consume O₂ and released CO₂ is absorbed by KOH, creating negative pressure",
        correct: true,
        explanation: "The partial vacuum inside allows higher external atmospheric pressure to push water up the tube.",
      },
      {
        label: "The seeds push water upward through capillary suction",
        correct: false,
        explanation: "Seeds do not touch the delivery tube; the water rise is caused by air pressure imbalance.",
      },
      {
        label: "Carbon dioxide gas pressure builds up and pulls water",
        correct: false,
        explanation: "CO₂ is absorbed by KOH, decreasing pressure rather than increasing it.",
      },
      {
        label: "Water evaporates from the beaker due to heat from seeds",
        correct: false,
        explanation: "Water rises specifically in the tube connected to the airtight respiring flask.",
      },
    ],
  },
  {
    question: "What is the purpose of Flask B containing boiled seeds?",
    options: [
      {
        label: "It acts as a control to prove water rise is caused solely by living respiration",
        correct: true,
        explanation: "Boiled seeds do not respire, so this control confirms that living seeds cause the oxygen uptake.",
      },
      {
        label: "To test whether boiled seeds germinate faster",
        correct: false,
        explanation: "Boiling kills the seed embryo; dead seeds cannot germinate.",
      },
      {
        label: "To generate excess carbon dioxide for comparison",
        correct: false,
        explanation: "Dead boiled seeds have no metabolic activity and do not generate carbon dioxide.",
      },
      {
        label: "To absorb water vapor from the laboratory atmosphere",
        correct: false,
        explanation: "Both setups are sealed with airtight vaseline-coated corks.",
      },
    ],
  },
  {
    question: "Which chemical equation accurately represents aerobic cellular respiration in seeds?",
    options: [
      {
        label: "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energy",
        correct: true,
        explanation: "Aerobic oxidation of glucose consumes O₂ and yields CO₂, H₂O, and metabolic energy.",
      },
      {
        label: "6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂",
        correct: false,
        explanation: "This is the equation for photosynthesis, not cellular respiration.",
      },
      {
        label: "C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂ + 2 ATP",
        correct: false,
        explanation: "This is anaerobic alcoholic fermentation in yeast, not aerobic respiration in seeds.",
      },
      {
        label: "2H₂O₂ → 2H₂O + O₂",
        correct: false,
        explanation: "This is the breakdown of hydrogen peroxide by catalase enzyme.",
      },
    ],
  },
];

export default function PracticalRespirationCO2() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [introIdx, setIntroIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [assembly, setAssembly] = useState(0);
  const [acting, setActing] = useState(false);
  const [hours, setHours] = useState(0);
  const [compact, setCompact] = useState(false);
  const [activeFlask, setActiveFlask] = useState<"A" | "B">("A");
  const [quizStep, setQuizStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ type: "correct" | "wrong"; explanation: string } | null>(null);
  const [showQuit, setShowQuit] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px), (max-width: 1023px) and (max-height: 600px)");
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (phase !== "running") return;
    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const ratio = Math.min(1, (now - started) / 9500);
      setHours(ratio * 6);
      if (ratio < 1) frame = requestAnimationFrame(tick);
      else setPhase("result");
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  const onIntroSlide = useCallback((index: number) => {
    setIntroIdx(index);
    setActiveFlask(index >= 6 && index <= 7 ? "B" : "A");
  }, []);
  const startSetup = useCallback(() => {
    setIntroIdx(0);
    setStep(0);
    setAssembly(0);
    setHours(0);
    setActiveFlask("A");
    setPhase("setup");
  }, []);
  const performStep = useCallback(() => {
    if (phase !== "setup" || acting) return;
    setActing(true);
    const start = performance.now();
    const animate = (now: number) => {
      const duration = step >= 8 ? 2400 : step === 1 || step === 5 ? 1800 : 850;
      const fraction = Math.min(1, (now - start) / duration);
      const eased = fraction * fraction * (3 - 2 * fraction);
      setAssembly(step + eased);
      if (fraction < 1) requestAnimationFrame(animate);
      else {
        const next = step + 1;
        setAssembly(next);
        setStep(next);
        setActing(false);
        if (next === 4) setActiveFlask("B");
        if (next === SETUP_STEPS.length) setPhase("read");
      }
    };
    requestAnimationFrame(animate);
  }, [phase, acting, step]);
  useEffect(() => {
    if (phase !== "setup") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "x" && !(event.target instanceof HTMLInputElement)) {
        event.preventDefault();
        performStep();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, performStep]);

  const startQuiz = () => { setQuizStep(0); setSelectedOption(null); setFeedback(null); setScore(0); setPhase("quiz"); };
  const reset = () => { setPhase("intro"); setIntroIdx(0); setStep(0); setAssembly(0); setActing(false); setHours(0); setQuizStep(0); setScore(0); setFeedback(null); };
  const handleAnswer = useCallback((optionIndex: number) => {
    if (selectedOption !== null) return;
    const option = RESPIRATION_QUESTIONS[quizStep].options[optionIndex];
    setSelectedOption(optionIndex);
    setFeedback({ type: option.correct ? "correct" : "wrong", explanation: option.explanation });
    if (option.correct) { playGameCorrectSound(); setScore((value) => value + 100); }
    else playGameWrongSound();
  }, [quizStep, selectedOption]);
  const advanceQuiz = () => {
    if (quizStep === RESPIRATION_QUESTIONS.length - 1) {
      setPhase("complete");
      import("canvas-confetti").then(({ default: confetti }) => confetti({ particleCount: 85, spread: 70, origin: { y: 0.65 } })).catch(() => {});
    } else { setQuizStep((value) => value + 1); setSelectedOption(null); setFeedback(null); }
  };
  const focus = phase === "intro" && introIdx > 0 ? TOUR[introIdx - 1]?.focus ?? null : null;

  return <main className="relative min-h-dvh bg-[#c5d3ca] font-sans text-white md:h-dvh md:overflow-hidden">
    <style>{`
      @media (max-width: 1023px) and (max-height: 600px) and (orientation: landscape) {
        .respiration-scene { position: absolute !important; inset: 0 !important; height: 100dvh !important; min-height: 0 !important; }
        .respiration-guide, .respiration-read, .respiration-result, .respiration-running {
          position: absolute !important; left: auto !important; right: .6rem !important;
          bottom: .6rem !important; transform: none !important;
          width: min(36vw, 330px) !important; max-height: calc(100dvh - 4.1rem);
          overflow-y: auto; padding: .65rem !important;
        }
        .respiration-guide h1, .respiration-read h1, .respiration-result h1 { font-size: .83rem !important; line-height: 1.15 !important; }
        .respiration-guide button, .respiration-read button, .respiration-result button { min-height: 2rem !important; font-size: .69rem !important; }
        .respiration-read p, .respiration-result p { font-size: .66rem !important; line-height: 1.25 !important; }
        .respiration-result .respiration-metrics { margin-top: .4rem !important; }
        .respiration-result .respiration-metrics > div { padding: .35rem !important; }
        .respiration-switcher { left: .6rem !important; right: auto !important; bottom: .6rem !important; }
        .respiration-quiz-backdrop { padding: .4rem .4rem calc(.4rem + env(safe-area-inset-bottom)) !important; }
        .respiration-quiz {
          display: flex; flex-direction: column; width: min(78vw, 500px) !important;
          max-height: calc(100dvh - .8rem - env(safe-area-inset-bottom)) !important; padding: .7rem !important;
          overflow: hidden !important; border-radius: 1rem !important;
        }
        .respiration-quiz h1 { flex: none; margin-top: .35rem !important; font-size: .92rem !important; line-height: 1.15 !important; }
        .respiration-options { flex: 1 1 auto; min-height: 0; overflow-y: auto; margin-top: .55rem !important; }
        .respiration-options button { min-height: 2rem !important; padding: .3rem .55rem !important; font-size: .7rem !important; }
        .respiration-options button span { width: 1.4rem !important; height: 1.4rem !important; font-size: .68rem !important; }
        .respiration-feedback { flex: none; max-height: 3.5rem; overflow-y: auto; margin-top: .4rem !important; padding: .4rem !important; font-size: .65rem !important; }
        .respiration-quiz-action { flex: none; min-height: 2rem !important; margin-top: .4rem !important; font-size: .72rem !important; }
        .respiration-dialog-backdrop { padding: .4rem .4rem calc(.4rem + env(safe-area-inset-bottom)) !important; }
        .respiration-dialog { max-height: calc(100dvh - .8rem - env(safe-area-inset-bottom)); overflow-y: auto; padding: .7rem !important; }
        .respiration-dialog h1, .respiration-dialog h2 { font-size: .95rem !important; }
        .respiration-dialog p { margin-top: .35rem !important; padding: .4rem !important; font-size: .7rem !important; line-height: 1.25 !important; }
        .respiration-dialog > div { margin-top: .5rem !important; }
        .respiration-dialog button, .respiration-dialog a { min-height: 2rem !important; font-size: .7rem !important; }
      }
    `}</style>
    <div className={`respiration-scene relative overflow-hidden md:absolute md:inset-0 md:h-auto ${phase === "intro" ? "h-dvh" : "h-[49dvh] min-h-[290px]"}`}>
      <RespirationScene hours={hours} assembly={assembly} compact={compact} activeFlask={activeFlask} intro={phase === "intro"} introIdx={introIdx} focus={focus} />
      {compact && phase !== "intro" && <div className="respiration-switcher absolute bottom-3 right-3 flex rounded-full border border-white/20 bg-black/75 p-1">
        {(["A", "B"] as const).map((flask) => <button key={flask} type="button" onClick={() => setActiveFlask(flask)} className={`min-h-9 rounded-full px-3 text-xs font-bold ${activeFlask === flask ? "bg-amber-300 text-[#173221]" : "text-white"}`}>Flask {flask}</button>)}
      </div>}
    </div>

    {phase === "intro" && <PracticalIntro subject="Biology" exitHref="/student/lab-game/biology" brief={BRIEF} apparatus={TOUR.map((item) => item.name)} onSlide={onIntroSlide} onStart={startSetup} />}
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3 md:p-4">
      <button type="button" onClick={() => setShowQuit(true)} className="pointer-events-auto inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-black/75 px-3 text-xs font-bold shadow-lg backdrop-blur"><ArrowLeft size={15} /> Exit lab</button>
      <span className="max-w-[56vw] truncate rounded-full border border-white/20 bg-black/75 px-3 py-2 text-center text-[10px] font-extrabold uppercase tracking-wide text-white/90 shadow-lg backdrop-blur sm:max-w-none sm:text-xs"><span className="sm:hidden">Seed respiration</span><span className="hidden sm:inline">Biology lab · Seed respiration</span></span>
    </header>

    <span role="status" className="sr-only">{hours.toFixed(1)} of 6 hours elapsed</span>

    {phase === "setup" && !acting && <div data-ui className="respiration-guide pointer-events-none relative z-10 flex w-full justify-center px-2 pb-2 md:absolute md:inset-x-0 md:bottom-0 md:px-4 md:pb-3">
      <section className="pointer-events-auto w-full max-w-[500px] animate-in fade-in slide-in-from-bottom-2 overflow-hidden rounded-2xl border border-white/50 bg-white/95 text-black shadow-xl backdrop-blur duration-300">
        <div className="p-3 sm:p-3.5">
          <h1 className="text-[17px] font-black leading-snug text-black break-words">{SETUP_STEPS[step].title}.</h1>
          <button type="button" onClick={performStep} className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-primary-dark px-2 py-1 text-sm font-bold text-white shadow-md shadow-primary/30"><kbd className="grid size-4 shrink-0 place-items-center rounded bg-white text-[10px] font-black text-primary shadow">X</kbd>Press X to {SETUP_STEPS[step].action}</button>
          <div className="mt-2.5 flex gap-1" aria-label="Setup progress">{SETUP_STEPS.map((_, i) => <span key={i} className={`h-1 flex-1 rounded-full ${i < step ? "bg-gradient-to-r from-primary to-primary-dark" : i === step ? "bg-primary/60" : "bg-black/10"}`} />)}</div>
        </div>
      </section>
    </div>}

    {phase === "read" && <section data-ui className="respiration-read relative z-10 w-full bg-gradient-to-br from-[#306b1f] to-[#154718] p-5 shadow-2xl md:absolute md:bottom-5 md:left-1/2 md:w-[min(90vw,710px)] md:-translate-x-1/2 md:rounded-3xl md:p-6">
      <p className="inline-flex rounded-full border border-amber-300/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-200">Read first</p>
      <h1 className="mt-2 text-xl font-black">What will happen in six hours?</h1>
      <p className="mt-2 text-sm leading-relaxed text-white/85">Living seeds use O₂ and release CO₂. KOH absorbs that CO₂, lowering pressure in Flask A. Outside air pushes the same colored water up its glass tube. Boiled seeds in Flask B do not respire, so its water level stays nearly unchanged.</p>
      <button type="button" onClick={() => { setHours(0); setPhase("running"); }} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-[#235919]"><Play size={16} /> Run experiment</button>
    </section>}

    {phase === "running" && <div className="respiration-running relative z-10 w-full bg-[#163b27] p-4 text-center text-sm font-bold md:absolute md:bottom-5 md:left-1/2 md:w-auto md:-translate-x-1/2 md:rounded-full md:px-6">Observe the colored water rising smoothly in Flask A.</div>}

    {phase === "result" && <section data-ui className="respiration-result relative z-10 w-full bg-gradient-to-br from-[#306b1f] to-[#154718] p-4 shadow-2xl md:absolute md:bottom-3 md:left-1/2 md:w-[min(90vw,500px)] md:-translate-x-1/2 md:rounded-2xl">
      <p className="text-[9px] font-black uppercase tracking-widest text-amber-200">Observation · six hours complete</p>
      <h1 className="mt-1 text-base font-black sm:text-lg">Living seeds changed the water level</h1>
      <div className="respiration-metrics mt-2 grid grid-cols-2 gap-2 text-center"><div className="rounded-lg bg-white/10 p-2"><p className="text-[10px] text-white/75">Flask A · living</p><strong className="text-base text-amber-200">+42 mm</strong></div><div className="rounded-lg bg-white/10 p-2"><p className="text-[10px] text-white/75">Flask B · boiled</p><strong className="text-base">0 mm</strong></div></div>
      <p className="mt-2 text-[11px] leading-snug text-white/80">KOH absorbed the released CO₂. The water rise in Flask A indicates O₂ uptake by living seeds.</p>
      <button type="button" onClick={startQuiz} className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-[#235919]">Start challenge <ArrowRight size={15} /></button>
    </section>}

    {phase === "quiz" && <div className="respiration-quiz-backdrop fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-3 backdrop-blur-[2px]">
      <section data-ui className="respiration-quiz flex w-full max-w-[620px] max-h-[min(90dvh,700px)] flex-col overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-[#225331] to-[#143722] p-5 shadow-2xl sm:p-7">
        <p className="text-[10px] font-black uppercase tracking-[.17em] text-amber-300">Respiration challenge · {quizStep + 1}/{RESPIRATION_QUESTIONS.length}</p>
        <h1 className="mt-3 text-lg font-black leading-tight sm:text-2xl">{RESPIRATION_QUESTIONS[quizStep].question}</h1>
        <div className="respiration-options mt-5 min-h-0 space-y-2 overflow-y-auto">{RESPIRATION_QUESTIONS[quizStep].options.map((option, i) => <button key={i} type="button" disabled={selectedOption !== null} onClick={() => handleAnswer(i)} className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-xs font-semibold leading-snug sm:text-sm ${selectedOption === i ? option.correct ? "border-emerald-300 bg-emerald-600" : "border-rose-300 bg-rose-700" : "border-white/20 bg-white/10 hover:bg-white/20"}`}><span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/15 font-black">{String.fromCharCode(65 + i)}</span>{option.label}</button>)}</div>
        {feedback && <div role="status" className={`respiration-feedback mt-4 rounded-xl border p-3 text-xs leading-relaxed sm:text-sm ${feedback.type === "correct" ? "border-emerald-300/40 bg-emerald-900/60" : "border-rose-300/40 bg-rose-900/60"}`}><div className="mb-1 flex items-center gap-1 font-black">{feedback.type === "correct" ? <Check size={14} /> : <X size={14} />}{feedback.type === "correct" ? "Correct" : "Try again"}</div>{feedback.explanation}</div>}
        {feedback?.type === "correct" && <button type="button" onClick={advanceQuiz} className="respiration-quiz-action mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-3 text-sm font-black text-[#173b29]">{quizStep === RESPIRATION_QUESTIONS.length - 1 ? "See results" : "Next question"}<ArrowRight size={16} /></button>}
        {feedback?.type === "wrong" && <button type="button" onClick={() => { setSelectedOption(null); setFeedback(null); }} className="respiration-quiz-action mt-4 min-h-10 w-full rounded-xl border border-white/25 text-sm font-bold">Try another answer</button>}
      </section>
    </div>}

    {phase === "complete" && <div className="respiration-dialog-backdrop fixed inset-0 z-40 grid place-items-center bg-black/55 p-3"><section className="respiration-dialog w-full max-w-md rounded-3xl bg-[#1c492c] p-6 shadow-2xl"><p className="text-[10px] font-black uppercase tracking-widest text-amber-300">Practical complete</p><h1 className="mt-2 text-2xl font-black">Seed respiration</h1><p className="mt-2 text-sm text-white/75">You scored {score} / {RESPIRATION_QUESTIONS.length * 100} points.</p><p className="mt-4 rounded-xl bg-white/10 p-3 text-sm leading-relaxed">Living seeds consumed oxygen. KOH absorbed the carbon dioxide, so the water level rose in Flask A. The boiled-seed control remained unchanged.</p><div className="mt-5 flex gap-2"><button type="button" onClick={reset} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-300 px-3 text-sm font-black text-[#173b29]"><RotateCcw size={16} /> Repeat</button><Link href="/student/lab-game/biology" className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-white/25 px-3 text-center text-sm font-bold">Biology lab</Link></div></section></div>}

    {showQuit && <div className="respiration-dialog-backdrop fixed inset-0 z-[80] grid place-items-center bg-black/65 p-4"><div className="respiration-dialog w-full max-w-sm rounded-2xl border border-white/20 bg-[#173b29] p-5 shadow-2xl"><h2 className="text-xl font-black">Leave the lab?</h2><p className="mt-2 text-sm text-white/70">Your current experiment progress will be reset.</p><div className="mt-5 flex gap-2"><button type="button" onClick={() => setShowQuit(false)} className="min-h-11 flex-1 rounded-xl border border-white/30 text-sm font-bold">Stay</button><Link href="/student/lab-game/biology" className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-rose-600 text-sm font-bold">Exit lab</Link></div></div></div>}
  </main>;
}
