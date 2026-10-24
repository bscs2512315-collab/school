"use client";

import React, { useState } from "react";
import {
    UserPlus,
    User,
    AtSign,
    BookOpen,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Copy,
    ChevronRight,
    Users
} from "lucide-react";
import MailSVG from "@/public/svgs/MailSVG";
import { Typography } from "@/components/ui/Typography";
import AppInput from "@/components/AppInput";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export default function AddStudentsPage() {
    const { resolvedTheme } = useTheme();
    const [isPending, setIsPending] = useState(false);
    const [successData, setSuccessData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        registrationId: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setError(null);

        try {
            const res = await fetch("/api/school/add-student", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                const message = Array.isArray(data.error)
                    ? data.error[0].message
                    : data.error || "Failed to add student";
                throw new Error(message);
            }

            setSuccessData({
                ...formData,
                id: data.data.id,
                username: data.data.username,
            });

            // Reset form
            setFormData({
                name: "",
                email: "",
                registrationId: "",
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsPending(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // You could add a toast notification here
    };

    if (successData) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[80vh] animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="w-full space-y-8 text-center">
                    <div className="relative inline-block">
                        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                            <CheckCircle2 className="h-12 w-12" />
                        </div>
                        <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary text-background flex items-center justify-center animate-bounce">
                            <UserPlus className="h-4 w-4" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Typography variant="h1" className="text-3xl font-black text-foreground tracking-tight">
                            Student Added!
                        </Typography>
                        <Typography variant="muted">
                            {successData.name} has been registered. A password setup code was emailed to the student.
                        </Typography>
                    </div>

                    <AppCard className="p-6 text-left space-y-4 border-primary/20 bg-primary/5 shadow-xl">
                        <Typography className="text-xs font-black uppercase text-primary/70 tracking-widest">Student invitation</Typography>
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
                                <span>The student can use Reset Password with the emailed code to choose a password before signing in.</span>
                            </div>
                        </div>
                    </AppCard>

                    <div className="flex flex-col gap-3 pt-4">
                        <AppButton
                            onClick={() => setSuccessData(null)}
                            className="w-full h-12 rounded-2xl font-bold shadow-lg shadow-primary/20"
                        >
                            Add Another Student
                        </AppButton>
                        <AppButton
                            variant="outline"
                            className="w-full h-12 rounded-2xl font-bold"
                            onClick={() => window.location.href = "/school/dashboard"}
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
                        <Users className="h-5 w-5" />
                        <span className="text-xs font-black uppercase tracking-widest">Student Management</span>
                    </div>
                    <Typography variant="h1" className="text-3xl font-black tracking-tight">Add New Student</Typography>
                    <Typography variant="muted" className="text-sm">Register a student manually to your institution.</Typography>
                </div>

                <div className="flex items-center p-4 bg-primary/10 rounded-2xl border border-primary/20 gap-4">
                    <div className="p-2 bg-primary/20 rounded-xl">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <Typography variant="muted" className="text-[10px] leading-tight font-medium">
                        Students added here are <span className="text-primary font-bold">automatically verified</span> and don't need OTP verification.
                    </Typography>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 mx-auto pb-20">
                <AppCard className="p-8 space-y-6 border-primary/10 shadow-xl overflow-visible relative">
                    <div className="absolute -top-4 -right-4 h-12 w-12 bg-primary/20 rounded-2xl blur-xl" />

                    <div className="flex items-center gap-3 pb-2 border-b border-border/10">
                        <Typography className="font-bold">Student Registration</Typography>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Typography variant="muted" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Student Full Name</Typography>
                            <div className="relative group">
                                <AppInput
                                    name="name"
                                    placeholder="Enter full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="h-12 bg-muted/30 border-border/20 focus:border-primary transition-all rounded-xl pl-4 pr-11 text-sm font-medium"
                                />
                                <User className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Typography variant="muted" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Student Email</Typography>
                            <div className="relative group">
                                <AppInput
                                    type="email"
                                    name="email"
                                    placeholder="student@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="h-12 bg-muted/30 border-border/20 focus:border-primary transition-all rounded-xl pl-4 pr-11 text-sm font-medium"
                                />
                                <MailSVG className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Typography variant="muted" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Internal Registration ID / Roll No.</Typography>
                            <div className="relative group">
                                <AppInput
                                    name="registrationId"
                                    placeholder="Ex: REG-10293"
                                    value={formData.registrationId}
                                    onChange={handleChange}
                                    required
                                    className="h-12 bg-muted/30 border-border/20 focus:border-primary transition-all rounded-xl pl-4 pr-11 text-sm font-medium"
                                />
                                <AtSign className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            </div>
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
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Register Student
                                    <ChevronRight className="h-5 w-5" />
                                </>
                            )}
                        </AppButton>
                    </div>
                </AppCard>

                <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <Typography className="font-bold text-sm">Minimal Entry, Better UX</Typography>
                        <Typography variant="muted" className="text-xs leading-relaxed mt-1">
                            The student will receive a one-time password setup code by email, then complete their profile after signing in.
                        </Typography>
                    </div>
                </div>
            </form>
        </div>
    );
}
