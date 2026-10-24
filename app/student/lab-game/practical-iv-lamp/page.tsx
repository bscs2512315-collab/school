"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { RotateCcw, Gauge, Sliders, BookOpen, LoaderCircle, Plus, Zap } from "lucide-react";
import Journal, { JTable, type JournalConfig } from "../_practical/physics/Journal";
import PracticalIntro, { type PracticeBrief } from "../_practical/PracticalIntro";
import { Graph, type Pt } from "../_practical/physics/kit";
import { IV_TOUR_ITEMS } from "./IVLampScene";
import PhysicsQuestCard from "../_practical/physics/PhysicsQuestCard";

const VMAX = 8; // supply / rheostat range (volts)

// Non-ohmic tungsten filament: current rises less-than-linearly with voltage
// because resistance grows as the filament heats up. Empirical I = k·V^0.58.
const currentFor = (v: number) => (v <= 0 ? 0 : 0.62 * Math.pow(v / VMAX, 0.58));

const IVLampScene = dynamic(() => import("./IVLampScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm font-medium text-black/40">
      Loading lab…
    </div>
  ),
});

const IV_BRIEF: PracticeBrief = {
  expNo: 6,
  title: "I–V Characteristic of a Filament Lamp",
  object: "To study the relation between the current passing through a tungsten filament lamp and the potential difference applied across it.",
  apparatus: IV_TOUR_ITEMS,
  theory: [
    "For an ohmic metallic conductor at constant temperature, Ohm's law holds: I ∝ V (a straight line graph).",
    "In a tungsten filament lamp, however, the filament heats up as current increases, raising its temperature and resistance.",
    "Because R = V / I increases with voltage, current rises more slowly at higher voltages, yielding a curved, non-ohmic I–V graph."
  ],
};

