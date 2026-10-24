"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Sparkles, Maximize, Play, LoaderCircle, RotateCcw } from "lucide-react";
import { getPracticalJournal } from "@/constants/practicalJournals";
import PracticalIntro, { journalToBrief } from "../_practical/PracticalIntro";
import { POUR_ACTION_MS } from "../_practical/pourMotion";
import type { TubeVis } from "./PbScene";
import { INTRO_TAG_NAMES } from "./PbScene";

const PbScene = dynamic(() => import("./PbScene"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 grid place-items-center text-sm font-medium text-muted-foreground">Loading lab…</div>,
});

const POST_AUTO_CONTINUE_SECONDS = 14;

const EMPTY: TubeVis = { fill: 0, color: "#ffffff", opacity: 0, powder: false, precip: null, precipAmt: 0 };
// The prepared salt solution (clear, faintly cloudy).
const SALT_SOL: TubeVis = { fill: 0.7, color: "#dfe3e0", opacity: 0.8, powder: false, precip: null, precipAmt: 0 };
// White precipitate — clean white precipitate.
const whitePpt = (f = 0.6): TubeVis => ({ fill: f, color: "#e2e8f0", opacity: 0.75, powder: false, precip: "#f8fafc", precipAmt: 0.8 });
// Yellow precipitate — bright yellow solution + vivid canary yellow precipitate (PbCrO₄).
const yellowPpt = (f = 0.6): TubeVis => ({ fill: f, color: "#fef08a", opacity: 0.85, powder: false, precip: "#facc15", precipAmt: 0.85 });

