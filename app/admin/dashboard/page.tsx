"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { FRONTEND_ROUTES, API_ENDPOINTS } from "@/constants/endpoints";
import AppButton from "@/components/AppButton";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppLoader from "@/components/AppLoader";
import AppState from "@/components/AppState";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import DashboardBrandShowcase from "@/components/dashboard/DashboardBrandShowcase";
import TopStudentsShowcase, { type TopStudentItem, type TopSchoolItem } from "@/components/dashboard/TopStudentsShowcase";
import StatsOverview from "@/components/admin/StatsOverview";
import AdminConsolesGrid from "@/components/admin/AdminConsolesGrid";
import GradingQueueSummary from "@/components/admin/GradingQueueSummary";
import LiveSubmissionsChart from "@/components/admin/LiveSubmissionsChart";
import QuestionBankAnalyticsCard from "@/components/admin/QuestionBankAnalyticsCard";
import ClassDistribution from "@/components/admin/ClassDistribution";
import BoardDistribution from "@/components/admin/BoardDistribution";
import RecentReviewQueuePanel from "@/components/admin/RecentReviewQueuePanel";
import GrowthAndSchoolCharts, { type GrowthPoint, type SchoolActivityPoint } from "@/components/admin/GrowthAndSchoolCharts";
import ReviewExamsSVG from "@/public/svgs/ReviewExamsSVG";
import LeaderboardSVG from "@/public/svgs/LeaderboardSVG";
import AddSVG from "@/public/svgs/AddSVG";
import { useStoredUser } from "@/hooks/useStoredUser";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { apiGet } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { Typography } from "@/components/ui/Typography";
import { formatCapitalizeWords } from "@/lib/utils";

type AdminDashboardStats = {
  overview: {
    totalStudents: number;
    totalSchools: number;
    activeStudents: number;
  };
  classDistribution: { name: string; value: number }[];
  boardDistribution: { name: string; value: number }[];
  gradingQueue: {
    pendingManual: number;
    pendingAI: number;
    graded: number;
    failed: number;
    total: number;
  };
  submissionsTimeline: {
    day: string;
    pendingManual: number;
    pendingAI: number;
    graded: number;
    failed: number;
  }[];
  questionBank: {
    totalQuestions: number;
    paper1Questions: number;
    paper2Questions: number;
    questionsWithImages: number;
  };
  leaderboards: {
    students: Array<{
      id: string;
      name: string;
      schoolName?: string;
      schoolLogo?: string | null;
      class?: string;
      points: number;
      profilePic?: string | null;
    }>;
    schools: Array<{
      id?: string;
      name: string;
      studentCount?: number;
      points: number;
      logoUrl?: string | null;
      city?: string | null;
    }>;
  };
  recentQueue: Array<{
    id: string;
    user_id?: string;
    student_name: string;
    student_email: string;
    student_profile_image?: string | null;
    subject: string;
    score: number | null;
    total_marks: number | null;
    grading_status: string;
    created_at: string;
  }>;
  growthTimeline: GrowthPoint[];
  schoolActivity: SchoolActivityPoint[];
  engagement: { practicing7d: number; practicing30d: number; repeat30d: number };
};

