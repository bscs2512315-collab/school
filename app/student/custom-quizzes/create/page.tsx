"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2 } from "lucide-react";
import toast from "react-hot-toast";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppButton from "@/components/AppButton";
import CustomQuizBuilder from "@/components/custom-quiz/CustomQuizBuilder";
import PasteQuizModal from "@/components/custom-quiz/PasteQuizModal";
import { apiPost } from "@/lib/api/api-client";
import { useApiMutation } from "@/hooks/api/useApiMutation";
import { queryKeys } from "@/lib/api/query-keys";
import { API_ENDPOINTS, FRONTEND_ROUTES } from "@/constants/endpoints";
import type { CustomQuiz, CustomQuizPayload, CustomQuizQuestion } from "@/types/custom-quiz";

export default function CreateCustomQuizPage() {
  const router = useRouter();
  const [pasteOpen, setPasteOpen] = useState(false);
  const [seededQuestions, setSeededQuestions] = useState<CustomQuizQuestion[] | undefined>();
  // Bumping this remounts the builder so pasted questions replace its state.
  const [builderKey, setBuilderKey] = useState(0);

  const createMutation = useApiMutation<CustomQuiz, CustomQuizPayload>({
    mutationFn: (payload) =>
      apiPost<CustomQuiz>(API_ENDPOINTS.STUDENT.CUSTOM_QUIZZES, payload),
    invalidateKeys: [queryKeys.student.customQuizzes()],
    onSuccess: () => {
      toast.success("Quiz created");
      router.push(FRONTEND_ROUTES.STUDENT_CUSTOM_QUIZZES);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create quiz");
    },
  });

  const handleParsed = (questions: CustomQuizQuestion[]) => {
    setSeededQuestions(questions);
    setBuilderKey((key) => key + 1);
  };

  const pasteButton = (
    <AppButton variant="outline" onClick={() => setPasteOpen(true)}>
      <Wand2 className="size-4" />
      Paste &amp; Generate
    </AppButton>
  );

  return (
    <PageContainer>
      <PageHeader
        title="Create Quiz"
        onBack={() => router.push(FRONTEND_ROUTES.STUDENT_CUSTOM_QUIZZES)}
        actions={pasteButton}
      />

      {/* PageHeader is hidden below lg, so give mobile its own action row */}
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Create Quiz</h1>
        <AppButton size="sm" variant="outline" onClick={() => setPasteOpen(true)}>
          <Wand2 className="size-4" />
          Paste
        </AppButton>
      </div>

      <CustomQuizBuilder
        key={builderKey}
        initialQuestions={seededQuestions}
        submitLabel="Create Quiz"
        isSubmitting={createMutation.isPending}
        onSubmit={(payload) => createMutation.mutate(payload)}
        onCancel={() => router.push(FRONTEND_ROUTES.STUDENT_CUSTOM_QUIZZES)}
      />

      <PasteQuizModal
        open={pasteOpen}
        onClose={() => setPasteOpen(false)}
        onParsed={handleParsed}
      />
    </PageContainer>
  );
}
