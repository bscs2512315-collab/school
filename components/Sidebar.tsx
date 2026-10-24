"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/UserAvatar";
import AppLogo from "@/components/AppLogo";
import P1SVG from "@/public/svgs/P1SVG";
import P2SVG from "@/public/svgs/P2SCG";
import ClassroomSVG from "@/public/svgs/ClassroomSVG";
import SyllabusSVG from "@/public/svgs/SyllabusSVG";
import SubjectsSVG from "@/public/svgs/SubjectsSVG";
import SolvedNotesSVG from "@/public/svgs/SolvedNotesSVG";
import DashboardSVG from "@/public/svgs/DashboardSVG";
import SettingsSVG from "@/public/svgs/SettingsSVG";
import HistorySVG from "@/public/svgs/HistorySVG";
import GenerateSVG from "@/public/svgs/GenerateSVG";
import LabGameSVG from "@/public/svgs/LabGameSVG";
import NovaSVG from "@/public/svgs/NovaSVG";
import PracticalJournalSVG from "@/public/svgs/PracticalJournalSVG";
import SearchSVG from "@/public/svgs/SearchSVG";
import QuizzesSVG from "@/public/svgs/QuizzesSVG";
import PremiumSVG from "@/public/svgs/PremiumSVG";
import VoteSVG from "@/public/svgs/VoteSVG";
import LogoutSVG from "@/public/svgs/LogoutSVG";
import LeaderboardSVG from "@/public/svgs/LeaderboardSVG";
import BuildingSVG from "@/public/svgs/BuildingSVG";
import MilestonesSVG from "@/public/svgs/MilestonesSVG";
import StudentsSVG from "@/public/svgs/StudentsSVG";
import QuestionBankSVG from "@/public/svgs/QuestionBankSVG";
import ReviewExamsSVG from "@/public/svgs/ReviewExamsSVG";
import AddSVG from "@/public/svgs/AddSVG";
import HeartSVG from "@/public/svgs/HeartSVG";
import PlaySVG from "@/public/svgs/PlaySVG";
import AlertCircleSVG from "@/public/svgs/AlertCircleSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { APP_NAME } from "@/constants";
import { logoutAuthSession } from "@/lib/auth-session";
import { isSidebarNavActive } from "@/lib/quiz-screen";
import { useUserProfile } from "@/hooks/user/useUserProfile";
import { useStudentMilestones } from "@/hooks/student/useStudentMilestones";
import { UserRole } from "@/types/enums";
import { ThemeToggle } from "@/components/ThemeToggle";
import SidebarRankCard, { rankBadgeMap } from "@/components/SidebarRankCard";

interface SidebarProps {
    className?: string;
    onItemClick?: () => void;
    mobileChildPage?: boolean;
}

const adminNavItems = [
    { title: "Dashboard", href: "/admin/dashboard", icon: DashboardSVG },
    { title: "QA Bugs", href: "/admin/bugs", icon: AlertCircleSVG, badge: "QA" },
    { title: "Lectures Studio", href: "/admin/stories", icon: PlaySVG, isPremium: true },
    { title: "Brand Ads", href: FRONTEND_ROUTES.ADMIN_ADVERTISEMENTS, icon: PremiumSVG, badge: "Sponsors" },
    { title: "Curriculums", href: "/admin/curriculums", icon: SyllabusSVG },
    { title: "Subjects", href: "/admin/subjects", icon: SubjectsSVG },
    { title: "Institutes", href: FRONTEND_ROUTES.ADMIN_SCHOOLS, icon: BuildingSVG },
    { title: "User Management", href: FRONTEND_ROUTES.ADMIN_USERS, icon: StudentsSVG },
    { title: "User Activities", href: FRONTEND_ROUTES.ADMIN_ACTIVITIES, icon: HistorySVG },
    { title: "Past Papers 1", href: "/admin/past-papers-1", icon: P1SVG, badge: "MCQs" },
    { title: "Past Papers 2", href: "/admin/past-papers-2", icon: P2SVG },
    { title: "Add Past Paper", href: "/admin/upload-past-paper", icon: AddSVG },
    { title: "Question Bank", href: "/admin/question-bank", icon: QuestionBankSVG },
    { title: "Review Exams", href: "/admin/review-exams", icon: ReviewExamsSVG },
    { title: "Leaderboard", href: "/admin/leaderboard", icon: LeaderboardSVG },
    { title: "Search Friends", href: "/admin/friends", icon: SearchSVG },
    { title: "Milestones", href: "/admin/milestones", icon: MilestonesSVG },
    { title: "Train Nova", href: "/admin/train-bot", icon: NovaSVG },
    { title: "Settings", href: "/admin/settings", icon: SettingsSVG },
];

