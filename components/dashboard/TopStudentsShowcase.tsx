"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CrownSVG from "@/public/svgs/CrownSVG";
import MedalSVG from "@/public/svgs/MedalSVG";
import TrophySVG from "@/public/svgs/TrophySVG";
import BuildingSVG from "@/public/svgs/BuildingSVG";
import StarSVG from "@/public/svgs/StarSVG";
import UserAvatar from "@/components/UserAvatar";
import AppLoader from "@/components/AppLoader";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { cn, formatSchoolName, formatCapitalizeWords } from "@/lib/utils";

export interface TopStudentItem {
  id: string;
  name: string;
  username?: string;
  points: number;
  classLevel?: string | null;
  profilePic?: string | null;
  schoolName?: string | null;
  schoolLogo?: string | null;
}

export interface TopSchoolItem {
  id: string;
  name: string;
  points: number;
  studentCount?: number;
  logoUrl?: string | null;
  city?: string | null;
}

interface TopStudentsShowcaseProps {
  students?: TopStudentItem[];
  schools?: TopSchoolItem[];
  isLoading?: boolean;
  variant?: "mobile-rotator" | "desktop-grid" | "auto";
  className?: string;
  leaderboardHref?: string;
}

function getRankGradient(rank: number) {
  if (rank === 1) return "from-[#f59e0b] via-[#d97706] to-[#b45309]"; // Gold
  if (rank === 2) return "from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]"; // Blue
  if (rank === 3) return "from-[#a855f7] via-[#9333ea] to-[#7e22ce]"; // Purple
  return "from-slate-600 via-slate-700 to-slate-800";
}

function getRankBorderClass(rank: number) {
  if (rank === 1) return "border-amber-300/40 shadow-amber-500/15";
  if (rank === 2) return "border-blue-300/40 shadow-blue-500/15";
  return "border-purple-300/40 shadow-purple-500/15";
}

function GradientCardBackground({ rank }: { rank: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <div className={cn("absolute inset-0 bg-linear-to-br", getRankGradient(rank))} />
      <div className="absolute -top-[35%] -right-[15%] size-[80%] rounded-full bg-white/25 blur-[40px]" />
      <div className="absolute -bottom-[35%] -left-[15%] size-[70%] rounded-full bg-black/30 blur-[35px]" />
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      />
    </div>
  );
}

function RankWatermark({ rank }: { rank: number }) {
  const Icon = rank === 1 ? CrownSVG : rank === 2 ? TrophySVG : MedalSVG;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <span className="absolute -top-1 left-2 select-none text-4xl sm:text-5xl font-black text-white/15 drop-shadow-xs">
        #{rank}
      </span>
      <Icon className="absolute -bottom-2 -right-2 size-16 text-white/10 -rotate-12" />
      <Icon className="absolute top-1 right-20 size-8 text-white/10 rotate-12" />
    </div>
  );
}

export function TopStudentsShowcaseSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("w-full flex items-center justify-center py-8 min-h-[108px]", className)}>
      <AppLoader inline size={0.85} />
    </div>
  );
}

