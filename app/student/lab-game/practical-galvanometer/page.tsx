"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { RotateCcw, ArrowRight, Gauge, Sliders, BookOpen, LoaderCircle } from "lucide-react";
import Journal, { JTable, type JournalConfig } from "../_practical/physics/Journal";
import PracticalIntro, { type PracticeBrief } from "../_practical/PracticalIntro";
import { ResultCard } from "../_practical/physics/kit";
import { GALVO_TOUR_ITEMS } from "./GalvanometerScene";
import PhysicsQuestCard from "../_practical/physics/PhysicsQuestCard";
import type { GalvoFocus } from "./GalvanometerScene";

const E = 2.0; // cell EMF (V)
const G_TRUE = 50.0; // true galvanometer resistance (Ω)
const SCALE = 25000; // divisions per amp

// galvanometer current (and thus deflection) with an optional shunt S.
function deflectionFor(r: number, s: number | null) {
  if (s == null) return Math.min(30, SCALE * (E / (r + G_TRUE)));
  const gp = (G_TRUE * s) / (G_TRUE + s); // G ∥ S
  const I = E / (r + gp);
  const ig = I * (s / (s + G_TRUE)); // current through G
  return Math.min(30, SCALE * ig);
}

const GalvanometerScene = dynamic(() => import("./GalvanometerScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm font-medium text-black/40">
      Loading lab…
    </div>
  ),
});

type StepPhase = "step1_full_def" | "step2_connect_shunt" | "step3_adjust_s" | "done";
const CONNECTIONS: { focus: GalvoFocus; title: string; body: string; action: string }[] = [
  { focus: "source_pos", title: "Locate source positive", body: "Find the red (+) output of the 2 V source. Keep the key open.", action: "Select source +" },
  { focus: "series_input", title: "Connect the high resistance", body: "Join source + to the left input post of series resistance box R.", action: "Connect source + to R input" },
  { focus: "series_output", title: "Locate R output", body: "Find the right brass output post of R.", action: "Select R output" },
  { focus: "galvo_pos", title: "Connect galvanometer positive", body: "Join R output to the galvanometer's red (+) post.", action: "Connect R to G+" },
  { focus: "galvo_neg", title: "Locate galvanometer negative", body: "Find the galvanometer's black (−) post for the return lead.", action: "Select G−" },
  { focus: "key_right", title: "Connect the open key", body: "Run a black lead from galvanometer − to the right brass post of the open key.", action: "Connect G− to key" },
  { focus: "key_left", title: "Locate the other key post", body: "The left post starts the return lead.", action: "Select key left" },
  { focus: "source_neg", title: "Complete the series circuit", body: "Join key left to source −. Trace source + → R → galvanometer → key → source −.", action: "Connect key to source −" },
];

const GALVO_BRIEF: PracticeBrief = {
  expNo: 4,
  title: "Resistance of a Galvanometer (Half-Deflection)",
  object: "To determine the resistance of a galvanometer by the half-deflection method and verify its figure of merit.",
  apparatus: GALVO_TOUR_ITEMS,
  theory: [
    "With high resistance R in series, the galvanometer shows full deflection θ₀ = E / (k·(R + G)).",
    "Connecting a shunt S in parallel and adjusting it until deflection is halved (θ = θ₀/2) gives: G = R·S / (R − S).",
    "Since R ≫ G, the shunt value S is almost exactly equal to the galvanometer resistance G."
  ],
};