const ALLOWED_BETA_STUDENT_EMAIL = "mtahatalib110+aliya@gmail.com";

const qaNavItems = [
    { title: "Anna Voice AI", href: "/qa/anna", icon: SparklesSVG, badge: "AI" },
    { title: "QA Bugs Tracker", href: "/qa/bugs", icon: AlertCircleSVG, badge: "QA" },
    { title: "Dashboard", href: "/student/dashboard", icon: DashboardSVG },
    { title: "Past Papers 1", href: "/student/past-papers-1", icon: P1SVG, badge: "MCQs" },
    { title: "Past Papers 2", href: "/student/past-papers-2", icon: P2SVG },
    { title: "Papers Bank", href: FRONTEND_ROUTES.STUDENT_PAPERS_BANK, icon: QuestionBankSVG },
    { title: "My Quizzes", href: "/student/custom-quizzes", icon: QuizzesSVG },
    { title: "Syllabus", href: "/student/curriculums", icon: SyllabusSVG },
    { title: "Classrooms", href: FRONTEND_ROUTES.STUDENT_CLASSROOMS, icon: ClassroomSVG },
    { title: "Lectures", href: "/student/lectures", icon: PlaySVG, isPremium: true },
    { title: "Lab Game", href: "/student/lab-game", icon: LabGameSVG, isPremium: true },
    { title: "Practical Journals", href: FRONTEND_ROUTES.STUDENT_PRACTICAL_JOURNALS, icon: PracticalJournalSVG },
    { title: "Solved Notes", href: FRONTEND_ROUTES.STUDENT_SOLVED_NOTES, icon: SolvedNotesSVG, isPremium: true },
    { title: "Nova AI Tutor", href: "/student/nova", icon: NovaSVG },
    { title: "Leaderboard", href: "/student/leaderboard", icon: LeaderboardSVG },
    { title: "History", href: "/student/history", icon: HistorySVG },
    { title: "Settings", href: "/student/settings", icon: SettingsSVG },
];

const studentNavItems = [
    { title: "Dashboard", href: "/student/dashboard", icon: DashboardSVG },
    { title: "Classrooms", href: FRONTEND_ROUTES.STUDENT_CLASSROOMS, icon: ClassroomSVG },
    { title: "Lectures", href: "/student/lectures", icon: PlaySVG, isPremium: true },
    { title: "Lab Game", href: "/student/lab-game", icon: LabGameSVG, isPremium: true },
    { title: "Practical Journals", href: FRONTEND_ROUTES.STUDENT_PRACTICAL_JOURNALS, icon: PracticalJournalSVG },
    { title: "Solved Notes", href: FRONTEND_ROUTES.STUDENT_SOLVED_NOTES, icon: SolvedNotesSVG, isPremium: true },
    { title: "Syllabus", href: "/student/curriculums", icon: SyllabusSVG },
    { title: "Past Papers 1", href: "/student/past-papers-1", icon: P1SVG, badge: "MCQs" },
    { title: "Past Papers 2", href: "/student/past-papers-2", icon: P2SVG },
    { title: "Papers Bank", href: FRONTEND_ROUTES.STUDENT_PAPERS_BANK, icon: QuestionBankSVG },
    { title: "Play & Prep", href: "/student/generate", icon: GenerateSVG, isPremium: true },
    { title: "My Quizzes", href: "/student/custom-quizzes", icon: QuizzesSVG },
    { title: "Nova AI Tutor", href: "/student/nova", icon: NovaSVG },
    { title: "Leaderboard", href: "/student/leaderboard", icon: LeaderboardSVG },
    { title: "History", href: "/student/history", icon: HistorySVG },
    { title: "Settings", href: "/student/settings", icon: SettingsSVG },
];

