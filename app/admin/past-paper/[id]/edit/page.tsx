"use client";

import AddSVG from "@/public/svgs/AddSVG";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Typography } from "@/components/ui/Typography";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import AppInput from "@/components/AppInput";
import AppButton from "@/components/AppButton";
import AppLabel from "@/components/AppLabel";
import AppDropdown from "@/components/AppDropdown";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import QuestionCard from "@/components/QuestionCard";
import MCQOptionsEditor from "@/components/MCQOptionsEditor";
import MCQOptionsDisplay from "@/components/MCQOptionsDisplay";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Loader2, X, Save, Edit, FileText, Database, Settings2, Info, CheckCircle2, AlertCircle, Sparkles, Image as ImageIcon } from "lucide-react";
import { Class, Board, Subject } from "@/types/enums";
import toast from "react-hot-toast";
import {
    useAdminPastPaperDetail,
    useUpdateAdminPastPaper,
} from "@/hooks/admin/useAdminPastPaperDetail";
import {
    useAdminCurriculumChaptersLookup,
    useUploadQuestionImage,
} from "@/hooks/admin/useAdminUploads";
import { useAdminSubjectOptions } from "@/hooks/subjects/useSubjects";
import MathExpressionEditor from "@/components/MathExpressionEditor";
import { convertMathToHTML, isUrduText } from "@/lib/utils/math-notation";
import { getFileFromPaste, getFileFromDrop } from "@/lib/image-upload-utils";
import { cn } from "@/lib/utils";
import AppLoader from "@/components/AppLoader";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 2014 }, (_, i) => currentYear - i);

const DEFAULT_MARKS: Record<string, number> = {
    MCQ: 1,
    CRQ: 3,
    ERQ: 5,
};

interface MCQOption {
    id: string;
    text: string;
}

interface QuestionForm {
    id: string;
    questionNumber: number;
    questionPart: string | null;
    questionText: string;
    questionType: "MCQ" | "CRQ" | "ERQ";
    chapterId: string | null;
    marks: number;
    mcqOptions: MCQOption[];
    correctAnswer: string | null;
    imageUrl?: string | null;
}

interface Chapter {
    id: string;
    chapterName: string;
}

