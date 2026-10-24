"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import EyeSVG from "@/public/svgs/EyeSVG";
import EyeOffSVG from "@/public/svgs/EyeOffSVG";
import LockSVG from "@/public/svgs/LockSVG";
import { useResetPassword } from "@/hooks/useAuth";
import AppButton from "@/components/AppButton";
import AppLoader from "@/components/AppLoader";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { AuthField } from "@/components/auth/AuthField";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { getPasswordChecks } from "@/lib/auth/password-policy";
import { cn } from "@/lib/utils";

function ResetForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const otp = searchParams.get("otp");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { mutate: reset, isPending } = useResetPassword();
  const passwordChecks = getPasswordChecks(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const unmetRequirement = passwordChecks.find((check) => !check.valid);
    if (unmetRequirement) {
      toast.error(unmetRequirement.message);
      return;
    }
    if (!passwordsMatch) {
      toast.error("Passwords don't match");
      return;
    }
    if (!email || !otp) {
      return;
    }
    reset({
      email: email as string,
      otp: otp as string,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });
  };

  return (
    <AuthPageShell
      title="New Password"
      subtitle="Create a secure password for your ExBoard AI account."
      backHref={FRONTEND_ROUTES.LOGIN}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthField
          label="New Password"
          id="reset-password"
          aria-describedby="reset-password-requirements"
          aria-invalid={Boolean(formData.password) && passwordChecks.some((check) => !check.valid)}
          type={showPassword ? "text" : "password"}
          icon={LockSVG}
          placeholder="Enter new password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="flex size-5 items-center justify-center p-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              {showPassword ? (
                <EyeOffSVG className="size-5" />
              ) : (
                <EyeSVG className="size-5" />
              )}
            </button>
          }
        />
        <ul id="reset-password-requirements" className="space-y-1.5 text-xs" aria-label="Password requirements">
          {passwordChecks.map((check) => (
            <li key={check.id} className={cn("flex items-center gap-2", check.valid ? "text-primary" : "text-muted-foreground")}>
              <span aria-hidden className={cn("flex size-4 items-center justify-center rounded-full border", check.valid ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                {check.valid ? <Check className="size-3" /> : null}
              </span>
              {check.label}<span className="sr-only">{check.valid ? " met" : " needed"}</span>
            </li>
          ))}
        </ul>

        <AuthField
          label="Confirm New Password"
          id="reset-confirm-password"
          aria-invalid={Boolean(formData.confirmPassword) && !passwordsMatch}
          type={showConfirmPassword ? "text" : "password"}
          icon={LockSVG}
          placeholder="Confirm new password"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="flex size-5 items-center justify-center p-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              {showConfirmPassword ? (
                <EyeOffSVG className="size-5" />
              ) : (
                <EyeSVG className="size-5" />
              )}
            </button>
          }
        />
        {formData.confirmPassword ? (
          <p className={cn("text-xs font-medium", passwordsMatch ? "text-primary" : "text-destructive")} role="status">
            {passwordsMatch ? "Passwords match" : "Passwords do not match"}
          </p>
        ) : null}

        <AppButton
          type="submit"
          size="lg"
          className="w-full h-12 text-base font-bold rounded-xl shadow-lg shadow-primary/25"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-2 size-5 animate-spin" />
          ) : (
            "Reset Password"
          )}
        </AppButton>
      </form>
    </AuthPageShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <ResetForm />
    </Suspense>
  );
}
