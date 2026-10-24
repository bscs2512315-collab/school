"use client";

import React from "react";
import AnnaVoiceAssistant from "@/components/qa/AnnaVoiceAssistant";

export default function AnnaPage() {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-background p-0 sm:p-2.5 md:p-3 lg:p-4">
      <AnnaVoiceAssistant className="h-full min-h-0 w-full flex-1 rounded-none border-0 shadow-none sm:rounded-3xl sm:border sm:border-border/60 sm:shadow-md" />
    </div>
  );
}
