"use client";

import Image from "next/image";
import Link from "next/link";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { APP_NAME } from "@/constants";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

export function CTA({
  novaMessage = "Hi, I'm Nova — your AI tutor",
}: {
  novaMessage?: string | null;
}) {
  return (
    <section className="bg-background py-10 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal animation="scale-up">
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary via-primary to-primary-dark text-primary-foreground shadow-2xl shadow-primary/25 border border-emerald-400/20">
            <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:20px_20px]" />
            <div className="landing-pulse-glow pointer-events-none absolute -right-20 -bottom-20 size-80 rounded-full bg-amber-400/20 blur-3xl" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-stretch">
              <div className="flex min-w-0 flex-1 flex-col justify-center px-5 py-8 xs:px-6 xs:py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16 text-center lg:text-left lg:max-w-xl xl:max-w-2xl">
                <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black tracking-[-0.04em] leading-[1.15]">
                  Ready to ace your <br className="hidden sm:inline" />
                  <span className="relative inline-block whitespace-nowrap pb-1">
                    <span className="text-white">board exams?</span>
                    <span
                      aria-hidden
                      className="absolute bottom-0 left-0 h-1.5 sm:h-2 w-full rounded-full bg-amber-400 shadow-xs shadow-amber-400/40"
                    />
                  </span>
                </h2>
                <p className="mx-auto mt-3.5 sm:mt-4 max-w-lg text-sm xs:text-base sm:text-lg text-primary-foreground/90 font-medium leading-snug sm:leading-relaxed lg:mx-0">
                  Join {APP_NAME} for AKUEB and Sindh Board past papers, instant AI grading,
                  and 24/7 Nova tutoring — everything you need to score top ranks.
                </p>
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-3.5 lg:justify-start max-w-xs xs:max-w-sm sm:max-w-md mx-auto lg:mx-0 w-full">
                  <Link
                    href={FRONTEND_ROUTES.REGISTER}
                    className="landing-shimmer-sweep sticker-btn inline-flex h-11 xs:h-12 w-full sm:w-52 items-center justify-center gap-2 rounded-xl bg-white px-5 text-xs xs:text-sm font-bold text-[#005f02] border-2 border-[#020617] shadow-[4px_5px_0_#020617] hover:shadow-[1px_2px_0_#020617] dark:bg-white dark:text-[#005f02] whitespace-nowrap"
                  >
                    Create free account
                  </Link>
                  <Link
                    href={FRONTEND_ROUTES.LOGIN}
                    className="sticker-btn inline-flex h-11 xs:h-12 w-full sm:w-52 items-center justify-center rounded-xl bg-amber-400 px-5 text-xs xs:text-sm font-bold text-black border-2 border-[#020617] shadow-[4px_5px_0_#020617] hover:shadow-[1px_2px_0_#020617] dark:bg-amber-400 dark:text-black whitespace-nowrap"
                  >
                    Log in
                  </Link>
                </div>
              </div>

              {/* Nova Avatar Container - anchored flush to the bottom */}
              <div className="relative mx-auto flex w-full max-w-sm flex-col items-center justify-end pt-4 lg:pt-0 lg:max-w-none lg:w-auto lg:absolute lg:bottom-0 lg:right-6 xl:right-12 pointer-events-none">
                {novaMessage ? (
                  <span className="landing-float-reverse relative z-20 mx-4 mb-2 shrink-0 rounded-full border border-black/5 bg-white px-4 py-1.5 xs:px-4.5 xs:py-2 text-center text-[11px] xs:text-xs font-bold leading-snug text-[#005f02] shadow-xl shadow-black/15 dark:bg-white dark:text-[#005f02] pointer-events-auto lg:hidden">
                    {novaMessage}
                  </span>
                ) : null}
                <div className="relative h-[290px] xs:h-[320px] sm:h-[360px] md:h-[390px] lg:h-[420px] xl:h-[450px] w-64 xs:w-72 sm:w-80 lg:w-[320px] xl:w-[350px] -mb-6 sm:-mb-8 lg:-mb-10">
                  <Image
                    src="/nova-tutor.webp"
                    alt="Nova AI Tutor"
                    fill
                    quality={95}
                    sizes="(min-width: 1280px) 384px, (min-width: 1024px) 320px, 280px"
                    className="object-contain object-bottom pointer-events-none"
                    priority
                  />
                </div>
              </div>

              {/* Desktop Speech Bubble - Pinned at top-right above Nova */}
              {novaMessage ? (
                <div className="landing-float-reverse hidden lg:block absolute top-6 right-8 xl:right-14 z-20 pointer-events-auto">
                  <span className="inline-block rounded-full border border-black/5 bg-white px-4.5 py-2 text-center text-xs font-bold leading-snug text-[#005f02] shadow-xl shadow-black/15 dark:bg-white dark:text-[#005f02]">
                    {novaMessage}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
