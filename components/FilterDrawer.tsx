"use client";

import React, { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface FilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function FilterDrawer({ isOpen, onClose, title = "Filters", children }: FilterDrawerProps) {
    const mounted = useSyncExternalStore(subscribeToClient, getClientSnapshot, getServerSnapshot);

    // Only lock scrolling while an actual drawer is present.
    useEffect(() => {
        if (!isOpen) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    // A closed drawer must have no hit area, even in browsers that fail to
    // apply the offscreen transform used by some mobile WebViews.
    if (!mounted || !isOpen) return null;

    const handleClose = (e?: React.SyntheticEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        onClose();
    };

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                aria-hidden="true"
                className="fixed inset-0 z-100 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={handleClose}
            />

            {/* Drawer */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onClick={(e) => e.stopPropagation()}
                className="fixed top-0 right-0 z-101 flex h-full w-full flex-col border-l border-border bg-card shadow-2xl animate-in fade-in duration-200 sm:w-[400px]"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border/50">
                    <h2 className="text-xl font-black">{title}</h2>
                    <button
                        type="button"
                        aria-label="Close filters"
                        onClick={handleClose}
                        className="h-10 w-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X size={20} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {children}
                </div>
            </div>
        </>,
        document.body
    );
}
