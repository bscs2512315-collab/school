"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import EyeSVG from "@/public/svgs/EyeSVG";
import EyeOffSVG from "@/public/svgs/EyeOffSVG";
import LockSVG from "@/public/svgs/LockSVG";
import MailSVG from "@/public/svgs/MailSVG";
import { useLogin } from "@/hooks/useAuth";
import AppButton from "@/components/AppButton";
import AppLoader from "@/components/AppLoader";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import toast from "react-hot-toast";
import { AuthField } from "@/components/auth/AuthField";
import { AuthFooter, AuthPageShell } from "@/components/auth/AuthPageShell";

function LoginForm() {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const reset = searchParams.get("reset");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: login, isPending } = useLogin();

  useEffect(() => {
    if (registered) {
      toast.success("Registration successful! Please login.");
    }
    if (reset) {
      toast.success(
        "Password reset successful! Please login with your new password.",
      );
    }
  }, [registered, reset]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <AuthPageShell
      title="Welcome Back !"
      footer={
        <AuthFooter
          prompt="Don't have an account?"
          linkText="Sign up"
          linkHref={FRONTEND_ROUTES.REGISTER}
        />
      }
    >
      <form onSubmit={handleLogin} className="space-y-6">
        <AuthField
          label="Email Address"
          type="email"
          name="email"
          icon={MailSVG}
          placeholder="john@example.com"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <div className="space-y-3">
          <AuthField
            label="Password"
            type={showPassword ? "text" : "password"}
            name="password"
            icon={LockSVG}
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
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

          <div className="flex justify-end">
            <Link
              href={FRONTEND_ROUTES.FORGOT_PASSWORD}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <AppButton
          type="submit"
          size="lg"
          className="w-full h-12 text-base font-bold rounded-xl shadow-lg shadow-primary/25"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-2 size-5 animate-spin" />
          ) : (
            "Sign In"
          )}
        </AppButton>
      </form>
    </AuthPageShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <LoginForm />
    </Suspense>
  );
}
