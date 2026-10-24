"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCheck, Inbox, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import NotificationSVG from "@/public/svgs/NotificationSVG";
import NotificationListSVG from "@/public/svgs/NotificationListSVG";
import {
  useInfiniteNotifications,
  useMarkNotificationsRead,
  useNotificationSummary,
} from "@/hooks/notifications/useNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import type { NotificationItem } from "@/types/notifications";
import { API_ENDPOINTS, FRONTEND_ROUTES } from "@/constants/endpoints";
import { apiPost } from "@/lib/api/api-client";
import { ClassroomMemberStatus } from "@/types/enums";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = Date.now();
  const diffMs = Math.max(0, now - date.getTime());
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

function isPendingClassroomInvite(notification: NotificationItem): boolean {
  if (notification.type !== "CLASSROOM_INVITE") return false;
  const status = notification.metadata?.status;
  if (status === ClassroomMemberStatus.ACCEPTED) return false;
  return Boolean(notification.metadata?.classroomId);
}

export default function NotificationBell({
  variant = "sidebar",
}: {
  variant?: "sidebar" | "header";
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    const updateAuth = () => {
      setIsAuthenticated(Boolean(localStorage.getItem("exboard_user")));
    };
    updateAuth();

    window.addEventListener("storage", updateAuth);
    window.addEventListener("exboard_auth_changed", updateAuth);

    return () => {
      window.removeEventListener("storage", updateAuth);
      window.removeEventListener("exboard_auth_changed", updateAuth);
    };
  }, []);

  const summaryQuery = useNotificationSummary({
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });
  const infiniteQuery = useInfiniteNotifications({
    enabled: isAuthenticated && isOpen,
  });
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = infiniteQuery;
  const markReadMutation = useMarkNotificationsRead();
  const {
    isSupported: isPushSupported,
    permission: pushPermission,
    isSubscribed: isPushSubscribed,
    isLoading: isPushLoading,
    subscribeToPush,
  } = usePushNotifications(isOpen);

  const unreadCount =
    infiniteQuery.data?.pages[0]?.unreadCount ?? summaryQuery.data?.unreadCount ?? 0;
  const notifications =
    infiniteQuery.data?.pages.flatMap((page) => page.notifications) ?? [];

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !loadMoreRef.current || !listRef.current) return;

    const root = listRef.current;
    const target = loadMoreRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (
          entry?.isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage
        ) {
          void fetchNextPage();
        }
      },
      { root, rootMargin: "40px", threshold: 0.1 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [
    isOpen,
    notifications.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  const markAllRead = async () => {
    try {
      await markReadMutation.mutateAsync({});
      toast.success("All caught up!");
    } catch {
      toast.error("Could not mark all as read");
    }
  };

  const resolveNotificationLink = (notification: NotificationItem): string | null => {
    const classroomId = notification.metadata?.classroomId;
    const attemptId = notification.metadata?.attemptId;

    if (
      notification.type === "TEACHER_PAPER_ASSIGNED" &&
      typeof classroomId === "string" &&
      classroomId.length > 0
    ) {
      return FRONTEND_ROUTES.STUDENT_CLASSROOM(classroomId);
    }

    if (
      (notification.type === "PAPER_AWAITING_APPROVAL" ||
        notification.type === "PAPER_SUBMITTED") &&
      typeof classroomId === "string" &&
      classroomId.length > 0
    ) {
      if (
        notification.type === "PAPER_AWAITING_APPROVAL" &&
        typeof attemptId === "string" &&
        attemptId.length > 0
      ) {
        return FRONTEND_ROUTES.TEACHER_CLASSROOM_ATTEMPT(classroomId, attemptId);
      }
      return FRONTEND_ROUTES.TEACHER_CLASSROOM_ATTEMPTS(classroomId);
    }

    return notification.link;
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (isPendingClassroomInvite(notification) || openingId) return;

    setOpeningId(notification.id);

    if (!notification.isRead) {
      try {
        await markReadMutation.mutateAsync({ ids: [notification.id] });
      } catch {
        toast.error("Could not mark notification as read");
      }
    }

    const href = resolveNotificationLink(notification);
    if (href) {
      router.push(href);
    }
    setIsOpen(false);
    setOpeningId(null);
  };

  const handleJoinClassroom = async (notification: NotificationItem) => {
    const classroomId = notification.metadata?.classroomId;
    if (!classroomId || typeof classroomId !== "string") {
      toast.error("Invalid classroom invitation");
      return;
    }

    setJoiningId(notification.id);
    try {
      const res = await apiPost<{
        redirectTo?: string;
        alreadyJoined?: boolean;
      }>(API_ENDPOINTS.CLASSROOMS.JOIN(classroomId), {});

      if (!res.success) {
        toast.error(res.message || "Could not join classroom");
        return;
      }

      if (!notification.isRead) {
        await markReadMutation.mutateAsync({ ids: [notification.id] }).catch(() => {});
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

      toast.success(
        res.data.alreadyJoined
          ? "You're already in this classroom"
          : "Joined classroom!",
      );
      setIsOpen(false);
      router.push(
        res.data.redirectTo || FRONTEND_ROUTES.STUDENT_CLASSROOM(classroomId),
      );
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as { message: unknown }).message === "string"
          ? (err as { message: string }).message
          : "Could not join classroom";
      toast.error(message);
    } finally {
      setJoiningId(null);
    }
  };

  const isInitialLoading = infiniteQuery.isLoading || (isOpen && !infiniteQuery.data);

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={cn(
          "group relative flex items-center transition-all duration-300",
          {
            "w-full rounded-2xl px-4 py-3 text-muted-foreground hover:bg-muted/80 hover:text-foreground":
              variant === "sidebar",
            "rounded-lg p-2 text-muted-foreground hover:bg-muted": variant === "header",
            "bg-muted text-foreground": isOpen && variant === "header",
            "bg-muted/80 text-foreground": isOpen && variant === "sidebar",
          },
        )}
      >
        <div className="relative">
          <NotificationSVG
            className={cn(
              "size-7 shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:text-primary dark:group-hover:text-foreground",
              { "text-primary dark:text-foreground": isOpen },
            )}
          />
          {unreadCount > 0 ? (
            <span
              className={cn(
                "absolute flex size-4 items-center justify-center rounded-full bg-error text-[8px] font-black text-error-foreground ring-2 ring-background",
                {
                  "-top-1.5 -right-1.5": variant === "sidebar",
                  "-top-1 -right-1": variant === "header",
                },
              )}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </div>
        {variant === "sidebar" ? (
          <span className="ml-3 truncate text-sm font-bold tracking-tight">Notifications</span>
        ) : null}
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-x-0 bottom-0 top-[72px] z-40 bg-background/60 backdrop-blur-sm sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div
            role="dialog"
            aria-label="Notifications"
            className={cn(
              "fixed inset-x-0 bottom-0 top-[72px] z-50 flex flex-col overflow-hidden border-border bg-card shadow-xl",
              "sm:rounded-2xl sm:border",
              "sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-full sm:mt-2 sm:h-auto sm:w-[22rem]",
              {
                "sm:right-0 sm:left-auto": variant === "header",
                "sm:left-0 sm:right-auto": variant === "sidebar",
              },
            )}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 className="text-base font-bold text-foreground">Notifications</h2>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  disabled={markReadMutation.isPending}
                  aria-busy={markReadMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 dark:border-border px-2.5 py-1 text-[11px] font-semibold text-primary dark:text-foreground transition-colors hover:bg-primary/10 dark:hover:bg-muted disabled:opacity-60"
                >
                  {markReadMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
                  {markReadMutation.isPending ? "Marking..." : "Mark all read"}
                </button>
              ) : null}
            </div>

            {/* Subtle Push Notification Enable Prompt */}
            {isPushSupported && !isPushSubscribed && pushPermission !== "denied" ? (
              <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-primary/10 px-3.5 py-2 text-xs">
                <span className="truncate text-[11px] font-semibold text-primary dark:text-white">
                  Enable push alerts for challenges
                </span>
                <button
                  type="button"
                  disabled={isPushLoading}
                  aria-busy={isPushLoading}
                  onClick={() => void subscribeToPush()}
                  className="shrink-0 rounded-lg bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isPushLoading ? <><Loader2 className="mr-1 inline size-3 animate-spin" />Enabling...</> : "Enable"}
                </button>
              </div>
            ) : null}

            <div
              ref={listRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain sm:max-h-80 sm:flex-none"
            >
            {isInitialLoading ? (
              <div className="flex items-center justify-center px-4 py-10 text-sm text-muted-foreground">
                Loading notifications...
              </div>
            ) : infiniteQuery.isError ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <p className="text-sm text-muted-foreground">Could not load notifications.</p>
                <button
                  type="button"
                  onClick={() => void infiniteQuery.refetch()}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-muted dark:text-foreground">
                  <Inbox className="size-5" />
                </div>
                <p className="text-sm font-medium text-foreground">All clear</p>
                <p className="text-xs text-muted-foreground">
                  You don&apos;t have any notifications right now.
                </p>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-border/60">
                  {notifications.map((notification) => {
                    const showJoin = isPendingClassroomInvite(notification);
                    return (
                      <li key={notification.id}>
                        <div
                          className={cn(
                            "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                            {
                              "bg-primary/5": !notification.isRead,
                              "cursor-pointer hover:bg-muted/50": !showJoin,
                            },
                          )}
                          onClick={() => {
                            if (!showJoin) void handleNotificationClick(notification);
                          }}
                          onKeyDown={(event) => {
                            if (!showJoin && (event.key === "Enter" || event.key === " ")) {
                              event.preventDefault();
                              void handleNotificationClick(notification);
                            }
                          }}
                          role={showJoin ? undefined : "button"}
                          tabIndex={showJoin ? undefined : 0}
                        >
                          <div className="relative shrink-0">
                            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-muted dark:text-foreground">
                              {openingId === notification.id ? <Loader2 className="size-5 animate-spin" /> : <NotificationListSVG className="size-5" />}
                            </div>
                            {!notification.isRead ? (
                              <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card bg-error" />
                            ) : null}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p
                              className={cn("text-sm leading-snug text-foreground break-words", {
                                "font-semibold": !notification.isRead,
                                "font-medium": notification.isRead,
                              })}
                            >
                              {notification.title}
                            </p>
                            {notification.message ? (
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground break-words">
                                {notification.message}
                              </p>
                            ) : null}
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatRelativeTime(notification.createdAt)}
                            </p>
                            {showJoin ? (
                              <div className="mt-2 flex justify-end">
                                <button
                                  type="button"
                                  disabled={joiningId === notification.id}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void handleJoinClassroom(notification);
                                  }}
                                  className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                                >
                                  {joiningId === notification.id ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    "Join Classroom"
                                  )}
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div ref={loadMoreRef} className="flex items-center justify-center py-3">
                  {infiniteQuery.isFetchingNextPage ? (
                    <Loader2 className="size-4 animate-spin text-primary" />
                  ) : infiniteQuery.hasNextPage ? (
                    <span className="text-[10px] font-medium text-muted-foreground">
                      Scroll for more
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-muted-foreground">
                      You&apos;re all caught up
                    </span>
                  )}
                </div>
              </>
            )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
