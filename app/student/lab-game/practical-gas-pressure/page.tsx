"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Flame,
  RotateCcw,
  ArrowRight,
  Gauge,
  LoaderCircle,
  BookOpen,
  Thermometer,
  Plus,
  Activity,
  Square,
} from "lucide-react";
import { Graph, ResultCard, type Pt } from "../_practical/physics/kit";
import Journal, { JTable, type JournalConfig } from "../_practical/physics/Journal";
import PracticalIntro, { type PracticeBrief } from "../_practical/PracticalIntro";
import { GAS_TOUR_ITEMS } from "./GasScene";
import PhysicsQuestCard from "../_practical/physics/PhysicsQuestCard";

const P0 = 76; // pressure of the trapped air at 0 °C (cmHg)
const BETA_TRUE = 1 / 273;
const TMAXG = 100; // stop bath at 100 °C

const pressureFor = (theta: number) => P0 * (1 + theta / 273);

const GasScene = dynamic(() => import("./GasScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm font-medium text-black/40">
      Loading lab…
    </div>
  ),
});

type Phase = "intro" | "heating" | "done";

const GAS_BRIEF: PracticeBrief = {
  expNo: 5,
  title: "Pressure Coefficient of Air",
  object:
    "To determine the pressure coefficient of air at constant volume using a constant-volume air thermometer.",
  apparatus: GAS_TOUR_ITEMS,
  theory: [
    "At constant volume, the pressure of a given mass of gas increases linearly with temperature: P = P₀(1 + β_P·θ).",
    "The slope of the P vs θ graph divided by P₀ gives the pressure coefficient β_P ≈ 1/273 °C⁻¹.",
  ],
};

