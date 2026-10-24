import React from "react";
import QABugsManager from "@/components/qa/QABugsManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "QA Bugs Dashboard | ExBoard AI",
  description: "Track and verify curriculum QA bugs, diagrams, and question fixes.",
};

export default function QABugsPage() {
  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <QABugsManager />
    </div>
  );
}
