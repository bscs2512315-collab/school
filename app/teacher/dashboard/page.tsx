"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import PageContainer from "@/components/PageContainer";
import AppButton from "@/components/AppButton";
import { Typography } from "@/components/ui/Typography";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import SyllabusSVG from "@/public/svgs/SyllabusSVG";
import GenerateSVG from "@/public/svgs/GenerateSVG";
import NovaSVG from "@/public/svgs/NovaSVG";
import ClassroomSVG from "@/public/svgs/ClassroomSVG";
import P1SVG from "@/public/svgs/P1SVG";
import P2SVG from "@/public/svgs/P2SCG";
import VoteSVG from "@/public/svgs/VoteSVG";
import StudentsSVG from "@/public/svgs/StudentsSVG";
import ReviewExamsSVG from "@/public/svgs/ReviewExamsSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import HistorySVG from "@/public/svgs/HistorySVG";
import { cn, formatCapitalizeWords } from "@/lib/utils";
import UserAvatar from "@/components/UserAvatar";
import TopStudentsShowcase, {
  type TopStudentItem,
  type TopSchoolItem,
} from "@/components/dashboard/TopStudentsShowcase";
import AppLoader from "@/components/AppLoader";
import { useStoredUser } from "@/hooks/useStoredUser";
import { useTeacherClassrooms } from "@/hooks/teacher/useTeacherClassrooms";
import { useTeacherPendingPapers } from "@/hooks/teacher/useTeacherPendingPapers";
import { useTeacherDashboardSummary } from "@/hooks/teacher/useTeacherDashboardSummary";
import { useLeaderboard, useSchoolLeaderboard } from "@/hooks/useLeaderboard";
import DashboardBrandShowcase from "@/components/dashboard/DashboardBrandShowcase";
import { getClassroomPalette } from "@/lib/generate/subject-icons";
import TeacherMobileDashboard from "./components/TeacherMobileDashboard";

