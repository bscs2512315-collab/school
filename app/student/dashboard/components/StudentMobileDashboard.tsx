"use client";

import Link from "next/link";
import Image from "next/image";
import type { ComponentType, SVGProps } from "react";
import { useMemo } from "react";
import {
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import AppButton from "@/components/AppButton";
import HistorySVG from "@/public/svgs/HistorySVG";
import P1SVG from "@/public/svgs/P1SVG";
import P2SVG from "@/public/svgs/P2SCG";
import type { StudentHistoryItem } from "@/types/student";
import type { PastPaperSummary } from "@/types/past-paper";
import TopStudentsShowcase, { type TopSchoolItem, type TopStudentItem } from "@/components/dashboard/TopStudentsShowcase";
import DashboardBrandShowcase from "@/components/dashboard/DashboardBrandShowcase";

export interface MobileDashboardTool {
  title: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  imageSrc?: string;
}

export type MobileLeaderboardEntry = TopStudentItem;

interface StudentMobileDashboardProps {
  firstName: string;
  points: number;
  rank: number | null;
  classLevel: string | null;
  currentUserId?: string;
  tools: MobileDashboardTool[];
  leaderboard: MobileLeaderboardEntry[];
  schools?: TopSchoolItem[];
  recentHistory: StudentHistoryItem[];
  pastPapers: PastPaperSummary[];
}

function SectionHeader({
  title,
  subtitle,
  href,
  actionLabel = "View more",
}: {
  title: string;
  subtitle: string;
  href: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-base font-bold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <Link href={href} className="shrink-0">
        <AppButton
          variant="outline"
          className="h-8 rounded-full px-3 text-[11px] font-semibold"
        >
          {actionLabel}
          <ArrowRight className="size-3.5" />
        </AppButton>
      </Link>
    </div>
  );
}

export default function StudentMobileDashboard({
  firstName,
  points,
  rank,
  classLevel,
  tools,
  leaderboard,
  schools,
  recentHistory,
  pastPapers,
}: StudentMobileDashboardProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const scoreTrend = useMemo(() => {
    return [...recentHistory]
      .slice(0, 8)
      .reverse()
      .map((item, index) => {
        const pct =
          item.total_marks > 0
            ? Math.round((item.score / item.total_marks) * 100)
            : 0;
        return {
          label: `T${index + 1}`,
          score: pct,
        };
      });
  }, [recentHistory]);

  const subjectBars = useMemo(() => {
    const bySubject = new Map<string, { total: number; count: number }>();
    recentHistory.forEach((item) => {
      const key = item.subject || "Other";
      const current = bySubject.get(key) ?? { total: 0, count: 0 };
      const pct =
        item.total_marks > 0 ? (item.score / item.total_marks) * 100 : 0;
      bySubject.set(key, {
        total: current.total + pct,
        count: current.count + 1,
      });
    });

    return Array.from(bySubject.entries())
      .map(([subject, value]) => ({
        subject: subject.length > 8 ? `${subject.slice(0, 7)}…` : subject,
        avg: Math.round(value.total / value.count),
      }))
      .slice(0, 5);
  }, [recentHistory]);

  const avgScore = useMemo(() => {
    if (recentHistory.length === 0) return null;
    const sum = recentHistory.reduce((acc, item) => {
      if (item.total_marks <= 0) return acc;
      return acc + (item.score / item.total_marks) * 100;
    }, 0);
    return Math.round(sum / recentHistory.length);
  }, [recentHistory]);

  return (
    <div className="lg:hidden">
      <section className="relative overflow-x-clip bg-primary px-5 pb-9 pt-3 text-primary-foreground">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-linear-to-br from-sidebar-from via-primary to-sidebar-to" />
          <div className="absolute -right-8 -top-10 size-40 rounded-full bg-primary-foreground/10 blur-2xl" />
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, var(--color-primary-foreground) 1px, transparent 0)",
              backgroundSize: "16px 16px",
            }}
          />
        </div>

        {/* Brand Partner Showcase & Daily Inspirational Verses */}
        <div className="relative z-20 mb-3 flex justify-center w-full">
          <DashboardBrandShowcase className="w-full max-w-[480px]" />
        </div>

        {/* Hero Content with Left Stats and Inline Nova Tutor */}
        <div className="relative z-10 min-h-[168px]">
          <div className="space-y-3 pr-36 min-[380px]:pr-40 sm:pr-44">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70">
                {today}
              </p>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight">
                Hi, {firstName}
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/65">
                  Points
                </p>
                <p className="mt-0.5 text-xl font-bold tabular-nums">
                  {points.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/65">
                  Rank
                </p>
                <p className="mt-0.5 text-xl font-bold tabular-nums">
                  {rank !== null ? `#${rank}` : "—"}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="h-2 overflow-hidden rounded-full bg-primary-foreground/20">
                <div
                  className="h-full rounded-full bg-primary-foreground"
                  style={{
                    width: `${Math.min(100, Math.max(8, points > 0 ? (points % 1000) / 10 : 8))}%`,
                  }}
                />
              </div>
              <p className="text-[11px] font-medium text-primary-foreground/80">
                Class {classLevel || "—"} · Keep practicing to climb the leaderboard
              </p>
            </div>
          </div>

          <Link
            href={FRONTEND_ROUTES.STUDENT_NOVA}
            className="absolute top-0 right-0 z-10 flex w-40 flex-col items-center min-[380px]:w-44 sm:right-2 sm:w-48"
            aria-label="Chat with Nova"
          >
            <span className="relative z-10 max-w-36 rounded-2xl bg-white px-2.5 py-1 text-center text-[10px] font-bold leading-snug text-primary shadow-md min-[380px]:max-w-40 sm:max-w-44 sm:text-xs">
              Hi, I&apos;m Nova — your AI tutor. Ask me anything!
              <span
                aria-hidden
                className="absolute left-1/2 top-full size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white"
              />
            </span>
            <div className="relative -mt-0.5 h-44 w-full min-[380px]:h-48 sm:h-52">
              <Image
                src="/nova-tutor-dashboard.webp"
                alt="Nova AI Tutor"
                fill
                unoptimized
                loading="eager"
                fetchPriority="high"
                sizes="(max-width: 640px) 176px, 208px"
                className="bg-transparent object-contain object-bottom"
              />
            </div>
          </Link>
        </div>
      </section>

      <div className="relative z-20 -mt-6 space-y-5 rounded-t-3xl bg-background px-5 pb-6 pt-4">
        {/* Top 3 Students & Schools Interleaved Motivational Showcase */}
        <section className="pt-0.5">
          <TopStudentsShowcase students={leaderboard} schools={schools} />
        </section>

        <section>
          <h2 className="text-base font-bold tracking-tight text-foreground">
            Study tools
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Jump into what you need today
          </p>

          <div className="mt-4 grid grid-cols-3 gap-x-3 gap-y-4">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group flex flex-col items-center gap-2 text-center"
              >
                <span className="relative flex size-14 items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-primary/10 text-primary shadow-xs transition-all active:scale-95 dark:bg-muted dark:text-foreground">
                  {tool.imageSrc ? (
                    <Image
                      src={tool.imageSrc}
                      alt={tool.title}
                      width={56}
                      height={56}
                      className="size-full object-cover object-top"
                    />
                  ) : (
                    <tool.icon className="size-6 transition-transform duration-200 group-hover:scale-110" />
                  )}
                </span>
                <span className="text-[11px] font-semibold leading-tight text-foreground truncate max-w-full">
                  {tool.title}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeader
            title="Analytics"
            subtitle="Your recent score trend and subject averages"
            href={FRONTEND_ROUTES.STUDENT_HISTORY}
          />

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-border/50 bg-card p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Avg
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                {avgScore !== null ? `${avgScore}%` : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tests
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                {recentHistory.length}
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Rank
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                {rank !== null ? `#${rank}` : "—"}
              </p>
            </div>
          </div>

          {scoreTrend.length > 0 ? (
            <div className="rounded-2xl border border-border/50 bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <HistorySVG className="size-4 text-primary dark:text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">
                  Score trend
                </p>
              </div>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={scoreTrend}
                    margin={{ top: 8, right: 4, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="var(--color-primary)"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--color-primary)"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid var(--color-border)",
                        backgroundColor: "var(--color-card)",
                        fontSize: 12,
                      }}
                      formatter={(value) => [`${value}%`, "Score"]}
                      itemStyle={{ color: "var(--color-foreground)" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      fill="url(#scoreFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}

          {subjectBars.length > 0 ? (
            <div className="rounded-2xl border border-border/50 bg-card p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">
                Subject averages
              </p>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={subjectBars}
                    margin={{ top: 8, right: 4, left: -20, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="subject"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid var(--color-border)",
                        backgroundColor: "var(--color-card)",
                        fontSize: 12,
                      }}
                      formatter={(value) => [`${value}%`, "Average"]}
                      itemStyle={{ color: "var(--color-foreground)" }}
                      cursor={{ fill: "transparent" }}
                    />
                    <Bar
                      dataKey="avg"
                      fill="var(--color-primary)"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}

          {scoreTrend.length === 0 && subjectBars.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 px-4 py-5 text-center">
              <p className="text-sm font-semibold text-foreground">
                No analytics yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Attempt a paper to see your charts here
              </p>
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <SectionHeader
            title="Past papers"
            subtitle="Jump back into recent practice papers"
            href={FRONTEND_ROUTES.STUDENT_PAST_PAPERS_1}
            actionLabel="View more"
          />

          {pastPapers.length > 0 ? (
            <div className="space-y-2.5">
              {pastPapers.slice(0, 4).map((paper) => (
                <Link
                  key={paper.id}
                  href={
                    paper.paperNumber === 2
                      ? FRONTEND_ROUTES.STUDENT_PAST_PAPER_ATTEMPT_PAPER2(paper.id)
                      : FRONTEND_ROUTES.STUDENT_PAST_PAPER_ATTEMPT(paper.id)
                  }
                  className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card px-3.5 py-3"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-muted dark:text-foreground">
                    {paper.paperNumber === 2 ? (
                      <P2SVG className="size-5" />
                    ) : (
                      <P1SVG className="size-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {paper.subject} · Paper {paper.paperNumber}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {paper.board} · Class {paper.class} · {paper.year}
                      {paper.session ? ` ${paper.session}` : ""}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 px-4 py-5 text-center">
              <P1SVG className="mx-auto size-8 text-primary dark:text-muted-foreground" />
              <p className="mt-2 text-sm font-semibold text-foreground">
                No past papers yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Browse Paper 1 and Paper 2 to start practicing
              </p>
            </div>
          )}
        </section>

        {recentHistory.length > 0 ? (
          <section className="space-y-3">
            <SectionHeader
              title="Recent activity"
              subtitle="Your latest attempts"
              href={FRONTEND_ROUTES.STUDENT_HISTORY}
              actionLabel="View more"
            />
            <div className="space-y-2.5">
              {recentHistory.slice(0, 3).map((item) => {
                const pct =
                  item.total_marks > 0
                    ? Math.round((item.score / item.total_marks) * 100)
                    : 0;
                return (
                  <Link
                    key={item.id}
                    href={FRONTEND_ROUTES.STUDENT_HISTORY_DETAIL(item.id)}
                    className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card px-3.5 py-3"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-muted dark:text-foreground">
                      <HistorySVG className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.subject}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {item.paper_type || "Paper"} ·{" "}
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm font-bold tabular-nums text-primary dark:text-foreground">
                      {pct}%
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
