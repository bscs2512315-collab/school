"use client";

import React from "react";
import { Bell, BellRing, BellOff, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import AppButton from "@/components/AppButton";
import { cn } from "@/lib/utils";

interface PushNotificationCardProps {
  className?: string;
  compact?: boolean;
}

export default function PushNotificationCard({
  className,
  compact = false,
}: PushNotificationCardProps) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs text-xs text-muted-foreground",
          className
        )}
      >
        <div className="flex items-center gap-2.5 font-bold text-foreground">
          <BellOff className="size-4 text-muted-foreground" />
          <span>Web Push Notifications</span>
        </div>
        <p className="mt-1.5 leading-relaxed">
          Push notifications are not supported on this browser or environment. On iPhone/iPad, please add ExBoard AI to your Home Screen to enable notifications.
        </p>
      </div>
    );
  }

  const isBlocked = permission === "denied";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-sm transition-all",
        isSubscribed ? "border-primary/40 bg-linear-to-br from-primary/5 via-card to-background" : "",
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left Info */}
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl text-primary transition-colors",
              isSubscribed
                ? "bg-primary/15 text-primary shadow-xs"
                : "bg-muted text-muted-foreground"
            )}
          >
            {isSubscribed ? (
              <BellRing className="size-5.5 animate-bounce" />
            ) : (
              <Bell className="size-5.5" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-bold text-foreground">
                PWA Push Notifications
              </h4>
              {isSubscribed ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-black text-primary">
                  <CheckCircle2 className="size-3" /> Active
                </span>
              ) : isBlocked ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive">
                  <AlertCircle className="size-3" /> Blocked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                  Disabled
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Get real-time study reminders, daily inactivity roasts & encouragement, leaderboard rank alerts, and exam grading notifications.
            </p>

            {isBlocked && (
              <p className="text-[11px] font-semibold text-destructive mt-1">
                Notifications are blocked in your browser settings. Click the lock/settings icon in your address bar to allow notifications.
              </p>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {isSubscribed ? (
            <>
              <button
                type="button"
                onClick={() => void sendTestNotification()}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary transition-all hover:bg-primary/20 active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="size-3.5" />
                Test Roast Alert
              </button>
              <button
                type="button"
                onClick={() => void unsubscribeFromPush()}
                disabled={isLoading}
                className="rounded-xl border border-border/70 bg-muted/40 px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-all hover:border-destructive/40 hover:text-destructive active:scale-95 disabled:opacity-50"
              >
                Disable
              </button>
            </>
          ) : (
            <AppButton
              size={compact ? "sm" : "default"}
              disabled={isLoading || isBlocked}
              onClick={() => void subscribeToPush()}
              className="gap-2 rounded-xl px-5 text-xs sm:text-sm font-bold shadow-sm"
            >
              <Bell className="size-4" />
              {isLoading ? "Enabling..." : "Enable Push Notifications"}
            </AppButton>
          )}
        </div>
      </div>

      {/* When subscribed: Show quick preview/test of the 3 key templates */}
      {isSubscribed && !compact && (
        <div className="mt-4 pt-3.5 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground mb-2">
            <span>Test Roman Urdu Notification Styles:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void sendTestNotification("book_band")}
              disabled={isLoading}
              className="rounded-lg border border-border/80 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition-colors active:scale-95"
            >
              👀 Book band kr k so gaye?
            </button>
            <button
              type="button"
              onClick={() => void sendTestNotification("board_exams")}
              disabled={isLoading}
              className="rounded-lg border border-border/80 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition-colors active:scale-95"
            >
              😭 Board exams wait nhi krengy
            </button>
            <button
              type="button"
              onClick={() => void sendTestNotification("nova_waiting")}
              disabled={isLoading}
              className="rounded-lg border border-border/80 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition-colors active:scale-95"
            >
              🤖 Nova is waiting for you!
            </button>
            <button
              type="button"
              onClick={() => void sendTestNotification("overtaken")}
              disabled={isLoading}
              className="rounded-lg border border-border/80 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition-colors active:scale-95"
            >
              🚨 Leaderboard Overtaken
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
