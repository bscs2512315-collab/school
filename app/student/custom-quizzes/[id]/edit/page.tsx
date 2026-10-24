"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppQueryState from "@/components/AppQueryState";
import CustomQuizBuilder from "@/components/custom-quiz/CustomQuizBuilder";
import { apiGet, apiPut } from "@/lib/api/api-client";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useApiMutation } from "@/hooks/api/useApiMutation";
import { queryKeys } from "@/lib/api/query-keys";
import { API_ENDPOINTS, FRONTEND_ROUTES } from "@/constants/endpoints";
import type { CustomQuiz, CustomQuizPayload } from "@/types/custom-quiz";

export default function EditCustomQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const quizQuery = useApiQuery<CustomQuiz>({
    queryKey: queryKeys.student.customQuiz(id),
    queryFn: () => apiGet<CustomQuiz>(API_ENDPOINTS.STUDENT.CUSTOM_QUIZ_BY_ID(id)),
  });

  const updateMutation = useApiMutation<CustomQuiz, CustomQuizPayload>({
    mutationFn: (payload) =>
      apiPut<CustomQuiz>(API_ENDPOINTS.STUDENT.CUSTOM_QUIZ_BY_ID(id), payload),
    invalidateKeys: [
      queryKeys.student.customQuizzes(),
      queryKeys.student.customQuiz(id),
    ],
    onSuccess: () => {
      toast.success("Quiz updated");
      router.push(FRONTEND_ROUTES.STUDENT_CUSTOM_QUIZZES);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update quiz");
    },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Edit Quiz"
        onBack={() => router.push(FRONTEND_ROUTES.STUDENT_CUSTOM_QUIZZES)}
      />
      <AppQueryState
        query={quizQuery}
        loadingMessage="Loading quiz…"
        errorMessage="Failed to load this quiz."
        onRetry={() => quizQuery.refetch()}
      >
        {(quiz) => (
          <CustomQuizBuilder
            initialQuiz={quiz}
            submitLabel="Save Changes"
            isSubmitting={updateMutation.isPending}
            onSubmit={(payload) => updateMutation.mutate(payload)}
            onCancel={() => router.push(FRONTEND_ROUTES.STUDENT_CUSTOM_QUIZZES)}
          />
        )}
      </AppQueryState>
    </PageContainer>
  );
}
