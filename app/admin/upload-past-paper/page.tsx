"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import { parsePaperI, parsePaperII, ExtractedQuestion as ParsedQuestion } from "@/lib/past-paper-parser";
import { toast } from "react-hot-toast";
import { Class, Board, Subject } from "@/types/enums";
import ConfirmationModal from "@/components/ConfirmationModal";
import {
  useAdminCurriculumChaptersLookup,
  useCreateAdminPastPaper,
  useUploadQuestionImage,
  useAutoExtractPastPaper,
} from "@/hooks/admin/useAdminUploads";
import UploadPastPaperConfigureStep from "@/components/admin/upload-past-paper/UploadPastPaperConfigureStep";
import UploadPastPaperImportStep from "@/components/admin/upload-past-paper/UploadPastPaperImportStep";
import UploadPastPaperManualStep from "@/components/admin/upload-past-paper/UploadPastPaperManualStep";
import UploadPastPaperReviewStep, { type RemovedQuestionItem } from "@/components/admin/upload-past-paper/UploadPastPaperReviewStep";
import UploadPastPaperQuestionEditor, { type UploadPastPaperQuestion } from "@/components/admin/upload-past-paper/UploadPastPaperQuestionEditor";
import { GenerateStepProgress } from "@/components/generate/GeneratePaperUI";
import { normalizeScientificNotation } from "@/lib/scientific-notation/normalize";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 2014 }, (_, i) => currentYear - i);

interface ExtractedQuestion extends UploadPastPaperQuestion {
    id?: string;
    suggestedChapter?: string | null;
}

interface Chapter {
    id: string;
    chapterName: string;
}

type Step = "mode" | "manual" | "review";
type ModeSubStep = "configure" | "import";

const DEFAULT_MARKS: Record<string, number> = {
    MCQ: 1,
    CRQ: 3,
    ERQ: 5,
};

