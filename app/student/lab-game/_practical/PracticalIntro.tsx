"use client";

/**
 * Pre-practical mission briefing shown before the apparatus tour. The start
 * action still launches the existing camera tour, one item at a time.
 *
 * Content is derived from the journal feed (@/constants/practicalJournals) so
 * the intro stays in sync with what students read on the journals page.
 */

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Play } from "lucide-react";
import LogoutSVG from "@/public/svgs/LogoutSVG";
import AppLogo from "@/components/AppLogo";
import type { JournalContent } from "@/constants/practicalJournals";

export type PracticeBrief = {
  expNo?: number;
  title: string;
  object: string;
  apparatus: string[];
  theory?: string[];
};

// Split a journal "apparatus" sentence (comma-separated) into individual items.
export function splitApparatus(apparatus: string): string[] {
  return apparatus
    .split(",")
    .map((s) => s.trim().replace(/\.$/, "").replace(/\s+/g, " "))
    .filter(Boolean);
}

// Convert a journal entry into the compact brief the intro card consumes.
// Pass `fallback` to keep the intro working when no journal row exists.
export function journalToBrief(j: JournalContent | undefined, fallback?: PracticeBrief): PracticeBrief | null {
  if (!j) return fallback ?? null;
  return {
    expNo: j.expNo,
    title: j.title,
    object: j.object,
    theory: typeof j.theory === "string" ? [j.theory] : j.theory,
    apparatus: splitApparatus(j.apparatus),
  };
}

function PlayDuo({ size = 15 }: { size?: number }) {
  return (
    <span className="relative inline-flex items-center justify-center">
      <Play
        size={size}
        className="absolute translate-x-[1px] translate-y-[1px] fill-primary-dark/80 text-primary-dark/80"
      />
      <Play size={size} className="relative fill-current text-inherit" />
    </span>
  );
}

