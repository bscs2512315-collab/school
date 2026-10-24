"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, CheckCircle2, CircuitBoard, Gauge, LoaderCircle, RotateCcw, Sliders, Star, type LucideIcon } from "lucide-react";
import Journal, { JTable, type JournalConfig } from "../_practical/physics/Journal";
import PracticalIntro, { type PracticeBrief } from "../_practical/PracticalIntro";
import { VOLTMETER_TOUR_ITEMS } from "./VoltmeterScene";

const E = 3.0;
const RV_TRUE = 2000;
const readingFor = (r: number | null) => r == null ? E : (E * RV_TRUE) / (r + RV_TRUE);
type Phase = "source_pos" | "meter_pos" | "meter_neg" | "key_right" | "key_left" | "source_neg" | "close_direct" | "read_direct" | "open_key" | "resistor_input" | "resistor_output" | "meter_pos_series" | "close_series" | "read_series" | "done";
const PHASES: Phase[] = ["source_pos", "meter_pos", "meter_neg", "key_right", "key_left", "source_neg", "close_direct", "read_direct", "open_key", "resistor_input", "resistor_output", "meter_pos_series", "close_series", "read_series", "done"];
const VoltmeterScene = dynamic(() => import("./VoltmeterScene"), { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading lab…</div> });
const brief: PracticeBrief = {
  expNo: 3,
  title: "Resistance of a Voltmeter",
  object: "To determine the internal resistance of a voltmeter using a known series resistance.",
  apparatus: VOLTMETER_TOUR_ITEMS,
  theory: ["First read V₀ with the voltmeter directly across a steady 3 V source. Then insert a known resistance R in series and read V₁. Calculate Rᵥ = R·V₁ / (V₀ − V₁)."],
};
function DuoIcon({ icon: Icon, size = 16 }: { icon: LucideIcon; size?: number }) {
  return <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }} aria-hidden="true"><Icon size={size} strokeWidth={3} className="absolute translate-x-[1.5px] translate-y-[1.5px] opacity-35" /><Icon size={size} strokeWidth={2.1} className="relative" /></span>;
}

