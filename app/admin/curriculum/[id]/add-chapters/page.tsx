"use client";

import AddSVG from "@/public/svgs/AddSVG";

import { Typography } from "@/components/ui/Typography";
import { useRouter, useParams } from "next/navigation";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import AppButton from "@/components/AppButton";
import AppLabel from "@/components/AppLabel";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppState from "@/components/AppState";
import AppQueryState from "@/components/AppQueryState";
import { Loader2, CheckCircle2, X, BookOpen, Quote, Sparkles, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  useAdminCurriculumDetail,
  useAdminCurriculumChapters,
  useAddAdminCurriculumChapter,
} from "@/hooks/admin/useAdminCurriculumDetail";

export default function AddChaptersPage() {
  const router = useRouter();
  const params = useParams();
  const curriculumId = params?.id as string;

  const curriculumQuery = useAdminCurriculumDetail(curriculumId);
  const chaptersQuery = useAdminCurriculumChapters(curriculumId);
  const addChapterMutation = useAddAdminCurriculumChapter(curriculumId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    chapterNumber: "",
    chapterName: "",
    content: "",
  });

  const chapters = chaptersQuery.data ?? [];
  const curriculum = curriculumQuery.data ?? null;

  useEffect(() => {
    if (chapters.length > 0 && !showAddForm) {
      const maxChapterNumber = Math.max(...chapters.map((ch) => ch.chapterNumber || 0));
      setFormData((prev) => ({
        ...prev,
        chapterNumber: String(maxChapterNumber + 1),
      }));
    } else if (chapters.length === 0 && !showAddForm) {
      setFormData((prev) => ({
        ...prev,
        chapterNumber: "1",
      }));
    }
  }, [chapters, showAddForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.chapterNumber || !formData.chapterName) {
      toast.error("Please fill in chapter number and name");
      return;
    }

    if (!formData.content.trim()) {
      toast.error("Please provide chapter SLOs content");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("chapterNumber", formData.chapterNumber);
    formDataToSend.append("chapterName", formData.chapterName);
    formDataToSend.append("content", formData.content);

    try {
      await addChapterMutation.mutateAsync(formDataToSend);
      toast.success("Chapter added successfully");
      setFormData({ chapterNumber: "", chapterName: "", content: "" });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding chapter:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add chapter");
    }
  };

  const isLoading = curriculumQuery.isLoading || chaptersQuery.isLoading;

  return (
    <PageContainer>
      <PageHeader
        title="Curriculum Expansion"
        onBack={() => router.push(FRONTEND_ROUTES.ADMIN_CURRICULUM_DETAIL(curriculumId))}
      />

      <AppQueryState
        query={{
          ...curriculumQuery,
          isLoading,
          data: curriculum,
        }}
        isEmpty={(data) => !data}
        emptyTitle="Curriculum Not Found"
        errorMessage="Failed to load curriculum"
        onRetry={() => {
          void curriculumQuery.refetch();
          void chaptersQuery.refetch();
        }}
        fullScreen={false}
      >
        {() => (
          <div className="space-y-12">
            <div
              className={cn(
                "overflow-hidden rounded-[3rem] border border-border/60 bg-card shadow-2xl shadow-foreground/[0.02] transition-all duration-700",
                { "border-primary/30 shadow-primary/5": showAddForm },
              )}
            >
              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="group relative flex w-full flex-col items-center justify-center gap-4 p-12 transition-all hover:bg-muted/30"
                >
                  <div className="absolute -mr-6 -mt-6 right-0 top-0 p-10 opacity-10 transition-all duration-700 group-hover:opacity-20">
                    <Sparkles className="h-32 w-32 rotate-12 text-primary" />
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
                    <AddSVG className="h-8 w-8" />
                  </div>
                  <div className="relative z-10 text-center">
                    <Typography variant="h3" className="mb-1 text-2xl font-black tracking-tight">
                      Inject New Unit
                    </Typography>
                    <Typography variant="muted" className="text-sm font-medium">
                      Expand your curriculum architecture with AI-analyzed SLOs.
                    </Typography>
                  </div>
                </button>
              ) : (
                <div className="animate-in space-y-8 p-8 fade-in zoom-in-95 duration-500 sm:p-12">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <Typography variant="h3" className="text-2xl font-black tracking-tight">
                          Technical Entry
                        </Typography>
                      </div>
                      <Typography variant="muted" className="text-sm font-medium">
                        Define metadata and paste SLOs for AI digestion.
                      </Typography>
                    </div>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setFormData({ chapterNumber: "", chapterName: "", content: "" });
                      }}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground transition-all duration-300 hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
                      <div className="sm:col-span-1">
                        <AppLabel
                          htmlFor="chapter-number"
                          required
                          className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                        >
                          Index
                        </AppLabel>
                        <input
                          id="chapter-number"
                          type="number"
                          value={formData.chapterNumber}
                          onChange={(e) =>
                            setFormData({ ...formData, chapterNumber: e.target.value })
                          }
                          required
                          min="1"
                          className="h-14 w-full rounded-2xl border border-border/60 bg-background px-6 text-lg font-bold shadow-inner transition-all focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <AppLabel
                          htmlFor="chapter-name"
                          required
                          className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                        >
                          Descriptive Name
                        </AppLabel>
                        <input
                          id="chapter-name"
                          value={formData.chapterName}
                          onChange={(e) =>
                            setFormData({ ...formData, chapterName: e.target.value })
                          }
                          placeholder="e.g., Cellular Dynamics & Molecular Genetics"
                          required
                          className="h-14 w-full rounded-2xl border border-border/60 bg-background px-6 text-lg font-bold shadow-inner transition-all focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <AppLabel
                          required
                          className="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                        >
                          Detailed SLOs Content
                        </AppLabel>
                        <div className="flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-primary">
                          <Quote className="h-3 w-3" />
                          <span className="text-[9px] font-black uppercase tracking-widest">
                            Plain Text Vector
                          </span>
                        </div>
                      </div>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="h-64 w-full resize-none rounded-[2rem] border border-border/60 bg-background p-6 font-medium leading-relaxed text-foreground shadow-inner transition-all placeholder:text-muted-foreground/30 focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
                        placeholder="Paste the chapter SLOs here..."
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-4 pt-2 sm:flex-row">
                      <AppButton
                        type="submit"
                        variant="default"
                        disabled={addChapterMutation.isPending}
                        className="h-14 flex-1 rounded-2xl text-base font-black shadow-xl shadow-primary/20 transition-all hover:shadow-primary/30"
                      >
                        {addChapterMutation.isPending ? (
                          <>
                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                            Synthesizing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-3 h-5 w-5" />
                            Finalize Unit
                          </>
                        )}
                      </AppButton>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setFormData({ chapterNumber: "", chapterName: "", content: "" });
                        }}
                        className="h-14 rounded-2xl bg-muted/50 px-8 font-bold text-muted-foreground transition-all hover:bg-muted"
                      >
                        Abort
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-1.5 rounded-full bg-primary" />
                  <Typography variant="h3" className="text-2xl font-black tracking-tight">
                    Active Inventory
                  </Typography>
                </div>
                <div className="rounded-full border border-primary/10 bg-primary/5 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-primary">
                  {chapters.length} Digital Assets
                </div>
              </div>

              <AppState
                isEmpty={chapters.length === 0}
                title="Inventory Empty"
                description="No units found in the digital vault. Use the portal above to begin ingestion."
                icon={BookOpen}
                fullScreen={false}
              >
                <div className="grid grid-cols-1 gap-4">
                  {chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="group relative flex items-center gap-6 overflow-hidden rounded-[2rem] border border-border/60 bg-card p-6 transition-all duration-500 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5"
                    >
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] bg-muted/50 text-xl font-black text-foreground shadow-inner transition-all duration-500 group-hover:rotate-6 group-hover:bg-primary group-hover:text-primary-foreground">
                        {chapter.chapterNumber}
                      </div>

                      <div className="min-w-0 flex-1">
                        <Typography
                          variant="h4"
                          className="truncate text-xl font-black tracking-tight transition-colors group-hover:text-primary"
                        >
                          {chapter.chapterName}
                        </Typography>
                        <div className="mt-1.5 flex items-center gap-3">
                          {chapter.isAnalyzed ? (
                            <span className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-primary">
                              <CheckCircle2 className="h-3 w-3" />
                              AI Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-xl border border-amber-500/10 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-amber-600">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Digesting
                            </span>
                          )}
                          <div className="h-1 w-1 rounded-full bg-border" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Metadata Available
                          </span>
                        </div>
                      </div>

                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30 transition-colors group-hover:bg-primary/10">
                        <ChevronRight className="h-5 w-5 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                    </div>
                  ))}
                </div>
              </AppState>
            </div>
          </div>
        )}
      </AppQueryState>
    </PageContainer>
  );
}
