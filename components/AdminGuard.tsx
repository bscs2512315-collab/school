"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { UserRole } from "@/types/enums";
import AppLoader from "@/components/AppLoader";
import {
    clearAuthSession,
    ensureStoredUser,
    getDashboardRouteForRole,
    getStoredUser,
    hasConsistentAuthSession,
} from "@/lib/auth-session";

interface AdminGuardProps {
    children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
    const isVerifyingRef = useRef(false);
    const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
        if (typeof window === "undefined") return true;
        return hasConsistentAuthSession();
    });

    const verifyAdmin = useCallback(async () => {
        if (isVerifyingRef.current) return;
        isVerifyingRef.current = true;

        try {
            let loggedIn = hasConsistentAuthSession();
            let user = getStoredUser();

            if (!loggedIn || !user) {
                const restored = await ensureStoredUser();
                if (restored?.id || restored?.userId) {
                    user = restored;
                    loggedIn = true;
                }
            }

            if (!loggedIn || !user) {
                setIsAuthorized(false);
                clearAuthSession();
                window.location.replace(`${FRONTEND_ROUTES.LOGIN}?session=expired`);
                return;
            }

            const sharedRoutes = [
                "/admin/dashboard",
                "/admin/curriculums",
                "/admin/curriculum",
                "/admin/past-papers",
                "/admin/past-paper",
                "/admin/leaderboard",
            ];

            const isSharedRoute = sharedRoutes.some((route) =>
                window.location.pathname.startsWith(route),
            );

            const normalizedRole = String(user.role || "").toUpperCase();

            if (isSharedRoute || normalizedRole === UserRole.ADMIN) {
                setIsAuthorized(true);
                return;
            }

            if (normalizedRole !== UserRole.ADMIN) {
                setIsAuthorized(false);
                window.location.replace(getDashboardRouteForRole(user.role as string));
                return;
            }

            setIsAuthorized(true);
        } finally {
            isVerifyingRef.current = false;
        }
    }, []);

    useEffect(() => {
        void verifyAdmin();

        // Handle Back/Forward Cache (bfcache) restoration when user presses browser back/forward buttons
        const handlePageShow = () => {
            void verifyAdmin();
        };

        // Listen for storage events (e.g. user logged out from another tab)
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === "exboard_user" || event.key === null) {
                void verifyAdmin();
            }
        };

        // Listen for custom auth events within the current tab (e.g. logout clicked)
        const handleAuthChange = () => {
            void verifyAdmin();
        };

        window.addEventListener("pageshow", handlePageShow);
        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("exboard_auth_changed", handleAuthChange);

        return () => {
            window.removeEventListener("pageshow", handlePageShow);
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("exboard_auth_changed", handleAuthChange);
        };
    }, [verifyAdmin]);

    if (!isAuthorized) {
        return <AppLoader fullScreen className="bg-background" />;
    }

    return <>{children}</>;
}

