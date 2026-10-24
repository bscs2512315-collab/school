"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Power,
  RotateCcw,
  ArrowRight,
  Ruler,
  Thermometer,
  LoaderCircle,
  Star,
  CheckCircle2,
  Activity,
  ClipboardList,
  Calculator,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import Journal, { JTable, type JournalConfig } from "../_practical/physics/Journal";
import PracticalIntro, { journalToBrief } from "../_practical/PracticalIntro";
import { getPhysicsJournal } from "@/constants/practicalJournals";

const L0 = 0.6; // rod length (m)
const THETA1 = 30; // room temperature (°C)
const ALPHA_TRUE = 1.2e-5; // steel
const BASE_READING = 4.0; // dial gauge baseline (mm)

const extensionMm = (temp: number) => ALPHA_TRUE * L0 * (temp - THETA1) * 1000;
const TOUR_ITEMS = [
  "Pullinger's steam jacket",
  "Steel expansion rod",
  "Copper steam boiler and hot plate",
  "Steam inlet and outlet",
  "Thermometer probe",
  "Dial gauge",
  "Metre scale",
  "Condensate receiver",
];
const EXPANSION_BRIEF = journalToBrief(getPhysicsJournal("practical-expansion"));

function DuoIcon({ icon: Icon, size = 16, className = "" }: { icon: LucideIcon; size?: number; className?: string }) {
  return <span className={`relative inline-grid shrink-0 place-items-center ${className}`} style={{ width: size, height: size }} aria-hidden="true">
    <Icon size={size} strokeWidth={3} className="absolute translate-x-[1.5px] translate-y-[1.5px] opacity-35" />
    <Icon size={size} strokeWidth={2.1} className="relative" />
  </span>;
}

const ExpansionScene = dynamic(() => import("./ExpansionScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm font-medium text-black/40">
      Loading lab…
    </div>
  ),
});

type Stage = "setup" | "length" | "gauge" | "cold" | "steam" | "steady" | "hot" | "done";

