"use client";

import React from "react";
import { UserPlus, TrendingUp, Building2, Phone } from "lucide-react";
import StudentsSVG from "@/public/svgs/StudentsSVG";
import TrophySVG from "@/public/svgs/TrophySVG";
import MailSVG from "@/public/svgs/MailSVG";
import { Typography } from "@/components/ui/Typography";
import AppCard from "@/components/AppCard";
import AppLoader from "@/components/AppLoader";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useStoredUser } from "@/hooks/useStoredUser";

export default function SchoolDashboard() {
    const { user: schoolInfo, isReady } = useStoredUser();

    if (!isReady || !schoolInfo) {
        return <AppLoader className="min-h-[60vh]" />;
    }

    const stats = [
        {
            title: "Total Students",
            value: "0",
            icon: StudentsSVG,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            title: "Active Today",
            value: "0",
            icon: TrendingUp,
            color: "text-primary",
            bg: "bg-primary/10"
        },
        {
            title: "School Rank",
            value: "# --",
            icon: TrophySVG,
            color: "text-amber-500",
            bg: "bg-amber-500/10"
        }
    ];

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-primary/10 p-8 md:p-12 border border-primary/20">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-xl">
                                <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-primary/60">School Portal</span>
                        </div>
                        <Typography variant="h1" className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
                            Welcome, {schoolInfo.name}
                        </Typography>
                        <Typography variant="muted" className="text-sm md:text-base max-w-lg leading-relaxed">
                            Empower your students with AI-driven learning tools and track their progress in real-time.
                        </Typography>
                        <div className="flex flex-wrap gap-4 pt-2">
                            <Link href="/school/add-students">
                                <button className="flex items-center gap-2 px-6 py-3 bg-primary text-background font-bold rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-primary/20">
                                    <UserPlus className="h-4 w-4" />
                                    Add New Students
                                </button>
                            </Link>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 p-6 bg-background/50 backdrop-blur-md rounded-2xl border border-border/50 shadow-xl min-w-[280px]">
                        <div className="flex items-center gap-3">
                             {schoolInfo.profileImage ? (
                                <img src={schoolInfo.profileImage} alt="" className="h-12 w-12 rounded-full object-cover border-2 border-primary/20" />
                             ) : (
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                                    {schoolInfo.name?.charAt(0).toUpperCase()}
                                </div>
                             )}
                             <div>
                                <Typography className="font-bold text-sm truncate max-w-[180px]">{schoolInfo.name}</Typography>
                                <Typography className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">{schoolInfo.city || "Karachi, Pakistan"}</Typography>
                             </div>
                        </div>
                        <div className="space-y-2 pt-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <MailSVG className="h-3 w-3" />
                                {schoolInfo.email}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {schoolInfo.phone || "No phone added"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <AppCard key={index} className="p-6 flex items-center gap-6 border-none shadow-sm hover:shadow-md transition-shadow">
                        <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl`}>
                            <stat.icon className="h-8 w-8" />
                        </div>
                        <div className="space-y-0.5">
                            <Typography variant="muted" className="text-xs font-bold uppercase tracking-wider">{stat.title}</Typography>
                            <Typography className="text-3xl font-black tracking-tight">{stat.value}</Typography>
                        </div>
                    </AppCard>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <AppCard className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <Typography variant="h3" className="text-xl font-bold">Recent Registrations</Typography>
                        <Link href="/school/add-students" className="text-xs font-bold text-primary dark:text-white hover:underline">View All</Link>
                    </div>
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed border-border/10">
                        <div className="p-4 bg-background rounded-2xl shadow-sm">
                            <StudentsSVG className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <Typography className="font-bold">No students registered yet</Typography>
                            <Typography variant="muted" className="text-sm">Start adding your students to see them here.</Typography>
                        </div>
                        <Link href="/school/add-students">
                            <button className="px-6 py-2 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-colors mt-2 text-sm">
                                Register Students
                            </button>
                        </Link>
                    </div>
                </AppCard>

                <AppCard className="p-8 space-y-6">
                     <Typography variant="h3" className="text-xl font-bold">Institution Stats</Typography>
                     <div className="space-y-6 pt-4">
                        <div className="space-y-2">
                             <div className="flex justify-between text-xs font-bold">
                                 <span>Verification Status</span>
                                 <span className={schoolInfo.isVerified ? "text-primary" : "text-amber-500"}>
                                     {schoolInfo.isVerified ? "Verified" : "Pending Verification"}
                                 </span>
                             </div>
                             <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                 <div className={cn("h-full transition-all duration-1000", schoolInfo.isVerified ? "w-full bg-primary" : "w-1/2 bg-amber-500")} />
                             </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-muted/20 rounded-2xl space-y-1">
                                <Typography variant="muted" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">City</Typography>
                                <Typography className="text-sm font-bold">{schoolInfo.city || "Karachi"}</Typography>
                            </div>
                            <div className="p-4 bg-muted/20 rounded-2xl space-y-1">
                                <Typography variant="muted" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Phone</Typography>
                                <Typography className="text-sm font-bold truncate">{schoolInfo.phone || "---"}</Typography>
                            </div>
                        </div>

                        <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <TrendingUp className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <Typography className="text-xs font-bold">Get Detailed Insights</Typography>
                                <Typography variant="muted" className="text-[10px]">Upgrade to Premium to see detailed student analytics.</Typography>
                            </div>
                        </div>
                     </div>
                </AppCard>
            </div>
        </div>
    );
}
