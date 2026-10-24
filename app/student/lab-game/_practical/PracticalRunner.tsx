"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { MapPin, Sparkles, Maximize, Play, LoaderCircle, RotateCcw } from "lucide-react";
import { getPracticalJournal } from "@/constants/practicalJournals";
import PracticalIntro, { journalToBrief } from "./PracticalIntro";
import { POUR_ACTION_MS } from "./pourMotion";
import type { TubeVis, Reagent } from "./PracticalScene";
import { introTagsFor } from "./PracticalScene";

const PracticalScene = dynamic(() => import("./PracticalScene"), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">Loading lab…</div>,
});

const POST_AUTO_CONTINUE_SECONDS = 14;

export type { TubeVis, Reagent };

export type Step = {
  tutor: string;
  x: string; // the action shown as "Press X to <x>"
  item: string | null;
  tube: number;
  pour?: string;
  dropCount?: number; // override when the guide calls for a specific number of drops
  zoom?: boolean;
  anim?: "shake"; // play the shake animation on this step (spoon plays automatically when item === "salt")
  heat?: boolean; // heat the tube on the Bunsen burner during this step
  deliver?: { from: number; to: number }; // gas-delivery step: pipe gas from tube `from` into tube `to`
  pre?: { title: string; body: string };
  post?: { title: string; body: string; eq?: string };
};

export type SummaryRow = { test: string; obs: string; inf: string; eq: string; liquid: string; ppt: string };

export type PracticalConfig = {
  title: string; // e.g. "Detect Fe²⁺"
  kicker?: string; // header prefix; defaults to "Salt Analysis" for salt practicals, none otherwise
  ionLabel: string; // e.g. "Fe²⁺"
  radical: string; // e.g. "iron(II)"
  group: string; // e.g. "Group III"
  grade?: "IX" | "X" | "XI" | "XII";
  reagents: Reagent[];
  steps: Step[];
  tubeVis: (step: number) => TubeVis[];
  summary: SummaryRow[];
  procedure: string[];
};

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