export default function VoltmeterPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("source_pos");
  const [R, setR] = useState(2000);
  const [v0, setV0] = useState<number | null>(null);
  const [v1, setV1] = useState<number | null>(null);
  const [introOpen, setIntroOpen] = useState(true);
  const [introIdx, setIntroIdx] = useState(0);
  const [showJournal, setShowJournal] = useState(false);
  const [showQuit, setShowQuit] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const index = PHASES.indexOf(phase);
  const connectionCount = index < PHASES.indexOf("meter_neg") ? 0 : index < PHASES.indexOf("key_left") ? 1 : index < PHASES.indexOf("close_direct") ? 2 : 3;
  const keyClosed = phase === "read_direct" || phase === "read_series" || phase === "done";
  const seriesConnection = index < PHASES.indexOf("resistor_output") ? 0 : index < PHASES.indexOf("close_series") ? 1 : 2;
  const seriesOn = seriesConnection > 0;
  const connectionFocus = ({ source_pos: "source_pos", meter_pos: "meter_pos", meter_neg: "meter_neg", key_right: "key_right", key_left: "key_left", source_neg: "source_neg", open_key: "key_right", resistor_input: "resistor_input", resistor_output: "resistor_output", meter_pos_series: "meter_pos" } as const)[phase as "source_pos" | "meter_pos" | "meter_neg" | "key_right" | "key_left" | "source_neg" | "open_key" | "resistor_input" | "resistor_output" | "meter_pos_series"] ?? null;
  const wiringStep = connectionFocus !== null;
  const showReadouts = phase === "read_direct" || phase === "close_series" || phase === "read_series" || phase === "done";
  const stageName = index <= 5 ? "Build the direct circuit" : index <= 8 ? "Take the first reading" : index <= 11 ? "Add known resistance" : "Measure and calculate";
  const terminalInfo = connectionFocus ? ({
    source_pos: ["RED LEAD", "3 V source · +"], meter_pos: ["RED LEAD", "Voltmeter · +"], meter_neg: ["BLACK LEAD", "Voltmeter · −"],
    key_right: ["BLACK LEAD", "Key · right"], key_left: ["BLACK LEAD", "Key · left"], source_neg: ["BLACK LEAD", "3 V source · −"],
    resistor_input: ["RED LEAD", "Resistance box · input"], resistor_output: ["RED LEAD", "Resistance box · output"],
  } as const)[connectionFocus] : null;
  const liveVoltage = keyClosed ? readingFor(seriesOn ? R : null) : 0;
  const result = v0 != null && v1 != null && v0 > v1 ? R * v1 / (v0 - v1) : null;
  const guides: Record<Phase, { title: string; body: string; action: string }> = {
    source_pos: { title: "Locate source positive", body: "Find the red (+) binding post on the 3.0 V supply. Start the red lead here while the key remains open.", action: "Select supply +" },
    meter_pos: { title: "Attach at voltmeter positive", body: "Follow the red lead to the voltmeter's red (+) post. The two positive posts now form the direct measurement path.", action: "Attach red lead to voltmeter +" },
    meter_neg: { title: "Locate voltmeter negative", body: "Find the voltmeter's black (−) post. Start the black return lead here; do not connect it to the red post.", action: "Select voltmeter −" },
    key_right: { title: "Attach at the open key", body: "Bring that black lead to the right brass terminal of the open key. The key still interrupts the circuit.", action: "Attach black lead to key right" },
    key_left: { title: "Locate the other key terminal", body: "Use the left brass terminal of the open key for the second black return lead.", action: "Select key left" },
    source_neg: { title: "Complete the negative return", body: "Attach the black lead from key left to the supply's black (−) post. Trace source + → voltmeter → key → source −.", action: "Attach return lead to supply −" },
    close_direct: { title: "Check polarity, then close the key", body: "The resistance box is bypassed for the direct reading. Check red to red and black to black, then close the key only while taking V₀.", action: "Close key for direct reading" },
    read_direct: { title: "Read the direct voltage V₀", body: "Read the 0–3 V scale at eye level. This direct reading is the supply voltage V₀. Record it, then open the key before changing the circuit.", action: `Record V₀ = ${liveVoltage.toFixed(2)} V` },
    open_key: { title: "Open the key before rewiring", body: "Break the circuit before adding resistance. The voltmeter must not be connected directly across the source while you change leads.", action: "Open key" },
    resistor_input: { title: "Move the red lead to R input", body: "At the left brass post of the resistance box, attach the lead from supply +. The direct red lead to the voltmeter is now removed.", action: "Attach supply + to R input" },
    resistor_output: { title: "Locate R output", body: "Find the right brass post of the resistance box. Start a second red lead at this output.", action: "Select R output" },
    meter_pos_series: { title: "Complete the series path", body: "Attach the new red lead to voltmeter +. The path is now supply + → R input → R output → voltmeter +.", action: "Attach R output to voltmeter +" },
    close_series: { title: "Set R and close the key", body: `Choose a known resistance (currently ${R} Ω). Close the key to observe the smaller voltmeter reading V₁.`, action: "Close key with R in series" },
    read_series: { title: "Record the series reading V₁", body: `The source voltage is shared by R and the voltmeter. Read V₁ = ${liveVoltage.toFixed(2)} V, then use both readings to calculate the voltmeter resistance.`, action: `Record V₁ = ${liveVoltage.toFixed(2)} V` },
    done: { title: "Calculate the voltmeter resistance", body: `Rᵥ = R × V₁ ÷ (V₀ − V₁) = ${result?.toFixed(0) ?? "—"} Ω. Review the complete circuit and enter the readings in the practical journal.`, action: "Open practical journal" },
  };
  const guide = guides[phase];
  const advance = () => {
    if (phase === "read_direct") setV0(+readingFor(null).toFixed(2));
    if (phase === "read_series") setV1(+readingFor(R).toFixed(2));
    if (phase === "done") { setShowJournal(true); return; }
    setPhase(PHASES[index + 1]);
  };
  const reset = () => { setPhase("source_pos"); setR(2000); setV0(null); setV1(null); setShowLog(false); setShowResult(false); };
  const journal: JournalConfig = {
    expNo: 3,
    title: "Resistance of a voltmeter",
    object: "To determine the internal resistance of a given voltmeter.",
    apparatus: "Moving-coil DC voltmeter, regulated 3 V supply, resistance box, one-way key, and insulated connecting leads.",
    theory: <><p>With the voltmeter directly across the source, V₀ is the supply voltage. After inserting R in series, the voltmeter reads V₁. The same current flows through R and the internal voltmeter resistance Rᵥ.</p><p className="my-2 text-center font-bold">V₀ = I(R + Rᵥ), V₁ = I Rᵥ ⇒ Rᵥ = R V₁ / (V₀ − V₁)</p></>,
    method: ["Keep the key open. Connect source + to voltmeter +, voltmeter − to the key, and the key back to source −.", "Check polarity, close the key briefly, read V₀, and reopen it.", "Insert the known resistance box between source + and voltmeter +, keeping the return leads connected.", "Set R, close the key briefly, and read V₁.", "Calculate Rᵥ = R V₁ / (V₀ − V₁)."],
    observation: <JTable head={["Quantity", "Value"]} rows={[["Direct reading V₀", v0 == null ? "—" : `${v0.toFixed(2)} V`], ["Known series resistance R", `${R} Ω`], ["Series reading V₁", v1 == null ? "—" : `${v1.toFixed(2)} V`]]} />,
    calculation: <p>Rᵥ = R V₁ / (V₀ − V₁) {result == null ? "= —" : `= ${R} × ${v1?.toFixed(2)} / (${v0?.toFixed(2)} − ${v1?.toFixed(2)}) = ${result.toFixed(0)} Ω`}</p>,
    result: <p>The internal resistance of the voltmeter is <b>{result == null ? "—" : `${result.toFixed(0)} Ω`}</b>.</p>,
  };
  return <div className="relative h-[100dvh] w-full overflow-hidden bg-[#eef2f0]">
    <div className="absolute inset-0"><VoltmeterScene voltage={liveVoltage} seriesOn={seriesOn} seriesConnection={seriesConnection} rValue={R} connectionCount={connectionCount} keyClosed={keyClosed} connectionFocus={connectionFocus} zoom={phase === "read_series"} intro={introOpen} introIdx={introIdx} /></div>
    {introOpen && <PracticalIntro brief={brief} onStart={() => setIntroOpen(false)} onSlide={setIntroIdx} apparatus={VOLTMETER_TOUR_ITEMS} subject="Physics" exitHref="/student/lab-game/physics" />}
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-2.5 sm:p-4"><button onClick={() => setShowQuit(true)} className="pointer-events-auto rounded-full bg-black/75 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-md">Quit</button><span className="rounded-full bg-black/75 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md sm:text-[11px]">Physics · Resistance of a Voltmeter</span></div>
    {showQuit && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div role="dialog" aria-modal="true" aria-label="Quit practical" className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl"><h2 className="font-black">Quit practical?</h2><p className="mt-2 text-sm text-slate-600">Current circuit and readings will be reset.</p><div className="mt-5 flex gap-2"><button onClick={() => setShowQuit(false)} className="flex-1 rounded-xl bg-slate-100 p-2 text-sm font-bold">Stay</button><button disabled={isQuitting} onClick={() => { setIsQuitting(true); router.push("/student/lab-game/physics"); }} className="flex-1 rounded-xl bg-primary p-2 text-sm font-bold text-white">{isQuitting ? <DuoIcon icon={LoaderCircle} /> : "Quit"}</button></div></div></div>}
    {!introOpen && <>
      <div className="pointer-events-auto absolute left-1/2 top-12 z-10 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-2xl border border-white/60 bg-white/95 px-3 py-1.5 shadow-xl backdrop-blur-xl sm:top-2"><span className="inline-flex items-center gap-1 rounded-xl border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-xs font-black text-blue-700"><DuoIcon icon={Gauge} size={14} /> {liveVoltage.toFixed(2)} V</span><span className="rounded-xl bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700 sm:text-xs">{!keyClosed ? "Key open" : seriesOn ? `R = ${R} Ω` : "Direct circuit"}</span></div>
      {showReadouts && <div className="absolute left-2 right-2 top-24 z-20 flex justify-between gap-2 lg:hidden"><button onClick={() => setShowLog(true)} className="rounded-full bg-white/95 px-3 py-2 text-xs font-black text-primary shadow-lg">Observation log</button><button onClick={() => setShowResult(true)} className="rounded-full bg-white/95 px-3 py-2 text-xs font-black text-primary shadow-lg">Calculation</button></div>}
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 grid gap-2 p-2 pb-[max(.5rem,env(safe-area-inset-bottom))] lg:p-4 ${showReadouts ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)]" : "justify-items-center"}`}>
        {showReadouts && <>
          <div className="pointer-events-auto hidden rounded-3xl border border-white/70 bg-white/95 p-3 shadow-xl backdrop-blur-xl lg:block"><div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-slate-700"><DuoIcon icon={CircuitBoard} size={15} /> Observation log</div><div className="space-y-1 rounded-2xl border border-slate-200 bg-slate-50 p-2 text-xs"><div className="flex justify-between"><span>Direct reading V₀</span><b>{v0 == null ? "—" : `${v0.toFixed(2)} V`}</b></div><div className="flex justify-between"><span>Series resistance R</span><b>{seriesOn ? `${R} Ω` : "—"}</b></div><div className="flex justify-between"><span>Series reading V₁</span><b>{v1 == null ? "—" : `${v1.toFixed(2)} V`}</b></div></div><p className="mt-2 text-[11px] text-slate-500">Red: source + → voltmeter + (via R for V₁). Black: voltmeter − → key → source −.</p></div>
          <div className="pointer-events-auto hidden rounded-3xl border border-primary/30 bg-primary p-3 text-white shadow-xl lg:block"><div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-wider"><DuoIcon icon={Gauge} size={15} /> Calculated output</div><p className="font-mono text-xs text-white/75">Rᵥ = R V₁ / (V₀ − V₁)</p><p className="mt-2 text-xl font-black">{result == null ? "— Ω" : `${result.toFixed(0)} Ω`}</p><p className="mt-2 text-[11px] text-white/75">Record both voltages to unlock the result.</p></div>
        </>}
        <div className={`pointer-events-auto max-h-[52dvh] w-full overflow-y-auto rounded-[26px] border border-white/90 bg-white/95 p-3 shadow-[0_20px_55px_rgba(15,23,42,0.22)] backdrop-blur-xl sm:p-4 lg:max-h-none ${showReadouts ? "lg:min-h-[205px]" : "max-w-[620px]"}`}>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#225b1d] text-white shadow-sm"><DuoIcon icon={wiringStep ? CircuitBoard : Star} size={18} /></span>
            <div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-[.17em] text-[#3c7a32]">{wiringStep ? "Connection mission" : "Lab quest"}</p><p className="truncate text-xs font-bold text-slate-700">{stageName}</p></div>
            <span className="rounded-full border border-[#d7e5d4] bg-[#eef6ec] px-2.5 py-1 font-mono text-[11px] font-black text-[#225b1d]">{String(index + 1).padStart(2, "0")} / {PHASES.length}</span>
          </div>
          <div className="mt-3 flex gap-1" aria-label={`Step ${index + 1} of ${PHASES.length}`}>{PHASES.map((item, i) => <span key={item} className={`h-1.5 flex-1 rounded-full ${i < index ? "bg-[#225b1d]" : i === index ? "bg-[#83ab73]" : "bg-slate-200"}`} />)}</div>
          <h2 className="mt-3 text-base font-black leading-tight text-slate-900 sm:text-lg">{guide.title}</h2>
          <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">{guide.body}</p>
          {wiringStep && <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"><span className={`h-2.5 w-2.5 rounded-full ${terminalInfo?.[0] === "RED LEAD" ? "bg-red-600" : "bg-slate-800"}`} /><span className="text-[10px] font-black uppercase tracking-wide text-slate-500">{phase === "open_key" ? "Switch position" : terminalInfo?.[0]}</span><span className="ml-auto text-right text-xs font-black text-slate-800">{phase === "open_key" ? "Open key" : terminalInfo?.[1]}</span></div>}
          {phase === "close_series" && <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2"><DuoIcon icon={Sliders} size={14} /><input aria-label="Known series resistance in ohms" type="range" min="500" max="5000" step="50" value={R} onChange={(e) => setR(Number(e.target.value))} className="min-w-0 flex-1 accent-primary" /><b className="text-xs">{R} Ω</b></div>}
          <div className="mt-3 flex gap-2">{phase === "done" ? <><button onClick={() => setShowJournal(true)} className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-black text-white"><DuoIcon icon={BookOpen} size={14} /> Journal</button><button onClick={reset} className="flex min-h-10 items-center gap-1 rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-700"><DuoIcon icon={RotateCcw} size={14} /> Restart</button></> : <button onClick={advance} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#225b1d] px-3 text-xs font-black text-white shadow-[0_8px_16px_rgba(34,91,29,0.23)] transition-colors hover:bg-[#174914] sm:text-sm"><DuoIcon icon={CheckCircle2} size={15} /> {guide.action} <DuoIcon icon={ArrowRight} size={15} /></button>}</div>
        </div>
      </div>
      {(showLog || showResult) && <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 p-3" role="dialog" aria-modal="true"><div className="w-full max-w-sm rounded-3xl bg-white p-4 shadow-2xl"><div className="flex justify-end"><button onClick={() => { setShowLog(false); setShowResult(false); }} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">Close</button></div>{showLog ? <><h2 className="font-black">Observation log</h2><p className="mt-2 text-sm">V₀: {v0?.toFixed(2) ?? "—"} V<br />R: {seriesOn ? R : "—"} Ω<br />V₁: {v1?.toFixed(2) ?? "—"} V</p></> : <><h2 className="font-black">Calculated output</h2><p className="mt-2 text-sm">Rᵥ = R V₁ / (V₀ − V₁)</p><p className="mt-2 text-xl font-black text-primary">{result == null ? "— Ω" : `${result.toFixed(0)} Ω`}</p></>}</div></div>}
    </>}
    {showJournal && <Journal config={journal} onClose={() => setShowJournal(false)} />}
  </div>;
}
