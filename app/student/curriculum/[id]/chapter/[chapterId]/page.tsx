"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppState from "@/components/AppState";
import AppQueryState from "@/components/AppQueryState";
import AppButton from "@/components/AppButton";
import SLOTable from "@/components/SLOTable";
import { AlertCircle, BookOpen } from "lucide-react";
import GenerateSVG from "@/public/svgs/GenerateSVG";
import { useStudentCurriculumDetail } from "@/hooks/student/useStudentCurriculumDetail";
import type { Subtopic } from "@/lib/utils/syllabus-parser";
import { getStoredUserRole } from "@/lib/routes/learning-routes";
import { UserRole } from "@/types/enums";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import QuestionBankBrowseCard from "@/components/admin/question-bank/QuestionBankBrowseCard";

function getExerciseDisplayTitle(exerciseNumber?: string, title?: string, chapterName?: string): string {
  if (exerciseNumber && exerciseNumber.trim()) {
    const clean = exerciseNumber.trim();
    if (/^\d+(\.\d+)?$/.test(clean)) {
      return `Exercise ${clean}`;
    }
    return clean;
  }

  if (title && title.trim()) {
    const match = title.match(/((?:Review\s+)?Exercise\s+\d+(?:\.\d+)?)/i);
    if (match) {
      return match[1];
    }
    let clean = title.trim().replace(/\s*[-:–—]\s*Math(ematics)?(\s*Class)?\s*\d+th?/i, "").trim();
    if (chapterName) {
      const escaped = chapterName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      clean = clean.replace(new RegExp(`^${escaped}\\s*[-:–—]\\s*`, "i"), "").trim();
    }
    return clean || "Exercise";
  }

  return "Exercise";
}

function getExerciseWatermark(exerciseNumber: string): string {
  const match = exerciseNumber.match(/([0-9]+(?:\.[0-9]+)?)/);
  return match ? match[1] : exerciseNumber.slice(0, 2).toUpperCase();
}

export default function StudentChapterSLOPage() {
  const router = useRouter();
  const params = useParams();
  const curriculumId = params?.id as string;
  const chapterId = params?.chapterId as string;
  const curriculumQuery = useStudentCurriculumDetail(curriculumId);
  const [role, setRole] = useState<string | null>(null);
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [openingExerciseId, setOpeningExerciseId] = useState<string | null>(null);

  useEffect(() => {
    setRole(getStoredUserRole());
  }, []);

  const isTeacher = role === UserRole.TEACHER;

  const chapter = useMemo(() => {
    return curriculumQuery.data?.chapters.find((item) => item.id === chapterId) ?? null;
  }, [curriculumQuery.data?.chapters, chapterId]);

  if (!curriculumQuery.isLoading && curriculumQuery.data && !chapter) {
    return (
      <PageContainer>
        <AppState
          isEmpty={true}
          title="Unit Not Found"
          description="The requested learning unit framework is not available."
          icon={AlertCircle}
          fullScreen={false}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <AppQueryState
        query={curriculumQuery}
        loadingMessage="Loading unit details..."
        errorMessage="Failed to load unit details."
        onRetry={() => curriculumQuery.refetch()}
        fullScreen={false}
      >
        {(curriculum) => {
          if (!chapter) return null;
          const subtopics = (chapter.analyzedContent?.subtopics ?? []) as Subtopic[];

          return (
            <div className="space-y-5">
              {/* Top Header Breadcrumb: Unit Number Only */}
              <PageHeader
                title={`Unit ${chapter.chapterNumber}`}
                mobileTitle={`Unit ${chapter.chapterNumber}`}
                showLine={false}
                headerActions={
                  isTeacher ? (
                    <AppButton
                      size="sm"
                      isLoading={isCreatingTest}
                      onClick={() => {
                        setIsCreatingTest(true);
                        const query = new URLSearchParams({
                          chapterId,
                          subject: curriculum.subject || "",
                          classLevel: curriculum.class || "",
                          board: curriculum.board || "AKUEB",
                          title: `${chapter.chapterName} Alpha`,
                          paperType: "2",
                        });
                        router.push(
                          `${FRONTEND_ROUTES.TEACHER_CREATE_PAPER}?${query.toString()}`,
                        );
                      }}
                      className="h-9 rounded-xl px-3.5 text-xs font-bold shadow-xs transition-transform hover:scale-105"
                    >
                      <GenerateSVG className="size-4 mr-1.5 shrink-0" />
                      <span>Create Test for this Unit</span>
                    </AppButton>
                  ) : null
                }
              />

              {/* Mobile / Small Screens Button (< lg) */}
              {isTeacher && (
                <div className="lg:hidden">
                  <AppButton
                    isLoading={isCreatingTest}
                    onClick={() => {
                      setIsCreatingTest(true);
                      const query = new URLSearchParams({
                        chapterId,
                        subject: curriculum.subject || "",
                        classLevel: curriculum.class || "",
                        board: curriculum.board || "AKUEB",
                        title: `${chapter.chapterName} Alpha`,
                        paperType: "2",
                      });
                      router.push(
                        `${FRONTEND_ROUTES.TEACHER_CREATE_PAPER}?${query.toString()}`,
                      );
                    }}
                    className="w-full h-11 rounded-xl font-bold shadow-xs flex items-center justify-center gap-2"
                  >
                    <GenerateSVG className="size-4 shrink-0" />
                    <span>Create Test for this Unit</span>
                  </AppButton>
                </div>
              )}

              {/* Solved Exercises Section (Sindh Board / Exercise-based) */}
              {chapter.exercises && chapter.exercises.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-foreground sm:text-lg">
                        Exercises & Solved Notes
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Step-by-step solved textbook exercises, proofs, and working.
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      {chapter.exercises.length} {chapter.exercises.length === 1 ? "Exercise" : "Exercises"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {chapter.exercises.map((ex) => {
                      const displayTitle = getExerciseDisplayTitle(ex.exerciseNumber, ex.title, chapter.chapterName);
                      const watermark = getExerciseWatermark(ex.exerciseNumber);
                      const subtitle = curriculum.subject || "Mathematics";
                      return (
                        <QuestionBankBrowseCard
                          key={ex.id}
                          title={displayTitle}
                          board={curriculum.board || "Sindh Board"}
                          classLevel={curriculum.class || "X"}
                          subtitle={subtitle}
                          watermark={watermark}
                          subject={curriculum.subject || "Mathematics"}
                          buttonLabel="Open"
                          isLoading={openingExerciseId === ex.id}
                          onClick={() => {
                            setOpeningExerciseId(ex.id);
                            router.push(
                              FRONTEND_ROUTES.STUDENT_SOLVED_NOTES_EXERCISE(ex.id, curriculum.subject)
                            );
                          }}
                          dark
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SLO Table Section (AKUEB / SLO-based) */}
              {subtopics.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-foreground sm:text-lg">
                    Student Learning Outcomes (SLOs)
                  </h3>
                  <SLOTable
                    chapterNumber={chapter.chapterNumber}
                    chapterName={chapter.chapterName}
                    subtopics={subtopics}
                    isEditMode={false}
                  />
                </div>
              )}

              {/* Empty state when neither exercises nor SLOs are available */}
              {(!chapter.exercises || chapter.exercises.length === 0) && subtopics.length === 0 && (
                <AppState
                  isEmpty={true}
                  title="Content Being Prepared"
                  description="This unit's learning framework and solved notes are currently being processed."
                  icon={BookOpen}
                  fullScreen={false}
                />
              )}
            </div>
          );
        }}
      </AppQueryState>
    </PageContainer>
  );
}
