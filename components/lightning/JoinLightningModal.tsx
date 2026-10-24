"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X, Flame } from "lucide-react";
import ZapSVG from "@/public/svgs/ZapSVG";
import TrophySVG from "@/public/svgs/TrophySVG";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import toast from "react-hot-toast";
import AppButton from "@/components/AppButton";
import { apiPost } from "@/lib/api/api-client";
import { cn } from "@/lib/utils";
import { useStoredUser } from "@/hooks/useStoredUser";

interface JoinLightningModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPin?: string;
}

export default function JoinLightningModal({
  isOpen,
  onClose,
  defaultPin = "",
}: JoinLightningModalProps) {
  const router = useRouter();
  const { user } = useStoredUser();
  const [digits, setDigits] = useState<string[]>(() => {
    const initial = defaultPin.replace(/\D/g, "").slice(0, 6).split("");
    while (initial.length < 6) initial.push("");
    return initial;
  });
  const [isJoining, setIsJoining] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first empty digit on modal open
  useEffect(() => {
    if (isOpen) {
      const firstEmpty = digits.findIndex((d) => !d);
      const targetIdx = firstEmpty === -1 ? 5 : firstEmpty;
      const timer = setTimeout(() => {
        inputRefs.current[targetIdx]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

    // Single character entered
    if (sanitized.length === 1) {
      const nextDigits = [...digits];
      nextDigits[index] = sanitized;
      setDigits(nextDigits);

      // Auto advance to next input
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
      onClose();

      const targetPath =
        user?.role?.toUpperCase() === "TEACHER" && res.data.isHost
          ? `/teacher/lightning/${res.data.sessionId}`
          : `/student/lightning/${res.data.sessionId}`;

      router.push(targetPath);
    } catch (err: any) {
      toast.error(err?.message || "Invalid or expired Game PIN", { id: toastId });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8 animate-in zoom-in-95 duration-200">
        {/* Ambient Top & Bottom Radial Glow */}
        <div className="pointer-events-none absolute -top-24 -left-24 size-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 size-56 rounded-full bg-primary/25 blur-3xl" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isJoining}
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
          title="Close dialog"
        >
          <X className="size-4" />
        </button>

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Top Live Badge */}
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary shadow-xs">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Live Multiplayer Arena
          </div>

          {/* Electric Icon Header */}
          <div className="relative mb-2 flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 ring-4 ring-primary/15">
            <ZapSVG className="size-7 fill-current transition-transform group-hover:scale-110" />
          </div>

          <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Join Lightning Round
          </h2>
          <p className="mt-1.5 max-w-xs text-xs text-muted-foreground leading-relaxed">
            Enter the 6-digit Game PIN shared by your teacher or squad leader to enter the live arena.
          </p>

          {/* 6-Digit Segmented PIN Form */}
          <form onSubmit={handleJoin} className="mt-6 w-full space-y-5">
            <div className="flex items-center justify-center gap-1.5 sm:gap-2.5" onPaste={handlePaste}>
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
                        "flex size-11 sm:size-13 items-center justify-center rounded-xl border-2 text-center font-mono text-xl sm:text-2xl font-black transition-all outline-hidden select-none",
                        isFilled
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border/80 bg-background/80 text-foreground placeholder:text-muted-foreground/30 hover:border-primary/40 focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20",
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
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/95 hover:scale-101 active:scale-98"
                  : "border border-border/70 bg-muted/60 text-muted-foreground/70",
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
          <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[10px] font-bold text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1">
              <ZapSVG className="size-3 text-primary" /> Speed Points
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1">
              <Flame className="size-3 text-amber-500 fill-amber-500" /> Streak Multipliers
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1">
              <TrophySVG className="size-3 text-primary" /> Live Leaderboard
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
