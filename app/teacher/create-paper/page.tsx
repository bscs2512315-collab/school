"use client";

import { Suspense } from "react";
import AppLoader from "@/components/AppLoader";
import TeacherCreatePaperPage from "@/components/teacher/TeacherCreatePaperPage";

export default function TeacherCreatePaperRoute() {
  return (
    <Suspense fallback={<AppLoader />}>
      <TeacherCreatePaperPage />
    </Suspense>
  );
}
