"use client";

import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import LeaderboardSVG from "@/public/svgs/LeaderboardSVG";
import DashboardSVG from "@/public/svgs/DashboardSVG";
import SettingsSVG from "@/public/svgs/SettingsSVG";
import GenerateSVG from "@/public/svgs/GenerateSVG";
import ClassroomSVG from "@/public/svgs/ClassroomSVG";
import NewChatSVG from "@/public/svgs/NewChatSVG";

interface NavItem {
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  isCenter?: boolean;
}

const studentBottomNavItems: NavItem[] = [
  {
    href: FRONTEND_ROUTES.STUDENT_DASHBOARD,
    icon: DashboardSVG,
    label: "Home",
  },
  {
    href: FRONTEND_ROUTES.STUDENT_LEADERBOARD,
    icon: LeaderboardSVG,
    label: "Rank",
  },
  {
    href: FRONTEND_ROUTES.STUDENT_GENERATE,
    icon: GenerateSVG,
    label: "Play & Prep",
    isCenter: true,
  },
  {
    href: FRONTEND_ROUTES.STUDENT_CLASSROOMS,
    icon: ClassroomSVG,
    label: "Class",
  },
  {
    href: FRONTEND_ROUTES.STUDENT_NOVA,
    icon: NewChatSVG,
    label: "Nova",
  },
];

const teacherBottomNavItems: NavItem[] = [
  {
    href: FRONTEND_ROUTES.TEACHER_DASHBOARD,
    icon: DashboardSVG,
    label: "Home",
  },
  {
    href: FRONTEND_ROUTES.TEACHER_CLASSROOMS,
    icon: ClassroomSVG,
    label: "Classrooms",
  },
  {
    href: FRONTEND_ROUTES.TEACHER_CREATE_PAPER,
    icon: GenerateSVG,
    label: "Create",
    isCenter: true,
  },
  {
    href: FRONTEND_ROUTES.TEACHER_NOVA,
    icon: NewChatSVG,
    label: "Nova",
  },
  {
    href: FRONTEND_ROUTES.TEACHER_SETTINGS,
    icon: SettingsSVG,
    label: "Profile",
  },
];

const schoolBottomNavItems: NavItem[] = [
  {
    href: FRONTEND_ROUTES.SCHOOL_DASHBOARD,
    icon: DashboardSVG,
    label: "Home",
  },
  {
    href: "/school/classrooms",
    icon: ClassroomSVG,
    label: "Classrooms",
  },
  {
    href: "/school/leaderboard",
    icon: LeaderboardSVG,
    label: "Rank",
  },
  {
    href: "/school/settings",
    icon: SettingsSVG,
    label: "Settings",
  },
];

export default function MobileBottomNav({ hidden = false }: { hidden?: boolean }) {
  const pathname = usePathname();
  const isTeacher = pathname.startsWith("/teacher");
  const isSchool = pathname.startsWith("/school");

  const bottomNavItems = useMemo(() => {
    if (isTeacher) return teacherBottomNavItems;
    if (isSchool) return schoolBottomNavItems;
    return studentBottomNavItems;
  }, [isTeacher, isSchool]);

  const dashboardHref = useMemo(() => {
    if (isTeacher) return FRONTEND_ROUTES.TEACHER_DASHBOARD;
    if (isSchool) return FRONTEND_ROUTES.SCHOOL_DASHBOARD;
    return FRONTEND_ROUTES.STUDENT_DASHBOARD;
  }, [isTeacher, isSchool]);

  const activeIndex = useMemo(() => {
    const exact = bottomNavItems.findIndex((item) => pathname === item.href);
    if (exact !== -1) return exact;

    const nested = bottomNavItems.findIndex(
      (item) => item.href !== dashboardHref && pathname.startsWith(item.href)
    );
    if (nested !== -1) return nested;

    if (isTeacher && pathname === "/teacher/account") {
      const profileIndex = bottomNavItems.findIndex(
        (item) => item.href === FRONTEND_ROUTES.TEACHER_SETTINGS
      );
      if (profileIndex !== -1) return profileIndex;
    }

    return 0;
  }, [pathname, bottomNavItems, dashboardHref, isTeacher]);

  if (hidden) return null;

  return (
    <>
      {/* Background shield: solid white covering the area below the bottom bar so page content is never visible in the safe area */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 lg:hidden flex flex-col justify-end"
      >
        <div className="h-6 w-full bg-gradient-to-t from-white/95 to-transparent dark:from-background/95 dark:to-transparent" />
        <div className="h-[calc(max(0.6rem,env(safe-area-inset-bottom,12px))+10px)] w-full bg-white dark:bg-background" />
      </div>

      <nav
        aria-label={
          isTeacher
            ? "Teacher navigation"
            : isSchool
            ? "School navigation"
            : "Student navigation"
        }
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom,12px))] lg:hidden"
      >
        <div className="pointer-events-auto mx-auto flex h-[4.25rem] max-w-md items-center justify-around rounded-[1.75rem] border border-border/70 bg-white dark:bg-card px-1.5 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.14),0_4px_16px_-2px_rgba(0,0,0,0.06)] dark:shadow-[0_14px_36px_-6px_rgba(0,0,0,0.7)] ring-1 ring-white/20 dark:ring-white/5">
        {bottomNavItems.map((item, index) => {
          const isActive = index === activeIndex;

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className="group relative -mt-5 flex flex-1 flex-col items-center justify-center select-none"
              >
                <div
                  className={cn(
                    "relative flex size-12 items-center justify-center rounded-2xl shadow-lg transition-all duration-300 active:scale-90 bg-primary text-primary-foreground ring-4 ring-background",
                    isActive
                      ? "shadow-primary/30 scale-105"
                      : "shadow-primary/20 group-hover:scale-105"
                  )}
                >
                  <item.icon className="size-6 transition-transform duration-300 group-hover:rotate-6" />
                </div>
                <span
                  className={cn(
                    "mt-1.5 text-[9.5px] font-bold tracking-tight transition-colors duration-200",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className="group relative flex h-full flex-1 flex-col items-center justify-center gap-1 select-none active:scale-90 transition-transform duration-150"
            >
              <div
                className={cn(
                  "relative flex items-center justify-center transition-colors duration-200",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground/70 group-hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "size-5.5 transition-transform duration-200",
                    isActive ? "scale-105" : "group-hover:scale-105"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10.5px] tracking-tight transition-colors duration-200",
                  isActive
                    ? "font-bold text-primary"
                    : "font-medium text-muted-foreground/70 group-hover:text-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
    </>
  );
}
