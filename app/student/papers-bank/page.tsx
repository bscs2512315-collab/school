"use client";

import PapersBankView from "@/components/papers-bank/PapersBankView";

export default function StudentPapersBankPage() {
  return <PapersBankView userRole="STUDENT" baseRoute="/student" />;
}