const teacherNavItems = [
    { title: "Dashboard", href: FRONTEND_ROUTES.TEACHER_DASHBOARD, icon: DashboardSVG },
    { title: "Classrooms", href: FRONTEND_ROUTES.TEACHER_CLASSROOMS, icon: ClassroomSVG },
    { title: "Elections", href: FRONTEND_ROUTES.TEACHER_ELECTIONS, icon: VoteSVG },
    { title: "Students", href: FRONTEND_ROUTES.TEACHER_STUDENTS, icon: StudentsSVG },
    { title: "Student Activities", href: FRONTEND_ROUTES.TEACHER_ACTIVITIES, icon: HistorySVG },
    { title: "Solved Notes", href: FRONTEND_ROUTES.STUDENT_SOLVED_NOTES, icon: SolvedNotesSVG, isPremium: true },
    { title: "Syllabus", href: FRONTEND_ROUTES.TEACHER_CURRICULUMS, icon: SyllabusSVG },
    { title: "Past Papers 1", href: FRONTEND_ROUTES.TEACHER_PAST_PAPERS_1, icon: P1SVG, badge: "MCQs" },
    { title: "Past Papers 2", href: FRONTEND_ROUTES.TEACHER_PAST_PAPERS_2, icon: P2SVG },
    { title: "Papers Bank", href: FRONTEND_ROUTES.TEACHER_PAPERS_BANK, icon: QuestionBankSVG },
    { title: "Create Paper", href: FRONTEND_ROUTES.TEACHER_CREATE_PAPER, icon: GenerateSVG },
    { title: "Nova AI Tutor", href: FRONTEND_ROUTES.TEACHER_NOVA, icon: NovaSVG },
    { title: "Leaderboard", href: FRONTEND_ROUTES.TEACHER_LEADERBOARD, icon: LeaderboardSVG },
    { title: "Settings", href: FRONTEND_ROUTES.TEACHER_SETTINGS, icon: SettingsSVG },
];

function getSidebarNav(role: string | null, email?: string | null) {
    if (role === UserRole.ADMIN || role === "admin") {
        return {
            items: adminNavItems,
            dashboardHref: FRONTEND_ROUTES.ADMIN_DASHBOARD,
            accountHref: FRONTEND_ROUTES.ADMIN_ACCOUNT,
        };
    }
    if (role === UserRole.QA || role === "QA" || role === "qa" || email?.toLowerCase() === ALLOWED_BETA_STUDENT_EMAIL) {
        return {
            items: qaNavItems,
            dashboardHref: FRONTEND_ROUTES.STUDENT_DASHBOARD,
            accountHref: "/student/account",
        };
    }
    if (role === UserRole.TEACHER || role === "teacher") {
        return {
            items: teacherNavItems,
            dashboardHref: FRONTEND_ROUTES.TEACHER_DASHBOARD,
            accountHref: FRONTEND_ROUTES.TEACHER_SETTINGS,
        };
    }

    return {
        items: studentNavItems,
        dashboardHref: FRONTEND_ROUTES.STUDENT_DASHBOARD,
        accountHref: "/student/account",
    };
}

