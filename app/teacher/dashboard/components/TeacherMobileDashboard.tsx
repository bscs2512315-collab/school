"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { cn, formatCapitalizeWords } from "@/lib/utils";
import AppButton from "@/components/AppButton";
import ChallengeSVG from "@/public/svgs/ChallengeSVG";
import ClassroomSVG from "@/public/svgs/ClassroomSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import { getClassroomPalette } from "@/lib/generate/subject-icons";
import TopStudentsShowcase, {
  type TopSchoolItem,
  type TopStudentItem,
} from "@/components/dashboard/TopStudentsShowcase";
import DashboardBrandShowcase from "@/components/dashboard/DashboardBrandShowcase";
import type { TeacherClassroomOption } from "@/hooks/teacher/useTeacherClassrooms";
import type { TeacherPendingPaper } from "@/hooks/teacher/useTeacherPendingPapers";
import type { DashboardStudent } from "@/hooks/teacher/useTeacherDashboardSummary";

export interface TeacherMobileTool {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}

interface TeacherMobileDashboardProps {
  firstName: string;
  studentCount: number;
  classroomCount: number;
  pendingCount: number;
  avgScore: number;
  tools: TeacherMobileTool[];
  classrooms: TeacherClassroomOption[];
  pendingPapers: TeacherPendingPaper[];
  students: DashboardStudent[];
  leaderboard?: TopStudentItem[];
  schools?: TopSchoolItem[];
  isLeaderboardLoading?: boolean;
  isSummaryLoading?: boolean;
  isClassroomsLoading?: boolean;
  isPendingLoading?: boolean;
}

function SectionHeader({
  title,
  subtitle,
  href,
  actionLabel = "View more",
}: {
  title: string;
  subtitle: string;
  href?: string;
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
      {href ? (
        <Link href={href} className="shrink-0">
          <AppButton
            variant="outline"
            className="h-8 rounded-full px-3 text-[11px] font-semibold"
          >
            {actionLabel}
            <ArrowRight className="size-3.5" />
          </AppButton>
        </Link>
      ) : null}
    </div>
  );
}

