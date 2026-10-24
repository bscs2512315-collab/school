import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import toast from "react-hot-toast";
import type {
  LoginCredentials,
  StudentRegistrationData,
  SchoolRegistrationData,
  TeacherRegistrationData,
  VerifyOtpPayload,
  ResetPasswordPayload,
} from "@/types/auth";
import type { ApiErrorResponse, ApiErrorDetail } from "@/types/api";
import {
  getDashboardRouteForRole,
  setAuthSession,
} from "@/lib/auth-session";

export function useLogin() {
  const router = useRouter();
  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authService.login(credentials),
    onSuccess: (response) => {
      if (response.success && response.data) {
        const { user } = response.data;

        setAuthSession(user);

        toast.success("Login successful!");

        window.location.replace(getDashboardRouteForRole(user.role));
      }
    },
    onError: (error: ApiErrorResponse) => {
      const errorMessage =
        typeof error.error === "string"
          ? error.error
          : Array.isArray(error.error)
            ? error.error[0]?.message || "Login failed. Please try again."
            : "Login failed. Please try again.";
      toast.error(errorMessage);
      // If error message indicates verification needed
      if (
        errorMessage.includes("verify your email") &&
        error.details &&
        typeof error.details === "object" &&
        "email" in error.details
      ) {
        router.push(
          `${FRONTEND_ROUTES.VERIFY_OTP}?email=${encodeURIComponent(error.details.email as string)}`,
        );
      }
    },
  });
}

export function useRegister() {
  const router = useRouter();
  return useMutation({
    mutationFn: (formData: StudentRegistrationData) =>
      authService.register(formData),
    onSuccess: (response) => {
      if (response.success && response.data) {
        toast.success("Registration successful! Please verify your email.");
        router.push(
          `${FRONTEND_ROUTES.VERIFY_OTP}?email=${encodeURIComponent(response.data.email)}`,
        );
      }
    },
    onError: (error: ApiErrorResponse) => {
      const errorMessage =
        typeof error.error === "string"
          ? error.error
          : Array.isArray(error.error)
            ? error.error[0]?.message ||
              "Registration failed. Please try again."
            : "Registration failed. Please try again.";
      toast.error(errorMessage);
    },
  });
}

export function useRegisterSchool() {
  const router = useRouter();
  return useMutation({
    mutationFn: (formData: SchoolRegistrationData) =>
      authService.registerSchool(formData),
    onSuccess: (response) => {
      if (response.success && response.data) {
        toast.success("Registration successful! Please verify your email.");
        router.push(
          `${FRONTEND_ROUTES.VERIFY_OTP}?email=${encodeURIComponent(response.data.email)}`,
        );
      }
    },
    onError: (error: ApiErrorResponse) => {
      const errorMessage =
        typeof error.error === "string"
          ? error.error
          : Array.isArray(error.error)
            ? error.error[0]?.message ||
              "Registration failed. Please try again."
            : "Registration failed. Please try again.";
      toast.error(errorMessage);
    },
  });
}

export function useRegisterTeacher() {
  const router = useRouter();
  return useMutation({
    mutationFn: (formData: TeacherRegistrationData) =>
      authService.registerTeacher(formData),
    onSuccess: (response) => {
      if (response.success && response.data) {
        toast.success("Registration successful! Please verify your email.");
        router.push(
          `${FRONTEND_ROUTES.VERIFY_OTP}?email=${encodeURIComponent(response.data.email)}`,
        );
      }
    },
    onError: (error: ApiErrorResponse) => {
      const errorMessage =
        typeof error.error === "string"
          ? error.error
          : Array.isArray(error.error)
            ? error.error[0]?.message ||
              "Registration failed. Please try again."
            : "Registration failed. Please try again.";
      toast.error(errorMessage);
    },
  });
}

export function useVerifyOtp() {
  const router = useRouter();
  return useMutation({
    mutationFn: (payload: VerifyOtpPayload) => authService.verifyOtp(payload),
    onSuccess: () => {
      toast.success("Email verified successfully! You can now login.");
      router.push(`${FRONTEND_ROUTES.LOGIN}?registered=true`);
    },
    onError: (error: ApiErrorResponse) => {
      const errorMessage =
        typeof error.error === "string"
          ? error.error
          : Array.isArray(error.error)
            ? error.error[0]?.message || "Invalid OTP. Please try again."
            : "Invalid OTP. Please try again.";
      toast.error(errorMessage);
    },
  });
}

export function useForgotPassword() {
  const router = useRouter();
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
    onSuccess: (data, email) => {
      toast.success("Password reset OTP sent to your email.");
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes(FRONTEND_ROUTES.VERIFY_OTP)
      ) {
        router.push(
          `${FRONTEND_ROUTES.VERIFY_OTP}?email=${encodeURIComponent(email)}&flow=reset`,
        );
      }
    },
    onError: (error: ApiErrorResponse) => {
      const errorMessage =
        typeof error.error === "string"
          ? error.error
          : Array.isArray(error.error)
            ? error.error[0]?.message ||
              "Failed to send reset OTP. Please try again."
            : "Failed to send reset OTP. Please try again.";
      toast.error(errorMessage);
    },
  });
}

export function useResetPassword() {
  const router = useRouter();
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) =>
      authService.resetPassword(payload),
    onSuccess: () => {
      toast.success(
        "Password reset successful! You can now login with your new password.",
      );
      router.push(`${FRONTEND_ROUTES.LOGIN}?reset=true`);
    },
    onError: (error: ApiErrorResponse) => {
      const errorMessage =
        typeof error.error === "string"
          ? error.error
          : Array.isArray(error.error)
            ? error.error[0]?.message ||
              "Password reset failed. Please try again."
            : "Password reset failed. Please try again.";
      toast.error(errorMessage);
    },
  });
}
