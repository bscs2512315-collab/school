"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppTabs from "@/components/AppTabs";
import ConfirmationModal from "@/components/ConfirmationModal";
import AppLoader from "@/components/AppLoader";
import ZapSVG from "@/public/svgs/ZapSVG";
import PlusSVG from "@/public/svgs/PlusSVG";
import MailSVG from "@/public/svgs/MailSVG";

import PracticeModeSelector, {
  type PracticeIntent,
} from "@/components/generate/PracticeModeSelector";
import ChallengeTypeSelector, {
  type ChallengeType,
} from "@/components/generate/ChallengeTypeSelector";
import UnifiedConfigureStep, {
  type QuestionSourceMode,
} from "@/components/generate/UnifiedConfigureStep";
import GenerateAttemptStep from "@/components/generate/GenerateAttemptStep";
import GeneratePendingScreen from "@/components/generate/GeneratePendingScreen";
import GenerateResultScreen from "@/components/generate/GenerateResultScreen";
import JoinTab from "@/components/generate/JoinTab";

import InvitationsTab from "../challenge/components/InvitationsTab";

import { useGeneratePaperFlow } from "@/hooks/generate/useGeneratePaperFlow";
import { useStoredUser } from "@/hooks/useStoredUser";
import {
  useChallenges,
  useCreateChallenge,
  useRespondToChallenge,
} from "@/hooks/challenge/useChallenges";
import { useUserSearch } from "@/hooks/user/useUserSearch";
import { apiPost } from "@/lib/api/api-client";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import type { SearchUser } from "@/types/user";

type HubTab = "practice" | "join" | "invitations";
type WizardStep = "intent" | "challengeType" | "configure";