export default function EditPastPaperPage() {
    const router = useRouter();
    const params = useParams();
    const paperId = params.id as string;

    const [formData, setFormData] = useState({
        class: "" as Class | "",
        board: Board.AKUEB,
        subject: "" as Subject | "",
        year: "",
        paperNumber: 1,
    });
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [questions, setQuestions] = useState<QuestionForm[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<QuestionForm | null>(null);
    const [viewingQuestion, setViewingQuestion] = useState<QuestionForm | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [questionToDelete, setQuestionToDelete] = useState<QuestionForm | null>(null);

    const subjectOptions = useAdminSubjectOptions(Object.values(Subject));
    const paperDetailQuery = useAdminPastPaperDetail(paperId);
    const updatePastPaperMutation = useUpdateAdminPastPaper();
    const chaptersLookupQuery = useAdminCurriculumChaptersLookup(
        {
            class: formData.class,
            board: formData.board,
            subject: formData.subject,
        },
        Boolean(formData.class && formData.board && formData.subject),
    );
    const paperInitializedRef = useRef(false);

    // Scroll to the question being edited or viewed
    useEffect(() => {
        const activeId = editingQuestion?.id || viewingQuestion?.id;
        if (activeId) {
            // Give a small delay for the DOM to update and render the editor
            setTimeout(() => {
                const element = document.getElementById(`question-${activeId}`);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }, 100);
        }
    }, [editingQuestion?.id, viewingQuestion?.id]);

    useEffect(() => {
        if (!paperDetailQuery.data || paperInitializedRef.current) return;
        paperInitializedRef.current = true;

        const paper = paperDetailQuery.data;
        setFormData({
            class: paper.class as Class,
            board: paper.board as Board,
            subject: paper.subject as Subject,
            year: paper.year.toString(),
            paperNumber: paper.paperNumber || 1,
        });

        const transformedQuestions = (paper.questions || []).map((q) => ({
            id: q.id,
            questionNumber: q.questionNumber,
            questionPart: q.questionPart,
            questionText: q.questionText,
            questionType: q.questionType as "MCQ" | "CRQ" | "ERQ",
            chapterId: q.chapterId || null,
            marks: q.marks || (DEFAULT_MARKS[q.questionType] || 1),
            mcqOptions: q.mcqOptions || [],
            correctAnswer: q.correctAnswer || null,
            imageUrl: q.imageUrl,
        }));
        setQuestions(transformedQuestions);
    }, [paperDetailQuery.data]);

    useEffect(() => {
        if (paperDetailQuery.isError) {
            toast.error("Failed to load past paper details");
            router.push(FRONTEND_ROUTES.ADMIN_PAST_PAPERS_1);
        }
    }, [paperDetailQuery.isError, router]);

    useEffect(() => {
        setIsLoading(paperDetailQuery.isLoading);
    }, [paperDetailQuery.isLoading]);

    useEffect(() => {
        if (chaptersLookupQuery.data?.chapters) {
            setChapters(chaptersLookupQuery.data.chapters);
        }
    }, [chaptersLookupQuery.data]);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const addQuestion = () => {
        const maxQNum = questions.reduce((max, q) => Math.max(max, q.questionNumber), 0);
        const newQuestion: QuestionForm = {
            id: `temp-${Date.now()}`,
            questionNumber: maxQNum + 1,
            questionPart: null,
            questionText: "",
            questionType: "ERQ",
            chapterId: null,
            marks: 5, // Default for ERQ
            mcqOptions: [
                { id: "opt-1", text: "" },
                { id: "opt-2", text: "" },
                { id: "opt-3", text: "" },
                { id: "opt-4", text: "" },
            ],
            correctAnswer: null,
            imageUrl: null,
        };
        setEditingQuestion(newQuestion);
        setViewingQuestion(null);
    };

    const editQuestion = (question: QuestionForm) => {
        setEditingQuestion({ ...question });
        setViewingQuestion(null);
    };

    const viewQuestion = (question: QuestionForm) => {
        setViewingQuestion(question);
        setEditingQuestion(null);
    };

    const openDeleteModal = (question: QuestionForm) => {
        setQuestionToDelete(question);
        setDeleteModalOpen(true);
    };

    const deleteQuestion = () => {
        if (!questionToDelete) return;
        const filtered = questions.filter((q) => q.id !== questionToDelete.id);
        setQuestions(filtered);
        if (editingQuestion?.id === questionToDelete.id) setEditingQuestion(null);
        if (viewingQuestion?.id === questionToDelete.id) setViewingQuestion(null);
        setDeleteModalOpen(false);
        setQuestionToDelete(null);
        toast.success("Question deleted locally");
    };

    const saveQuestion = () => {
        if (!editingQuestion) return;

        if (!editingQuestion.questionText.trim()) {
            toast.error("Please enter question text");
            return;
        }

        if (editingQuestion.questionType === "MCQ") {
            const hasOptions = editingQuestion.mcqOptions.some((opt) => opt.text.trim());
            if (!hasOptions) {
                toast.error("Please add at least one MCQ option");
                return;
            }
            if (!editingQuestion.correctAnswer) {
                toast.error("Please select the correct answer");
                return;
            }
        }

        if (editingQuestion.id.startsWith("temp-")) {
            setQuestions([...questions, editingQuestion]);
        } else {
            setQuestions(questions.map((q) => (q.id === editingQuestion.id ? editingQuestion : q)));
        }
        setEditingQuestion(null);
        toast.success("Question updated locally");
    };

    const cancelEdit = () => {
        setEditingQuestion(null);
        setViewingQuestion(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.class || !formData.subject || !formData.year) {
            toast.error("Please fill all required fields");
            return;
        }

        // Commit any open inline edit so its changes (including uploaded/removed
        // images) aren't silently dropped when publishing directly.
        let effectiveQuestions = questions;
        if (editingQuestion) {
            if (!editingQuestion.questionText.trim()) {
                toast.error("Please finish editing the open question before publishing");
                return;
            }
            if (
                editingQuestion.questionType === "MCQ" &&
                (!editingQuestion.mcqOptions.some((opt) => opt.text.trim()) ||
                    !editingQuestion.correctAnswer)
            ) {
                toast.error("Please complete the open MCQ question before publishing");
                return;
            }
            effectiveQuestions = editingQuestion.id.startsWith("temp-")
                ? [...questions, editingQuestion]
                : questions.map((q) => (q.id === editingQuestion.id ? editingQuestion : q));
            setQuestions(effectiveQuestions);
            setEditingQuestion(null);
        }

        if (effectiveQuestions.length === 0) {
            toast.error("Please add at least one question");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                class: formData.class,
                board: formData.board,
                subject: formData.subject,
                year: parseInt(formData.year),
                questions: effectiveQuestions.map((q) => ({
                    questionNumber: q.questionNumber,
                    questionPart: q.questionPart,
                    questionText: q.questionText,
                    questionType: q.questionType,
                    chapterId: q.chapterId,
                    chapterName: chapters.find((ch) => ch.id === q.chapterId)?.chapterName ?? null,
                    marks: q.marks,
                    mcqOptions: q.questionType === "MCQ" ? q.mcqOptions : null,
                    correctAnswer: q.questionType === "MCQ" ? q.correctAnswer : null,
                    imageUrl: q.imageUrl || null,
                })),
            };

            await updatePastPaperMutation.mutateAsync({ paperId, payload });

            toast.success("Past paper updated successfully!");
            const redirectRoute = formData.paperNumber === 2
                ? FRONTEND_ROUTES.ADMIN_PAST_PAPERS_2
                : FRONTEND_ROUTES.ADMIN_PAST_PAPERS_1;
            router.push(redirectRoute);
        } catch (error: unknown) {
            console.error("Error updating past paper:", error);
            const message = error instanceof Error ? error.message : "Failed to update past paper";
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <PageContainer>
            <PageHeader
                title="Curate Assessment"
                onBack={() => {
                    const redirectRoute = formData.paperNumber === 2 
                        ? FRONTEND_ROUTES.ADMIN_PAST_PAPERS_2 
                        : FRONTEND_ROUTES.ADMIN_PAST_PAPERS_1;
                    router.push(redirectRoute);
                }}
            />

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <AppLoader className="min-h-0" />
                    <Typography variant="muted" className="font-bold uppercase tracking-widest text-[10px]">Retrieving Dataset</Typography>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-12">
                    {/* Metadata Selection */}
                    <div className="bg-card border border-border/60 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-foreground/2">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="bg-primary/10 p-3 rounded-2xl">
                                <Settings2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <Typography variant="h3" className="text-xl font-black tracking-tight">Classification Metadata</Typography>
                                <Typography variant="muted" className="text-sm font-medium">Define the core taxonomy for this assessment paper.</Typography>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="space-y-2">
                                <AppLabel htmlFor="class" className="text-[10px] font-black uppercase tracking-widest mb-2 ml-1 text-muted-foreground">Academic Level</AppLabel>
                                <AppDropdown
                                    id="class"
                                    name="class"
                                    value={formData.class}
                                    onChange={handleChange}
                                    placeholder="Select Class"
                                    options={Object.values(Class).map((cls) => ({ value: cls, label: cls }))}
                                    required
                                    className="h-14 rounded-2xl border-border/60 bg-background shadow-inner"
                                />
                            </div>

                            <div className="space-y-2">
                                <AppLabel htmlFor="board" className="text-[10px] font-black uppercase tracking-widest mb-2 ml-1 text-muted-foreground">Examination Board</AppLabel>
                                <AppDropdown
                                    id="board"
                                    name="board"
                                    value={formData.board}
                                    disabled
                                    options={[{ value: Board.AKUEB, label: Board.AKUEB }]}
                                    className="h-14 rounded-2xl border-border/60 bg-muted/30 text-muted-foreground cursor-not-allowed shadow-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <AppLabel htmlFor="subject" className="text-[10px] font-black uppercase tracking-widest mb-2 ml-1 text-muted-foreground">Scientific Domain</AppLabel>
                                <AppDropdown
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    placeholder="Select Subject"
                                    options={subjectOptions}
                                    required
                                    className="h-14 rounded-2xl border-border/60 bg-background shadow-inner"
                                />
                            </div>

                            <div className="space-y-2">
                                <AppLabel htmlFor="year" className="text-[10px] font-black uppercase tracking-widest mb-2 ml-1 text-muted-foreground">Session Year</AppLabel>
                                <AppDropdown
                                    id="year"
                                    name="year"
                                    value={formData.year}
                                    onChange={handleChange}
                                    placeholder="Select Year"
                                    options={years.map((year) => ({ value: year.toString(), label: year.toString() }))}
                                    required
                                    className="h-14 rounded-2xl border-border/60 bg-background shadow-inner"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Questions Section */}
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-1.5 bg-primary rounded-full"></div>
                                <Typography variant="h3" className="text-2xl font-black tracking-tight">
                                    Question Bank <span className="text-primary/40 font-black ml-2">{questions?.length || 0}</span>
                                </Typography>
                            </div>
                            <AppButton
                                type="button"
                                variant="default"
                                className="rounded-2xl h-14 px-8 font-black shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all"
                                onClick={addQuestion}
                            >
                                <AddSVG className="mr-2 h-6 w-6" /> Append Question
                            </AppButton>
                        </div>

                        {/* Questions List */}
                        <div className="grid grid-cols-1 gap-4">
                            {questions.length === 0 ? (
                                <div className="text-center py-24 border-2 border-dashed border-border/40 rounded-[3rem] bg-muted/5">
                                    <div className="bg-muted h-20 w-20 rounded-4xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                                        <Database className="h-10 w-10 text-muted-foreground" />
                                    </div>
                                    <Typography variant="h4" className="text-xl font-black mb-2 tracking-tight">Data Reservoir Empty</Typography>
                                    <Typography variant="muted" className="text-sm font-medium">Click "Append Question" to begin data entry for this session.</Typography>
                                </div>
                            ) : (
                                questions.map((question) => (
                                    <div key={question.id} id={`question-${question.id}`} className="space-y-6 scroll-mt-24">
                                        <div className="group transition-all duration-500 hover:-translate-y-1">
                                            <QuestionCard
                                                questionNumber={question.questionNumber}
                                                questionPart={question.questionPart}
                                                questionText={question.questionText}
                                                questionType={question.questionType}
                                                chapterName={question.chapterId ? chapters.find((ch) => ch.id === question.chapterId)?.chapterName : null}
                                                imageUrl={question.imageUrl}
                                                onView={() => viewQuestion(question)}
                                                onEdit={() => editQuestion(question)}
                                                onDelete={() => openDeleteModal(question)}
                                            />
                                        </div>

                                        {/* Inline Editor/Preview - Appears directly below the card */}
                                        {(editingQuestion?.id === question.id || viewingQuestion?.id === question.id) && (
                                            <div className="animate-in fade-in slide-in-from-top-4 duration-500 mb-8 scroll-mt-24">
                                                {editingQuestion?.id === question.id && (
                                                    <div className="bg-card border-2 border-primary/20 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-primary/5 space-y-8">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-primary h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                                                                    <Edit className="h-6 w-6 text-primary-foreground" />
                                                                </div>
                                                                <div>
                                                                    <Typography variant="h4" className="text-xl font-black tracking-tight">
                                                                        {editingQuestion.id.startsWith("temp-") ? "Synthesizing New Item" : "Refining Question Entity"}
                                                                    </Typography>
                                                                    <Typography variant="muted" className="text-xs font-bold uppercase tracking-widest">Workspace</Typography>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={cancelEdit}
                                                                className="h-12 w-12 flex items-center justify-center bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-2xl transition-all"
                                                            >
                                                                <X className="h-6 w-6" />
                                                            </button>
                                                        </div>

                                                        <div className="h-px bg-linear-to-r from-transparent via-border/50 to-transparent"></div>

                                                        <QuestionFormInline
                                                            question={editingQuestion}
                                                            chapters={chapters}
                                                            onChange={setEditingQuestion}
                                                            onSave={saveQuestion}
                                                            onCancel={cancelEdit}
                                                        />
                                                    </div>
                                                )}

                                                {viewingQuestion?.id === question.id && (
                                                    <div className="bg-card border border-border/60 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-foreground/2 space-y-8 animate-in zoom-in-95">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-muted/50 h-12 w-12 rounded-2xl flex items-center justify-center">
                                                                    <Info className="h-6 w-6 text-foreground" />
                                                                </div>
                                                                <div>
                                                                    <Typography variant="h4" className="text-xl font-black tracking-tight">Structural Preview</Typography>
                                                                    <Typography variant="muted" className="text-xs font-bold uppercase tracking-widest">Read Only</Typography>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setViewingQuestion(null)}
                                                                className="h-12 w-12 flex items-center justify-center bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-2xl transition-all"
                                                            >
                                                                <X className="h-6 w-6" />
                                                            </button>
                                                        </div>

                                                        <div className="h-px bg-linear-to-r from-transparent via-border/50 to-transparent"></div>

                                                        <div className="space-y-8">
                                                            <div className="flex items-center gap-4">
                                                                <div className="space-y-1">
                                                                    <Typography variant="muted" className="text-[10px] font-black uppercase tracking-widest ml-1">Serial Index</Typography>
                                                                    <div className="bg-primary/10 text-primary px-5 py-2 rounded-2xl font-black text-lg shadow-inner">
                                                                        Q{viewingQuestion.questionNumber}{viewingQuestion.questionPart || ""}
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1 flex-1">
                                                                    <Typography variant="muted" className="text-[10px] font-black uppercase tracking-widest ml-1">Complexity Class</Typography>
                                                                    <div className="bg-muted/50 text-foreground px-5 py-2 rounded-2xl font-black text-lg border border-border/40 inline-block">
                                                                        {viewingQuestion.questionType}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <Typography variant="muted" className="text-[10px] font-black uppercase tracking-widest ml-1">Item Text Content</Typography>
                                                                <div
                                                                    dir={isUrduText(viewingQuestion.questionText) ? "rtl" : "ltr"}
                                                                    className={cn(
                                                                        "bg-muted/20 border border-border/40 p-8 rounded-4xl text-lg font-medium shadow-inner",
                                                                        isUrduText(viewingQuestion.questionText) ? "font-urdu text-right leading-[2.2]" : "leading-relaxed text-left"
                                                                    )}
                                                                >
                                                                    <span dangerouslySetInnerHTML={{ __html: convertMathToHTML(viewingQuestion.questionText) }} />
                                                                </div>
                                                            </div>

                                                            {viewingQuestion.questionType === "MCQ" && viewingQuestion.mcqOptions && (
                                                                <div className="space-y-3">
                                                                    <Typography variant="muted" className="text-[10px] font-black uppercase tracking-widest ml-1">Response Options</Typography>
                                                                    <MCQOptionsDisplay options={viewingQuestion.mcqOptions} correctAnswerId={viewingQuestion.correctAnswer} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Persistence Layer */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-10 px-2 justify-end">
                        <button
                            type="button"
                            onClick={() => {
                                const redirectRoute = formData.paperNumber === 2 
                                    ? FRONTEND_ROUTES.ADMIN_PAST_PAPERS_2 
                                    : FRONTEND_ROUTES.ADMIN_PAST_PAPERS_1;
                                router.push(redirectRoute);
                            }}
                            className="h-14 px-10 bg-muted/50 hover:bg-muted text-muted-foreground font-black rounded-2xl transition-all"
                        >
                            Discard Session
                        </button>
                        <AppButton
                            type="submit"
                            size="lg"
                            className="h-14 px-16 text-lg font-black rounded-2xl shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all border-none"
                            disabled={isSaving || questions.length === 0}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                    Synchronizing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-3 h-6 w-6" />
                                    Publish Assessment
                                </>
                            )}
                        </AppButton>
                    </div>

                </form>
            )}

            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={deleteQuestion}
                title="Discard Entity"
                message="Are you certain you wish to remove this data point from the current session? This action cannot be reversed once published."
            />
        </PageContainer>
    );
}

// Inline Form Component
function QuestionFormInline({ question, chapters, onChange, onSave, onCancel }: any) {
    const [isUploading, setIsUploading] = useState(false);
    const uploadImageMutation = useUploadQuestionImage();
    const updateField = (field: string, value: any) => onChange({ ...question, [field]: value });

    const uploadImageFile = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        setIsUploading(true);
        try {
            const data = await uploadImageMutation.mutateAsync(formData);
            updateField("imageUrl", data.fileUrl);
            toast.success("Image uploaded successfully!");
        } catch (error: unknown) {
            console.error("Image upload error:", error);
            const message = error instanceof Error ? error.message : "Failed to upload image.";
            toast.error(message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await uploadImageFile(file);
    };

    const addMCQOption = () => {
        onChange({
            ...question,
            mcqOptions: [...question.mcqOptions, { id: `opt-${Date.now()}`, text: "" }]
        });
    };

    const removeMCQOption = (optionId: string) => {
        if (question.mcqOptions.length <= 2) {
            toast.error("At least 2 options required");
            return;
        }
        onChange({
            ...question,
            mcqOptions: question.mcqOptions.filter((opt: any) => opt.id !== optionId),
            correctAnswer: question.correctAnswer === optionId ? null : question.correctAnswer,
        });
    };

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-2">
                    <AppLabel htmlFor="qSelect" className="text-[10px] font-black uppercase tracking-widest mb-2 ml-1 text-muted-foreground block">Serial No.</AppLabel>
                    <input
                        id="qSelect"
                        type="number"
                        value={question.questionNumber}
                        onChange={(e) => updateField("questionNumber", parseInt(e.target.value) || 1)}
                        className="w-full h-12 px-5 bg-background border border-border/60 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all font-black text-lg shadow-inner"
                    />
                </div>
                <div className="space-y-2">
                    <AppLabel htmlFor="qPart" className="text-[10px] font-black uppercase tracking-widest mb-2 ml-1 text-muted-foreground block">Subsection (opt)</AppLabel>
                    <input
                        id="qPart"
                        value={question.questionPart || ""}
                        onChange={(e) => updateField("questionPart", e.target.value || null)}
                        placeholder="e.g., (a)"
                        className="w-full h-12 px-5 bg-background border border-border/60 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all font-black text-lg shadow-inner"
                    />
                </div>
                <div className="space-y-2 lg:col-span-2">
                    <AppLabel htmlFor="qType" className="text-[10px] font-black uppercase tracking-widest mb-2 ml-1 text-muted-foreground block">Taxonomy Type</AppLabel>
                    <AppDropdown
                        id="qType"
                        value={question.questionType}
                        onChange={(e) => {
                            const newType = e.target.value as any;
                            onChange({
                                ...question,
                                questionType: newType,
                                marks: DEFAULT_MARKS[newType] || question.marks
                            });
                        }}
                        options={[
                            { value: "ERQ", label: "ERQ (Extended Response)" },
                            { value: "CRQ", label: "CRQ (Constructed Response)" },
                            { value: "MCQ", label: "MCQ (Multiple Choice)" },
                        ]}
                        className="h-12 rounded-xl border-border/60 bg-background shadow-inner font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <AppLabel htmlFor="qMarks" className="text-[10px] font-black uppercase tracking-widest mb-2 ml-1 text-muted-foreground block">Marks</AppLabel>
                    <input
                        id="qMarks"
                        type="number"
                        value={question.marks}
                        onChange={(e) => updateField("marks", parseInt(e.target.value) || 1)}
                        className="w-full h-12 px-5 bg-background border border-border/60 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all font-black text-lg shadow-inner"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <AppLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prompt Specification</AppLabel>
                    <div className="flex items-center gap-1.5 bg-primary/5 text-primary px-3 py-1 rounded-full border border-primary/10">
                        <Sparkles className="h-3 w-3" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Mathematics Enabled</span>
                    </div>
                </div>
                <div className="border border-border/60 rounded-[2.5rem] overflow-hidden shadow-inner bg-background focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/40 transition-all">
                    <MathExpressionEditor
                        value={question.questionText}
                        onChange={(value) => updateField("questionText", value)}
                        placeholder="Enter the critical prompt here... Use Latex format for complex expressions."
                    />
                </div>
            </div>

            {question.questionType === "MCQ" && (
                <div className="animate-in fade-in zoom-in-95">
                    <MCQOptionsEditor
                        name={`correctAnswer-${question.id}`}
                        options={question.mcqOptions}
                        correctAnswer={question.correctAnswer}
                        onOptionsChange={(opts) => updateField("mcqOptions", opts)}
                        onCorrectAnswerChange={(id) => updateField("correctAnswer", id)}
                        onRemoveOption={removeMCQOption}
                        onAddOption={addMCQOption}
                    />
                </div>
            )}

            <div className="space-y-2">
                <AppLabel htmlFor="chap" className="text-[10px] font-black uppercase tracking-widest mb-2 ml-1 text-muted-foreground block">Curriculum Alignment (Unit)</AppLabel>
                <AppDropdown
                    id="chap"
                    value={question.chapterId || ""}
                    onChange={(e) => updateField("chapterId", e.target.value || null)}
                    options={chapters.map((ch: any) => ({ value: ch.id, label: ch.chapterName }))}
                    placeholder="Select Relevant Curriculum Unit"
                    className="h-12 rounded-xl border-border/60 bg-background shadow-inner font-medium"
                />
            </div>

            <div className="space-y-4">
                <AppLabel className="text-[10px] font-black uppercase tracking-widest mb-2 ml-1 text-muted-foreground block">
                    Visual Support (Image)
                </AppLabel>
                
                {question.imageUrl ? (
                    <div className="relative group w-fit">
                        <img 
                            src={question.imageUrl} 
                            alt="Question support" 
                            className="max-h-48 rounded-2xl border-2 border-primary/20 bg-muted/20 object-contain"
                        />
                        <button
                            type="button"
                            onClick={() => updateField("imageUrl", null)}
                            className="absolute -top-3 -right-3 h-8 w-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <label 
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/60 rounded-3xl cursor-pointer hover:bg-muted/50 transition-all group focus-within:ring-2 focus-within:ring-primary focus-within:border-primary",
                                isUploading && "opacity-50 cursor-wait"
                            )}
                            onPaste={async (e) => {
                                const pastedFile = getFileFromPaste(e);
                                if (pastedFile) {
                                    await uploadImageFile(pastedFile);
                                }
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            onDrop={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const droppedFile = getFileFromDrop(e);
                                if (droppedFile) {
                                    await uploadImageFile(droppedFile);
                                }
                            }}
                            tabIndex={0}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {isUploading ? (
                                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                ) : (
                                    <>
                                        <ImageIcon className="h-8 w-8 text-primary/40 group-hover:text-primary transition-colors mb-2" />
                                        <p className="text-xs font-bold text-muted-foreground group-hover:text-foreground">Click, Paste or Drag image asset</p>
                                    </>
                                )}
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                        </label>
                    </div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <AppButton
                    type="button"
                    variant="default"
                    onClick={onSave}
                    className="flex-1 h-14 rounded-2xl font-black text-base shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all"
                >
                    <Save className="mr-3 h-5 w-5" /> Persist Item Changes
                </AppButton>
                <button
                    type="button"
                    onClick={onCancel}
                    className="h-14 px-10 bg-muted/50 hover:bg-muted text-muted-foreground font-bold rounded-2xl transition-all"
                >
                    Cancel Edit
                </button>
            </div>
        </div>
    );
}