export default function IVLampPage() {
  const [v, setV] = useState(1.5);
  const [rows, setRows] = useState<{ v: number; i: number; r: number }[]>([]);
  const [showJournal, setShowJournal] = useState(false);
  const [showQuit, setShowQuit] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);
  const [introOpen, setIntroOpen] = useState(true);
  const [introIdx, setIntroIdx] = useState(0);
  const liveCurrent = useMemo(() => {
    if (v <= 0) return 0;
    return +(currentFor(v) * (1 + Math.sin(v * 7) * 0.005)).toFixed(3);
  }, [v]);

  const liveResistance = v > 0 && liveCurrent > 0 ? +(v / liveCurrent).toFixed(1) : 0;

  const takeReading = () => {
    if (v <= 0) return;
    const item = {
      v: +v.toFixed(2),
      i: liveCurrent,
      r: liveResistance,
    };
    setRows((rs) => [...rs.filter((r) => Math.abs(r.v - item.v) > 0.05), item].sort((a, b) => a.v - b.v));
  };

  const points: Pt[] = rows.map((r) => ({ x: r.v, y: r.i }));

  const reset = () => {
    setV(1.5);
    setRows([]);
  };

  const journal: JournalConfig = {
    expNo: 6,
    title: "Current–Voltage characteristic of a tungsten filament lamp",
    object: "To study the relation between the current passing through a tungsten filament lamp and the potential difference applied across it.",
    apparatus: "Tungsten filament lamp, DC power supply, sliding rheostat, DC ammeter, DC voltmeter, one-way key and connecting wires.",
    theory: (
      <>
        <p>For a metallic conductor at constant temperature, Ohm&apos;s law gives I ∝ V (a straight line). A lamp filament, however, heats up as the current increases, and the resistance of tungsten rises with temperature.</p>
        <p className="my-2 text-center font-bold font-mono">R = V / I (increases as V increases)</p>
        <p>So the I–V graph is not a straight line — the lamp is a <b>non-ohmic</b> conductor.</p>
      </>
    ),
    method: [
      "Connect the lamp in series with the ammeter, rheostat, key and battery.",
      "Connect the voltmeter in parallel across the lamp.",
      "Move the rheostat slider to apply a small voltage; note the voltmeter (V) and ammeter (I) readings.",
      "Increase the voltage in steps across the full range (0 to 8 V) and record V and I each time.",
      "Plot a graph of current I against voltage V.",
    ],
    observation: (
      <JTable
        head={["V (V)", "I (A)", "R = V/I (Ω)"]}
        rows={rows.map((r) => [r.v.toFixed(2), r.i.toFixed(3), r.r.toFixed(1)])}
      />
    ),
    calculation: (
      <>
        <div className="my-2 rounded-lg bg-white/80 p-2">
          <Graph points={points} xLabel="Voltage V (V)" yLabel="Current I (A)" xMax={VMAX} yMax={0.7} mode="line" heightPx={190} />
        </div>
        <p>The graph of I against V is a smooth curve bending toward the V-axis. The dynamic resistance R = V/I increases as V (and filament temperature) increases.</p>
      </>
    ),
    result: <p>The current does not increase in direct proportion to the voltage. The tungsten filament lamp is a <b>non-ohmic</b> conductor whose resistance increases with temperature.</p>,
    errors: [
      "The filament temperature keeps changing, so readings must be taken steadily.",
      "Zero and parallax errors in the analog meters.",
      "Least count of the ammeter (0.02 A) and voltmeter (0.1 V) limits precision.",
      "Contact resistance at loose terminal connections.",
    ],
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#eef2f0]">
      <div className="absolute inset-0">
        <IVLampScene
          voltage={v}
          current={liveCurrent}
          zoom={rows.length >= 4}
          intro={introOpen}
          introIdx={introIdx}
        />
      </div>

      {/* Pre-action intro: mission briefing and 3D apparatus tour */}
      {introOpen && (
        <PracticalIntro
          brief={IV_BRIEF}
          onStart={() => setIntroOpen(false)}
          onSlide={setIntroIdx}
          apparatus={IV_TOUR_ITEMS}
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
          Physics · I–V Characteristic of a Filament Lamp
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
                <p className="text-xs font-medium text-white/80">I–V Characteristic of a Lamp</p>
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
            <span className="inline-flex items-center gap-1 rounded-xl bg-blue-500/10 px-2.5 py-1 text-xs sm:text-sm font-black text-blue-600 border border-blue-500/20">
              <Gauge size={13} className="text-blue-500" /> {v.toFixed(2)} V
            </span>
            <span className="inline-flex items-center gap-1 rounded-xl bg-rose-500/10 px-2.5 py-1 text-xs sm:text-sm font-black text-rose-600 border border-rose-500/20">
              <Zap size={13} className="text-rose-500" /> {liveCurrent.toFixed(3)} A
            </span>
            <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 px-2.5 py-1 text-xs sm:text-sm font-mono font-black text-emerald-700 border border-emerald-500/20">
              R = {liveResistance} Ω
            </span>
          </div>

          {/* Right Floating Telemetry & Graph Panel */}
          <div className="pointer-events-auto absolute right-4 top-20 bottom-4 hidden w-[325px] max-w-[42vw] flex-col gap-3 overflow-y-auto lg:flex">
            {/* Live Graph Card */}
            <div className="rounded-3xl border border-white/60 bg-white/95 p-3.5 shadow-xl backdrop-blur-md">
              <div className="mb-2 flex items-center justify-between border-b border-black/5 pb-2">
                <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-800">
                  <span className="size-2 rounded-full bg-primary animate-pulse" /> I–V Characteristic Curve
                </p>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {rows.length} points
                </span>
              </div>
              <Graph points={points} xLabel="Voltage V (V)" yLabel="Current I (A)" xMax={VMAX} yMax={0.7} mode="line" heightPx={160} />
              <p className="mt-2 text-[10px] font-medium leading-tight text-slate-500">
                Non-ohmic curvature: As V increases, filament heats up and dynamic resistance R rises.
              </p>
            </div>

            {/* Table Card */}
            <div className="rounded-3xl border border-white/60 bg-white/95 p-3.5 shadow-xl backdrop-blur-md">
              <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-black/5 pb-2">
                <span className="size-2 rounded-full bg-primary" /> Readings Table
              </p>
              <div className="max-h-[140px] overflow-y-auto rounded-2xl border border-slate-200/80 bg-slate-50/50">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100/90 text-[10px] font-black uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-1.5">V (V)</th>
                      <th className="px-3 py-1.5">I (A)</th>
                      <th className="px-3 py-1.5">R (Ω)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 font-semibold text-slate-800">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-4 text-center text-xs text-slate-400">
                          Adjust rheostat & take readings…
                        </td>
                      </tr>
                    ) : (
                      rows.map((r, idx) => (
                        <tr key={idx} className="hover:bg-primary/[0.04] transition-colors">
                          <td className="px-3 py-1.5 font-bold font-mono">{r.v.toFixed(2)}</td>
                          <td className="px-3 py-1.5 font-mono">{r.i.toFixed(3)}</td>
                          <td className="px-3 py-1.5 font-mono text-emerald-600 font-bold">{r.r.toFixed(1)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <PhysicsQuestCard
            stage={rows.length < 5 ? "Collect lamp readings" : "Analyze the curve"}
            step={Math.min(rows.length + 1, 6)}
            total={6}
            title={rows.length < 5 ? "Vary voltage and record I–V pairs" : "Non-ohmic characteristic verified"}
            description={rows.length < 5 ? "Move the rheostat, watch the filament brighten, and record current at several different voltages." : "The curve bends as the tungsten heats. Compare resistance across your readings and open the journal."}
          >
            <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700"><span className="flex items-center gap-1.5"><Sliders size={14} /> Applied voltage</span><b className="font-mono text-primary">{v.toFixed(1)} V</b></div>
              <input aria-label="Applied voltage" type="range" min={0} max={VMAX} step={0.2} value={v} onChange={(e) => setV(Number(e.target.value))} className="mt-2 w-full accent-primary" />
            </div>
            {rows.length > 0 && <details className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 lg:hidden"><summary className="cursor-pointer text-xs font-black text-slate-700">View I–V graph and readings ({rows.length})</summary><Graph points={points} xLabel="Voltage (V)" yLabel="Current (A)" xMax={VMAX} yMax={0.7} mode="line" heightPx={160} /><div className="mt-2 max-h-24 overflow-auto text-xs text-slate-600">{rows.map((r) => <p key={r.v}>{r.v.toFixed(1)} V · {r.i.toFixed(3)} A · {r.r.toFixed(1)} Ω</p>)}</div></details>}
            <button onClick={takeReading} className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#225b1d] px-3 text-xs font-black text-white sm:text-sm"><Plus size={15} /> Record {v.toFixed(1)} V · {liveCurrent.toFixed(3)} A</button>
            {rows.length >= 3 && <button onClick={() => setShowJournal(true)} className="flex min-h-10 items-center gap-1 rounded-xl bg-primary px-3 text-xs font-black text-white"><BookOpen size={15} /> Journal</button>}
            <button onClick={reset} className="flex min-h-10 items-center gap-1 rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-700"><RotateCcw size={14} /> Reset</button>
          </PhysicsQuestCard>
        </>
      )}

      {showJournal && <Journal config={journal} onClose={() => setShowJournal(false)} />}
    </div>
  );
}