export default function GasPressurePage() {
  const [theta, setTheta] = useState(20);
  const [phase, setPhase] = useState<Phase>("intro");
  const [rows, setRows] = useState<{ theta: number; P: number }[]>([]);
  const [showJournal, setShowJournal] = useState(false);
  const [showQuit, setShowQuit] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);
  const [introOpen, setIntroOpen] = useState(true);
  const [introIdx, setIntroIdx] = useState(0);
  const P = pressureFor(theta);
  const zoom = false;

  useEffect(() => {
    if (phase !== "heating") return;
    const id = setInterval(() => setTheta((t) => Math.min(TMAXG, t + 0.7)), 100);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (theta >= TMAXG && phase === "heating") setPhase("done");
  }, [theta, phase]);

  const take = () =>
    setRows((rs) =>
      [
        ...rs.filter((r) => r.theta !== Math.round(theta)),
        { theta: Math.round(theta), P: +P.toFixed(1) },
      ].sort((a, b) => a.theta - b.theta)
    );
  const points: Pt[] = rows.map((r) => ({ x: r.theta, y: r.P }));

  const beta = useMemo(() => {
    if (rows.length < 2) return null;
    const n = rows.length;
    const sx = rows.reduce((s, r) => s + r.theta, 0);
    const sy = rows.reduce((s, r) => s + r.P, 0);
    const sxx = rows.reduce((s, r) => s + r.theta * r.theta, 0);
    const sxy = rows.reduce((s, r) => s + r.theta * r.P, 0);
    const m = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1);
    const c = (sy - m * sx) / n;
    return m / c;
  }, [rows]);

  const reset = () => {
    setPhase("intro");
    setTheta(20);
    setRows([]);
  };

  const journal: JournalConfig = {
    expNo: 5,
    title: "Pressure coefficient of air at constant volume",
    object: "To determine the pressure coefficient of air at constant volume.",
    apparatus:
      "Constant-volume air thermometer (air bulb), mercury manometer, water bath with burner, laboratory thermometer and a metre scale.",
    theory: (
      <>
        <p>
          At constant volume the pressure of a gas rises uniformly with temperature (Gay-Lussac&apos;s
          law):
        </p>
        <p className="my-2 text-center font-bold">P = P₀(1 + β<sub>P</sub>·θ)</p>
        <p>
          A graph of P against θ is a straight line whose slope ÷ intercept gives β<sub>P</sub> ≈ 1/273
          °C⁻¹.
        </p>
      </>
    ),
    method: [
      "Keep the trapped air at constant volume and place the bulb in the water bath.",
      "Note the manometer pressure P and the bath temperature θ.",
      "Heat the bath in steps (adjusting to keep the volume constant) and record P and θ.",
      "Plot a graph of pressure P against temperature θ.",
    ],
    observation: (
      <JTable
        head={["θ (°C)", "T (K)", "Pressure (cmHg)"]}
        rows={rows.map((r) => [r.theta, r.theta + 273, r.P.toFixed(1)])}
      />
    ),
    calculation: (
      <>
        <div className="my-2 rounded-lg bg-white/80 p-2">
          <Graph
            points={points}
            xLabel="Temperature θ (°C)"
            yLabel="Pressure (cmHg)"
            xMax={110}
            yMax={110}
            mode="fit"
            color="#166534"
            heightPx={190}
          />
        </div>
        <p>
          β<sub>P</sub> = slope of (P vs θ) ÷ P₀ = <b>{beta != null ? beta.toFixed(5) : "—"}</b> °C⁻¹
          ≈ 1/{beta ? Math.round(1 / beta) : "273"}
        </p>
      </>
    ),
    result: (
      <p>
        The pressure coefficient of air at constant volume, β<sub>P</sub> ={" "}
        <b>{beta != null ? beta.toFixed(5) : "—"}</b> °C⁻¹, close to 1/273 °C⁻¹.
      </p>
    ),
  };

  const guide =
    phase === "intro"
      ? {
          step: "01",
          title: "Heat the Water Bath",
          body: "The air bulb is immersed in the water bath and connected to the mercury manometer. Start heating and record pressure readings at various temperatures.",
        }
      : phase === "heating"
      ? {
          step: "02",
          title: "Capture Pressure Readings",
          body: `As bath heats (${theta.toFixed(0)} °C), air pressure rises (${P.toFixed(1)} cmHg). Click 'Take Reading' across 3–5 temperatures, then click Finish.`,
        }
      : {
          step: "03",
          title: "Pressure Coefficient Derived",
          body: `The P–θ graph yields a straight line with slope/P₀ giving β_P = ${beta != null ? beta.toFixed(5) : "—"} °C⁻¹ (≈ 1/${beta ? Math.round(1 / beta) : "273"}). Open the journal!`,
        };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#eef2f0]">
      <div className="absolute inset-0">
        <GasScene
          temp={theta}
          pressure={P}
          heating={phase === "heating"}
          zoom={zoom}
          intro={introOpen}
          introIdx={introIdx}
        />
      </div>

      {/* Pre-action intro: mission briefing and 3D apparatus tour */}
      {introOpen && (
        <PracticalIntro
          brief={GAS_BRIEF}
          onStart={() => setIntroOpen(false)}
          onSlide={setIntroIdx}
          apparatus={GAS_TOUR_ITEMS}
          subject="Physics"
          exitHref="/student/lab-game/physics"
        />
      )}

      {/* Top Bar Header */}
      <div
        data-ui
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-2.5 sm:p-4"
      >
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
          Physics · Pressure Coefficient of Air
        </span>
      </div>

      {/* Quit Confirmation Modal */}
      {showQuit && (
        <div
          data-ui
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
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
                <p className="text-xs font-medium text-white/80">Pressure coefficient of air</p>
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
              <Thermometer size={14} className="text-rose-500" /> {theta.toFixed(0)}°C
            </span>
            <span className="inline-flex items-center gap-1 rounded-xl bg-blue-500/10 px-2.5 py-1 text-xs sm:text-sm font-black text-blue-600 border border-blue-500/20">
              <Gauge size={14} className="text-blue-500" /> {P.toFixed(1)} cmHg
            </span>
            <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-xs sm:text-sm font-bold text-slate-700 border border-slate-200">
              <Activity size={13} className="text-slate-500" /> {rows.length} Readings
            </span>
          </div>

          {/* Right Floating Telemetry & Graph Panel */}
          <div className="pointer-events-auto absolute right-4 top-20 bottom-4 hidden w-[340px] max-w-[42vw] flex-col gap-3 overflow-y-auto lg:flex">
            {/* Graph Card */}
            <div className="rounded-3xl border border-white/60 bg-white/95 p-3.5 shadow-xl backdrop-blur-md">
              <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-black/5 pb-2">
                <span className="size-2 rounded-full bg-blue-500 animate-pulse" /> P vs θ Realtime Graph
              </p>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-2">
                <Graph
                  points={points}
                  xLabel="Temp θ (°C)"
                  yLabel="Pressure P (cmHg)"
                  xMax={110}
                  yMax={110}
                  mode="fit"
                  color="#2563eb"
                  heightPx={160}
                />
              </div>
            </div>

            {/* Observation Table Card */}
            <div className="rounded-3xl border border-white/60 bg-white/95 p-3.5 shadow-xl backdrop-blur-md">
              <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center justify-between border-b border-black/5 pb-2">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-primary" /> Readings Log
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">
                  {rows.length} data pts
                </span>
              </p>
              <div className="max-h-40 overflow-y-auto rounded-2xl border border-slate-200/80 bg-slate-50/50">
                <table className="w-full text-xs">
                  <thead className="border-b border-slate-200/60 bg-slate-100/70 text-slate-500">
                    <tr>
                      <th className="px-3 py-1.5 text-left font-black">θ (°C)</th>
                      <th className="px-3 py-1.5 text-left font-black">T (K)</th>
                      <th className="px-3 py-1.5 text-right font-black">P (cmHg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-3 text-center text-slate-400 font-medium">
                          No readings recorded yet.
                        </td>
                      </tr>
                    ) : (
                      rows.map((r) => (
                        <tr key={r.theta} className="hover:bg-primary/[0.04]">
                          <td className="px-3 py-1 font-bold text-slate-700">{r.theta}°</td>
                          <td className="px-3 py-1 font-mono text-slate-600">{r.theta + 273}</td>
                          <td className="px-3 py-1 text-right font-mono font-black text-slate-900">
                            {r.P.toFixed(1)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Obsidian Result Card */}
            <ResultCard
              formula="β_P = slope / P₀"
              value={beta}
              unit="°C⁻¹"
              expected={{ value: BETA_TRUE }}
            />
          </div>

          <PhysicsQuestCard stage={phase === "intro" ? "Set up the bath" : phase === "heating" ? "Collect P–θ pairs" : "Analyze the gas"} step={phase === "intro" ? 1 : phase === "heating" ? 2 : 3} total={3} title={guide.title} description={guide.body}>
            {rows.length > 0 && <details className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 lg:hidden"><summary className="cursor-pointer text-xs font-black text-slate-700">View P–θ graph and readings ({rows.length})</summary><Graph points={points} xLabel="Temperature (°C)" yLabel="Pressure (cmHg)" xMax={110} yMax={110} mode="fit" color="#2563eb" heightPx={160} /><div className="mt-2 max-h-24 overflow-auto text-xs text-slate-600">{rows.map((r) => <p key={r.theta}>{r.theta} °C · {r.P.toFixed(1)} cmHg</p>)}</div></details>}
            {phase === "intro" && <button onClick={() => setPhase("heating")} className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#225b1d] px-3 text-xs font-black text-white sm:text-sm"><Flame size={16} /> Start heating <ArrowRight size={15} /></button>}
            {phase === "heating" && <><button onClick={take} className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#225b1d] px-3 text-xs font-black text-white sm:text-sm"><Plus size={16} /> Record {theta.toFixed(0)} °C · {P.toFixed(1)} cmHg</button><button onClick={() => setPhase("done")} disabled={rows.length < 2} className="flex min-h-10 items-center gap-1 rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-700 disabled:opacity-50"><Square size={14} /> Finish</button></>}
            {phase === "done" && <><button onClick={() => setShowJournal(true)} className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#225b1d] px-3 text-xs font-black text-white"><BookOpen size={16} /> Open journal</button><button onClick={reset} className="flex min-h-10 items-center gap-1 rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-700"><RotateCcw size={15} /> Restart</button></>}
          </PhysicsQuestCard>
        </>
      )}

      {showJournal && <Journal config={journal} onClose={() => setShowJournal(false)} />}
    </div>
  );
}
