"use client";

import { usePathname } from "next/navigation";
import { getPracticalJournal } from "@/constants/practicalJournals";
import PracticalIntro, { journalToBrief } from "./PracticalIntro";

export default function BiologyIntro() {
  const pathname = usePathname();
  const id = (pathname ?? "").split("/").filter(Boolean).pop() ?? "";
  const brief = journalToBrief(getPracticalJournal(id, "biology", "XII"));

  if (!brief) return null;

  return (
    <PracticalIntro
      brief={brief}
      onStart={() => {}}
      subject="Biology"
      exitHref="/student/lab-game/biology"
    />
  );
}
