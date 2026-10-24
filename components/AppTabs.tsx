"use client";

import React, { type ComponentType, type SVGProps } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
    label: string;
    value: string;
    icon?: ComponentType<SVGProps<SVGSVGElement>>;
    count?: number;
    hideLabelOnMobile?: boolean;
    mobileLabel?: string;
}

interface AppTabsProps {
    tabs: TabItem[];
    activeTab: string;
    onChange: (value: string) => void;
    className?: string;
    /** Stretch to full width with equal tab columns (e.g. 50/50 for 2 tabs). */
    fullWidth?: boolean;
}

export default function AppTabs({
    tabs,
    activeTab,
    onChange,
    className,
    fullWidth = false,
}: AppTabsProps) {
    return (
        <div
            className={cn(
                "shrink-0 flex items-center gap-1 overflow-x-auto rounded-3xl border border-border/40 bg-card p-1.5 scrollbar-hide min-h-[48px] sm:min-h-[52px]",
                {
                    "w-full": fullWidth,
                    "w-fit": !fullWidth,
                },
                className,
            )}
        >
            {tabs.map((tab) => {
                const isActive = activeTab === tab.value;
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.value}
                        type="button"
                        onClick={() => onChange(tab.value)}
                        className={cn(
                            "flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all sm:gap-2 sm:px-4 sm:py-3 sm:text-xs",
                            {
                                "flex-1": fullWidth,
                                "w-fit": !fullWidth,
                                "bg-primary text-primary-foreground shadow-lg shadow-primary/20":
                                    isActive,
                                "text-muted-foreground hover:bg-muted": !isActive,
                            },
                        )}
                    >
                        {Icon ? <Icon className="size-4 shrink-0" /> : null}

                        <span
                            className={cn({
                                "hidden sm:inline":
                                    Boolean(tab.mobileLabel) || Boolean(tab.hideLabelOnMobile),
                                inline:
                                    !tab.mobileLabel && !tab.hideLabelOnMobile,
                            })}
                        >
                            {tab.label}
                        </span>

                        {tab.mobileLabel ? (
                            <span className="sm:hidden">{tab.mobileLabel}</span>
                        ) : null}

                        {tab.count ? (
                            <span
                                className={cn(
                                    "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] font-black sm:h-5 sm:min-w-5 sm:text-[10px]",
                                    {
                                        "bg-primary-foreground/20 text-primary-foreground":
                                            isActive,
                                        "bg-primary text-primary-foreground": !isActive,
                                    },
                                )}
                            >
                                {tab.count}
                            </span>
                        ) : null}
                    </button>
                );
            })}
        </div>
    );
}
