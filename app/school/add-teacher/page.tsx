"use client";

import React, { useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    ChevronRight,
    Copy,
    GraduationCap,
    Loader2,
    Lock,
    Mail,
    Plus,
    School,
    Trash2,
    UploadCloud,
    User,
    X,
} from "lucide-react";
import ClassroomSVG from "@/public/svgs/ClassroomSVG";
import MailSVG from "@/public/svgs/MailSVG";
import AddSVG from "@/public/svgs/AddSVG";
import { Typography } from "@/components/ui/Typography";
import AppInput from "@/components/AppInput";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import { cn } from "@/lib/utils";
import { Subject, Class } from "@/types/enums";
import { useSubjectNames } from "@/hooks/subjects/useSubjects";
import SearchableSubjectDropdown from "@/components/ui/SearchableSubjectDropdown";

export default function AddTeacherPage() {
    const [isPending, setIsPending] = useState(false);
    const subjectNamesFromApi = useSubjectNames();
    const subjectNames = subjectNamesFromApi.length > 0 ? subjectNamesFromApi : Object.values(Subject);
    const [successData, setSuccessData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subjects: [] as string[],
        classes: [] as string[],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError(null);
    };

    const toggleSubject = (subj: string) => {
        const isSelected = formData.subjects.includes(subj);
        const newSubjects = isSelected
            ? formData.subjects.filter(s => s !== subj)
            : [...formData.subjects, subj];
        setFormData({ ...formData, subjects: newSubjects });
    };

    const toggleClass = (cls: string) => {
        const isSelected = formData.classes.includes(cls);
        const newClasses = isSelected
            ? formData.classes.filter(c => c !== cls)
            : [...formData.classes, cls];
        setFormData({ ...formData, classes: newClasses });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.subjects.length === 0) {
            setError("Please select at least one subject.");
            return;
        }
        if (formData.classes.length === 0) {
            setError("Please select at least one class.");
            return;
        }
        setIsPending(true);
        setError(null);

        try {
            const res = await fetch("/api/school/add-teacher", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                const message = data.message || data.error || "Failed to add teacher";
                throw new Error(message);
            }

            setSuccessData({
                ...formData,
                username: data.data.username,
            });

            // Reset form
            setFormData({
                name: "",
                email: "",
                subjects: [],
                classes: [],
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsPending(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Toast can be added here
    };

    if (successData) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[80vh] animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="w-full max-w-2xl space-y-8 text-center">
                    <div className="relative inline-block">
                        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                            <CheckCircle2 className="h-12 w-12" />
                        </div>
                        <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary text-background flex items-center justify-center animate-bounce">
                            <GraduationCap className="h-4 w-4" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Typography variant="h1" className="text-3xl font-black text-foreground tracking-tight">
                            Teacher Added!
                        </Typography>
                        <Typography variant="muted">
                            {successData.name} has been successfully registered as a teacher.
                        </Typography>
                    </div>

                    <AppCard className="p-6 text-left space-y-4 border-primary/20 bg-primary/5 shadow-xl">
                        <Typography className="text-xs font-black uppercase text-primary/70 tracking-widest">Teacher invitation</Typography>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-background/50 rounded-xl border border-border/50 group hover:border-primary/30 transition-all">
                                <div>
                                    <Typography className="text-[10px] uppercase font-bold text-muted-foreground">Login Email</Typography>
                                    <Typography className="font-bold text-sm tracking-tight">{successData.email}</Typography>
                                </div>
                                <button onClick={() => copyToClipboard(successData.email)} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors opacity-0 group-hover:opacity-100">
                                    <Copy className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <div className="pt-2">
                            <div className="flex items-center gap-2 text-[10px] text-amber-600 font-bold bg-amber-500/10 p-2 rounded-lg">
                                <AlertCircle className="h-3 w-3" />
                                <span>A one-time password setup code was emailed to the teacher. They can use Reset Password to choose their password.</span>
                            </div>
                        </div>
                    </AppCard>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <AppButton
                            onClick={() => setSuccessData(null)}
                            className="flex-1 h-12 rounded-2xl font-bold shadow-lg shadow-primary/20"
                        >
                            Add Another Teacher
                        </AppButton>
                        <AppButton
                            variant="outline"
                            className="flex-1 h-12 rounded-2xl font-bold"
                            onClick={() => setSuccessData(null)}
                        >
                            Done
                        </AppButton>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary">
                        <GraduationCap className="h-5 w-5" />
                        <span className="text-xs font-black uppercase tracking-widest">Teacher Management</span>
                    </div>
                    <Typography variant="h1" className="text-3xl font-black tracking-tight">Add New Teacher</Typography>
                    <Typography variant="muted" className="text-sm">Onboard an educator to your institution.</Typography>
                </div>

                <div className="flex items-center p-4 bg-primary/10 rounded-2xl border border-primary/20 gap-4">
                    <div className="p-2 bg-primary/20 rounded-xl">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <Typography variant="muted" className="text-[10px] leading-tight font-medium">
                        Teachers added here are <span className="text-primary font-bold">automatically verified</span>.
                    </Typography>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
                <div className="lg:col-span-2 space-y-6">
                    <AppCard className="p-8 space-y-6 border-primary/10 shadow-xl overflow-visible">
                        <div className="flex items-center gap-3 pb-2 border-b border-border/10">
                            <Typography className="font-bold">Teacher Basic Information</Typography>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Typography variant="muted" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Full Name</Typography>
                                <div className="relative group">
                                    <AppInput
                                        name="name"
                                        placeholder="Ex: Prof. Sarah Smith"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="h-12 bg-muted/30 border-border/20 focus:border-primary transition-all rounded-xl pl-4 pr-11 text-sm font-medium"
                                    />
                                    <User className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Typography variant="muted" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Official Email</Typography>
                                <div className="relative group">
                                    <AppInput
                                        type="email"
                                        name="email"
                                        placeholder="teacher@school.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="h-12 bg-muted/30 border-border/20 focus:border-primary transition-all rounded-xl pl-4 pr-11 text-sm font-medium"
                                    />
                                    <MailSVG className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <Typography variant="muted" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Subjects Specialization</Typography>
                            <SearchableSubjectDropdown
                                selectedSubjects={formData.subjects}
                                onChange={(subjects) => setFormData({ ...formData, subjects })}
                                placeholder="Search and select specialized subjects..."
                            />
                        </div>

                        <div className="space-y-3 pt-2">
                            <Typography variant="muted" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Classes Assigned</Typography>
                            <div className="grid grid-cols-4 gap-2">
                                {Object.values(Class).map((cls) => (
                                    <button
                                        key={cls}
                                        type="button"
                                        onClick={() => toggleClass(cls)}
                                        className={cn(
                                            "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all",
                                            formData.classes.includes(cls)
                                                ? "bg-primary text-background border-primary shadow-lg shadow-primary/20"
                                                : "bg-muted/30 border-border/20 text-muted-foreground hover:border-primary/50"
                                        )}
                                    >
                                        {formData.classes.includes(cls) ? <CheckCircle2 className="h-3 w-3" /> : <AddSVG className="h-3 w-3" />}
                                        {cls}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in shake duration-500">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-4 pt-4">
                            <AppButton
                                type="button"
                                variant="ghost"
                                className="px-8 rounded-xl font-bold"
                                onClick={() => window.location.href = "/school/dashboard"}
                                disabled={isPending}
                            >
                                Cancel
                            </AppButton>
                            <AppButton
                                type="submit"
                                disabled={isPending}
                                className="px-12 h-12 rounded-2xl font-black shadow-xl shadow-primary/20 flex items-center gap-3 min-w-[200px]"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Adding Teacher...
                                    </>
                                ) : (
                                    <>
                                        Add Teacher
                                        <ChevronRight className="h-5 w-5" />
                                    </>
                                )}
                            </AppButton>
                        </div>
                    </AppCard>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 flex flex-col gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl w-fit">
                            <ClassroomSVG className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <Typography className="font-bold text-sm">Role & Capabilities</Typography>
                            <Typography variant="muted" className="text-xs leading-relaxed mt-2">
                                Teachers can:
                                <ul className="mt-2 space-y-2 list-disc list-inside text-primary/80 font-medium">
                                    <li>Grade Paper 2 attempts</li>
                                    <li>Create assignments & quizzes</li>
                                    <li>Track student performance</li>
                                    <li>Manage subject content</li>
                                </ul>
                            </Typography>
                        </div>
                    </div>

                    <div className="p-6 bg-amber-500/5 rounded-[2rem] border border-amber-500/10 flex flex-col gap-4">
                        <div className="p-3 bg-amber-500/10 rounded-2xl w-fit">
                            <AlertCircle className="h-6 w-6 text-amber-500" />
                        </div>
                        <div>
                            <Typography className="font-bold text-sm">Important Note</Typography>
                            <Typography variant="muted" className="text-xs leading-relaxed mt-1 text-amber-700/70">
                                Please ensure the email is correct. A one-time password setup code will be emailed to the teacher.
                            </Typography>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
