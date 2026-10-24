"use client";

import { X, HelpCircle, Loader2 } from "lucide-react";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import AlertCircleSVG from "@/public/svgs/AlertCircleSVG";
import { Typography } from "./ui/Typography";
import { cn } from "@/lib/utils";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "primary" | "warning" | "danger" | "success";
    isLoading?: boolean;
    onCancelClick?: () => void;
}

const variantStyles = {
    primary: {
        icon: HelpCircle,
        iconColor: "text-primary dark:text-foreground",
        iconBg: "bg-primary/10 border-primary/20 ring-primary/5 dark:bg-muted dark:border-border",
        confirmButtonClass: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20",
    },
    warning: {
        icon: AlertCircleSVG,
        iconColor: "text-amber-500 dark:text-amber-400",
        iconBg: "bg-amber-500/10 border-amber-500/25 ring-amber-500/10",
        confirmButtonClass: "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-white dark:hover:bg-amber-400 shadow-amber-500/20",
    },
    danger: {
        icon: DeleteSVG,
        iconColor: "text-destructive",
        iconBg: "bg-destructive/10 border-destructive/25 ring-destructive/10",
        confirmButtonClass: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-destructive/20",
    },
    success: {
        icon: CheckCircleSVG,
        iconColor: "text-primary",
        iconBg: "bg-primary/10 border-primary/25 ring-primary/10",
        confirmButtonClass: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20",
    },
};

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "primary",
    isLoading = false,
    onCancelClick,
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const style = variantStyles[variant] || variantStyles.primary;
    const Icon = style.icon;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-sm sm:max-w-md rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
                {/* Close X button */}
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    aria-label="Close"
                    className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                    <X className="size-4" />
                </button>

                {/* Centered Icon Badge */}
                <div className={cn("mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border ring-8 shadow-inner sm:size-16 sm:rounded-3xl", style.iconBg)}>
                    <Icon className={cn("size-7 sm:size-8", style.iconColor)} />
                </div>

                {/* Title */}
                <Typography variant="h3" className="mb-2 text-lg sm:text-xl font-bold tracking-tight text-foreground">
                    {title}
                </Typography>

                {/* Message */}
                <p className="mx-auto max-w-xs sm:max-w-sm whitespace-pre-line text-xs sm:text-sm font-medium leading-relaxed text-muted-foreground">
                    {message}
                </p>

                {/* Action Buttons */}
                <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-7">
                    <button
                        type="button"
                        onClick={onCancelClick || onClose}
                        disabled={isLoading}
                        className="inline-flex h-11 sm:h-12 w-full items-center justify-center rounded-xl sm:rounded-2xl border border-border bg-background px-4 text-xs sm:text-sm font-bold text-muted-foreground transition-all hover:border-border/80 hover:bg-muted hover:text-foreground active:scale-95 disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={cn(
                            "inline-flex h-11 sm:h-12 w-full items-center justify-center rounded-xl sm:rounded-2xl px-4 text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50",
                            style.confirmButtonClass
                        )}
                    >
                        {isLoading ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            confirmLabel
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
