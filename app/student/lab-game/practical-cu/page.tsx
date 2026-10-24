"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, CheckCircle2, Sparkles, Target, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Maximize, Play } from "lucide-react";
import { getPracticalJournal } from "@/constants/practicalJournals";
import PracticalIntro, { journalToBrief } from "../_practical/PracticalIntro";
import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import type { TubeVis } from "./CuScene";

const CuScene = dynamic(() => import("./CuScene"), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">Loading lab…</div>,
});

const EMPTY: TubeVis = { fill: 0, color: "#ffffff", opacity: 0, powder: false, precip: null, precipAmt: 0 };
// Cu²⁺ salt solution is vibrant azure blue.
const SALT_SOL: TubeVis = { fill: 0.62, color: "#2563eb", opacity: 0.88, powder: false, precip: null, precipAmt: 0 };
// A coloured Cu precipitate: vibrant blue solution + a coloured precipitate.
const cuPpt = (f: number, precip: string, liquid = "#3b82f6", op = 0.85): TubeVis => ({ fill: f, color: liquid, opacity: op, powder: false, precip, precipAmt: 0.85 });

// Tube visuals for the 5 tubes at a given step (Cu²⁺ scheme).
function tubeVisFor(step: number, cuBlack: boolean): TubeVis[] {
  const t: TubeVis[] = [{ ...EMPTY }, { ...EMPTY }, { ...EMPTY }, { ...EMPTY }, { ...EMPTY }];
  // Tube 0 — salt solution → dil. HCl (no ppt) → H₂S (brownish-black ppt)
  if (step === 1) t[0] = { ...EMPTY, powder: true };
  else if (step === 2) t[0] = { fill: 0.7, color: "#60a5fa", opacity: 0.75, powder: true, precip: null, precipAmt: 0 };
  else if (step === 3) t[0] = { ...SALT_SOL };
  else if (step === 4) t[0] = { ...SALT_SOL }; // + dil. HCl → no precipitate (Group I absent)
  else if (step >= 5) t[0] = cuPpt(0.72, "#171717", "#1e3a8a"); // + H₂S → brownish-black CuS
  // Confirmatory portions — fresh salt solution prepared in tubes 1 & 2.
  if (step >= 5) {
    // NaOH → light-blue Cu(OH)₂ that turns black (CuO) on heating
    t[1] = step >= 6 ? cuPpt(0.6, cuBlack ? "#171717" : "#60a5fa", "#3b82f6") : { ...SALT_SOL };
    // K₄[Fe(CN)₆] → chocolate-brown Cu₂[Fe(CN)₆]
    t[2] = step >= 7 ? cuPpt(0.6, "#78350f", "#dbeafe", 0.75) : { ...SALT_SOL };
  }
  return t;
}

type Step = {
  tutor: string;
  x: string; // the action shown as "Press X to <x>"
  item: string | null;
  tube: number;
  pour?: string;
  zoom?: boolean;
  pre?: { title: string; body: string };
  post?: { title: string; body: string; eq?: string };
};

