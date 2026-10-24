"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Save, Loader2, CheckCircle, AlertCircle, Shield, AtSign, School, Calendar } from "lucide-react";
import UserSVG from "@/public/svgs/UserSVG";
import LocationSVG from "@/public/svgs/LocationSVG";
import CameraSVG from "@/public/svgs/CameraSVG";
import StarSVG from "@/public/svgs/StarSVG";
import ClassroomSVG from "@/public/svgs/ClassroomSVG";
import MailSVG from "@/public/svgs/MailSVG";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppLoader from "@/components/AppLoader";
import AppButton from "@/components/AppButton";
import AppDropdown from "@/components/AppDropdown";
import { Typography } from "@/components/ui/Typography";
import { Input } from "@/components/ui/input";
import apiInstance from "@/lib/api-instance";
import { UserRole } from "@/types/enums";
import type { UserProfile } from "@/types/user";
import { cn } from "@/lib/utils";
import { PAKISTAN_CITIES } from "@/constants";
import ImageCropper from "@/components/ImageCropper";
import SettingsAvatarPicker from "@/components/settings/SettingsAvatarPicker";
import UserAvatar from "@/components/UserAvatar";
import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiPut } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useQueryClient } from "@tanstack/react-query";
import PushNotificationCard from "@/components/notifications/PushNotificationCard";

const DEFAULT_SCHOOLS = [
    "IISAR Foundation Higher Secondary School & College",
    "Happy Palace Group of Schools",
    "College for Advanced Studies CAS-HPGS",
    "Sultan Muhammad Shah Secondary School",
    "Aga Khan College",
] as const;

function formatDobForInput(value: unknown): string {
    if (!value) return "";
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return "";
        const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
        if (match) return match[1];
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split("T")[0];
        }
    }
    if (value instanceof Date && !isNaN(value.getTime())) {
        return value.toISOString().split("T")[0];
    }
    return "";
}

interface ProfileData {
    id: string;
    name: string;
    email: string;
    class: string | null;
    board: string | null;
    schoolName: string | null;
    phone: string | null;
    address: string | null;
    studentCount: string | null;
    points: number;
    rank: number | null;
    role: string;
    profileImage: string | null;
    username: string | null;
    city: string | null;
    fatherName: string | null;
    dob: string | null;
    gender: string | null;
}