export default function PracticalIntro({
  brief,
  onStart,
  onSlide,
  apparatus,
  exitHref = "/student/lab-game/chemistry?grade=XII",
  subject = "Chemistry",
}: {
  brief: PracticeBrief;
  onStart: () => void;
  onSlide?: (i: number) => void;
  apparatus?: string[]; // scene-tag order for the tour (defaults to the journal list)
  exitHref?: string;
  subject?: string;
}) {
  useEffect(() => {
    onSlide?.(0);
  }, [onSlide]);

  const [started, setStarted] = useState(false);
  const [cur, setCur] = useState(1);
  const list = apparatus && apparatus.length > 0 ? apparatus : brief.apparatus;
  const novaImage = subject.trim().toLowerCase() === "physics"
    ? "/nova-tutor-physics-intro.webp"
    : subject.trim().toLowerCase() === "biology"
      ? "/nova-tutor-biology-intro.webp"
      : "/nova-tutor-thumbnail-intro.webp";
  const total = list.length;

  // Start the tour: hide the card and focus the first apparatus.
  const begin = useCallback(() => {
    setStarted(true);
    setCur(1);
    onSlide?.(1);
  }, [onSlide]);

  // Next: step one apparatus at a time; after the last one the button becomes
  // "Start practical" and calls onStart.
  const next = useCallback(() => {
    if (cur >= total) {
      onStart();
      return;
    }
    setCur((c) => c + 1);
    onSlide?.(cur + 1);
  }, [cur, total, onSlide, onStart]);

  const last = cur >= total;

  // Keyboard: Space / Enter starts the tour, then steps through it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.code === "Space" || e.key === " " || e.key === "Enter") && e.target === document.body) {
        e.preventDefault();
        if (!started) begin();
        else next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, begin, next]);

  return started ? (
    <div data-ui className="pointer-events-none absolute inset-0 z-[60]">
      {/* Compact tour HUD — remains readable without blocking the apparatus view. */}
      <div className="absolute inset-x-0 top-1.5 flex justify-center px-2 sm:top-3 sm:px-4 md:top-4">
        <div className="rounded-full border border-primary/50 bg-black/85 px-3 py-1 text-center text-white shadow-xl shadow-black/35 backdrop-blur-md sm:px-4 sm:py-1.5 md:px-5 md:py-2">
          <div className="flex items-center justify-center text-[9.5px] font-bold uppercase tracking-wider text-[#d6a83f] sm:text-xs md:text-sm">
            Apparatus we need in this experiment · {cur}/{total}
          </div>
        </div>
      </div>
      <div className="pointer-events-auto absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex h-11 items-center rounded-2xl border border-white/35 bg-black/75 px-4 text-sm font-bold text-white shadow-xl backdrop-blur-md transition hover:bg-black/90 active:scale-95"
        >
          Skip tour
        </button>
      </div>
      {/* bottom-right — Next / Start practical button that steps the camera tour */}
      <div className="pointer-events-auto absolute bottom-4 right-4 self-end sm:bottom-6 sm:right-6">
        <button
          onClick={next}
          className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-2xl px-4 text-sm font-black text-white shadow-xl transition active:scale-95 ${
            last ? "bg-primary shadow-primary/30" : "bg-primary hover:bg-primary-dark"
          }`}
        >
          {last ? (
            <>
              <PlayDuo size={14} /> Start practical
            </>
          ) : (
            <>
              Next <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  ) : (
    <div data-ui className="absolute inset-0 z-[60] isolate overflow-y-auto bg-primary-dark text-white">
      <style>{`
        .practical-intro-mobile-badge { display: none; }
        .practical-intro-lab-wall { -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 18%); mask-image: linear-gradient(to bottom, transparent 0%, #000 18%); }
        @media (max-width: 699px) {
          .practical-intro-lab-badge { display: none; }
          .practical-intro-mobile-badge { display: inline-flex; top: .25rem; left: 50vw; margin-top: 1.25rem; transform: translateX(-50%); }
          .practical-intro-lab-horizon { display: none; }
          .practical-intro-steps { display: flex; gap-x: .5rem; border-top: 0; padding-top: .65rem; }
        }
        @media (max-height: 620px) and (orientation: landscape) {
          .practical-intro-shell { padding: 1.25rem 3.5rem; }
          .practical-intro-header { min-height: 2.5rem; }
          .practical-intro-main { grid-template-columns: minmax(0, 1.2fr) minmax(0, .8fr); padding-block: .1rem; }
          .practical-intro-lab-badge { display: none; }
          .practical-intro-mobile-badge { display: inline-flex; top: .25rem; left: 50vw; margin-top: 1.25rem; transform: translateX(-50%); }
          .practical-intro-practice { font-size: .7rem; line-height: 1; letter-spacing: .18em; }
          .practical-intro-title { font-size: clamp(1.6rem, 6.7vh, 3rem); }
          .practical-intro-objective { margin-top: .65rem; padding: .7rem .85rem; }
          .practical-intro-objective-title { font-size: clamp(.95rem, 3.5vh, 1.3rem); }
          .practical-intro-objective-body { font-size: .75rem; line-height: 1.35; }
          .practical-intro-start { min-height: 2.6rem; margin-top: 1.1rem; }
          .practical-intro-steps { display: flex; gap-x: .5rem; border-top: 0; padding-top: .65rem; }
          .practical-intro-brand { height: 4rem; width: 10rem; }
          .practical-intro-art { right: -2rem; bottom: .25rem; height: 96vh; width: 64%; }
          .practical-intro-guide { top: 58%; right: 8%; bottom: auto; left: auto; }
          .practical-intro-lab-horizon { display: none; }
        }
      `}</style>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-primary-dark" />
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 78% 46%, color-mix(in srgb, var(--color-primary-light) 48%, transparent), transparent 37%), radial-gradient(circle at 8% 100%, color-mix(in srgb, var(--color-primary) 27%, transparent), transparent 38%), linear-gradient(130deg, color-mix(in srgb, var(--color-primary-dark) 60%, #071b19), var(--color-primary-dark) 55%, #071b19)" }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[.12] [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:44px_44px] [background-position:0_22px]" />
      <div aria-hidden className="practical-intro-lab pointer-events-none absolute inset-y-0 right-0 hidden w-[82%] min-[700px]:block">
        <div className="practical-intro-lab-wall absolute inset-x-0 top-0 h-[78%] bg-[radial-gradient(circle_at_72%_30%,rgba(20,130,54,.25),transparent_48%),linear-gradient(90deg,transparent_0%,rgba(8,75,20,.18)_16%,rgba(2,58,14,.45)_100%)]" />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[#d6a83f]/25" />

      <div className="practical-intro-shell relative z-10 mx-auto flex min-h-full max-w-[1320px] flex-col px-5 py-5 sm:px-7 sm:py-6 lg:px-12">
        <header className="practical-intro-header relative flex min-h-12 items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <AppLogo variant="dark" priority className="practical-intro-brand h-[4.5rem] w-36 sm:h-20 sm:w-48" />
          </div>
          <div className="practical-intro-mobile-badge mt-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-amber-300/70 bg-[#3c301a]/85 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-100 shadow-md backdrop-blur-md sm:text-xs">
            {subject} Virtual Lab
          </div>
          <div className="flex items-center gap-2">
            <div className="relative size-11 overflow-hidden rounded-full border border-[#e7cb84]/50 bg-primary min-[700px]:hidden" aria-label="Nova, your lab guide" role="img">
              <Image src={novaImage} alt="" fill priority sizes="44px" className="object-cover object-top" />
            </div>
            <Link href={exitHref} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-primary/20 bg-white px-3 text-xs font-bold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-4 sm:text-sm">
              <LogoutSVG className="size-4 text-primary" /> Exit lab
            </Link>
          </div>
        </header>

        <main className="practical-intro-main grid flex-1 items-center gap-3 py-8 min-[700px]:grid-cols-2 min-[700px]:gap-5 lg:py-12">
          <section className="practical-intro-copy relative z-20 min-w-0 max-w-[680px]">
            <div className="practical-intro-lab-badge mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-[#3c301a]/85 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-100 shadow-md backdrop-blur-md sm:mb-6 sm:text-xs">
              {subject} Virtual Lab
            </div>
            <p className="practical-intro-practice text-sm font-black uppercase tracking-[.22em] text-white/70 sm:text-base">Let&apos;s Practice</p>
            <h1 className="practical-intro-title mt-2 max-w-[12ch] text-[clamp(2.25rem,8vw,5.4rem)] font-black leading-[.98] tracking-[-.05em] text-white">
              {brief.expNo ? `Practical No. ${brief.expNo}` : "Lab mission"}
            </h1>
            <div className="practical-intro-objective mt-6 rounded-2xl border border-white/20 bg-black/25 p-4 shadow-[0_18px_45px_rgba(0,0,0,.13)] sm:mt-8 sm:p-6">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-[#e6bd63] sm:text-xs">
                <span className="inline-block size-1.5 rounded-full bg-[#d6a83f]" /> Your objective
              </p>
              <h2 className="practical-intro-objective-title mt-2 text-lg font-extrabold leading-tight text-white sm:text-2xl">{brief.title}</h2>
              <p className="practical-intro-objective-body mt-2 text-sm leading-relaxed text-white/80 sm:text-base">{brief.object}</p>
            </div>
            <button
              onClick={begin}
              className="practical-intro-start mt-5 inline-flex min-h-13 sm:min-h-14 w-fit min-w-[200px] items-center justify-center gap-3 rounded-full border border-amber-300/80 bg-gradient-to-r from-[#4a3a1f] via-[#382b16] to-[#4a3a1f] px-6 sm:px-8 text-sm sm:text-base font-bold tracking-wide text-amber-100 shadow-[0_10px_25px_rgba(0,0,0,0.35),0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-300/30 transition-all duration-200 hover:border-amber-200 hover:from-[#5a4726] hover:to-[#5a4726] hover:text-white hover:shadow-[0_12px_30px_rgba(0,0,0,0.45),0_0_22px_rgba(245,158,11,0.4)] hover:scale-[1.02] active:scale-[.98] cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Play size={16} className="fill-amber-300 text-amber-300" /> Start Game
              </span>
            </button>
          </section>

          <div className="practical-intro-art pointer-events-none absolute bottom-2 right-0 hidden h-[90dvh] w-[48%] min-[700px]:block" aria-hidden>
            <Image src={novaImage} alt="" fill priority sizes="(max-width: 1000px) 48vw, 700px" className="object-contain object-center drop-shadow-[0_24px_22px_rgba(0,0,0,.34)]" />
            <div className="practical-intro-guide absolute bottom-[5%] left-[2%] rounded-xl border border-white/20 bg-primary-dark px-4 py-2 shadow-lg">
              <p className="text-[10px] font-black uppercase tracking-[.17em] text-[#e6bd63]">Nova</p>
              <p className="text-xs font-semibold text-white">Your lab guide</p>
            </div>
          </div>
        </main>

        <footer className="practical-intro-steps flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/15 pt-4 text-[10px] font-black uppercase tracking-[.14em] text-white/55 sm:gap-x-8 sm:text-xs">
          <span className="text-[#d6a83f]">01 <span className="ml-1 text-white">Briefing</span></span>
          {subject === "Biology" ? (
            <>
              <span>02 <span className="ml-1 text-white/80">Explore Specimen & Apparatus</span></span>
              <span>03 <span className="ml-1 text-white/80">Observation & Challenge</span></span>
            </>
          ) : (
            <>
              <span>02 <span className="ml-1">Explore apparatus</span></span>
              <span>03 <span className="ml-1">Run experiment</span></span>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
