"use client";

import React from "react";
import { useParams } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import AppQueryState from "@/components/AppQueryState";
import SolvedNotesReader from "@/components/solved-notes/SolvedNotesReader";
import { useSolvedExerciseDetail } from "@/hooks/student/useSolvedExerciseDetail";

export default function SolvedExerciseSubjectDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const detailQuery = useSolvedExerciseDetail(id);

  return (
    <PageContainer>
      <AppQueryState
        query={detailQuery}
        loadingMessage="Loading solved exercise notes..."
        errorMessage="Failed to load exercise notes."
        onRetry={() => detailQuery.refetch()}
        fullScreen={false}
      >
        {(exercise) => (
          <div className="animate-in fade-in duration-300">
            <SolvedNotesReader exercise={exercise} />
          </div>
        )}
      </AppQueryState>
    </PageContainer>
  );
}
