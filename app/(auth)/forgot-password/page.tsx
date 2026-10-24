"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import MailSVG from "@/public/svgs/MailSVG";
import { useForgotPassword } from "@/hooks/useAuth";
import AppButton from "@/components/AppButton";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { AuthField } from "@/components/auth/AuthField";
import { AuthFooter, AuthPageShell } from "@/components/auth/AuthPageShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const { mutate: requestOtp, isPending } = useForgotPassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestOtp(email);
  };

  return (
    <AuthPageShell
      title="Forgot Password?"
      subtitle="Enter your email and we'll send you an OTP to reset your password."
      backHref={FRONTEND_ROUTES.LOGIN}
      footer={
        <AuthFooter
          prompt="Remembered your password?"
          linkText="Sign in"
          linkHref={FRONTEND_ROUTES.LOGIN}
        />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthField
          label="Email Address"
          type="email"
          icon={MailSVG}
          placeholder="john@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <AppButton
          type="submit"
          size="lg"
          className="w-full h-12 text-base font-bold rounded-xl shadow-lg shadow-primary/25"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-2 size-5 animate-spin" />
          ) : (
            "Send OTP"
          )}
        </AppButton>
      </form>
    </AuthPageShell>
  );
}
