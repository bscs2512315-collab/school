"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowRight, RotateCcw, Clock, Thermometer, BookOpen, LoaderCircle, Star, Activity, ClipboardList, CheckCircle2, type LucideIcon } from "lucide-react";
import { Graph, type Pt } from "../_practical/physics/kit";
import PracticalIntro, { type PracticeBrief } from "../_practical/PracticalIntro";
import { COOLING_TOUR_ITEMS } from "./CoolingScene";

const T0 = 90;
const TROOM = 28;
const K = 0.146 / 60; // per second; approximately 0.146 per minute
const TMAX = 300;
const STEP = 30;
const TOTAL = TMAX / STEP + 1;
const tempAt = (seconds: number) => TROOM + (T0 - TROOM) * Math.exp(-K * seconds);
const mmss = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

type Phase = "intro" | "running" | "reading" | "done";
type Reading = { t: number; temp: number };
type Guide = { title: string; body: string; n: number; reading?: Reading };

const INTRO_GUIDE: Guide = {
  title: "Set up the cooling experiment",
  body: "Check that the probe tip is immersed and clear of the glass. Room temperature is 28.0 °C. Start the stopwatch, then take the first reading.",
  n: 0,
};
const COOLING_BRIEF: PracticeBrief = {
  expNo: 2,
  title: "Newton's Law of Cooling",
  object: "To measure a cooling curve and compare the rate of cooling with the excess temperature above room temperature.",
  apparatus: COOLING_TOUR_ITEMS,
  theory: ["Newton's law of cooling predicts that the rate of temperature fall is proportional to the temperature difference between the liquid and its surroundings when other conditions remain steady."],
};

function DuoIcon({ icon: Icon, size = 16, className = "" }: { icon: LucideIcon; size?: number; className?: string }) {
  return <span className={`relative inline-grid shrink-0 place-items-center ${className}`} style={{ width: size, height: size }} aria-hidden="true">
    <Icon size={size} strokeWidth={3} className="absolute translate-x-[1.5px] translate-y-[1.5px] opacity-35" />
    <Icon size={size} strokeWidth={2.1} className="relative" />
  </span>;
}

const CoolingScene = dynamic(() => import("./CoolingScene"), { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading lab…</div> });
const Notebook = dynamic(() => import("./Notebook"), { ssr: false });

