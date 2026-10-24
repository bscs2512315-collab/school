"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import ZapSVG from "@/public/svgs/ZapSVG";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import ArrowLeftSVG from "@/public/svgs/ArrowLeftSVG";
import TrophySVG from "@/public/svgs/TrophySVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import toast from "react-hot-toast";
import AppButton from "@/components/AppButton";
import { apiPost } from "@/lib/api/api-client";
import { cn } from "@/lib/utils";
import { useStoredUser } from "@/hooks/useStoredUser";

interface JoinPinSectionProps {
  onBack?: () => void;
}

export default function JoinPinSection({ onBack }: JoinPinSectionProps) {
  const router = useRouter();
  const { user } = useStoredUser();
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [isJoining, setIsJoining] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const pinCode = digits.join("");
  const isPinComplete = pinCode.length === 6 && digits.every((d) => d !== "");

  const handleDigitChange = (index: number, value: string) => {
    const sanitized = value.replace(/\D/g, "");
    if (!sanitized) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      setDigits(nextDigits);
      return;
    }

    if (sanitized.length === 1) {
      const nextDigits = [...digits];
      nextDigits[index] = sanitized;
      setDigits(nextDigits);

      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
      return;
    }

    // Multi-character paste
    const pastedChars = sanitized.slice(0, 6).split("");
    const nextDigits = [...digits];
    pastedChars.forEach((char, i) => {
      if (index + i < 6) {
        nextDigits[index + i] = char;
      }
    });
    setDigits(nextDigits);

    const nextIndex = Math.min(index + pastedChars.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === "Enter" && isPinComplete) {
      e.preventDefault();
      void handleJoin();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasteData) return;

    const nextDigits = pasteData.split("");
    while (nextDigits.length < 6) nextDigits.push("");
    setDigits(nextDigits);

    const focusIdx = Math.min(pasteData.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isPinComplete) {
      toast.error("Please enter the complete 6-digit Game PIN");
      return;
    }

    setIsJoining(true);
    const toastId = toast.loading("Connecting to Lightning Arena...");

    try {
      const res = await apiPost<{
        sessionId: string;
        pinCode: string;
        isHost: boolean;
        isRejoin: boolean;
        title: string;
      }>("/lightning/join", {
        pinCode,
        userId: user?.id,
        name: user?.name,
      });

      if (!res.success || !res.data?.sessionId) {
        throw new Error(res.message || "Failed to join Lightning Round");
      }

      toast.success(
        res.data.isRejoin ? "Rejoined session!" : "Joined game lobby!",
        { id: toastId },
      );

      const targetPath =
        user?.role?.toUpperCase() === "TEACHER" && res.data.isHost
          ? `/teacher/lightning/${res.data.sessionId}`
          : `/student/lightning/${res.data.sessionId}`;

      router.push(targetPath);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid or expired Game PIN";
      toast.error(msg, { id: toastId });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card dark:border-white/10 dark:bg-card p-6 shadow-md sm:p-8 text-center">
        {/* Glow ambient background */}
        <div className="pointer-events-none absolute -top-20 -left-20 size-48 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 size-48 rounded-full bg-primary/20 blur-3xl" />

        {onBack && (
          <button
            type="button"
            onClick={onBack}
             className="absolute left-4 top-4 z-20 group flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-2xs transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-95 dark:hover:text-primary-foreground"
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeftSVG className="size-5 transition-transform group-hover:-translate-x-0.5" />
          </button>
        )}

        <div className="relative z-10 flex flex-col items-center">
          {/* Badge */}
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary shadow-xs dark:border-border dark:bg-muted dark:text-white">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Live Multiplayer Arena
          </div>

          {/* Icon */}
          <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25 ring-4 ring-primary/15">
            <ZapSVG className="size-7" />
          </div>

          <h2 className="text-2xl font-black tracking-tight text-foreground dark:text-white sm:text-3xl">
            Enter Game PIN
          </h2>
          <p className="mt-1.5 max-w-xs text-xs text-muted-foreground dark:text-slate-300 leading-relaxed">
            Enter the 6-digit Game PIN shared by your teacher or friend to enter the live arena.
          </p>

          {/* 6-Digit Segmented PIN Form */}
          <form onSubmit={handleJoin} className="mt-6 w-full space-y-5">
            <div className="flex items-center justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
              {digits.map((digit, idx) => {
                const isFilled = digit !== "";
                return (
                  <React.Fragment key={idx}>
                    {idx === 3 && (
                      <div className="text-muted-foreground/40 font-bold select-none text-lg">
                        -
                      </div>
                    )}
                    <input
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      disabled={isJoining}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className={cn(
                        "flex size-11 sm:size-12 items-center justify-center rounded-xl border-2 text-center font-mono text-xl sm:text-2xl font-black transition-all outline-hidden select-none",
                        isFilled
                           ? "border-primary bg-primary/10 text-primary dark:bg-muted dark:text-foreground dark:border-primary shadow-xs"
                          : "border-border/80 bg-background text-foreground dark:border-white/15 dark:bg-background/80 dark:text-white placeholder:text-muted-foreground/30 hover:border-primary/40 focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20",
                        isJoining && "opacity-50 cursor-not-allowed",
                      )}
                      placeholder="•"
                    />
                  </React.Fragment>
                );
              })}
            </div>

            {/* Action CTA */}
            <AppButton
              type="submit"
              disabled={isJoining || !isPinComplete}
              className={cn(
                "group relative flex w-full h-12 items-center justify-center gap-2 rounded-xl text-sm font-black uppercase tracking-wider transition-all",
                isPinComplete
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/95"
                  : "border border-border/70 bg-muted/60 text-muted-foreground/70 dark:border-white/10 dark:bg-white/5",
              )}
            >
              {isJoining ? (
                <>
                  <Loader2 className="size-4.5 animate-spin" />
                  <span>Connecting to Arena...</span>
                </>
              ) : (
                <>
                  <span>Enter Arena</span>
                  <ArrowRightSVG className="size-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </AppButton>
          </form>

          {/* Gamified Micro-Pills */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[10px] font-bold text-muted-foreground dark:text-slate-300">
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 dark:border-white/10 dark:bg-white/5 px-2.5 py-1">
              <ZapSVG className="size-3 text-primary dark:text-foreground" /> Speed Points
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 dark:border-white/10 dark:bg-white/5 px-2.5 py-1">
              <SparklesSVG className="size-3 text-amber-500" /> Streak Multipliers
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 dark:border-white/10 dark:bg-white/5 px-2.5 py-1">
              <TrophySVG className="size-3 text-yellow-500" /> Live Leaderboard
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
