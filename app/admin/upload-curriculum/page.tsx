"use client";

import { ArrowLeft, Upload, CheckCircle2, Loader2 } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import AppLabel from "@/components/AppLabel";
import PageHeader from "@/components/PageHeader";
import AppButton from "@/components/AppButton";
import { Typography } from "@/components/ui/Typography";
import { useRouter } from "next/navigation";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { useState } from "react";
import { Class, Board, Subject } from "@/types/enums";
import toast from "react-hot-toast";
import { useUploadAdminCurriculum } from "@/hooks/admin/useAdminUploads";
import { useSubjectNames } from "@/hooks/subjects/useSubjects";

export default function UploadCurriculumPage() {
    const router = useRouter();
    const subjectNamesFromApi = useSubjectNames();
    const subjectNames = subjectNamesFromApi.length > 0 ? subjectNamesFromApi : Object.values(Subject);
    const [formData, setFormData] = useState({
        class: "" as Class | "",
        board: "" as Board | "",
        subject: "" as Subject | "",
        file: null as File | null,
    });
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [result, setResult] = useState<{ chaptersCount: number; analyzed: boolean } | null>(null);
    const uploadMutation = useUploadAdminCurriculum();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
                toast.error("Only PDF files are allowed");
                return;
            }
            setFormData({ ...formData, file });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.class || !formData.board || !formData.subject || !formData.file) {
            toast.error("Please fill all fields and select a file");
            return;
        }

        try {
            const uploadFormData = new FormData();
            uploadFormData.append("class", formData.class);
            uploadFormData.append("board", formData.board);
            uploadFormData.append("subject", formData.subject);
            uploadFormData.append("file", formData.file);

            const data = await uploadMutation.mutateAsync(uploadFormData);
            setResult(data);
            setUploadSuccess(true);
            toast.success("Curriculum uploaded successfully!");
        } catch (error) {
            console.error("Upload error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to upload curriculum");
        }
    };


    // ... Inside UploadCurriculumPage component
    return (
        <PageContainer>
            <PageHeader
                title="Upload Curriculum"
                onBack={() => router.push(FRONTEND_ROUTES.ADMIN_DASHBOARD)}
            />

            {/* Success Modal (enhanced look) */}
            {uploadSuccess && result && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm transition-all animate-in fade-in duration-300">
                    <div className="bg-card border border-border rounded-3xl p-8 sm:p-10 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="bg-green-500/10 p-4 rounded-full">
                                <CheckCircle2 className="h-16 w-16 text-green-500" />
                            </div>
                            <div className="space-y-2">
                                <Typography variant="h2" className="text-2xl font-bold">
                                    Curriculum Processed!
                                </Typography>
                                <Typography variant="muted">
                                    {result.analyzed
                                        ? `AI has successfully extracted ${result.chaptersCount} chapters from the curriculum.`
                                        : "Your curriculum document has been uploaded for background analysis."}
                                </Typography>
                            </div>
                            <div className="flex flex-col gap-3 w-full">
                                <AppButton
                                    variant="default"
                                    onClick={() => router.push(FRONTEND_ROUTES.ADMIN_DASHBOARD)}
                                    className="w-full h-12 rounded-xl"
                                >
                                    Go to Dashboard
                                </AppButton>
                                <AppButton
                                    variant="secondary"
                                    onClick={() => {
                                        setUploadSuccess(false);
                                        setFormData({
                                            class: "" as Class | "",
                                            board: "" as Board | "",
                                            subject: "" as Subject | "",
                                            file: null,
                                        });
                                        setResult(null);
                                    }}
                                    className="w-full h-12 rounded-xl"
                                >
                                    Upload Another
                                </AppButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Form (enhanced look) */}
            {!uploadSuccess && (
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            {/* Class Selection */}
                            <div className="space-y-2">
                                <AppLabel htmlFor="class" required>
                                    Class
                                </AppLabel>
                                <select
                                    name="class"
                                    id="class"
                                    value={formData.class}
                                    onChange={handleChange}
                                    className="flex h-12 w-full rounded-xl border border-input bg-background px-5 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 transition-all"
                                    required
                                >
                                    <option value="">Select Class</option>
                                    {Object.values(Class).map((cls) => (
                                        <option key={cls} value={cls}>
                                            {cls}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Board Selection */}
                            <div className="space-y-2">
                                <AppLabel htmlFor="board" required>
                                    Board
                                </AppLabel>
                                <select
                                    name="board"
                                    id="board"
                                    value={formData.board}
                                    onChange={handleChange}
                                    className="flex h-12 w-full rounded-xl border border-input bg-background px-5 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 transition-all"
                                    required
                                >
                                    <option value="">Select Board</option>
                                    {Object.values(Board).map((board) => (
                                        <option key={board} value={board}>
                                            {board}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject Selection */}
                            <div className="space-y-2">
                                <AppLabel htmlFor="subject" required>
                                    Subject
                                </AppLabel>
                                <select
                                    name="subject"
                                    id="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className="flex h-12 w-full rounded-xl border border-input bg-background px-5 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 transition-all"
                                    required
                                >
                                    <option value="">Select Subject</option>
                                    {subjectNames.map((subject) => (
                                        <option key={subject} value={subject}>
                                            {subject}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* File Upload */}
                            <div className="space-y-3">
                                <AppLabel required>
                                    Curriculum PDF
                                </AppLabel>
                                <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all group cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        id="file-upload"
                                        required
                                    />
                                    <div className="flex flex-col items-center space-y-3">
                                        <div className="bg-muted p-4 rounded-full group-hover:bg-primary/10 transition-colors">
                                            <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <div>
                                            <Typography variant="muted" className="text-foreground font-semibold">
                                                {formData.file ? formData.file.name : "Choose a curriculum file"}
                                            </Typography>
                                            <Typography variant="small" className="text-xs text-muted-foreground mt-1">
                                                Only PDF files are supported (Max 10MB)
                                            </Typography>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <AppButton
                        type="submit"
                        variant="default"
                        size="lg"
                        className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all"
                        disabled={uploadMutation.isPending}
                    >
                        {uploadMutation.isPending ? (
                            <>
                                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                AI Analyzing SLOs...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-3 h-5 w-5" />
                                Upload & Start Analysis
                            </>
                        )}
                    </AppButton>
                </form>
            )}
        </PageContainer>
    );
}