function SectionTitle({
  children,
  subtitle,
  action,
}: {
  children: ReactNode;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
      <div>
        <Typography
          variant="h3"
          className="text-base font-bold tracking-tight sm:text-lg text-foreground"
        >
          {children}
        </Typography>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useStoredUser();

  const {
    data: stats,
    isLoading,
    isError,
    error,
  } = useApiQuery<AdminDashboardStats>({
    queryKey: queryKeys.admin.dashboardStats(),
    queryFn: () =>
      apiGet<AdminDashboardStats>(API_ENDPOINTS.ADMIN.DASHBOARD_STATS),
    retry: false,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <PageContainer>
        <AppLoader />
      </PageContainer>
    );
  }

  if (isError || !stats) {
    return (
      <PageContainer>
        <AppState
          variant="error"
          title="Failed to load dashboard"
          description={
            error instanceof Error ? error.message : "Please try again."
          }
          icon={LeaderboardSVG}
          fullScreen={false}
        />
      </PageContainer>
    );
  }

  const pendingTotal =
    (stats?.gradingQueue?.pendingManual ?? 0) + (stats?.gradingQueue?.pendingAI ?? 0);

  const topStudentsList: TopStudentItem[] = (stats?.leaderboards?.students || []).map((s, idx) => ({
    id: s.id || `student-${idx}`,
    name: s.name,
    points: s.points ?? 0,
    schoolName: s.schoolName ?? null,
    schoolLogo: s.schoolLogo ?? null,
    classLevel: s.class ?? null,
    profilePic: s.profilePic ?? null,
  }));

  const topSchoolsList: TopSchoolItem[] = (stats?.leaderboards?.schools || []).map((sc, idx) => ({
    id: sc.id || `school-${idx}`,
    name: sc.name,
    points: sc.points ?? 0,
    studentCount: sc.studentCount ?? 0,
    logoUrl: sc.logoUrl ?? null,
    city: sc.city ?? "Karachi",
  }));

  const safeOverview = {
    totalStudents: Number(stats?.overview?.totalStudents || 0),
    totalSchools: Number(stats?.overview?.totalSchools || 0),
    activeStudents: Number(stats?.overview?.activeStudents || 0),
  };

  const safeQuestionBank = {
    totalQuestions: Number(stats?.questionBank?.totalQuestions || 0),
    paper1Questions: Number(stats?.questionBank?.paper1Questions || 0),
    paper2Questions: Number(stats?.questionBank?.paper2Questions || 0),
    questionsWithImages: Number(stats?.questionBank?.questionsWithImages || 0),
  };

  const safeGradingQueue = {
    pendingManual: Number(stats?.gradingQueue?.pendingManual || 0),
    pendingAI: Number(stats?.gradingQueue?.pendingAI || 0),
    graded: Number(stats?.gradingQueue?.graded || 0),
    failed: Number(stats?.gradingQueue?.failed || 0),
    total: Number(stats?.gradingQueue?.total || 0),
  };

  const safeSubmissionsTimeline = stats?.submissionsTimeline ?? [];
  const safeClassDistribution = stats?.classDistribution ?? [];
  const safeBoardDistribution = stats?.boardDistribution ?? [];
  const safeRecentQueue = stats?.recentQueue ?? [];

  return (
    <PageContainer className="min-w-0 pb-8 sm:pb-12">
      <PageHeader
        title="Administrative Hub"
        description="Comprehensive platform management, institutional rankings, question curation, and live examination analytics."
        showLine
      />

      <div className="space-y-6 sm:space-y-8 lg:space-y-10">
        {/* Mobile Notice Board */}
        <div className="lg:hidden flex justify-center w-full">
          <DashboardBrandShowcase className="w-full max-w-[480px]" />
        </div>

        {/* ================= 1. Modern Edge-to-Edge Welcome Banner ================= */}
        <WelcomeBanner
          name={formatCapitalizeWords(user?.name) || "Administrator"}
          subtitle="Manage institutional curriculums, question banks, student registrations, and real-time grading analytics across all boards."
          icon={ReviewExamsSVG}
          showNova={true}
          novaHref={FRONTEND_ROUTES.ADMIN_REVIEW_EXAMS}
          novaMessage={
            pendingTotal > 0
              ? `Review queue: ${pendingTotal} exam submissions awaiting scoring.`
              : "All exam submissions are graded and up to date!"
          }
          stats={[
            {
              label: "Total Students",
              value: (safeOverview.totalStudents || 0).toLocaleString(),
            },
            {
              label: "Practiced Today",
              value: (safeOverview.activeStudents || 0).toLocaleString(),
            },
            {
              label: "Institutes",
              value: (safeOverview.totalSchools || 0).toLocaleString(),
            },
          ]}
          centerContent={
            <DashboardBrandShowcase className="w-full max-w-[480px] lg:max-w-[500px] xl:max-w-[520px]" />
          }
          actions={
            <>
              <AppButton
                onClick={() => router.push(FRONTEND_ROUTES.ADMIN_REVIEW_EXAMS)}
                className="rounded-xl px-4 py-2 font-bold shadow-md bg-white text-primary hover:bg-white/90 cursor-pointer"
              >
                <ReviewExamsSVG className="mr-2 size-4" />
                <span>Review Queue ({pendingTotal})</span>
              </AppButton>
              <AppButton
                variant="outline"
                onClick={() => router.push(FRONTEND_ROUTES.ADMIN_UPLOAD_PAST_PAPER)}
                className="rounded-xl border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 px-4 py-2 font-semibold cursor-pointer"
              >
                <AddSVG className="mr-2 size-4" />
                <span>Upload Paper</span>
              </AppButton>
            </>
          }
        />

        {/* ================= 2. Platform Vitals KPI Cards ================= */}
        <section>
          <SectionTitle subtitle="Core user engagement, institution registration, and question inventory numbers.">
            Platform Vitals
          </SectionTitle>
          <StatsOverview
            stats={{
              ...safeOverview,
              totalQuestions: safeQuestionBank.totalQuestions,
            }}
          />
        </section>

        <section>
          <SectionTitle subtitle="Compare student acquisition, exam practice, and school adoption.">
            Growth & School Adoption
          </SectionTitle>
          <GrowthAndSchoolCharts growth={stats.growthTimeline ?? []} schools={stats.schoolActivity ?? []} engagement={stats.engagement ?? { practicing7d: 0, practicing30d: 0, repeat30d: 0 }} />
        </section>

        {/* ================= 3. Top Performers & Institutional Showcase ================= */}
        <section>
          <TopStudentsShowcase
            students={topStudentsList}
            schools={topSchoolsList}
            leaderboardHref={FRONTEND_ROUTES.ADMIN_LEADERBOARD}
          />
        </section>

        {/* ================= 4. Administrative Consoles (Past-Paper Signature Cards) ================= */}
        <section>
          <SectionTitle subtitle="Direct gateways to curriculum frameworks, past examinations, question repositories, and grading tools.">
            Administrative Consoles
          </SectionTitle>
          <AdminConsolesGrid />
        </section>

        {/* ================= 5. Grading Pipeline Stream ================= */}
        <section>
          <SectionTitle
            subtitle="Live Paper II evaluation pipeline, automated AI scoring status, and instructor manual reviews."
            action={
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                <span>Live Sync</span>
              </div>
            }
          >
            Grading Pipeline Stream
          </SectionTitle>
          <GradingQueueSummary data={safeGradingQueue} />
        </section>

        {/* ================= 6. Examination Analytics & Question Bank Stream ================= */}
        <section>
          <SectionTitle subtitle="Live candidate submission trends, evaluation turnaround, and question repository snapshot.">
            Examination Analytics
          </SectionTitle>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:gap-5">
            <LiveSubmissionsChart data={safeSubmissionsTimeline} />
            <QuestionBankAnalyticsCard data={safeQuestionBank} />
          </div>
        </section>

        {/* ================= 6. Student Demographics & Board Enrollments ================= */}
        <section>
          <SectionTitle subtitle="Candidate distribution across educational classes and affiliated examination boards.">
            Demographics & Enrollment
          </SectionTitle>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
            <ClassDistribution data={safeClassDistribution} />
            <BoardDistribution data={safeBoardDistribution} />
          </div>
        </section>

        {/* ================= 7. Latest Review Queue Stream ================= */}
        <section>
          <RecentReviewQueuePanel
            items={safeRecentQueue}
            pendingTotal={pendingTotal}
            onOpenReviewExams={() =>
              router.push(FRONTEND_ROUTES.ADMIN_REVIEW_EXAMS)
            }
          />
        </section>
      </div>
    </PageContainer>
  );
}
