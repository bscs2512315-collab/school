"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Save, Loader2, CheckCircle, AlertCircle, Shield, AtSign } from "lucide-react";
import CameraSVG from "@/public/svgs/CameraSVG";
import MailSVG from "@/public/svgs/MailSVG";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppButton from "@/components/AppButton";
import AppState from "@/components/AppState";
import { Typography } from "@/components/ui/Typography";
import { Input } from "@/components/ui/input";
import ImageCropper from "@/components/ImageCropper";
import SettingsAvatarPicker from "@/components/settings/SettingsAvatarPicker";
import UserAvatar from "@/components/UserAvatar";
import {
  useUploadUserAvatar,
  useUpdateUserProfile,
  useUserProfile,
} from "@/hooks/user/useUserProfile";
import type { UserProfile } from "@/types/user";
import { cn } from "@/lib/utils";

export default function AdminSettingsPage() {
    const profileQuery = useUserProfile();
    const updateProfileMutation = useUpdateUserProfile();
    const uploadAvatarMutation = useUploadUserAvatar();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isCropping, setIsCropping] = useState(false);

    useEffect(() => {
        if (!profileQuery.data) return;
        setProfile(profileQuery.data);
        setName(profileQuery.data.name || "");
        setUsername(profileQuery.data.username || "");
    }, [profileQuery.data]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const isDirty = useMemo(() => {
        if (!profile) return false;
        return (
            name !== (profile.name || "") ||
            username !== (profile.username || "")
        );
    }, [name, username, profile]);

    const handleSave = async () => {
        if (!isDirty) return;
        try {
            const updated = await updateProfileMutation.mutateAsync({ name, username });
            if (updated) {
                setProfile(updated);
                setName(updated.name || "");
                setUsername(updated.username || "");
            }
            const storedUser = localStorage.getItem("exboard_user");
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                parsed.name = name;
                parsed.username = username;
                localStorage.setItem("exboard_user", JSON.stringify(parsed));
            }
            setToast({ type: "success", message: "Profile updated successfully!" });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to update profile";
            setToast({ type: "error", message });
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
        try {
            const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
            const formData = new FormData();
            formData.append("file", file);

            const data = await uploadAvatarMutation.mutateAsync(formData);
            setProfile((prev) => (prev ? { ...prev, profileImage: data.profileImage } : prev));

            const storedUser = localStorage.getItem("exboard_user");
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                parsed.profileImage = data.profileImage;
                localStorage.setItem("exboard_user", JSON.stringify(parsed));
            }
            setToast({ type: "success", message: "Profile picture updated!" });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to upload image";
            setToast({ type: "error", message });
        } finally {
            setSelectedImage(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const isSaving = updateProfileMutation.isPending;
    const isUploading = uploadAvatarMutation.isPending;

    const handlePresetAvatarSelect = async (src: string) => {
        if (!profile || profile.profileImage === src || isSaving || isUploading) return;

        try {
            const updated = await updateProfileMutation.mutateAsync({ profileImage: src });
            setProfile((prev) =>
                prev ? { ...prev, profileImage: updated.profileImage ?? src } : prev,
            );
            const storedUser = localStorage.getItem("exboard_user");
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                parsed.profileImage = updated.profileImage ?? src;
                localStorage.setItem("exboard_user", JSON.stringify(parsed));
            }
            setToast({ type: "success", message: "Avatar updated!" });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to update avatar";
            setToast({ type: "error", message });
        }
    };

    if (profileQuery.isLoading) {
        return (
            <PageContainer>
                <AppState isLoading fullScreen={false} />
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <PageHeader
                title="Settings"
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
                <div className="group relative overflow-hidden rounded-[2.5rem] border border-primary/20 p-8 shadow-sm sm:p-12">
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary via-primary/95 to-primary-dark" />
                    <div className="absolute top-0 right-0 size-64 -mr-32 -mt-32 rounded-full bg-primary-foreground/10 blur-3xl transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute bottom-0 left-0 size-48 -mb-24 -ml-24 rounded-full bg-emerald-400/15 blur-3xl" />

                    <div className="relative z-10 flex flex-col items-center gap-8 sm:flex-row">
                        {/* Avatar */}
                        <div className="relative group/avatar">
                            <UserAvatar
                                src={profile?.profileImage}
                                name={profile?.name}
                                username={profile?.username}
                                id={profile?.id}
                                size={128}
                                showRing
                                ringClassName="ring-4 ring-primary-foreground/35 shadow-xl"
                                className="size-28 sm:size-32"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="absolute bottom-1 right-1 flex size-10 items-center justify-center rounded-full bg-white text-primary dark:bg-card dark:text-foreground border border-primary-foreground/30 dark:border-white/20 shadow-lg transition-transform duration-200 hover:scale-110 disabled:opacity-50 cursor-pointer"
                            >
                                {isUploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <CameraSVG className="size-4 text-primary dark:text-foreground" />
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
                            <Typography variant="h2" className="text-2xl font-black tracking-tight text-primary-foreground sm:text-3xl">
                                {profile?.name || "Admin"}
                            </Typography>
                            {profile?.username ? (
                                <Typography variant="muted" className="mt-0.5 flex items-center justify-center gap-1 text-sm text-primary-foreground/70 sm:justify-start">
                                    <AtSign className="size-3.5" />
                                    {profile.username}
                                </Typography>
                            ) : null}
                            <Typography variant="muted" className="mt-1 text-sm text-primary-foreground/70">{profile?.email}</Typography>
                            <div className="mt-4">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary-foreground">
                                    <Shield className="size-3" />
                                    {profile?.role}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <SettingsAvatarPicker
                    selectedSrc={profile?.profileImage}
                    onSelect={(src) => void handlePresetAvatarSelect(src)}
                    disabled={isSaving || isUploading}
                />

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
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name"
                            />
                        </div>

                        {/* Username */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                <AtSign className="h-3 w-3" /> Username
                            </label>
                            <Input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
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