// Tube visuals for the 5 tubes at a given step (new scheme, no filter/heat/divide).
function tubeVisFor(step: number): TubeVis[] {
  const t: TubeVis[] = [{ ...EMPTY }, { ...EMPTY }, { ...EMPTY }, { ...EMPTY }, { ...EMPTY }];
  // Tube 0 — salt solution → dil. HCl (group I) → NH₄OH
  if (step === 1) t[0] = { ...EMPTY, powder: true };
  else if (step === 2) t[0] = { fill: 0.7, color: "#e8eef2", opacity: 0.55, powder: true, precip: null, precipAmt: 0 };
  else if (step === 3 || step === 4) t[0] = { ...SALT_SOL };
  else if (step === 5) t[0] = whitePpt(0.77);
  else if (step >= 6) t[0] = whitePpt(0.84);
  // Three labelled portions are ready for the group and confirmatory tests.
  if (step >= 4) {
    t[1] = step >= 7 ? yellowPpt(0.78) : { ...SALT_SOL };
    t[2] = step >= 8 ? whitePpt(0.78) : { ...SALT_SOL };
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
  { tutor: "Shake to dissolve — this is your Salt Solution.", x: "shake the tube", item: "tube", tube: 0, post: { title: "Salt Solution ready ", body: "The salt has dissolved into a clear salt solution." } },
  { tutor: "Divide the Salt Solution into three test tubes.", x: "continue", item: null, tube: 0 },
  { tutor: "Add Diluted HCl to the Salt Solution.", x: "add Diluted HCl", item: "hcl", tube: 0, pour: "hcl", zoom: true, pre: { title: "Group I test", body: "Add Diluted HCl. A white precipitate means the first group (Ag⁺, Hg₂²⁺ or Pb²⁺) is present." }, post: { title: "White precipitate!", body: "White precipitate → first group present (Ag⁺, Hg₂²⁺ or Pb²⁺)." } },
  { tutor: "Add NH₄OH to the precipitate.", x: "add NH₄OH", item: "nh4oh", tube: 0, pour: "nh4oh", zoom: true, post: { title: "Precipitate unaffected", body: "The white precipitate remains unaffected in NH₄OH → Pb²⁺ may be present." } },
  { tutor: "C.T: add K₂CrO₄ to a fresh Salt Solution.", x: "add K₂CrO₄", item: "k2cro4", tube: 1, pour: "k2cro4", zoom: true, pre: { title: "Confirmatory tests", body: "Two fresh salt-solution portions are ready. Confirm Pb²⁺ with K₂CrO₄ and with NaOH." }, post: { title: "Yellow ppt → Pb²⁺ confirmed", body: "Yellow precipitate of lead chromate (PbCrO₄) confirms Pb²⁺.", eq: "Pb(NO₃)₂ + K₂CrO₄ → PbCrO₄↓ + 2KNO₃" } },
  { tutor: "C.T: add NaOH to a fresh Salt Solution.", x: "add NaOH", item: "naoh", tube: 2, pour: "naoh", zoom: true, post: { title: "White ppt → Pb²⁺ confirmed", body: "White ppt of Pb(OH)₂, soluble in excess NaOH, confirms Pb²⁺.", eq: "Pb(NO₃)₂ + 2NaOH → Pb(OH)₂↓ + 2NaNO₃" } },
];

const DONE = STEPS.length;

// A small SVG test tube showing the coloured solution + precipitate, for the summary.
function MiniTube({ liquid, ppt, compact }: { liquid: string; ppt: string; compact: boolean }) {
  const id = useId();
  return (
    <svg viewBox="0 0 44 100" className={`${compact ? "h-14 w-7" : "h-24 w-11"} shrink-0`}>
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

const SUMMARY = [
  { test: "Salt solution + Diluted HCl", obs: "White precipitate", inf: "First group present (Ag⁺, Hg₂²⁺ or Pb²⁺)", eq: "", liquid: "#e9eef1", ppt: "#cfd6da" },
  { test: "Precipitate + NH₄OH", obs: "White ppt remains unaffected", inf: "Pb²⁺ may be present", eq: "", liquid: "#e9eef1", ppt: "#cfd6da" },
  { test: "C.T: Salt solution + K₂CrO₄", obs: "Yellow precipitate", inf: "Pb²⁺ confirmed", eq: "Pb(NO₃)₂ + K₂CrO₄ → PbCrO₄↓ + 2KNO₃", liquid: "#f0dd4a", ppt: "#eab308" },
  { test: "C.T: Salt + NaOH", obs: "White ppt, soluble in excess NaOH", inf: "Pb²⁺ confirmed", eq: "Pb(NO₃)₂ + 2NaOH → Pb(OH)₂↓ + 2NaNO₃", liquid: "#e9eef1", ppt: "#cfd6da" },
];

const PROCEDURE = [
  "Dissolve the salt in distilled water to prepare the Salt Solution.",
  "Salt solution + Diluted HCl → white precipitate → first group present.",
  "Precipitate + NH₄OH → remains unaffected → Pb²⁺ may be present.",
  "Confirm with fresh salt solution: + K₂CrO₄ (yellow ppt) and + NaOH (white ppt, soluble in excess).",
];

export default function PbPage() {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"pre" | "guide" | "post">(STEPS[0]?.pre ? "pre" : "guide");
  const [pourItem, setPourItem] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [nav, setNav] = useState("Aim at the bench");
  const [ready, setReady] = useState(false);
  const [showQuit, setShowQuit] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);
  const [started, setStarted] = useState(false);
  const [introOpen, setIntroOpen] = useState(true);
  const [introIdx, setIntroIdx] = useState(0);
  const [postCountdown, setPostCountdown] = useState(POST_AUTO_CONTINUE_SECONDS);

  // Practical brief pulled straight from the journal feed — the intro walks
  // through the object and the apparatus, one item per slide.
  const brief = useMemo(() => journalToBrief(getPracticalJournal("practical-pb", "chemistry", "XII")), []);

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
  const tutorTitleCls = compact ? "text-[10px]" : "text-[17px]";
  const tutorSubCls = compact ? "text-[9px]" : "text-sm";
  const milestoneTitleCls = compact ? "text-xs" : "text-xl";
  const milestoneBodyCls = compact ? "text-[10px]" : "text-[15px]";
  const preTitleCls = compact ? "text-sm" : "text-base";
  const preBodyCls = compact ? "text-[11px]" : "text-sm";

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
  const tubeVis = useMemo(() => tubeVisFor(visStep), [visStep]);

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
    }
    if (cur.zoom) setZoom(true);
    // Longer windows for the spoon (1) and shake (3) animations.
    const anim = step === 1 ? 1700 : step === 3 ? 1400 : 0;
    const delay = Math.max(anim, cur.pour ? POUR_ACTION_MS : cur.zoom ? 2300 : 450);
    window.setTimeout(() => {
      if (cur.pour) setPourItem(null);
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
    const startedAt = Date.now();
    const updateCountdown = () => {
      const elapsed = Date.now() - startedAt;
      setPostCountdown(Math.max(0, Math.ceil((POST_AUTO_CONTINUE_SECONDS * 1000 - elapsed) / 1000)));
    };
    setPostCountdown(POST_AUTO_CONTINUE_SECONDS);
    const tick = window.setInterval(updateCountdown, 250);
    const id = window.setTimeout(() => goNext(), POST_AUTO_CONTINUE_SECONDS * 1000);
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
      window.clearInterval(tick);
      window.removeEventListener("keydown", onKey);
    };
  }, [phase, goNext]);

  // Remember the last result content so the milestone banner can smoothly fade
  // OUT (it stays mounted through the exit transition after phase leaves "post").
  const lastPost = useRef<{ title: string; body: string; eq?: string } | null>(null);
  if (phase === "post" && cur?.post) lastPost.current = cur.post;
  const postC = cur?.post ?? lastPost.current;
  const wideResult = !!postC?.eq || (postC?.body.length ?? 0) > 80;

  const dismissPre = () => setPhase("guide");
  const dismissPost = () => goNext();


  return (
    <div className="fixed inset-0 w-full overflow-hidden bg-[#e3e7e4] select-none touch-none overscroll-none">
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
        <PbScene
          step={step}
          tubeVis={tubeVis}
          pourTargetFill={cur?.pour ? tubeVisFor(step)[cur.tube]?.fill ?? 0 : 0}
          pourTargetColor={cur?.pour ? tubeVisFor(step)[cur.tube]?.color ?? tubeVis[cur.tube]?.color ?? "#ffffff" : "#ffffff"}
          activeTube={cur?.tube ?? 0}
          pourItem={pourItem}
          zoom={zoom}
          acting={acting}
          intro={showIntro}
          introIdx={introIdx}
          onAct={onAct}
          onNav={setNav}
          onReady={setReady}
        />
      </div>

      {/* Pre-action intro: the aim of the practical, then the apparatus one by one */}
      {showIntro && brief && <PracticalIntro brief={brief} onStart={dismissIntro} onSlide={setIntroIdx} apparatus={INTRO_TAG_NAMES} />}

      {/* top bar */}
      <div data-ui className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-2.5 sm:p-4">
        <button onClick={() => { setIsQuitting(false); setShowQuit(true); }} className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur border border-white/10 transition hover:bg-black/90">
          Quit
        </button>
        <span className="rounded-full bg-black/70 px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white/90 backdrop-blur border border-white/10">Salt Analysis · Detect Pb²⁺</span>
      </div>

      {/* Quit confirmation modal */}
      {showQuit && (
        <div data-ui className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-[24rem] max-w-[92vw] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-white/30 duration-300 animate-in fade-in zoom-in-95">
            <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-dark p-5 text-primary-foreground">
              <div className="absolute -right-8 -top-8 size-28 rounded-full bg-amber-300/15 blur-2xl" />
              <div className="relative">
              <div>
                <p className="mb-0.5 text-[9px] font-black uppercase tracking-[.18em] text-[#f6c453]">Exit Lab</p>
                <h2 className="text-lg font-black leading-tight">Quit practical?</h2>
                <p className="text-xs font-medium text-white/80">Detection of Pb²⁺</p>
              </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm leading-snug text-black/70">Your progress in this simulation won&apos;t be saved. Are you sure you want to leave?</p>
              <div className="mt-5 flex gap-3">
                <button disabled={isQuitting} onClick={() => setShowQuit(false)} className="flex-1 rounded-2xl bg-black/5 px-4 py-2.5 text-sm font-black text-black/70 transition hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-50">
                  Stay
                </button>
                <button
                  disabled={isQuitting}
                  onClick={() => {
                    setIsQuitting(true);
                    exitLandscape();
                    window.setTimeout(() => { window.location.href = "/student/lab-game/chemistry?grade=XII"; }, 450);
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

      {/* Guide area — all three prompt types share one clean,
          gamified card look: Learn (Continue), Nova says (Press X), and the
          milestone result (press Spacebar / tap to continue). Hidden during the
          intro tour, which has its own controls. */}
      {!done && !showIntro && (
        <div
          data-ui
          className={`pointer-events-none absolute z-30 flex ${
            compact
              ? "inset-y-0 right-3 sm:right-6 flex flex-col justify-center items-end max-w-[min(50vw,430px)] py-4"
              : "inset-x-0 bottom-0 pb-2 sm:pb-3 justify-center px-2 sm:px-4"
          }`}
        >
          <div
            className={`flex w-full flex-col ${
              compact ? "items-end" : "items-center"
            } gap-1.5 ${
              compact
                ? "max-w-full"
                : phase === "post"
                ? "max-w-[min(94vw,620px)]"
                : "max-w-[500px]"
            }`}
          >
            {/* Pre-test briefing — introduces each important observation. */}
            {phase === "pre" && cur?.pre && (
              <div className={`pointer-events-auto relative w-full animate-in fade-in slide-in-from-bottom-2 rounded-2xl sm:rounded-3xl border border-white/25 bg-gradient-to-br from-primary via-primary to-primary-dark text-white shadow-2xl shadow-primary/35 ${compact ? "px-3 py-2.5 max-h-[64vh] overflow-y-auto" : "px-4 py-3.5 sm:px-5 sm:py-4"}`}>
                <div className="pointer-events-none absolute inset-0 rounded-2xl sm:rounded-3xl bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,.14),transparent_35%),linear-gradient(120deg,transparent_54%,rgba(255,255,255,.06))]" />
                <div className="relative z-10">
                  <span className="relative -left-0.5 mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/15 px-2 py-0.5 text-[8px] font-black uppercase tracking-[.16em] text-[#f6c453]">
                    Read first
                  </span>
                  <h2 className={`${preTitleCls} font-black leading-tight text-white break-words`}>{cur.pre.title}</h2>
                  <p className={`mt-1 ${preBodyCls} leading-relaxed text-white/85 break-words whitespace-normal`}>{cur.pre.body}</p>
                  <button onClick={dismissPre} className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white font-black uppercase tracking-wide text-primary shadow-lg shadow-black/25 transition hover:bg-white/90 active:scale-[.98] ${compact ? "mt-2 px-3 py-1.5 text-[11px]" : "mt-3 h-10 px-4 text-xs"}`}>
                    <PlayDuo size={12} /> Start Test
                  </button>
                </div>
              </div>
            )}

            {/* Nova says — Press X (or the on-screen DO button on mobile) */}
            {phase === "guide" && !acting && (
            <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/95 shadow-xl backdrop-blur">
                <div className={`${compact ? "flex items-center gap-2 p-2" : "p-3 sm:p-3.5"}`}>
                  <h2 className={`${tutorTitleCls} ${compact ? "min-w-0 flex-1" : ""} font-black leading-snug text-black break-words`}>{cur?.tutor}</h2>
                  {ready ? (
                    <div className={`${compact ? "shrink-0" : "mt-2"} inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-primary-dark px-2 py-1 shadow-md shadow-primary/30 ${compact ? "" : "sm:px-2.5 sm:py-1.5"}`}>
                      {!compact && <kbd className="grid h-4 w-4 shrink-0 place-items-center rounded bg-white text-[10px] font-black text-primary shadow">X</kbd>}
                      <span className={`font-bold text-white ${tutorSubCls}`}>{isMobile ? <>Press the <span className="mx-0.5 inline-grid h-4 w-4 shrink-0 place-items-center rounded bg-white/20 align-middle text-white"><PlayDuo size={9} /></span> button</> : <>Press X to {cur?.x}</>}</span>
                    </div>
                  ) : (
                    <div className={`${compact ? "shrink-0" : "mt-2"} inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1`}>
                      <MapPin size={11} className="shrink-0 text-primary" />
                      <span className={`font-bold text-primary ${tutorSubCls}`}>{nav}</span>
                    </div>
                  )}
                  {!compact && <div className="mt-2.5 flex gap-1">
                    {STEPS.map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${step > i ? "bg-gradient-to-r from-primary to-primary-dark" : step === i ? "bg-primary/60" : "bg-black/10"}`} />
                    ))}
                  </div>}
                </div>
              </div>
            </div>
            )}

            {/* milestone — press Spacebar / tap to continue */}
            {phase === "post" && postC && (
              <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className={`pointer-events-auto w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl ring-1 ring-white/25 ${compact ? "max-h-[62vh] overflow-y-auto" : "max-h-[46vh]"}`}>
                  <div className={`flex items-start justify-between gap-2.5 ${compact ? "p-2.5 sm:p-3" : "p-3 sm:p-3.5"}`}>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#f6c453]"><span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]" /> Result</p>
                      <h2 className={`${milestoneTitleCls} font-black leading-tight text-white break-words`}>{postC.title}</h2>
                    </div>
                    <span className="shrink-0 rounded-full border border-[#f6c453]/35 bg-[#f6c453]/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-[#f6c453]">Read carefully</span>
                  </div>
                  <div className={`border-t border-white/15 bg-black/15 ${compact ? "px-2.5 py-2" : "px-3.5 py-2.5 sm:px-4"}`}>
                    <p className={`${milestoneBodyCls} font-medium leading-relaxed text-white/95 break-words whitespace-normal`}>{postC.body}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      {postC.eq && <p className={`w-fit max-w-full rounded-lg bg-black/25 px-2 py-1 font-mono font-bold text-white break-words ${tutorSubCls}`}>{postC.eq}</p>}
                      <button onClick={dismissPost} className="ml-auto flex shrink-0 items-center gap-1.5 text-right text-[10px] sm:text-[11px] font-bold text-white/80 transition hover:text-white">
                        <span className="grid size-4 sm:size-5 place-items-center rounded-full border border-white/35 bg-white/10 text-[9px] sm:text-[10px] font-black tabular-nums text-white">{postCountdown}</span>
                        <span>{isMobile ? "Tap to continue" : "Press Spacebar to continue"}</span>
                      </button>
                    </div>
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
          <style>{`@media (max-width: 700px), (max-height: 700px) {
            .practical-summary-hero { min-height: 0; padding: 12px 16px; }
            .practical-summary-title { margin-top: 6px; font-size: 1.375rem; line-height: 1.1; }
            .practical-summary-subtitle { font-size: .6875rem; }
            .practical-summary-badges { margin-top: 8px; font-size: .5rem; }
            .practical-summary-badges span { padding: 3px 7px; }
          }`}</style>
          <div className={`relative flex max-h-[90dvh] max-w-[1600px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-white/30 ${compact ? "w-[96vw]" : "w-[80vw]"}`}>
            <div className="min-h-0 flex-1 overflow-y-auto">
            {/* Completion hero — styled as the final level-clear screen. */}
            <div className={`practical-summary-hero relative bg-gradient-to-br from-primary to-primary-dark text-white ${compact ? "px-4 py-3" : "min-h-48 px-5 pb-5 pt-5 sm:px-8 sm:pb-6 sm:pt-7"}`}>
              <div className="absolute -left-10 -top-12 size-44 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute right-0 top-0 h-full w-36 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:18px_18px]" />
              <div className="relative z-10">
                <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.16em] text-[#f6c453]">Lab Summary</p>
                <h2 className={`practical-summary-title ${compact ? "mt-1 text-lg" : "mt-2 text-2xl sm:text-3xl"} font-black leading-tight`}>Pb²⁺ confirmed!</h2>
                <p className="practical-summary-subtitle mt-1 text-xs font-semibold leading-snug text-white/80">Basic radical: lead(II) · Group I analysis complete</p>
                <div className={`practical-summary-badges ${compact ? "mt-1.5 text-[8px]" : "mt-3 text-[9px]"} flex gap-2 font-black uppercase tracking-wide text-white/85`}>
                  <span className="rounded-lg bg-white/15 px-2 py-1">4 tests logged</span>
                  <span className="rounded-lg bg-white/15 px-2 py-1">Result verified</span>
                </div>
              </div>
            </div>

            <div className={`relative z-10 ${compact ? "p-3" : "p-4 sm:p-5"}`}>
              {/* procedure recap */}
              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary"><span className="size-1.5 rounded-full bg-[#f6c453]" /> Procedure log</p>
              <ol className="mt-2 space-y-1.5">
                {PROCEDURE.map((s, i) => (
                  <li key={i} className={`flex gap-2.5 text-black/75 ${compact ? "text-xs" : "text-sm"}`}>
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-black text-white shadow-sm shadow-primary/30">{i + 1}</span>
                    <span className="leading-snug">{s}</span>
                  </li>
                ))}
              </ol>

              {/* confirmatory results — tube + equation cards */}
              <p className="mt-5 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary"><span className="size-1.5 rounded-full bg-[#f6c453]" /> Evidence collected</p>
              <div className="mt-2 space-y-2.5">
                {SUMMARY.map((r, i) => (
                  <div key={i} className={`flex items-center gap-3 rounded-2xl border border-primary/10 bg-gradient-to-r from-primary/[0.035] to-transparent ${compact ? "p-2" : "p-3"}`}>
                    <MiniTube liquid={r.liquid} ppt={r.ppt} compact={compact} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`${compact ? "text-xs" : "text-sm"} font-black text-black`}>{r.test}</p>
                        <span className={`${compact ? "max-w-[42%] text-[8px] leading-tight" : "shrink-0 text-[10px]"} rounded-full bg-primary px-2 py-0.5 font-black text-white`}>{r.inf}</span>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-black/60">{r.obs}</p>
                      {r.eq && <p className={`mt-1.5 w-fit max-w-full rounded-lg bg-black/5 px-2 py-1 font-mono font-bold text-black/80 ${compact ? "break-all text-[9px]" : "text-[11px]"}`}>{r.eq}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </div>

            <div className={`relative z-30 shrink-0 border-t border-black/5 bg-black/[0.02] ${compact ? "p-2" : "p-4"}`}>
              <div className={`${compact ? "gap-1.5" : "gap-3"} flex`}>
                <Link href="/student/practical-journals/chemistry/practical-pb" className={`flex-1 rounded-xl bg-primary text-center font-black text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark ${compact ? "px-2 py-2 text-[10px]" : "px-4 py-3 text-sm"}`}>
                  {compact ? "Open Journal" : "Open Practical Journal"}
                </Link>
                <button onClick={() => window.location.reload()} className={`inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#f6c453] font-black text-primary-dark shadow-lg shadow-amber-500/15 transition hover:bg-[#ffd56e] active:scale-[.98] ${compact ? "px-2 py-2 text-[10px]" : "px-4 py-3 text-sm"}`}><RotateCcw size={16} /> Replay</button>
                <Link href="/student/lab-game/chemistry?grade=XII" onClick={exitLandscape} className={`flex-1 rounded-xl bg-black/10 text-center font-black text-black/70 transition hover:bg-black/15 ${compact ? "px-2 py-2 text-[10px]" : "px-4 py-3 text-sm"}`}>Quit</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile on-screen controls: Action button (Bottom-Right) */}
      {isMobile && !done && !showIntro && !showQuit && phase === "guide" && !acting && (
        <div data-ui className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-end p-2.5 sm:p-3">
          {/* Action button (Play = act) */}
          <div className="pointer-events-auto flex items-end gap-2 sm:gap-3">
            <button
              aria-label="Perform Action"
              className={`flex size-11 items-center justify-center rounded-full text-white shadow-xl transition active:scale-90 ${
                ready
                  ? "bg-primary ring-2 ring-primary/50 shadow-primary/40 animate-pulse"
                  : "bg-black/60 border border-white/10 opacity-70"
              }`}
              onPointerDown={(e) => { e.preventDefault(); sendKey("keydown", "x"); setTimeout(() => sendKey("keyup", "x"), 60); }}
            >
              <PlayDuo size={18} />
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
            <Image src="/nova-tutor-thumbnail-intro.webp" alt="Nova" fill sizes="80px" className="object-cover object-top" />
          </div>
          <h2 className="text-lg font-black sm:text-xl">Detect Pb²⁺ — Virtual Lab</h2>
          <p className="mt-1 max-w-xs text-xs font-medium text-white/70">Fullscreen will start your experiment.</p>
          <button onClick={startFullscreen} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/30 transition hover:brightness-110 active:scale-95">
            <Maximize size={18} /> Start experiment
          </button>
        </div>
      )}
    </div>
  );
}
