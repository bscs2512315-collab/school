"use client";

import Image from "next/image";
import ArrowUpRightSVG from "@/public/svgs/ArrowUpRightSVG";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import NovaSVG from "@/public/svgs/NovaSVG";
import LabGameSVG from "@/public/svgs/LabGameSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import ChallengeSVG from "@/public/svgs/ChallengeSVG";
import TrophySVG from "@/public/svgs/TrophySVG";
import SyllabusSVG from "@/public/svgs/SyllabusSVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import ZapSVG from "@/public/svgs/ZapSVG";
import PracticalJournalSVG from "@/public/svgs/PracticalJournalSVG";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

const EXTRA_PERKS = [
  {
    icon: LabGameSVG,
    label: "Interactive labs",
    bg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: BookOpenSVG,
    label: "Solved notes",
    bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  {
    icon: TrophySVG,
    label: "Progress tracking",
    bg: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  },
  {
    icon: SyllabusSVG,
    label: "SLO syllabus maps",
    bg: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  },
  {
    icon: SparklesSVG,
    label: "Instant AI grading",
    bg: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
  {
    icon: ZapSVG,
    label: "1v1 arena battles",
    bg: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  },
  {
    icon: PracticalJournalSVG,
    label: "Practical journals",
    bg: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
  },
] as const;

const MINI_FEATURES = [
  {
    icon: NovaSVG,
    title: "Smart practice",
    description: "Generate targeted papers around specific chapters you want to master.",
    badge: "✦ AI Guided",
    watermark: "AI",
    gradient: "from-emerald-600 via-teal-700 to-emerald-950",
    glowColor: "bg-emerald-400/25",
    borderClass: "border-emerald-400/30 shadow-emerald-950/20",
  },
  {
    icon: TrophySVG,
    title: "Live rankings",
    description: "See your daily efforts translate to top ranks on the board leaderboard.",
    badge: "★ Live Ranks",
    watermark: "#1",
    gradient: "from-amber-500 via-amber-600 to-orange-950",
    glowColor: "bg-amber-300/30",
    borderClass: "border-amber-300/40 shadow-amber-950/20",
  },
  {
    icon: ChallengeSVG,
    title: "Friend challenges",
    description: "Make board revision exciting and competitive with 1v1 battle arena quizzes.",
    badge: "⚡ 1v1 Arena",
    watermark: "1v1",
    gradient: "from-sky-500 via-blue-600 to-indigo-950",
    glowColor: "bg-sky-300/30",
    borderClass: "border-blue-400/35 shadow-blue-950/20",
  },
] as const;

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-28 overflow-hidden bg-muted/35 px-4 pt-10 pb-6 sm:scroll-mt-32 sm:px-6 sm:pt-16 sm:pb-10 md:pt-20 md:pb-12">
      <div className="mx-auto max-w-7xl xl:max-w-[86rem] 2xl:max-w-[94rem]">
        <ScrollReveal animation="fade-up" className="flex flex-col gap-5 text-center md:flex-row md:items-end md:justify-between md:text-left">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-primary dark:text-logo-green">
              <SparklesSVG className="size-3.5" /> The good stuff
            </span>
            <h2 className="mt-5 text-4xl font-black leading-[1.08] tracking-[-0.055em] text-foreground sm:text-5xl lg:text-6xl">
              One app. Every{" "}
              <span className="relative inline-block whitespace-nowrap text-primary dark:text-logo-green pb-1 sm:pb-1.5">
                study mood.
                <span
                  aria-hidden
                  className="absolute bottom-0 left-0 h-1.5 sm:h-2 w-full rounded-full bg-amber-400 shadow-xs shadow-amber-400/30"
                />
              </span>
            </h2>
          </div>
          <p className="mx-auto max-w-sm text-base leading-relaxed text-muted-foreground md:mx-0">
            Solo grind? Study buddy? Last minute revision? Pick your path and keep moving forward.
          </p>
        </ScrollReveal>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-12 lg:gap-5">
          <ScrollReveal animation="fade-right" className="lg:col-span-7">
            <article className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary to-emerald-950 p-6 text-primary-foreground sm:p-8 min-h-[440px] sm:min-h-[460px] shadow-xl shadow-primary/10 border border-emerald-400/20 flex flex-col justify-between md:block transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1">
              {/* Ambient inner glow */}
              <div className="landing-pulse-glow pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-emerald-400/20 blur-3xl" />

              <div className="relative z-10 max-w-[260px] sm:max-w-xs md:max-w-[220px] lg:max-w-[270px]">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-sm transition-transform duration-300 group-hover:scale-110">
                  <BookOpenSVG className="size-6 text-white" />
                </span>
                <h3 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl text-white">Past papers, meet your comeback.</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/85 sm:text-base">Practice Paper I and II, get feedback, and know what to work on next.</p>
              </div>

              {/* Elevated App Window Preview */}
              <div className="relative mt-6 w-full h-[240px] sm:h-[280px] overflow-hidden rounded-2xl border border-white/25 bg-slate-950/95 shadow-2xl backdrop-blur-md transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] md:absolute md:bottom-5 md:right-5 md:mt-0 md:w-[58%] md:h-[295px] lg:bottom-6 lg:right-6 lg:w-[60%] lg:h-[320px] flex flex-col">
                {/* Window Header */}
                <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/90 px-3.5 py-2 shrink-0 z-10">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-rose-500/80" />
                    <span className="size-2 rounded-full bg-amber-500/80" />
                    <span className="size-2 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white/80">Paper 1 · Question Solving</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                    <span className="relative flex size-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full size-1.5 bg-emerald-400" />
                    </span>
                    Live Exam
                  </span>
                </div>
                {/* Window Content: Actual Paper Solving Screenshot */}
                <div className="relative flex-1 w-full bg-slate-950 overflow-hidden">
                  <Image
                    src="/landing/paper-solving-shot.webp"
                    alt="Actual ExBoard AI Paper 1 Question Solving Interface"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                    quality={90}
                    priority
                    className="object-cover object-left-top transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
              </div>

              <ArrowUpRightSVG className="absolute right-7 top-7 size-6 text-white/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
            </article>
          </ScrollReveal>

          <ScrollReveal animation="fade-left" delay={120} className="lg:col-span-5">
            <article className="group relative overflow-hidden rounded-[2rem] border border-primary/25 bg-gradient-to-br from-card via-card to-primary/10 dark:from-card dark:via-emerald-950/25 dark:to-primary/15 p-6 shadow-xl shadow-primary/5 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/15 hover:-translate-y-1 sm:p-8 min-h-[440px] sm:min-h-[460px] flex flex-col justify-between h-full">
              {/* Ambient primary glow behind Nova */}
              <div className="landing-pulse-glow pointer-events-none absolute -bottom-10 right-4 sm:right-10 size-64 rounded-full bg-primary/20 blur-3xl dark:bg-logo-green/20" />

              {/* Watermark Questions Dense Floating Background */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0 opacity-25 dark:opacity-20">
                <div className="flex flex-col gap-2.5 sm:gap-3 -rotate-6 -translate-y-8 -translate-x-8 w-[170%] sm:w-[150%] transition-transform duration-700">
                  {/* Row 1 - Drifts Left */}
                  <div className="landing-drift-left flex items-center gap-2.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.03] px-3 py-1 text-[11px] font-bold text-foreground/30 dark:text-foreground/35">
                      How does Lenz&apos;s Law conserve energy? ⚡
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1 text-[11.5px] font-extrabold text-primary/60 dark:text-logo-green/65 shadow-xs">
                      Explain Mitosis vs Meiosis stages 🔬
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.02] px-3 py-1 text-[10.5px] font-semibold text-foreground/25 dark:text-foreground/30">
                      Derive quadratic formula step-by-step 📐
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 bg-foreground/[0.04] px-3 py-1 text-[11px] font-bold text-foreground/40 dark:text-foreground/45">
                      What is Dalton&apos;s Atomic Theory? 🧪
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.03] px-3 py-1 text-[11px] font-bold text-foreground/30 dark:text-foreground/35">
                      How does Lenz&apos;s Law conserve energy? ⚡
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1 text-[11.5px] font-extrabold text-primary/60 dark:text-logo-green/65 shadow-xs">
                      Explain Mitosis vs Meiosis stages 🔬
                    </span>
                  </div>

                  {/* Row 2 - Drifts Right */}
                  <div className="landing-drift-right flex items-center gap-2.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 bg-foreground/[0.04] px-3.5 py-1 text-[11.5px] font-bold text-foreground/40 dark:text-foreground/45">
                      Why do ionic compounds have high melting points? 💎
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.02] px-3 py-1 text-[10px] font-semibold text-foreground/25 dark:text-foreground/30">
                      Calculate pH of 0.01M HCl solution 💡
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.07] px-3.5 py-1 text-[12px] font-extrabold text-primary/65 dark:text-logo-green/70 shadow-xs">
                      Pascal&apos;s Principle in hydraulic lift 🌊
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.03] px-3 py-1 text-[11px] font-semibold text-foreground/30 dark:text-foreground/35">
                      Speed vs Velocity difference? 🏃
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 bg-foreground/[0.04] px-3.5 py-1 text-[11.5px] font-bold text-foreground/40 dark:text-foreground/45">
                      Why do ionic compounds have high melting points? 💎
                    </span>
                  </div>

                  {/* Row 3 - Drifts Left */}
                  <div className="landing-drift-left flex items-center gap-2.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.02] px-3 py-1 text-[10.5px] font-semibold text-foreground/25 dark:text-foreground/30">
                      Structure and function of Nephron 🫘
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/[0.09] px-3.5 py-1 text-[12px] font-extrabold text-primary/75 dark:text-logo-green/80 shadow-xs">
                      Explain Ohm&apos;s Law V = I × R 📈
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 bg-foreground/[0.04] px-3 py-1 text-[11px] font-bold text-foreground/40 dark:text-foreground/45">
                      Why is entropy always increasing? 🌌
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.03] px-3 py-1 text-[11px] font-semibold text-foreground/30 dark:text-foreground/35">
                      How to solve CRQ Question 4 from 2024? 📝
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/[0.09] px-3.5 py-1 text-[12px] font-extrabold text-primary/75 dark:text-logo-green/80 shadow-xs">
                      Explain Ohm&apos;s Law V = I × R 📈
                    </span>
                  </div>

                  {/* Row 4 - Drifts Right */}
                  <div className="landing-drift-right flex items-center gap-2.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1 text-[11.5px] font-bold text-primary/55 dark:text-logo-green/60">
                      Differentiate between Mass and Weight ⚖️
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 bg-foreground/[0.04] px-3 py-1 text-[11px] font-semibold text-foreground/35 dark:text-foreground/40">
                      Explain Doppler Effect with sound waves 🔊
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.02] px-3 py-1 text-[10px] font-semibold text-foreground/20 dark:text-foreground/25">
                      How to score 100% in English essay? ✍️
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/20 bg-foreground/[0.05] px-3.5 py-1 text-[12px] font-extrabold text-foreground/50 dark:text-foreground/55 shadow-xs">
                      Total Internal Reflection & Critical Angle 🔦
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative z-20 max-w-[200px] xs:max-w-[225px] sm:max-w-[250px] md:max-w-[215px] lg:max-w-[245px]">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-white text-primary dark:bg-white dark:text-primary border border-primary/15 shadow-sm transition-transform duration-300 group-hover:scale-110">
                  <SparklesSVG className="size-6" />
                </span>
                <h3 className="mt-5 text-2xl font-black tracking-tight text-foreground sm:text-3xl">Stuck? Ask Nova.</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">Your AI tutor is ready for the “wait, explain that again” moments.</p>

                {/* Student Query Floating Badge 2: In-flow under text */}
                <div className="landing-float-reverse mt-4 sm:mt-5 inline-flex items-center gap-1.5 rounded-2xl border border-primary/25 bg-card/90 px-3 py-1.5 text-[11px] font-bold text-foreground shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-105">
                  <span className="size-1.5 rounded-full bg-primary dark:bg-logo-green" />
                  <span>“Step-by-step CRQ marking 📝”</span>
                </div>
              </div>

              {/* Student Query Floating Badge 1: Top Right above Nova */}
              <div className="landing-float-slow absolute top-4 right-3 sm:top-5 sm:right-5 z-20 flex items-center gap-1.5 rounded-2xl border border-primary/25 bg-card/90 px-3 py-1.5 text-[10.5px] sm:text-xs font-bold text-foreground shadow-lg backdrop-blur-md transition-all duration-300 -rotate-2 hover:scale-105 group-hover:rotate-0">
                <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
                <span>“Why is option B correct? 💡”</span>
              </div>

              {/* Nova 3D Tutor Avatar - Flush at bottom-right */}
              <div className="landing-float-slow absolute bottom-0 right-0 sm:right-1 md:-right-1 lg:right-1 h-[270px] w-[205px] xs:w-[225px] sm:h-[305px] sm:w-[245px] md:h-[325px] md:w-[260px] pointer-events-none z-10" style={{ animationDelay: "-3s" }}>
                <Image
                  src="/nova-tutor.webp"
                  alt="Nova, the AI tutor"
                  fill
                  sizes="(max-width: 768px) 240px, 280px"
                  quality={95}
                  className="object-contain object-bottom transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Floating Badge 3: Bottom Left Unlocked */}
              <div className="landing-float relative z-20 mt-6 inline-flex self-start items-center gap-1.5 rounded-xl border border-primary/30 bg-card/90 dark:bg-primary/20 px-3.5 py-2 text-xs font-black text-primary dark:text-logo-green shadow-md backdrop-blur-md transition-all duration-300 rotate-1 group-hover:scale-105 group-hover:rotate-0">
                <span>Aha! moment unlocked ✦</span>
              </div>
            </article>
          </ScrollReveal>

          {MINI_FEATURES.map((item, index) => {
            const Icon = item.icon;
            return (
              <ScrollReveal
                key={item.title}
                animation="fade-up"
                delay={index * 120}
                className="lg:col-span-4"
              >
                <article
                  className={`group relative overflow-hidden rounded-[2rem] border p-6 sm:p-7 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl h-full flex flex-col justify-between ${item.borderClass}`}
                >
                  {/* Background Gradient & Ambient Glows */}
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                    <div className={`absolute inset-0 bg-linear-to-br ${item.gradient}`} />
                    <div className={`landing-pulse-glow absolute -top-[35%] -right-[15%] size-[80%] rounded-full blur-[45px] ${item.glowColor}`} />
                    <div className="absolute -bottom-[35%] -left-[15%] size-[70%] rounded-full bg-black/40 blur-[40px]" />
                    <div
                      className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
                      style={{
                        backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                        backgroundSize: "16px 16px",
                      }}
                    />
                  </div>

                  {/* Ambient Watermarks */}
                  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                    <span className="absolute -top-1.5 right-4 select-none text-4xl sm:text-5xl font-black text-white/15 drop-shadow-xs transition-transform duration-500 group-hover:scale-110">
                      {item.watermark}
                    </span>
                    <Icon className="absolute -bottom-4 -right-4 size-24 text-white/10 -rotate-12 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-0" />
                  </div>

                  {/* Content */}
                  <div className="relative z-10 flex h-full flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex size-12 sm:size-13 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                          <Icon className="size-6" />
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/25 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-xs">
                          {item.badge}
                        </span>
                      </div>

                      <h3 className="mt-8 text-xl font-black tracking-tight text-white sm:text-2xl drop-shadow-xs">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-white/90">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Feature Perks Ribbon: Single-line horizontal scroll on mobile, full width without scroll on large screens */}
        <ScrollReveal animation="fade-up" delay={200}>
          <div className="-mx-4 mt-6 flex overflow-x-auto lg:overflow-x-visible no-scrollbar items-center gap-x-5 sm:gap-x-6 lg:gap-x-1 xl:gap-x-3 2xl:gap-x-5 lg:justify-between px-4 py-3.5 text-xs font-bold text-foreground shadow-sm backdrop-blur-md border-y sm:border border-border/80 bg-card/85 sm:mx-0 sm:rounded-2xl sm:px-6 lg:px-3 xl:px-5 2xl:px-7 sm:py-4 dark:border-white/10 dark:bg-card/90 sm:text-[13px] lg:text-[11px] xl:text-[13px] 2xl:text-sm whitespace-nowrap w-full">
            {EXTRA_PERKS.map((perk) => {
              const Icon = perk.icon;
              return (
                <span
                  key={perk.label}
                  className="inline-flex shrink-0 items-center gap-1.5 sm:gap-2 xl:gap-2.5 transition-all duration-200 hover:text-primary hover:-translate-y-0.5 whitespace-nowrap cursor-default group"
                >
                  <span
                    className={`flex size-6 sm:size-6.5 lg:size-5.5 xl:size-7 items-center justify-center rounded-lg ${perk.bg} transition-transform duration-300 group-hover:scale-115 group-hover:rotate-6`}
                  >
                    <Icon className="size-3 sm:size-3.5 lg:size-3 xl:size-4" />
                  </span>
                  <span>{perk.label}</span>
                </span>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

