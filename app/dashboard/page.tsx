"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppLoader from "@/components/AppLoader";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import {
  getDashboardRouteForRole,
  getStoredUser,
} from "@/lib/auth-session";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (user?.role) {
      router.replace(getDashboardRouteForRole(user.role as string));
      return;
    }
    router.replace(FRONTEND_ROUTES.LOGIN);
  }, [router]);

  return (
    <AppLoader fullScreen />
  );
}
