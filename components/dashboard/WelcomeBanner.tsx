"use client";

import { ReactNode, ComponentType, SVGProps } from "react";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Typography } from "@/components/ui/Typography";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { cn } from "@/lib/utils";

interface WelcomeBannerStat {
  label: string;
  value: string;
}

interface WelcomeBannerProps {
  name: string;
  subtitle: string;
  icon: ComponentType<SVGProps<SVGSVGElement>> | LucideIcon;
  eyebrow?: string;
  stats?: WelcomeBannerStat[];
  actions?: ReactNode;
  centerContent?: ReactNode;
  className?: string;
  /** Show Nova portrait on the right (student/teacher dashboard). */
  showNova?: boolean;
  novaHref?: string;
  novaMessage?: string;
}

export default function WelcomeBanner({
  name,
  subtitle,
  icon: Icon,
  eyebrow,
  stats,
  actions,
  centerContent,
  className,
  showNova = false,
  novaHref = FRONTEND_ROUTES.STUDENT_NOVA,
  novaMessage = "Hi, I'm Nova — your AI tutor. Ask me anything!",
}: WelcomeBannerProps) {
  const today =
    eyebrow ??
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl bg-sidebar-from text-primary-foreground shadow-lg sm:rounded-3xl",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-sidebar-from via-primary to-sidebar-to" />
        <div className="absolute -right-10 -top-16 size-56 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 size-48 rounded-full bg-primary-light/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--color-primary-foreground) 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }}
        />
        {showNova ? null : (
          <>
            <svg
              aria-hidden
              viewBox="0 0 200 200"
              className="absolute -right-6 top-4 size-40 text-primary-foreground/15 sm:size-52"
            >
              <circle
                cx="100"
                cy="100"
                r="78"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="6 10"
              />
              <circle
                cx="100"
                cy="100"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.7"
              />
            </svg>
            <Icon
              aria-hidden
              strokeWidth={1}
              className="absolute -bottom-8 -right-6 size-36 text-primary-foreground/10 sm:size-44"
            />
          </>
        )}
      </div>

      <div
        className={cn("relative z-10 flex items-stretch justify-between", {
          "lg:gap-3 xl:gap-6": showNova,
        })}
      >
        <div
          className={cn("min-w-0 space-y-4 p-4 sm:space-y-5 sm:p-6 lg:p-7 shrink-0", {
            "lg:pr-2 lg:pb-6 xl:pr-4": showNova,
          })}
        >
          <div className="max-w-xl">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70 sm:text-xs">
              {today}
            </p>
            <Typography
              variant="h1"
              className="mt-1 text-2xl font-bold tracking-tight text-primary-foreground sm:mt-1.5 sm:text-3xl lg:text-4xl"
            >
              Welcome back, {name}
            </Typography>
            <Typography className="mt-1.5 text-sm leading-relaxed text-primary-foreground/75 sm:mt-2 sm:text-base lg:hidden">
              {subtitle}
            </Typography>
          </div>

          {actions ? (
            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
              {actions}
            </div>
          ) : null}

          {stats && stats.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:max-w-md sm:gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/10 px-2 py-2 text-center backdrop-blur-md sm:rounded-2xl sm:px-3 sm:py-2.5"
                >
                  <p className="truncate text-base font-bold text-primary-foreground sm:text-xl">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary-foreground/65 sm:text-[10px]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Center Column: Ad / Showcase Card inside Hero Section */}
        {centerContent ? (
          <div className="hidden lg:flex flex-1 items-center justify-center px-1 py-1 w-full max-w-[500px] xl:max-w-[520px]">
            {centerContent}
          </div>
        ) : null}

        {showNova ? (
          <Link
            href={novaHref}
            className="group hidden shrink-0 flex-col items-center justify-end pb-0 pr-6 pt-2 lg:flex lg:pr-8 xl:pr-10 2xl:pr-12 self-end"
            aria-label="Chat with Nova"
          >
            {/* Speech Bubble Above Nova */}
            <span className="relative z-10 mb-2 max-w-48 rounded-2xl bg-white px-3.5 py-1.5 text-center text-xs font-bold leading-snug text-primary shadow-md transition-shadow group-hover:shadow-lg xl:max-w-56">
              {novaMessage}
              <span
                aria-hidden
                className="absolute left-1/2 top-full size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white"
              />
            </span>
            <div className="relative h-48 w-36 transition-transform duration-200 group-hover:scale-105 xl:h-52 xl:w-40 2xl:h-56 2xl:w-44">
              <Image
                src="/nova-tutor-dashboard.webp"
                alt="Nova AI Tutor"
                fill
                unoptimized
                loading="eager"
                fetchPriority="high"
                sizes="(min-width: 1536px) 176px, (min-width: 1280px) 160px, 144px"
                className="bg-transparent object-contain object-bottom"
              />
            </div>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
