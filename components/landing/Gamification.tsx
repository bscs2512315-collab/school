"use client";

import TrophySVG from "@/public/svgs/TrophySVG";
import Image from "next/image";
import { LaptopMockup, MobileMockup } from "@/components/landing/LaptopMockup";
import { useLandingThemeShots } from "@/components/landing/useLandingThemeShots";

import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

export function Gamification() {
  const { isDark, shotPair, mobileShotPair } = useLandingThemeShots();
  const leaderBoardShots = shotPair("leaderboard");
  const mobileLeaderBoardShots = mobileShotPair("leaderboard");

  return (
    <section id="gamification" className="relative scroll-mt-28 overflow-hidden bg-primary py-24 text-primary-foreground sm:scroll-mt-32">
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
      <div className="landing-pulse-glow pointer-events-none absolute -right-20 top-10 size-72 rounded-full bg-primary-light/30 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <ScrollReveal animation="fade-right">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest">
            <TrophySVG className="size-3.5 text-amber-300" />
            Compete
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Make prep feel like a game you can win.
          </h2>
          <p className="mt-4 max-w-md text-base text-primary-foreground/80 sm:text-lg leading-relaxed">
            Earn points, unlock milestones, and climb city and country leaderboards after every paper.
          </p>
        </ScrollReveal>

        {/* Space Black MacBook Hardware & Overlapping Mobile Mockup */}
        <ScrollReveal animation="fade-left" delay={150} className="relative">
          {/* Ambient studio glow */}
          <div className="landing-pulse-glow pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-tr from-amber-400/20 via-primary-light/30 to-emerald-300/20 blur-3xl opacity-80" />

          {/* Floating Achievement Chip */}
          <div className="landing-float-slow absolute -top-4 -left-2 sm:-top-5 sm:-left-4 z-30 flex items-center gap-2.5 rounded-2xl border border-white/25 bg-black/50 backdrop-blur-md px-3.5 py-2 text-white shadow-2xl">
            <span className="flex size-7 items-center justify-center rounded-xl bg-amber-400/25 text-amber-300">
              <TrophySVG className="size-4" />
            </span>
            <div>
              <p className="text-xs font-black leading-none">+250 XP Awarded</p>
              <p className="text-[10px] font-medium text-white/75 mt-0.5">#1 Karachi Region</p>
            </div>
          </div>

          <LaptopMockup float={false}>
            <Image
              src={leaderBoardShots.light}
              alt="ExBoard AI leaderboard desktop view"
              fill
              sizes="(max-width: 1024px) 100vw, 650px"
              quality={90}
              className={cn(
                "object-cover object-top transition-opacity duration-500 ease-in-out",
                isDark ? "opacity-0 pointer-events-none" : "opacity-100"
              )}
            />
            <Image
              src={leaderBoardShots.dark}
              alt="ExBoard AI leaderboard desktop dark view"
              fill
              sizes="(max-width: 1024px) 100vw, 650px"
              quality={90}
              className={cn(
                "object-cover object-top transition-opacity duration-500 ease-in-out",
                isDark ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            />
          </LaptopMockup>

          {/* Overlapping Mobile Device Mockup */}
          <div className="absolute -bottom-3 right-0 sm:-bottom-5 sm:right-2 md:-bottom-6 md:right-2 z-20">
            <MobileMockup float={true}>
              <Image
                src={mobileLeaderBoardShots.light}
                alt="ExBoard AI leaderboard mobile view"
                fill
                sizes="(max-width: 640px) 120px, 195px"
                quality={90}
                className={cn(
                  "object-cover object-top transition-opacity duration-500 ease-in-out",
                  isDark ? "opacity-0 pointer-events-none" : "opacity-100"
                )}
              />
              <Image
                src={mobileLeaderBoardShots.dark}
                alt="ExBoard AI leaderboard mobile dark view"
                fill
                sizes="(max-width: 640px) 120px, 195px"
                quality={90}
                className={cn(
                  "object-cover object-top transition-opacity duration-500 ease-in-out",
                  isDark ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
              />
            </MobileMockup>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