export default function UploadPastPaperPage() {
    const router = useRouter();

    // Step management
    const [step, setStep] = useState<Step>("mode");
    const [modeSubStep, setModeSubStep] = useState<ModeSubStep>("configure");

    // Upload form state
    const [paperNumber, setPaperNumber] = useState(1);
    const [classValue, setClassValue] = useState("");
    const [board, setBoard] = useState(Board.AKUEB);
    const [subject, setSubject] = useState("");
    const [year, setYear] = useState("");
    const [strictMode, setStrictMode] = useState(true);
    const [allowResume, setAllowResume] = useState(false);
    const [manualText, setManualText] = useState("");

    // Extraction state
    const [pastPaperId, setPastPaperId] = useState<string | null>(null);
    const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[]>([]);
    const [removedQuestions, setRemovedQuestions] = useState<RemovedQuestionItem[]>([]);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

    // Publishing state
    const [isPublishing, setIsPublishing] = useState(false);
    const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);

    // Initial draft check
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [pendingDraft, setPendingDraft] = useState<any>(null);

    const createMutation = useCreateAdminPastPaper();
    const uploadImageMutation = useUploadQuestionImage();
    const autoExtractMutation = useAutoExtractPastPaper();
    const chaptersLookupQuery = useAdminCurriculumChaptersLookup(
        { class: classValue, board, subject },
        Boolean(classValue && board && subject),
    );

    // Persistence: Save to Draft
    useEffect(() => {
        if (step !== "mode") {
            const draft = {
                metadata: { classValue, board, subject, year, paperNumber, strictMode, allowResume },
                step,
                manualText,
                extractedQuestions,
                pastPaperId,
                chapters
            };
            localStorage.setItem("zentix_upload_draft", JSON.stringify(draft));
        }
    }, [classValue, board, subject, year, paperNumber, strictMode, allowResume, step, manualText, extractedQuestions, pastPaperId, chapters]);

    // Initialize Draft
    useEffect(() => {
        const savedDraft = localStorage.getItem("zentix_upload_draft");
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                if (parsed.extractedQuestions?.length > 0 || parsed.manualText) {
                    setPendingDraft(parsed);
                    setShowResumeModal(true);
                }
            } catch (e) {
                console.error("Failed to parse draft:", e);
            }
        }
    }, []);

    useEffect(() => {
        if (chaptersLookupQuery.data?.chapters) {
            setChapters(chaptersLookupQuery.data.chapters);
        }
    }, [chaptersLookupQuery.data]);

    const fetchChapters = async () => {
        await chaptersLookupQuery.refetch();
    };

    // Sync Chapters
    useEffect(() => {
        if (classValue && board && subject) {
            fetchChapters();
        }
    }, [classValue, board, subject]);

    const handleResumeDraft = () => {
        if (pendingDraft) {
            const { metadata, step: savedStep, manualText: savedText, extractedQuestions: savedQuestions, pastPaperId: savedId } = pendingDraft;
            setClassValue(metadata.classValue);
            setBoard(metadata.board || Board.AKUEB);
            setSubject(metadata.subject);
            setYear(metadata.year);
            setPaperNumber(metadata.paperNumber);
            if (savedStep === "upload") {
                setStep("mode");
                setModeSubStep("import");
            } else {
                setStep(savedStep);
            }
            setManualText(savedText);
            setExtractedQuestions(savedQuestions);
            setPastPaperId(savedId);
            if (pendingDraft.chapters) {
                setChapters(pendingDraft.chapters);
            }

            // Expand only the first question to avoid hang
            if (savedQuestions.length > 0) {
                setExpandedQuestions(new Set([0]));
            }
        }
        setShowResumeModal(false);
    };

    const handleDiscardDraft = () => {
        localStorage.removeItem("zentix_upload_draft");
        setShowResumeModal(false);
        setPendingDraft(null);
    };

    // ====== Mode Selection ======
    const handleManualEntry = () => {
        if (!classValue || !board || !subject || !year) {
            toast.error("Please fill all metadata fields first");
            return;
        }
        setStep("manual");
    };

    const handleStructuredForm = () => {
        if (!classValue || !board || !subject || !year) {
            toast.error("Please fill all metadata fields first");
            return;
        }
        setExtractedQuestions([]);
        setStep("review");
        // Expand the first question if we're adding it
        setExpandedQuestions(new Set());
        toast.success("Ready for individual question entry");
    };

    const handleAutoExtract = async (paperFile: File, syllabusFile: File | null) => {
        if (!classValue || !board || !subject || !year) {
            toast.error("Please fill all metadata fields in Configure first");
            return;
        }

        const formData = new FormData();
        formData.append("file", paperFile);
        if (syllabusFile) {
            formData.append("syllabusFile", syllabusFile);
        }
        formData.append("class", classValue);
        formData.append("board", board);
        formData.append("subject", subject);
        formData.append("year", year);
        formData.append("paperNumber", String(paperNumber));

        try {
            const res = await autoExtractMutation.mutateAsync(formData);
            if (res.extractedQuestions && res.extractedQuestions.length > 0) {
                setExtractedQuestions(res.extractedQuestions);
                if (res.chapters && res.chapters.length > 0) {
                    setChapters(res.chapters);
                }
                setRemovedQuestions(res.removedQuestions || []);
                setPastPaperId("auto-" + Date.now());
                setExpandedQuestions(new Set([0]));
                setStep("review");
                toast.success(
                    `Extracted ${res.totalQuestions} questions with ${res.diagramsAttached} diagrams!`,
                );
            } else {
                toast.error("No questions could be extracted from this PDF.");
            }
        } catch (err: any) {
            console.error("Auto-extract failed:", err);
            toast.error(err?.message || "Failed to auto-extract past paper. Please try again.");
        }
    };

    const handleRestoreRemovedQuestion = (rq: RemovedQuestionItem) => {
        const newQ: ExtractedQuestion = {
            questionNumber: rq.questionNumber,
            questionPart: null,
            questionText: rq.questionText,
            questionType: paperNumber === 1 ? "MCQ" : "CRQ",
            chapterId: null,
            chapterName: null,
            marks: paperNumber === 1 ? 1 : 3,
            mcqOptions: paperNumber === 1 ? [
                { id: "A", text: "" },
                { id: "B", text: "" },
                { id: "C", text: "" },
                { id: "D", text: "" }
            ] : undefined,
        };
        setExtractedQuestions(prev => [...prev, newQ].sort((a, b) => a.questionNumber - b.questionNumber));
        setRemovedQuestions(prev => prev.filter(item => item.questionNumber !== rq.questionNumber));
        toast.success(`Question Q${rq.questionNumber} restored to active list`);
    };

    const addNewQuestion = () => {
        const nextNumber = extractedQuestions.length > 0
            ? Math.max(...extractedQuestions.map(q => q.questionNumber)) + 1
            : 1;

        const newQuestion: ExtractedQuestion = {
            questionNumber: nextNumber,
            questionPart: null,
            questionText: "New assessment item content...",
            questionType: paperNumber === 1 ? "MCQ" : "CRQ",
            chapterId: null,
            chapterName: null,
            marks: paperNumber === 1 ? 1 : 3,
            mcqOptions: paperNumber === 1 ? [
                { id: "A", text: "" },
                { id: "B", text: "" },
                { id: "C", text: "" },
                { id: "D", text: "" }
            ] : undefined,
            paperIIData: paperNumber === 2 ? {
                betterResponse: "",
                weakerResponse: "",
                type: "CRQ"
            } : undefined
        };

        setExtractedQuestions([...extractedQuestions, newQuestion]);
        setExpandedQuestions(new Set([extractedQuestions.length]));
    };

    const handleParseManualText = async () => {
        if (!manualText.trim()) {
            toast.error("Please paste the past paper text");
            return;
        }

        try {
            let questions: ParsedQuestion[] = [];
            let fetchedChapters: Chapter[] = [];
            if (paperNumber === 1) {
                questions = parsePaperI(manualText);
            } else {
                questions = parsePaperII(manualText);
            }

            if (questions.length === 0) {
                toast.error("Could not extract any questions. Check the format.");
                return;
            }

            // Fetch chapters for the curriculum to allow assignment
            try {
                const lookup = await chaptersLookupQuery.refetch();
                if (lookup.data?.chapters) {
                    fetchedChapters = lookup.data.chapters;
                    setChapters(fetchedChapters);
                }
            } catch (e) {
                console.error("Failed to fetch chapters:", e);
            }

            const formattedQuestions: ExtractedQuestion[] = questions.map(q => {
                let matchedChapterId: string | null = null;
                let matchedChapterName: string | null = null;

                if (q.suggestedChapter && Array.isArray(fetchedChapters)) {
                    const normalizedSuggested = q.suggestedChapter.toLowerCase().trim();
                    const match = fetchedChapters.find(c =>
                        c.chapterName.toLowerCase().includes(normalizedSuggested) ||
                        normalizedSuggested.includes(c.chapterName.toLowerCase())
                    );
                    if (match) {
                        matchedChapterId = match.id;
                        matchedChapterName = match.chapterName;
                    }
                }

                return {
                    ...q,
                    questionText: normalizeScientificNotation(q.questionText),
                    mcqOptions: q.mcqOptions?.map((opt) => ({
                        ...opt,
                        text: normalizeScientificNotation(opt.text),
                    })),
                    paperIIData: q.paperIIData
                        ? {
                            ...q.paperIIData,
                            betterResponse: normalizeScientificNotation(q.paperIIData.betterResponse || ""),
                            weakerResponse: normalizeScientificNotation(q.paperIIData.weakerResponse || ""),
                        }
                        : undefined,
                    chapterId: matchedChapterId,
                    chapterName: matchedChapterName,
                    marks: DEFAULT_MARKS[q.questionType] || 1,
                };
            });

            setExtractedQuestions(formattedQuestions);
            // CRITICAL: Only expand the FIRST question by default to prevent hang on large papers
            setExpandedQuestions(new Set([0]));
            setPastPaperId("manual-" + Date.now()); // Temporary ID for manual flow
            setStep("review");
            toast.success(`Successfully parsed ${questions.length} questions!`);
        } catch (error) {
            console.error("Parsing error:", error);
            toast.error("Failed to parse text. Please check the format.");
        }
    };

    // ====== Question Editing ======
    const updateQuestion = (index: number, updates: Partial<ExtractedQuestion>) => {
        setExtractedQuestions((prev) =>
            prev.map((q, i) => {
                if (i !== index) return q;
                const updated = { ...q, ...updates };
                // Auto-update default marks when type changes
                if (updates.questionType && !updates.marks) {
                    updated.marks = DEFAULT_MARKS[updates.questionType] || q.marks;
                }
                return updated;
            }),
        );
    };

    const removeQuestion = (index: number) => {
        setExtractedQuestions((prev) => prev.filter((_, i) => i !== index));
        setExpandedQuestions((prev) => {
            const next = new Set<number>();
            prev.forEach((v) => {
                if (v < index) next.add(v);
                else if (v > index) next.add(v - 1);
            });
            return next;
        });
    };

    const toggleExpanded = (index: number) => {
        setExpandedQuestions((prev) => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    // ====== Publish ======
    const handlePublish = async () => {
        if (!pastPaperId || extractedQuestions.length === 0) {
            toast.error("No questions to publish");
            return;
        }

        setIsPublishing(true);
        try {
            await createMutation.mutateAsync({
                class: classValue,
                board,
                subject,
                year: parseInt(year),
                paperNumber,
                strictMode,
                allowResume,
                questions: extractedQuestions.map((q) => ({
                    questionNumber: q.questionNumber,
                    questionPart: q.questionPart || null,
                    questionText: q.questionText,
                    questionType: q.questionType,
                    chapterId: q.chapterId || null,
                    chapterName: q.chapterName || null,
                    marks: q.marks,
                    mcqOptions: q.questionType === "MCQ" ? q.mcqOptions : null,
                    correctAnswer: q.questionType === "MCQ" ? q.correctAnswer : null,
                    imageUrl: q.imageUrl || null,
                    paperIIData: q.paperIIData || null,
                })),
            });

            toast.success("Past paper published successfully!");
            localStorage.removeItem("zentix_upload_draft");

            // Redirect based on paper number
            const targetRoute = paperNumber === 2
                ? FRONTEND_ROUTES.ADMIN_PAST_PAPERS_2
                : FRONTEND_ROUTES.ADMIN_PAST_PAPERS_1;

            router.push(targetRoute);
        } catch (error: any) {
            console.error("Publish error:", error);
            toast.error(
                error?.message || "Failed to publish past paper. Please try again.",
            );
        } finally {
            setIsPublishing(false);
        }
    };

    const uploadImageFile = async (index: number, file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        setUploadingImageIndex(index);
        try {
            const data = await uploadImageMutation.mutateAsync(formData);
            updateQuestion(index, { imageUrl: data.fileUrl });
            toast.success("Image uploaded successfully!");
        } catch (error: any) {
            console.error("Image upload error:", error);
            toast.error(error?.message || "Failed to upload image.");
        } finally {
            setUploadingImageIndex(null);
        }
    };

    const handleSaveQuestion = (index: number) => {
        updateQuestion(index, { isSaved: true });
        const newExpanded = new Set(expandedQuestions);
        newExpanded.delete(index);
        if (index + 1 < extractedQuestions.length) {
            newExpanded.add(index + 1);
        }
        setExpandedQuestions(newExpanded);
        toast.success("Question progress saved locally");
    };

    const goToModeImport = () => {
        setStep("mode");
        setModeSubStep("import");
    };

    const configureProgressStep =
        step === "mode" ? (modeSubStep === "configure" ? 0 : 1) : step === "review" ? 2 : 1;

    // ====== Render ======
    return (
        <PageContainer className="space-y-0 pb-8">
            <PageHeader
                title="Create Past Paper"
                showLine={true}
                onBack={() => {
                    if (step === "review") {
                        setStep(manualText.trim() ? "manual" : "mode");
                        if (!manualText.trim()) {
                            setModeSubStep("import");
                        }
                    } else if (step === "manual") {
                        goToModeImport();
                    } else {
                        router.push(FRONTEND_ROUTES.ADMIN_PAST_PAPERS_1);
                    }
                }}
            />

            {(step === "mode" || step === "manual" || step === "review") ? (
                <GenerateStepProgress
                    currentStep={step === "review" ? 2 : configureProgressStep}
                    steps={["Configure", "Import", "Review"]}
                />
            ) : null}

            {step === "mode" ? (
                <div className="mt-2">
                    {modeSubStep === "configure" ? (
                        <UploadPastPaperConfigureStep
                            paperNumber={paperNumber}
                            classValue={classValue}
                            board={board}
                            subject={subject}
                            year={year}
                            years={years}
                            strictMode={strictMode}
                            allowResume={allowResume}
                            onPaperNumberChange={setPaperNumber}
                            onClassChange={setClassValue}
                            onBoardChange={(b) => setBoard(b as Board)}
                            onSubjectChange={setSubject}
                            onYearChange={setYear}
                            onStrictModeChange={setStrictMode}
                            onAllowResumeChange={setAllowResume}
                            onContinue={() => setModeSubStep("import")}
                        />
                    ) : (
                        <UploadPastPaperImportStep
                            paperNumber={paperNumber}
                            classValue={classValue}
                            board={board}
                            subject={subject}
                            year={year}
                            isExtracting={autoExtractMutation.isPending}
                            onBack={() => setModeSubStep("configure")}
                            onPasteText={handleManualEntry}
                            onManualEntry={handleStructuredForm}
                            onAutoExtract={handleAutoExtract}
                        />
                    )}
                </div>
            ) : null}
            {step === "manual" ? (
                <UploadPastPaperManualStep
                    paperNumber={paperNumber}
                    classValue={classValue}
                    board={board}
                    subject={subject}
                    year={year}
                    manualText={manualText}
                    onManualTextChange={setManualText}
                    onBack={goToModeImport}
                    onParse={handleParseManualText}
                />
            ) : null}

            {step === "review" ? (
                <UploadPastPaperReviewStep
                    paperNumber={paperNumber}
                    classValue={classValue}
                    board={board}
                    subject={subject}
                    year={year}
                    questionCount={extractedQuestions.length}
                    isPublishing={isPublishing}
                    removedQuestions={removedQuestions}
                    onRestoreRemovedQuestion={handleRestoreRemovedQuestion}
                    onBack={goToModeImport}
                    onAddQuestion={addNewQuestion}
                    onPublish={handlePublish}
                >
                    {extractedQuestions.map((question, index) => (
                        <UploadPastPaperQuestionEditor
                            key={`${question.questionNumber}-${question.questionPart ?? index}`}
                            question={question}
                            index={index}
                            chapters={chapters}
                            isExpanded={expandedQuestions.has(index)}
                            isUploadingImage={uploadingImageIndex === index}
                            onToggleExpanded={toggleExpanded}
                            onUpdate={updateQuestion}
                            onRemove={removeQuestion}
                            onSave={handleSaveQuestion}
                            onUploadImage={uploadImageFile}
                        />
                    ))}
                </UploadPastPaperReviewStep>
            ) : null}

            <ConfirmationModal
                isOpen={showResumeModal}
                onClose={handleDiscardDraft}
                onConfirm={handleResumeDraft}
                title="Resume Draft?"
                message="We found an unsaved session. Would you like to continue editing your past paper or start from scratch?"
                confirmLabel="Continue Editing"
                cancelLabel="Start Fresh"
                variant="primary"
            />
        </PageContainer>
    );
}
