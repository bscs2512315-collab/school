"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import AuthGuard from "@/components/AuthGuard";
import MobileBottomNav from "@/components/MobileBottomNav";
import { usePathname } from "next/navigation";
import { isChildRoute } from "@/lib/layout/route-navigation";

export default function SchoolLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const isChildPage = isChildRoute(pathname);
    const mainRef = React.useRef<HTMLElement | null>(null);

    // Auto-close on route change & reset scroll
    React.useEffect(() => {
        setIsMobileMenuOpen(false);
        if (mainRef.current) {
            mainRef.current.scrollTop = 0;
        }
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, [pathname]);

    // Map pathnames to titles
    const getPageTitle = (path: string) => {
        const segments = path.split('/').filter(Boolean);
        if (segments.length <= 1) return "School Portal";

        // Filter out UUIDs or MongoIDs
        const filteredSegments = segments.filter(seg => !/^[0-9a-fA-F-]{24,36}$/.test(seg));

        const lastSegment = filteredSegments[filteredSegments.length - 1];
        if (!lastSegment || lastSegment === "school" || lastSegment === "dashboard") return "Dashboard";

        return lastSegment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden print:h-auto print:overflow-visible">
            {/* Desktop Sidebar */}
            <Sidebar className="hidden lg:flex" />

            {/* Mobile Sidebar Overlay */}
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

            {/* Mobile Sidebar */}
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
                    mobileChildPage={isChildPage}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative print:h-auto print:overflow-visible">
                <TopHeader
                    title={getPageTitle(pathname)}
                    onMenuClick={() => setIsMobileMenuOpen(true)}
                    isChildPage={isChildPage}
                    mobileChildPage={isChildPage}
                />

                <main ref={mainRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto custom-scrollbar print:h-auto print:overflow-visible">
                    <div className="flex min-h-full flex-1 flex-col pb-mobile-nav animate-in fade-in duration-500 print:animate-none">
                        <AuthGuard>{children}</AuthGuard>
                        <div
                            className="h-28 sm:h-32 w-full shrink-0 lg:hidden pointer-events-none select-none"
                            aria-hidden="true"
                        />
                    </div>
                </main>

                <MobileBottomNav />
            </div>
        </div>
    );
}
