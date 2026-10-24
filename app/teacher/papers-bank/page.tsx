"use client";

import PapersBankView from "@/components/papers-bank/PapersBankView";

export default function TeacherPapersBankPage() {
  return <PapersBankView userRole="TEACHER" baseRoute="/teacher" />;
}
