"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { useLandingThemeShots } from "@/components/landing/useLandingThemeShots";
import { HeroInstallButton } from "@/components/landing/HeroInstallButton";
import { LaptopMockup, MobileMockup } from "@/components/landing/LaptopMockup";

import { cn } from "@/lib/utils";

const ROTATING_PHRASES = [
  "AKUEB & Sindh Board.",
  "Classes IX–XII.",
  "Solved Past Papers.",
  "MCQs, CRQs & ERQs.",
  "Science Practicals.",
  "Board Exam Toppers.",
  "Top Scores & Ranks.",
] as const;

export function Hero() {
  const { isDark } = useLandingThemeShots();
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % ROTATING_PHRASES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="hero" className="relative isolate overflow-hidden px-4 pb-14 pt-36 xs:pt-40 sm:px-6 sm:pb-24 sm:pt-40 lg:pt-44 w-full max-w-full">
      <div className="landing-grid-fade pointer-events-none absolute inset-0 -z-10" />
      <div className="landing-pulse-glow pointer-events-none absolute -right-32 top-28 -z-10 size-96 rounded-full bg-amber-400/20 blur-3xl dark:bg-amber-400/10" />
      <div className="landing-pulse-glow pointer-events-none absolute -left-32 bottom-10 -z-10 size-80 rounded-full bg-primary/15 blur-3xl dark:bg-emerald-500/10" style={{ animationDelay: "-2s" }} />
      <div className="mx-auto grid max-w-7xl items-center gap-10 sm:gap-12 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)] lg:gap-8 xl:gap-14">
        <div className="relative z-10 w-full min-w-0 text-center lg:text-left mt-2 xs:mt-4 sm:mt-0">
          <h1 className="landing-fade-up landing-delay-1 text-[clamp(1.85rem,4.8vw,2.6rem)] sm:text-[clamp(2.1rem,4.5vw,3rem)] lg:text-[clamp(2.15rem,3.15vw,3.65rem)] font-black leading-[1.08] tracking-[-0.04em] text-foreground">
            Ace your board exams. <br className="hidden sm:inline" />
            The smartest AI prep for<br />
            <span className="relative inline-flex items-center overflow-hidden py-0.5 whitespace-nowrap min-h-[1.25em] max-w-full align-bottom">
              <span
                key={ROTATING_PHRASES[phraseIndex]}
                className="landing-audience whitespace-nowrap text-primary dark:text-logo-green font-black"
              >
                {ROTATING_PHRASES[phraseIndex]}
              </span>
              <span aria-hidden className="absolute bottom-0 left-0 h-1.5 sm:h-2 w-full rounded-full bg-amber-400 shadow-xs shadow-amber-400/30 transition-all duration-300" />
            </span>
          </h1>
          <p className="landing-fade-up landing-delay-2 mx-auto mt-4 sm:mt-6 max-w-xl text-sm xs:text-base sm:text-lg lg:text-xl font-medium leading-snug sm:leading-relaxed text-muted-foreground lg:mx-0">
            Past papers, instant feedback, Nova AI, and friendly competition. Everything you need to feel ready for your next board exam.
          </p>
          <div className="landing-fade-up landing-delay-3 mt-6 sm:mt-8 flex items-center justify-center gap-2.5 xs:gap-3 sm:gap-4 lg:justify-start">
            <Link
              href={FRONTEND_ROUTES.REGISTER}
              className="landing-shimmer-sweep group uppercase inline-flex min-h-12 sm:min-h-14 flex-1 sm:flex-initial items-center justify-center gap-2 rounded-2xl bg-primary px-4 xs:px-6 sm:px-7 text-xs xs:text-sm sm:text-base font-extrabold text-primary-foreground shadow-[0_14px_32px_-14px_var(--color-primary)] transition-all hover:-translate-y-0.5 active:scale-[0.98] whitespace-nowrap"
            >
              Sign Up
            </Link>
            <HeroInstallButton />
          </div>
          <div className="landing-fade-up landing-delay-4 mt-5 sm:mt-7 flex items-center justify-center gap-x-2 xs:gap-x-3 sm:gap-x-4 text-[9.5px] xs:text-[11px] sm:text-xs md:text-sm font-semibold text-muted-foreground lg:justify-start whitespace-nowrap overflow-x-auto no-scrollbar py-0.5">
            <span className="inline-flex items-center gap-1 xs:gap-1.5 shrink-0">
              <span className="size-1.5 sm:size-2 rounded-full bg-amber-400 shrink-0" /> AKUEB + Sindh Board
            </span>
            <span className="inline-flex items-center gap-1 xs:gap-1.5 shrink-0">
              <span className="size-1.5 sm:size-2 rounded-full bg-amber-400 shrink-0" /> Classes IX–XII
            </span>
            <span className="inline-flex items-center gap-1 xs:gap-1.5 shrink-0">
              <span className="size-1.5 sm:size-2 rounded-full bg-amber-400 shrink-0" /> Free for a limited time
            </span>
          </div>
        </div>

        <div className="landing-fade-up landing-delay-2 relative mx-auto w-full min-w-0 max-w-[650px] lg:max-w-none">
          <div className="landing-pulse-glow absolute -inset-4 rounded-[3rem] bg-linear-to-tr from-amber-400/25 via-primary/10 to-emerald-300/20 blur-2xl" />

          {/* Floating Pill Accent 1: Top Left */}
          <div className="landing-float-slow absolute -top-4 -left-2 sm:-top-6 sm:-left-4 z-30 hidden xs:flex items-center gap-2 rounded-2xl border border-primary/20 bg-card/90 px-3.5 py-2 text-xs font-bold text-foreground shadow-lg backdrop-blur-md">
            <span className="flex size-6 items-center justify-center rounded-lg bg-amber-400/20 text-amber-500 font-black">
              ★
            </span>
            <div>
              <p className="text-[11px] font-black leading-none text-foreground">Top Rank #1</p>
              <p className="text-[9.5px] font-medium text-muted-foreground">AKUEB 2024 Prep</p>
            </div>
          </div>


          {/* MacBook Pro Space Black Mockup */}
          <div className="relative">
            <LaptopMockup float={false}>
              <Image
                src="/landing/student-dashboard.webp"
                alt="ExBoard AI student dashboard preview"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 850px"
                quality={90}
                className={cn(
                  "object-cover object-top transition-opacity duration-500 ease-in-out",
                  isDark ? "opacity-0 pointer-events-none" : "opacity-100"
                )}
              />
              <Image
                src="/landing/student-dashboard-dark-v2.webp"
                alt="ExBoard AI student dashboard preview dark"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 850px"
                quality={90}
                className={cn(
                  "object-cover object-top transition-opacity duration-500 ease-in-out",
                  isDark ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
              />
            </LaptopMockup>

            {/* Overlapping Mobile Device Mockup */}
            <div className="absolute -bottom-3 right-0 sm:-bottom-5 sm:right-2 md:-bottom-6 md:right-0 z-20">
              <MobileMockup float={true}>
                <Image
                  src="/landing/mobile-dashboard.webp"
                  alt="ExBoard AI mobile student dashboard"
                  fill
                  priority
                  sizes="(max-width: 640px) 120px, 195px"
                  quality={90}
                  className={cn(
                    "object-cover object-top transition-opacity duration-500 ease-in-out",
                    isDark ? "opacity-0 pointer-events-none" : "opacity-100"
                  )}
                />
                <Image
                  src="/landing/mobile-dashboard-dark.webp"
                  alt="ExBoard AI mobile student dashboard dark"
                  fill
                  priority
                  sizes="(max-width: 640px) 120px, 195px"
                  quality={90}
                  className={cn(
                    "object-cover object-top transition-opacity duration-500 ease-in-out",
                    isDark ? "opacity-100" : "opacity-0 pointer-events-none"
                  )}
                />
              </MobileMockup>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
