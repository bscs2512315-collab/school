"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { AuthGuardType } from "@/types/enums";
import AppLoader from "@/components/AppLoader";
import {
    clearAuthSession,
    ensureStoredUser,
    getDashboardRouteForRole,
    getStoredUser,
    hasConsistentAuthSession,
} from "@/lib/auth-session";

interface AuthGuardProps {
    children: React.ReactNode;
    type?: AuthGuardType;
}

function clearSessionFromQuery(): void {
    if (typeof window === "undefined") {
        return;
    }

    try {
        const url = new URL(window.location.href);
        const sessionParam = url.searchParams.get("session");
        if (sessionParam === "invalid" || sessionParam === "expired") {
            // Only clear local storage if the user is not actively authenticated
            if (!hasConsistentAuthSession()) {
                clearAuthSession();
            }
            // Strip the session query param so subsequent logins on this page don't get wiped
            url.searchParams.delete("session");
            const cleanUrl = url.pathname + (url.search ? url.search : "");
            window.history.replaceState({}, "", cleanUrl);
        }
    } catch {
        // Ignore URL parsing errors
    }
}

export default function AuthGuard({ children, type = AuthGuardType.PRIVATE }: AuthGuardProps) {
    const isPublic = type === AuthGuardType.PUBLIC;
    const isVerifyingRef = useRef(false);

    // Check auth status synchronously on the client so that unallowed content never flashes.
    const [isAllowed, setIsAllowed] = useState<boolean>(() => {
        if (typeof window === "undefined") {
            return true;
        }
        const loggedIn = hasConsistentAuthSession();
        return isPublic ? !loggedIn : loggedIn;
    });

    const verifyAuth = useCallback(async () => {
        if (isVerifyingRef.current) return;
        isVerifyingRef.current = true;

        try {
            clearSessionFromQuery();
            let loggedIn = hasConsistentAuthSession();

            if (isPublic) {
                if (loggedIn) {
                    setIsAllowed(false);
                    const user = getStoredUser();
                    window.location.replace(getDashboardRouteForRole(user?.role as string));
                    return;
                }
                setIsAllowed(true);
            } else {
                if (!loggedIn) {
                    // Attempt server profile restoration before concluding the user is unauthenticated
                    const restoredUser = await ensureStoredUser();
                    if (restoredUser?.id || restoredUser?.userId) {
                        setIsAllowed(true);
                        return;
                    }

                    setIsAllowed(false);
                    clearAuthSession();
                    window.location.replace(`${FRONTEND_ROUTES.LOGIN}?session=expired`);
                    return;
                }
                setIsAllowed(true);
            }
        } finally {
            isVerifyingRef.current = false;
        }
    }, [isPublic]);

    useEffect(() => {
        void verifyAuth();

        // Handle Back/Forward Cache (bfcache) restoration when user presses browser back/forward buttons
        const handlePageShow = () => {
            void verifyAuth();
        };

        // Listen for storage events (e.g. user logged out or logged in from another tab)
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === "exboard_user" || event.key === null) {
                void verifyAuth();
            }
        };

        // Listen for custom auth events within the current tab (e.g. logout clicked)
        const handleAuthChange = () => {
            void verifyAuth();
        };

        window.addEventListener("pageshow", handlePageShow);
        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("exboard_auth_changed", handleAuthChange);

        return () => {
            window.removeEventListener("pageshow", handlePageShow);
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("exboard_auth_changed", handleAuthChange);
        };
    }, [verifyAuth]);

    if (!isAllowed) {
        return <AppLoader fullScreen className="bg-background" />;
    }

    return <>{children}</>;
}

