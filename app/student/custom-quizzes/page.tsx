"use client";

import AddSVG from "@/public/svgs/AddSVG";
import QuizzesSVG from "@/public/svgs/QuizzesSVG";
import ShareSVG from "@/public/svgs/ShareSVG";
import ChallengeSVG from "@/public/svgs/ChallengeSVG";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppButton from "@/components/AppButton";
import AppQueryState from "@/components/AppQueryState";
import AppTabs from "@/components/AppTabs";
import NovaEmptyState from "@/components/NovaEmptyState";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import CustomQuizCard from "@/components/custom-quiz/CustomQuizCard";
import ShareQuizModal from "@/components/custom-quiz/ShareQuizModal";
import MyChallengesTab from "../challenge/components/MyChallengesTab";
import { apiDelete, apiGet } from "@/lib/api/api-client";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useApiMutation } from "@/hooks/api/useApiMutation";
import { queryKeys } from "@/lib/api/query-keys";
import { API_ENDPOINTS, FRONTEND_ROUTES } from "@/constants/endpoints";
import {
  useChallenges,
  useRespondToChallenge,
} from "@/hooks/challenge/useChallenges";
import type { CustomQuizSummary, SharedCustomQuiz } from "@/types/custom-quiz";

type QuizTab = "mine" | "shared" | "challenges";

export default function CustomQuizzesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<QuizTab>("mine");
  const [quizToDelete, setQuizToDelete] = useState<CustomQuizSummary | null>(null);
  const [quizToShare, setQuizToShare] = useState<CustomQuizSummary | null>(null);

  const myQuizzesQuery = useApiQuery<CustomQuizSummary[]>({
    queryKey: queryKeys.student.customQuizzes(),
    queryFn: () => apiGet<CustomQuizSummary[]>(API_ENDPOINTS.STUDENT.CUSTOM_QUIZZES),
  });

  const sharedQuizzesQuery = useApiQuery<SharedCustomQuiz[]>({
    queryKey: queryKeys.student.customQuizzesShared(),
    queryFn: () => apiGet<SharedCustomQuiz[]>(API_ENDPOINTS.STUDENT.CUSTOM_QUIZZES_SHARED),
  });

  const challengesQuery = useChallenges();
  const respondChallengeMutation = useRespondToChallenge();

  const challenges = challengesQuery.data ?? [];
  const myCreatedChallenges = challenges.filter((c) => c.isCreator);
  const myAcceptedInvites = challenges.filter(
    (c) => !c.isCreator && c.myStatus !== "INVITED"
  );

  const handleRespond = async (
    e: React.MouseEvent,
    challengeId: string,
    action: "accept" | "decline"
  ) => {
    e.stopPropagation();
    try {
      await respondChallengeMutation.mutateAsync({ challengeId, action });
      toast.success(
        action === "accept" ? "Challenge accepted! ⚔️" : "Challenge declined."
      );
      if (action === "accept") {
        router.push(FRONTEND_ROUTES.STUDENT_CHALLENGE_DETAIL(challengeId));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const deleteMutation = useApiMutation<null, string>({
    mutationFn: (id) => apiDelete<null>(API_ENDPOINTS.STUDENT.CUSTOM_QUIZ_BY_ID(id)),
    invalidateKeys: [queryKeys.student.customQuizzes()],
    onSuccess: () => {
      toast.success("Quiz deleted");
      setQuizToDelete(null);
    },
    onError: (error) => toast.error(error.message || "Failed to delete quiz"),
  });

  const goToCreate = () => router.push(FRONTEND_ROUTES.STUDENT_CUSTOM_QUIZ_CREATE);
  const solve = (id: string) => router.push(FRONTEND_ROUTES.STUDENT_CUSTOM_QUIZ_SOLVE(id));

  const createButton = (
    <AppButton className="w-full" onClick={goToCreate}>
      <AddSVG className="size-4" />
      Create Quiz
    </AppButton>
  );

  return (
    <PageContainer>
      <PageHeader
        title="My Quizzes"
        showLine
        actions={createButton}
        actionsFullWidth
      />

      <AppTabs
        tabs={[
          { label: "My Quizzes", value: "mine", icon: QuizzesSVG },
          { label: "Shared With Me", value: "shared", icon: ShareSVG },
          {
            label: "Challenges",
            value: "challenges",
            icon: ChallengeSVG,
            count:
              myCreatedChallenges.length + myAcceptedInvites.length > 0
                ? myCreatedChallenges.length + myAcceptedInvites.length
                : undefined,
          },
        ]}
        activeTab={tab}
        onChange={(value) => setTab(value as QuizTab)}
        fullWidth
      />

      {tab === "challenges" ? (
        <MyChallengesTab
          myCreatedChallenges={myCreatedChallenges}
          myAcceptedInvites={myAcceptedInvites}
          onSetActiveTab={() => router.push(FRONTEND_ROUTES.STUDENT_GENERATE)}
          onRespond={handleRespond}
        />
      ) : tab === "mine" ? (
        <AppQueryState
          query={myQuizzesQuery}
          loadingMessage="Loading your quizzes…"
          errorMessage="Failed to load your quizzes."
          onRetry={() => myQuizzesQuery.refetch()}
        >
          {(quizzes) =>
            quizzes.length === 0 ? (
              <NovaEmptyState
                title="No quizzes yet"
                description="Build your own quizzes with custom questions, then solve them anytime or challenge your friends."
                icon={QuizzesSVG}
                action={{
                  label: "Create your first quiz",
                  onClick: goToCreate,
                  icon: AddSVG,
                }}
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {quizzes.map((quiz) => (
                  <CustomQuizCard
                    key={quiz.id}
                    quiz={quiz}
                    variant="owned"
                    onSolve={solve}
                    onEdit={(id) => router.push(FRONTEND_ROUTES.STUDENT_CUSTOM_QUIZ_EDIT(id))}
                    onDelete={setQuizToDelete}
                    onShare={setQuizToShare}
                  />
                ))}
              </div>
            )
          }
        </AppQueryState>
      ) : (
        <AppQueryState
          query={sharedQuizzesQuery}
          loadingMessage="Loading shared quizzes…"
          errorMessage="Failed to load shared quizzes."
          onRetry={() => sharedQuizzesQuery.refetch()}
        >
          {(quizzes) =>
            quizzes.length === 0 ? (
              <NovaEmptyState
                title="No shared quizzes yet"
                description="When a friend challenges you or shares one of their quizzes, it will appear here."
                icon={ShareSVG}
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {quizzes.map((quiz) => (
                  <CustomQuizCard key={quiz.id} quiz={quiz} variant="shared" onSolve={solve} />
                ))}
              </div>
            )
          }
        </AppQueryState>
      )}

      <DeleteConfirmationModal
        isOpen={quizToDelete !== null}
        onClose={() => setQuizToDelete(null)}
        onConfirm={() => {
          if (quizToDelete) deleteMutation.mutate(quizToDelete.id);
        }}
        title="Delete Quiz"
        message="Are you sure you want to delete this quiz?"
        itemName={quizToDelete?.title}
        isLoading={deleteMutation.isPending}
      />

      <ShareQuizModal quiz={quizToShare} onClose={() => setQuizToShare(null)} />
    </PageContainer>
  );
}
