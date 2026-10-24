"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import AppLoader from "@/components/AppLoader";

export default function ChallengeRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`${FRONTEND_ROUTES.STUDENT_CUSTOM_QUIZZES}?tab=challenges`);
  }, [router]);

  return <AppLoader />;
}
