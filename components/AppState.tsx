"use client";

import type { ComponentType, ReactNode, SVGProps } from 'react';
import { WifiOff } from 'lucide-react';
import { cn } from '../lib/utils';
import AppButton from './AppButton';
import AppLoader from "./AppLoader";
import NovaEmptyState from './NovaEmptyState';
import CloseCircleSVG from '@/public/svgs/CloseCircleSVG';
import SparklesSVG from '@/public/svgs/SparklesSVG';
import { useIsOffline, isNetworkError, OFFLINE_TITLE, OFFLINE_DESCRIPTION } from '@/lib/offline';

type AppIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type AppStateVariant = 'loading' | 'error' | 'empty' | 'offline';

interface AppStateProps {
    variant?: AppStateVariant;
    isLoading?: boolean;
    isEmpty?: boolean;
    emptyMessage?: string;
    title?: string;
    description?: string;
    icon?: AppIcon;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
    fullScreen?: boolean;
    children?: ReactNode;
}

const defaultConfig: Record<
    AppStateVariant,
    { title: string; description: string; icon: AppIcon }
> = {
    loading: {
        title: 'Loading',
        description: 'Please wait while we load your data...',
        icon: SparklesSVG,
    },
    error: {
        title: 'OOPS!',
        description: 'We encountered an error. Please try again.',
        icon: CloseCircleSVG,
    },
    empty: {
        title: 'OOPS!',
        description: "We can't find what you are looking for",
        icon: SparklesSVG,
    },
    offline: {
        title: OFFLINE_TITLE,
        description: OFFLINE_DESCRIPTION,
        icon: WifiOff,
    },
};

export default function AppState({
    variant,
    isLoading: isLoadingProp,
    isEmpty: isEmptyProp,
    emptyMessage,
    title,
    description,
    icon,
    action,
    className,
    fullScreen = true,
    children,
}: AppStateProps) {
    const isClientOffline = useIsOffline();
    const isNetworkDisruption = isClientOffline || isNetworkError(description);

    // Determine state from props - prioritize boolean props over variant
    const isLoading = isLoadingProp ?? variant === 'loading';
    const isEmpty = isEmptyProp ?? (variant === 'empty' ? true : false);
    const isError = variant === 'error';

    // If client is offline, or variant is explicitly offline, or an error/empty state happened while offline:
    const isOfflineState =
        variant === 'offline' ||
        (isNetworkDisruption && (isError || isEmpty));

    const effectiveVariant: AppStateVariant = isLoading && !isOfflineState
        ? 'loading'
        : isOfflineState
            ? 'offline'
            : isError
                ? 'error'
                : isEmpty
                    ? 'empty'
                    : (variant ?? 'empty');

    const config = defaultConfig[effectiveVariant];

    let displayTitle: string;
    let displayDescription: string;

    if (effectiveVariant === 'offline') {
        displayTitle = title && !title.toUpperCase().includes("OOPS") ? title : OFFLINE_TITLE;
        displayDescription =
            description &&
            !isNetworkError(description) &&
            description !== "Something went wrong." &&
            description !== "We encountered an error. Please try again."
                ? description
                : OFFLINE_DESCRIPTION;
    } else {
        displayTitle = title ?? (isEmpty && emptyMessage ? "OOPS!" : config.title);
        displayDescription =
            description ??
            (isEmpty && emptyMessage ? emptyMessage : config.description);
    }

    const Icon = icon ?? config.icon;

    if (isLoading && !isOfflineState) {
        return (
            <div
                className={cn(
                    'flex min-h-[50vh] sm:min-h-[60vh] md:min-h-[calc(100dvh-18rem)] w-full flex-1 items-center justify-center my-auto py-8',
                    className,
                )}
            >
                {children ?? <AppLoader fullScreen={fullScreen} className="min-h-0" />}
            </div>
        );
    }

    // If none of the managed states are active, just render the content
    if (!isLoading && !isEmpty && !isError && effectiveVariant !== 'offline') {
        return <>{children}</>;
    }

    const effectiveAction =
        action ??
        (effectiveVariant === 'offline'
            ? {
                  label: "Try again",
                  onClick: () => window.location.reload(),
              }
            : undefined);

    // Unified Empty, Error & Offline State (No red errors or jarring UI when offline)
    return (
        <div
            className={cn(
                fullScreen
                    ? "flex min-h-[50vh] sm:min-h-[60vh] md:min-h-[calc(100dvh-18rem)] w-full flex-1 items-center justify-center my-auto py-8"
                    : "flex w-full flex-1 items-center justify-center py-2 sm:py-4",
                className,
            )}
        >
            <NovaEmptyState
                title={displayTitle}
                description={displayDescription}
                icon={Icon}
                action={effectiveAction ? { label: effectiveAction.label, onClick: effectiveAction.onClick } : undefined}
                variant={fullScreen ? "fullscreen" : "card"}
                className={cn("w-full", !fullScreen && "min-h-0 py-2 sm:py-4 my-0")}
            >
                {isEmpty && effectiveVariant !== 'offline' ? null : children}
            </NovaEmptyState>
        </div>
    );
}

