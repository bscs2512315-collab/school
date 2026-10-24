"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { Typography } from "@/components/ui/Typography";
import AppDropdown from "@/components/AppDropdown";
import { AppPagination } from "@/components/AppPagination";
import UserAvatar from "@/components/UserAvatar";
import apiInstance from "@/lib/api-instance";
import toast from "react-hot-toast";
import { cn, formatCapitalizeWords, formatSchoolName, formatEmail } from "@/lib/utils";
import {
  Search,
  RefreshCw,
  ArrowRight,
  X,
  BarChart3,
  PieChart,
  Check,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// Duotone SVGs from Design System
import ReviewExamsSVG from "@/public/svgs/ReviewExamsSVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import StudentsSVG from "@/public/svgs/StudentsSVG";
import TrophySVG from "@/public/svgs/TrophySVG";
import CrownSVG from "@/public/svgs/CrownSVG";
import MedalSVG from "@/public/svgs/MedalSVG";
import StarSVG from "@/public/svgs/StarSVG";
import BuildingSVG from "@/public/svgs/BuildingSVG";
import NovaSVG from "@/public/svgs/NovaSVG";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import ClassroomSVG from "@/public/svgs/ClassroomSVG";
import AppLoader from "@/components/AppLoader";
import ZapSVG from "@/public/svgs/ZapSVG";
import P1SVG from "@/public/svgs/P1SVG";
import P2SCG from "@/public/svgs/P2SCG";
import GenerateSVG from "@/public/svgs/GenerateSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import HistorySVG from "@/public/svgs/HistorySVG";

interface ActivityUser {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage: string | null;
  schoolName: string;
  class: string | null;
  board: string | null;
}

interface ActivityItem {
  id: string;
  activityType: string;
  title: string;
  subject: string;
  score: number | null;
  totalMarks: number | null;
  percentage: number | null;
  timeTakenSeconds: number;
  timeTakenFormatted: string;
  gradingStatus: string | null;
  createdAt: string;
  user: ActivityUser;
}

interface TimelinePoint {
  day: string;
  label: string;
  activityCount: number;
  activeMinutes: number;
  activeHours: number;
  uniqueUsers: number;
}

interface CategoryStat {
  activityType: string;
  count: number;
  totalSeconds: number;
  totalMinutes: number;
}

interface RoleStat {
  role: string;
  activityCount: number;
  userCount: number;
  totalMinutes: number;
  totalHours: number;
}

interface TopUser {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage: string | null;
  schoolName: string;
  class: string | null;
  board: string | null;
  points: number;
  totalActivities: number;
  totalActiveMinutes: number;
  totalActiveHours: number;
  totalActiveFormatted: string;
  lastActiveAt: string;
}

interface AnalyticsOverview {
  totalActivities: number;
  totalActiveSeconds: number;
  totalActiveHours: string;
  totalActiveTimeFormatted: string;
  activeUsersCount: number;
  avgSessionMinutes: number;
  todayActivitiesCount: number;
  todayActiveMinutes: number;
  todayActiveTimeFormatted: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const ROLE_FILTER_OPTIONS = [
  { value: "ALL", label: "All Roles" },
  { value: "STUDENT", label: "Students" },
  { value: "TEACHER", label: "Teachers" },
  { value: "SCHOOL", label: "Institutes" },
  { value: "ADMIN", label: "Admins" },
];

const ACTIVITY_TYPE_OPTIONS = [
  { value: "ALL", label: "All Activities" },
  { value: "PAPER1", label: "Past Paper 1 (MCQs)" },
  { value: "PAPER2", label: "Past Paper 2 (Theory)" },
  { value: "GENERATED", label: "AI Mock Exams" },
  { value: "GENERATED_BUILD", label: "Paper Generations" },
  { value: "NOVA", label: "Nova AI Tutor" },
  { value: "ARENA", label: "Live Arena Battles" },
  { value: "TEACHER_PAPER", label: "Classroom Exams" },
  { value: "CUSTOM_QUIZ", label: "Custom Quizzes" },
];

const LIMIT_OPTIONS = [
  { value: "10", label: "10 / page" },
  { value: "20", label: "20 / page" },
  { value: "50", label: "50 / page" },
  { value: "100", label: "100 / page" },
];

const TIMEFRAME_TABS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "14d", label: "Last 14 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "all", label: "All Time" },
];

function SectionTitle({
  children,
  subtitle,
  action,
}: {
  children: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
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

// Activity type icon and badge helper
const getActivityBadge = (type: string) => {
  switch (type) {
    case "PAPER1":
      return {
        label: "Past Paper 1 (MCQs)",
        bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        bar: "bg-linear-to-r from-emerald-500 to-teal-400",
        icon: P1SVG,
      };
    case "PAPER2":
      return {
        label: "Past Paper 2 (Theory)",
        bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        bar: "bg-linear-to-r from-blue-500 to-cyan-400",
        icon: P2SCG,
      };
    case "GENERATED":
      return {
        label: "AI Mock Exam",
        bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        bar: "bg-linear-to-r from-purple-500 to-pink-400",
        icon: GenerateSVG,
      };
    case "GENERATED_BUILD":
      return {
        label: "Paper Generation",
        bg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
        bar: "bg-linear-to-r from-cyan-500 to-blue-400",
        icon: GenerateSVG,
      };
    case "NOVA":
      return {
        label: "Nova AI Tutor",
        bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        bar: "bg-linear-to-r from-amber-500 to-orange-400",
        icon: NovaSVG,
      };
    case "ARENA":
      return {
        label: "Live Arena",
        bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        bar: "bg-linear-to-r from-rose-500 to-red-400",
        icon: ZapSVG,
      };
    case "TEACHER_PAPER":
      return {
        label: "Classroom Exam",
        bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
        bar: "bg-linear-to-r from-indigo-500 to-violet-400",
        icon: ClassroomSVG,
      };
    case "CUSTOM_QUIZ":
      return {
        label: "Custom Quiz",
        bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        bar: "bg-linear-to-r from-emerald-500 to-teal-400",
        icon: ReviewExamsSVG,
      };
    default:
      return {
        label: type,
        bg: "bg-muted text-muted-foreground border-border/50",
        icon: ReviewExamsSVG,
      };
  }
};

const getRoleBadge = (roleStr: string) => {
  switch (roleStr?.toUpperCase()) {
    case "STUDENT":
      return "bg-primary/10 text-primary border-primary/20";
    case "TEACHER":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    case "SCHOOL":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "ADMIN":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    default:
      return "bg-muted text-muted-foreground border-border/50";
  }
};

const formatRelativeTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
};

export default function AdminActivitiesPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [activityType, setActivityType] = useState("ALL");
  const [timeframe, setTimeframe] = useState("7d");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Chart view mode
  const [chartMetric, setChartMetric] = useState<"count" | "hours">("count");
  const [analyticsTab, setAnalyticsTab] = useState<"breakdown" | "roles" | "leaderboard">("breakdown");

  // Data States
  const [overview, setOverview] = useState<AnalyticsOverview>({
    totalActivities: 0,
    totalActiveSeconds: 0,
    totalActiveHours: "0.0",
    totalActiveTimeFormatted: "0s",
    activeUsersCount: 0,
    avgSessionMinutes: 0,
    todayActivitiesCount: 0,
    todayActiveMinutes: 0,
    todayActiveTimeFormatted: "0s",
  });
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [roles, setRoles] = useState<RoleStat[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch activities data
  const fetchActivities = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = (await apiInstance.get("/admin/activities", {
        params: {
          page,
          limit,
          search: debouncedSearch,
          role,
          activityType,
          timeframe,
          userId: selectedUserId || undefined,
        },
      })) as {
        success?: boolean;
        data?: {
          overview?: AnalyticsOverview;
          timeline?: TimelinePoint[];
          categoryDistribution?: CategoryStat[];
          roleBreakdown?: RoleStat[];
          topUsers?: TopUser[];
          activities?: ActivityItem[];
          pagination?: PaginationMeta;
        };
        message?: string;
      };

      const dataObj = res?.data;

      if (dataObj && (dataObj.overview || dataObj.activities)) {
        if (dataObj.overview) {
          setOverview(dataObj.overview);
        }
        if (Array.isArray(dataObj.timeline)) {
          setTimeline(dataObj.timeline);
        }
        if (Array.isArray(dataObj.categoryDistribution)) {
          setCategories(dataObj.categoryDistribution);
        }
        if (Array.isArray(dataObj.roleBreakdown)) {
          setRoles(dataObj.roleBreakdown);
        }
        if (Array.isArray(dataObj.topUsers)) {
          setTopUsers(dataObj.topUsers);
        }
        if (Array.isArray(dataObj.activities)) {
          setActivities(dataObj.activities);
        }
        if (dataObj.pagination) {
          setPagination(dataObj.pagination);
        }
      } else {
        toast.error(res?.message || "Failed to load user activities.");
      }
    } catch (err) {
      console.error("Error fetching activities:", err);
      toast.error("Failed to load user activities data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, debouncedSearch, role, activityType, timeframe, selectedUserId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (debouncedSearch) count++;
    if (role !== "ALL") count++;
    if (activityType !== "ALL") count++;
    if (selectedUserId) count++;
    return count;
  }, [debouncedSearch, role, activityType, selectedUserId]);

  const handleResetFilters = () => {
    setSearch("");
    setRole("ALL");
    setActivityType("ALL");
    setSelectedUserId("");
    setSelectedUserName("");
    setPage(1);
  };

  const handleSelectUser = (u: TopUser) => {
    if (selectedUserId === u.id) {
      setSelectedUserId("");
      setSelectedUserName("");
    } else {
      setSelectedUserId(u.id);
      setSelectedUserName(u.name);
    }
    setPage(1);
    document.getElementById("activity-stream-section")?.scrollIntoView({ behavior: "smooth" });
  };

  // Recharts formatted data
  const chartData = useMemo(() => {
    return timeline.map((point) => ({
      day: point.label.split(" ")[1] || point.label,
      fullLabel: point.label,
      activities: point.activityCount,
      hours: point.activeHours,
      users: point.uniqueUsers,
    }));
  }, [timeline]);

  // Timeline summary metrics
  const timelineSummary = useMemo(() => {
    if (!timeline || timeline.length === 0) {
      return { peak: 0, peakDate: "—", totalHours: "0", avgDaily: 0 };
    }
    let maxActivities = 0;
    let maxDate = "—";
    let sumActivities = 0;
    let sumHours = 0;

    timeline.forEach((pt) => {
      sumActivities += pt.activityCount;
      sumHours += pt.activeHours;
      if (pt.activityCount > maxActivities) {
        maxActivities = pt.activityCount;
        maxDate = pt.label;
      }
    });

    return {
      peak: maxActivities,
      peakDate: maxDate,
      totalHours: sumHours.toFixed(1),
      avgDaily: Math.round(sumActivities / timeline.length),
    };
  }, [timeline]);

  if (loading && activities.length === 0 && topUsers.length === 0) {
    return (
      <PageContainer className="flex min-h-[60vh] items-center justify-center p-6">
        <AppLoader />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="min-w-0 pb-8 sm:pb-12">
      <PageHeader
        title="User Activities & Engagement"
        description="Real-time telemetry, session durations, student study logs, Nova AI interactions, and platform-wide power user analytics."
        showLine
      />

      <div className="space-y-6 sm:space-y-8 lg:space-y-10">
        {/* ================= 1. Modern Edge-to-Edge Activity Intelligence Banner ================= */}
        <WelcomeBanner
          name="Activity Intelligence Hub"
          subtitle="Real-time platform activity tracking, study durations, test attempts, and AI tutor engagement analytics across all boards."
          icon={HistorySVG}
          showNova={true}
          novaHref={FRONTEND_ROUTES.ADMIN_DASHBOARD}
          novaMessage={
            overview.todayActivitiesCount > 0
              ? `${overview.todayActivitiesCount} events recorded today (${overview.todayActiveTimeFormatted} active study time)`
              : "Live telemetry sync active • All systems operating normally"
          }
          stats={[
            {
              label: "Total Logs",
              value: overview.totalActivities.toLocaleString(),
            },
            {
              label: "Active Today",
              value: overview.todayActiveTimeFormatted,
            },
            {
              label: "Active Users",
              value: overview.activeUsersCount.toLocaleString(),
            },
          ]}
          actions={
            <>
              <button
                type="button"
                onClick={() => fetchActivities(true)}
                disabled={refreshing || loading}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-primary shadow-md hover:bg-white/90 transition-all cursor-pointer"
              >
                <RefreshCw className={cn("size-3.5 text-primary", refreshing && "animate-spin")} />
                <span>Refresh Live Data</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  document.getElementById("activity-stream-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-foreground/20 transition-all cursor-pointer"
              >
                <span>Activity Stream ({pagination.totalCount.toLocaleString()})</span>
                <ArrowRight className="size-3.5" />
              </button>
            </>
          }
        />

        {/* ================= 2. Platform Engagement Vitals (KPI Administrative Console Cards) ================= */}
        <section>
          <SectionTitle
            subtitle="Core user engagement, active study duration, user reach, and average session metrics."
            action={
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Timeframe Selector Pills */}
                <div className="inline-flex p-1 bg-muted/60 border border-border/60 rounded-xl sm:rounded-2xl">
                  {TIMEFRAME_TABS.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => {
                        setTimeframe(tab.value);
                        setPage(1);
                      }}
                      className={cn(
                        "px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg sm:rounded-xl transition-all cursor-pointer",
                        timeframe === tab.value
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                  <span>Live Sync</span>
                </div>
              </div>
            }
          >
            Platform Engagement Vitals
          </SectionTitle>

          {/* 4 Administrative Console Cards in 4-column layout on Desktop */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {/* Card 1: Total Activities */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 bg-linear-to-br from-sidebar-from via-primary to-sidebar-to p-4 sm:p-5 text-white shadow-md shadow-primary/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                <div className="absolute -top-[35%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[30px]" />
                <div className="absolute -bottom-[35%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[25px]" />
                <div className="absolute -right-3 -top-3 opacity-15 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-25">
                  <ReviewExamsSVG className="size-24 sm:size-28 text-white" />
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 ring-1 ring-white/30 text-white backdrop-blur-md shadow-xs transition-transform duration-300 group-hover:scale-105">
                  <ReviewExamsSVG className="size-5 sm:size-6 text-white" />
                </div>
                <span className="rounded-full bg-white/20 border border-white/25 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
                  Telemetry
                </span>
              </div>

              <div className="relative z-10 mt-3 sm:mt-4 min-w-0">
                <p className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
                  {loading ? "..." : overview.totalActivities.toLocaleString()}
                </p>
                <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-white/95 truncate drop-shadow-xs">
                  Total Activities Logged
                </p>
                <p className="mt-0.5 text-[10px] sm:text-[11px] font-medium text-white/80 truncate">
                  +{overview.todayActivitiesCount} recorded today
                </p>
              </div>
            </div>

            {/* Card 2: Active Study Time */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 bg-linear-to-br from-sidebar-from via-primary to-sidebar-to p-4 sm:p-5 text-white shadow-md shadow-primary/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                <div className="absolute -top-[35%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[30px]" />
                <div className="absolute -bottom-[35%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[25px]" />
                <div className="absolute -right-3 -top-3 opacity-15 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-25">
                  <ClockSVG className="size-24 sm:size-28 text-white" />
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 ring-1 ring-white/30 text-white backdrop-blur-md shadow-xs transition-transform duration-300 group-hover:scale-105">
                  <ClockSVG className="size-5 sm:size-6 text-white" />
                </div>
                <span className="rounded-full bg-white/20 border border-white/25 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
                  Duration
                </span>
              </div>

              <div className="relative z-10 mt-3 sm:mt-4 min-w-0">
                <p className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
                  {loading ? "..." : (overview.totalActiveTimeFormatted || `${overview.totalActiveHours} hrs`)}
                </p>
                <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-white/95 truncate drop-shadow-xs">
                  Active Study &amp; Practice
                </p>
                <p className="mt-0.5 text-[10px] sm:text-[11px] font-medium text-white/80 truncate">
                  {overview.todayActiveTimeFormatted} active today
                </p>
              </div>
            </div>

            {/* Card 3: Active Engaged Users */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 bg-linear-to-br from-sidebar-from via-primary to-sidebar-to p-4 sm:p-5 text-white shadow-md shadow-primary/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                <div className="absolute -top-[35%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[30px]" />
                <div className="absolute -bottom-[35%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[25px]" />
                <div className="absolute -right-3 -top-3 opacity-15 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-25">
                  <StudentsSVG className="size-24 sm:size-28 text-white" />
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 ring-1 ring-white/30 text-white backdrop-blur-md shadow-xs transition-transform duration-300 group-hover:scale-105">
                  <StudentsSVG className="size-5 sm:size-6 text-white" />
                </div>
                <span className="rounded-full bg-white/20 border border-white/25 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
                  Learners
                </span>
              </div>

              <div className="relative z-10 mt-3 sm:mt-4 min-w-0">
                <p className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
                  {loading ? "..." : overview.activeUsersCount.toLocaleString()}
                </p>
                <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-white/95 truncate drop-shadow-xs">
                  Engaged Active Users
                </p>
                <p className="mt-0.5 text-[10px] sm:text-[11px] font-medium text-white/80 truncate">
                  Unique active platform users
                </p>
              </div>
            </div>

            {/* Card 4: Avg Activity Duration */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 bg-linear-to-br from-sidebar-from via-primary to-sidebar-to p-4 sm:p-5 text-white shadow-md shadow-primary/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                <div className="absolute -top-[35%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[30px]" />
                <div className="absolute -bottom-[35%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[25px]" />
                <div className="absolute -right-3 -top-3 opacity-15 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-25">
                  <SparklesSVG className="size-24 sm:size-28 text-white" />
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 ring-1 ring-white/30 text-white backdrop-blur-md shadow-xs transition-transform duration-300 group-hover:scale-105">
                  <SparklesSVG className="size-5 sm:size-6 text-white" />
                </div>
                <span className="rounded-full bg-white/20 border border-white/25 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
                  Average
                </span>
              </div>

              <div className="relative z-10 mt-3 sm:mt-4 min-w-0">
                <p className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
                  {loading ? "..." : `${overview.avgSessionMinutes} mins`}
                </p>
                <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-white/95 truncate drop-shadow-xs">
                  Avg Activity Duration
                </p>
                <p className="mt-0.5 text-[10px] sm:text-[11px] font-medium text-white/80 truncate">
                  ~{(overview.avgSessionMinutes * 60).toFixed(0)}s per activity
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 3. Top 5 Users by App Usage (Power Users Showcase Podium) ================= */}
        <section>
          <SectionTitle
            subtitle="Most active learners and educators ranked by total app study duration and interactions."
            action={
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <SparklesSVG className="size-3 text-amber-500" />
                <span>Power Users Podium</span>
              </span>
            }
          >
            Top 5 Users by App Usage
          </SectionTitle>

          {/* 5-column Podium Grid with Signature Glow & Watermarks */}
          {loading && topUsers.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl sm:rounded-3xl border border-border/60 bg-card p-6 shadow-xs">
              <AppLoader className="min-h-0" />
            </div>
          ) : topUsers.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-border/60 rounded-2xl sm:rounded-3xl bg-card">
              <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground mx-auto mb-2">
                <TrophySVG className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-bold text-foreground">No User Usage Recorded</p>
              <p className="text-xs font-medium text-muted-foreground mt-1 max-w-sm mx-auto">
                No user app usage recorded for the selected timeframe. As learners solve exams, they will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {topUsers.slice(0, 5).map((u, idx) => {
                const isSelected = selectedUserId === u.id;
                
                // Rank styling config
                const rankConfig = {
                  0: {
                    gradient: "from-[#f59e0b] via-[#d97706] to-[#b45309]",
                    border: "border-amber-300/40 shadow-amber-500/20",
                    badgeBg: "bg-white text-amber-950 shadow-sm ring-1 ring-amber-300",
                    iconWatermark: CrownSVG,
                    ringClass: "ring-2 ring-white/90 shadow-md",
                    titlePill: "Gold Champion",
                  },
                  1: {
                    gradient: "from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]",
                    border: "border-blue-300/40 shadow-blue-500/20",
                    badgeBg: "bg-white text-blue-950 shadow-sm ring-1 ring-blue-300",
                    iconWatermark: TrophySVG,
                    ringClass: "ring-2 ring-white/90 shadow-md",
                    titlePill: "Silver Ace",
                  },
                  2: {
                    gradient: "from-[#a855f7] via-[#9333ea] to-[#7e22ce]",
                    border: "border-purple-300/40 shadow-purple-500/20",
                    badgeBg: "bg-white text-purple-950 shadow-sm ring-1 ring-purple-300",
                    iconWatermark: MedalSVG,
                    ringClass: "ring-2 ring-white/90 shadow-md",
                    titlePill: "Bronze Master",
                  },
                  3: {
                    gradient: "from-[#0d9488] via-[#0f766e] to-[#115e59]",
                    border: "border-teal-300/40 shadow-teal-500/20",
                    badgeBg: "bg-white text-teal-950 shadow-sm ring-1 ring-teal-300",
                    iconWatermark: StarSVG,
                    ringClass: "ring-2 ring-white/90 shadow-md",
                    titlePill: "Top Engaged",
                  },
                  4: {
                    gradient: "from-sidebar-from via-primary to-sidebar-to",
                    border: "border-primary/40 shadow-primary/20",
                    badgeBg: "bg-white text-primary shadow-sm ring-1 ring-primary/30",
                    iconWatermark: StarSVG,
                    ringClass: "ring-2 ring-white/90 shadow-md",
                    titlePill: "Top Engaged",
                  },
                }[idx] || {
                  gradient: "from-sidebar-from via-primary to-sidebar-to",
                  border: "border-primary/40 shadow-primary/20",
                  badgeBg: "bg-white text-primary shadow-sm ring-1 ring-primary/30",
                  iconWatermark: StarSVG,
                  ringClass: "ring-2 ring-white/90 shadow-md",
                  titlePill: "Top Engaged",
                };

                const WatermarkIcon = rankConfig.iconWatermark;

                return (
                  <div
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className={cn(
                      "group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-4.5 text-white transition-all duration-300 cursor-pointer shadow-md hover:-translate-y-1 hover:shadow-xl",
                      rankConfig.border,
                      isSelected && "ring-4 ring-white/80 scale-[1.02]"
                    )}
                  >
                    {/* Ambient Linear Gradient Background & Particle Dot Overlay */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                      <div className={cn("absolute inset-0 bg-linear-to-br", rankConfig.gradient)} />
                      <div className="absolute -top-[35%] -right-[15%] size-[80%] rounded-full bg-white/25 blur-[35px]" />
                      <div className="absolute -bottom-[35%] -left-[15%] size-[70%] rounded-full bg-black/30 blur-[30px]" />
                      <div
                        className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
                        style={{
                          backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                          backgroundSize: "16px 16px",
                        }}
                      />
                      {/* Watermark Big Rank & Icon */}
                      <span className="absolute -top-1 left-2 select-none text-4xl sm:text-5xl font-black text-white/15 drop-shadow-xs">
                        #{idx + 1}
                      </span>
                      <WatermarkIcon className="absolute -bottom-2 -right-2 size-20 text-white/10 -rotate-12 transition-transform duration-500 group-hover:scale-110" />
                    </div>

                    {/* Top Row: Rank Badge & Role Pill */}
                    <div className="relative z-10 flex items-center justify-between gap-1.5 mb-3">
                      <span
                        className={cn(
                          "inline-flex items-center justify-center size-6 rounded-full text-xs font-black",
                          rankConfig.badgeBg
                        )}
                      >
                        #{idx + 1}
                      </span>

                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-xs">
                        {u.role}
                      </span>
                    </div>

                    {/* Middle: User Avatar & Info */}
                    <div className="relative z-10 flex flex-col items-center text-center space-y-2 mb-3">
                      <div className="relative">
                        <UserAvatar
                          src={u.profileImage}
                          name={u.name}
                          size="md"
                          className={cn("size-13 rounded-full transition-transform duration-300 group-hover:scale-105", rankConfig.ringClass)}
                        />
                        {idx === 0 && (
                          <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-amber-400 text-amber-950 text-[10px] shadow-xs">
                            👑
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 w-full space-y-0.5">
                        <p className="text-sm font-black text-white drop-shadow-xs truncate" title={u.name}>
                          {formatCapitalizeWords(u.name)}
                        </p>
                        <p className="text-[11px] text-white/80 font-medium truncate" title={u.email}>
                          {formatEmail(u.email)}
                        </p>
                        <p className="text-[10px] text-white/75 font-semibold truncate">
                          {u.class ? `Class ${u.class} • ` : ""}
                          {u.schoolName !== "—" ? formatSchoolName(u.schoolName) : u.board || "Platform Learner"}
                        </p>
                      </div>
                    </div>

                    {/* Bottom: Usage Stats Metrics Box (Frosted Glass) */}
                    <div className="relative z-10 rounded-xl sm:rounded-2xl bg-black/20 backdrop-blur-md border border-white/20 p-2.5 space-y-1.5 text-center">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold text-white/80 flex items-center gap-1">
                          <ClockSVG className="size-3 text-white" /> Active Time
                        </span>
                        <span className="font-black text-white drop-shadow-xs">
                          {u.totalActiveFormatted}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-white/15">
                        <span className="text-[10px] font-bold text-white/80 flex items-center gap-1">
                          <ReviewExamsSVG className="size-3 text-white" /> Actions
                        </span>
                        <span className="font-black text-white drop-shadow-xs text-[11px]">
                          {u.totalActivities.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Filter State / Action Indicator */}
                    <div className="relative z-10 mt-2 text-center">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-white bg-white/25 px-2.5 py-0.5 rounded-full border border-white/40 shadow-xs">
                          <Check className="size-2.5" />
                          <span>Active Filter</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <span>Filter Stream</span>
                          <ArrowRight className="size-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ================= 4. Engagement Trends & Distribution ================= */}
        <section>
          <SectionTitle subtitle="Daily active volume timeline and breakdown across activity types, user roles, and categories.">
            Engagement Trends &amp; Distribution
          </SectionTitle>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {/* Left Column (2 spans): Daily Activity & Active Time Timeline */}
            <div className="lg:col-span-2 flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-border/60 bg-card p-4 sm:p-6 shadow-xs">
              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Typography variant="h3" className="text-base font-bold sm:text-lg text-foreground whitespace-nowrap">
                      Engagement &amp; Study Timeline
                    </Typography>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">
                      Daily activity volume and active learner hours over time
                    </p>
                  </div>

                  {/* Metric Toggle */}
                  <div className="inline-flex p-1 bg-muted/60 border border-border/60 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => setChartMetric("count")}
                      className={cn(
                        "px-3 py-1 font-semibold rounded-lg transition-all cursor-pointer",
                        chartMetric === "count"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Activities Count
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMetric("hours")}
                      className={cn(
                        "px-3 py-1 font-semibold rounded-lg transition-all cursor-pointer",
                        chartMetric === "hours"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Active Hours
                    </button>
                  </div>
                </div>

                {/* Timeline Mini Summary Cards - Coverage Style */}
                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  {/* Peak Volume */}
                  <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-blue-300/30 p-3 sm:p-3.5 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl bg-linear-to-br from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]">
                    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                      <div className="absolute -top-[20%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[25px]" />
                      <div className="absolute -bottom-[20%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[30px]" />
                      <div
                        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
                        style={{
                          backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                          backgroundSize: "18px 18px",
                        }}
                      />
                      <TrophySVG
                        aria-hidden
                        className="pointer-events-none absolute -bottom-2 -right-2 size-14 sm:size-16 text-white/15 transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                      <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white/95 flex items-center gap-1 drop-shadow-2xs">
                        <TrophySVG className="size-3 sm:size-3.5 text-white" />
                        Peak Volume
                      </span>
                      <div className="mt-1.5 flex items-baseline gap-1">
                        <span className="text-lg sm:text-2xl font-black text-white drop-shadow-xs">
                          {timelineSummary.peak.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-white/85 font-semibold mt-0.5 truncate">
                        {timelineSummary.peakDate || "High volume"}
                      </span>
                    </div>
                  </div>

                  {/* Daily Average */}
                  <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-emerald-300/30 p-3 sm:p-3.5 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl bg-linear-to-br from-primary via-primary to-primary-dark">
                    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                      <div className="absolute -top-[20%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[25px]" />
                      <div className="absolute -bottom-[20%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[30px]" />
                      <div
                        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
                        style={{
                          backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                          backgroundSize: "18px 18px",
                        }}
                      />
                      <ZapSVG
                        aria-hidden
                        className="pointer-events-none absolute -bottom-2 -right-2 size-14 sm:size-16 text-white/15 transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                      <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white/95 flex items-center gap-1 drop-shadow-2xs">
                        <ZapSVG className="size-3 sm:size-3.5 text-white" />
                        Daily Average
                      </span>
                      <div className="mt-1.5 flex items-baseline gap-1">
                        <span className="text-lg sm:text-2xl font-black text-white drop-shadow-xs">
                          ~{timelineSummary.avgDaily.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-white/85 font-semibold mt-0.5 truncate">
                        Events / day
                      </span>
                    </div>
                  </div>

                  {/* Total Time */}
                  <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-purple-300/30 p-3 sm:p-3.5 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl bg-linear-to-br from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9]">
                    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                      <div className="absolute -top-[20%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[25px]" />
                      <div className="absolute -bottom-[20%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[30px]" />
                      <div
                        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
                        style={{
                          backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                          backgroundSize: "18px 18px",
                        }}
                      />
                      <ClockSVG
                        aria-hidden
                        className="pointer-events-none absolute -bottom-2 -right-2 size-14 sm:size-16 text-white/15 transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                      <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white/95 flex items-center gap-1 drop-shadow-2xs">
                        <ClockSVG className="size-3 sm:size-3.5 text-white" />
                        Total Time
                      </span>
                      <div className="mt-1.5 flex items-baseline gap-1">
                        <span className="text-lg sm:text-2xl font-black text-white drop-shadow-xs">
                          {timelineSummary.totalHours} hrs
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-white/85 font-semibold mt-0.5 truncate">
                        In timeframe
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recharts Area Timeline */}
                {loading ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-2">
                    <AppLoader className="min-h-0" />
                    <p className="text-xs text-muted-foreground">Loading timeline analytics...</p>
                  </div>
                ) : timeline.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-4">
                    <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground mb-2">
                      <BarChart3 className="size-6" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      No Timeline Data Yet
                    </p>
                    <p className="text-xs text-muted-foreground max-w-xs mt-1">
                      Activity records will automatically graph as students and teachers solve exams and interact with Nova.
                    </p>
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="activityCountGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="activityHoursGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
                        <XAxis
                          dataKey="day"
                          stroke="var(--color-muted-foreground)"
                          fontSize={11}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="var(--color-muted-foreground)"
                          fontSize={11}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="rounded-xl border border-border bg-card p-3 shadow-lg text-xs space-y-1.5">
                                  <p className="font-bold text-foreground">{data.fullLabel}</p>
                                  <div className="flex items-center gap-2 text-primary font-bold">
                                    <span className="size-2 rounded-full bg-primary" />
                                    <span>{data.activities} Activities Logged</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-blue-500 font-bold">
                                    <span className="size-2 rounded-full bg-blue-500" />
                                    <span>{data.hours} Active Hours</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <span className="size-2 rounded-full bg-muted-foreground" />
                                    <span>{data.users} Unique Learners</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        {chartMetric === "count" ? (
                          <Area
                            type="monotone"
                            dataKey="activities"
                            stroke="var(--color-primary)"
                            strokeWidth={2.5}
                            fill="url(#activityCountGrad)"
                          />
                        ) : (
                          <Area
                            type="monotone"
                            dataKey="hours"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            fill="url(#activityHoursGrad)"
                          />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (1 span): Breakdown & Top Engaged Users */}
            <div className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-border/60 bg-card p-4 sm:p-5 shadow-xs space-y-4">
              <div>
                <div className="space-y-3 pb-3.5 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <PieChart className="size-3.5" />
                      </div>
                      <Typography variant="h3" className="font-bold text-foreground text-sm sm:text-base truncate">
                        Breakdown &amp; Rankings
                      </Typography>
                    </div>
                  </div>

                  {/* Mini Tabs: 3-column equal grid guaranteed never to overflow */}
                  <div className="grid grid-cols-3 p-1 bg-muted/60 dark:bg-muted/40 border border-border/50 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setAnalyticsTab("breakdown")}
                      className={cn(
                        "py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer text-center truncate",
                        analyticsTab === "breakdown"
                          ? "bg-primary text-white shadow-xs font-extrabold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      )}
                    >
                      Type
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalyticsTab("roles")}
                      className={cn(
                        "py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer text-center truncate",
                        analyticsTab === "roles"
                          ? "bg-primary text-white shadow-xs font-extrabold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      )}
                    >
                      Role
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalyticsTab("leaderboard")}
                      className={cn(
                        "py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer text-center truncate",
                        analyticsTab === "leaderboard"
                          ? "bg-primary text-white shadow-xs font-extrabold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      )}
                    >
                      Top Users
                    </button>
                  </div>
                </div>

                {/* Tab 1: Activity Type Breakdown */}
                {analyticsTab === "breakdown" && (
                  <div className="space-y-2.5 pt-3">
                    {categories.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-8 text-center">No category data recorded yet.</p>
                    ) : (
                      categories.slice(0, 5).map((cat) => {
                        const badge = getActivityBadge(cat.activityType);
                        const totalAll = overview.totalActivities || 1;
                        const pct = Math.round((cat.count / totalAll) * 100);
                        const Icon = badge.icon;

                        return (
                          <div
                            key={cat.activityType}
                            className="p-2.5 sm:p-3 rounded-2xl bg-muted/25 dark:bg-muted/15 border border-border/40 space-y-2 hover:bg-muted/35 transition-all duration-200"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={cn("size-7 rounded-xl flex items-center justify-center shrink-0 border", badge.bg)}>
                                  <Icon className="size-4 shrink-0" />
                                </div>
                                <span className="font-bold text-foreground text-xs truncate">
                                  {badge.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-black text-foreground text-xs">
                                  {cat.count.toLocaleString()}
                                </span>
                                <span className="text-[11px] font-semibold text-muted-foreground">
                                  ({pct}%)
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-muted/60 dark:bg-muted/40 h-2 rounded-full overflow-hidden p-0.5">
                              <div
                                style={{ width: `${pct}%` }}
                                className={cn("h-full rounded-full transition-all duration-500 shadow-2xs", badge.bar)}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Tab 2: Role Breakdown */}
                {analyticsTab === "roles" && (
                  <div className="space-y-2.5 pt-3">
                    {roles.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-8 text-center">No role activity data recorded.</p>
                    ) : (
                      roles.map((r) => {
                        const totalAll = overview.totalActivities || 1;
                        const pct = Math.round((r.activityCount / totalAll) * 100);

                        return (
                          <div
                            key={r.role}
                            className="p-3 rounded-2xl bg-muted/25 dark:bg-muted/15 border border-border/50 space-y-2 hover:bg-muted/35 transition-colors"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className={cn("px-2.5 py-0.5 rounded-lg font-bold text-[10px] uppercase border tracking-wider", getRoleBadge(r.role))}>
                                {r.role}
                              </span>
                              <span className="font-bold text-foreground text-xs">
                                {r.activityCount} actions • {r.totalHours}h
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>{r.userCount} active users</span>
                              <span className="font-semibold text-primary">{pct}% of platform</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Tab 3: Top Engaged Users Leaderboard */}
                {analyticsTab === "leaderboard" && (
                  <div className="space-y-2 pt-3 max-h-[260px] overflow-y-auto pr-1">
                    {topUsers.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-8 text-center">No active users recorded.</p>
                    ) : (
                      topUsers.slice(0, 5).map((user, idx) => (
                        <div
                          key={user.id}
                          onClick={() => handleSelectUser(user)}
                          className={cn(
                            "flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer hover:shadow-xs",
                            selectedUserId === user.id
                              ? "bg-primary/10 border-primary"
                              : "bg-muted/30 border-border/50 hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={cn(
                              "size-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0",
                              idx === 0 ? "bg-amber-400 text-amber-950 shadow-xs" :
                              idx === 1 ? "bg-slate-300 text-slate-900" :
                              idx === 2 ? "bg-amber-700 text-white" :
                              "bg-muted text-muted-foreground"
                            )}>
                              {idx + 1}
                            </span>
                            <UserAvatar
                              src={user.profileImage}
                              name={user.name}
                              size="sm"
                              className="size-7 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">
                                {formatCapitalizeWords(user.name)}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {user.schoolName !== "—" ? formatSchoolName(user.schoolName) : formatCapitalizeWords(user.role)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-black text-primary">
                              {user.totalActiveFormatted}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {user.totalActivities} events
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between mt-auto">
                <span>Aggregated telemetry stats</span>
                <div className="flex items-center gap-1.5 font-bold text-primary">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Active Time Tracker</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 5. Live Activity Stream ================= */}
        <section id="activity-stream-section" className="space-y-4">
          <SectionTitle
            subtitle="Chronological audit of student practice tests, mock exams, paper generations, and AI tutor sessions."
            action={
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                {pagination.totalCount.toLocaleString()} Telemetry Events
              </span>
            }
          >
            Live Activity Stream
          </SectionTitle>

          {/* Filter & Search Toolbar Card */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card border border-border/60 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by student, teacher, email, school, or subject..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-11 bg-background border border-border/60 rounded-2xl pl-11 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Dropdowns */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                {/* Role Filter */}
                <div className="w-[140px]">
                  <AppDropdown
                    options={ROLE_FILTER_OPTIONS}
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      setPage(1);
                    }}
                    className="h-11 rounded-2xl text-xs font-semibold"
                  />
                </div>

                {/* Activity Type Filter */}
                <div className="w-[170px]">
                  <AppDropdown
                    options={ACTIVITY_TYPE_OPTIONS}
                    value={activityType}
                    onChange={(e) => {
                      setActivityType(e.target.value);
                      setPage(1);
                    }}
                    className="h-11 rounded-2xl text-xs font-semibold"
                  />
                </div>

                {/* Limit Filter */}
                <div className="w-[120px]">
                  <AppDropdown
                    options={LIMIT_OPTIONS}
                    value={String(limit)}
                    onChange={(e) => {
                      setLimit(Number(e.target.value) || 20);
                      setPage(1);
                    }}
                    className="h-11 rounded-2xl text-xs font-semibold"
                  />
                </div>

                {/* User Filter Indicator Chip */}
                {selectedUserId && (
                  <div className="inline-flex items-center gap-1.5 px-3 h-11 rounded-2xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary shrink-0">
                    <span>User: {formatCapitalizeWords(selectedUserName)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUserId("");
                        setSelectedUserName("");
                        setPage(1);
                      }}
                      className="p-0.5 hover:bg-primary/20 rounded-full cursor-pointer"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                )}

                {/* Reset Filters button */}
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 h-11 px-3.5 rounded-2xl text-xs font-bold text-destructive bg-destructive/10 hover:bg-destructive/15 border border-destructive/20 transition-all cursor-pointer shrink-0"
                  >
                    <X className="size-3.5" />
                    <span>Reset ({activeFiltersCount})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Activities Stream Table / Cards */}
          <div className="rounded-2xl sm:rounded-3xl bg-card border border-border/60 shadow-xs overflow-hidden">
            {/* Table Header */}
            <div className="p-4 sm:p-5 border-b border-border/50 flex items-center justify-between">
              <div>
                <Typography variant="h3" className="font-bold text-foreground text-base">
                  Activity Records
                </Typography>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Page {pagination.page} of {pagination.totalPages} • Total {pagination.totalCount.toLocaleString()} events recorded
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Showing {activities.length} entries
                </span>
              </div>
            </div>

            {/* Content List */}
            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <AppLoader className="min-h-0" />
              </div>
            ) : activities.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground mx-auto">
                  <ReviewExamsSVG className="size-6 text-muted-foreground" />
                </div>
                <Typography variant="h4" className="text-muted-foreground">
                  No Activities Found
                </Typography>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {search || role !== "ALL" || activityType !== "ALL" || selectedUserId
                    ? "Try adjusting your search query, role filters, or clearing the selected user filter."
                    : "No telemetry events have been logged yet."}
                </p>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer"
                  >
                    <X className="size-3.5" />
                    <span>Clear All Filters</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {activities.map((act) => {
                  const badge = getActivityBadge(act.activityType);
                  const Icon = badge.icon;

                  return (
                    <div
                      key={act.id}
                      className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors group"
                    >
                      {/* Left: User Avatar + Name + Activity info */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className="relative shrink-0 mt-0.5">
                          <UserAvatar
                            src={act.user.profileImage}
                            name={act.user.name}
                            size="md"
                            className="size-10 ring-1 ring-border/60"
                          />
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-foreground truncate">
                              {formatCapitalizeWords(act.user.name)}
                            </span>

                            {/* Role Badge */}
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                                getRoleBadge(act.user.role)
                              )}
                            >
                              {act.user.role}
                            </span>

                            {/* Activity Type Badge */}
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold border",
                                badge.bg
                              )}
                            >
                              <Icon className="size-3.5" />
                              {badge.label}
                            </span>
                          </div>

                          {/* Details & Subject */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span className="font-semibold text-foreground truncate max-w-xs">
                              {act.title}
                            </span>
                            {act.subject && (
                              <>
                                <span>•</span>
                                <span className="text-primary font-bold">
                                  {act.subject}
                                </span>
                              </>
                            )}
                            {act.user.schoolName && act.user.schoolName !== "—" && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[180px]">{formatSchoolName(act.user.schoolName)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Score, Duration & Timestamp */}
                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/40 w-full md:w-auto">
                        {/* Score / Performance Badge */}
                        {act.percentage !== null ? (
                          <div className="flex items-center gap-1.5 flex-wrap md:flex-nowrap justify-end">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border",
                                act.percentage >= 80
                                  ? "bg-primary/10 text-primary border-primary/20"
                                  : act.percentage >= 50
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                  : "bg-destructive/10 text-destructive border-destructive/20"
                              )}
                            >
                              {act.percentage}% ({act.score}/{act.totalMarks})
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-2xs">
                              <TrophySVG className="size-3.5 shrink-0 text-amber-500" />
                              <span>+{10 + Math.floor(Math.max(0, Math.min(100, act.percentage)) / 10) * 5} pts</span>
                            </span>
                          </div>
                        ) : act.gradingStatus === "pending_manual" ? (
                          <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Pending Manual
                          </span>
                        ) : null}

                        {/* Active Time Spent */}
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/60 border border-border/50 text-xs font-bold text-foreground">
                          <ClockSVG className="size-3.5 text-muted-foreground" />
                          <span>{act.timeTakenFormatted}</span>
                        </div>

                        {/* Relative Timestamp */}
                        <span
                          title={new Date(act.createdAt).toLocaleString()}
                          className="text-xs text-muted-foreground whitespace-nowrap min-w-[70px] text-right font-medium"
                        >
                          {formatRelativeTime(act.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Standardized AppPagination matching Student Portal */}
            <div className="p-4 sm:p-5 border-t border-border/50 bg-muted/20">
              <AppPagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalCount}
                pageSize={pagination.limit}
                itemLabel="activities"
                onPageChange={(newPage) => setPage(newPage)}
                className="pt-0"
                reverseMobileOrder={false}
              />
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
