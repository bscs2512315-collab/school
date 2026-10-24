"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import AppLoader from "@/components/AppLoader";

export default function NotificationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(FRONTEND_ROUTES.STUDENT_DASHBOARD);
  }, [router]);

  return <AppLoader />;
}
