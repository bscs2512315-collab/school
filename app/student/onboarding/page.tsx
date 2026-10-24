"use client";

import React, { useState } from "react";
import { 
    User, 
    Calendar, 
    Loader2, 
    CheckCircle2, 
    ArrowRight, 
    ShieldCheck,
    LogOut
} from "lucide-react";
import LockSVG from "@/public/svgs/LockSVG";
import UserSVG from "@/public/svgs/UserSVG";
import { Typography } from "@/components/ui/Typography";
import AppInput from "@/components/AppInput";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppDropdown from "@/components/AppDropdown";
import { PAKISTAN_CITIES, getGroupsForClass } from "@/constants";
import { logoutAuthSession, setAuthSession } from "@/lib/auth-session";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FRONTEND_ROUTES } from "@/constants/endpoints";

export default function OnboardingPage() {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        fatherName: "",
        dob: "",
        gender: "",
        class: "",
        stream: "",
        city: "",
        password: "",
        confirmPassword: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError(null);
    };

    const handleLogout = async () => {
        try {
            await logoutAuthSession();
            window.location.replace("/login");
        } catch {
            setError("Could not sign out. Please try again.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsPending(true);
        setError(null);

        try {
            const res = await fetch("/api/student/complete-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                const message = Array.isArray(data.error) 
                    ? data.error[0].message 
                    : data.error || "Failed to complete profile";
                throw new Error(message);
            }

            setIsSuccess(true);
            
            // Save updated user data and redirect to dashboard
            setAuthSession(data.data);
            
            router.replace("/student/dashboard");

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to complete profile");
        } finally {
            setIsPending(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
                    <div className="relative inline-block">
                        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                            <CheckCircle2 className="h-12 w-12" />
                        </div>
                        <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary text-background flex items-center justify-center animate-bounce">
                            <ShieldCheck className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Typography variant="h1" className="text-3xl font-black tracking-tight">Profile Updated!</Typography>
                        <Typography variant="muted" className="text-lg">
                            Your account is now ready. Redirecting you to your dashboard...
                        </Typography>
                    </div>
                    <div className="pt-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 py-12">
            <div className="w-full space-y-8">
                {/* Header Section */}
                <div className="text-center space-y-4 relative">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-2xl border border-primary/20 animate-in fade-in slide-in-from-top-4 duration-700">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">First-Time Setup</span>
                    </div>
                    <div className="space-y-1">
                        <Typography variant="h1" className="text-4xl font-black tracking-tight text-foreground">
                            Complete Your <span className="text-primary">Profile</span>
                        </Typography>
                        <Typography variant="muted" className="text-lg max-w-md mx-auto">
                            Your school has registered you. Please provide a few more details to unlock your dashboard.
                        </Typography>
                    </div>
                    
                    <button 
                        onClick={handleLogout}
                        className="absolute right-0 top-0 p-2 text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1 text-xs font-bold"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <AppCard className="p-8 space-y-8 border-primary/10 shadow-2xl overflow-visible relative">
                        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl -z-10" />
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl -z-10" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Basic Details */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-2 border-b border-border/10">
                                    <div className="p-1.5 bg-primary/10 rounded-lg">
                                        <User className="h-4 w-4 text-primary" />
                                    </div>
                                    <Typography className="font-bold text-base">Personal Details</Typography>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Father&apos;s Name</label>
                                        <div className="relative group">
                                            <AppInput 
                                                name="fatherName"
                                                placeholder="Enter father's name"
                                                value={formData.fatherName}
                                                onChange={handleChange}
                                                required
                                                className="h-12 bg-muted/30 border-border/20 focus:border-primary transition-all rounded-xl pl-4 pr-11 text-sm font-medium"
                                            />
                                            <UserSVG className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Date of Birth</label>
                                        <div className="relative group">
                                            <AppInput 
                                                type="date"
                                                name="dob"
                                                value={formData.dob}
                                                onChange={handleChange}
                                                onClick={(e) => (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.()}
                                                required
                                                className="h-12 bg-muted/30 border-border/20 focus:border-primary transition-all rounded-xl pl-4 pr-11 text-sm font-medium"
                                            />
                                            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Gender</label>
                                            <AppDropdown
                                                name="gender"
                                                value={formData.gender}
                                                onChange={handleChange}
                                                placeholder="Select"
                                                className="bg-muted/30 border-border/20"
                                                options={[
                                                    { value: "Male", label: "Male" },
                                                    { value: "Female", label: "Female" },
                                                    { value: "Other", label: "Other" },
                                                ]}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Class</label>
                                            <AppDropdown
                                                name="class"
                                                value={formData.class}
                                                onChange={handleChange}
                                                placeholder="Select"
                                                className="bg-muted/30 border-border/20"
                                                options={[
                                                    { value: "IX", label: "IX" },
                                                    { value: "X", label: "X" },
                                                    { value: "XI", label: "XI" },
                                                    { value: "XII", label: "XII" },
                                                ]}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Group</label>
                                        <AppDropdown
                                            name="stream"
                                            value={formData.stream}
                                            onChange={handleChange}
                                            placeholder="Select Group"
                                            className="bg-muted/30 border-border/20"
                                            options={getGroupsForClass(formData.class).map((g) => ({ value: g, label: g }))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">City</label>
                                        <AppDropdown
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            placeholder="Select City"
                                            className="bg-muted/30 border-border/20"
                                            searchable
                                            options={PAKISTAN_CITIES.map((city) => ({ value: city, label: city }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Security Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-2 border-b border-border/10">
                                    <div className="p-1.5 bg-primary/10 rounded-lg">
                                        <LockSVG className="size-4 text-primary" />
                                    </div>
                                    <Typography className="font-bold text-base">Security</Typography>
                                </div>

                                <div className="space-y-4">
                                     <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-3">
                                        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                        <Typography variant="muted" className="text-[10px] leading-relaxed">
                                            Please set a unique password. You&apos;ll use this password from now on to log in to ExBoard AI.
                                        </Typography>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">New Password</label>
                                        <div className="relative group">
                                            <AppInput 
                                                type="password"
                                                name="password"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                                className="h-12 bg-muted/30 border-border/20 focus:border-primary transition-all rounded-xl pl-4 pr-11 text-sm font-medium"
                                            />
                                            <LockSVG className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Confirm Password</label>
                                        <div className="relative group">
                                            <AppInput 
                                                type="password"
                                                name="confirmPassword"
                                                placeholder="••••••••"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                required
                                                className="h-12 bg-muted/30 border-border/20 focus:border-primary transition-all rounded-xl pl-4 pr-11 text-sm font-medium"
                                            />
                                            <LockSVG className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in shake duration-500">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                {error}
                            </div>
                        )}

                        <AppButton 
                            type="submit"
                            disabled={isPending}
                            className="w-full h-14 rounded-[1.25rem] font-black text-lg shadow-2xl shadow-primary/20 flex items-center justify-center gap-3"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    Saving Profile...
                                </>
                            ) : (
                                <>
                                    Complete Setup & Start Learning
                                    <ArrowRight className="h-6 w-6" />
                                </>
                            )}
                        </AppButton>
                    </AppCard>

                    <Typography variant="muted" className="text-center text-xs">
                        By completing your setup, you agree to our{" "}
                        <Link
                            href={FRONTEND_ROUTES.TERMS}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                        >
                            Terms &amp; Conditions
                        </Link>{" "}
                        and{" "}
                        <Link
                            href={FRONTEND_ROUTES.PRIVACY}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                        >
                            Privacy Policy
                        </Link>
                        .
                    </Typography>
                </form>
            </div>
        </div>
    );
}

// Add a simple AlertCircle icon if missing from lucide-react imports above
const AlertCircle = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);
