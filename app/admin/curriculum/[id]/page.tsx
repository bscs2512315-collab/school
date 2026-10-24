"use client";

import PageContainer from "@/components/PageContainer";
import { Typography } from "@/components/ui/Typography";
import { useRouter, useParams } from "next/navigation";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import AppButton from "@/components/AppButton";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import AppState from "@/components/AppState";
import AppQueryState from "@/components/AppQueryState";
import UnitCard from "@/components/UnitCard";
import { BookOpen, Edit, Loader2, Layers, BookCheck, Sparkles, Save, X } from "lucide-react";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import AddSVG from "@/public/svgs/AddSVG";
import SLOTable from "@/components/SLOTable";
import {
  useAdminCurriculumDetail,
  useSaveSyllabus,
  type AdminCurriculumDetail,
  type AdminCurriculumChapter,
} from "@/hooks/admin/useAdminCurriculumDetail";

export default function CurriculumDetailPage() {
  const router = useRouter();
  const params = useParams();
  const curriculumId = params?.id as string;
  const curriculumQuery = useAdminCurriculumDetail(curriculumId);
  const saveSyllabusMutation = useSaveSyllabus();

  const [curriculumDraft, setCurriculumDraft] = useState<AdminCurriculumDetail | null>(null);
  const [isModifyMode, setIsModifyMode] = useState(false);

  useEffect(() => {
    if (!isModifyMode) {
      setCurriculumDraft(null);
    }
  }, [isModifyMode, curriculumQuery.data]);

  const curriculum = isModifyMode ? curriculumDraft : curriculumQuery.data;

  const enterModifyMode = () => {
    if (!curriculumQuery.data) return;
    setCurriculumDraft(structuredClone(curriculumQuery.data));
    setIsModifyMode(true);
  };

  const updateCurriculum = (nextCurriculum: AdminCurriculumDetail) => {
    setCurriculumDraft(nextCurriculum);
  };

  const handleSaveSyllabus = async () => {
    if (!curriculumDraft) return;

    try {
      await saveSyllabusMutation.mutateAsync({
        classLevel: curriculumDraft.class,
        board: curriculumDraft.board,
        subject: curriculumDraft.subject,
        chapters: curriculumDraft.chapters.map((chapter) => ({
          chapterNumber: chapter.chapterNumber,
          chapterName: chapter.chapterName,
          subtopics:
            typeof chapter.analyzed_content === "string"
              ? JSON.parse(chapter.analyzed_content).subtopics
              : chapter.analyzedContent?.subtopics ||
                (chapter.analyzed_content as { subtopics?: unknown[] })?.subtopics ||
                [],
        })),
      });
      toast.success("Syllabus updated successfully");
      setIsModifyMode(false);
      void curriculumQuery.refetch();
    } catch {
      toast.error("Failed to update syllabus");
    }
  };

  const getChapterSubtopics = (chapter: AdminCurriculumChapter) => {
    if (typeof chapter.analyzed_content === "string") {
      return JSON.parse(chapter.analyzed_content).subtopics;
    }
    return (
      chapter.analyzedContent?.subtopics ||
      (chapter.analyzed_content as { subtopics?: unknown[] })?.subtopics ||
      []
    );
  };

  return (
    <PageContainer className="print:p-0">
      <AppQueryState
        query={curriculumQuery}
        loadingMessage="Loading curriculum..."
        errorMessage="Failed to load curriculum."
        onRetry={() => curriculumQuery.refetch()}
        fullScreen={false}
      >
        {(loadedCurriculum) => {
          const activeCurriculum = curriculum ?? loadedCurriculum;

          return (
            <div className="animate-in fade-in duration-500">
              <PageHeader
                title={activeCurriculum.subject}
                className="print:hidden"
                actions={
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {!isModifyMode ? (
                      <>
                        <AppButton
                          variant="default"
                          className="h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-primary px-4 sm:px-6 md:px-8 text-xs sm:text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90"
                          onClick={() => router.push(FRONTEND_ROUTES.ADMIN_CURRICULUM_SLOS(curriculumId))}
                        >
                          <BookCheck className="mr-1.5 sm:mr-2 size-4 sm:size-5" />
                          View SLOs
                        </AppButton>
                        <AppButton
                          variant="default"
                          className="h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-primary px-4 sm:px-6 md:px-8 text-xs sm:text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90"
                          onClick={enterModifyMode}
                        >
                          <Sparkles className="mr-1.5 sm:mr-2 size-4 sm:size-5" />
                          Modify SLO&apos;s
                        </AppButton>
                        <AppButton
                          variant="outline"
                          className="h-10 sm:h-12 rounded-xl sm:rounded-2xl border-border/60 px-4 sm:px-6 md:px-8 text-xs sm:text-sm font-bold hover:bg-muted"
                          onClick={() => router.push(FRONTEND_ROUTES.ADMIN_CURRICULUM_EDIT(curriculumId))}
                        >
                          <Edit className="mr-1.5 sm:mr-2 size-4 sm:size-5" />
                          Modify Chapters
                        </AppButton>
                      </>
                    ) : (
                      <>
                        <AppButton
                          variant="default"
                          className="h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-primary px-4 sm:px-6 md:px-8 text-xs sm:text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90"
                          onClick={() => void handleSaveSyllabus()}
                          disabled={saveSyllabusMutation.isPending}
                        >
                          {saveSyllabusMutation.isPending ? (
                            <Loader2 className="size-4 sm:size-5 animate-spin" />
                          ) : (
                            <Save className="mr-1.5 sm:mr-2 size-4 sm:size-5" />
                          )}
                          Save Changes
                        </AppButton>
                        <AppButton
                          variant="outline"
                          className="h-10 sm:h-12 rounded-xl sm:rounded-2xl border-border/60 px-4 sm:px-6 md:px-8 text-xs sm:text-sm font-bold hover:bg-muted"
                          onClick={() => setIsModifyMode(false)}
                        >
                          <X className="mr-1.5 sm:mr-2 size-4 sm:size-5" />
                          Cancel
                        </AppButton>
                      </>
                    )}
                  </div>
                }
              />

              <div className="mt-6 sm:mt-10 space-y-6 sm:space-y-10">
                <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
                  <div className="flex items-center gap-4 sm:gap-5 rounded-3xl sm:rounded-4xl border border-border/60 bg-card p-5 sm:p-8 shadow-xl shadow-foreground/2">
                    <div className="flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Layers className="size-6 sm:size-7" />
                    </div>
                    <div>
                      <Typography variant="muted" className="mb-1 block text-[10px] font-black uppercase tracking-widest">
                        Architecture
                      </Typography>
                      <Typography className="text-lg sm:text-xl font-black">{activeCurriculum.chaptersCount} Units</Typography>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-5 rounded-3xl sm:rounded-4xl border border-border/60 bg-card p-5 sm:p-8 shadow-xl shadow-foreground/2">
                    <div className="flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                      <BookOpen className="size-6 sm:size-7" />
                    </div>
                    <div>
                      <Typography variant="muted" className="mb-1 block text-[10px] font-black uppercase tracking-widest">
                        Board
                      </Typography>
                      <Typography className="max-w-[150px] truncate text-lg sm:text-xl font-black">
                        {activeCurriculum.board}
                      </Typography>
                    </div>
                  </div>
                </div>

                {!isModifyMode ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                      <div className="h-6 w-1.5 rounded-full bg-primary" />
                      <Typography variant="h3" className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                        Select Unit to view its SLOs
                      </Typography>
                    </div>

                    <AppState
                      isEmpty={!activeCurriculum.chapters || activeCurriculum.chapters.length === 0}
                      title="Inventory Empty"
                      description="No academic units have been registered for this framework yet."
                      icon={BookOpen}
                      action={{
                        label: "Build Framework Units",
                        onClick: () => router.push(FRONTEND_ROUTES.ADMIN_CURRICULUM_ADD_CHAPTERS(curriculumId)),
                      }}
                      fullScreen={false}
                    >
                      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {activeCurriculum.chapters?.map((chapter) => (
                          <div key={chapter.id} className="animate-in fade-in duration-500">
                            <UnitCard
                              chapterNumber={chapter.chapterNumber}
                              chapterName={chapter.chapterName}
                              onViewSLOs={() => {
                                router.push(FRONTEND_ROUTES.ADMIN_CURRICULUM_CHAPTER(curriculumId, chapter.id));
                              }}
                              onClick={() => {
                                router.push(FRONTEND_ROUTES.ADMIN_CURRICULUM_CHAPTER(curriculumId, chapter.id));
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </AppState>
                  </div>
                ) : null}

                {isModifyMode && curriculumDraft ? (
                  <div className="space-y-8 sm:space-y-12">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-1.5 rounded-full bg-primary" />
                        <Typography variant="h3" className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                          Syllabus Orchestrator
                        </Typography>
                      </div>
                      <AppButton
                        variant="outline"
                        className="rounded-xl border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-background w-fit"
                        onClick={() => {
                          const newChapter: AdminCurriculumChapter = {
                            id: `new-${Date.now()}`,
                            chapterNumber: curriculumDraft.chapters.length + 1,
                            chapterName: "New Chapter Title",
                            content: "",
                            contentType: "text",
                            isAnalyzed: true,
                            analyzed_content: { subtopics: [] },
                          };
                          updateCurriculum({
                            ...curriculumDraft,
                            chapters: [...curriculumDraft.chapters, newChapter],
                          });
                        }}
                      >
                        <AddSVG className="mr-2 size-3.5" />
                        Add New Unit
                      </AppButton>
                    </div>
                    <div className="space-y-12 sm:space-y-20">
                      {curriculumDraft.chapters.map((chapter) => (
                        <div key={chapter.id} className="group/chapter relative">
                          <SLOTable
                            chapterNumber={chapter.chapterNumber}
                            chapterName={chapter.chapterName}
                            subtopics={getChapterSubtopics(chapter)}
                            isEditMode={true}
                            onSave={(updated) => {
                              const nextChapters = curriculumDraft.chapters.map((item) =>
                                item.id === chapter.id
                                   ? {
                                      ...item,
                                      analyzed_content: {
                                        ...(typeof item.analyzed_content === "object"
                                          ? item.analyzed_content
                                          : {}),
                                        subtopics: updated,
                                      },
                                    }
                                  : item,
                              );
                              updateCurriculum({ ...curriculumDraft, chapters: nextChapters });
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              updateCurriculum({
                                ...curriculumDraft,
                                chapters: curriculumDraft.chapters.filter((item) => item.id !== chapter.id),
                              });
                            }}
                            className="absolute -right-2 -top-2 sm:-right-4 sm:-top-4 z-10 flex size-9 sm:size-10 items-center justify-center rounded-full bg-destructive text-background shadow-xl transition-opacity hover:scale-110 active:scale-95 sm:opacity-0 sm:group-hover/chapter:opacity-100"
                          >
                            <DeleteSVG className="size-4 sm:size-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        }}
      </AppQueryState>
    </PageContainer>
  );
}