export default function PracticalRunner({ config }: { config: PracticalConfig }) {
  const STEPS = config.steps;
  const DONE = STEPS.length;
  const grade = config.grade ?? "XII";
  const exitHref = `/student/lab-game/chemistry?grade=${grade}`;
  // Only salt-analysis practicals put a salt jar on the bench and use the
  // "Salt Analysis" kicker. Organic / biochemistry practicals do neither.
  const usesSalt = STEPS.some((s) => s.item === "salt" || s.pour === "salt");
  const kicker = config.kicker ?? (usesSalt ? "Salt Analysis" : null);
  // The labelled apparatus list the intro tour flies between — stand, salt jar
  // (if any), reagent beakers, then the burner / gas rig when the steps use them.
  const hasHeat = STEPS.some((s) => s.heat);
  const hasDeliver = STEPS.some((s) => s.deliver);
  const introDeliver = STEPS.find((s) => s.deliver)?.deliver ?? null;
  const introTags = useMemo(() => introTagsFor({ reagents: config.reagents, showSalt: usesSalt, hasHeat, hasDeliver }), [config, usesSalt, hasHeat, hasDeliver]);

  // Pre-action intro: find this practical's journal entry from the current route
  // (e.g. /student/lab-game/practical-ba → "practical-ba") and walk the student
  // through the aim + apparatus before any step is asked of them.
  const pathname = usePathname();
  const id = (pathname ?? "").split("/").filter(Boolean).pop() ?? "";
  const brief = useMemo(() => {
    if (!id) return null;
    return journalToBrief(getPracticalJournal(id, "chemistry", grade));
  }, [id, grade]);

  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"pre" | "guide" | "post">(STEPS[0]?.pre ? "pre" : "guide");
  const [pourItem, setPourItem] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [nav, setNav] = useState("Move forward to the bench");
  const [ready, setReady] = useState(false);
  const [showQuit, setShowQuit] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);
  const [started, setStarted] = useState(false);
  const [introOpen, setIntroOpen] = useState(true);
  const [introIdx, setIntroIdx] = useState(0);
  const [postCountdown, setPostCountdown] = useState(POST_AUTO_CONTINUE_SECONDS);

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
      // Android only permits the orientation lock after fullscreen has begun.
      // Yield one frame so Chromium has applied that state before locking.
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
  const guidedDropCount = cur?.dropCount ?? Number(cur?.tutor.match(/\b(\d+)\s*(?:[–-]\s*\d+)?\s*drops?\b/i)?.[1] ?? 3);
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
  const tubeVis = useMemo(() => config.tubeVis(visStep), [visStep, config]);

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
    if (cur.zoom || cur.heat) setZoom(true);
    const anim = cur.heat ? 7000 : cur.item === "salt" ? 1700 : cur.anim === "shake" ? 1400 : 0;
    const delay = Math.max(anim, cur.pour ? POUR_ACTION_MS : cur.zoom ? 2300 : 450);
    window.setTimeout(() => {
      if (cur.pour) setPourItem(null);
      setActing(false);
      if (cur.post) {
        setZoom(true);
        setPhase("post");
      } else goNext();
    }, delay);
  }, [phase, cur, step, goNext, introOpen]);

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

  // A gas-delivery step needs no key press: once the apparatus is in place the gas
  // passes automatically — zoom in and run the result.
  useEffect(() => {
    if (phase === "guide" && cur?.deliver) {
      setZoom(true);
      const id = window.setTimeout(() => onAct(), 2200);
      return () => window.clearTimeout(id);
    }
  }, [phase, cur, onAct]);

  const lastPost = useRef<{ title: string; body: string; eq?: string } | null>(null);
  if (phase === "post" && cur?.post) lastPost.current = cur.post;
  const postC = cur?.post ?? lastPost.current;
  const wideResult = (postC?.body.length ?? 0) > 80 || (postC?.eq?.length ?? 0) > 65;

  const dismissPre = () => setPhase("guide");
  const dismissPost = () => goNext();

  // Which action animation should play while `acting`: the spoon for the salt step,
  // the shake for a step flagged anim:"shake". Everything else is a beaker pour.
  const actionAnim: "spoon" | "shake" | null = !acting || !cur ? null : cur.item === "salt" ? "spoon" : cur.anim === "shake" ? "shake" : null;

  // Once the gas has been passed, the source tube keeps its cork for the rest of
  // the practical (the delivery apparatus itself shows only during the gas step).
  const deliverIdx = STEPS.findIndex((s) => s.deliver);
  const cappedTubes = deliverIdx >= 0 && step > deliverIdx && STEPS[deliverIdx].deliver ? [STEPS[deliverIdx].deliver!.from] : [];

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
        <PracticalScene
          step={step}
          tubeVis={tubeVis}
          pourTargetFill={cur?.pour ? config.tubeVis(step)[cur.tube]?.fill ?? 0 : 0}
          pourTargetColor={cur?.pour ? config.tubeVis(step)[cur.tube]?.color ?? tubeVis[cur.tube]?.color ?? "#ffffff" : "#ffffff"}
          activeTube={cur?.tube ?? 0}
          pourItem={pourItem}
          dropCount={guidedDropCount}
          reagents={config.reagents}
          zoom={zoom}
          acting={acting}
          actionAnim={actionAnim}
          deliver={cur?.deliver ?? null}
          introDeliver={introDeliver}
          cappedTubes={cappedTubes}
          heating={acting && !!cur?.heat}
          showSalt={usesSalt}
          intro={showIntro}
          introIdx={introIdx}
          introTags={introTags}
          onAct={onAct}
          onNav={setNav}
          onReady={setReady}
        />
      </div>

      {/* Pre-action intro: the aim of the practical, then the apparatus one by one.
          `apparatus` = the scene's tagged objects (in tour order), so the intro HUD
          and the in-scene numbered badges always align. */}
      {showIntro && brief && (
        <PracticalIntro brief={brief} onStart={dismissIntro} onSlide={setIntroIdx} apparatus={introTags.map((t) => t.name)} />
      )}

      {/* Top bar */}
      <div data-ui className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-2.5 sm:p-4">
        <button onClick={() => setShowQuit(true)} className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur border border-white/10 transition hover:bg-black/90">
          Quit
        </button>
        <span className="rounded-full bg-black/70 px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white/90 backdrop-blur border border-white/10">
          {kicker ? `${kicker} · ` : ""}{config.title}
        </span>
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
                <p className="text-xs font-medium text-white/80">Detection of {config.ionLabel}</p>
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
                    window.setTimeout(() => { window.location.href = exitHref; }, 450);
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
                  <span className="relative -left-0.5 mb-1 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/15 px-2 py-0.5 text-[8px] font-black uppercase tracking-[.16em] text-[#f6c453]">
                    Read first
                  </span>
                  <h2 className={`${preTitleCls} font-black leading-tight text-white break-words`}>{cur.pre.title}</h2>
                  <p className={`mt-1 ${preBodyCls} leading-relaxed text-white/85 break-words whitespace-normal`}>{cur.pre.body}</p>
                  <button
                    onClick={dismissPre}
                    className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white font-black uppercase tracking-wide text-primary shadow-lg shadow-black/25 transition hover:bg-white/90 active:scale-[0.98] ${compact ? "mt-2 px-3 py-1.5 text-[11px]" : "mt-3 px-4 py-2 text-xs"}`}
                  >
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
                    {cur?.deliver ? (
                      <div className={`${compact ? "shrink-0" : "mt-2"} inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2 py-1`}>
                        <Sparkles size={12} className="shrink-0 text-primary" />
                        <span className={`font-bold text-primary ${tutorSubCls}`}>Passing the gas through — watch the lime water…</span>
                      </div>
                    ) : ready ? (
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
                <h2 className={`practical-summary-title ${compact ? "mt-1 text-lg" : "mt-2 text-2xl sm:text-3xl"} font-black leading-tight`}>{config.title} confirmed!</h2>
                <p className="practical-summary-subtitle mt-1 text-xs font-semibold leading-snug text-white/80">Basic radical: {config.radical} · {config.group} analysis complete</p>
              </div>
            </div>

            <div className={`relative z-10 ${compact ? "p-3" : "p-4 sm:p-5"}`}>
              {/* procedure recap */}
              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary"><span className="size-1.5 rounded-full bg-[#f6c453]" /> Procedure log</p>
              <ol className="mt-2 space-y-1.5">
                {config.procedure.map((s, i) => (
                  <li key={i} className={`flex gap-2.5 text-black/75 ${compact ? "text-xs" : "text-sm"}`}>
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-black text-white shadow-sm shadow-primary/30">{i + 1}</span>
                    <span className="leading-snug">{s}</span>
                  </li>
                ))}
              </ol>

              {/* confirmatory results — tube + equation cards */}
              <p className="mt-5 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary"><span className="size-1.5 rounded-full bg-[#f6c453]" /> Evidence collected</p>
              <div className="mt-2 space-y-2.5">
                {config.summary.map((r, i) => (
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
                <Link href={`/student/practical-journals/chemistry/${id}`} className={`flex-1 rounded-xl bg-primary text-center font-black text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark ${compact ? "px-2 py-2 text-[10px]" : "px-4 py-3 text-sm"}`}>
                  {compact ? "Open Journal" : "Open Practical Journal"}
                </Link>
                <button onClick={() => window.location.reload()} className={`inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#f6c453] font-black text-primary-dark shadow-lg shadow-amber-500/15 transition hover:bg-[#ffd56e] active:scale-[.98] ${compact ? "px-2 py-2 text-[10px]" : "px-4 py-3 text-sm"}`}>
                  <RotateCcw size={16} /> Replay
                </button>
                <Link href={exitHref} onClick={exitLandscape} className={`flex-1 rounded-xl bg-black/10 text-center font-black text-black/70 transition hover:bg-black/15 ${compact ? "px-2 py-2 text-[10px]" : "px-4 py-3 text-sm"}`}>Quit</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile on-screen controls: Action button (Bottom-Right) */}
      {isMobile && !done && !showIntro && !showQuit && phase === "guide" && !acting && !cur?.deliver && (
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

      {/* Fullscreen start requests landscape automatically. Keep this fallback out
          of the student flow; unsupported browsers continue with the responsive lab. */}
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
          <h2 className="text-lg font-black sm:text-xl">{config.title} — Virtual Lab</h2>
          <p className="mt-1 max-w-xs text-xs font-medium text-white/70">Fullscreen will start your experiment.</p>
          <button onClick={startFullscreen} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/30 transition hover:brightness-110 active:scale-95">
            <Maximize size={18} /> Start experiment
          </button>
        </div>
      )}
    </div>
  );
}
