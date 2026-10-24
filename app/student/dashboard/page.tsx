"use client";

import StarSVG from "@/public/svgs/StarSVG";
import ClassroomSVG from "@/public/svgs/ClassroomSVG";
import GenerateSVG from "@/public/svgs/GenerateSVG";
import { useEffect, useState } from "react";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import SyllabusSVG from "@/public/svgs/SyllabusSVG";
import LeaderboardSVG from "@/public/svgs/LeaderboardSVG";
import HistorySVG from "@/public/svgs/HistorySVG";
import LabGameSVG from "@/public/svgs/LabGameSVG";
import ChallengeSVG from "@/public/svgs/ChallengeSVG";
import NovaSVG from "@/public/svgs/NovaSVG";
import P1SVG from "@/public/svgs/P1SVG";
import P2SVG from "@/public/svgs/P2SCG";
import PracticalJournalSVG from "@/public/svgs/PracticalJournalSVG";
import QuizzesSVG from "@/public/svgs/QuizzesSVG";
import SearchSVG from "@/public/svgs/SearchSVG";
import PageContainer from "@/components/PageContainer";
import Link from "next/link";
import AppButton from "@/components/AppButton";
import { BetaBanner } from "@/components/landing/BetaBanner";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import TopStudentsShowcase, { type TopStudentItem, type TopSchoolItem } from "@/components/dashboard/TopStudentsShowcase";
import DashboardBrandShowcase from "@/components/dashboard/DashboardBrandShowcase";
import DashboardStats from "./components/DashboardStats";
import QuickAccess from "./components/QuickAccess";
import DashboardAnalytics from "./components/DashboardAnalytics";
import DashboardRecentActivity from "./components/DashboardRecentActivity";
import DashboardPastPapers from "./components/DashboardPastPapers";
import StudentMobileDashboard from "./components/StudentMobileDashboard";
import StudentDashboardLoader from "@/components/dashboard/StudentDashboardLoader";
import { useStoredUser } from "@/hooks/useStoredUser";
import { useDashboardOverview } from "@/hooks/student/useDashboardOverview";
import { useUserProfile } from "@/hooks/user/useUserProfile";
import { cn } from "@/lib/utils";