const STEPS: Step[] = [
  { tutor: "Pick up a test tube from the stand.", x: "pick up the test tube", item: "tube", tube: 0 },
  { tutor: "Add the salt sample to the test tube.", x: "add the salt", item: "salt", tube: 0 },
  { tutor: "Add distilled water to the test tube.", x: "pour distilled water", item: "water", tube: 0, pour: "water" },
  { tutor: "Shake to dissolve — this is your Salt Solution.", x: "shake the tube", item: "tube", tube: 0, post: { title: "Salt Solution ready ", body: "The salt dissolves into a blue Cu²⁺ salt solution." } },
  { tutor: "Add Diluted HCl to the Salt Solution.", x: "add Diluted HCl", item: "hcl", tube: 0, pour: "hcl", zoom: true, pre: { title: "Group I test", body: "Add Diluted HCl. No precipitate means the first group is absent." }, post: { title: "No precipitate", body: "No precipitate forms → Group I is absent." } },
  { tutor: "Pass H₂S through the acidified solution.", x: "pass H₂S", item: "h2s", tube: 0, pour: "h2s", zoom: true, post: { title: "Brownish-black precipitate", body: "Brownish-black ppt (insoluble in ammonium sulphide) → Group IIA present (Hg²⁺, Bi³⁺, Cu²⁺, Cd²⁺); Cu²⁺ is indicated." } },
  { tutor: "C.T: add NaOH to a fresh Salt Solution.", x: "add NaOH", item: "naoh", tube: 1, pour: "naoh", zoom: true, pre: { title: "Confirmatory tests", body: "Two fresh salt-solution portions are ready. Confirm Cu²⁺ with NaOH and with K₄[Fe(CN)₆]." }, post: { title: "Light-blue ppt → Cu²⁺ confirmed", body: "Light-blue ppt of Cu(OH)₂, which turns black on heating, confirms Cu²⁺.", eq: "CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄" } },
  { tutor: "C.T: add K₄[Fe(CN)₆] to a fresh Salt Solution.", x: "add K₄[Fe(CN)₆]", item: "k4", tube: 2, pour: "k4", zoom: true, post: { title: "Chocolate-brown ppt → Cu²⁺ confirmed", body: "Chocolate-brown ppt of Cu₂[Fe(CN)₆] confirms Cu²⁺.", eq: "2CuSO₄ + K₄[Fe(CN)₆] → Cu₂[Fe(CN)₆]↓ + 2K₂SO₄" } },
];

const DONE = STEPS.length;

// A small SVG test tube showing the coloured solution + precipitate, for the summary.
function MiniTube({ liquid, ppt }: { liquid: string; ppt: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 44 100" className="h-24 w-11 shrink-0">
      <defs>
        <clipPath id={id}>
          <path d="M13 10 L13 68 A9 9 0 0 0 31 68 L31 10 Z" />
        </clipPath>
      </defs>
      <rect x="13" y="8" width="18" height="72" fill="#eef2f5" clipPath={`url(#${id})`} />
      <rect x="13" y="44" width="18" height="36" fill={liquid} clipPath={`url(#${id})`} />
      <g clipPath={`url(#${id})`}>
        <circle cx="18" cy="70" r="4.2" fill={ppt} />
        <circle cx="24.5" cy="72" r="4.6" fill={ppt} />
        <circle cx="28" cy="67" r="3.6" fill={ppt} />
        <circle cx="20.5" cy="65" r="3.4" fill={ppt} />
        <circle cx="26" cy="63" r="2.8" fill={ppt} />
      </g>
      <path d="M13 10 L13 68 A9 9 0 0 0 31 68 L31 10" fill="none" stroke="#9aa4ad" strokeWidth="2" strokeLinecap="round" />
      <rect x="9" y="6" width="26" height="5" rx="2.5" fill="#2a2a2a" />
    </svg>
  );
}

// Duotone play icon: a solid play glyph layered over its offset, darker copy —
// the tap-to-act affordance that replaces the old "X" keycap.
function PlayDuo({ size = 10, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`relative inline-flex items-center justify-center ${className}`}>
      <Play size={size} className="absolute translate-x-[1px] translate-y-[1px] fill-primary-dark/80 text-primary-dark/80" />
      <Play size={size} className="relative fill-current text-inherit" />
    </span>
  );
}

