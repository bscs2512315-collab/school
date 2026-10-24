"use client";

import React from "react";
import { Typography } from "./ui/Typography";
import { cn } from "@/lib/utils";
import { LucideIcon, ChevronRight } from "lucide-react";

interface AppCardProps {
    title?: string;
    description?: string;
    icon?: LucideIcon;
    children?: React.ReactNode;
    metadata?: {
        label: string;
        value: string | number;
    }[];
    actions?: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
    onClick?: () => void;
    status?: "active" | "inactive" | "pending" | "none";
}

export default function AppCard({
    title,
    description,
    icon: Icon,
    children,
    metadata,
    actions,
    footer,
    className,
    onClick,
    status = "none",
}: AppCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative rounded-[2.5rem] p-7 transition-all duration-500 hover:-translate-y-2",
                "prof-mesh-gradient border border-background/40 shadow-xl shadow-black/5 overflow-hidden",
                onClick ? "cursor-pointer" : "",
                className
            )}
        >
            {/* Professional Subtle Ripples */}
            <div className="prof-ripple-container">
                <div className="prof-ripple prof-ripple-1"></div>
                <div className="prof-ripple prof-ripple-2"></div>
                <div className="prof-ripple prof-ripple-3"></div>
            </div>

            {/* Glass Background Overlay */}
            <div className="absolute inset-0 bg-background/60 dark:bg-black/40 backdrop-blur-[1px] z-0" />

            <div className="relative z-10 h-full flex flex-col">
                {(title || status !== "none") && (
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            {title && (
                                <Typography
                                    variant="h4"
                                    className="text-2xl font-black text-brand-dark leading-tight tracking-tight group-hover:text-primary transition-colors duration-300"
                                >
                                    {title}
                                </Typography>
                            )}
                        </div>

                        {status !== "none" && (
                            <div className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md shrink-0",
                                status === "active" ? "bg-green-500/10 text-green-700 border-green-200" :
                                    status === "pending" ? "bg-amber-500/10 text-amber-700 border-amber-200" :
                                        "bg-slate-500/10 text-slate-700 border-slate-200"
                            )}>
                                {status}
                            </div>
                        )}
                    </div>
                )}

                {(description || children) && (
                    <div className="space-y-2 mb-6">
                        {description && (
                            <Typography
                                variant="muted"
                                className="text-base font-medium leading-relaxed line-clamp-2 text-brand-dark/70"
                            >
                                {description}
                            </Typography>
                        )}
                        {children}
                    </div>
                )}

                <div className="mt-auto space-y-4">
                    {metadata && metadata.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 border-t border-black/5 dark:border-background/5 pt-5">
                            {metadata.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="flex flex-col gap-0.5">
                                    <span className="text-[10px] uppercase font-black tracking-[0.15em] text-brand-dark/40">
                                        {item.label}
                                    </span>
                                    <span className="text-sm font-bold text-brand-dark">
                                        {item.value || "—"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {(actions || footer) && (
                        <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-background/5">
                            <div className="flex-1">
                                {footer}
                            </div>
                            {actions && (
                                <div className="flex items-center gap-1 opacity-100 transition-all duration-300 no-print">
                                    {actions}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