export default function StudentDashboardPage() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const { user, isReady } = useStoredUser();
  const profileQuery = useUserProfile();
  const overviewQuery = useDashboardOverview(user?.id);

  const topPerformers = overviewQuery.data?.students ?? [];
  const topSchools = overviewQuery.data?.schools ?? [];
  const recentActivities = overviewQuery.data?.history ?? [];
  const pastPapers = overviewQuery.data?.pastPapers ?? [];
  const livePoints = profileQuery.data?.points ?? user?.points ?? 0;

  const rank = overviewQuery.data?.rank ?? null;

  const isDashboardLoading =
    isMobile === null ||
    !isReady ||
    (!user && profileQuery.isLoading) ||
    (Boolean(user?.id) && overviewQuery.isLoading && !overviewQuery.data);

  if (isDashboardLoading) {
    return <StudentDashboardLoader />;
  }

  const hasDashboardError =
    (overviewQuery.isError && !overviewQuery.data) ||
    (profileQuery.isError && !profileQuery.data && !user);

  const firstName = user?.name?.split(" ")[0] || "Student";

  const mobileTools = [
    { title: "Syllabus", href: FRONTEND_ROUTES.STUDENT_CURRICULUMS, icon: SyllabusSVG },
    { title: "Paper 1", href: FRONTEND_ROUTES.STUDENT_PAST_PAPERS_1, icon: P1SVG },
    { title: "Paper 2", href: FRONTEND_ROUTES.STUDENT_PAST_PAPERS_2, icon: P2SVG },
    { title: "Generate", href: FRONTEND_ROUTES.STUDENT_GENERATE, icon: GenerateSVG },
    { title: "Nova", href: FRONTEND_ROUTES.STUDENT_NOVA, icon: NovaSVG },
    { title: "Challenge", href: FRONTEND_ROUTES.STUDENT_CHALLENGE, icon: ChallengeSVG },
    { title: "Lab", href: FRONTEND_ROUTES.STUDENT_LAB_GAME, icon: LabGameSVG },
    { title: "History", href: FRONTEND_ROUTES.STUDENT_HISTORY, icon: HistorySVG },
    { title: "Ranks", href: FRONTEND_ROUTES.STUDENT_LEADERBOARD, icon: LeaderboardSVG },
    { title: "Journals", href: FRONTEND_ROUTES.STUDENT_PRACTICAL_JOURNALS, icon: PracticalJournalSVG },
    { title: "Quizzes", href: FRONTEND_ROUTES.STUDENT_CUSTOM_QUIZZES, icon: QuizzesSVG },
    { title: "Search", href: FRONTEND_ROUTES.STUDENT_FRIENDS, icon: SearchSVG },
  ];

  const studyConsoles = [
    {
      title: "Curriculum Syllabus",
      badge: "Syllabus",
      description: "Chapter-wise SLO learning outcomes, topics & mastery tracking.",
      href: FRONTEND_ROUTES.STUDENT_CURRICULUMS,
      icon: SyllabusSVG,
    },
    {
      title: "Past Papers 1",
      badge: "Objective MCQs",
      description: "Timed board past paper practice with instant automated scoring.",
      href: FRONTEND_ROUTES.STUDENT_PAST_PAPERS_1,
      icon: P1SVG,
    },
    {
      title: "Past Papers 2",
      badge: "Theory & ATP",
      description: "Subjective past papers with marking schemes and diagrams.",
      href: FRONTEND_ROUTES.STUDENT_PAST_PAPERS_2,
      icon: P2SVG,
      isBeta: true,
    },
    {
      title: "Generate AI Papers",
      badge: "Adaptive",
      description: "Generate customized practice papers tailored to your weak areas.",
      href: FRONTEND_ROUTES.STUDENT_GENERATE,
      icon: GenerateSVG,
    },
    {
      title: "Nova AI Tutor",
      badge: "24/7 AI",
      description: "Interactive AI tutor to explain tricky concepts and step-by-step solutions.",
      href: FRONTEND_ROUTES.STUDENT_NOVA,
      icon: NovaSVG,
    },
    {
      title: "Battle Arena",
      badge: "Live PVP",
      description: "Timed challenge battles and head-to-head quizzes with classmates.",
      href: FRONTEND_ROUTES.STUDENT_CHALLENGE,
      icon: ChallengeSVG,
    },
    {
      title: "Virtual Lab Game",
      badge: "Simulations",
      description: "Gamified practical experiments and science laboratory simulations.",
      href: FRONTEND_ROUTES.STUDENT_LAB_GAME,
      icon: LabGameSVG,
    },
    {
      title: "Leaderboard & Ranks",
      badge: "Standings",
      description: "Check your provincial standings, school rankings, and points.",
      href: FRONTEND_ROUTES.STUDENT_LEADERBOARD,
      icon: LeaderboardSVG,
    },
  ];

  const statsGrid = [
    {
      label: "Total Score",
      value: livePoints.toLocaleString(),
      subtitle: "All-time progress points",
      icon: StarSVG,
      cardBg: "bg-linear-to-br from-sidebar-from via-primary to-sidebar-to border-white/20 shadow-primary/20",
      badge: "Points",
    },
    {
      label: "Current Rank",
      value: rank !== null ? `#${rank}` : "—",
      subtitle: "Among active students",
      icon: LeaderboardSVG,
      cardBg: "bg-linear-to-br from-sidebar-from via-primary to-sidebar-to border-white/20 shadow-primary/20",
      badge: "Standing",
    },
    {
      label: "Recent Tests",
      value: Math.max(0, recentActivities.length).toString(),
      subtitle: "Completed exam attempts",
      icon: HistorySVG,
      cardBg: "bg-linear-to-br from-sidebar-from via-primary to-sidebar-to border-white/20 shadow-primary/20",
      badge: "Attempts",
    },
    {
      label: "Class Cohort",
      value: user?.class ? `Class ${user.class}` : "—",
      subtitle: "Academic grade level",
      icon: ClassroomSVG,
      cardBg: "bg-linear-to-br from-sidebar-from via-primary to-sidebar-to border-white/20 shadow-primary/20",
      badge: "Enrolled",
    },
  ];

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

  return (
    <>
      <BetaBanner />
      <PageContainer className="space-y-0 p-0 lg:space-y-6 lg:px-8 lg:pt-6 lg:pb-8">
        {hasDashboardError ? (
          <div role="alert" className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive lg:mx-0 lg:mt-0">
            <span>Some dashboard data could not load. Please check your internet connection.</span>
            <AppButton
              size="sm"
              variant="outline"
              isLoading={profileQuery.isFetching || overviewQuery.isFetching}
              onClick={() => {
                if (profileQuery.isError) void profileQuery.refetch();
                if (overviewQuery.isError) void overviewQuery.refetch();
              }}
            >
              Retry
            </AppButton>
          </div>
        ) : null}
      {isMobile ? <StudentMobileDashboard
          firstName={firstName}
          points={livePoints}
          rank={rank}
          classLevel={user?.class ? String(user.class) : null}
          currentUserId={user?.id}
          tools={mobileTools}
          leaderboard={leaderboardEntries}
          schools={schoolEntries}
          recentHistory={recentActivities}
          pastPapers={pastPapers}
        /> : null}

        {!isMobile ? <div className="space-y-6">
          <WelcomeBanner
            name={firstName}
            icon={ClassroomSVG}
            showNova
            subtitle="Track your progress, practice papers, and climb the leaderboard — all in one place."
            stats={[
              { label: "Points", value: livePoints.toLocaleString() },
              { label: "Rank", value: rank !== null ? `#${rank}` : "—" },
              { label: "Class", value: user?.class ? String(user.class) : "—" },
            ]}
            centerContent={
              <DashboardBrandShowcase className="w-full max-w-[480px] lg:max-w-[500px] xl:max-w-[520px]" />
            }
            actions={
              <>
                <Link
                  href={FRONTEND_ROUTES.STUDENT_GENERATE}
                  className={cn(
                    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary-foreground px-5 text-sm font-semibold text-primary shadow-sm transition-transform",
                    "hover:-translate-y-0.5 sm:w-auto sm:text-xs sm:font-bold sm:uppercase sm:tracking-wider",
                  )}
                >
                  <GenerateSVG className="size-4" />
                  Generate Papers
                </Link>
                <Link
                  href={FRONTEND_ROUTES.STUDENT_CURRICULUMS}
                  className={cn(
                    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-5 text-sm font-semibold text-primary-foreground backdrop-blur-md transition-colors",
                    "hover:bg-primary-foreground/20 sm:w-auto sm:text-xs sm:font-bold sm:uppercase sm:tracking-wider",
                  )}
                >
                  <SyllabusSVG className="size-4" />
                  View Syllabus
                </Link>
              </>
            }
          />

          {/* Top 3 Students & Schools Showcase */}
          <section className="pt-1">
            <TopStudentsShowcase
              students={leaderboardEntries}
              schools={schoolEntries}
            />
          </section>

          {/* Study Tools Quick Access */}
          <QuickAccess cards={studyConsoles} />

          {/* Progress Stats Summary */}
          <div className="hidden sm:block">
            <DashboardStats stats={statsGrid} />
          </div>

          {/* Analytics & Performance Charts */}
          <DashboardAnalytics recentHistory={recentActivities} rank={rank} />

          {/* Recent Activity & Past Papers Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch">
            <DashboardRecentActivity recentHistory={recentActivities} />
            <DashboardPastPapers pastPapers={pastPapers} />
          </div>
        </div> : null}
      </PageContainer>
    </>
  );
}