// The observations shown in the summary, each with a tube + (where relevant) equation.
const SUMMARY = [
  { test: "Salt solution + Diluted HCl", obs: "No precipitate", inf: "Group I absent", eq: "", liquid: "#8fc3e6", ppt: "#8fc3e6" },
  { test: "Salt solution + Diluted HCl + H₂S", obs: "Brownish-black ppt, insoluble in ammonium sulphide", inf: "Group IIA present (Hg²⁺, Bi³⁺, Cu²⁺, Cd²⁺); Cu²⁺ indicated", eq: "", liquid: "#7fb0d0", ppt: "#2a201a" },
  { test: "C.T: Salt solution + NaOH", obs: "Light-blue ppt, turns black on heating", inf: "Cu²⁺ confirmed", eq: "CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄", liquid: "#7fb0d0", ppt: "#4f86c6" },
  { test: "C.T: Salt solution + K₄[Fe(CN)₆]", obs: "Chocolate-brown ppt", inf: "Cu²⁺ confirmed", eq: "2CuSO₄ + K₄[Fe(CN)₆] → Cu₂[Fe(CN)₆]↓ + 2K₂SO₄", liquid: "#cdd8de", ppt: "#5a3418" },
];

const PROCEDURE = [
  "Dissolve the salt in distilled water to prepare the Salt Solution (blue Cu²⁺ solution).",
  "Salt solution + Diluted HCl → no precipitate → Group I absent.",
  "Pass H₂S → brownish-black precipitate → Group IIA present; Cu²⁺ indicated.",
  "Confirm with fresh salt solution: + NaOH (light-blue ppt, black on heating) and + K₄[Fe(CN)₆] (chocolate-brown ppt).",
];

// New practicals use this shared runner. It owns the standard intro, apparatus
// tour, stable camera, bottom guide cards, completion report, and exit route.
const sharedConfig: PracticalConfig = {
  title: "Detect Cu²⁺",
  ionLabel: "Cu²⁺",
  radical: "copper(II)",
  group: "Group IIA",
  reagents: [
    { id: "water", color: "#dbe9f4", label: "Dist. Water" },
    { id: "hcl", color: "#e4eef4", label: "Diluted HCl" },
    { id: "h2s", color: "#eceee0", label: "H₂S" },
    { id: "naoh", color: "#eef0f2", label: "NaOH" },
    { id: "k4", color: "#f0ead0", label: "K₄[Fe(CN)₆]" },
  ],
  steps: STEPS,
  tubeVis: (step) => tubeVisFor(step, false),
  summary: SUMMARY,
  procedure: PROCEDURE,
};