export default function CoolingPage() {
  const router = useRouter();
  const [t, setT] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [speed, setSpeed] = useState(1);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [guide, setGuide] = useState<Guide>(INTRO_GUIDE);
  const [showNotebook, setShowNotebook] = useState(false);
  const [showQuit, setShowQuit] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);
  const [introOpen, setIntroOpen] = useState(true);
  const [introIdx, setIntroIdx] = useState(0);
  const [compact, setCompact] = useState(false);
  const [graphsOpen, setGraphsOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  useEffect(() => {
    setCompact(window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window);
  }, []);
  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => setT((seconds) => Math.min(TMAX, seconds + speed / 10)), 100);
    return () => clearInterval(id);
  }, [phase, speed]);
  useEffect(() => {
    if (phase !== "running") return;
    const mark = Math.min(TMAX, readings.length * STEP);
    if (t < mark) return;
    setT(mark);
    setPhase("reading");
    setGuide({
      n: Math.round(mark / STEP) + 1,
      title: mark === TMAX ? "Take the final temperature" : "Time for the next reading",
      body: `At ${mmss(mark)}, gently stir the water, then read the probe at eye level. Record the temperature and compare it with the room temperature of ${TROOM.toFixed(1)} °C.`,
    });
  }, [t, phase, readings.length]);

  const liveTemp = tempAt(t);
  const pendingMark = Math.min(TMAX, readings.length * STEP);
  const recordAt = (mark: number) => {
    const value = +tempAt(mark).toFixed(1);
    const nextReading = { t: mark, temp: value };
    setReadings((current) => current.some((reading) => reading.t === mark) ? current : [...current, nextReading]);
    setT(mark);
    const finished = mark >= TMAX;
    setGuide({
      n: Math.round(mark / STEP) + 1,
      reading: nextReading,
      title: finished ? "Plot and verify the law" : "Reading recorded",
      body: finished
        ? "Plot temperature against time and rate against excess temperature. The temperature falls more slowly as the water approaches room temperature; compare the fitted trend and cooling constant in the journal."
        : `At ${mmss(mark)}, the water is ${value.toFixed(1)} °C: an excess of ${(value - TROOM).toFixed(1)} °C. Keep the beaker undisturbed until the next 30-second mark.`,
    });
    setPhase(finished ? "done" : "running");
  };
  const reset = () => {
    setT(0); setReadings([]); setPhase("intro"); setGuide(INTRO_GUIDE);
    setShowNotebook(false); setGraphsOpen(false); setLogOpen(false);
  };
  const advance = () => {
    if (phase === "intro") {
      setPhase("reading");
      setGuide({ n: 1, title: "Record the initial temperature", body: "At 0:00, check the probe tip is immersed and read 90.0 °C. Note this alongside the room temperature before the water cools." });
    } else if (phase === "reading") recordAt(pendingMark);
    else if (phase === "done") reset();
  };

  const curve: Pt[] = readings.map((reading) => ({ x: reading.t / 60, y: reading.temp }));
  const ratePts: Pt[] = useMemo(() => {
    const points: Pt[] = [];
    for (let i = 1; i < readings.length; i++) {
      const previous = readings[i - 1], current = readings[i];
      const meanExcess = (previous.temp + current.temp) / 2 - TROOM;
      points.push({ x: meanExcess, y: ((previous.temp - current.temp) / (current.t - previous.t)) * 60 });
    }
    return points;
  }, [readings]);
  const guideAction = phase === "intro" ? "Begin measurements" : phase === "reading" ? `Record ${tempAt(pendingMark).toFixed(1)} °C at ${mmss(pendingMark)}` : phase === "running" ? `Cooling to ${mmss(pendingMark)}` : "Open practical journal";

  return <div className="relative h-[100dvh] w-full overflow-hidden bg-[#eef2f0]">
    <div className="absolute inset-0"><CoolingScene temp={liveTemp} zoom={phase !== "intro"} intro={introOpen} introIdx={introIdx} compact={compact} /></div>
    {introOpen && <PracticalIntro brief={COOLING_BRIEF} onStart={() => setIntroOpen(false)} onSlide={setIntroIdx} apparatus={COOLING_TOUR_ITEMS} subject="Physics" exitHref="/student/lab-game/physics" />}

    <div data-ui className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-2.5 sm:p-4">
      <button onClick={() => { setIsQuitting(false); setShowQuit(true); }} className="pointer-events-auto rounded-full border border-white/10 bg-black/75 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-md">Quit</button>
      <span className="rounded-full border border-white/10 bg-black/75 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90 shadow-lg backdrop-blur-md sm:text-[11px]">Physics · Newton&apos;s Law of Cooling</span>
    </div>

    {showQuit && <div data-ui className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="cooling-quit-title" className="w-[24rem] max-w-[92vw] overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-gradient-to-br from-primary to-primary-dark p-5 text-white"><h2 id="cooling-quit-title" className="text-lg font-black">Quit practical?</h2><p className="text-xs text-white/80">Your measurements in this session won&apos;t be saved.</p></div>
        <div className="flex gap-3 p-5"><button disabled={isQuitting} onClick={() => setShowQuit(false)} className="flex-1 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-black text-slate-700">Stay</button><button disabled={isQuitting} onClick={() => { setIsQuitting(true); router.push("/student/lab-game/physics"); }} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-black text-white">{isQuitting ? <><DuoIcon icon={LoaderCircle} size={16} className="animate-spin" /> Leaving…</> : "Quit"}</button></div>
      </div>
    </div>}

    {!introOpen && <>
      <div className="pointer-events-auto absolute inset-x-2 top-12 z-10 flex items-center justify-center gap-1 rounded-2xl border border-white/60 bg-white/95 px-1.5 py-1.5 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:left-1/2 sm:top-2 sm:-translate-x-1/2 sm:gap-2 sm:px-3">
        <span className="inline-flex items-center gap-1 rounded-xl border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-xs font-black text-rose-700 sm:text-sm"><DuoIcon icon={Thermometer} size={14} /> {liveTemp.toFixed(1)} °C</span>
        <span className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 sm:text-sm"><DuoIcon icon={Clock} size={13} /> {mmss(Math.floor(t))}</span>
        <div className="flex items-center gap-1 border-l border-slate-200 pl-1"><span className="hidden text-[10px] font-black uppercase text-slate-500 sm:inline">Speed</span>{[1, 3, 5].map((value) => <button key={value} onClick={() => setSpeed(value)} aria-label={`${value} times speed`} className={`rounded-lg px-1.5 py-0.5 text-[10px] font-black ${speed === value ? "bg-primary text-white" : "bg-slate-100 text-slate-600"}`}>{value}×</button>)}</div>
      </div>

      <button onClick={() => setGraphsOpen(true)} className="absolute right-2 top-24 z-20 inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white/95 px-3 py-2 text-xs font-black text-primary shadow-lg lg:hidden"><DuoIcon icon={Activity} size={15} /> Graphs</button>
      <button onClick={() => setLogOpen(true)} className="absolute left-2 top-24 z-20 inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white/95 px-3 py-2 text-xs font-black text-primary shadow-lg lg:hidden"><DuoIcon icon={ClipboardList} size={15} /> Log {readings.length}/{TOTAL}</button>

      <div className={`pointer-events-auto absolute left-2 right-2 top-36 z-30 max-h-[60dvh] flex-col gap-3 overflow-y-auto rounded-3xl border border-slate-200 bg-[#f7f9f8] p-3 shadow-2xl ${graphsOpen ? "flex" : "hidden"} lg:bottom-3 lg:left-3 lg:right-auto lg:top-auto lg:flex lg:h-[190px] lg:max-h-none lg:w-[calc(100%-548px)] lg:flex-row lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}>
        <button onClick={() => setGraphsOpen(false)} className="self-end rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 lg:hidden">Close graphs</button>
        <div className="min-w-0 rounded-3xl border border-white/70 bg-white/95 p-2.5 shadow-xl backdrop-blur-md lg:flex-1"><p className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary"><DuoIcon icon={Activity} size={13} /> Cooling curve · T vs time</p><Graph points={curve} xLabel="Time (min)" yLabel="Temp (°C)" xMax={TMAX / 60} yMax={100} mode="line" heightPx={compact ? 170 : 130} light /></div>
        <div className="min-w-0 rounded-3xl border border-white/70 bg-white/95 p-2.5 shadow-xl backdrop-blur-md lg:flex-1"><p className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary"><DuoIcon icon={Activity} size={13} /> Rate vs excess temperature</p><Graph points={ratePts} xLabel="Excess (°C)" yLabel="Rate (°C/min)" mode="fit" color="#2b7d63" heightPx={compact ? 170 : 130} light /></div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-2 pb-[max(.5rem,env(safe-area-inset-bottom))] sm:p-4 lg:bottom-3 lg:left-auto lg:right-3 lg:w-[520px] lg:p-0">
        <div className="pointer-events-auto max-h-[36dvh] w-full max-w-[520px] overflow-y-auto rounded-3xl border border-white/80 bg-white/95 p-2.5 shadow-2xl shadow-black/15 backdrop-blur-xl min-[641px]:max-h-[60dvh] min-[641px]:p-4 lg:h-[190px] lg:max-h-none lg:p-3">
          <div className="flex items-center justify-between gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-primary"><DuoIcon icon={Star} size={13} /> Lab quest · {String(Math.max(1, guide.n)).padStart(2, "0")}/{TOTAL}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-600">{phase === "done" ? "Completed" : "Practical steps"}</span></div>
          <div className="mt-2 flex gap-1 lg:mt-1.5" aria-label={`${readings.length} of ${TOTAL} readings recorded`}>{Array.from({ length: TOTAL }, (_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i < readings.length ? "bg-primary" : "bg-slate-200"}`} />)}</div>
          <h2 className="mt-2 font-black leading-tight text-slate-900 lg:mt-1.5 lg:text-[15px]">{guide.title}</h2>
          {guide.reading && <div className="mt-1.5 flex flex-wrap gap-1.5"><span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">{mmss(guide.reading.t)}</span><span className="rounded-lg bg-rose-500/10 px-2 py-0.5 text-[10px] font-black text-rose-700">{guide.reading.temp.toFixed(1)} °C</span><span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-700">Excess {(guide.reading.temp - TROOM).toFixed(1)} °C</span></div>}
          <p className="mt-1.5 text-[11px] font-medium leading-snug text-slate-600 min-[641px]:text-sm lg:text-[12px]">{guide.body}</p>
          <div className="mt-2 flex gap-2">
            {phase === "done" ? <><button onClick={() => setShowNotebook(true)} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-3 py-2 text-xs font-black text-white"><DuoIcon icon={BookOpen} size={15} /> Open practical journal</button><button onClick={reset} className="inline-flex min-h-10 items-center gap-1.5 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700"><DuoIcon icon={RotateCcw} size={14} /> Restart</button></> : <button onClick={advance} disabled={phase === "running"} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-3 py-2 text-center text-xs font-black text-white shadow-lg shadow-primary/25 disabled:cursor-wait disabled:opacity-60">{phase === "running" ? <DuoIcon icon={LoaderCircle} size={15} className="animate-spin" /> : <DuoIcon icon={CheckCircle2} size={15} />}{guideAction}{phase !== "running" && <DuoIcon icon={ArrowRight} size={14} />}</button>}
          </div>
        </div>
      </div>

      {logOpen && <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Logged cooling readings"><div className="max-h-[80dvh] w-full max-w-md overflow-hidden rounded-3xl bg-white p-4 shadow-2xl"><div className="mb-3 flex items-center justify-between"><h2 className="font-black text-slate-900">Logged readings</h2><button onClick={() => setLogOpen(false)} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">Close</button></div><div className="max-h-[60dvh] overflow-y-auto"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-slate-100 text-slate-600"><tr><th className="p-2">Time</th><th className="p-2">Temp</th><th className="p-2">Excess</th></tr></thead><tbody className="divide-y divide-slate-100">{readings.map((reading) => <tr key={reading.t}><td className="p-2">{mmss(reading.t)}</td><td className="p-2">{reading.temp.toFixed(1)} °C</td><td className="p-2">{(reading.temp - TROOM).toFixed(1)} °C</td></tr>)}</tbody></table>{readings.length === 0 && <p className="p-3 text-sm text-slate-500">Record the first temperature to start the log.</p>}</div></div></div>}
      {showNotebook && <Notebook readings={readings} room={TROOM} t0={T0} onClose={() => setShowNotebook(false)} />}
    </>}
  </div>;
}
