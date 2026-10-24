import { FRONTEND_ROUTES } from "@/constants/endpoints";

export function isQuizScreenPath(pathname: string): boolean {
    const p = pathname.replace(/\/+$/, "");
    return (
        /^\/student\/past-paper\/[^/]+\/attempt(?:-paper2)?$/.test(p) ||
        /^\/student\/teacher-papers\/[^/]+\/attempt$/.test(p) ||
        /^\/student\/custom-quizzes\/[^/]+\/solve$/.test(p) ||
        /^\/student\/papers-bank\/[^/]+\/attempt$/.test(p) ||
        /^\/student\/challenge\/[^/]+$/.test(p) ||
        /^\/student\/lightning\/[^/]+$/.test(p)
    );
}

export function isBottomNavHiddenPath(pathname: string): boolean {
    const normalizedPath = pathname.replace(/\/+$/, "");
    return (
        isQuizScreenPath(pathname) ||
        normalizedPath === FRONTEND_ROUTES.STUDENT_GENERATE
    );
}

/** Student bottom bar: show on the 5 tab roots (and their nested routes). */
export function isStudentDashboardBottomNavHidden(pathname: string): boolean {
    const normalizedPath = pathname.replace(/\/+$/, "");
    const tabRoots = [
        FRONTEND_ROUTES.STUDENT_DASHBOARD,
        FRONTEND_ROUTES.STUDENT_LEADERBOARD,
        FRONTEND_ROUTES.STUDENT_GENERATE,
        FRONTEND_ROUTES.STUDENT_CLASSROOMS,
        FRONTEND_ROUTES.STUDENT_NOVA,
    ];

    const isTabPage = tabRoots.some(
        (href) =>
            normalizedPath === href || normalizedPath.startsWith(`${href}/`),
    );

    return !isTabPage;
}

/** Teacher bottom bar: show on the teacher tab roots (and their nested routes). */
export function isTeacherDashboardBottomNavHidden(pathname: string): boolean {
    const normalizedPath = pathname.replace(/\/+$/, "");
    const tabRoots = [
        FRONTEND_ROUTES.TEACHER_DASHBOARD,
        FRONTEND_ROUTES.TEACHER_CLASSROOMS,
        FRONTEND_ROUTES.TEACHER_CREATE_PAPER,
        FRONTEND_ROUTES.TEACHER_NOVA,
        FRONTEND_ROUTES.TEACHER_SETTINGS,
        "/teacher/account",
    ];

    const isTabPage = tabRoots.some(
        (href) =>
            normalizedPath === href || normalizedPath.startsWith(`${href}/`),
    );

    return !isTabPage;
}

export function isImmersiveMainPath(pathname: string): boolean {
    const p = pathname.replace(/\/+$/, "");
    return (
        p === FRONTEND_ROUTES.STUDENT_NOVA ||
        p === FRONTEND_ROUTES.TEACHER_NOVA ||
        p === "/student/nova" ||
        p === "/teacher/nova" ||
        isQuizScreenPath(pathname)
    );
}

// The 3D lab experiences run full-screen: no sidebar, no header, no scroll.
// Only the actual scenes — NOT menu pages like /lab-game or /lab-game/chemistry.
export function isFullscreenPath(pathname: string): boolean {
    const p = pathname.replace(/\/+$/, "");
    return /^\/student\/lab-game\/(walk|spike|glucose-test|practical-[a-z0-9-]+)$/.test(p);
}

export function isPastPaper1ActivePath(pathname: string): boolean {
    return (
        /^\/student\/past-paper\/[^/]+(\/attempt|\/view)?$/.test(pathname) &&
        !pathname.includes("paper2")
    );
}

export function isPastPaper2ActivePath(pathname: string): boolean {
    return /^\/student\/past-paper\/[^/]+\/attempt-paper2$/.test(pathname);
}

export function isSidebarNavActive(pathname: string, href: string): boolean {
    if (pathname === href) return true;

    if (
        href === "/student/past-papers-1" ||
        href === FRONTEND_ROUTES.TEACHER_PAST_PAPERS_1 ||
        href === "/admin/past-papers-1"
    ) {
        return isPastPaper1ActivePath(pathname);
    }

    if (
        href === "/student/past-papers-2" ||
        href === FRONTEND_ROUTES.TEACHER_PAST_PAPERS_2 ||
        href === "/admin/past-papers-2"
    ) {
        return isPastPaper2ActivePath(pathname);
    }

    if (
        href === "/student/curriculums" ||
        href === FRONTEND_ROUTES.TEACHER_CURRICULUMS ||
        href === "/admin/curriculums" ||
        href.endsWith("/curriculums")
    ) {
        const singularRoot = href.replace(/s$/, "");
        return (
            pathname === href ||
            pathname.startsWith(`${href}/`) ||
            pathname === singularRoot ||
            pathname.startsWith(`${singularRoot}/`)
        );
    }

    return pathname.startsWith(`${href}/`);
}
