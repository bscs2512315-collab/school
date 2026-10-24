"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStoredUser } from "@/hooks/useStoredUser";
import AppLoader from "@/components/AppLoader";

import { FRONTEND_ROUTES } from "@/constants/endpoints";

export default function UniversalPaperBankResolverPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isReady } = useStoredUser();

  useEffect(() => {
    if (!isReady) return;

    if (!user) {
      window.location.replace(`${FRONTEND_ROUTES.LOGIN}?from=/papers-bank/${id}`);
      return;
    }

    const role = String(user?.role || "").toUpperCase();
    if (role === "TEACHER") {
      router.replace(`/teacher/papers-bank/${id}/view`);
    } else {
      router.replace(`/student/papers-bank/${id}/attempt`);
    }
  }, [id, user, isReady, router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <AppLoader />
    </div>
  );
}