export default function ExpansionPage() {
  const router = useRouter();
  const [temp, setTemp] = useState(THETA1);
  const [stage, setStage] = useState<Stage>("setup");
  const [steadySeconds, setSteadySeconds] = useState(0);
  const [cold, setCold] = useState<{ theta: number; r: number } | null>(null);
  const [hot, setHot] = useState<{ theta: number; r: number } | null>(null);
  const [rulerAligned, setRulerAligned] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [readingsOpen, setReadingsOpen] = useState(false);
  const [showQuit, setShowQuit] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);
  const [introOpen, setIntroOpen] = useState(true);
  const [introIdx, setIntroIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window);
  }, []);

  const compact = isMobile;
  const tutorTitleCls = compact ? "text-sm" : "text-[17px]";
  const tutorSubCls = compact ? "text-xs" : "text-sm";

  const steamOn = stage === "steady" || stage === "hot";
  const zoom = stage === "gauge" || stage === "hot";

  useEffect(() => {
    if (stage !== "steady") return;
    const id = setInterval(
      () => setTemp((t) => (t >= 99 ? 99 : Math.min(99, t + (99 - t) * 0.04 + 0.07))),
      250
    );
    return () => clearInterval(id);
  }, [stage]);

  useEffect(() => {
    if (stage !== "steady" || temp < 98.5) return;
    const id = setInterval(() => setSteadySeconds((seconds) => Math.min(5, seconds + 1)), 1000);
    return () => clearInterval(id);
  }, [stage, temp]);

  const reading = BASE_READING + extensionMm(temp);
  const dL = cold && hot ? hot.r - cold.r : null;
  const dTheta = cold && hot ? hot.theta - cold.theta : null;
  const alpha = dL != null && dTheta ? (dL / 1000) / (L0 * dTheta) : null;

  const reset = () => {
    setStage("setup");
    setTemp(THETA1);
    setSteadySeconds(0);
    setCold(null);
    setHot(null);
    setRulerAligned(false);
    setShowSummary(false);
  };

  const journal: JournalConfig = {
    expNo: 1,
    title: "Coefficient of linear expansion by Pullinger's apparatus",
    object:
      "To determine the coefficient of linear expansion of the material of the given rod using Pullinger's apparatus.",
    apparatus:
      "Pullinger's steam jacket and steel rod on a rigid base, high-resolution dial gauge, adjustment screw, copper steam boiler and hot plate, heat-resistant rubber hoses, digital thermometer probe, metre scale and condensate receiver.",
    theory: (
      <>
        <p>
          When a rod of original length L₀ is heated through Δθ, its increase in length ΔL is
          proportional to L₀ and Δθ:
        </p>
        <p className="my-2 text-center font-bold">ΔL = α·L₀·Δθ ⇒ α = ΔL / (L₀·Δθ)</p>
      </>
    ),
    method: [
      "Set the apparatus on a level bench. Place the rod through the steam jacket, secure its right end with the adjustment screw, and leave the left end free to expand against the gauge probe.",
      "Measure the effective length L₀ between the fixed support and gauge contact with a metre scale. Record the rod material.",
      "Secure the boiler side arm to the jacket inlet with heat-resistant rubber hose and check both clamps. Lead the jacket outlet to an open condensate receiver. Insert the digital thermometer probe through the centre stopper into its well.",
      "Bring the gauge probe into light contact with the free rod end. Check the gauge least count and record its initial reading; do not force or clamp the moving end.",
      "Before heating, read the jacket thermometer at eye level and record θ₁ with the cold gauge reading L₁.",
      "Switch on the hot plate and pass steam continuously through the jacket. Keep the outlet open and never seal the boiler.",
      "Wait until the thermometer and gauge readings remain steady. Read θ₂ and L₂ without touching hot metal or tubing.",
      "Calculate ΔL = L₂ − L₁, Δθ = θ₂ − θ₁ and α = ΔL/(L₀Δθ). Switch off the hot plate and allow the apparatus to cool.",
    ],
    observation: (
      <JTable
        head={["State", "Temp (°C)", "Dial gauge (mm)"]}
        rows={[
          ["Cold", cold?.theta != null ? cold.theta.toFixed(1) : "—", cold ? cold.r.toFixed(3) : "—"],
          ["Hot", hot?.theta != null ? hot.theta.toFixed(1) : "—", hot ? hot.r.toFixed(3) : "—"],
          [
            "Change",
            dTheta != null ? dTheta.toFixed(1) : "—",
            dL != null ? dL.toFixed(3) : "—",
          ],
        ]}
      />
    ),
    calculation: (
      <>
        <p className="font-mono">α = ΔL / (L₀ · Δθ), with L₀ = {L0} m.</p>
        {alpha != null && dL != null && dTheta != null ? (
          <p className="mt-1">
            = ({(dL / 1000).toExponential(2)} m) / ({L0} × {dTheta.toFixed(1)}) ={" "}
            <b>{alpha.toExponential(2)} °C⁻¹</b>
          </p>
        ) : (
          <p className="mt-1 text-black/50">Record the cold and hot readings.</p>
        )}
      </>
    ),
    result: (
      <p>
        The coefficient of linear expansion, α ={" "}
        <b>{alpha != null ? `${alpha.toExponential(2)} °C⁻¹` : "—"}</b>.
      </p>
    ),
  };

  const guides: Record<Stage, { step: string; title: string; body: string; action?: string }> = {
    setup: { step: "01", title: "Inspect and connect the apparatus", body: "The adjustment screw fixes the rod at the right; its left end rests against the dial gauge probe. Trace the boiler → jacket inlet → open receiver path and check the hose clamps before heating.", action: "Connections checked" },
    length: { step: "02", title: "Measure the effective rod length", body: rulerAligned ? "Follow the highlighted span on the rule: the gauge contact is at 0 cm and the fixed support is at 60 cm. L₀ = 60.0 − 0.0 = 60.0 cm = 0.600 m. Read it at eye level, then record." : "The camera now faces the rod and rule. Place the metre rule parallel to the steel rod, with its zero at the free gauge contact. Then find the fixed-support mark.", action: rulerAligned ? "Record L₀ = 0.600 m" : "Place metre rule against rod" },
    gauge: { step: "03", title: "Set and read the gauge", body: "Touch the dial gauge probe lightly against the free rod end. This high-resolution gauge has 100 divisions per 0.1 mm revolution (0.001 mm each); count full turns too. Do not push the rod.", action: "Gauge contact checked" },
    cold: { step: "04", title: "Record the cold baseline", body: "Before switching on the hot plate, read the digital probe and note the dial gauge. Record θ₁ and L₁ together.", action: `Record θ₁ = ${temp.toFixed(1)} °C, L₁ = ${reading.toFixed(3)} mm` },
    steam: { step: "05", title: "Pass steam through the jacket", body: "Check the receiver is open, then switch on the hot plate. Steam will travel from the boiler side arm through the jacket while condensate drains from the outlet.", action: "Switch on hot plate" },
    steady: { step: "06", title: "Wait for thermal equilibrium", body: temp < 98.5 ? `The rod is warming (${temp.toFixed(1)} °C). Wait for the thermometer to approach 99 °C.` : `Both readings must remain steady before recording. Hold for ${Math.max(0, 5 - steadySeconds)} more seconds.`, action: "Read hot state" },
    hot: { step: "07", title: "Record the hot readings", body: "At steady temperature, read θ₂ and L₂ at eye level. Avoid touching the hot boiler, jacket, or tubes.", action: `Record θ₂ = ${temp.toFixed(1)} °C, L₂ = ${reading.toFixed(3)} mm` },
    done: { step: "08", title: "Calculate and shut down", body: `ΔL = ${(dL ?? 0).toFixed(3)} mm; Δθ = ${(dTheta ?? 0).toFixed(1)} °C. Use metres for ΔL and L₀ when calculating α. Switch off the hot plate and let the apparatus cool.`, action: "Open practical journal" },
  };
  const guide = guides[stage];
  const advance = () => {
    if (stage === "setup") setStage("length");
    else if (stage === "length") {
      if (!rulerAligned) setRulerAligned(true);
      else setStage("gauge");
    }
    else if (stage === "gauge") setStage("cold");
    else if (stage === "cold") {
      setCold({ theta: +temp.toFixed(1), r: +reading.toFixed(3) });
      setStage("steam");
    } else if (stage === "steam") setStage("steady");
    else if (stage === "steady") setStage("hot");
    else if (stage === "hot") {
      setHot({ theta: +temp.toFixed(1), r: +reading.toFixed(3) });
      setStage("done");
      setShowSummary(true);
    } else setShowJournal(true);
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#eef2f0]">
      <div className="absolute inset-0">
        <ExpansionScene
          temp={temp}
          extensionMm={extensionMm(temp)}
          steamOn={steamOn}
          rulerAligned={rulerAligned}
          measuringLength={stage === "length"}
          zoom={zoom}
          intro={introOpen}
          introIdx={introIdx}
          compact={compact}
        />
      </div>

      {/* Pre-action intro: mission briefing and 3D apparatus tour */}
      {introOpen && EXPANSION_BRIEF && (
        <PracticalIntro
          brief={EXPANSION_BRIEF}
          apparatus={TOUR_ITEMS}
          onSlide={setIntroIdx}
          onStart={() => setIntroOpen(false)}
          exitHref="/student/lab-game/physics"
          subject="Physics"
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
          Physics · Linear Expansion
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
            aria-labelledby="expansion-quit-title"
            className="w-[24rem] max-w-[92vw] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-white/30 duration-300 animate-in fade-in zoom-in-95"
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-dark p-5 text-primary-foreground">
              <div className="absolute -right-8 -top-8 size-28 rounded-full bg-amber-300/15 blur-2xl" />
              <div className="relative">
                <p className="mb-0.5 text-[9px] font-black uppercase tracking-[.18em] text-[#f6c453]">
                  Exit Lab
                </p>
                <h2 id="expansion-quit-title" className="text-lg font-black leading-tight">
                  Quit practical?
                </h2>
                <p className="text-xs font-medium text-white/80">Physics · Linear Expansion</p>
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
                    router.push("/student/lab-game/physics");
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary-dark disabled:cursor-wait disabled:opacity-90"
                >
                  {isQuitting ? (
                    <>
                      <DuoIcon icon={LoaderCircle} size={17} className="animate-spin" /> Leaving…
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
          <div className="pointer-events-none absolute inset-x-2 top-12 z-10 flex items-center justify-center gap-1 overflow-x-auto rounded-2xl border border-white/60 bg-white/95 px-1.5 py-1.5 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:left-1/2 sm:top-2 sm:-translate-x-1/2 sm:gap-2 sm:px-3.5">
            <span className="inline-flex items-center gap-1 rounded-xl border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-black text-amber-700 sm:text-sm">
              <DuoIcon icon={Thermometer} size={14} /> {temp.toFixed(1)} °C
            </span>
            <span className="inline-flex items-center gap-1 rounded-xl border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-black text-primary sm:text-sm">
              <DuoIcon icon={Ruler} size={14} /> {reading.toFixed(3)} mm
            </span>
            <span className="hidden items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200 sm:inline-flex sm:text-sm">
              <DuoIcon icon={Activity} size={13} /> L₀ = {L0} m
            </span>
          </div>

          <button
            type="button"
            onClick={() => setReadingsOpen(true)}
            aria-expanded={readingsOpen}
            className="absolute right-2 top-24 z-20 inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white/95 px-3 py-2 text-xs font-black text-primary shadow-lg lg:hidden"
          >
            <DuoIcon icon={ClipboardList} size={15} /> Readings {Number(!!cold) + Number(!!hot)}/2
          </button>

          {/* On desktop, the readings and result share the bottom dock with the step card. */}
          <aside className={`pointer-events-auto absolute right-2 top-36 z-30 max-h-[60dvh] flex-col gap-3 overflow-y-auto rounded-3xl border border-slate-200 bg-[#f7f9f8] p-3 shadow-2xl ${readingsOpen ? "left-2 flex" : "hidden"} lg:bottom-3 lg:left-3 lg:right-auto lg:top-auto lg:flex lg:h-[174px] lg:max-h-none lg:w-[calc(100%-548px)] lg:flex-row lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`} aria-label="Observation and calculation panel">
            <button type="button" onClick={() => setReadingsOpen(false)} className="self-end rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 lg:hidden">Close readings</button>
            {/* Observation Log Card */}
            <div className="min-w-0 overflow-hidden rounded-3xl border border-white/70 bg-white/95 p-3.5 shadow-xl backdrop-blur-md lg:flex-1 lg:overflow-y-auto lg:p-2.5">
              <div className="mb-3 flex items-center justify-between gap-2 lg:mb-1.5">
                <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-slate-800">
                  <span className="grid size-7 place-items-center rounded-xl bg-primary/10 text-primary"><DuoIcon icon={ClipboardList} size={15} /></span>
                  Observation log
                </p>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">{Number(!!cold) + Number(!!hot)}/2</span>
              </div>
              <div className="mb-3 flex gap-1.5 lg:mb-1.5" aria-label={`${Number(!!cold) + Number(!!hot)} of 2 readings recorded`}>
                <div className={`h-1.5 flex-1 rounded-full ${cold ? "bg-primary" : "bg-slate-200"}`} />
                <div className={`h-1.5 flex-1 rounded-full ${hot ? "bg-primary" : "bg-slate-200"}`} />
              </div>
              <div className="overflow-hidden rounded-2xl border border-primary/10 bg-primary/[0.025]">
                <table className="w-full text-xs lg:text-[11px]">
                  <tbody className="divide-y divide-slate-200/60">
                    <tr>
                      <td className="px-3 py-1.5 font-bold text-slate-600 lg:py-1">Cold State</td>
                      <td className="px-3 py-1.5 text-right font-mono font-black text-slate-900 lg:py-1">
                        {cold ? `${cold.theta.toFixed(1)}°C · ${cold.r.toFixed(3)}mm` : "—"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 font-bold text-slate-600 lg:py-1">Hot State</td>
                      <td className="px-3 py-1.5 text-right font-mono font-black text-slate-900 lg:py-1">
                        {hot ? `${hot.theta.toFixed(1)}°C · ${hot.r.toFixed(3)}mm` : "—"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 font-bold text-slate-600 lg:py-1">Temp Rise (Δθ)</td>
                      <td className="px-3 py-1.5 text-right font-mono font-black text-slate-900 lg:py-1">
                        {dTheta != null ? `${dTheta.toFixed(1)} °C` : "—"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 font-bold text-slate-600 lg:py-1">Expansion (ΔL)</td>
                      <td className="px-3 py-1.5 text-right font-mono font-black text-slate-900 lg:py-1">
                        {dL != null ? `${dL.toFixed(3)} mm` : "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="relative min-w-0 overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-primary to-primary-dark p-4 text-white shadow-xl shadow-primary/20 lg:flex-1 lg:p-3">
              <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-white/10 blur-xl" />
              <div className="relative flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest"><DuoIcon icon={Calculator} size={13} /> Calculated output</span>
                <DuoIcon icon={Star} size={17} className="text-amber-200" />
              </div>
              <p className="relative mt-3 font-mono text-xs text-white/75 lg:mt-2 lg:text-[11px]">α = ΔL / (L₀ · Δθ)</p>
              <p className="relative mt-1 text-2xl font-black tracking-tight lg:text-xl">{alpha == null ? "—" : alpha.toExponential(2)} <span className="text-sm text-white/75">°C⁻¹</span></p>
              <p className="relative mt-1 text-[11px] font-medium text-white/70">{alpha == null ? "Record both readings to unlock the result" : `Steel reference: ${ALPHA_TRUE.toExponential(2)} °C⁻¹`}</p>
            </div>
          </aside>

          {/* Procedure card follows the chemistry lab's compact, primary-colour HUD. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-2 pb-[max(.5rem,env(safe-area-inset-bottom))] sm:p-4 lg:bottom-3 lg:left-auto lg:right-3 lg:w-[520px] lg:p-0">
            <div className="pointer-events-auto max-h-[51dvh] w-full max-w-[520px] overflow-y-auto rounded-3xl border border-white/80 bg-white/95 p-3 shadow-2xl shadow-black/15 backdrop-blur-xl sm:max-h-[60dvh] sm:p-4 lg:h-[174px] lg:max-h-none lg:p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                  <DuoIcon icon={Star} size={13} /> Lab quest · {guide.step}/08
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-600">
                  {stage === "done" ? "Completed" : "Practical steps"}
                </span>
              </div>
              <div className="mt-2.5 flex gap-1 lg:mt-1.5" aria-label={`Step ${guide.step} of 8`}>
                {Array.from({ length: 8 }, (_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i < Number(guide.step) ? "bg-primary" : "bg-slate-200"}`} />)}
              </div>
              <h2 className={`mt-2.5 font-black leading-tight text-slate-900 lg:mt-1.5 lg:text-[15px] ${tutorTitleCls}`}>{guide.title}</h2>
              <p className={`mt-1.5 font-medium leading-relaxed text-slate-600 lg:mt-1 lg:text-[12px] lg:leading-snug ${tutorSubCls}`}>{guide.body}</p>
              <div className="mt-3 flex flex-wrap gap-2 lg:mt-2">
                <button
                  onClick={advance}
                  disabled={stage === "steady" && steadySeconds < 5}
                  className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-3 py-2.5 text-center font-black text-white shadow-lg shadow-primary/25 transition hover:brightness-110 active:scale-[.98] disabled:cursor-wait disabled:opacity-60 lg:min-h-9 lg:py-1.5 lg:text-[12px] ${tutorSubCls}`}
                >
                  {stage === "steam" ? <DuoIcon icon={Power} size={16} /> : stage === "steady" && steadySeconds < 5 ? <DuoIcon icon={LoaderCircle} size={16} className="animate-spin" /> : <DuoIcon icon={stage === "done" ? BookOpen : CheckCircle2} size={16} />}
                  {guide.action}
                  {stage !== "done" && <DuoIcon icon={ArrowRight} size={15} />}
                </button>
                {stage === "done" && <>
                  <button onClick={() => setShowSummary(true)} className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-primary/10 px-3 py-2.5 font-black text-primary transition hover:bg-primary/15 ${tutorSubCls}`}><DuoIcon icon={ClipboardList} size={15} /> Summary</button>
                  <button onClick={reset} className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-slate-100 px-3 py-2.5 font-black text-slate-700 transition hover:bg-slate-200 ${tutorSubCls}`}><DuoIcon icon={RotateCcw} size={15} /> Restart</button>
                </>}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Summary Dialog */}
      {showSummary && cold && hot && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm">
          <div className="flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="bg-gradient-to-br from-primary to-primary-dark p-4 text-white sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                Practical complete
              </p>
              <h2 className="mt-1 text-xl font-black sm:text-2xl">Linear expansion measured</h2>
              <p className="mt-1 text-xs text-white/80">
                Pullinger&apos;s apparatus · steel rod · L₀ = {L0} m
              </p>
            </div>
            <div className="overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div className="rounded-2xl border border-black/5 bg-slate-50 p-2.5">
                  <p className="text-[10px] font-bold uppercase text-black/50">Cold</p>
                  <b className="text-sm font-black text-slate-900">{cold.theta.toFixed(1)} °C</b>
                  <p className="text-xs text-slate-600">{cold.r.toFixed(3)} mm</p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-slate-50 p-2.5">
                  <p className="text-[10px] font-bold uppercase text-black/50">Hot</p>
                  <b className="text-sm font-black text-slate-900">{hot.theta.toFixed(1)} °C</b>
                  <p className="text-xs text-slate-600">{hot.r.toFixed(3)} mm</p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-slate-50 p-2.5">
                  <p className="text-[10px] font-bold uppercase text-black/50">Δθ</p>
                  <b className="text-sm font-black text-slate-900">{dTheta?.toFixed(1)} °C</b>
                </div>
                <div className="rounded-2xl border border-black/5 bg-slate-50 p-2.5">
                  <p className="text-[10px] font-bold uppercase text-black/50">ΔL</p>
                  <b className="text-sm font-black text-slate-900">{dL?.toFixed(3)} mm</b>
                </div>
              </div>
              <div className="mt-3 rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
                <p className="text-xs font-bold">α = ΔL / (L₀ × Δθ)</p>
                <p className="text-xl font-black">{alpha?.toExponential(2)} °C⁻¹</p>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-black/65 font-medium">
                The rod expanded when steam raised its temperature. The dial gauge measured the change
                in length; dividing that change by the original length and temperature rise gives the
                coefficient of linear expansion.
              </p>
            </div>
            <div className="flex gap-2 border-t border-black/10 p-3 sm:p-4">
              <button
                onClick={() => {
                  setShowSummary(false);
                  setShowJournal(true);
                }}
                className="flex-1 rounded-2xl bg-primary px-3 py-2.5 text-xs font-black text-white shadow-lg shadow-primary/25"
              >
                Open journal
              </button>
              <button
                onClick={() => setShowSummary(false)}
                className="flex-1 rounded-2xl bg-slate-100 hover:bg-slate-200 px-3 py-2.5 text-xs font-black text-slate-700"
              >
                View apparatus
              </button>
              <button
                onClick={reset}
                className="rounded-2xl bg-slate-100 hover:bg-slate-200 px-3 py-2.5 text-xs font-black text-slate-700"
              >
                Restart
              </button>
            </div>
          </div>
        </div>
      )}

      {showJournal && <Journal config={journal} onClose={() => setShowJournal(false)} />}
    </div>
  );
}
