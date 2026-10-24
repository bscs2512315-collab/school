"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import LightningArena from "@/components/lightning/LightningArena";
import { useStoredUser } from "@/hooks/useStoredUser";
import { FRONTEND_ROUTES } from "@/constants/endpoints";

import GenerateSVG from "@/public/svgs/GenerateSVG";

export default function TeacherLightningPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useStoredUser();

  const sessionId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  return (
    <div className="h-full w-full min-h-0 flex-1 overflow-y-auto custom-scrollbar p-1 sm:p-3 md:p-4">
      {sessionId && user?.id ? (
        <LightningArena
          sessionId={sessionId}
          userId={user.id}
          userRole="TEACHER"
          onExit={() => router.push(FRONTEND_ROUTES.TEACHER_PAPERS)}
        />
      ) : (
        <div className="flex min-h-[calc(100dvh-12rem)] w-full flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 animate-pulse">
            <GenerateSVG className="size-7" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-foreground">Entering Live Arena...</h3>
          <p className="text-xs text-muted-foreground">Synchronizing session parameters</p>
        </div>
      )}
    </div>
  );
}
