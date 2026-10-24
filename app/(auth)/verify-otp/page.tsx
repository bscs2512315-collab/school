"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useVerifyOtp, useForgotPassword } from "@/hooks/useAuth";
import AppButton from "@/components/AppButton";
import AppLoader from "@/components/AppLoader";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { cn } from "@/lib/utils";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

function OTPForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const flow = searchParams.get("flow");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(120);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { mutate: verify, isPending } = useVerifyOtp();
  const { mutate: resendOtp, isPending: isResending } = useForgotPassword();

  useEffect(() => {
    if (!email) {
      router.push(FRONTEND_ROUTES.LOGIN);
    }
  }, [email, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const finalOtp = otp.join("");
    if (finalOtp.length !== 6) return;

    if (flow === "reset") {
      router.push(
        `${FRONTEND_ROUTES.RESET_PASSWORD}?email=${encodeURIComponent(email!)}&otp=${finalOtp}`,
      );
    } else {
      verify({ email: email!, otp: finalOtp });
    }
  };

  const handleResend = () => {
    if (timer === 0 && email) {
      resendOtp(email, {
        onSuccess: () => setTimer(120),
      });
    }
  };

  return (
    <AuthPageShell
      title="Verification Code"
      subtitle={`Enter the 6-digit code sent to ${email}`}
      backHref={FRONTEND_ROUTES.LOGIN}
    >
      <form onSubmit={handleVerify} className="space-y-6">
        <div className="flex justify-between gap-2" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={cn(
                "w-full h-14 text-center text-2xl font-bold rounded-xl border transition-all outline-none",
                "bg-auth-input-bg border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10",
                {
                  "border-primary/50 bg-primary/5": digit !== "",
                  "border-border/50": digit === "",
                },
              )}
            />
          ))}
        </div>

        <AppButton
          type="submit"
          size="lg"
          className="w-full h-12 text-base font-bold rounded-xl shadow-lg shadow-primary/25"
          disabled={isPending || otp.join("").length !== 6}
        >
          {isPending ? (
            <Loader2 className="mr-2 size-5 animate-spin" />
          ) : (
            "Verify & Continue"
          )}
        </AppButton>
      </form>

      <div className="text-center pt-2">
        {timer > 0 ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-secondary py-2 px-4 rounded-full w-fit mx-auto">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            Resend code in{" "}
            <span className="font-bold text-primary tabular-nums">
              {formatTime(timer)}
            </span>
          </div>
        ) : (
          <button
            type="button"
            className="text-sm font-bold text-primary hover:text-primary/80 transition-all disabled:opacity-50"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Sending...
              </span>
            ) : (
              "Resend New Code"
            )}
          </button>
        )}
      </div>
    </AuthPageShell>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <OTPForm />
    </Suspense>
  );
}
