"use client";

import { Typography } from "@/components/ui/Typography";
import { useRouter } from "next/navigation";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import AppButton from "@/components/AppButton";
import { AppPagination } from "@/components/AppPagination";
import AppLabel from "@/components/AppLabel";
import AppSelect from "@/components/AppSelect";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import QuestionCard from "@/components/QuestionCard";
import MCQOptionsDisplay from "@/components/MCQOptionsDisplay";
import QuestionBankBrowseCard from "@/components/admin/question-bank/QuestionBankBrowseCard";
import QuestionBankBreadcrumb from "@/components/admin/question-bank/QuestionBankBreadcrumb";
import {
  GenerateSectionDivider,
  PaperTypeOption,
  SubjectOption,
  SubjectOptionGrid,
} from "@/components/generate/GeneratePaperUI";
import { getSubjectIcon } from "@/lib/generate/subject-icons";
import {
  CLASS_ORDER,
  getClassQuestionCounts,
  getPaperQuestionCount,
  getSubjectsForClass,
} from "@/lib/question-bank/browse-helpers";
import { Search, X, FileText, Clock, Loader2, Image as ImageIcon } from "lucide-react";
import QuestionBankSVG from "@/public/svgs/QuestionBankSVG";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { convertMathToHTML } from "@/lib/utils/math-notation";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import AppQueryState from "@/components/AppQueryState";
import AppState from "@/components/AppState";
import {
  useAdminQuestionBankSummary,
  useAdminQuestionBankChapters,
  useAdminQuestions,
  useDeleteAdminQuestion,
} from "@/hooks/admin/useAdminQuestionBank";
import type { QuestionBankItem } from "@/types/question-bank";

type BrowseStep = "class" | "subject" | "paper" | "questions";