export default function PracticeAndChallengePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isReady } = useStoredUser();

  const flow = useGeneratePaperFlow();
  const challengesQuery = useChallenges();
  const createChallengeMutation = useCreateChallenge();
  const respondChallengeMutation = useRespondToChallenge();

  const userClass = user?.class ?? flow.userClass ?? "IX";
  const userBoard = user?.board ?? flow.userBoard ?? "AKUEB";

  // Tab State
  const initialTab =
    searchParams.get("tab") === "invitations"
      ? "invitations"
      : searchParams.get("tab") === "join" ||
        searchParams.get("tab") === "pin"
      ? "join"
      : "practice";
  const [activeTab, setActiveTab] = useState<HubTab>(initialTab);

  // Wizard Sub-steps inside 'practice'
  const initialIntent = searchParams.get("intent") === "challenge"
    ? "challenge"
    : searchParams.get("intent") === "myself"
      ? "myself"
      : null;
  const initialChallengeType = searchParams.get("challengeType") === "lightning"
    ? "lightning"
    : searchParams.get("challengeType") === "normal"
      ? "normal"
      : null;
  const [wizardStep, setWizardStep] = useState<WizardStep>(
    initialIntent === "challenge" && !initialChallengeType
      ? "challengeType"
      : initialIntent
        ? "configure"
        : "intent",
  );
  const [selectedIntent, setSelectedIntent] = useState<PracticeIntent | null>(initialIntent);
  const [challengeType, setChallengeType] = useState<ChallengeType | null>(initialChallengeType);

  // 1v1 Challenge Invite State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [invitedUsers, setInvitedUsers] = useState<
    Array<{ id: string; name: string; username: string; profileImage: string | null }>
  >([]);

  // Lightning Round parameters
  const [lightningTimer, setLightningTimer] = useState<number>(20);
  const [lightningQuestionCount, setLightningQuestionCount] = useState<number>(10);
  const [isSubmittingChallenge, setIsSubmittingChallenge] = useState(false);

  const searchQueryResult = useUserSearch(debouncedSearch, { studentsOnly: true });
  const searchResults: SearchUser[] = searchQueryResult.data?.users ?? [];

  const challenges = challengesQuery.data ?? [];
  const incomingInvitations = challenges.filter(
    (c) => !c.isCreator && c.myStatus === "INVITED"
  );

  // Debounce friend search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setDebouncedSearch("");
      return;
    }
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle intent selection (Step 1)
  const handleSelectIntent = (intent: PracticeIntent) => {
    setSelectedIntent(intent);
    if (intent === "myself") {
      setChallengeType(null);
      setWizardStep("configure");
    } else if (intent === "challenge") {
      setWizardStep("challengeType");
    }
  };

  // Handle challenge type selection (Step 2 if challenge)
  const handleSelectChallengeType = (type: ChallengeType) => {
    setChallengeType(type);
    setWizardStep("configure");
  };

  // 1v1 user search & invite handlers
  const handleInviteUser = (inviteUser: {
    id: string;
    name: string;
    username: string;
    profileImage: string | null;
  }) => {
    if (invitedUsers.find((u) => u.id === inviteUser.id)) {
      toast.error("User already invited");
      return;
    }
    setInvitedUsers((prev) => [...prev, inviteUser]);
    setSearchQuery("");
  };

  const handleRemoveUser = (id: string) => {
    setInvitedUsers((prev) => prev.filter((u) => u.id !== id));
  };

  // Handle Respond to Challenge Invite
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

  // Main Submit Handler for Step 3
  const handleUnifiedSubmit = async () => {
    if (selectedIntent === "myself") {
      // Solo exam attempt
      await flow.generatePaper();
      return;
    }

    if (selectedIntent === "challenge") {
      if (challengeType === "lightning") {
        // Launch live lightning arena
        setIsSubmittingChallenge(true);
        const toastId = toast.loading("Launching live Lightning Arena lobby...");

        try {
          const effectiveSubject =
            flow.mode === "custom"
              ? flow.customTitle.trim() || "Custom Lightning Round"
              : flow.subject;

          const res = await apiPost<{
            sessionId: string;
            pinCode: string;
          }>("/lightning/create", {
            userId: user?.id,
            title: `${effectiveSubject} Lightning Round`,
            subject: effectiveSubject,
            classLevel: userClass,
            board: userBoard,
            sourceMode: flow.mode,
            perQuestionSeconds: lightningTimer,
            chapterIds: flow.mode === "custom" ? [] : flow.selectedChapterIds,
            sloNumbers: flow.mode === "slos" && flow.selectedSloNumbers.length > 0 ? flow.selectedSloNumbers : undefined,
            prompt: flow.customPrompt,
            imageUrls: flow.customImages.map((img) => img.fileUrl),
            manualQuestions:
              flow.customCreationType === "manual" && flow.mode === "custom"
                ? flow.manualQuestions
                : undefined,
            questionCount:
              flow.customCreationType === "manual" && flow.mode === "custom"
                ? flow.manualQuestions.length
                : lightningQuestionCount,
          });

          if (!res.success || !res.data?.sessionId) {
            throw new Error(res.message || "Failed to create Lightning Round");
          }

          toast.success("Lightning Round lobby created! 🎉", { id: toastId });
          router.push(`/student/lightning/${res.data.sessionId}`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Failed to launch Lightning Round";
          toast.error(msg, {
            id: toastId,
          });
        } finally {
          setIsSubmittingChallenge(false);
        }
      } else {
        // Normal 1v1 Challenge
        if (invitedUsers.length === 0) {
          toast.error("Please invite at least one classmate");
          return;
        }

        setIsSubmittingChallenge(true);
        const toastId = toast.loading("Creating challenge room...");

        try {
          const inviteUsernames = invitedUsers
            .map((u) => u.username)
            .filter(Boolean) as string[];

          const effectiveSubject =
            flow.mode === "custom"
              ? flow.customTitle.trim() || "Custom Challenge"
              : flow.subject;

          const result = await createChallengeMutation.mutateAsync({
            subject: effectiveSubject,
            classLevel: userClass,
            board: userBoard,
            paperType: "1",
            chapterIds: flow.mode === "custom" ? [] : flow.selectedChapterIds,
            sloNumbers: flow.mode === "slos" && flow.selectedSloNumbers.length > 0 ? flow.selectedSloNumbers : undefined,
            inviteUsernames,
            mode: flow.mode,
            prompt: flow.customPrompt,
            imageUrls: flow.customImages.map((img) => img.fileUrl),
          });

          toast.success("Challenge created! 🎉", { id: toastId });
          router.push(FRONTEND_ROUTES.STUDENT_CHALLENGE_DETAIL(result.challengeId));
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Failed to create challenge",
            { id: toastId }
          );
        } finally {
          setIsSubmittingChallenge(false);
        }
      }
    }
  };

  // If in solo exam attempt mode
  if (flow.step === "attempt" && flow.generatedPaper) {
    return (
      <div className="h-full min-h-0">
        <GenerateAttemptStep
          paperType={flow.paperType}
          generatedPaper={flow.generatedPaper}
          currentQuestionIndex={flow.currentQuestionIndex}
          mcqAnswers={flow.mcqAnswers}
          uploads={flow.uploads}
          timeLeft={flow.timeLeft}
          isSubmitting={flow.isSubmitting}
          pendingUploadCount={flow.pendingUploadCount}
          uploadedCount={flow.uploadedCount}
          formatTime={flow.formatTime}
          onSelectMcqAnswer={flow.selectMCQAnswer}
          onAddFiles={flow.handleFileSelect}
          onRetryUpload={flow.handleRetryUpload}
          onRemoveUpload={flow.handleRemoveUpload}
          onPrevious={() => flow.setCurrentQuestionIndex((index) => index - 1)}
          onNext={() => flow.setCurrentQuestionIndex((index) => index + 1)}
          onSubmit={() => void flow.handleSubmit()}
          onQuestionIndexChange={flow.setCurrentQuestionIndex}
        />

        <ConfirmationModal
          isOpen={flow.showSubmitModal}
          onClose={() => flow.setShowSubmitModal(false)}
          onConfirm={() => void flow.confirmSubmit()}
          title="Unanswered Questions"
          message={`You have ${flow.unansweredCount} unanswered question${flow.unansweredCount !== 1 ? "s" : ""}. Submit anyway?`}
          confirmLabel="Submit Anyway"
          cancelLabel="Go Back"
          variant="warning"
          isLoading={flow.isSubmitting}
        />
      </div>
    );
  }

  // If solo exam result screen
  if (flow.step === "result" && flow.generatedPaper && flow.result) {
    return (
      <PageContainer>
        <GenerateResultScreen
          paper={flow.generatedPaper}
          result={flow.result}
          onRetry={flow.resetToStart}
          onBack={() => router.push(FRONTEND_ROUTES.STUDENT_DASHBOARD)}
        />
      </PageContainer>
    );
  }

  // If solo exam pending AI grading screen
  if (flow.step === "pending") {
    return (
      <PageContainer>
        <GeneratePendingScreen
          subject={flow.subject}
          classLevel={flow.persistedExamData?.userClass}
          board={flow.persistedExamData?.userBoard}
          paperNumber={2}
          onReattempt={flow.resetToStart}
          onDashboard={() => router.push(FRONTEND_ROUTES.STUDENT_DASHBOARD)}
        />
      </PageContainer>
    );
  }

  if (flow.loadingSubjects && !isReady) {
    return <AppLoader />;
  }

  return (
    <PageContainer className="space-y-0 pb-1 sm:pb-2">
      {/* Resume Unfinished Exam Confirmation Modal */}
      <ConfirmationModal
        isOpen={flow.showResumeModal}
        onClose={() => flow.setShowResumeModal(false)}
        onConfirm={flow.resumeExam}
        onCancelClick={flow.discardExamAndNew}
        title="Resume Unfinished Exam?"
        message={`You have an unsubmitted ${
          flow.persistedExamData?.subject || "previous"
        } ${
          flow.persistedExamData?.paperType === "2" ? "Paper II" : "Paper I"
        } exam. Would you like to resume it or discard it and start fresh?`}
        confirmLabel="Resume Progress"
        cancelLabel="Discard & Start Fresh"
        variant="primary"
      />

      <PageHeader
        title="Play & Prep"
        watermark="PLAY & PREP"
        showWatermark={true}
        showLine={true}
      />

      {/* Top Hub Navigation Tabs */}
      <div className="mb-6 sm:mb-8">
        <AppTabs
          fullWidth
          tabs={[
            {
              label: "Play & Prep",
              value: "practice",
              icon: PlusSVG,
              mobileLabel: "Play & Prep",
            },
            {
              label: "Join",
              value: "join",
              icon: ZapSVG,
              mobileLabel: "Join",
            },
            {
              label: "Invitations",
              value: "invitations",
              icon: MailSVG,
              mobileLabel: "Invites",
              count: incomingInvitations.length > 0 ? incomingInvitations.length : undefined,
            },
          ]}
          activeTab={activeTab}
          onChange={(val: string) => {
            setActiveTab(val as HubTab);
          }}
        />
      </div>

      {/* TAB 1: PRACTICE & CREATE WIZARD */}
      {activeTab === "practice" && (
        <div className="space-y-6">
          {/* STEP 1: Practice Mode Intent (Myself / Challenge) */}
          {wizardStep === "intent" && (
            <PracticeModeSelector
              selectedIntent={selectedIntent}
              onSelectIntent={handleSelectIntent}
            />
          )}

          {/* STEP 2 (If Challenge selected): Challenge Type (1v1 vs Lightning) */}
          {wizardStep === "challengeType" && (
            <ChallengeTypeSelector
              selectedType={challengeType}
              onSelectType={handleSelectChallengeType}
              onBack={() => setWizardStep("intent")}
            />
          )}

          {/* STEP 3: Unified Configuration Form */}
          {wizardStep === "configure" && selectedIntent && (
            <UnifiedConfigureStep
              intent={selectedIntent}
              challengeType={challengeType}
              mode={flow.mode as QuestionSourceMode}
              onModeChange={(m) => flow.setMode(m)}
              paperType={flow.paperType}
              onPaperTypeChange={flow.setPaperType}
              difficulty={flow.difficulty}
              onDifficultyChange={flow.setDifficulty}
              isPublic={flow.isPublic}
              onIsPublicChange={flow.setIsPublic}
              subject={flow.subject}
              onSubjectChange={flow.setSubject}
              availableSubjects={flow.availableSubjects}
              loadingSubjects={flow.loadingSubjects}
              chapters={flow.chapters}
              selectedChapterIds={flow.selectedChapterIds}
              selectedSloNumbers={flow.selectedSloNumbers}
              onSelectedSloNumbersChange={flow.setSelectedSloNumbers}
              loadingChapters={flow.loadingChapters}
              onToggleChapter={flow.toggleChapter}
              onSelectAllChapters={flow.selectAllChapters}
              onClearChapters={flow.clearChapters}
              customTitle={flow.customTitle}
              onCustomTitleChange={flow.setCustomTitle}
              customPrompt={flow.customPrompt}
              onCustomPromptChange={flow.setCustomPrompt}
              customImages={flow.customImages}
              onCustomImagesChange={flow.setCustomImages}
              creationType={flow.customCreationType}
              onCreationTypeChange={flow.setCustomCreationType}
              manualQuestions={flow.manualQuestions}
              onManualQuestionsChange={flow.setManualQuestions}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              isSearchingUsers={searchQueryResult.isFetching}
              searchResults={searchResults.map((u) => ({
                id: u.id,
                name: u.name,
                username: u.username ?? "",
                profileImage: u.profileImage,
              }))}
              invitedUsers={invitedUsers}
              onInviteUser={handleInviteUser}
              onRemoveUser={handleRemoveUser}
              lightningTimer={lightningTimer}
              onLightningTimerChange={setLightningTimer}
              lightningQuestionCount={lightningQuestionCount}
              onLightningQuestionCountChange={setLightningQuestionCount}
              isSubmitting={flow.loadingPaper || isSubmittingChallenge}
              onBack={() => {
                if (selectedIntent === "challenge") {
                  setWizardStep("challengeType");
                } else {
                  setWizardStep("intent");
                }
              }}
              onSubmit={handleUnifiedSubmit}
            />
          )}
        </div>
      )}

      {/* TAB 2: JOIN ARENA (PIN) */}
      {activeTab === "join" && (
        <JoinTab />
      )}

      {/* TAB 3: CHALLENGE INVITATIONS */}
      {activeTab === "invitations" && (
        <InvitationsTab
          incomingInvitations={incomingInvitations}
          onRespond={handleRespond}
        />
      )}
    </PageContainer>
  );
}
