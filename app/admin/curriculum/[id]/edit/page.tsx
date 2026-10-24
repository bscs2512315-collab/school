"use client";

import AddSVG from "@/public/svgs/AddSVG";

import PageContainer from "@/components/PageContainer";
import { Typography } from "@/components/ui/Typography";
import { useRouter, useParams } from "next/navigation";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import AppButton from "@/components/AppButton";
import AppLabel from "@/components/AppLabel";
import PageHeader from "@/components/PageHeader";
import { Loader2, X, Save, BookOpen, Layers } from "lucide-react";
import AppQueryState from "@/components/AppQueryState";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  useAdminCurriculumDetail,
  useSaveAdminCurriculumChapters,
  type EditableChapter,
} from "@/hooks/admin/useAdminCurriculumDetail";

export default function EditCurriculumPage() {
  const router = useRouter();
  const params = useParams();
  const curriculumId = params.id as string;

  const curriculumQuery = useAdminCurriculumDetail(curriculumId);
  const saveMutation = useSaveAdminCurriculumChapters();

  const [chapters, setChapters] = useState<EditableChapter[]>([]);

  useEffect(() => {
    if (curriculumQuery.data?.chapters) {
      setChapters(
        curriculumQuery.data.chapters.map((ch) => ({
          id: ch.id,
          chapterNumber: ch.chapterNumber,
          chapterName: ch.chapterName,
        })),
      );
    }
  }, [curriculumQuery.data]);

  const curriculum = curriculumQuery.data
    ? {
        class: curriculumQuery.data.class,
        board: curriculumQuery.data.board,
        subject: curriculumQuery.data.subject,
      }
    : null;

  const handleChapterChange = (index: number, field: keyof EditableChapter, value: string | number) => {
    const updated = [...chapters];
    updated[index] = { ...updated[index], [field]: value };
    setChapters(updated);
  };

  const addChapter = () => {
    const nextNumber =
      chapters.length > 0 ? Math.max(...chapters.map((ch) => ch.chapterNumber)) + 1 : 1;
    setChapters([
      ...chapters,
      { id: `temp-${Date.now()}`, chapterNumber: nextNumber, chapterName: "" },
    ]);
  };

  const removeChapter = (index: number) => {
    setChapters(chapters.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!curriculum) {
      return;
    }

    for (const chapter of chapters) {
      if (!chapter.chapterName.trim()) {
        toast.error("All chapters must have a name");
        return;
      }
    }

    try {
      await saveMutation.mutateAsync({ curriculumId, chapters });
      toast.success("Curriculum updated successfully");
      router.push(FRONTEND_ROUTES.ADMIN_CURRICULUM_DETAIL(curriculumId));
    } catch (error) {
      console.error("Error saving curriculum:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save curriculum");
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Refine Curriculum"
        onBack={() => router.push(FRONTEND_ROUTES.ADMIN_CURRICULUM_DETAIL(curriculumId))}
      />

      <AppQueryState
        query={curriculumQuery}
        isEmpty={(data) => !data}
        emptyTitle="Curriculum Not Found"
        errorMessage="Failed to load curriculum"
        onRetry={() => curriculumQuery.refetch()}
        fullScreen={false}
      >
        {() => (
          <div className="space-y-6 sm:space-y-10">
            <div className="rounded-3xl sm:rounded-[2.5rem] border border-border/60 bg-card shadow-2xl shadow-foreground/2">
              <div className="space-y-6 sm:space-y-8 p-4 sm:p-8 md:p-10">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="space-y-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Layers className="h-5 w-5 text-primary" />
                      <Typography variant="h3" className="text-xl sm:text-2xl font-black tracking-tight">
                        Chapter Matrix
                      </Typography>
                    </div>
                    <Typography variant="muted" className="text-xs sm:text-sm font-medium">
                      Manage the logical flow and nomenclature of academic units.
                    </Typography>
                  </div>
                  <AppButton
                    type="button"
                    variant="default"
                    onClick={addChapter}
                    className="h-11 sm:h-14 rounded-xl sm:rounded-2xl px-4 sm:px-8 text-xs sm:text-base font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 w-full sm:w-auto"
                  >
                    <AddSVG className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                    Expand Framework
                  </AppButton>
                </div>

                <div className="h-px bg-linear-to-r from-transparent via-border/50 to-transparent" />

                <div className="space-y-4">
                  {chapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      className="group relative animate-in rounded-2xl sm:rounded-4xl border border-border/40 bg-muted/20 p-4 sm:p-7 fade-in slide-in-from-bottom-4 transition-all duration-300 hover:border-primary/20 hover:bg-muted/40"
                    >
                      <div className="mb-4 sm:mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-primary text-xs sm:text-sm font-black text-primary-foreground shadow-lg shadow-primary/20">
                            {index + 1}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                            Unit Index
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeChapter(index)}
                          className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl border border-border/50 bg-background text-muted-foreground shadow-sm transition-all duration-300 hover:border-red-500 hover:bg-red-500 hover:text-background"
                          title="Remove Unit"
                        >
                          <X className="h-4 sm:h-5 w-4 sm:w-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-4">
                        <div className="sm:col-span-1">
                          <AppLabel
                            htmlFor={`chapter-number-${index}`}
                            className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                          >
                            Serial
                          </AppLabel>
                          <input
                            id={`chapter-number-${index}`}
                            type="number"
                            value={chapter.chapterNumber}
                            onChange={(e) =>
                              handleChapterChange(index, "chapterNumber", parseInt(e.target.value) || 1)
                            }
                            min="1"
                            className="h-11 sm:h-12 w-full rounded-xl border border-border/60 bg-background px-4 font-bold text-foreground shadow-inner transition-all focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <AppLabel
                            htmlFor={`chapter-name-${index}`}
                            className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                          >
                            Unit Designation
                          </AppLabel>
                          <input
                            id={`chapter-name-${index}`}
                            value={chapter.chapterName}
                            onChange={(e) => handleChapterChange(index, "chapterName", e.target.value)}
                            placeholder="e.g., Matrix Transformations & Linear Algebra"
                            className="h-11 sm:h-12 w-full rounded-xl border border-border/60 bg-background px-4 font-bold text-foreground shadow-inner transition-all focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {chapters.length === 0 ? (
                    <div className="rounded-2xl sm:rounded-[2.5rem] border-2 border-dashed border-border/40 bg-muted/5 py-16 sm:py-20 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl sm:rounded-3xl bg-muted">
                        <BookOpen className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" />
                      </div>
                      <Typography variant="h4" className="mb-1 text-base sm:text-lg font-bold">
                        Architecture is empty
                      </Typography>
                      <Typography variant="muted" className="text-xs sm:text-sm font-medium">
                        Click &quot;Expand Framework&quot; to define your curriculum units.
                      </Typography>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 px-2">
              <AppButton
                type="button"
                variant="outline"
                size="lg"
                className="h-12 sm:h-14 rounded-xl sm:rounded-2xl border-border/60 px-6 sm:px-10 text-sm sm:text-base font-bold transition-all hover:bg-muted w-full sm:w-auto"
                onClick={() => router.push(FRONTEND_ROUTES.ADMIN_CURRICULUM_DETAIL(curriculumId))}
                disabled={saveMutation.isPending}
              >
                Discard
              </AppButton>
              <AppButton
                type="button"
                variant="default"
                size="lg"
                className="h-12 sm:h-14 rounded-xl sm:rounded-2xl px-6 sm:px-12 text-sm sm:text-base font-bold shadow-xl shadow-primary/20 transition-all hover:shadow-primary/30 w-full sm:w-auto"
                onClick={handleSave}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 sm:mr-3 h-4 sm:h-5 w-4 sm:w-5 animate-spin" />
                    Synchronizing...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 sm:mr-3 h-4 sm:h-5 w-4 sm:w-5" />
                    Commit Changes
                  </>
                )}
              </AppButton>
            </div>
          </div>
        )}
      </AppQueryState>
    </PageContainer>
  );
}
