"use client";

import React, { useEffect, useState } from "react";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppState from "@/components/AppState";
import AppTabs from "@/components/AppTabs";
import LeaderboardView, { LeaderboardEntry } from "@/components/LeaderboardView";
import apiInstance from "@/lib/api-instance";
import AppLoader from "@/components/AppLoader";
import LeaderboardCarousel, { CarouselStudent, CarouselSchool } from "@/components/LeaderboardCarousel";
import { LeaderboardTab } from "@/types/enums";
import { calculateLevel, formatSchoolName } from "@/lib/utils";
import ChallengeSVG from "@/public/svgs/ChallengeSVG";
import BuildingSVG from "@/public/svgs/BuildingSVG";

interface LeaderboardApiItem {
    id: string;
    name: string;
    points: number;
    username?: string;
    schoolName?: string;
    studentCount?: string | number;
    class?: string | number;
    city?: string;
    profilePic?: string;
    profilePicture?: string;
}

interface LeaderboardApiResponse {
    success: boolean;
    data?: LeaderboardApiItem[];
}

export default function LeaderboardContent({ initialTab = LeaderboardTab.STUDENTS }: { initialTab?: LeaderboardTab }) {
    const [users, setUsers] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<LeaderboardTab>(initialTab);
    const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

    // Filters State
    const [userCity, setUserCity] = useState<string>("All Cities");
    const [userClass, setUserClass] = useState<string>("X");
    const [userBoard, setUserBoard] = useState<string>("Federal Board");
    // Search and filtering handled directly within LeaderboardView across full dataset

    // Derive carousel data from fetched leaderboard data
    const topStudents: CarouselStudent[] = activeTab === LeaderboardTab.STUDENTS 
        ? users.slice(0, 5).map((user, idx) => ({
            id: user.id || String(idx),
            name: user.name,
            username: user.username || `@${user.name.toLowerCase().replace(/\s/g, "_")}`,
            level: calculateLevel(user.points),
            rank: idx + 1,
            badges: idx === 0 ? ["Global Leader"] : idx < 3 ? ["Top 3"] : ["Elite"],
            points: user.points,
            profilePic: user.profilePic,
        }))
        : [];

    const topSchools: CarouselSchool[] = activeTab === LeaderboardTab.SCHOOLS 
        ? users.slice(0, 5).map((school, idx) => {
            const raw = school as unknown as LeaderboardApiItem;
            const studentCountVal = raw.studentCount ?? raw.class ?? 0;
            const studentCountNum = typeof studentCountVal === "number" ? studentCountVal : parseInt(String(studentCountVal), 10) || 0;
            return {
                id: school.id || String(idx),
                name: formatSchoolName(school.name) || school.name,
                rank: idx + 1,
                points: school.points,
                studentCount: studentCountNum,
                location: raw.city,
                isVerified: true
            };
        })
        : [];

    const hasActiveFilters =
        userCity !== "All Cities" ||
        userClass !== "X" ||
        userBoard !== "Federal Board";

    const filterDropdowns = [
        {
            id: "board-filter",
            label: "Board",
            value: userBoard,
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setUserBoard(e.target.value),
            options: ["Federal Board", "AKUEB", "Sindh Board"].map((board) => ({
                value: board,
                label: board,
            })),
        },
        {
            id: "city-filter",
            label: "City",
            value: userCity,
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setUserCity(e.target.value),
            options: ["All Cities", "Karachi", "Lahore", "Islamabad"].map((city) => ({
                value: city,
                label: city,
            })),
        },
    ];

    useEffect(() => {
        const storedUser = localStorage.getItem("exboard_user");
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                if (userData.city) setUserCity(userData.city);
                if (userData.class) setUserClass(userData.class);
                if (userData.id) setCurrentUserId(userData.id);
            } catch (e) {
                console.error("Failed to parse user data", e);
            }
        }
    }, []);

    const fetchLeaderboard = React.useCallback(async () => {
        try {
            setLoading(true);
            const params = { 
                type: activeTab,
                city: userCity !== "All Cities" ? userCity : undefined
            };
            
            const response = await apiInstance.get("/leaderboard", { params }) as LeaderboardApiResponse;
            if (response.success) {
                const results: LeaderboardEntry[] = (response.data || []).map((item, idx) => ({
                    id: item.id,
                    name: activeTab === LeaderboardTab.SCHOOLS ? formatSchoolName(item.name) : item.name,
                    points: item.points,
                    rank: idx + 1,
                    schoolName: item.schoolName ? formatSchoolName(item.schoolName) : item.schoolName,
                    username: item.username || (activeTab === LeaderboardTab.STUDENTS ? `@${item.name.toLowerCase().replace(/\s/g, "_")}` : undefined),
                    trend: idx % 3 === 0 ? "up" : idx % 3 === 1 ? "down" : "stable",
                    profilePic: item.profilePic || item.profilePicture,
                }));
                setUsers(results);
            }
        } catch (error: unknown) {
            const err = error as Error;
            console.error("Error fetching leaderboard:", err.message || error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, userCity]);

    useEffect(() => {
        void fetchLeaderboard();
    }, [fetchLeaderboard]);

    if (loading) {
        return <AppLoader />;
    }

    return (
        <PageContainer>
            <PageHeader
                title="Leaderboard"
                description={activeTab === LeaderboardTab.STUDENTS ? "See how you rank against other students." : "Top performing schools across the platform."}
                showLine={true}
            />

            {(topStudents.length > 0 || topSchools.length > 0) ? (
                <LeaderboardCarousel 
                    key={activeTab}
                    students={topStudents} 
                    schools={topSchools} 
                    intervalMs={60000} 
                    type={activeTab}
                />
            ) : null}

            {/* Tabs / Filter */}
            <div className="mb-10">
                <AppTabs
                    fullWidth
                    className="w-full sm:w-fit"
                    tabs={[
                        { label: "Students", value: LeaderboardTab.STUDENTS, icon: ChallengeSVG },
                        { label: "Schools", value: LeaderboardTab.SCHOOLS, icon: BuildingSVG },
                    ]}
                    activeTab={activeTab}
                    onChange={(val) => {
                        setLoading(true);
                        setActiveTab(val as LeaderboardTab);
                    }}
                />
            </div>

            <AppState
                isLoading={loading}
                isEmpty={users.length === 0}
                title={activeTab === LeaderboardTab.STUDENTS ? "Competition Initializing" : "Gathering School Data"}
                description={activeTab === LeaderboardTab.STUDENTS 
                    ? "The leaderboard is being refreshed with latest performance data." 
                    : "Calculating institutional rankings based on student achievements."}
                fullScreen={false}
            >
                <LeaderboardView 
                    users={users} 
                    currentUserId={currentUserId} 
                    filterDropdowns={filterDropdowns}
                    hasActiveFilters={hasActiveFilters}
                    onClearFilters={() => {
                        setUserCity("All Cities");
                        setUserClass("X");
                        setUserBoard("Federal Board");
                    }}
                />
            </AppState>

            <div className="pb-10" />
        </PageContainer>
    );
}