export function TopStudentHorizontalCard({
  student,
  rank,
  className,
  href,
}: {
  student: TopStudentItem;
  rank: number;
  className?: string;
  href?: string;
}) {
  const schoolDisplay =
    student.schoolName && student.schoolName !== "—"
      ? formatSchoolName(student.schoolName)
      : "AKU Examination Board";

  return (
    <Link
      href={href ?? FRONTEND_ROUTES.STUDENT_LEADERBOARD}
      className={cn(
        "relative flex w-full h-full min-h-[108px] sm:min-h-[114px] items-center justify-between overflow-hidden rounded-2xl border p-3.5 sm:p-4 text-left text-white shadow-md",
        getRankBorderClass(rank),
        className,
      )}
    >
      <GradientCardBackground rank={rank} />
      <RankWatermark rank={rank} />

      {/* Main Content */}
      <div className="relative z-10 flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
        {/* Profile Avatar with Rank Ring */}
        <div className="relative shrink-0">
          <UserAvatar
            src={student.profilePic}
            name={student.name}
            username={student.username || ""}
            id={student.id}
            size={56}
            className="size-13 sm:size-14 rounded-full ring-2 ring-white/70 shadow-md"
          />
          <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-white text-[10px] font-black leading-none text-slate-900 shadow-sm ring-1 ring-black/10">
            #{rank}
          </span>
        </div>

        {/* Text column & bottom row */}
        <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
          {/* Top row: Student Name & Points */}
          <div className="flex items-center justify-between gap-2 min-w-0 w-full">
            <h4 className="text-sm sm:text-base font-black text-white drop-shadow-xs leading-tight truncate">
              {formatCapitalizeWords(student.name)}
            </h4>
            <span className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[10.5px] sm:text-[11.5px] font-black text-white border border-white/30 shadow-xs">
              <StarSVG className="size-3 text-amber-200" />
              <span>{(student?.points ?? 0).toLocaleString()} pts</span>
            </span>
          </div>

          {/* Bottom row: Student Of badge with school logo */}
          <div className="flex items-center gap-2 mt-2 min-w-0">
            <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/30 bg-white p-0.5 shadow-xs">
              {student.schoolLogo ? (
                <img
                  src={student.schoolLogo}
                  alt="School"
                  className="size-full object-contain"
                />
              ) : (
                <BuildingSVG className="size-3.5 text-slate-800" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[8px] sm:text-[8.5px] font-bold uppercase tracking-wider text-white/75 leading-none">
                Student Of
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[10.5px] sm:text-[11.5px] font-semibold text-white leading-tight drop-shadow-xs break-words line-clamp-2">
                <span className="min-w-0">{schoolDisplay}</span>
                {student.classLevel ? (
                  <>
                    <span className="shrink-0 size-0.5 rounded-full bg-white/60" />
                    <span className="shrink-0">Class {student.classLevel}</span>
                  </>
                ) : null}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function TopSchoolHorizontalCard({
  school,
  rank,
  className,
  href,
}: {
  school: TopSchoolItem;
  rank: number;
  className?: string;
  href?: string;
}) {
  const schoolNameFormatted = formatSchoolName(school.name);

  return (
    <Link
      href={href ?? `${FRONTEND_ROUTES.STUDENT_LEADERBOARD}?tab=schools`}
      className={cn(
        "relative flex w-full h-full min-h-[108px] sm:min-h-[114px] items-center justify-between overflow-hidden rounded-2xl border p-3.5 sm:p-4 text-left text-white shadow-md",
        getRankBorderClass(rank),
        className,
      )}
    >
      <GradientCardBackground rank={rank} />
      <RankWatermark rank={rank} />

      {/* Main Content */}
      <div className="relative z-10 flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
        {/* School Icon / Logo with White Rounded Ring */}
        <div className="relative shrink-0">
          <div className="flex size-13 sm:size-14 items-center justify-center rounded-xl bg-white p-1.5 shadow-md ring-2 ring-white/70 overflow-hidden">
            {school.logoUrl ? (
              <img
                src={school.logoUrl}
                alt={school.name}
                className="size-full object-contain"
              />
            ) : (
              <BuildingSVG className="size-7 text-slate-800" />
            )}
          </div>
          <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-white text-[10px] font-black leading-none text-slate-900 shadow-sm ring-1 ring-black/10">
            #{rank}
          </span>
        </div>

        {/* Text column & bottom row */}
        <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
          {/* Top row: Full width School Name without truncation */}
          <div className="min-w-0 w-full">
            <h4 className="text-sm sm:text-base font-black text-white drop-shadow-xs leading-snug break-words">
              {schoolNameFormatted}
            </h4>
          </div>

          {/* Bottom row: City Name on left, Points badge on right */}
          <div className="flex items-center justify-between gap-2 mt-2 min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-white/90 leading-tight drop-shadow-xs truncate min-w-0 flex-1">
              <span>{school.city || "Karachi"}</span>
              {school.studentCount ? (
                <span className="text-white/75 text-[10.5px] sm:text-[11px] font-medium ml-1.5">
                  • {school.studentCount} {school.studentCount === 1 ? "student" : "students"}
                </span>
              ) : null}
            </p>
            <span className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[10.5px] sm:text-[11.5px] font-black text-white border border-white/30 shadow-xs">
              <StarSVG className="size-3 text-amber-200" />
              <span>{(school?.points ?? 0).toLocaleString()} pts</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function TopStudentsShowcase({
  students,
  schools,
  isLoading,
  className,
  leaderboardHref,
}: TopStudentsShowcaseProps) {
  const baseLeaderboardHref = leaderboardHref ?? FRONTEND_ROUTES.STUDENT_LEADERBOARD;
  const schoolsLeaderboardHref = `${baseLeaderboardHref}?tab=schools`;

  // Use live student data (top 3, excluding QA role users)
  const filteredStudents = (students ?? []).filter(
    (s: any) => s?.role !== "QA" && s?.email?.toLowerCase() !== "mtahatalib110+aliya@gmail.com"
  );
  const topThreeStudents = filteredStudents.slice(0, 3);

  // Use live school data (top 3)
  const topThreeSchools = (schools ?? []).slice(0, 3);

  const hasAnyData = topThreeStudents.length > 0 || topThreeSchools.length > 0;

  // Interleaved sequence for Mobile: #1 Student -> #1 School -> #2 Student -> #2 School -> #3 Student -> #3 School
  const mobileItems: {
    type: "student" | "school";
    rank: number;
    student?: TopStudentItem;
    school?: TopSchoolItem;
  }[] = [];

  const maxLen = Math.max(topThreeStudents.length, topThreeSchools.length);
  for (let i = 0; i < maxLen; i++) {
    if (topThreeStudents[i]) {
      mobileItems.push({ type: "student", rank: i + 1, student: topThreeStudents[i] });
    }
    if (topThreeSchools[i]) {
      mobileItems.push({ type: "school", rank: i + 1, school: topThreeSchools[i] });
    }
  }

  // Mobile active index & auto-rotation
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);
  const [isMobilePaused, setIsMobilePaused] = useState(false);
  const mobileTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isMobilePaused || mobileItems.length <= 1) return;

    mobileTimerRef.current = setInterval(() => {
      setActiveMobileIndex((prev) => (prev + 1) % mobileItems.length);
    }, 4000);

    return () => {
      if (mobileTimerRef.current) clearInterval(mobileTimerRef.current);
    };
  }, [isMobilePaused, mobileItems.length]);

  // Desktop mode: toggles between "students" (Top 3 Students) and "schools" (Top 3 Schools)
  const [desktopMode, setDesktopMode] = useState<"students" | "schools">("students");
  const [isDesktopPaused, setIsDesktopPaused] = useState(false);
  const desktopTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isDesktopPaused) return;

    desktopTimerRef.current = setInterval(() => {
      setDesktopMode((prev) => (prev === "students" ? "schools" : "students"));
    }, 5000);

    return () => {
      if (desktopTimerRef.current) clearInterval(desktopTimerRef.current);
    };
  }, [isDesktopPaused]);

  if (isLoading && !hasAnyData) {
    return <TopStudentsShowcaseSkeleton className={className} />;
  }

  if (!hasAnyData) {
    return null;
  }

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs sm:text-sm font-black tracking-tight text-foreground">
          Top Performers
        </h3>

        <Link
          href={
            desktopMode === "schools"
              ? schoolsLeaderboardHref
              : baseLeaderboardHref
          }
          className="group flex items-center gap-1 text-[11px] font-black text-primary dark:text-white transition-colors hover:text-primary/80 dark:hover:text-white/80 shrink-0"
        >
          <span>View All</span>
          <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* ================= MOBILE VIEW: INTERLEAVED ROTATOR (#1 Student -> #1 School -> #2 Student -> #2 School...) ================= */}
      <div
        className="relative lg:hidden"
        onMouseEnter={() => setIsMobilePaused(true)}
        onMouseLeave={() => setIsMobilePaused(false)}
        onTouchStart={() => setIsMobilePaused(true)}
        onTouchEnd={() => setIsMobilePaused(false)}
      >
        {/* Card Stage with fixed height so dissolving card transitions seamlessly without text bleed */}
        <div className="relative h-[108px] sm:h-[114px] w-full">
          {mobileItems.map((item, idx) => {
            const isCurrent = idx === activeMobileIndex;
            return (
              <div
                key={`${item.type}-${item.rank}-${idx}`}
                className={cn(
                  "absolute inset-0 transition-opacity duration-500 ease-in-out",
                  isCurrent
                    ? "opacity-100 z-10 pointer-events-auto visible"
                    : "opacity-0 z-0 pointer-events-none invisible",
                )}
              >
                {item.type === "student" && item.student ? (
                  <TopStudentHorizontalCard
                    student={item.student}
                    rank={item.rank}
                    className="h-full"
                    href={baseLeaderboardHref}
                  />
                ) : item.type === "school" && item.school ? (
                  <TopSchoolHorizontalCard
                    school={item.school}
                    rank={item.rank}
                    className="h-full"
                    href={schoolsLeaderboardHref}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= DESKTOP VIEW: 3-COLUMN ROTATING GRID ================= */}
      <div
        className="hidden lg:block relative"
        onMouseEnter={() => setIsDesktopPaused(true)}
        onMouseLeave={() => setIsDesktopPaused(false)}
      >
        <div className="relative min-h-[108px] sm:min-h-[114px] w-full">
          {/* Top 3 Students Grid */}
          <div
            className={cn(
              "grid grid-cols-3 gap-3.5 items-stretch transition-opacity duration-500 ease-in-out",
              desktopMode === "students"
                ? "opacity-100 pointer-events-auto visible"
                : "opacity-0 pointer-events-none invisible absolute inset-0",
            )}
          >
            {topThreeStudents.map((student, idx) => (
              <TopStudentHorizontalCard
                key={student.id || idx}
                student={student}
                rank={idx + 1}
                className="h-full"
                href={baseLeaderboardHref}
              />
            ))}
          </div>

          {/* Top 3 Schools Grid */}
          <div
            className={cn(
              "grid grid-cols-3 gap-3.5 items-stretch transition-opacity duration-500 ease-in-out",
              desktopMode === "schools"
                ? "opacity-100 pointer-events-auto visible"
                : "opacity-0 pointer-events-none invisible absolute inset-0",
            )}
          >
            {topThreeSchools.map((school, idx) => (
              <TopSchoolHorizontalCard
                key={school.id || idx}
                school={school}
                rank={idx + 1}
                className="h-full"
                href={schoolsLeaderboardHref}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