export default function QuestionBankPage() {
  const router = useRouter();
  const summaryQuery = useAdminQuestionBankSummary();

  const [step, setStep] = useState<BrowseStep>("class");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<1 | 2 | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [chapterFilter, setChapterFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingQuestion, setViewingQuestion] = useState<QuestionBankItem | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<QuestionBankItem | null>(null);

  const questionsQuery = useAdminQuestions(
    {
      page: currentPage,
      limit: 20,
      class: selectedClass || undefined,
      subject: selectedSubject || undefined,
      paperNumber: selectedPaper || undefined,
      chapterName: chapterFilter !== "all" ? chapterFilter : undefined,
      search: searchTerm || undefined,
    },
    step === "questions" && Boolean(selectedClass && selectedSubject && selectedPaper),
  );

  const chaptersQuery = useAdminQuestionBankChapters(
    step === "questions" && selectedClass && selectedSubject && selectedPaper
      ? {
          class: selectedClass,
          subject: selectedSubject,
          paperNumber: selectedPaper,
        }
      : null,
  );
  const deleteMutation = useDeleteAdminQuestion();

  const facets = summaryQuery.data?.facets ?? [];
  const classCounts = useMemo(() => getClassQuestionCounts(facets), [facets]);
  const subjectOptions = useMemo(
    () => (selectedClass ? getSubjectsForClass(facets, selectedClass) : []),
    [facets, selectedClass],
  );
  const paperOneCount =
    selectedClass && selectedSubject
      ? getPaperQuestionCount(facets, selectedClass, selectedSubject, 1)
      : 0;
  const paperTwoCount =
    selectedClass && selectedSubject
      ? getPaperQuestionCount(facets, selectedClass, selectedSubject, 2)
      : 0;

  const pagination = questionsQuery.data?.pagination ?? null;
  const chapterOptions = useMemo(() => {
    const chapters = chaptersQuery.data?.chapters ?? [];
    return [
      { value: "all", label: "All Chapters" },
      ...chapters.map((chapter) => ({
        value: chapter.name,
        label: `${chapter.name} (${chapter.count})`,
      })),
    ];
  }, [chaptersQuery.data?.chapters]);

  const breadcrumbItems = useMemo(() => {
    const items: string[] = ["Question Bank"];
    if (selectedClass) {
      items.push(`Class ${selectedClass}`);
    }
    if (selectedSubject) {
      items.push(selectedSubject);
    }
    if (selectedPaper) {
      items.push(`Paper ${selectedPaper === 1 ? "I" : "II"}`);
    }
    return items;
  }, [selectedClass, selectedSubject, selectedPaper]);

  const handleSelectClass = (className: string) => {
    setSelectedClass(className);
    setSelectedSubject(null);
    setSelectedPaper(null);
    setSearchTerm("");
    setCurrentPage(1);
    setStep("subject");
  };

  const handleSelectSubject = (subject: string) => {
    setSelectedSubject(subject);
    setSelectedPaper(null);
    setSearchTerm("");
    setCurrentPage(1);
    setStep("paper");
  };

  const handleSelectPaper = (paperNumber: 1 | 2) => {
    setSelectedPaper(paperNumber);
    setSearchTerm("");
    setChapterFilter("all");
    setCurrentPage(1);
    setStep("questions");
  };

  const handleBack = () => {
    if (step === "questions") {
      setSelectedPaper(null);
      setSearchTerm("");
      setChapterFilter("all");
      setCurrentPage(1);
      setStep("paper");
      return;
    }
    if (step === "paper") {
      setSelectedSubject(null);
      setStep("subject");
      return;
    }
    if (step === "subject") {
      setSelectedClass(null);
      setStep("class");
    }
  };

  const openDeleteModal = (question: QuestionBankItem) => {
    setQuestionToDelete(question);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (!deletingQuestionId) {
      setDeleteModalOpen(false);
      setQuestionToDelete(null);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!questionToDelete) {
      return;
    }

    const questionId = questionToDelete.id;
    setDeletingQuestionId(questionId);
    try {
      await deleteMutation.mutateAsync(questionId);
      toast.success("Question deleted successfully");
      if (viewingQuestion?.id === questionId) {
        setViewingQuestion(null);
      }
      setDeleteModalOpen(false);
      setQuestionToDelete(null);
      void summaryQuery.refetch();
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete question");
    } finally {
      setDeletingQuestionId(null);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Question Bank"
      />

      <AppQueryState
        query={summaryQuery}
        loadingMessage="Loading question bank..."
        errorMessage="Failed to load question bank summary."
        onRetry={() => summaryQuery.refetch()}
        fullScreen={false}
      >
        {() => (
          <>
            {step !== "class" ? (
              <QuestionBankBreadcrumb items={breadcrumbItems} onBack={handleBack} />
            ) : null}

            {step === "class" ? (
              <div>
                <GenerateSectionDivider label="Select Class" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                  {CLASS_ORDER.map((className) => {
                    const count = classCounts.get(className) || 0;
                    return (
                      <QuestionBankBrowseCard
                        key={className}
                        title={`Class ${className}`}
                        watermark={className}
                        subtitle={`${count} question${count === 1 ? "" : "s"}`}
                        onClick={() => handleSelectClass(className)}
                        disabled={count === 0}
                      />
                    );
                  })}
                </div>
              </div>
            ) : null}

            {step === "subject" && selectedClass ? (
              <div>
                <GenerateSectionDivider label={`Class ${selectedClass} · Subjects`} />
                {subjectOptions.length === 0 ? (
                  <AppState
                    isEmpty={true}
                    title="No Subjects Found"
                    description={`No questions are available for Class ${selectedClass} yet.`}
                    icon={QuestionBankSVG}
                    fullScreen={false}
                  />
                ) : (
                  <SubjectOptionGrid>
                    {subjectOptions.map(({ subject, count }) => (
                      <SubjectOption
                        key={subject}
                        subject={subject}
                        chaptersCount={count}
                        icon={getSubjectIcon(subject)}
                        selected={false}
                        showChapterCount={false}
                        subtitle={`${count} question${count === 1 ? "" : "s"}`}
                        onSelect={() => handleSelectSubject(subject)}
                      />
                    ))}
                  </SubjectOptionGrid>
                )}
              </div>
            ) : null}

            {step === "paper" && selectedClass && selectedSubject ? (
              <div>
                <GenerateSectionDivider label="Select Paper Type" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <PaperTypeOption
                    label="Foundational"
                    title="Paper I"
                    description={
                      paperOneCount > 0
                        ? `${paperOneCount} MCQ question${paperOneCount === 1 ? "" : "s"} available`
                        : "No Paper I questions yet"
                    }
                    badge="MCQ"
                    watermark="I"
                    selected={false}
                    onSelect={() => {
                      if (paperOneCount > 0) {
                        handleSelectPaper(1);
                      }
                    }}
                  />
                  <PaperTypeOption
                    label="Analytical"
                    title="Paper II"
                    description={
                      paperTwoCount > 0
                        ? `${paperTwoCount} CRQ & ERQ question${paperTwoCount === 1 ? "" : "s"} available`
                        : "No Paper II questions yet"
                    }
                    badge="CRQ & ERQ"
                    watermark="II"
                    selected={false}
                    onSelect={() => {
                      if (paperTwoCount > 0) {
                        handleSelectPaper(2);
                      }
                    }}
                  />
                </div>
              </div>
            ) : null}

            {step === "questions" && selectedClass && selectedSubject && selectedPaper ? (
              <>
                <div className="mb-6 rounded-3xl border border-border/40 bg-primary/10 p-4 shadow-sm backdrop-blur-xl sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="relative min-w-0 flex-1">
                      <AppLabel
                        htmlFor="question-bank-search"
                        className="mb-2 ml-1 block text-[10px] font-bold uppercase tracking-widest text-primary/70"
                      >
                        Search
                      </AppLabel>
                      <div className="relative">
                        <Search className="absolute left-5 top-1/2 size-4 -translate-y-1/2 text-primary/40" />
                        <input
                          id="question-bank-search"
                          type="text"
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                          }}
                          placeholder="Search within this selection..."
                          className="h-12 w-full rounded-2xl border border-primary/10 bg-background/50 pl-12 pr-4 font-bold text-foreground placeholder:text-muted-foreground/40 focus:border-primary/20 focus:outline-none focus:ring-4 focus:ring-primary/5 sm:h-14"
                        />
                      </div>
                    </div>

                    <div className="w-full sm:w-72">
                      <AppLabel
                        htmlFor="question-bank-chapter"
                        className="mb-2 ml-1 block text-[10px] font-bold uppercase tracking-widest text-primary/70"
                      >
                        Chapter
                      </AppLabel>
                      <AppSelect
                        id="question-bank-chapter"
                        value={chapterFilter}
                        onChange={(e) => {
                          setChapterFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        options={chapterOptions}
                        placeholder="All Chapters"
                        className="h-12 rounded-2xl border-primary/10 bg-background/50 sm:h-14"
                        disabled={chaptersQuery.isLoading}
                      />
                    </div>
                  </div>
                </div>

                <AppQueryState
                  query={questionsQuery}
                  isEmpty={(data) => data.questions.length === 0}
                  emptyMessage="No questions found for this selection."
                  emptyTitle="No questions"
                  errorMessage="Failed to load questions"
                  onRetry={() => questionsQuery.refetch()}
                  fullScreen={false}
                >
                  {(data) => (
                    <>
                      <div className="space-y-3">
                        {data.questions.map((question) => (
                          <QuestionCard
                            key={question.id}
                            questionNumber={question.questionNumber}
                            questionPart={question.questionPart}
                            questionText={question.questionText}
                            questionType={question.questionType}
                            chapterName={question.chapterName}
                            pastPaperInfo={question.pastPaper}
                            imageUrl={question.imageUrl}
                            onView={() => setViewingQuestion(question)}
                            onDelete={() => openDeleteModal(question)}
                            isDeleting={deletingQuestionId === question.id}
                          />
                        ))}
                      </div>

                      <AppPagination
                        currentPage={currentPage}
                        totalPages={pagination?.totalPages ?? 1}
                        totalItems={pagination?.total ?? 0}
                        pageSize={20}
                        itemLabel="questions"
                        onPageChange={setCurrentPage}
                      />
                    </>
                  )}
                </AppQueryState>
              </>
            ) : null}
          </>
        )}
      </AppQueryState>

      {viewingQuestion ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl md:p-8">
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Typography variant="h2" className="text-2xl font-bold tracking-tight">
                    Question Details
                  </Typography>
                  <Typography variant="small" className="mt-1 text-muted-foreground">
                    Review question content, attachments, and Paper II exemplars.
                  </Typography>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingQuestion(null)}
                  className="rounded-full p-2 transition-colors hover:bg-muted"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-xl bg-primary px-4 py-1.5 font-bold text-primary-foreground shadow-sm">
                  Q{viewingQuestion.questionNumber}
                  {viewingQuestion.questionPart || ""}
                </span>
                {viewingQuestion.questionType ? (
                  <span className="rounded-xl border border-border bg-muted px-3 py-1.5 text-xs font-bold text-foreground">
                    {viewingQuestion.questionType}
                  </span>
                ) : null}
                {viewingQuestion.marks ? (
                  <span className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                    Marks: {viewingQuestion.marks}
                  </span>
                ) : null}
                <span className="rounded-xl bg-accent/50 px-3 py-1.5 text-xs font-medium text-foreground">
                  Class {viewingQuestion.pastPaper.class}
                </span>
                <span className="rounded-xl bg-accent/50 px-3 py-1.5 text-xs font-medium text-foreground">
                  {viewingQuestion.pastPaper.subject}
                </span>
              </div>

              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <div className="flex flex-wrap gap-4 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <QuestionBankSVG className="size-4 text-primary" />
                    <span>{viewingQuestion.pastPaper.subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-primary" />
                    <span>Year: {viewingQuestion.pastPaper.year}</span>
                  </div>
                  {viewingQuestion.chapterName ? (
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-primary" />
                      <span>Chapter: {viewingQuestion.chapterName}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-border bg-muted/30 p-5 shadow-inner">
                <Typography className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Question Content
                </Typography>
                <div
                  className="text-lg leading-relaxed text-foreground"
                  dangerouslySetInnerHTML={{
                    __html: convertMathToHTML(viewingQuestion.questionText),
                  }}
                />

                {viewingQuestion.imageUrl ? (
                  <div className="rounded-2xl border border-border bg-card p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <ImageIcon className="size-4 text-primary" />
                      Question Figure
                    </div>
                    <img
                      src={viewingQuestion.imageUrl}
                      alt={`Question ${viewingQuestion.questionNumber} Figure`}
                      className="max-h-104 w-full rounded-xl border border-border/60 bg-muted/20 object-contain"
                    />
                  </div>
                ) : null}
              </div>

              {viewingQuestion.questionType === "MCQ" && viewingQuestion.mcqOptions ? (
                <MCQOptionsDisplay
                  options={viewingQuestion.mcqOptions}
                  correctAnswerId={viewingQuestion.correctAnswer}
                />
              ) : null}

              {viewingQuestion.paperIIData?.betterResponse ||
              viewingQuestion.paperIIData?.weakerResponse ||
              viewingQuestion.paperIIData?.markingNotes ? (
                <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <Typography className="text-sm font-bold uppercase tracking-widest text-primary">
                    Paper II Exemplar Responses
                  </Typography>

                  {viewingQuestion.paperIIData?.betterResponse ? (
                    <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
                      <Typography className="mb-1 text-xs font-bold uppercase tracking-widest text-green-600 dark:text-green-400">
                        Better Response
                      </Typography>
                      <Typography className="whitespace-pre-wrap text-sm text-foreground">
                        {viewingQuestion.paperIIData.betterResponse}
                      </Typography>
                    </div>
                  ) : null}

                  {viewingQuestion.paperIIData?.weakerResponse ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                      <Typography className="mb-1 text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                        Weaker Response
                      </Typography>
                      <Typography className="whitespace-pre-wrap text-sm text-foreground">
                        {viewingQuestion.paperIIData.weakerResponse}
                      </Typography>
                    </div>
                  ) : null}

                  {viewingQuestion.paperIIData?.markingNotes ? (
                    <div className="rounded-xl border border-border bg-card p-4">
                      <Typography className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Marking Notes
                      </Typography>
                      <Typography className="whitespace-pre-wrap text-sm text-foreground">
                        {viewingQuestion.paperIIData.markingNotes}
                      </Typography>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="flex gap-4 border-t border-border pt-6">
                <AppButton
                  variant="secondary"
                  onClick={() => openDeleteModal(viewingQuestion)}
                  className="h-12 flex-1 rounded-2xl border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20"
                  disabled={deletingQuestionId === viewingQuestion.id}
                >
                  {deletingQuestionId === viewingQuestion.id ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <DeleteSVG className="mr-2 size-4" />
                      Delete Question
                    </>
                  )}
                </AppButton>
                <AppButton
                  variant="default"
                  onClick={() => setViewingQuestion(null)}
                  className="h-12 flex-1 rounded-2xl"
                >
                  Close Detail
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteQuestion}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action is permanent."
        itemName={
          questionToDelete
            ? `Q${questionToDelete.questionNumber}${questionToDelete.questionPart || ""} - ${questionToDelete.questionText.substring(0, 50)}${questionToDelete.questionText.length > 50 ? "..." : ""}`
            : undefined
        }
        isLoading={deletingQuestionId !== null}
      />
    </PageContainer>
  );
}