export default function SettingsContent() {
    const queryClient = useQueryClient();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [schools, setSchools] = useState<string[]>([...DEFAULT_SCHOOLS]);
    const [isOtherSchool, setIsOtherSchool] = useState(false);

    // Image cropping state
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isCropping, setIsCropping] = useState(false);

    // Editable form state
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        fatherName: "",
        dob: "",
        gender: "",
        class: "",
        board: "",
        schoolName: "",
        customSchool: "",
        city: "",
        phone: "",
        address: "",
        studentCount: "",
    });

    useEffect(() => {
        fetchProfile();
        // Fetch schools for dropdown
        fetch("/api/schools")
            .then(res => res.json())
            .then(data => {
                // /api/schools returns objects ({ id, name, ... }); normalize to names
                const names = Array.isArray(data)
                    ? data
                        .map((s) => (typeof s === "string" ? s : s?.name))
                        .filter((name): name is string => Boolean(name))
                    : [];
                if (names.length) setSchools(names);
            })
            .catch(() => setSchools([...DEFAULT_SCHOOLS]));
    }, []);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const fetchProfile = async () => {
        try {
            const response = (await apiInstance.get("/user/profile")) as {
                success: boolean;
                data: UserProfile;
            };
            if (response.success && response.data) {
                const data = response.data;
                setProfile(data);

                // Check if schoolName is in the dropdown list
                const knownSchool = (DEFAULT_SCHOOLS as readonly string[]).includes(data.schoolName || "");
                const hasCustomSchool = Boolean(data.schoolName && !knownSchool);

                setIsOtherSchool(hasCustomSchool);
                setFormData({
                    name: data.name || "",
                    username: data.username || "",
                    fatherName: data.fatherName || "",
                    dob: formatDobForInput(data.dob),
                    gender: data.gender || "",
                    class: data.class || "",
                    board: data.board || "",
                    schoolName: hasCustomSchool ? "Other" : (data.schoolName || ""),
                    customSchool: hasCustomSchool ? data.schoolName || "" : "",
                    city: data.city || "",
                    phone: data.phone || "",
                    address: data.address || "",
                    studentCount: data.studentCount || "",
                });
            }
        } catch (error: unknown) {
            const err = error as Error;
            setToast({ type: "error", message: err.message || "Failed to load profile" });
        } finally {
            setIsLoading(false);
        }
    };

    const initialFormData = useMemo(() => {
        if (!profile) return null;
        const knownSchool = (DEFAULT_SCHOOLS as readonly string[]).includes(profile.schoolName || "");
        const hasCustomSchool = Boolean(profile.schoolName && !knownSchool);
        return {
            name: profile.name || "",
            username: profile.username || "",
            fatherName: profile.fatherName || "",
            dob: formatDobForInput(profile.dob),
            gender: profile.gender || "",
            class: profile.class || "",
            board: profile.board || "",
            schoolName: hasCustomSchool ? "Other" : (profile.schoolName || ""),
            customSchool: hasCustomSchool ? profile.schoolName || "" : "",
            city: profile.city || "",
            phone: profile.phone || "",
            address: profile.address || "",
            studentCount: profile.studentCount || "",
        };
    }, [profile]);

    const isDirty = useMemo(() => {
        if (!initialFormData) return false;
        return (
            formData.name !== initialFormData.name ||
            formData.username !== initialFormData.username ||
            formData.fatherName !== initialFormData.fatherName ||
            formData.dob !== initialFormData.dob ||
            formData.gender !== initialFormData.gender ||
            formData.class !== initialFormData.class ||
            formData.board !== initialFormData.board ||
            formData.schoolName !== initialFormData.schoolName ||
            formData.customSchool !== initialFormData.customSchool ||
            formData.city !== initialFormData.city ||
            formData.phone !== initialFormData.phone ||
            formData.address !== initialFormData.address ||
            formData.studentCount !== initialFormData.studentCount
        );
    }, [formData, initialFormData]);

    const handleSave = async () => {
        if (!profile || !isDirty) return;
        setIsSaving(true);

        try {
            const finalSchool = isOtherSchool ? formData.customSchool : formData.schoolName;
            const updateData: Record<string, string> = {
                name: formData.name,
                username: formData.username,
            };

            if (profile.role === UserRole.STUDENT) {
                updateData.class = formData.class;
                updateData.board = formData.board;
                updateData.schoolName = finalSchool;
                updateData.city = formData.city;
                updateData.fatherName = formData.fatherName;
                updateData.dob = formData.dob;
                updateData.gender = formData.gender;
            } else if (profile.role === UserRole.SCHOOL) {
                updateData.phone = formData.phone;
                updateData.address = formData.address;
                updateData.studentCount = formData.studentCount;
            }

            const response = (await apiInstance.put("/user/profile", updateData)) as {
                success: boolean;
                message?: string;
            };
            if (response.success) {
                // Update localStorage
                const storedUser = localStorage.getItem("exboard_user");
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    parsed.name = formData.name;
                    parsed.username = formData.username;
                    if (formData.class) parsed.class = formData.class;
                    if (formData.dob) parsed.dob = formData.dob;
                    if (formData.fatherName) parsed.fatherName = formData.fatherName;
                    if (formData.gender) parsed.gender = formData.gender;
                    localStorage.setItem("exboard_user", JSON.stringify(parsed));
                }
                setToast({ type: "success", message: "Profile updated successfully!" });
            }
        } catch (error: unknown) {
            const err = error as Error;
            setToast({ type: "error", message: err.message || "Failed to update profile" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create a URL for the selected image
        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImage(reader.result as string);
            setIsCropping(true);
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        setIsCropping(false);
        setIsUploading(true);
        try {
            const fd = new FormData();
            // Convert blob to file
            const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
            fd.append("file", file);

            const response = (await apiInstance.post("/user/profile/upload-avatar", fd, {
                headers: { "Content-Type": undefined },
            })) as { success: boolean; data: { profileImage: string } };

            if (response.success) {
                setProfile((prev) => (prev ? { ...prev, profileImage: response.data.profileImage } : prev));
                // Update localStorage
                const storedUser = localStorage.getItem("exboard_user");
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    parsed.profileImage = response.data.profileImage;
                    localStorage.setItem("exboard_user", JSON.stringify(parsed));
                }
                void queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
                setToast({ type: "success", message: "Profile picture updated!" });
            }
        } catch (error: unknown) {
            const err = error as Error;
            setToast({ type: "error", message: err.message || "Failed to upload image" });
        } finally {
            setIsUploading(false);
            setSelectedImage(null);
            // Reset input value to allow selecting same file again
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handlePresetAvatarSelect = async (src: string) => {
        if (!profile || profile.profileImage === src || isSaving || isUploading) return;

        setIsSaving(true);
        try {
            const response = await apiPut<{ profileImage?: string | null }>(
                API_ENDPOINTS.USER.PROFILE,
                { profileImage: src },
            );
            if (!response.success) {
                throw new Error("Failed to update avatar");
            }
            const nextImage = response.data.profileImage ?? src;
            setProfile((prev) => (prev ? { ...prev, profileImage: nextImage } : prev));
            const storedUser = localStorage.getItem("exboard_user");
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                parsed.profileImage = nextImage;
                localStorage.setItem("exboard_user", JSON.stringify(parsed));
            }
            void queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
            setToast({ type: "success", message: "Avatar updated!" });
        } catch (error: unknown) {
            setToast({
                type: "error",
                message: error instanceof Error ? error.message : "Failed to update avatar",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSchoolChange = (value: string) => {
        setIsOtherSchool(value === "Other");
        setFormData({ ...formData, schoolName: value, customSchool: value === "Other" ? formData.customSchool : "" });
    };

    if (isLoading) {
        return <AppLoader />;
    }

    const isStudent = profile?.role === UserRole.STUDENT;
    const isSchool = profile?.role === UserRole.SCHOOL;

    return (
        <PageContainer>
            <PageHeader
                title="Account Settings"
                showLine={true}
            />

            {/* Toast Notification */}
            {toast ? (
                <div className={cn(
                    "fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-top-4 fade-in duration-300",
                    toast.type === "success"
                        ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
                        : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400"
                )}>
                    {toast.type === "success" ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
                    <span className="text-sm font-bold">{toast.message}</span>
                </div>
            ) : null}

            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Profile Picture Section */}
                <div className="bg-card border border-border/60 rounded-[2.5rem] p-8 sm:p-12 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl transition-transform duration-700 group-hover:scale-110"></div>

                    <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
                        {/* Avatar */}
                        <div className="relative group/avatar">
                            <div className="h-32 w-32 rounded-full border-4 border-primary/20 shadow-xl overflow-hidden flex items-center justify-center">
                                <UserAvatar
                                    src={profile?.profileImage}
                                    name={profile?.name}
                                    username={profile?.username}
                                    id={profile?.id}
                                    size={128}
                                    className="size-full"
                                />
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="absolute bottom-1 right-1 flex size-10 items-center justify-center rounded-full bg-white text-primary dark:bg-card dark:text-foreground border border-primary-foreground/30 dark:border-white/20 shadow-lg hover:scale-110 transition-transform duration-200 disabled:opacity-50 cursor-pointer"
                            >
                                {isUploading ? (
                                    <Loader2 className="size-5 animate-spin" />
                                ) : (
                                    <CameraSVG className="size-5 text-primary dark:text-foreground" />
                                )}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                className="hidden"
                            />
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1 text-center sm:text-left">
                            <Typography variant="h2" className="text-2xl sm:text-3xl font-black tracking-tight">
                                {profile?.name || "User"}
                            </Typography>
                            {profile?.username ? (
                                <Typography variant="muted" className="text-sm mt-0.5 flex items-center justify-center sm:justify-start gap-1">
                                    <AtSign className="h-3.5 w-3.5" />
                                    {profile.username}
                                </Typography>
                            ) : null}
                            <Typography variant="muted" className="text-sm mt-1">{profile?.email}</Typography>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                                    {profile?.role === UserRole.STUDENT ? (
                                        <ClassroomSVG className="size-3" />
                                    ) : (
                                        <Shield className="size-3" />
                                    )}
                                    {profile?.role}
                                </span>
                                {profile?.points !== undefined && profile?.role === UserRole.STUDENT ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                        <StarSVG className="size-3" />
                                        {profile.points} Points
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>

                <SettingsAvatarPicker
                    selectedSrc={profile?.profileImage}
                    onSelect={(src) => void handlePresetAvatarSelect(src)}
                    disabled={isSaving || isUploading}
                />

                {/* Device Push Notifications Card */}
                <PushNotificationCard />

                {/* Edit Profile Form */}
                <div className="bg-card border border-border/60 rounded-[2.5rem] p-8 sm:p-12 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-6 w-1.5 bg-primary rounded-full"></div>
                        <Typography variant="h3" className="text-xl font-black tracking-tight">Edit Profile</Typography>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter your name"
                            />
                        </div>

                        {/* Username */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                <AtSign className="h-3 w-3" /> Username
                            </label>
                            <Input
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                placeholder="unique_username"
                            />
                        </div>

                        {/* Email (read-only) */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                <MailSVG className="h-3 w-3" /> Email Address
                            </label>
                            <Input
                                value={profile?.email || ""}
                                disabled
                                className="opacity-60 cursor-not-allowed"
                            />
                        </div>

                        {/* Student-specific fields */}
                        {isStudent ? (
                            <>
                                {/* Father's Name */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                        <UserSVG className="h-3 w-3" /> Father&apos;s Name
                                    </label>
                                    <Input
                                        value={formData.fatherName}
                                        onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                                        placeholder="Enter father's name"
                                    />
                                </div>

                                {/* Date of Birth */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                        <Calendar className="h-3 w-3" /> Date of Birth
                                    </label>
                                    <Input
                                        type="date"
                                        value={formData.dob}
                                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                        className="[appearance:none] [&::-webkit-calendar-picker-indicator]:dark:filter [&::-webkit-calendar-picker-indicator]:dark:invert"
                                    />
                                </div>

                                {/* Gender */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gender</label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        className="flex h-12 w-full rounded-xl border border-input bg-transparent px-5 py-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                {/* City */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                        <LocationSVG className="size-3" /> City
                                    </label>
                                    <AppDropdown
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="Select City"
                                        searchable
                                        options={PAKISTAN_CITIES.map((city) => ({ value: city, label: city }))}
                                    />
                                </div>

                                {/* Class */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Class</label>
                                    <select
                                        value={formData.class}
                                        onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                                        className="flex h-12 w-full rounded-xl border border-input bg-transparent px-5 py-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary"
                                    >
                                        <option value="">Select Class</option>
                                        <option value="IX">IX</option>
                                        <option value="X">X</option>
                                        <option value="XI">XI</option>
                                        <option value="XII">XII</option>
                                    </select>
                                </div>

                                {/* Board */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Board</label>
                                    <select
                                        value={formData.board}
                                        onChange={(e) => setFormData({ ...formData, board: e.target.value })}
                                        className="flex h-12 w-full rounded-xl border border-input bg-transparent px-5 py-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary"
                                    >
                                        <option value="">Select Board</option>
                                        <option value="AKUEB">AKUEB</option>
                                        <option value="Sindh Board">Sindh Board</option>
                                        <option value="Federal Board">Federal Board</option>
                                    </select>
                                </div>

                                {/* School Dropdown */}
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                        <School className="h-3 w-3" /> School
                                    </label>
                                    <AppDropdown
                                        value={formData.schoolName}
                                        onChange={(e) => handleSchoolChange(e.target.value)}
                                        placeholder="Select School"
                                        searchable
                                        options={[
                                            ...schools.map((s) => ({ value: s, label: s })),
                                            { value: "Other", label: "Other" },
                                        ]}
                                    />
                                </div>

                                {/* Custom School Name (if Other) */}
                                {isOtherSchool ? (
                                    <div className="space-y-2 sm:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Custom School Name</label>
                                        <Input
                                            value={formData.customSchool}
                                            onChange={(e) => setFormData({ ...formData, customSchool: e.target.value })}
                                            placeholder="Enter your school name"
                                        />
                                    </div>
                                ) : null}
                            </>
                        ) : null}

                        {/* School-specific fields */}
                        {isSchool ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone Number</label>
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Enter phone number"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Student Count</label>
                                    <Input
                                        value={formData.studentCount}
                                        onChange={(e) => setFormData({ ...formData, studentCount: e.target.value })}
                                        placeholder="Number of students"
                                    />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Address</label>
                                    <Input
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Enter school address"
                                    />
                                </div>
                            </>
                        ) : null}
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end mt-10">
                        <AppButton
                            onClick={handleSave}
                            disabled={isSaving || !isDirty}
                            className="rounded-2xl px-8 py-3 text-sm font-black"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            {isSaving ? "Saving..." : "Save Changes"}
                        </AppButton>
                    </div>
                </div>
            </div>

            {/* Image Cropper Modal */}
            {isCropping && selectedImage && (
                <ImageCropper
                    image={selectedImage}
                    onCropComplete={handleCropComplete}
                    onCancel={() => {
                        setIsCropping(false);
                        setSelectedImage(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                />
            )}
        </PageContainer>
    );
}
