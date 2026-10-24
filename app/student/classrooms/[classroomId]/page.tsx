"use client";

import { Suspense } from "react";
import ClassroomDetail from "@/components/ClassroomDetail";
import AppLoader from "@/components/AppLoader";

export default function StudentClassroomDetailPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <ClassroomDetail />
    </Suspense>
  );
}
