"use client";

import { Suspense } from "react";
import ClassroomDetail from "@/components/ClassroomDetail";
import AppLoader from "@/components/AppLoader";

export default function TeacherClassroomDetailPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <ClassroomDetail />
    </Suspense>
  );
}
