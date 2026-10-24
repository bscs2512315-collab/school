import React from "react";
import QABugsManager from "@/components/qa/QABugsManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "QA Bugs Tracker | Admin Portal | ExBoard AI",
  description: "Track and verify reported curriculum questions and diagram bugs.",
};

export default function AdminBugsPage() {
  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <QABugsManager />
    </div>
  );
}
