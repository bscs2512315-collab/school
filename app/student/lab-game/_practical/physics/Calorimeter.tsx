"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Square,
  RotateCcw,
  ArrowRight,
  Zap,
  LoaderCircle,
  Thermometer,
  Clock,
  Sparkles,
  Gauge,
} from "lucide-react";
import PlaySVG from "@/public/svgs/PlaySVG";
import { Slider, Meter, ResultCard } from "./kit";
import Journal, { JTable, type JournalConfig } from "./Journal";
import PracticalIntro, { type PracticeBrief } from "../PracticalIntro";
import { CAL_TOUR_ITEMS } from "./CalorimeterScene";
import PhysicsQuestCard from "./PhysicsQuestCard";

const T0 = 20; // starting temperature (°C)
const TMAX_T = 400; // stop after this many simulated seconds

export type CalConfig = {
  badge: string;
  title: string;
  intro: React.ReactNode;
  massLabel: string;
  deltaTFor: (energyJ: number) => number;
  result: (energyJ: number, dT: number) => number;
  formula: string;
  unit: string;
  expected: { value: number; label?: string };
  note: string;
  expNo: number;
  object: string;
  apparatus: string;
  theory: React.ReactNode;
  method: string[];
  resultText: (value: number | null) => React.ReactNode;
};

const CalorimeterScene = dynamic(() => import("./CalorimeterScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm font-medium text-black/40">
      Loading lab…
    </div>
  ),
});

