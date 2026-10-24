"use client";

import AddSVG from "@/public/svgs/AddSVG";

import { Typography } from "@/components/ui/Typography";
import { useRouter } from "next/navigation";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import AppInput from "@/components/AppInput";
import AppButton from "@/components/AppButton";
import AppLabel from "@/components/AppLabel";
import AppDropdown from "@/components/AppDropdown";
import AppIconButton from "@/components/AppIconButton";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { Class, Board, Subject } from "@/types/enums";
import { useSubjectOptions } from "@/hooks/subjects/useSubjects";
import toast from "react-hot-toast";
import { useCreateAdminCurriculum } from "@/hooks/admin/useAdminCurriculumDetail";

interface ChapterForm {
  chapterNumber: string;
  chapterName: string;
}

export default function CreateCurriculumPage() {
  const router = useRouter();
  const subjectOptions = useSubjectOptions(Object.values(Subject));
  const [formData, setFormData] = useState({
    class: "" as Class | "",
    board: "" as Board | "",
    subject: "" as Subject | "",
  });
  const [chapters, setChapters] = useState<ChapterForm[]>([
    { chapterNumber: "1", chapterName: "" },
  ]);
  const createMutation = useCreateAdminCurriculum();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleChapterChange = (index: number, field: keyof ChapterForm, value: string) => {
    const updatedChapters = [...chapters];
    updatedChapters[index] = { ...updatedChapters[index], [field]: value };
    setChapters(updatedChapters);
  };

  const addChapter = () => {
    const nextChapterNumber = chapters.length + 1;
    setChapters([...chapters, { chapterNumber: String(nextChapterNumber), chapterName: "" }]);
  };

  const removeChapter = (index: number) => {
    if (chapters.length > 1) {
      const updatedChapters = chapters.filter((_, i) => i !== index);
      // Renumber chapters
      const renumbered = updatedChapters.map((ch, i) => ({
        ...ch,
        chapterNumber: String(i + 1),
      }));
      setChapters(renumbered);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.class || !formData.board || !formData.subject) {
      toast.error("Please fill all fields");
      return;
    }

    // Validate chapters
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      if (!chapter.chapterName.trim()) {
        toast.error(`Please enter chapter name for Chapter ${i + 1}`);
        return;
      }
    }

    try {
      const payload = {
        ...formData,
        chapters: chapters.map((ch) => ({
          chapterNumber: parseInt(ch.chapterNumber, 10),
          chapterName: ch.chapterName.trim(),
        })),
      };

      await createMutation.mutateAsync(payload);
      toast.success("Curriculum created successfully with chapters");
      router.push(FRONTEND_ROUTES.ADMIN_CURRICULUMS);
    } catch (error) {
      console.error("Error creating curriculum:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create curriculum");
    }
  };

  // ... Inside CreateCurriculumPage component
  return (
    <PageContainer>
      <PageHeader
        title="Create New Curriculum"
        onBack={() => router.push(FRONTEND_ROUTES.ADMIN_CURRICULUMS)}
      />

      {/* Form */}
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-12">
        <div className="p-2 sm:p-4 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <AppLabel htmlFor="class" required className="text-xs font-black uppercase tracking-widest ml-1 text-muted-foreground/80">
                Class Level
              </AppLabel>
              <AppDropdown
                id="class"
                name="class"
                value={formData.class}
                onChange={handleChange}
                placeholder="Select Class"
                options={Object.values(Class).map((cls) => ({ value: cls, label: cls }))}
                className="h-14 px-6 text-base rounded-2xl bg-card border-border/40 focus-visible:ring-primary/10 shadow-sm transition-all"
                required
              />
            </div>

            <div className="space-y-3">
              <AppLabel htmlFor="board" required className="text-xs font-black uppercase tracking-widest ml-1 text-muted-foreground/80">
                Examination Board
              </AppLabel>
              <AppDropdown
                id="board"
                name="board"
                value={formData.board}
                onChange={handleChange}
                placeholder="Select Board"
                options={Object.values(Board).map((board) => ({ value: board, label: board }))}
                className="h-14 px-6 text-base rounded-2xl bg-card border-border/40 focus-visible:ring-primary/10 shadow-sm transition-all"
                required
              />
            </div>

            <div className="space-y-3">
              <AppLabel htmlFor="subject" required className="text-xs font-black uppercase tracking-widest ml-1 text-muted-foreground/80">
                Subject Area
              </AppLabel>
              <AppDropdown
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Select Subject"
                options={subjectOptions}
                className="h-14 px-6 text-base rounded-2xl bg-card border-border/40 focus-visible:ring-primary/10 shadow-sm transition-all"
                required
              />
            </div>
          </div>
        </div>

        {/* Chapters Section */}
        <div className="space-y-10">
          <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-6 px-4">
            <div className="space-y-2">
              <Typography variant="h3" className="text-2xl font-black tracking-tight flex items-center gap-3">
                Curriculum Units
                <span className="text-[10px] mb-2 px-3 py-1 bg-primary/5 text-primary rounded-full font-black uppercase tracking-widest border border-primary/10">
                  {chapters.length} Sequenced
                </span>
              </Typography>
              <Typography variant="muted" className="text-sm font-medium">
                Define the structural hierarchy and individual units of this curriculum.
              </Typography>
            </div>
            <AppButton
              type="button"
              variant="secondary"
              size="lg"
              onClick={addChapter}
              className="w-full sm:w-auto h-12 px-6 rounded-xl font-bold border-border hover:bg-muted"
            >
              <AddSVG className="mr-2 h-5 w-5" />
              Expand Structure
            </AppButton>
          </div>

          <div className="grid grid-cols-1 gap-4 px-4">
            {chapters.map((chapter, index) => (
              <div
                key={index}
                className="group flex flex-col sm:flex-row items-start gap-6 py-6 border-b border-border/40 last:border-0 transition-all duration-300"
              >
                <div className="bg-primary/5 text-primary h-12 w-12 rounded-2xl flex items-center justify-center font-black text-sm border border-primary/10 group-hover:bg-primary/10 transition-colors shrink-0">
                  {index + 1}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 flex-1 w-full">
                  <div className="sm:col-span-1">
                    <AppInput
                      id={`chapter-number-${index}`}
                      type="number"
                      value={chapter.chapterNumber}
                      onChange={(e) => handleChapterChange(index, "chapterNumber", e.target.value)}
                      required
                      min="1"
                      className="h-12 rounded-xl border-border/40 bg-card/50 focus-visible:ring-primary/5 shadow-inner"
                      placeholder="No."
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <AppInput
                      id={`chapter-name-${index}`}
                      value={chapter.chapterName}
                      onChange={(e) => handleChapterChange(index, "chapterName", e.target.value)}
                      placeholder="e.g., Quantum Mechanics & Atomic Theory"
                      required
                      className="h-12 rounded-xl border-border/40 bg-card/50 focus-visible:ring-primary/5 shadow-inner"
                    />
                  </div>
                </div>

                {chapters.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeChapter(index)}
                    className="p-3 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-xl transition-all duration-300 shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 py-12 border-t border-border/40">
          <AppButton
            type="submit"
            variant="default"
            size="lg"
            className="w-full h-16 text-lg font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                Processing Framework...
              </>
            ) : (
              "Initialize Curriculum"
            )}
          </AppButton>
        </div>
      </form>
    </PageContainer>
  );
}

