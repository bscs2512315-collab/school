"use client";

import { useState, Fragment } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/constants";
import {
  useLandingThemeShots,
  type LandingShotName,
} from "@/components/landing/useLandingThemeShots";
import { LaptopMockup, MobileMockup } from "@/components/landing/LaptopMockup";

import { ScrollReveal } from "@/components/landing/ScrollReveal";

const SHOWCASE_TABS: Array<{
  id: LandingShotName;
  label: string;
  title: string;
  description: string;
}> = [
  {
    id: "past-papers",
    label: "Past Papers",
    title: "Real board papers, ready to attempt",
    description: "Browse by classic search or yearly flow. Start Paper I MCQs in one tap.",
  },
  {
    id: "nova",
    label: "Nova AI",
    title: "A tutor that never clocks out",
    description: "Ask Nova about concepts, marking schemes, and weak topics — anytime.",
  },
  {
    id: "leaderboard",
    label: "Leaderboard",
    title: "Compete with your city and country",
    description: "Climb ranks, track peers, and stay motivated with live standings.",
  },
  {
    id: "generate",
    label: "Generate",
    title: "Custom papers from your syllabus",
    description: "Pick chapters and generate focused practice when you need it most.",
  },
  {
    id: "history",
    label: "History",
    title: "Every attempt, saved and reviewable",
    description: "Revisit scores, feedback, and progress so improvement stays visible.",
  },
];

export function PortalShowcase() {
  const { isDark, shotPair, mobileShotPair } = useLandingThemeShots();
  const [activeId, setActiveId] = useState<LandingShotName>("past-papers");
  const active = SHOWCASE_TABS.find((tab) => tab.id === activeId) ?? SHOWCASE_TABS[0];

  return (
    <section id="product" className="relative scroll-mt-28 overflow-hidden bg-background px-4 py-12 sm:scroll-mt-32 sm:px-6 sm:py-16 md:py-20">
      <div className="landing-pulse-glow pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--color-primary)_12%,transparent),transparent_60%)]" />

      <div className="relative mx-auto max-w-7xl">
        <ScrollReveal animation="fade-up" className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary dark:text-logo-green">
            Inside {APP_NAME}
          </p>
          <h2 className="text-4xl font-black tracking-[-0.055em] text-foreground sm:text-5xl lg:text-6xl">
            Peek inside your{" "}
            <span className="relative inline-block whitespace-nowrap text-primary dark:text-logo-green pb-1 sm:pb-1.5">
              prep era.
              <span
                aria-hidden
                className="absolute bottom-0 left-0 h-1.5 sm:h-2 w-full rounded-full bg-amber-400 shadow-xs shadow-amber-400/30"
              />
            </span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            A look at the tools you’ll actually use to practice, improve, and celebrate your progress.
          </p>
        </ScrollReveal>

        <ScrollReveal animation="fade-up" delay={150} className="-mx-4 mt-10 flex items-center gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0 no-scrollbar">
          {SHOWCASE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveId(tab.id)}
              aria-pressed={activeId === tab.id}
              className={cn(
                "shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition-all duration-300 transform active:scale-95 cursor-pointer",
                {
                  "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105":
                    activeId === tab.id,
                  "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-102":
                    activeId !== tab.id,
                },
              )}
            >
              {tab.label}
            </button>
          ))}
        </ScrollReveal>

        <div key={active.id} className="mt-7 text-center landing-fade-up">
          <h3 className="text-xl font-bold text-foreground sm:text-2xl transition-all duration-300">{active.title}</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            {active.description}
          </p>
        </div>

        <ScrollReveal animation="scale-up" delay={250} className="relative mx-auto mt-10 max-w-5xl">
          {/* Ambient studio lighting with gentle pulse */}
          <div className="landing-pulse-glow pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-tr from-primary/20 via-emerald-500/15 to-teal-400/20 blur-3xl opacity-75 dark:opacity-45" />
          
          {/* MacBook Pro Mockup with Overlapping Mobile Device */}
          <div className="relative">
            <LaptopMockup float={false}>
              {SHOWCASE_TABS.map((tab) => {
                const isSelected = tab.id === activeId;
                const pair = shotPair(tab.id);
                return (
                  <Fragment key={tab.id}>
                    <Image
                      src={pair.light}
                      alt={`${APP_NAME} ${tab.label}`}
                      fill
                      priority={tab.id === "past-papers"}
                      quality={90}
                      className={cn(
                        "object-cover object-top transition-all duration-500 ease-in-out",
                        isSelected && !isDark
                          ? "opacity-100 scale-100 z-10"
                          : "opacity-0 scale-[0.99] pointer-events-none z-0"
                      )}
                      sizes="(max-width: 1024px) 100vw, 1000px"
                    />
                    <Image
                      src={pair.dark}
                      alt={`${APP_NAME} ${tab.label} dark`}
                      fill
                      priority={tab.id === "past-papers"}
                      quality={90}
                      className={cn(
                        "object-cover object-top transition-all duration-500 ease-in-out",
                        isSelected && isDark
                          ? "opacity-100 scale-100 z-10"
                          : "opacity-0 scale-[0.99] pointer-events-none z-0"
                      )}
                      sizes="(max-width: 1024px) 100vw, 1000px"
                    />
                  </Fragment>
                );
              })}
            </LaptopMockup>

            {/* Overlapping Mobile Device Mockup for Section Mobile View */}
            <div className="absolute -bottom-3 right-1 sm:-bottom-5 sm:right-3 md:-bottom-6 md:right-4 z-20">
              <MobileMockup float={true}>
                {SHOWCASE_TABS.map((tab) => {
                  const isSelected = tab.id === activeId;
                  const mobilePair = mobileShotPair(tab.id);
                  return (
                    <Fragment key={`mobile-${tab.id}`}>
                      <Image
                        src={mobilePair.light}
                        alt={`${APP_NAME} ${tab.label} mobile view`}
                        fill
                        priority={tab.id === "past-papers"}
                        quality={90}
                        className={cn(
                          "object-cover object-top transition-all duration-500 ease-in-out",
                          isSelected && !isDark
                            ? "opacity-100 scale-100 z-10"
                            : "opacity-0 scale-[0.99] pointer-events-none z-0"
                        )}
                        sizes="(max-width: 640px) 120px, 185px"
                      />
                      <Image
                        src={mobilePair.dark}
                        alt={`${APP_NAME} ${tab.label} mobile view dark`}
                        fill
                        priority={tab.id === "past-papers"}
                        quality={90}
                        className={cn(
                          "object-cover object-top transition-all duration-500 ease-in-out",
                          isSelected && isDark
                            ? "opacity-100 scale-100 z-10"
                            : "opacity-0 scale-[0.99] pointer-events-none z-0"
                        )}
                        sizes="(max-width: 640px) 120px, 185px"
                      />
                    </Fragment>
                  );
                })}
              </MobileMockup>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