export default function TeacherMobileDashboard({
  firstName,
  studentCount,
  classroomCount,
  pendingCount,
  avgScore,
  tools,
  classrooms,
  pendingPapers,
  students,
  leaderboard,
  schools,
  isLeaderboardLoading,
  isSummaryLoading,
  isClassroomsLoading,
  isPendingLoading,
}: TeacherMobileDashboardProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const topStudents = [...students]
    .sort((a, b) => Number(b.avg_score) - Number(a.avg_score))
    .slice(0, 5);

  return (
    <div className="lg:hidden">
      <section className="relative overflow-x-clip bg-primary px-5 pb-16 pt-5 text-primary-foreground">
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

        {/* Notice Board Showcase */}
        <div className="relative z-20 mb-3 flex justify-center w-full">
          <DashboardBrandShowcase className="w-full max-w-[480px]" />
        </div>

        <div className="relative z-10 space-y-4 pr-36 sm:pr-40">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/70">
              {today}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              Hi, {firstName}
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/65">
                Students
              </p>
              <p className="mt-0.5 text-xl font-bold tabular-nums">
                {isSummaryLoading ? "…" : studentCount}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/65">
                Pending
              </p>
              <p className="mt-0.5 text-xl font-bold tabular-nums">
                {isPendingLoading ? "…" : pendingCount}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-primary-foreground/20">
              <div
                className="h-full rounded-full bg-primary-foreground"
                style={{
                  width: `${Math.min(100, Math.max(8, avgScore || 8))}%`,
                }}
              />
            </div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-primary-foreground/80">
              <CheckCircleSVG className="size-3.5 shrink-0" />
              {isClassroomsLoading ? "…" : classroomCount} classroom{classroomCount === 1 ? "" : "s"} · Avg
              score {isSummaryLoading ? "…" : `${avgScore}%`}
            </p>
          </div>
        </div>

        <Link
          href={FRONTEND_ROUTES.TEACHER_NOVA}
          className="absolute bottom-4 right-1 z-10 flex w-36 flex-col items-center sm:bottom-6 sm:right-3 sm:w-40"
          aria-label="Chat with Nova"
        >
          <span className="relative z-10 mb-1.5 max-w-32 rounded-2xl border border-primary-foreground/25 bg-card px-2.5 py-1 text-center text-[10px] font-semibold leading-snug text-foreground shadow-sm sm:max-w-36 sm:text-xs">
            Hi, I&apos;m Nova — your teaching assistant. Let&apos;s create
            papers!
            <span
              aria-hidden
              className="absolute left-1/2 top-full size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-primary-foreground/25 bg-card"
            />
          </span>
          <div className="relative h-40 w-full sm:h-44">
            <Image
              src="/nova-tutor.webp"
              alt="Nova AI Tutor"
              fill
              priority
              sizes="160px"
              className="bg-transparent object-contain object-bottom"
            />
          </div>
        </Link>
      </section>

      <div className="relative z-10 -mt-8 space-y-5 rounded-t-3xl bg-background px-5 pb-6 pt-5">
        {/* Top 3 Students & Schools Interleaved Motivational Showcase */}
        <section className="pt-0.5">
          <TopStudentsShowcase
            students={leaderboard}
            schools={schools}
            isLoading={isLeaderboardLoading}
            leaderboardHref={FRONTEND_ROUTES.TEACHER_LEADERBOARD}
          />
        </section>

        <section>
          <h2 className="text-base font-bold tracking-tight text-foreground">
            Teaching tools
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
                <span className="flex size-14 items-center justify-center rounded-2xl border border-border/50 bg-primary/10 text-primary shadow-xs transition-all active:scale-95 dark:bg-muted dark:text-foreground">
                  <tool.icon className="size-6 transition-transform duration-200 group-hover:scale-110" />
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
            title="Pending grading"
            subtitle="Paper 2 submissions waiting for review"
          />

          {pendingPapers.length > 0 ? (
            <div className="space-y-2.5">
              {pendingPapers.slice(0, 4).map((paper) => (
                <Link
                  key={paper.id}
                  href={FRONTEND_ROUTES.TEACHER_CHECK_PAPER(paper.id)}
                  className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card px-3.5 py-3"
                >
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                    {paper.student_image ? (
                      <Image
                        src={paper.student_image}
                        alt={paper.student_name}
                        width={44}
                        height={44}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-primary/10 font-bold text-primary">
                        {paper.student_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {formatCapitalizeWords(paper.student_name)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {paper.subject} ·{" "}
                      {new Date(paper.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                    Grade
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-sidebar-from via-primary to-sidebar-to p-4 text-white shadow-md border border-white/10 sm:p-5">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -right-6 -top-6 size-32 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-6 -left-6 size-28 rounded-full bg-emerald-400/20 blur-2xl" />
                <div
                  className="absolute inset-0 opacity-[0.12]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
                    backgroundSize: "14px 14px",
                  }}
                />
              </div>
              <div className="relative z-10 flex items-end justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="inline-flex items-center gap-1 rounded-full bg-white/20 border border-white/25 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                    <CheckCircleSVG className="size-3 text-emerald-300" />
                    <span>Backlog Cleared</span>
                  </div>
                  <p className="text-base font-black text-white">
                    All caught up!
                  </p>
                  <p className="text-xs text-white/80 leading-snug">
                    No Paper 2 submissions waiting for manual grading.
                  </p>
                  <div className="pt-1.5 flex items-center gap-2">
                    <Link
                      href={FRONTEND_ROUTES.TEACHER_CREATE_PAPER}
                      className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-primary shadow-xs"
                    >
                      <SparklesSVG className="size-3 text-primary" />
                      <span>Create Paper</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <SectionHeader
            title="Classrooms"
            subtitle="Your active subject rooms"
            href={FRONTEND_ROUTES.TEACHER_CLASSROOMS}
          />

          {classrooms.length > 0 ? (
            <div className="space-y-2.5">
              {classrooms.slice(0, 4).map((classroom, index) => {
                const palette = getClassroomPalette(
                  classroom.subject,
                  classroom.name,
                  index,
                );
                const SubjectIcon = palette.icon;
                return (
                  <Link
                    key={classroom.id}
                    href={FRONTEND_ROUTES.TEACHER_CLASSROOM(classroom.id)}
                    className={cn(
                      "group relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border p-3.5 text-white shadow-xs transition-all duration-300 active:scale-98",
                      palette.gradient,
                      palette.border,
                    )}
                  >
                    {/* Ambient watermark icon */}
                    <div className="pointer-events-none absolute -bottom-2 -right-2 opacity-15">
                      <SubjectIcon className="size-16 text-white" />
                    </div>

                    <div className="relative z-10 flex items-center gap-3 min-w-0">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/20 border border-white/25 text-white backdrop-blur-md shadow-xs">
                        <SubjectIcon className="size-5 text-white" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-white drop-shadow-2xs">
                          {classroom.name && !classroom.name.includes("__")
                            ? classroom.name
                            : `${classroom.subject} · Class ${classroom.classLevel}`}
                        </p>
                        <p className="mt-0.5 text-[11px] font-semibold text-white/85">
                          {classroom.board || "AKUEB"}
                          {classroom.pinCode ? ` · PIN: ${classroom.pinCode}` : ""}
                        </p>
                        {typeof classroom.paperCount === "number" ? (
                          <p className="text-[11px] font-semibold text-white/85">
                            {classroom.paperCount} paper{classroom.paperCount === 1 ? "" : "s"}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <span className="relative z-10 inline-flex items-center gap-1 rounded-full bg-white/20 border border-white/25 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur-sm">
                      OPEN <ArrowRight className="size-3" />
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 px-4 py-5 text-center">
              <ClassroomSVG className="mx-auto size-8 text-primary" />
              <p className="mt-2 text-sm font-semibold text-foreground">
                No classrooms yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create a classroom to start assigning papers
              </p>
              <Link href={FRONTEND_ROUTES.TEACHER_CLASSROOMS} className="mt-3 inline-block">
                <AppButton className="h-9 rounded-full px-4 text-xs font-semibold">
                  Create classroom
                </AppButton>
              </Link>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <SectionHeader
            title="Top students"
            subtitle="Highest average scores in your school"
            href={FRONTEND_ROUTES.TEACHER_STUDENTS}
          />

          {topStudents.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
              {topStudents.map((student, index) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 border-b border-border/40 px-4 py-3 last:border-b-0"
                >
                  <span className="w-6 text-sm font-bold text-muted-foreground">
                    #{index + 1}
                  </span>
                  <UserAvatar
                    src={student.profile_image}
                    name={student.name}
                    id={student.id}
                    size={40}
                    className="size-10 shrink-0 border border-border"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {student.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Class {student.class || "—"} · {student.attempts_count}{" "}
                      attempts
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums text-foreground">
                      {Math.round(Number(student.avg_score))}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">avg</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 px-4 py-5 text-center">
              <ChallengeSVG className="mx-auto size-8 text-primary" />
              <p className="mt-2 text-sm font-semibold text-foreground">
                No students yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Students from your school will appear here once enrolled
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