export default function TeacherDashboard() {
  const { user, isReady } = useStoredUser();
  const classroomsQuery = useTeacherClassrooms();
  const pendingQuery = useTeacherPendingPapers();
  const summaryQuery = useTeacherDashboardSummary();
  const leaderboardQuery = useLeaderboard();
  const schoolLeaderboardQuery = useSchoolLeaderboard();

  // Scroll to top cleanly on mount to prevent cut-off header artifact
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const main = document.querySelector("main");
    if (main) {
      main.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, []);

  const classrooms = useMemo(
    () => classroomsQuery.data ?? [],
    [classroomsQuery.data],
  );
  const pendingPapers = useMemo(
    () => pendingQuery.data ?? [],
    [pendingQuery.data],
  );
  const students = summaryQuery.data?.topStudents ?? [];
  const topPerformers = useMemo(
    () => leaderboardQuery.data ?? [],
    [leaderboardQuery.data],
  );
  const topSchools = useMemo(
    () => schoolLeaderboardQuery.data ?? [],
    [schoolLeaderboardQuery.data],
  );
  const isLeaderboardLoading =
    leaderboardQuery.isLoading || schoolLeaderboardQuery.isLoading;

  const leaderboardEntries: TopStudentItem[] = topPerformers.map(
    (performer) => ({
      id: performer.id,
      name: performer.name || "Unknown",
      username: performer.username || "",
      points: performer.points || 0,
      profilePic: performer.profilePicture ?? undefined,
      schoolName: performer.schoolName || null,
      schoolLogo: performer.schoolLogo ?? null,
      classLevel: performer.class || null,
    }),
  );

  const schoolEntries: TopSchoolItem[] = topSchools.map((school) => ({
    id: school.id,
    name: school.name,
    points: school.points,
    studentCount: school.studentCount,
    logoUrl: school.logoUrl ?? null,
    city: school.city ?? null,
  }));

  const studentCount = summaryQuery.data?.studentCount ?? 0;
  const avgScore = summaryQuery.data?.avgScore ?? 0;
  const topStudents = students;
  const hasDashboardError =
    classroomsQuery.isError || pendingQuery.isError || summaryQuery.isError;

  const isDashboardLoading =
    !isReady ||
    (classroomsQuery.isLoading && !classroomsQuery.data) ||
    (summaryQuery.isLoading && !summaryQuery.data) ||
    (pendingQuery.isLoading && !pendingQuery.data) ||
    (leaderboardQuery.isLoading && !leaderboardQuery.data);

  if (isDashboardLoading) {
    return (
      <PageContainer className="flex min-h-[calc(100dvh-7rem)] items-center justify-center p-6">
        <AppLoader />
      </PageContainer>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "Teacher";

  const mobileTools = [
    { title: "Classrooms", href: FRONTEND_ROUTES.TEACHER_CLASSROOMS, icon: ClassroomSVG },
    { title: "Elections", href: FRONTEND_ROUTES.TEACHER_ELECTIONS, icon: VoteSVG },
    { title: "Students", href: FRONTEND_ROUTES.TEACHER_STUDENTS, icon: StudentsSVG },
    { title: "Activities", href: FRONTEND_ROUTES.TEACHER_ACTIVITIES, icon: HistorySVG },
    { title: "Syllabus", href: FRONTEND_ROUTES.TEACHER_CURRICULUMS, icon: SyllabusSVG },
    { title: "Paper 1", href: FRONTEND_ROUTES.TEACHER_PAST_PAPERS_1, icon: P1SVG },
    { title: "Paper 2", href: FRONTEND_ROUTES.TEACHER_PAST_PAPERS_2, icon: P2SVG },
    { title: "Create", href: FRONTEND_ROUTES.TEACHER_CREATE_PAPER, icon: GenerateSVG },
    { title: "Nova", href: FRONTEND_ROUTES.TEACHER_NOVA, icon: NovaSVG },
  ];

  const overviewCards = [
    {
      title: "Enrolled Students",
      value: summaryQuery.isLoading ? "…" : studentCount,
      subtitle: "Active in your classes",
      icon: StudentsSVG,
      href: FRONTEND_ROUTES.TEACHER_STUDENTS,
      cardBg: "bg-linear-to-br from-sidebar-from via-primary to-sidebar-to border-white/20 shadow-primary/20",
      badge: "Learners",
    },
    {
      title: "Classrooms",
      value: classroomsQuery.isLoading ? "…" : classrooms.length,
      subtitle: "Active teaching rooms",
      icon: ClassroomSVG,
      href: FRONTEND_ROUTES.TEACHER_CLASSROOMS,
      cardBg: "bg-linear-to-br from-sidebar-from via-primary to-sidebar-to border-white/20 shadow-primary/20",
      badge: "Rooms",
    },
    {
      title: "Pending Papers",
      value: pendingQuery.isLoading ? "…" : pendingPapers.length,
      subtitle: pendingQuery.isLoading ? "Loading grading queue" : pendingPapers.length > 0 ? "Awaiting manual grading" : "All submissions graded",
      icon: ReviewExamsSVG,
      href: FRONTEND_ROUTES.TEACHER_CLASSROOMS,
      cardBg: "bg-linear-to-br from-sidebar-from via-primary to-sidebar-to border-white/20 shadow-primary/20",
      badge: pendingPapers.length > 0 ? "Needs Review" : "All Graded",
    },
    {
      title: "Avg Student Score",
      value: summaryQuery.isLoading ? "…" : `${avgScore}%`,
      subtitle: "Overall student average",
      icon: TrendingUp,
      href: FRONTEND_ROUTES.TEACHER_STUDENTS,
      cardBg: "bg-linear-to-br from-sidebar-from via-primary to-sidebar-to border-white/20 shadow-primary/20",
      badge: "Class Avg",
    },
  ];

  const teacherConsoles = [
    {
      title: "Classroom Manager",
      badge: "Rooms",
      description: "Add subject × class rooms, invite students and manage cohorts.",
      href: FRONTEND_ROUTES.TEACHER_CLASSROOMS,
      icon: ClassroomSVG,
    },
    {
      title: "Student Elections",
      badge: "Public Voting",
      description: "Setup live voting ballots with public shareable links without login.",
      href: FRONTEND_ROUTES.TEACHER_ELECTIONS,
      icon: VoteSVG,
    },
    {
      title: "Student Directory",
      badge: "Learners",
      description: "Inspect student rosters, individual scores and grading reports.",
      href: FRONTEND_ROUTES.TEACHER_STUDENTS,
      icon: StudentsSVG,
    },
    {
      title: "Student Activities",
      badge: "Telemetry",
      description: "Real-time practice logs, study time and test attempts of your students.",
      href: FRONTEND_ROUTES.TEACHER_ACTIVITIES,
      icon: HistorySVG,
    },
    {
      title: "Create Exam Paper",
      badge: "SLO Builder",
      description: "Assemble custom Paper 1 or Paper 2 tests directly from SLOs.",
      href: FRONTEND_ROUTES.TEACHER_CREATE_PAPER,
      icon: GenerateSVG,
    },
    {
      title: "Curriculums & SLOs",
      badge: "Syllabus",
      description: "Browse board curriculum frameworks, chapters and learning outcomes.",
      href: FRONTEND_ROUTES.TEACHER_CURRICULUMS,
      icon: SyllabusSVG,
    },
    {
      title: "Past Papers 1",
      badge: "Objective MCQs",
      description: "Official board MCQs repository with verified automated keys.",
      href: FRONTEND_ROUTES.TEACHER_PAST_PAPERS_1,
      icon: P1SVG,
    },
    {
      title: "Past Papers 2",
      badge: "Theory & ATP",
      description: "Subjective past papers, diagrams and model marking schemes.",
      href: FRONTEND_ROUTES.TEACHER_PAST_PAPERS_2,
      icon: P2SVG,
      isBeta: true,
    },
    {
      title: "Nova AI Assistant",
      badge: "AI Co-pilot",
      description: "Draft lecture notes, generate test questions, and teach with Nova.",
      href: FRONTEND_ROUTES.TEACHER_NOVA,
      icon: NovaSVG,
    },
  ];

  return (
    <PageContainer className="space-y-0 p-0 lg:space-y-8 lg:px-8 lg:py-4 lg:pb-10">
      {hasDashboardError ? (
        <div role="alert" className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive lg:mx-0 lg:mt-0">
          <span>Some dashboard data could not load.</span>
          <AppButton
            size="sm"
            variant="outline"
            isLoading={classroomsQuery.isFetching || pendingQuery.isFetching || summaryQuery.isFetching}
            onClick={() => {
              if (classroomsQuery.isError) void classroomsQuery.refetch();
              if (pendingQuery.isError) void pendingQuery.refetch();
              if (summaryQuery.isError) void summaryQuery.refetch();
            }}
          >
            Retry
          </AppButton>
        </div>
      ) : null}
      <TeacherMobileDashboard
        firstName={firstName}
        studentCount={studentCount}
        classroomCount={classrooms.length}
        pendingCount={pendingPapers.length}
        avgScore={avgScore}
        tools={mobileTools}
        classrooms={classrooms}
        pendingPapers={pendingPapers}
        students={students}
        leaderboard={leaderboardEntries}
        schools={schoolEntries}
        isLeaderboardLoading={isLeaderboardLoading}
        isSummaryLoading={summaryQuery.isLoading}
        isClassroomsLoading={classroomsQuery.isLoading}
        isPendingLoading={pendingQuery.isLoading}
      />

      <div className="hidden space-y-7 px-4 sm:space-y-8 sm:px-6 lg:block lg:space-y-8 lg:px-0">
        {/* 1. Welcome & Teaching Assistant Hero Banner */}
        <WelcomeBanner
          name={firstName}
          icon={ClassroomSVG}
          showNova
          novaHref={FRONTEND_ROUTES.TEACHER_NOVA}
          novaMessage="Hi, I'm Nova — your teaching assistant."
          subtitle="Your teaching hub — manage classrooms, create papers, and track student progress in one place."
          centerContent={
            <DashboardBrandShowcase className="w-full max-w-[480px] lg:max-w-[500px] xl:max-w-[520px]" />
          }
          actions={
            <>
              <Link
                href={FRONTEND_ROUTES.TEACHER_CREATE_PAPER}
                className={cn(
                  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary-foreground px-5 text-sm font-semibold text-primary shadow-sm transition-transform",
                  "hover:-translate-y-0.5 sm:w-auto sm:text-xs sm:font-bold sm:uppercase sm:tracking-wider",
                )}
              >
                <GenerateSVG className="size-4" />
                Create Paper
              </Link>
              <Link
                href={FRONTEND_ROUTES.TEACHER_CLASSROOMS}
                className={cn(
                  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-5 text-sm font-semibold text-primary-foreground backdrop-blur-md transition-colors",
                  "hover:bg-primary-foreground/20 sm:w-auto sm:text-xs sm:font-bold sm:uppercase sm:tracking-wider",
                )}
              >
                <ClassroomSVG className="size-4" />
                Classrooms
              </Link>
            </>
          }
        />

        {/* 2. Top 3 Students & Schools Motivational Showcase */}
        <section className="pt-0.5">
          <TopStudentsShowcase
            students={leaderboardEntries}
            schools={schoolEntries}
            isLoading={isLeaderboardLoading}
            leaderboardHref={FRONTEND_ROUTES.TEACHER_LEADERBOARD}
          />
        </section>

        {/* 3. Teaching Stats & Metrics Overview (Themed Cards with Duotone Watermarks) */}
        <section className="space-y-3 sm:space-y-4">
          <div>
            <Typography className="text-base font-bold tracking-tight text-foreground sm:text-lg">
              Teaching Overview
            </Typography>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Key activity, enrollment and grading metrics at a glance
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {overviewCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className={cn(
                    "group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                    card.cardBg,
                  )}
                >
                  {/* Ambient Background Duotone Watermark & Glow */}
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                    <div className="absolute -top-[35%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[30px]" />
                    <div className="absolute -bottom-[35%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[25px]" />
                    <div className="absolute -right-3 -top-3 opacity-15 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-25">
                      <Icon className="size-24 sm:size-28 text-white" />
                    </div>
                  </div>

                  {/* Top row with frosted glass icon & badge */}
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 ring-1 ring-white/30 text-white backdrop-blur-md shadow-xs transition-transform duration-300 group-hover:scale-105">
                      <Icon className="size-5 sm:size-6 text-white" />
                    </div>
                    <span className="rounded-full bg-white/20 border border-white/25 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
                      {card.badge}
                    </span>
                  </div>

                  {/* Value & Labels */}
                  <div className="relative z-10 mt-3 sm:mt-4 min-w-0">
                    <p className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
                      {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
                    </p>
                    <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-white/95 truncate drop-shadow-xs">
                      {card.title}
                    </p>
                    <p className="mt-0.5 text-[10px] sm:text-[11px] font-medium text-white/80 truncate">
                      {card.subtitle}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 4. Teaching Tools Hub (Administrative Consoles Aesthetic on Large Screens) */}
        <section className="space-y-3 sm:space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <Typography className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                Teaching Tools
              </Typography>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Jump into classroom management, elections, paper creation, and syllabus frameworks
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {teacherConsoles.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.title}
                  href={tool.href}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl bg-primary p-4 sm:p-5 text-primary-foreground shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* Ambient Lighting & Dual Watermarks */}
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-br from-sidebar-from via-primary to-sidebar-to opacity-95 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="absolute -right-6 -top-8 size-36 rounded-full bg-white/10 blur-2xl transition-all duration-500 group-hover:bg-white/15" />
                    <div className="absolute -bottom-8 -left-6 size-32 rounded-full bg-black/20 blur-xl" />

                    {/* Ambient watermark icon */}
                    <div className="absolute -right-3 -top-1 opacity-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                      <Icon className="size-28" />
                    </div>
                  </div>

                  {/* Top Row with frosted icon container & badge */}
                  <div className="relative z-10 flex items-start justify-between gap-2">
                    <div className="flex size-11 sm:size-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-md shadow-xs transition-transform duration-300 group-hover:scale-105">
                      <Icon className="size-6 text-white" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {tool.isBeta && (
                        <span className="rounded-full bg-amber-400/30 border border-amber-300/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-200 backdrop-blur-sm">
                          Beta
                        </span>
                      )}
                      <span className="rounded-full bg-white/15 border border-white/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm shadow-xs">
                        {tool.badge}
                      </span>
                    </div>
                  </div>

                  {/* Middle Section: Title & Description */}
                  <div className="relative z-10 my-3.5 space-y-1">
                    <h4 className="text-base sm:text-lg font-black tracking-tight text-white leading-snug drop-shadow-xs">
                      {tool.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs font-medium text-white/80 leading-relaxed line-clamp-2">
                      {tool.description}
                    </p>
                  </div>

                  {/* Bottom Row: Explore Pill Button */}
                  <div className="relative z-10 flex items-center justify-between pt-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-primary shadow-xs transition-transform duration-200 group-hover:scale-105">
                      <span>Open</span>
                      <ArrowRight className="size-3" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 5. My Classrooms Section (Dedicated 4-Column Grid matching Teaching Overview & Tools) */}
        <section className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <Typography className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                My Classrooms
              </Typography>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Active subject classrooms, assigned tests, and student cohorts
              </p>
            </div>
            <Link
              href={FRONTEND_ROUTES.TEACHER_CLASSROOMS}
              className="group/link flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              <span>Manage all</span>
              <ArrowRight className="size-3 transition-transform group-hover/link:translate-x-0.5" />
            </Link>
          </div>

          {classrooms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card p-6 text-center shadow-xs">
              <ClassroomSVG className="mx-auto mb-2 size-8 text-primary" />
              <p className="font-bold text-foreground">No classrooms yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create a classroom to assign tests, syllabus chapters, and papers to your students.
              </p>
              <Link
                href={FRONTEND_ROUTES.TEACHER_CLASSROOMS}
                className="mt-3 inline-block"
              >
                <AppButton size="sm" className="rounded-full px-4 text-xs font-bold">
                  Create Classroom
                </AppButton>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
              {classrooms.slice(0, 4).map((c, index) => {
                const palette = getClassroomPalette(c.subject, c.name, index);
                const SubjectIcon = palette.icon;
                return (
                  <Link
                    key={c.id}
                    href={FRONTEND_ROUTES.TEACHER_CLASSROOM(c.id)}
                    className={cn(
                      "group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-5 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                      palette.gradient,
                      palette.border,
                    )}
                  >
                    {/* Ambient Lighting & Dual Watermarks */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                      <div className="absolute -top-[20%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[25px]" />
                      <div className="absolute -bottom-[20%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[30px]" />
                      <div
                        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
                        style={{
                          backgroundImage:
                            "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                          backgroundSize: "18px 18px",
                        }}
                      />
                      <SubjectIcon
                        aria-hidden
                        className="pointer-events-none absolute -bottom-2 -right-2 size-20 sm:size-24 text-white/15 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
                      />
                    </div>

                    {/* Top Row with frosted icon container & badges */}
                    <div className="relative z-10 flex items-start justify-between gap-2">
                      <div className="flex size-10 sm:size-11 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 border border-white/25 text-white backdrop-blur-md shadow-xs transition-transform duration-300 group-hover:scale-105">
                        <SubjectIcon className="size-5 sm:size-6 text-white" />
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className="rounded-full bg-white/20 border border-white/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
                          Class {c.classLevel}
                        </span>
                        {c.board ? (
                          <span className="rounded-full bg-white/15 border border-white/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white/95 backdrop-blur-md shadow-xs">
                            {c.board}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Middle Section: Title & Description */}
                    <div className="relative z-10 my-3 space-y-0.5">
                      <h4 className="text-base sm:text-lg font-black tracking-tight text-white leading-snug drop-shadow-xs">
                        {c.name && !c.name.includes("__") ? c.name : c.subject}
                      </h4>
                      <p className="text-xs font-medium text-white/85 truncate drop-shadow-2xs">
                        {c.name && !c.name.includes("__") && c.name !== c.subject
                          ? `${c.subject} · Class ${c.classLevel}`
                          : `Class ${c.classLevel} · ${c.board || "AKUEB"}`}
                      </p>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="relative z-10 flex items-center justify-between border-t border-white/20 pt-2.5">
                      <span className="text-xs font-bold text-white/90">
                        {c.paperCount ?? 0} paper{(c.paperCount ?? 0) === 1 ? "" : "s"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/20 border border-white/25 px-3 py-1 text-[11px] font-black text-white backdrop-blur-md transition-all duration-200 group-hover:bg-white group-hover:text-primary shadow-xs">
                        OPEN <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* 6. Pending Grading & Top Students Workstation Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8 items-stretch">
          {/* Left Column: Pending Grading */}
          <div className="flex flex-col gap-3 sm:gap-4 h-full">
            <div className="flex min-h-[44px] items-center justify-between px-1">
              <div>
                <Typography className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                  Pending grading
                </Typography>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Exam submissions awaiting manual score evaluation
                </p>
              </div>
              {pendingPapers.length > 0 ? (
                <Link
                  href={FRONTEND_ROUTES.TEACHER_CLASSROOMS}
                  className="group/link flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  <span>Review all</span>
                  <ArrowRight className="size-3 transition-transform group-hover/link:translate-x-0.5" />
                </Link>
              ) : (
                <Link
                  href={FRONTEND_ROUTES.TEACHER_CLASSROOMS}
                  className="group/link flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  <span>Classrooms</span>
                  <ArrowRight className="size-3 transition-transform group-hover/link:translate-x-0.5" />
                </Link>
              )}
            </div>

            {pendingPapers.length === 0 ? (
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-linear-to-br from-sidebar-from via-primary to-sidebar-to text-white p-6 sm:p-7 pb-0 sm:pb-0 shadow-lg flex flex-col justify-between flex-1 border border-white/10 group transition-all duration-300 hover:shadow-xl">
                {/* Ambient Atmospheric Lighting & Geometric Glow */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div className="absolute -right-8 -top-8 size-48 rounded-full bg-white/10 blur-3xl" />
                  <div className="absolute -bottom-10 -left-10 size-40 rounded-full bg-emerald-400/20 blur-3xl" />
                  <div
                    className="absolute inset-0 opacity-[0.12]"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
                      backgroundSize: "16px 16px",
                    }}
                  />
                  {/* Subtle watermark background icon */}
                  <div className="absolute -right-4 -bottom-6 opacity-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                    <ReviewExamsSVG className="size-48 text-white" />
                  </div>
                </div>

                {/* Top Badge Row */}
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 border border-white/25 px-3 py-1 text-xs font-bold text-white shadow-xs backdrop-blur-md">
                    <CheckCircleSVG className="size-3.5 text-emerald-300" />
                    <span>Grading Backlog Cleared</span>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-100 backdrop-blur-sm shadow-xs">
                    0 Submissions
                  </span>
                </div>

                {/* Center Content + Nova AI Mascot Hero Section */}
                <div className="relative z-10 mt-auto grid grid-cols-1 sm:grid-cols-12 gap-4 items-end pt-2">
                  <div className="sm:col-span-7 md:col-span-7 space-y-2 pb-6 sm:pb-7">
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-xs">
                      All Caught Up!
                    </h3>
                    <p className="text-xs sm:text-sm font-medium leading-relaxed text-white/85">
                      No Paper 2 submissions are currently waiting for manual evaluation. You&apos;re completely up to date with your students!
                    </p>

                    {/* Quick Shortcut Buttons */}
                    <div className="pt-2.5 flex flex-wrap items-center gap-2.5">
                      <Link
                        href={FRONTEND_ROUTES.TEACHER_CREATE_PAPER}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white text-primary px-3.5 py-2 text-xs font-bold shadow-md transition-all duration-200 hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <SparklesSVG className="size-3.5 text-primary" />
                        <span>Create Paper</span>
                      </Link>
                      <Link
                        href={FRONTEND_ROUTES.TEACHER_ACTIVITIES}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 border border-white/25 px-3.5 py-2 text-xs font-bold text-white shadow-xs backdrop-blur-md transition-all duration-200 hover:bg-white/25 hover:scale-[1.02]"
                      >
                        <span>Student Activity</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Nova Mascot Hero Graphic - Positioned Flush to Bottom */}
                  <div className="sm:col-span-5 md:col-span-5 flex flex-col items-center justify-end self-end">
                    <Link
                      href={FRONTEND_ROUTES.TEACHER_NOVA}
                      className="group/nova relative flex flex-col items-center justify-end"
                      title="Chat with Nova AI Assistant"
                    >
                      {/* Floating Speech Pill above Nova */}
                      <span className="relative z-20 mb-1 max-w-36 rounded-2xl border border-white/35 bg-white/25 px-2.5 py-1 text-center text-[10px] font-extrabold leading-snug text-white shadow-md backdrop-blur-md transition-transform group-hover/nova:scale-105">
                        Queue clear! ✨
                        <span
                          aria-hidden
                          className="absolute left-1/2 top-full size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-white/35 bg-white/25"
                        />
                      </span>

                      {/* Ambient Halo & Character Image */}
                      <div className="relative flex items-end justify-center">
                        <div className="absolute inset-0 size-36 -m-2 rounded-full bg-white/20 blur-2xl animate-pulse" />
                        <div className="relative h-44 w-36 sm:h-52 sm:w-44 md:h-56 md:w-48 drop-shadow-2xl transition-transform duration-300 group-hover/nova:scale-105">
                          <Image
                            src="/nova-tutor.webp"
                            alt="Nova AI Tutor"
                            fill
                            priority
                            sizes="(min-width: 768px) 192px, (min-width: 640px) 176px, 144px"
                            className="object-contain object-bottom"
                          />
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-border/60 bg-card shadow-xs divide-y divide-border/40 flex flex-col justify-between flex-1">
                {pendingPapers.slice(0, 5).map((paper) => (
                  <Link
                    key={paper.id}
                    href={FRONTEND_ROUTES.TEACHER_CHECK_PAPER(paper.id)}
                    className="group flex flex-1 items-center justify-between p-3.5 transition-all hover:bg-primary/5 sm:px-4 sm:py-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3.5">
                      <UserAvatar
                        src={paper.student_image}
                        name={paper.student_name}
                        id={paper.id}
                        size={40}
                        className="size-10 shrink-0 rounded-xl border border-border"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground group-hover:text-primary sm:text-sm">
                          {formatCapitalizeWords(paper.student_name)}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {paper.classroom_name ? `${paper.classroom_name} · ` : ""}
                          {paper.subject} · Paper 2
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 pl-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        Grade
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Top Students */}
          <div className="flex flex-col gap-3 sm:gap-4 h-full">
            <div className="flex min-h-[44px] items-center justify-between px-1">
              <div>
                <Typography className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                  Top Students
                </Typography>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Highest scoring performers across your classrooms
                </p>
              </div>
              <Link
                href={FRONTEND_ROUTES.TEACHER_STUDENTS}
                className="group/link flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <span>View all</span>
                <ArrowRight className="size-3 transition-transform group-hover/link:translate-x-0.5" />
              </Link>
            </div>

            {topStudents.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-border/60 bg-card p-6 sm:p-8 text-center shadow-xs min-h-[300px]">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                  <StudentsSVG className="size-7 text-primary" />
                </div>
                <p className="mt-3.5 text-base font-bold text-foreground">No students yet</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                  Students will appear here once they complete exam papers.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-border/60 bg-card shadow-xs divide-y divide-border/40 flex flex-col justify-between flex-1">
                {topStudents.map((student, idx) => (
                  <Link
                    key={student.id}
                    href={FRONTEND_ROUTES.TEACHER_STUDENT_REPORT(student.id)}
                    className="group flex flex-1 items-center justify-between p-3.5 transition-all hover:bg-primary/5 sm:px-4 sm:py-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-black",
                          idx === 0
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                            : idx === 1
                              ? "bg-slate-500/20 text-slate-600 dark:text-slate-400"
                              : idx === 2
                                ? "bg-amber-700/20 text-amber-700 dark:text-amber-500"
                                : "bg-muted text-muted-foreground",
                        )}
                      >
                        #{idx + 1}
                      </span>
                      <UserAvatar
                        src={student.profile_image}
                        name={student.name}
                        id={student.id}
                        size={36}
                        className="size-9 shrink-0 rounded-full border border-border"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground group-hover:text-primary sm:text-sm">
                          {formatCapitalizeWords(student.name)}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground sm:text-[11px]">
                          Class {student.class || "—"} · {student.attempts_count} attempts
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 pl-2 text-right">
                      <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                        {Math.round(Number(student.avg_score || 0))}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
