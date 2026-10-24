"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import AuthGuard from "@/components/AuthGuard";
import { usePathname } from "next/navigation";
import { AuthGuardType } from "@/types/enums";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const mainRef = React.useRef<HTMLElement | null>(null);

    // Auto-close on route change & reset scroll
    React.useEffect(() => {
        setIsMobileMenuOpen(false);
        if (mainRef.current) {
            mainRef.current.scrollTop = 0;
        }
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, [pathname]);

    const getPageTitle = (path: string) => {
        const segments = path.split('/').filter(Boolean);
        if (segments.length <= 1) return "Student Dashboard";

        const lastSegment = segments[segments.length - 1];
        return lastSegment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="flex h-screen bg-card text-foreground overflow-hidden">
            <Sidebar className="hidden lg:flex" />

            {isMobileMenuOpen ? (
                <button
                    type="button"
                    aria-label="Close navigation menu"
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden cursor-pointer"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsMobileMenuOpen(false);
                    }}
                >
                    <span aria-hidden className="pointer-events-none absolute inset-0 backdrop-blur-sm" />
                </button>
            ) : null}

            <div className={`
                fixed inset-y-0 left-0 w-64 bg-card z-50 transform transition-transform duration-300 ease-in-out lg:hidden
                ${isMobileMenuOpen ? '' : 'pointer-events-none'}
            `} style={{
                transform: isMobileMenuOpen ? "translate3d(0, 0, 0)" : "translate3d(-100%, 0, 0)",
                visibility: isMobileMenuOpen ? "visible" : "hidden",
            }}>
                <Sidebar
                    className="w-full border-none"
                    onItemClick={() => setIsMobileMenuOpen(false)}
                />
            </div>

            <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
                <TopHeader
                    title={getPageTitle(pathname)}
                    onMenuClick={() => setIsMobileMenuOpen(true)}
                />

                <main ref={mainRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto custom-scrollbar p-6 lg:p-10">
                    <div className="mx-auto flex min-h-full w-full max-w-7xl flex-1 flex-col animate-in fade-in duration-500">
                        <AuthGuard type={AuthGuardType.PRIVATE}>{children}</AuthGuard>
                    </div>
                </main>
            </div>
        </div>
    );
}