export default function Sidebar({ className, onItemClick, mobileChildPage = false }: SidebarProps) {
    const pathname = usePathname();

    const handleClose = onItemClick;

    const [userRole, setUserRole] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userName, setUserName] = useState("User");
    const [userImage, setUserImage] = useState<string | null>(null);

    const normalizeImageValue = (value: unknown): string | null => {
        if (!value) return null;
        const asString = String(value).trim();
        if (!asString || asString === "null" || asString === "undefined") return null;
        return asString;
    };

    React.useEffect(() => {
        const userStr = localStorage.getItem("exboard_user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setUserRole(user.role);
                setUserEmail(user.email || null);
                setUserName(user.name || "User");
                // Some responses use different field names; normalize here.
                const image =
                    user.profileImage ??
                    user.profile_image ??
                    user.profilePic ??
                    user.profilePicture ??
                    user.profile_picture ??
                    user.avatar ??
                    null;
                setUserImage(normalizeImageValue(image));
            } catch (e) {
                console.error("Failed to parse user", e);
            }
        }
    }, []);

    // The stored session is a snapshot: it misses the avatar for roles whose
    // login/onboarding payload omits it, and goes stale after a new upload.
    const profileQuery = useUserProfile();

    React.useEffect(() => {
        const profile = profileQuery.data;
        if (!profile) return;

        const fetchedImage = normalizeImageValue(profile.profileImage);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUserImage(fetchedImage);
        if (profile.name) setUserName(profile.name);
        if (profile.role) setUserRole(profile.role);
        if (profile.email) setUserEmail(profile.email);

        // Persist so the next render paints the avatar before the fetch resolves.
        try {
            const storedUserStr = localStorage.getItem("exboard_user");
            if (!storedUserStr) return;
            const parsed = JSON.parse(storedUserStr);
            parsed.profileImage = fetchedImage;
            localStorage.setItem("exboard_user", JSON.stringify(parsed));
        } catch {
            // Ignore persistence failures; UI will still be updated.
        }
    }, [profileQuery.data]);

    const handleLogout = async () => {
        try {
            await logoutAuthSession();
            if (onItemClick) onItemClick();
            window.location.replace(FRONTEND_ROUTES.LOGIN);
        } catch {
            window.alert("Could not sign out. Please try again.");
        }
    };

    const { items: navItems, dashboardHref, accountHref } = getSidebarNav(userRole, userEmail);

    const formatSidebarName = (name: string): string => {
        if (!name) return "User";
        const parts = name.trim().split(/\s+/);
        if (parts.length > 2) {
            return `${parts[0]} ${parts[1]}`;
        }
        return name;
    };

    const milestonesQuery = useStudentMilestones();
    const milestones = milestonesQuery.data ?? [];
    const highestMilestone = [...milestones].reverse().find((m) => m.unlocked) || null;
    const currentRankName = String(highestMilestone?.name || profileQuery.data?.rank || "Novice");
    const isStudentUser = !userRole || userRole === "STUDENT" || userRole === "student" || userRole === "QA" || userRole === "qa";
    const AvatarBadgeIcon = isStudentUser ? rankBadgeMap[currentRankName] : null;

    return (
        <aside
            className={cn(
                "dashboard-sidebar-gradient relative flex h-screen max-h-screen min-h-0 w-64 shrink-0 flex-col text-primary-foreground overflow-hidden supports-[height:100dvh]:h-dvh supports-[height:100dvh]:max-h-dvh print:hidden",
                className,
            )}
        >
            {/* Top dark vignette (matches Auth page branding so the logo pops) */}
            <div className="pointer-events-none absolute top-0 right-0 left-0 z-0 h-44 bg-linear-to-b from-black/55 via-black/25 to-transparent" />

            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-12 -left-12 size-48 rounded-full bg-primary-foreground/10 blur-3xl" />
                <div className="absolute bottom-10 -right-10 size-48 rounded-full bg-black/25 blur-3xl" />
            </div>

            <div className="relative z-10 flex items-center justify-between px-5 pb-5 pt-7">
                <Link
                    href={dashboardHref}
                    prefetch={true}
                    onClick={() => {
                        if (handleClose) handleClose();
                    }}
                    className="flex-1 min-w-0 flex items-center transition-transform active:scale-[0.98]"
                >
                    <AppLogo variant="sidebar" priority />
                </Link>
            </div>

            <div className="relative z-10 px-5 pb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/50">
                    Main Menu
                </p>
            </div>

            <nav className="relative z-10 min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
                {navItems.map((item) => {
                    const isActive = isSidebarNavActive(pathname, item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            prefetch={true}
                            onClick={() => {
                                if (onItemClick) onItemClick();
                            }}
                            className={cn(
                                "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.98]",
                                {
                                    "bg-primary-foreground/20 text-primary-foreground shadow-md": isActive,
                                    "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground": !isActive,
                                },
                            )}
                        >
                            <item.icon
                                className={cn("size-5 shrink-0", {
                                    "text-primary-foreground": isActive,
                                    "text-primary-foreground/90": !isActive,
                                })}
                            />
                            <span className="truncate">{item.title}</span>
                            {(item as { badge?: string }).badge ? (
                                <span className="ml-auto rounded-md bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-primary shadow-xs">
                                    {(item as { badge?: string }).badge}
                                </span>
                            ) : null}
                            {(item as { isPremium?: boolean }).isPremium ? (
                                <PremiumSVG className="ml-auto size-3.5 text-rank-1" />
                            ) : null}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto shrink-0 border-t border-primary-foreground/20 px-3 pb-4 pt-4">
                {mobileChildPage ? (
                    <ThemeToggle
                        label="Appearance"
                        disableHover
                        className="mb-2 w-full text-sm text-primary-foreground lg:hidden"
                    />
                ) : null}
                <div className="mb-2 flex items-center justify-between gap-1">
                    <Link
                        href={accountHref}
                        prefetch={true}
                        onClick={() => {
                            if (onItemClick) onItemClick();
                        }}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1.5 transition-all hover:bg-primary-foreground/10 active:scale-[0.98]"
                    >
                        <div className="relative shrink-0">
                            <UserAvatar
                                src={userImage}
                                name={userName}
                                size={36}
                                showRing
                                ringClassName="ring-2 ring-primary-foreground/30 shadow-xs"
                                className="size-9 shrink-0"
                            />
                            {AvatarBadgeIcon ? (
                                <div
                                    title={`Current Rank: ${currentRankName}`}
                                    className="pointer-events-none absolute -bottom-1 -right-1 z-10 flex size-4.5 items-center justify-center drop-shadow-md"
                                >
                                    <AvatarBadgeIcon className="size-full object-contain" />
                                </div>
                            ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-primary-foreground" title={userName}>
                                {formatSidebarName(userName)}
                            </p>
                            <p className="truncate text-[10px] uppercase tracking-wide text-primary-foreground/80">
                                {userRole || "Student"}
                            </p>
                        </div>
                    </Link>

                    <button
                        type="button"
                        onClick={handleLogout}
                        title="Sign Out"
                        aria-label="Sign Out"
                        className="group flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-200 border border-red-400/30 shadow-xs backdrop-blur-xs transition-all duration-200 hover:bg-red-500/35 hover:text-white hover:border-red-400/60 hover:shadow-[0_0_12px_rgba(239,68,68,0.35)] active:scale-95 cursor-pointer"
                    >
                        <LogoutSVG className="size-5.5 shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:translate-x-0.5" />
                    </button>
                </div>

                {/* Compact Current Rank & Next Milestone Card */}
                {(!userRole || userRole === "STUDENT" || userRole === "student" || userRole === "QA" || userRole === "qa") && (
                    <div className="mb-2">
                        <SidebarRankCard onItemClick={onItemClick} />
                    </div>
                )}

                <div className="mt-4 text-center text-[10px] leading-relaxed text-primary-foreground">
                    <p>© {new Date().getFullYear()} {APP_NAME}</p>
                    <p className="mt-1 inline-flex items-center justify-center gap-1">
                         Developed with <HeartSVG className="size-3 text-[#ef4444]" /> by Muhammad Taha Talib
                    </p>
                </div>
            </div>
        </aside>
    );
}