type Phase = "intro" | "heating" | "done";
const mmss = (t: number) =>
  `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

export default function Calorimeter(cfg: CalConfig) {
  const [V, setV] = useState(6);
  const [I, setI] = useState(3);
  const [t, setT] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [showJournal, setShowJournal] = useState(false);
  const [showQuit, setShowQuit] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);
  const [introOpen, setIntroOpen] = useState(true);
  const [introIdx, setIntroIdx] = useState(0);
  const brief: PracticeBrief = {
    expNo: cfg.expNo,
    title: cfg.title,
    object: cfg.object,
    apparatus: CAL_TOUR_ITEMS,
    theory: typeof cfg.theory === "string" ? [cfg.theory] : undefined,
  };

  const zoom = phase === "heating";

  useEffect(() => {
    if (phase !== "heating") return;
    const id = setInterval(() => {
      setT((p) => Math.min(TMAX_T, p + 2));
      setEnergy((e) => e + V * I * 2);
    }, 100);
    return () => clearInterval(id);
  }, [phase, V, I]);

  useEffect(() => {
    if (t >= TMAX_T && phase === "heating") setPhase("done");
  }, [t, phase]);

  const dT = cfg.deltaTFor(energy);
  const temp = T0 + dT;
  const power = V * I;
  const result = dT > 0.5 ? cfg.result(energy, dT) : null;

  const toggle = () =>
    setPhase((p) =>
      p === "intro"
        ? "heating"
        : p === "heating"
        ? dT >= 0.5
          ? "done"
          : "heating"
        : "done"
    );
  const reset = () => {
    setPhase("intro");
    setT(0);
    setEnergy(0);
    setV(6);
    setI(3);
  };

  const journal: JournalConfig = {
    expNo: cfg.expNo,
    title: cfg.title,
    object: cfg.object,
    apparatus: cfg.apparatus,
    theory: cfg.theory,
    method: cfg.method,
    observation: (
      <JTable
        head={["Quantity", "Value"]}
        rows={[
          ["Mass of water", cfg.massLabel],
          ["Voltage V", `${V.toFixed(1)} V`],
          ["Current I", `${I.toFixed(2)} A`],
          ["Time t", `${Math.floor(t)} s`],
          ["Electrical energy VIt", `${energy.toFixed(0)} J`],
          ["Initial temperature", `${T0.toFixed(1)} °C`],
          ["Final temperature", `${temp.toFixed(1)} °C`],
          ["Temperature rise ΔT", `${dT.toFixed(2)} °C`],
        ]}
      />
    ),
    calculation: (
      <>
        <p className="font-mono">{cfg.formula}</p>
        {result != null ? (
          <p className="mt-1">
            = ({V.toFixed(1)} × {I.toFixed(2)} × {Math.floor(t)}) / (mass × {dT.toFixed(2)}) ={" "}
            <b>
              {result.toPrecision(3)} {cfg.unit}
            </b>
          </p>
        ) : (
          <p className="mt-1 text-black/50">Run the heater to obtain a temperature rise.</p>
        )}
      </>
    ),
    result: cfg.resultText(result),
    errors: [
      "Heat is lost from the calorimeter to the surroundings.",
      "The water equivalent of the calorimeter and stirrer is neglected.",
      "The thermometer has a finite least count.",
      "The liquid may not be uniformly stirred.",
      "Personal error in reading meters, thermometer and stop-watch.",
    ],
  };

  const guideTitle =
    phase === "intro"
      ? "Adjust Parameters & Switch On"
      : phase === "heating"
      ? "Heating Water In Progress"
      : "Thermal Analysis Complete";
  const guideBody =
    phase === "intro"
      ? "Set the heater voltage and current with the sliders, then press the green POWER button on the supply to begin heating."
      : phase === "heating"
      ? "Electrical energy VIt is heating the water. Watch the thermometer rise, then click the POWER button again to record final readings."
      : "Heater stopped! Using the electrical energy input and temperature rise ΔT, the output value is derived below.";

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#eef2f0]">
      <div className="absolute inset-0">
        <CalorimeterScene
          temp={temp}
          power={phase === "heating" ? power : 0}
          on={phase === "heating"}
          V={V}
          I={I}
          zoom={zoom}
          intro={introOpen}
          introIdx={introIdx}
          onToggle={toggle}
        />
      </div>

      {/* Pre-action intro: mission briefing and 3D apparatus tour */}
      {introOpen && (
        <PracticalIntro
          brief={brief}
          onStart={() => setIntroOpen(false)}
          onSlide={setIntroIdx}
          apparatus={CAL_TOUR_ITEMS}
          subject="Physics"
          exitHref="/student/lab-game/physics"
        />
      )}

      {/* Top Bar Header */}
      <div data-ui className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-2.5 sm:p-4">
        <button
          onClick={() => {
            setIsQuitting(false);
            setShowQuit(true);
          }}
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/75 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-black/90 shadow-lg hover:scale-105 active:scale-95"
        >
          Quit
        </button>
        <span className="rounded-full border border-white/10 bg-black/75 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-md sm:text-[11px] shadow-lg">
          {cfg.badge}
        </span>
      </div>

      {/* Quit Confirmation Modal */}
      {showQuit && (
        <div data-ui className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="w-[24rem] max-w-[92vw] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-white/30 duration-300 animate-in fade-in zoom-in-95"
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-dark p-5 text-primary-foreground">
              <div className="absolute -right-8 -top-8 size-28 rounded-full bg-amber-300/15 blur-2xl" />
              <div className="relative">
                <p className="mb-0.5 text-[9px] font-black uppercase tracking-[.18em] text-[#f6c453]">
                  Exit Lab
                </p>
                <h2 className="text-lg font-black leading-tight">Quit practical?</h2>
                <p className="text-xs font-medium text-white/80">{cfg.badge}</p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm leading-snug text-black/70">
                Your progress in this simulation won&apos;t be saved. Are you sure you want to leave?
              </p>
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
                  {isQuitting ? (
                    <>
                      <LoaderCircle size={17} className="animate-spin" /> Leaving…
                    </>
                  ) : (
                    "Quit"
                  )}
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
              <Thermometer size={14} className="text-rose-500" /> {temp.toFixed(1)}°C
            </span>
            <span className="inline-flex items-center gap-1 rounded-xl bg-sky-500/10 px-2.5 py-1 text-xs sm:text-sm font-bold font-mono text-sky-700 border border-sky-500/20">
              <Clock size={13} className="text-sky-500" /> {mmss(t)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-xl bg-amber-500/10 px-2.5 py-1 text-xs sm:text-sm font-black text-amber-700 border border-amber-500/20">
              <Zap size={13} className="text-amber-500" /> {(phase === "heating" ? power : 0).toFixed(1)} W
            </span>
            <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 px-2.5 py-1 text-xs sm:text-sm font-black text-emerald-700 border border-emerald-500/20">
              <Sparkles size={13} className="text-emerald-500" /> {(energy / 1000).toFixed(2)} kJ
            </span>
          </div>

          {/* Right Floating Telemetry & Analysis Panel */}
          <div className="pointer-events-auto absolute right-4 top-20 bottom-4 hidden w-[325px] max-w-[42vw] flex-col gap-3 overflow-y-auto lg:flex">
            {/* Live Gauges & Slider Card */}
            <div className="rounded-3xl border border-white/60 bg-white/95 p-3.5 shadow-xl backdrop-blur-md">
              <div className="mb-2.5 flex items-center justify-between border-b border-black/5 pb-2">
                <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-800">
                  <Gauge size={13} className="text-primary" /> Live Telemetry
                </p>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-black text-primary">
                  {cfg.massLabel}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Meter label="Voltmeter" unit="V" value={V} max={12} color="#2563eb" />
                <Meter label="Ammeter" unit="A" value={I} max={5} color="#dc2626" />
              </div>
              <div className="mt-3 space-y-2">
                <Slider
                  label="Voltage (V)"
                  unit=" V"
                  min={2}
                  max={12}
                  step={0.1}
                  value={V}
                  onChange={setV}
                  disabled={phase !== "intro"}
                />
                <Slider
                  label="Current (I)"
                  unit=" A"
                  min={0.5}
                  max={5}
                  step={0.05}
                  value={I}
                  onChange={setI}
                  disabled={phase !== "intro"}
                />
              </div>
            </div>

            {/* Live Readings Table */}
            <div className="rounded-3xl border border-white/60 bg-white/95 p-3.5 shadow-xl backdrop-blur-md">
              <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary animate-pulse" /> Observation Log
              </p>
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/50">
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-slate-200/60">
                    {[
                      ["Applied Voltage (V)", `${V.toFixed(1)} V`],
                      ["Current Flow (I)", `${I.toFixed(2)} A`],
                      ["Heating Duration (t)", `${Math.floor(t)} s`],
                      ["Electrical Energy (VIt)", `${energy.toFixed(0)} J`],
                      ["Temperature Rise (ΔT)", `${dT.toFixed(2)} °C`],
                    ].map(([k, v]) => (
                      <tr key={k} className="hover:bg-primary/[0.04] transition-colors">
                        <td className="px-3 py-1.5 font-bold text-slate-600">{k}</td>
                        <td className="px-3 py-1.5 text-right font-mono font-black text-slate-900">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Obsidian Result Card */}
            <ResultCard
              formula={cfg.formula}
              value={result}
              unit={cfg.unit}
              expected={cfg.expected}
            />
          </div>

          <PhysicsQuestCard stage={phase === "intro" ? "Configure heater" : phase === "heating" ? "Observe temperature rise" : "Calculate the result"} step={phase === "intro" ? 1 : phase === "heating" ? 2 : 3} total={3} title={guideTitle} description={guideBody}>
            {phase === "intro" && <div className="grid w-full grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2"><label className="text-[11px] font-bold text-slate-700">Voltage <b className="float-right text-primary">{V.toFixed(1)} V</b><input aria-label="Heater voltage" type="range" min={2} max={12} step={0.1} value={V} onChange={(e) => setV(Number(e.target.value))} className="mt-2 w-full accent-primary" /></label><label className="text-[11px] font-bold text-slate-700">Current <b className="float-right text-primary">{I.toFixed(2)} A</b><input aria-label="Heater current" type="range" min={0.5} max={5} step={0.05} value={I} onChange={(e) => setI(Number(e.target.value))} className="mt-2 w-full accent-primary" /></label></div>}
            {phase !== "intro" && <div className="flex w-full justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"><span>VIt: {energy.toFixed(0)} J</span><span>ΔT: {dT.toFixed(2)} °C</span><span>{mmss(t)}</span></div>}
            {phase === "intro" && <button onClick={toggle} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#225b1d] px-3 text-xs font-black text-white sm:text-sm"><PlaySVG className="size-4" /> Start heater</button>}
            {phase === "heating" && <button onClick={toggle} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#225b1d] px-3 text-xs font-black text-white sm:text-sm"><Square size={15} /> Stop and record readings</button>}
            {phase === "done" && <><button onClick={() => setShowJournal(true)} className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#225b1d] px-3 text-xs font-black text-white"><ArrowRight size={15} /> Open journal</button><button onClick={reset} className="flex min-h-10 items-center gap-1 rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-700"><RotateCcw size={15} /> Restart</button></>}
          </PhysicsQuestCard>
        </>
      )}

      {showJournal && <Journal config={journal} onClose={() => setShowJournal(false)} />}
    </div>
  );
}
