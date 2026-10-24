import Link from "next/link";
import ZapSVG from "@/public/svgs/ZapSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import CheckSVG from "@/public/svgs/CheckSVG";
import StarSVG from "@/public/svgs/StarSVG";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

const INCLUDED = [
  "Past paper practice for your board",
  "Nova AI study help",
  "AI feedback on written answers",
  "Custom papers and study tools",
  "Challenges, progress, and rankings",
] as const;

export function Pricing() {
  return (
    <section id="pricing" className="relative scroll-mt-28 overflow-hidden bg-background px-4 py-12 sm:scroll-mt-32 sm:px-6 sm:py-16 md:py-20">
      <div className="landing-pulse-glow pointer-events-none absolute left-1/2 top-1/2 -z-0 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/15 blur-3xl" />
      <div className="relative mx-auto max-w-7xl">
        <ScrollReveal animation="fade-up" className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-black uppercase tracking-[0.15em] text-amber-950 shadow-xs">
            <ZapSVG className="size-3.5" /> Limited time offer
          </span>
          <h2 className="mt-5 text-4xl font-black leading-[1.08] tracking-[-0.055em] text-foreground sm:text-5xl lg:text-6xl">
            Big goals.{" "}
            <span className="relative inline-block whitespace-nowrap text-primary dark:text-logo-green pb-1 sm:pb-1.5">
              Zero price tag.
              <span
                aria-hidden
                className="absolute bottom-0 left-0 h-1.5 sm:h-2 w-full rounded-full bg-amber-400 shadow-xs shadow-amber-400/30"
              />
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">Get started with ExBoard AI while public beta access is free.</p>
        </ScrollReveal>

        <ScrollReveal animation="scale-up" delay={150} className="mx-auto mt-12 grid max-w-5xl overflow-hidden rounded-[2rem] border border-primary/20 bg-card shadow-[0_28px_80px_-45px_rgba(0,55,9,0.45)] transition-all duration-300 hover:shadow-[0_35px_90px_-40px_rgba(0,55,9,0.55)] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-6 sm:p-10 lg:p-12">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary dark:bg-primary/25 dark:text-logo-green border border-primary/20 shadow-xs">
                <SparklesSVG className="size-5" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-primary dark:text-logo-green">Your beta toolkit</p>
                <h3 className="text-2xl font-black text-foreground">
                  <span className="relative inline-block pb-1">
                    ExBoard AI beta
                    <span
                      aria-hidden
                      className="absolute bottom-0 left-0 h-1.5 w-full rounded-full bg-amber-400 shadow-xs shadow-amber-400/30"
                    />
                  </span>
                </h3>
              </div>
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">A whole study toolkit, ready when you are. Sign up and start practicing in minutes.</p>
            <ul className="mt-7 space-y-4">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-semibold text-foreground sm:text-base transition-transform duration-200 hover:translate-x-1">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow-xs">
                    <CheckSVG className="size-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative flex flex-col justify-center overflow-hidden bg-primary p-6 text-primary-foreground sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full border-[45px] border-white/5" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold"><StarSVG className="size-3.5" /> Public beta special</span>
              <div className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-6xl font-black tracking-[-0.08em] sm:text-7xl">Free</span>
                <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black uppercase tracking-[0.1em] text-amber-950">Limited time offer</span>
              </div>
              <p className="mt-4 text-sm font-semibold text-primary-foreground/75 sm:text-base">Planned regular price: <s className="font-black text-primary-foreground decoration-amber-400 decoration-[1.5px]">PKR 500 / month</s></p>
              <Link href={FRONTEND_ROUTES.REGISTER} className="landing-shimmer-sweep group mt-8 flex min-h-14 w-full items-center justify-center rounded-2xl bg-amber-400 px-5 text-sm font-black text-amber-950 transition-all hover:-translate-y-1 hover:bg-amber-300 shadow-lg shadow-amber-950/20 active:scale-[0.99] sm:text-base">
                Claim free access
              </Link>
              <p className="mt-4 text-center text-xs font-medium text-primary-foreground/70">No card needed. Offer available during public beta.</p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
