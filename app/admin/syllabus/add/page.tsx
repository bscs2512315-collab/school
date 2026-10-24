"use client";

import React, { useState } from "react";
import { Typography } from "@/components/ui/Typography";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppLabel from "@/components/AppLabel";
import AppDropdown from "@/components/AppDropdown";
import AppButton from "@/components/AppButton";
import AppState from "@/components/AppState";
import { Class, Board, Subject } from "@/types/enums";
import { useSubjectOptions } from "@/hooks/subjects/useSubjects";
import {
  Sparkles,
  Loader2,
  Save,
  FileText,
  CheckCircle2,
  Globe,
  UploadCloud,
  FileCode,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import SLOTable from "@/components/SLOTable";
import { useAutoExtractSyllabus, type AutoExtractSyllabusResponse } from "@/hooks/admin/useAdminUploads";
import type { Subtopic } from "@/lib/utils/syllabus-parser";
import { cn } from "@/lib/utils";

const OFFICIAL_AKUEB_PRESETS = [
  {
    label: "Mathematics (Science Group) SSC (Class IX & X)",
    subject: "Mathematics",
    classHint: "",
    url: "https://examinationboard.aku.edu/about-us/SyllabiList/Mathematics%20(Science%20Group)%20SSC%20Syllabus%20Final.pdf",
  },
  {
    label: "Mathematics HSSC I (Class XI)",
    subject: "Mathematics",
    classHint: "XI",
    url: "https://examinationboard.aku.edu/about-us/SyllabiList/Mathematics%20HSSC%20I%20Syllabus%202025_.pdf",
  },
  {
    label: "Pakistan Studies SSC (Class X)",
    subject: "Pakistan Studies",
    classHint: "X",
    url: "https://examinationboard.aku.edu/about-us/SyllabiList/Pakistan%20Studies%20SSC%20Syllabus%202025.pdf",
  },
  {
    label: "Pakistan Studies HSSC (Class XII)",
    subject: "Pakistan Studies",
    classHint: "XII",
    url: "https://examinationboard.aku.edu/about-us/SyllabiList/Pakistan%20Studies%20HSSC%20Syllabus%202025.pdf",
  },
  {
    label: "English Compulsory SSC (Class IX & X)",
    subject: "English",
    classHint: "",
    url: "https://examinationboard.aku.edu/about-us/SyllabiList/English%20Compulsory%20SSC%20Syllabus%20Final.pdf",
  },
  {
    label: "English Compulsory HSSC (Class XI & XII)",
    subject: "English",
    classHint: "",
    url: "https://examinationboard.aku.edu/about-us/SyllabiList/English%20Compulsory%20HSSC%20Syllabus%20Final.pdf",
  },
  {
    label: "Computer Science SSC (Class IX & X)",
    subject: "Computer Science",
    classHint: "",
    url: "https://examinationboard.aku.edu/about-us/SyllabiList/Computer%20Science%20SSC%20Syllabus%202025.pdf",
  },
  {
    label: "Computer Science HSSC (Class XI & XII)",
    subject: "Computer Science",
    classHint: "",
    url: "https://examinationboard.aku.edu/about-us/SyllabiList/Computer%20Science%20HSSC%20Syllabus%202025.pdf",
  },
  {
    label: "Urdu Compulsory SSC (Class IX & X)",
    subject: "Urdu",
    classHint: "",
    url: "https://examinationboard.aku.edu/about-us/SyllabiList/Urdu%20Compulsory%20SSC%20Syllabus%202025.pdf",
  },
  {
    label: "Urdu Compulsory HSSC (Class XI & XII)",
    subject: "Urdu",
    classHint: "",
    url: "https://examinationboard.aku.edu/about-us/SyllabiList/Urdu%20Compulsory%20HSSC%20Syllabus%202025.pdf",
  },
  {
    label: "Islamiyat SSC-Urdu (Class IX & X)",
    subject: "Islamiat",
    classHint: "",
    url: "https://examinationboard.aku.edu/about-us/SyllabiList/Islamiyat%20SSC-Urdu%20Syllabus%202025.pdf",
  },
];

type IngestionMode = "url" | "upload" | "manual";

export default function AddSyllabusPage() {
  const router = useRouter();
  const subjectOptions = useSubjectOptions(Object.values(Subject));

  const [mode, setMode] = useState<IngestionMode>("url");
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    classLevel: Class.IX as Class,
    board: Board.AKUEB as Board,
    subject: Subject.MATHEMATICS as Subject,
    syllabusYear: new Date().getFullYear().toString(),
    rawText: "",
  });

  const [extractedCurriculums, setExtractedCurriculums] = useState<
    AutoExtractSyllabusResponse["extracted"] | null
  >(null);
  const [activeCurriculumIndex, setActiveCurriculumIndex] = useState(0);

  const autoExtractMutation = useAutoExtractSyllabus();

  const handleSelectPreset = (idx: number) => {
    setSelectedPresetIndex(idx);
    const preset = OFFICIAL_AKUEB_PRESETS[idx];
    setPdfUrl(preset.url);
    if (preset.subject) {
      setFormData((prev) => ({ ...prev, subject: preset.subject as Subject }));
    }
    if (preset.classHint) {
      setFormData((prev) => ({ ...prev, classLevel: preset.classHint as Class }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        toast.error("Please select a valid PDF file");
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleExtractAndPreview = async () => {
    try {
      if (mode === "url") {
        if (!pdfUrl.trim()) {
          toast.error("Please enter a valid Syllabus PDF URL or pick a preset");
          return;
        }
        const res = await autoExtractMutation.mutateAsync({
          pdfUrl: pdfUrl.trim(),
          subject: formData.subject,
          classLevel: formData.classLevel,
          board: formData.board,
          save: false,
        });
        if (res && res.extracted && res.extracted.length > 0) {
          setExtractedCurriculums(res.extracted);
          setActiveCurriculumIndex(0);
          toast.success(`Successfully extracted ${res.extracted.length} curriculum framework(s)!`);
        }
      } else if (mode === "upload") {
        if (!uploadedFile) {
          toast.error("Please select a syllabus PDF to upload");
          return;
        }
        const uploadData = new FormData();
        uploadData.append("file", uploadedFile);
        uploadData.append("subject", formData.subject);
        uploadData.append("classLevel", formData.classLevel);
        uploadData.append("board", formData.board);
        uploadData.append("save", "false");

        const res = await autoExtractMutation.mutateAsync(uploadData);
        if (res && res.extracted && res.extracted.length > 0) {
          setExtractedCurriculums(res.extracted);
          setActiveCurriculumIndex(0);
          toast.success(`Successfully extracted ${res.extracted.length} curriculum framework(s)!`);
        }
      } else {
        if (!formData.rawText.trim()) {
          toast.error("Please paste syllabus text");
          return;
        }
        const res = await autoExtractMutation.mutateAsync({
          text: formData.rawText.trim(),
          subject: formData.subject,
          classLevel: formData.classLevel,
          board: formData.board,
          save: false,
        });
        if (res && res.extracted && res.extracted.length > 0) {
          setExtractedCurriculums(res.extracted);
          setActiveCurriculumIndex(0);
          toast.success(`Successfully parsed ${res.extracted.length} curriculum framework(s)!`);
        }
      }
    } catch (err) {
      console.error("Auto extract error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to extract syllabus");
    }
  };

  const handleSaveAndCommit = async () => {
    if (!extractedCurriculums || extractedCurriculums.length === 0) return;

    try {
      if (mode === "url") {
        await autoExtractMutation.mutateAsync({
          pdfUrl: pdfUrl.trim(),
          subject: formData.subject,
          classLevel: formData.classLevel,
          board: formData.board,
          save: true,
        });
      } else if (mode === "upload" && uploadedFile) {
        const uploadData = new FormData();
        uploadData.append("file", uploadedFile);
        uploadData.append("subject", formData.subject);
        uploadData.append("classLevel", formData.classLevel);
        uploadData.append("board", formData.board);
        uploadData.append("save", "true");

        await autoExtractMutation.mutateAsync(uploadData);
      } else {
        await autoExtractMutation.mutateAsync({
          text: formData.rawText.trim(),
          subject: formData.subject,
          classLevel: formData.classLevel,
          board: formData.board,
          save: true,
        });
      }

      toast.success("Syllabus & SLOs successfully committed to repository!");
      router.push(FRONTEND_ROUTES.ADMIN_CURRICULUMS);
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save syllabus");
    }
  };

  const activeCurriculum =
    extractedCurriculums && extractedCurriculums[activeCurriculumIndex]
      ? extractedCurriculums[activeCurriculumIndex]
      : null;

  const totalChapters = activeCurriculum?.chapters?.length ?? 0;
  const totalSubtopics =
    activeCurriculum?.chapters?.reduce((acc, c) => acc + (c.subtopics?.length || 0), 0) ?? 0;
  const totalSLOs =
    activeCurriculum?.chapters?.reduce(
      (acc, c) =>
        acc + (c.subtopics?.reduce((sAcc, s) => sAcc + (s.slos?.length || 0), 0) || 0),
      0,
    ) ?? 0;

  return (
    <PageContainer>
      <PageHeader
        title="Official Syllabus & SLO Auto-Ingestion"
        onBack={() => router.push(FRONTEND_ROUTES.ADMIN_CURRICULUMS)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* Left Column: Mode selection & Ingestion Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card border border-border rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-xl shadow-foreground/[0.02]">
            {/* Mode Tabs */}
            <div className="flex bg-muted/60 p-1.5 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => setMode("url")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all",
                  mode === "url"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Globe className="h-4 w-4 text-primary" />
                AKUEB URL
              </button>
              <button
                type="button"
                onClick={() => setMode("upload")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all",
                  mode === "upload"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <UploadCloud className="h-4 w-4 text-primary" />
                Upload PDF
              </button>
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all",
                  mode === "manual"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <FileCode className="h-4 w-4 text-primary" />
                Raw Text
              </button>
            </div>

            {/* Mode 1: AKUEB Official Catalog URL */}
            {mode === "url" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <AppLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      AKUEB Official Syllabi Catalog
                    </AppLabel>
                    <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> 1-Click Select
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {OFFICIAL_AKUEB_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPreset(idx)}
                        className={cn(
                          "w-full text-left p-2.5 rounded-xl text-xs font-semibold transition-all border flex items-center justify-between group",
                          selectedPresetIndex === idx
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-background/80 border-border/70 text-foreground hover:border-primary/50",
                        )}
                      >
                        <span className="truncate pr-2">{preset.label}</span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/50">
                  <AppLabel required className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    AKUEB Syllabus URL
                  </AppLabel>
                  <input
                    type="url"
                    value={pdfUrl}
                    onChange={(e) => {
                      setPdfUrl(e.target.value);
                      setSelectedPresetIndex(null);
                    }}
                    placeholder="https://examinationboard.aku.edu/about-us/SyllabiList/..."
                    className="w-full h-12 px-4 bg-background border border-border/60 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-xs font-medium"
                  />
                </div>
              </div>
            )}

            {/* Mode 2: Direct PDF Upload */}
            {mode === "upload" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <AppLabel required className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Upload Syllabus PDF
                </AppLabel>
                <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all group cursor-pointer relative">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center space-y-2">
                    <div className="bg-muted p-3.5 rounded-full group-hover:bg-primary/10 transition-colors">
                      <UploadCloud className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <Typography variant="muted" className="text-foreground font-bold text-xs">
                      {uploadedFile ? uploadedFile.name : "Choose or drag & drop syllabus PDF"}
                    </Typography>
                    <Typography variant="small" className="text-[10px] text-muted-foreground">
                      Full multi-grade AKUEB Syllabi supported (up to 25MB)
                    </Typography>
                  </div>
                </div>
              </div>
            )}

            {/* Mode 3: Manual Text Input */}
            {mode === "manual" && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <AppLabel required className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Raw Syllabus Text
                </AppLabel>
                <textarea
                  value={formData.rawText}
                  onChange={(e) => setFormData({ ...formData, rawText: e.target.value })}
                  placeholder="Paste syllabus text or SLO table contents here..."
                  className="w-full h-64 p-4 bg-background border border-border/60 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-xs font-medium resize-none shadow-inner"
                />
              </div>
            )}

            {/* Metadata Fields */}
            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <AppLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Subject Hint
                  </AppLabel>
                  <AppDropdown
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value as Subject })}
                    options={subjectOptions}
                    className="rounded-xl h-11 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <AppLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Class Hint
                  </AppLabel>
                  <AppDropdown
                    value={formData.classLevel}
                    onChange={(e) => setFormData({ ...formData, classLevel: e.target.value as Class })}
                    options={Object.values(Class).map((c) => ({ value: c, label: `Class ${c}` }))}
                    className="rounded-xl h-11 text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <AppButton
              onClick={handleExtractAndPreview}
              disabled={
                autoExtractMutation.isPending ||
                (mode === "url" && !pdfUrl.trim()) ||
                (mode === "upload" && !uploadedFile) ||
                (mode === "manual" && !formData.rawText.trim())
              }
              className="w-full h-14 rounded-2xl font-black text-sm shadow-xl shadow-primary/20"
            >
              {autoExtractMutation.isPending ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  AI Extracting Chapters & SLOs...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Extract & Preview Architecture
                </>
              )}
            </AppButton>
          </div>
        </div>

        {/* Right Column: Preview & SLO Editor */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-2xl">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Typography variant="h3" className="text-lg font-black">
                  Curriculum Architecture Preview
                </Typography>
                <Typography
                  variant="muted"
                  className="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                >
                  {extractedCurriculums
                    ? `${extractedCurriculums.length} Class Framework(s) Found`
                    : "Awaiting Extraction"}
                </Typography>
              </div>
            </div>

            {extractedCurriculums && extractedCurriculums.length > 0 && (
              <AppButton
                onClick={handleSaveAndCommit}
                disabled={autoExtractMutation.isPending}
                className="bg-green-600 hover:bg-green-700 h-11 px-5 rounded-xl font-black text-xs shadow-lg shadow-green-600/20"
              >
                {autoExtractMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Commit to Repository
                  </>
                )}
              </AppButton>
            )}
          </div>

          {/* Extracted Multiple Classes Switcher */}
          {extractedCurriculums && extractedCurriculums.length > 1 && (
            <div className="flex gap-2 p-1.5 bg-muted/60 rounded-2xl">
              {extractedCurriculums.map((curr, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveCurriculumIndex(idx)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2",
                    activeCurriculumIndex === idx
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span>Class {curr.classLevel}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {curr.chapters?.length || 0} Units
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Stats Bar */}
          {activeCurriculum && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card border border-border/80 rounded-2xl p-3.5 text-center">
                <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">
                  Units / Chapters
                </span>
                <p className="text-xl font-black text-foreground mt-0.5">{totalChapters}</p>
              </div>
              <div className="bg-card border border-border/80 rounded-2xl p-3.5 text-center">
                <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">
                  Subtopics
                </span>
                <p className="text-xl font-black text-foreground mt-0.5">{totalSubtopics}</p>
              </div>
              <div className="bg-card border border-border/80 rounded-2xl p-3.5 text-center">
                <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">
                  Total SLOs
                </span>
                <p className="text-xl font-black text-primary mt-0.5">{totalSLOs}</p>
              </div>
            </div>
          )}

          {/* SLO Tables or Empty State */}
          <AppState
            isEmpty={!activeCurriculum}
            title="Awaiting Extraction"
            description="Select an AKUEB Syllabus URL, upload a PDF, or paste text, then click 'Extract & Preview Architecture'."
            icon={Sparkles}
            fullScreen={false}
          >
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeCurriculum?.chapters?.map((chapter, cIdx) => (
                <div key={cIdx} className="bg-card border border-border rounded-3xl p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border/60">
                    <div className="flex items-center gap-2.5">
                      <span className="size-8 flex items-center justify-center rounded-xl bg-primary/10 text-primary font-black text-xs">
                        {chapter.chapterNumber}
                      </span>
                      <h4 className="text-sm font-black text-foreground">{chapter.chapterName}</h4>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {chapter.subtopics?.length || 0} Subtopics ·{" "}
                      {chapter.subtopics?.reduce((a, s) => a + (s.slos?.length || 0), 0) || 0} SLOs
                    </span>
                  </div>

                  <SLOTable
                    chapterNumber={chapter.chapterNumber}
                    chapterName={chapter.chapterName}
                    subtopics={chapter.subtopics as Subtopic[]}
                    isEditMode={true}
                    onSave={(updatedSubtopics) => {
                      if (!extractedCurriculums) return;
                      const next = [...extractedCurriculums];
                      next[activeCurriculumIndex].chapters[cIdx].subtopics = updatedSubtopics;
                      setExtractedCurriculums(next);
                    }}
                  />
                </div>
              ))}
            </div>
          </AppState>
        </div>
      </div>
    </PageContainer>
  );
}
