"use client";

import { ChallengeCreateStep } from "@/types/enums";
import { GenerateStepProgress } from "@/components/generate/GeneratePaperUI";
import GenerateModeStep from "@/components/generate/GenerateModeStep";
import StepConfigure from "./StepConfigure";
import StepChapters from "./StepChapters";
import StepInvite from "./StepInvite";
import StepLightningSettings from "./StepLightningSettings";
import type { GenerateMode } from "@/types/generate";
import type { CustomUploadedImage, CustomCreationType } from "@/components/generate/GenerateCustomInputs";
import type { ManualQuestionItem } from "@/components/custom-quiz/ManualQuestionBuilder";

interface Curriculum {
  id: string;
  class: string;
  board: string;
  subject: string;
  chaptersCount: number;
}

interface Chapter {
  id: string;
  chapterNumber: number;
  chapterName: string;
  questionCount: number;
}

interface UserSearchResult {
  id: string;
  name: string;
  username: string;
  profileImage: string | null;
}

interface CreateChallengeFlowProps {
  mode: GenerateMode;
  setMode: (mode: GenerateMode) => void;
  createStep: ChallengeCreateStep;
  setCreateStep: (step: ChallengeCreateStep) => void;
  loadingSubjects: boolean;
  availableSubjects: Curriculum[];
  subject: string;
  setSubject: (subject: string) => void;
  customTitle: string;
  setCustomTitle: (title: string) => void;
  loadingChapters: boolean;
  chapters: Chapter[];
  selectedChapterIds: string[];
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  customImages: CustomUploadedImage[];
  onCustomImagesChange: (images: CustomUploadedImage[]) => void;
  creationType?: CustomCreationType;
  setCreationType?: (type: CustomCreationType) => void;
  manualQuestions?: ManualQuestionItem[];
  setManualQuestions?: (questions: ManualQuestionItem[]) => void;
  userClass?: string;
  userBoard?: string;
  userId?: string;
  onToggleChapter: (id: string) => void;
  onSelectAllChapters: () => void;
  onClearChapters: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  searchResults: UserSearchResult[];
  invitedUsers: UserSearchResult[];
  isCreating: boolean;
  onInviteUser: (user: UserSearchResult) => void;
  onRemoveUser: (id: string) => void;
  onGoToChapters: () => void;
  onGoToInvite: () => void;
  onCreateChallenge: () => void;
}

const CHALLENGE_STEPS_DEFAULT = ["Source Mode", "Select Subject", "Chapters", "Invite Friends"];
const CHALLENGE_STEPS_CUSTOM = ["Source Mode", "Challenge Details", "Invite Friends"];
const CHALLENGE_STEPS_LIGHTNING = ["Source Mode", "Select Subject", "Chapters", "Round Settings"];

export default function CreateChallengeFlow({
  mode,
  setMode,
  createStep,
  setCreateStep,
  loadingSubjects,
  availableSubjects,
  subject,
  setSubject,
  customTitle,
  setCustomTitle,
  loadingChapters,
  chapters,
  selectedChapterIds,
  customPrompt,
  setCustomPrompt,
  customImages,
  onCustomImagesChange,
  creationType = "ai",
  setCreationType,
  manualQuestions,
  setManualQuestions,
  userClass = "IX",
  userBoard = "AKUEB",
  userId,
  onToggleChapter,
  onSelectAllChapters,
  onClearChapters,
  searchQuery,
  setSearchQuery,
  isSearching,
  searchResults,
  invitedUsers,
  isCreating,
  onInviteUser,
  onRemoveUser,
  onGoToChapters,
  onGoToInvite,
  onCreateChallenge,
}: CreateChallengeFlowProps) {
  const isCustom = mode === "custom";
  const isLightning = mode === "lightning";

  const currentProgressStep =
    createStep === ChallengeCreateStep.MODE
      ? 0
      : createStep === ChallengeCreateStep.CONFIGURE
        ? 1
        : createStep === ChallengeCreateStep.CHAPTERS
          ? 2
          : isCustom
            ? 2
            : 3;

  const currentSteps = isCustom
    ? CHALLENGE_STEPS_CUSTOM
    : isLightning
      ? CHALLENGE_STEPS_LIGHTNING
      : CHALLENGE_STEPS_DEFAULT;

  return (
    <div className="space-y-6 lg:space-y-8">
      <GenerateStepProgress
        currentStep={currentProgressStep}
        steps={currentSteps}
      />

      {createStep === ChallengeCreateStep.MODE ? (
        <GenerateModeStep
          mode={mode}
          onModeChange={setMode}
          onContinue={() => setCreateStep(ChallengeCreateStep.CONFIGURE)}
          showLightning={true}
        />
      ) : null}

      {createStep === ChallengeCreateStep.CONFIGURE ? (
        <StepConfigure
          mode={mode}
          loadingSubjects={loadingSubjects}
          availableSubjects={availableSubjects}
          subject={subject}
          setSubject={setSubject}
          customTitle={customTitle}
          setCustomTitle={setCustomTitle}
          customPrompt={customPrompt}
          onCustomPromptChange={setCustomPrompt}
          customImages={customImages}
          onCustomImagesChange={onCustomImagesChange}
          creationType={creationType}
          onCreationTypeChange={setCreationType}
          manualQuestions={manualQuestions}
          onManualQuestionsChange={setManualQuestions}
          userClass={userClass}
          userBoard={userBoard}
          userId={userId}
          onBack={() => setCreateStep(ChallengeCreateStep.MODE)}
          onNext={isCustom ? onGoToInvite : onGoToChapters}
        />
      ) : null}

      {!isCustom && createStep === ChallengeCreateStep.CHAPTERS ? (
        <StepChapters
          loadingChapters={loadingChapters}
          chapters={chapters}
          selectedChapterIds={selectedChapterIds}
          onToggleChapter={onToggleChapter}
          onSelectAll={onSelectAllChapters}
          onClear={onClearChapters}
          onBack={() => setCreateStep(ChallengeCreateStep.CONFIGURE)}
          onNext={onGoToInvite}
          continueLabel={isLightning ? "Next: Round Settings" : "Next: Invite Friends"}
          nextHint={
            isLightning
              ? "Configure live speed timer, questions, and lobby parameters"
              : "Invite classmates and friends to your challenge arena"
          }
        />
      ) : null}

      {createStep === ChallengeCreateStep.INVITE ? (
        isLightning ? (
          <StepLightningSettings
            subject={subject}
            selectedChapterIds={selectedChapterIds}
            chaptersCount={chapters.length}
            userClass={userClass}
            userBoard={userBoard}
            userId={userId}
            onBack={() => setCreateStep(ChallengeCreateStep.CHAPTERS)}
          />
        ) : (
          <StepInvite
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isSearching={isSearching}
            searchResults={searchResults}
            invitedUsers={invitedUsers}
            isCreating={isCreating}
            onInviteUser={onInviteUser}
            onRemoveUser={onRemoveUser}
            onBack={() =>
              setCreateStep(
                isCustom
                  ? ChallengeCreateStep.CONFIGURE
                  : ChallengeCreateStep.CHAPTERS,
              )
            }
            onCreateChallenge={onCreateChallenge}
          />
        )
      ) : null}
    </div>
  );
}