export default function GalvanometerPage() {
  const [R, setR] = useState(1950);
  const [S, setS] = useState(80);
  const [shuntOn, setShuntOn] = useState(false);
  const [fullDef, setFullDef] = useState<number | null>(null);
  const [halfS, setHalfS] = useState<number | null>(null);
  const [phase, setPhase] = useState<StepPhase>("step1_full_def");
  const [connectionStep, setConnectionStep] = useState(0);
  const [shuntStep, setShuntStep] = useState(0);
  const [showJournal, setShowJournal] = useState(false);
  const [showQuit, setShowQuit] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);
  const [introOpen, setIntroOpen] = useState(true);
  const [introIdx, setIntroIdx] = useState(0);
  const wiring = connectionStep < CONNECTIONS.length;
  const keyClosed = !wiring && (phase === "step1_full_def" || phase === "step3_adjust_s" || phase === "done");
  const liveDivs = keyClosed ? deflectionFor(R, shuntOn ? S : null) : 0;
  const targetHalf = fullDef != null ? fullDef / 2 : 15;
  const isNearHalf = shuntOn && fullDef != null && Math.abs(liveDivs - targetHalf) <= 0.4;

  const result = halfS != null ? (R * halfS) / (R - halfS) : null;
  const err = result != null ? Math.abs((result - G_TRUE) / G_TRUE) * 100 : null;

  const recordFull = () => {
    setShuntOn(false);
    setFullDef(+deflectionFor(R, null).toFixed(1));
    setPhase("step2_connect_shunt");
  };

  const connectShunt = () => {
    if (shuntStep === 0) setShuntStep(1);
    else { setShuntStep(2); setShuntOn(true); setPhase("step3_adjust_s"); }
  };

  const recordHalf = () => {
    setHalfS(S);
    setPhase("done");
  };

  const reset = () => {
    setR(1950);
    setS(80);
    setShuntOn(false);
    setConnectionStep(0);
    setShuntStep(0);
    setFullDef(null);
    setHalfS(null);
    setPhase("step1_full_def");
  };

  const journal: JournalConfig = {
    expNo: 4,
    title: "Resistance of a galvanometer by half-deflection method",
    object: "To determine the resistance of a galvanometer by the half-deflection method.",
    apparatus: "Galvanometer, cell, high resistance box R, shunt resistance box S, one-way key and connecting wires.",
    theory: (
      <>
        <p>With a high resistance R in series, the galvanometer shows a full deflection θ. A shunt S is then joined across the galvanometer and adjusted until the deflection is halved. At half-deflection the current through the galvanometer equals that through the shunt, giving</p>
        <p className="my-2 text-center font-bold">G = R·S / (R − S)</p>
        <p>Since R ≫ G, the shunt at half-deflection is very nearly equal to G itself.</p>
      </>
    ),
    method: [
      "Connect the galvanometer in series with the high resistance R, key and cell (shunt open).",
      "Adjust R for a convenient full deflection and note it.",
      "Connect the shunt S across the galvanometer.",
      "Adjust S until the deflection falls to exactly half of the full value.",
      "Note R and S and compute G = R·S/(R − S).",
    ],
    observation: (
      <JTable
        head={["Quantity", "Value"]}
        rows={[
          ["Series resistance R", `${R} Ω`],
          ["Full deflection θ₀", fullDef != null ? `${fullDef.toFixed(1)} div` : "—"],
          ["Shunt resistance S", halfS != null ? `${halfS.toFixed(1)} Ω` : "—"],
          ["Half deflection θ₀/2", fullDef != null ? `${(fullDef / 2).toFixed(1)} div` : "—"],
        ]}
      />
    ),
    calculation: (
      <>
        <p className="font-mono">G = R · S / (R − S)</p>
        {result != null && halfS != null ? (
          <p className="mt-1">= ({R} × {halfS.toFixed(1)}) / ({R} − {halfS.toFixed(1)}) = <b>{result.toFixed(1)} Ω</b></p>
        ) : <p className="mt-1 text-black/50">Reach half deflection and record S.</p>}
      </>
    ),
    result: <p>The resistance of the galvanometer, G = <b>{result != null ? `${result.toFixed(1)} Ω` : "—"}</b>.</p>,
  };

  const guide =
    phase === "step1_full_def"
      ? {
          step: "01",
          title: "Set Full Deflection (θ₀)",
          body: `Adjust high resistance R (currently ${R} Ω) so the needle deflects to an even number of divisions (e.g. ${liveDivs.toFixed(0)} div).`,
        }
      : phase === "step2_connect_shunt"
      ? {
          step: "02",
          title: "Connect Parallel Shunt S",
          body: `Full deflection θ₀ = ${fullDef?.toFixed(0)} div is locked. Now connect shunt S in parallel across the galvanometer.`,
        }
      : phase === "step3_adjust_s"
      ? {
          step: "03",
          title: "Adjust S to Reach Half Deflection",
          body: `Target is exactly ${(fullDef! / 2).toFixed(1)} div (currently ${liveDivs.toFixed(1)} div). Adjust S slider until the needle reaches the green half-deflection target.`,
        }
      : {
          step: "04",
          title: "Galvanometer Resistance Calculated",
          body: `At half-deflection S = ${halfS?.toFixed(1)} Ω, yielding G = ${result?.toFixed(1)} Ω (accepted ${G_TRUE} Ω, error ${err?.toFixed(1)}%). Open practical journal for write-up!`,
        };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#eef2f0]">
      <div className="absolute inset-0">
        <GalvanometerScene
          deflectionDivs={liveDivs}
          shuntOn={shuntOn}
          connectionCount={wiring ? (connectionStep < 2 ? 0 : connectionStep < 4 ? 1 : connectionStep < 6 ? 2 : 3) : 4}
          shuntConnection={shuntStep}
          keyClosed={keyClosed}
          focus={introOpen ? null : wiring ? CONNECTIONS[connectionStep].focus : phase === "step2_connect_shunt" ? (shuntStep === 0 ? "shunt_input" : "shunt_output") : null}
          seriesResistance={R}
          shuntResistance={S}
          zoom={phase === "step3_adjust_s" || phase === "done"}
          intro={introOpen}
          introIdx={introIdx}
        />
      </div>

      {/* Pre-action intro: mission briefing and 3D apparatus tour */}
      {introOpen && (
        <PracticalIntro
          brief={GALVO_BRIEF}
          onStart={() => setIntroOpen(false)}
          onSlide={setIntroIdx}
          apparatus={GALVO_TOUR_ITEMS}
          subject="Physics"
          exitHref="/student/lab-game/physics"
        />
      )}

      {/* Top Bar Header */}
      <div data-ui className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-2.5 sm:p-4">
        <button
          onClick={() => { setIsQuitting(false); setShowQuit(true); }}
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/75 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-black/90 shadow-lg hover:scale-105 active:scale-95"
        >
          Quit
        </button>
        <span className="rounded-full border border-white/10 bg-black/75 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-md sm:text-[11px] shadow-lg">
          Physics · Galvanometer Resistance (Half-Deflection)
        </span>
      </div>

      {/* Quit confirmation modal */}
      {showQuit && (
        <div data-ui className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" className="w-[24rem] max-w-[92vw] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-white/30 duration-300 animate-in fade-in zoom-in-95">
            <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-dark p-5 text-primary-foreground">
              <div className="absolute -right-8 -top-8 size-28 rounded-full bg-amber-300/15 blur-2xl" />
              <div className="relative">
                <p className="mb-0.5 text-[9px] font-black uppercase tracking-[.18em] text-[#f6c453]">Exit Lab</p>
                <h2 className="text-lg font-black leading-tight">Quit practical?</h2>
                <p className="text-xs font-medium text-white/80">Galvanometer Resistance</p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm leading-snug text-black/70">Your progress in this simulation won&apos;t be saved. Are you sure you want to leave?</p>
              <div className="mt-5 flex gap-3">
                <button
                  disabled={isQuitting}
                  onClick={() => setShowQuit(false)}
                  className="flex-1 rounded-2xl bg-black/5 px-4 py-2.5 text-sm font-black text-black/70 transition hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Stay
                </button>
                <button
                  disabled={isQuitting}
                  onClick={() => {
                    setIsQuitting(true);
                    window.location.href = "/student/lab-game/physics";
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary-dark disabled:cursor-wait disabled:opacity-90"
                >
                  {isQuitting ? <><LoaderCircle size={17} className="animate-spin" /> Leaving…</> : "Quit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!introOpen && (
        <>
          {/* Gamified Cyber Glass Telemetry HUD */}
          <div className="pointer-events-none absolute left-1/2 top-14 flex -translate-x-1/2 items-center gap-1.5 sm:gap-2 rounded-2xl border border-white/60 bg-white/95 px-3.5 py-1.5 shadow-2xl backdrop-blur-xl sm:top-16">
            <span className="inline-flex items-center gap-1 rounded-xl bg-rose-500/10 px-2.5 py-1 text-xs sm:text-sm font-black text-rose-600 border border-rose-500/20">
              <Gauge size={14} className="text-rose-500" /> {liveDivs.toFixed(1)} div
            </span>
            <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-xs sm:text-sm font-bold text-slate-700 border border-slate-200">
              {shuntOn ? `Shunt S = ${S} Ω` : `Series R = ${R} Ω`}
            </span>
          </div>

          {/* Right Floating Telemetry & Analysis Panel */}
          {!wiring && <div className="pointer-events-auto absolute right-4 top-20 bottom-4 hidden w-[310px] max-w-[40vw] flex-col gap-3 overflow-y-auto lg:flex">
            {/* Observation Log Card */}
            <div className="rounded-3xl border border-white/60 bg-white/95 p-3.5 shadow-xl backdrop-blur-md">
              <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-black/5 pb-2">
                <span className="size-2 rounded-full bg-primary animate-pulse" /> Observation Log
              </p>
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/50">
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-slate-200/60">
                    <tr className="hover:bg-primary/[0.04]">
                      <td className="px-3 py-1.5 font-bold text-slate-600">Series R</td>
                      <td className="px-3 py-1.5 text-right font-mono font-black text-slate-900">{R} Ω</td>
                    </tr>
                    <tr className="hover:bg-primary/[0.04]">
                      <td className="px-3 py-1.5 font-bold text-slate-600">Full Deflection θ₀</td>
                      <td className="px-3 py-1.5 text-right font-mono font-black text-slate-900">
                        {fullDef != null ? `${fullDef.toFixed(1)} div` : "—"}
                      </td>
                    </tr>
                    <tr className="hover:bg-primary/[0.04]">
                      <td className="px-3 py-1.5 font-bold text-slate-600">Target Half θ₀/2</td>
                      <td className="px-3 py-1.5 text-right font-mono font-black text-emerald-600">
                        {fullDef != null ? `${(fullDef / 2).toFixed(1)} div` : "—"}
                      </td>
                    </tr>
                    <tr className="hover:bg-primary/[0.04]">
                      <td className="px-3 py-1.5 font-bold text-slate-600">Shunt S at Half</td>
                      <td className="px-3 py-1.5 text-right font-mono font-black text-slate-900">
                        {halfS != null ? `${halfS.toFixed(1)} Ω` : "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Obsidian Result Card */}
            <ResultCard
              formula="G = R · S / (R − S)"
              value={result}
              unit="Ω"
              expected={{ value: G_TRUE }}
            />
          </div>}

          <PhysicsQuestCard
            stage={wiring ? "Build the series circuit" : phase === "step2_connect_shunt" ? "Add parallel shunt" : "Measure half deflection"}
            step={wiring ? connectionStep + 1 : phase === "step1_full_def" ? 9 : phase === "step2_connect_shunt" ? 10 + shuntStep : phase === "step3_adjust_s" ? 12 : 13}
            total={13}
            title={wiring ? CONNECTIONS[connectionStep].title : phase === "step2_connect_shunt" ? (shuntStep === 0 ? "Connect G+ to shunt input" : "Connect shunt output to G−") : guide.title}
            description={wiring ? CONNECTIONS[connectionStep].body : phase === "step2_connect_shunt" ? (shuntStep === 0 ? "Keep the key open. Attach a blue lead from galvanometer + to the left post of S." : "Attach the right post of S back to galvanometer −. S is now in parallel with G.") : guide.body}
          >
            {phase === "step1_full_def" && !wiring && <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-bold text-slate-700"><div className="flex justify-between"><span><Sliders size={13} className="inline" /> Series R</span><b>{R} Ω</b></div><input aria-label="Series resistance R" type="range" min={1000} max={4000} step={50} value={R} onChange={(e) => setR(Number(e.target.value))} className="mt-2 w-full accent-primary" /></div>}
            {phase === "step3_adjust_s" && <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-bold text-slate-700"><div className="flex justify-between"><span><Sliders size={13} className="inline" /> Shunt S</span><b>{S} Ω</b></div><input aria-label="Shunt resistance S" type="range" min={20} max={150} step={1} value={S} onChange={(e) => setS(Number(e.target.value))} className="mt-2 w-full accent-primary" /></div>}
            {wiring ? <button onClick={() => setConnectionStep((n) => n + 1)} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#225b1d] px-3 text-xs font-black text-white sm:text-sm">{CONNECTIONS[connectionStep].action}<ArrowRight size={15} /></button>
            : phase === "step1_full_def" ? <button onClick={recordFull} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#225b1d] px-3 text-xs font-black text-white sm:text-sm">Record θ₀ = {liveDivs.toFixed(1)} div<ArrowRight size={15} /></button>
            : phase === "step2_connect_shunt" ? <button onClick={connectShunt} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#225b1d] px-3 text-xs font-black text-white sm:text-sm">{shuntStep === 0 ? "Connect G+ to S input" : "Connect S output to G−"}<ArrowRight size={15} /></button>
            : phase === "step3_adjust_s" ? <button onClick={recordHalf} disabled={!isNearHalf} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#225b1d] px-3 text-xs font-black text-white disabled:opacity-50 sm:text-sm">{isNearHalf ? `Record S = ${S} Ω at half deflection` : `Adjust to ${targetHalf.toFixed(1)} div; now ${liveDivs.toFixed(1)}`}</button>
            : <><button onClick={() => setShowJournal(true)} className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#225b1d] px-3 text-xs font-black text-white"><BookOpen size={15} /> Open journal</button><button onClick={reset} className="flex min-h-10 items-center gap-1 rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-700"><RotateCcw size={14} /> Restart</button></>}
          </PhysicsQuestCard>
        </>
      )}

      {showJournal && <Journal config={journal} onClose={() => setShowJournal(false)} />}
    </div>
  );
}
