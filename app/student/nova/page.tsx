"use client";

import NovaChatPanel from "@/components/nova/NovaChatPanel";

export default function StudentNovaPage() {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-background p-0 sm:p-2.5 md:p-3 lg:p-4">
      <NovaChatPanel className="h-full min-h-0 w-full flex-1 rounded-none border-0 shadow-none sm:rounded-2xl sm:border sm:border-border/80 sm:shadow-md" />
    </div>
  );
}