// Retained temporarily for reference while the route uses the shared runner.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyCuPage() {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"pre" | "guide" | "post">("guide");
  const [pourItem, setPourItem] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [nav, setNav] = useState("Move forward to the bench");
  const [ready, setReady] = useState(false);
  const [showQuit, setShowQuit] = useState(false);
  const [cuBlack, setCuBlack] = useState(false); // NaOH ppt turns black on heating
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);
  const [started, setStarted] = useState(false);
  const [introOpen, setIntroOpen] = useState(true);

  // Practical brief pulled straight from the journal feed — the intro walks
  // through the object and the apparatus, one item per slide.
  const brief = useMemo(() => journalToBrief(getPracticalJournal("practical-cu", "chemistry", "XII")), []);

  useEffect(() => {
    setIsMobile(window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window);
    const checkOrientation = () => {
      if (typeof window === "undefined") return;
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
    screen.orientation?.addEventListener?.("change", checkOrientation);
    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
      screen.orientation?.removeEventListener?.("change", checkOrientation);
    };
  }, []);

  // Compact sizing for the on-screen (touch) layout — the Nova speech bubble and
  // milestone cards use smaller text on phones so they fit the short heap of a
  // landscape viewport without covering the lab.
  const compact = isMobile;
  const tutorTitleCls = compact ? "text-xs sm:text-[13px]" : "text-[17px]";
  const tutorSubCls = compact ? "text-[10px] sm:text-[11px]" : "text-sm";
  const milestoneTitleCls = compact ? "text-sm sm:text-base" : "text-xl";
  const milestoneBodyCls = compact ? "text-xs" : "text-[15px]";
  const preTitleCls = compact ? "text-xs sm:text-sm" : "text-base";
  const preBodyCls = compact ? "text-[11px] sm:text-xs" : "text-sm";

  // Dispatch synthetic key events from the on-screen buttons (reuses the same
  // keyboard handling the desktop uses).
  const sendKey = (type: "keydown" | "keyup", key: string) => window.dispatchEvent(new KeyboardEvent(type, { key }));

  const exitLandscape = useCallback(() => {
    try { if (document.fullscreenElement) void document.exitFullscreen(); } catch { /* ignore */ }
    try { (screen.orientation as unknown as { unlock?: () => void }).unlock?.(); } catch { /* ignore */ }
  }, []);

  // Auto-restore portrait whenever fullscreen is left (ESC, swipe, browser UI)
  // so the landscape lock never strands the phone sideways.
  useEffect(() => {
    const onFsChange = () => { if (!document.fullscreenElement) exitLandscape(); };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [exitLandscape]);

  const startFullscreen = useCallback(async () => {
    try {
      const docEl = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
      };
      if (docEl.requestFullscreen) await docEl.requestFullscreen();
      else if (docEl.webkitRequestFullscreen) await docEl.webkitRequestFullscreen();
    } catch { /* ignore */ }
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const orientation = screen.orientation as unknown as {
        lock?: (orientation: "landscape-primary" | "landscape") => Promise<void>;
      };
      try {
        await orientation.lock?.("landscape-primary");
      } catch {
        await orientation.lock?.("landscape");
      }
    } catch { /* ignore on iOS where lock() is unsupported */ }
    setStarted(true);
  }, []);

  const done = step >= DONE;
  const cur = done ? null : STEPS[step];
  // The intro shows before any action is asked of the student. On phones it
  // appears right after the fullscreen start gate; portrait is left to the
  // orientation prompt.
  const showIntro = !!brief && introOpen && !done && (started || !isMobile) && (isLandscape || !isMobile);
  const dismissIntro = useCallback(() => {
    setIntroOpen(false);
    setStarted(true);
  }, []);
  // Show the current step's RESULT only during its "post" milestone; before/while
  // performing it, keep showing the previous state so the result appears only once
  // the action animation has finished (never the instant X is pressed).
  const preview = phase !== "post";
  const visStep = preview ? Math.max(0, step - 1) : step;
  const tubeVis = useMemo(() => tubeVisFor(visStep, cuBlack), [visStep, cuBlack]);

  // The NaOH precipitate (step 6) turns black shortly after it forms — "on heating".
  useEffect(() => {
    if (phase === "post" && step === 6) {
      const id = window.setTimeout(() => setCuBlack(true), 1900);
      return () => window.clearTimeout(id);
    }
  }, [phase, step]);

  // Show the pre-popup when entering a step that has one.
  useEffect(() => {
    if (cur?.pre) setPhase("pre");
    else setPhase("guide");
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = useCallback(() => {
    setZoom(false);
    setStep((s) => s + 1);
  }, []);

  const onAct = useCallback(() => {
    if (introOpen || phase !== "guide" || !cur) return;
    setActing(true);
    if (cur.pour) {
      setPourItem(cur.pour);
      window.setTimeout(() => setPourItem(null), 3800);
    }
    if (cur.zoom) setZoom(true);
    // Longer windows for the spoon (1) and shake (3) animations.
    const anim = step === 1 ? 1700 : step === 3 ? 1400 : 0;
    const delay = Math.max(anim, cur.pour ? 4000 : cur.zoom ? 2300 : 450);
    window.setTimeout(() => {
      setActing(false);
      if (cur.post) {
        setZoom(true); // zoom into the tube while the milestone result is shown
        setPhase("post");
      } else goNext();
    }, delay);
  }, [phase, cur, step, goNext, introOpen]);

  // Result ("post") popups are milestone pops: they stay for 5s while the camera
  // is zoomed on the tube, then auto-dismiss and the view returns to normal.
  useEffect(() => {
    if (phase !== "post") return;
    const id = window.setTimeout(() => goNext(), 14000);
    // Spacebar skips the milestone on desktop (mobile users tap the banner).
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKey);
    };
  }, [phase, goNext]);

  // Remember the last result content so the milestone banner can smoothly fade
  const lastPost = useRef<{ title: string; body: string; eq?: string } | null>(null);
  if (phase === "post" && cur?.post) lastPost.current = cur.post;
  const postC = cur?.post ?? lastPost.current;

  const dismissPre = () => setPhase("guide");
  const dismissPost = () => goNext();

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#e3e7e4] select-none touch-none overscroll-none fixed inset-0">
      <style>{`
        @keyframes pbMilestone { from { width: 100%; } to { width: 0%; } }
        @keyframes phoneRotate {
          0%, 15% { transform: rotate(0deg); }
          50%, 65% { transform: rotate(90deg); }
          85%, 100% { transform: rotate(0deg); }
        }
        .phone-rotate-anim {
          animation: phoneRotate 3s ease-in-out infinite;
        }
      `}</style>
      <div className="absolute inset-0">
        <CuScene
          step={step}
          tubeVis={tubeVis}
          activeTube={cur?.tube ?? 0}
          pourItem={pourItem}
          zoom={zoom}
          acting={acting}
          onAct={onAct}
          onNav={setNav}
          onReady={setReady}
        />
      </div>

      {/* Pre-action intro: the aim of the practical, then the apparatus one by one */}
      {showIntro && brief && <PracticalIntro brief={brief} onStart={dismissIntro} />}

      {/* crosshair only (the prompt text lives in the tutor card) */}
      {!done && phase === "guide" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className={`h-2.5 w-2.5 rounded-full border-2 ${ready ? "border-primary bg-primary/40" : "border-white/70"}`} />
        </div>
      )}

      {/* top bar */}
      <div data-ui className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-2.5 sm:p-4">
        <button onClick={() => setShowQuit(true)} className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur border border-white/10 transition hover:bg-black/90">
          Quit
        </button>
        <span className="rounded-full bg-black/70 px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white/90 backdrop-blur border border-white/10">Salt Analysis · Detect Cu²⁺</span>
      </div>

      {/* Quit confirmation modal */}
      {showQuit && (
        <div data-ui className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-[24rem] max-w-[92vw] overflow-hidden rounded-3xl bg-white shadow-2xl duration-300 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 bg-primary p-5 text-primary-foreground">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/20">
                <ArrowLeft size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black leading-tight">Quit practical?</h2>
                <p className="text-xs font-medium text-white/80">Detection of Cu²⁺</p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm leading-snug text-black/70">Your progress in this simulation won&apos;t be saved. Are you sure you want to leave?</p>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setShowQuit(false)} className="flex-1 rounded-2xl bg-black/5 px-4 py-2.5 text-sm font-black text-black/70 transition hover:bg-black/10">
                  Stay
                </button>
                <Link href="/student/lab-game/chemistry?grade=XII" onClick={exitLandscape} className="flex-1 rounded-2xl bg-primary px-4 py-2.5 text-center text-sm font-black text-primary-foreground transition hover:bg-primary-dark">
                  Quit
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom-centered guide area — all three prompt types share one clean,
          gamified card look: Learn (Continue), Nova says (Press X), and the
          milestone result (press Spacebar / tap to continue). Hidden during the
          intro tour, which has its own controls. */}
      {!done && !showIntro && (
        <div data-ui className="pointer-events-none absolute inset-x-0 bottom-2 sm:bottom-3 z-30 flex justify-center px-2">
          <div className="flex w-full max-w-[440px] flex-col items-center gap-1.5">
            {/* pre "learn" card — Press Continue (gamified mission objective) */}
            {phase === "pre" && cur?.pre && (
              <div className="pointer-events-auto w-full animate-in fade-in slide-in-from-bottom-2 overflow-hidden rounded-2xl border border-primary/25 bg-white/95 shadow-xl backdrop-blur">
                <div className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-dark px-3 py-2 sm:py-2.5">
                  <div className="relative grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/20 text-white shadow-inner ring-2 ring-white/40">
                    <Target size={15} />
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white" />
                  </div>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <p className="min-w-0 text-[9px] font-black uppercase tracking-widest text-white">
                      Mission {step + 1}.
                    </p>
                    <div className="h-0.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/25">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-400"
                        style={{ width: `${((step + 1) / DONE) * 100}%` }}
                      />
                    </div>
                    <p className="shrink-0 text-[9px] font-black text-white/80">{step + 1}/{DONE}</p>
                  </div>
                </div>
                <div className="p-3 sm:p-3.5">
                  <div className="flex items-start gap-2">
                    <h2 className={`flex-1 ${preTitleCls} font-black leading-tight text-black`}>{cur.pre.title}</h2>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
                      <Sparkles size={9} /> Learn
                    </span>
                  </div>
                  <p className={`mt-1 ${preBodyCls} leading-snug text-black/70`}>{cur.pre.body}</p>
                  <button
                    onClick={dismissPre}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark py-2 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-primary/30 transition hover:brightness-110 hover:shadow-xl hover:shadow-primary/40 active:scale-[0.98]"
                  >
                    <PlayDuo size={12} /> Start Mission
                  </button>
                </div>
              </div>
            )}

            {/* Nova says — Press X (or the on-screen DO button on mobile) */}
            <div
              className={`w-full transition-all duration-500 ease-out ${
                phase === "guide" && !acting ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"
              }`}
            >
              <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/95 shadow-xl backdrop-blur">
                <div className="flex items-center gap-1.5 border-b border-black/5 bg-gradient-to-r from-primary/10 to-transparent px-3 py-1.5">
                  <div className="grid h-5 w-5 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-white">
                    <Sparkles size={10} />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary">Nova says · Step {step + 1} of {DONE}</p>
                </div>
                <div className="p-3 sm:p-3.5">
                  <h2 className={`${tutorTitleCls} font-black leading-snug text-black`}>{cur?.tutor}</h2>
                  {ready ? (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-primary-dark px-2 py-1 shadow-md shadow-primary/30 sm:px-2.5 sm:py-1.5">
                      <kbd className="grid h-4 w-4 shrink-0 place-items-center rounded bg-white text-[10px] font-black text-primary shadow">X</kbd>
                      <span className={`font-bold text-white ${tutorSubCls}`}>{isMobile ? <>Press the <span className="mx-0.5 inline-grid h-4 w-4 shrink-0 place-items-center rounded bg-white/20 align-middle text-white"><PlayDuo size={9} /></span> button</> : <>Press X to {cur?.x}</>}</span>
                    </div>
                  ) : (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1">
                      <MapPin size={11} className="shrink-0 text-primary" />
                      <span className={`font-bold text-primary ${tutorSubCls}`}>{nav}</span>
                    </div>
                  )}
                  <div className="mt-2.5 flex gap-1">
                    {STEPS.map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${step > i ? "bg-gradient-to-r from-primary to-primary-dark" : step === i ? "bg-primary/60" : "bg-black/10"}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* milestone — press Spacebar / tap to continue */}
            {postC && (
              <div
                className={`w-full transition-all duration-500 ease-out ${
                  phase === "post" ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"
                }`}
              >
                <div className="pointer-events-auto max-h-[38vh] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl ring-1 ring-white/25 sm:max-h-[42vh]">
                  <div className="flex items-center gap-2.5 p-3 sm:p-3.5">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/20 backdrop-blur">
                      {step === 3 ? <CheckCircle2 size={compact ? 20 : 24} /> : <Sparkles size={compact ? 20 : 24} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/70">Milestone · Step {step + 1} of {DONE}</p>
                      <h2 className={`${milestoneTitleCls} font-black leading-tight`}>{postC.title}</h2>
                    </div>
                  </div>
                  <div className="border-t border-white/15 bg-black/10 px-3 py-2.5 sm:px-3.5">
                    <div className="max-h-[14vh] overflow-y-auto pr-1 sm:max-h-[16vh]">
                      <p className={`${milestoneBodyCls} font-medium leading-snug text-white/90`}>{postC.body}</p>
                      {postC.eq && <p className={`mt-1.5 rounded-lg bg-black/20 px-2.5 py-1.5 font-mono font-bold text-white ${tutorSubCls}`}>{postC.eq}</p>}
                    </div>
                    <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                      {phase === "post" && <div key={step} className="h-full rounded-full bg-white" style={{ animation: "pbMilestone 14s linear forwards" }} />}
                    </div>
                    <button onClick={dismissPost} className="mt-1.5 w-full text-center text-[11px] font-bold text-white/75 transition hover:text-white">
                      Continuing… ({isMobile ? "tap to skip" : "press Spacebar to skip"})
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Done modal — full practical summary */}
      {done && (
        <div data-ui className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* header */}
            <div className="flex items-center gap-3 bg-gradient-to-br from-primary to-primary-dark p-5 text-white">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20"><CheckCircle2 size={28} /></div>
              <div>
                <h2 className="text-2xl font-black leading-tight">Cu²⁺ confirmed!</h2>
                <p className="text-xs font-semibold text-white/80">Basic radical: copper(II) — Group II · Practical complete</p>
              </div>
            </div>

            <div className="overflow-y-auto p-5">
              {/* procedure recap */}
              <p className="text-[11px] font-black uppercase tracking-widest text-primary/70">Procedure</p>
              <ol className="mt-2 space-y-1.5">
                {PROCEDURE.map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-black/75">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-black text-primary">{i + 1}</span>
                    <span className="leading-snug">{s}</span>
                  </li>
                ))}
              </ol>

              {/* confirmatory results — tube + equation cards */}
              <p className="mt-5 text-[11px] font-black uppercase tracking-widest text-primary/70">Observations & Equations</p>
              <div className="mt-2 space-y-2.5">
                {SUMMARY.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl border border-black/10 bg-black/[0.02] p-3">
                    <MiniTube liquid={r.liquid} ppt={r.ppt} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-black text-black">{r.test}</p>
                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">{r.inf}</span>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-black/60">{r.obs}</p>
                      {r.eq && <p className="mt-1.5 w-fit max-w-full rounded-lg bg-black/5 px-2 py-1 font-mono text-[11px] font-bold text-black/80">{r.eq}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-black/5 bg-black/[0.02] p-4">
              <div className="flex gap-3">
                <Link href="/student/practical-journals/chemistry/practical-cu" className="flex-1 rounded-xl bg-primary px-4 py-3 text-center text-sm font-black text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark">
                  <span className="sm:hidden">Open Journal</span>
                  <span className="hidden sm:inline">Open Practical Journal</span>
                </Link>
                <Link href="/student/lab-game/chemistry?grade=XII" onClick={exitLandscape} className="flex-1 rounded-xl bg-black/10 px-4 py-3 text-center text-sm font-black text-black/70 transition hover:bg-black/15">Quit</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile on-screen controls: Walk (Left) + Action button (Right) */}
      {isMobile && !done && (
        <div data-ui className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-between p-2.5 sm:p-3">
          {/* Movement Walk D-pad (Bottom-Left) */}
          <div className="pointer-events-auto flex flex-col items-center">
            <span className="mb-0.5 text-[8px] font-black uppercase tracking-wider text-white/50">Move</span>
            <div className="grid grid-cols-3 grid-rows-2 gap-1">
              {[
                { k: "ArrowUp", i: <ChevronUp size={16} />, c: "col-start-2 row-start-1" },
                { k: "ArrowLeft", i: <ChevronLeft size={16} />, c: "col-start-1 row-start-2" },
                { k: "ArrowDown", i: <ChevronDown size={16} />, c: "col-start-2 row-start-2" },
                { k: "ArrowRight", i: <ChevronRight size={16} />, c: "col-start-3 row-start-2" },
              ].map((b) => (
                <button
                  key={b.k}
                  className={`${b.c} flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-black/60 text-white backdrop-blur-md border border-white/10 active:bg-primary transition shadow-md`}
                  onPointerDown={(e) => { e.preventDefault(); sendKey("keydown", b.k); }}
                  onPointerUp={() => sendKey("keyup", b.k)}
                  onPointerLeave={() => sendKey("keyup", b.k)}
                >
                  {b.i}
                </button>
              ))}
            </div>
          </div>
          {/* Action button (Play = act) — Bottom-Right */}
          <div className="pointer-events-auto flex items-end gap-2 sm:gap-3">
            <button
              aria-label="Perform Action"
              className={`flex h-12 w-12 sm:h-14 sm:w-14 flex-col items-center justify-center rounded-2xl text-white shadow-xl transition active:scale-90 ${
                ready
                  ? "bg-primary ring-2 ring-primary/50 shadow-primary/40 animate-pulse"
                  : "bg-black/60 border border-white/10 opacity-70"
              }`}
              onPointerDown={(e) => { e.preventDefault(); sendKey("keydown", "x"); setTimeout(() => sendKey("keyup", "x"), 60); }}
            >
              <PlayDuo size={16} />
              <span className="text-[8px] sm:text-[9px] font-bold tracking-widest uppercase opacity-90">DO</span>
            </button>
          </div>
        </div>
      )}

      {false && isMobile && !isLandscape && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f1512]/95 p-6 text-center text-white backdrop-blur-md">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/20">
            <div className="phone-rotate-anim flex h-14 w-8 items-center justify-center rounded-lg border-2 border-primary bg-primary/20 shadow-lg shadow-primary/30">
              <div className="h-1.5 w-1.5 rounded-full bg-white/60 mb-8" />
            </div>
          </div>
          <h2 className="text-xl font-black tracking-tight">Rotate Device to Landscape</h2>
          <p className="mt-2 max-w-xs text-xs font-medium text-white/75 leading-relaxed">
            The virtual laboratory requires landscape mode for a clear panoramic view of the chemicals and bench.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-[11px] font-semibold text-white/80 ring-1 ring-white/15">
            <Sparkles size={14} className="text-primary" />
            <span>Turn your phone horizontally to continue</span>
          </div>
          <p className="mt-4 text-[10px] text-white/50 max-w-xs">
            iPhone tip: Turn off &ldquo;Portrait Orientation Lock&rdquo; in Control Center if your screen doesn&apos;t rotate.
          </p>
        </div>
      )}

      {/* Mobile fullscreen + landscape start gate */}
      {isMobile && !started && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#0f1512] p-6 text-center text-white">
          <div className="relative mb-4 h-20 w-20 overflow-hidden rounded-3xl bg-white/10 ring-1 ring-white/20">
            <Image src="/nova-tutor-lab.webp" alt="Nova" fill sizes="80px" className="object-cover object-top" />
          </div>
          <h2 className="text-lg font-black sm:text-xl">Detect Cu²⁺ — Virtual Lab</h2>
          <p className="mt-1 max-w-xs text-xs font-medium text-white/70">Fullscreen will start your experiment.</p>
          <button onClick={startFullscreen} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/30 transition hover:brightness-110 active:scale-95">
            <Maximize size={18} /> Start experiment
          </button>
        </div>
      )}
    </div>
  );
}

export default function CuPage() {
  return <PracticalRunner config={sharedConfig} />;
}
