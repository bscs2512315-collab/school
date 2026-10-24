import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import CameraSVG from "@/public/svgs/CameraSVG";
import LeaderboardSVG from "@/public/svgs/LeaderboardSVG";
import UserSVG from "@/public/svgs/UserSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

const STEPS = [
  {
    number: "01",
    badge: "PROFILE SETUP",
    action: "START",
    icon: UserSVG,
    title: "Set your stage",
    description: "Choose your class, board, and school. Your prep space becomes yours.",
  },
  {
    number: "02",
    badge: "BOARD PAPERS",
    action: "SELECT",
    icon: BookOpenSVG,
    title: "Pick your practice",
    description: "Jump into past papers, create a custom set, or ask Nova for help.",
  },
  {
    number: "03",
    badge: "AI EVALUATION",
    action: "PRACTICE",
    icon: CameraSVG,
    title: "Give it a go",
    description: "Answer MCQs or upload your written work for instant AI feedback.",
  },
  {
    number: "04",
    badge: "RANK & BADGES",
    action: "LEVEL UP",
    icon: LeaderboardSVG,
    title: "See the level up",
    description: "Review what clicked, fix what didn’t, and watch your rank rise.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative scroll-mt-28 overflow-hidden bg-background px-4 pt-6 pb-12 sm:scroll-mt-32 sm:px-6 sm:pt-10 sm:pb-16 md:pt-12 md:pb-20">
      {/* Background ambient lighting */}
      <div className="landing-pulse-glow pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--color-primary)_12%,transparent),transparent_65%)]" />

      <div className="relative mx-auto max-w-7xl">
        <ScrollReveal animation="fade-up" className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-black uppercase tracking-[0.2em] text-primary dark:text-logo-green border border-primary/20">
            <SparklesSVG className="size-3.5" /> The game plan
          </span>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.055em] text-foreground sm:text-5xl lg:text-6xl">
            Ready. Set.{" "}
            <span className="relative inline-block whitespace-nowrap text-primary dark:text-logo-green pb-1 sm:pb-1.5">
              Level up.
              <span
                aria-hidden
                className="absolute bottom-0 left-0 h-1.5 sm:h-2 w-full rounded-full bg-amber-400 shadow-xs shadow-amber-400/30"
              />
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            A smarter, faster board prep routine in four simple steps.
          </p>
        </ScrollReveal>

        <div className="relative mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <ScrollReveal
                key={step.number}
                animation="fade-up"
                delay={index * 130}
                className="h-full"
              >
                <article
                  className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[2rem] border border-emerald-400/25 bg-gradient-to-br from-emerald-600 via-primary to-emerald-950 p-6 text-white shadow-xl shadow-primary/15 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/30"
                >
                  {/* Ambient background glow */}
                  <div className="landing-pulse-glow pointer-events-none absolute -right-8 -top-8 size-44 rounded-full bg-emerald-400/20 blur-2xl" />

                  {/* Ambient ghost watermark icon */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-3 top-2 text-white/[0.08] transition-transform duration-500 group-hover:scale-115 group-hover:rotate-6"
                  >
                    <Icon className="size-36" />
                  </div>

                  <div>
                    {/* Top Row: Squircle icon + Badge */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="flex size-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white shadow-sm backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                        <Icon className="size-6 text-white" />
                      </span>
                      <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white backdrop-blur-sm shadow-xs">
                        {step.badge}
                      </span>
                    </div>

                    {/* Body Content */}
                    <div className="relative z-10 mt-7">
                      <h3 className="text-2xl font-black tracking-tight text-white">{step.title}</h3>
                      <p className="mt-2.5 text-sm font-medium leading-relaxed text-white/85">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Row: Action pill + Sparkle */}
                  <div className="relative z-10 mt-8 flex items-center justify-between pt-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-primary shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
                      <span>{step.action}</span>
                      <ArrowRightSVG className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                    <SparklesSVG className="size-5 text-white/40 transition-all duration-300 group-hover:text-amber-300 group-hover:rotate-12 group-hover:scale-110" />
                  </div>

                  {/* Step Connector on desktop */}
                  {index < STEPS.length - 1 ? (
                    <span
                      aria-hidden
                      className="absolute -right-3.5 top-1/2 z-20 hidden size-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-emerald-800 text-white shadow-lg backdrop-blur-md lg:flex transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110"
                    >
                      <ArrowRightSVG className="size-3.5" />
                    </span>
                  ) : null}
                </article>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
