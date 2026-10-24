"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, AlertCircle, AtSign, Phone, ShieldCheck } from "lucide-react";
import StudentsSVG from "@/public/svgs/StudentsSVG";
import CameraSVG from "@/public/svgs/CameraSVG";
import MailSVG from "@/public/svgs/MailSVG";
import UserSVG from "@/public/svgs/UserSVG";
import CalendarSVG from "@/public/svgs/CalendarSVG";
import BuildingSVG from "@/public/svgs/BuildingSVG";
import LocationSVG from "@/public/svgs/LocationSVG";
import GenderSVG from "@/public/svgs/GenderSVG";
import BoardSVG from "@/public/svgs/BoardSVG";
import ClassroomSVG from "@/public/svgs/ClassroomSVG";
import GroupSVG from "@/public/svgs/GroupSVG";
import StarSVG from "@/public/svgs/StarSVG";
import LogoutSVG from "@/public/svgs/LogoutSVG";
import PageContainer from "@/components/PageContainer";
import AppLoader from "@/components/AppLoader";
import AppButton from "@/components/AppButton";
import AppDropdown from "@/components/AppDropdown";
import AppState from "@/components/AppState";
import { Typography } from "@/components/ui/Typography";
import { Input } from "@/components/ui/input";
import { PAKISTAN_CITIES, getGroupsForClass } from "@/constants";
import ImageCropper from "@/components/ImageCropper";
import { usePageTitle } from "@/components/layout/PageTitleContext";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import {
  useUploadUserAvatar,
  useUpdateUserProfile,
  useUserProfile,
} from "@/hooks/user/useUserProfile";
import type { UserProfile } from "@/types/user";
import { Board, Class, Subject, UserRole } from "@/types/enums";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { logoutAuthSession } from "@/lib/auth-session";
import { cn } from "@/lib/utils";
import SearchableSubjectDropdown from "@/components/ui/SearchableSubjectDropdown";
import type { ComponentType, SVGProps } from "react";
import SettingsAvatarPicker from "@/components/settings/SettingsAvatarPicker";
import UserAvatar from "@/components/UserAvatar";

const DEFAULT_SCHOOLS = [
    "IISAR Foundation Higher Secondary School & College",
    "Happy Palace Group of Schools",
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

function buildFormDataFromProfile(data: UserProfile) {
  const knownSchool = (DEFAULT_SCHOOLS as readonly string[]).includes(data.schoolName || "");
  const hasCustomSchool = Boolean(data.schoolName && !knownSchool);

  return {
    formData: {
      name: data.name || "",
      username: data.username || "",
      fatherName: data.fatherName || "",
      dob: formatDobForInput(data.dob),
      gender: data.gender || "",
      class: data.class || "",
      stream: data.stream || "",
      board: data.board || "",
      schoolName: hasCustomSchool ? "Other" : data.schoolName || "",
      customSchool: hasCustomSchool ? data.schoolName || "" : "",
      city: data.city || "",
      phone: data.phone || "",
      address: data.address || "",
      studentCount: data.studentCount || "",
      subjects: data.subjects || [],
      classes: data.classes || [],
      examStrictMode: data.examStrictMode ?? true,
    },
    isOtherSchool: hasCustomSchool,
  };
}

function toggleListValue(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

type FieldIcon = ComponentType<SVGProps<SVGSVGElement>>;

const settingsFieldIconClass =
  "pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary";

const settingsSelectIconClass =
  "pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground";

function SettingsLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </label>
  );
}

function SettingsInputField({
  label,
  icon: Icon,
  className,
  wrapperClassName,
  ...inputProps
}: React.ComponentProps<typeof Input> & {
  label: string;
  icon: FieldIcon;
  wrapperClassName?: string;
}) {
  return (
    <div className={cn("space-y-2", wrapperClassName)}>
      <SettingsLabel>{label}</SettingsLabel>
      <div className="group relative">
        <Icon className={settingsFieldIconClass} />
        <Input
          {...inputProps}
          className={cn("pl-10", className)}
        />
      </div>
    </div>
  );
}

function SettingsSelectField({
  label,
  icon: Icon,
  className,
  children,
}: {
  label: string;
  icon: FieldIcon;
  className?: string;
  children: React.ReactElement<{ className?: string }>;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <SettingsLabel>{label}</SettingsLabel>
      <div className="group relative">
        <Icon className={settingsSelectIconClass} />
        {React.cloneElement(children, {
          className: cn("h-11 pl-10", children.props.className),
        })}
      </div>
    </div>
  );
}

export default function StudentSettingsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const profileQuery = useUserProfile();
    const updateProfileMutation = useUpdateUserProfile();
    const uploadAvatarMutation = useUploadUserAvatar();
    const pageTitleContext = usePageTitle();
    const setPageTitle = pageTitleContext?.setPageTitle;

    useEffect(() => {
        setPageTitle?.("Settings");
        return () => {
            setPageTitle?.(null);
        };
    }, [setPageTitle]);

    const [profileOverride, setProfileOverride] = useState<UserProfile | null>(null);
    const profile = profileOverride ?? profileQuery.data ?? null;

    const [syncedProfileData, setSyncedProfileData] = useState<UserProfile | null>(() => profileQuery.data ?? null);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [schools, setSchools] = useState<string[]>([...DEFAULT_SCHOOLS]);
    const [isOtherSchool, setIsOtherSchool] = useState(() => {
        if (!profileQuery.data) return false;
        return buildFormDataFromProfile(profileQuery.data).isOtherSchool;
    });
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [formData, setFormData] = useState(() => {
        if (profileQuery.data) {
            return buildFormDataFromProfile(profileQuery.data).formData;
        }
        return {
            name: "",
            username: "",
            fatherName: "",
            dob: "",
            gender: "",
            class: "",
            stream: "",
            board: "",
            schoolName: "",
            customSchool: "",
            city: "",
            phone: "",
            address: "",
            studentCount: "",
            subjects: [] as string[],
            classes: [] as string[],
            examStrictMode: true,
        };
    });

    useEffect(() => {
        fetch("/api/schools")
            .then((res) => res.json())
            .then((data) => {
                // /api/schools returns objects ({ id, name, logo, ... }); normalize to names
                const names = Array.isArray(data)
                    ? data
                          .map((s) => (typeof s === "string" ? s : s?.name))
                          .filter((name): name is string => Boolean(name))
                    : [];
                setSchools(names.length ? names : [...DEFAULT_SCHOOLS]);
            })
            .catch(() => setSchools([...DEFAULT_SCHOOLS]));
    }, []);

    if (profileQuery.data && profileQuery.data !== syncedProfileData) {
        setSyncedProfileData(profileQuery.data);
        const { formData: nextFormData, isOtherSchool: nextIsOtherSchool } =
            buildFormDataFromProfile(profileQuery.data);
        setFormData(nextFormData);
        setIsOtherSchool(nextIsOtherSchool);
    }

    const initialFormData = useMemo(() => {
        if (!profile) return null;
        return buildFormDataFromProfile(profile).formData;
    }, [profile]);

    const isDirty = useMemo(() => {
        if (!initialFormData) return false;

        if (formData.name !== initialFormData.name) return true;
        if (formData.username !== initialFormData.username) return true;
        if (formData.fatherName !== initialFormData.fatherName) return true;
        if (formData.dob !== initialFormData.dob) return true;
        if (formData.gender !== initialFormData.gender) return true;
        if (formData.class !== initialFormData.class) return true;
        if (formData.stream !== initialFormData.stream) return true;
        if (formData.board !== initialFormData.board) return true;
        if (formData.schoolName !== initialFormData.schoolName) return true;
        if (formData.customSchool !== initialFormData.customSchool) return true;
        if (formData.city !== initialFormData.city) return true;
        if (formData.phone !== initialFormData.phone) return true;
        if (formData.address !== initialFormData.address) return true;
        if (formData.studentCount !== initialFormData.studentCount) return true;
        if (formData.examStrictMode !== initialFormData.examStrictMode) return true;

        if (formData.subjects.length !== initialFormData.subjects.length) return true;
        const sortedSubjects = [...formData.subjects].sort();
        const sortedInitSubjects = [...initialFormData.subjects].sort();
        if (sortedSubjects.some((s, idx) => s !== sortedInitSubjects[idx])) return true;

        if (formData.classes.length !== initialFormData.classes.length) return true;
        const sortedClasses = [...formData.classes].sort();
        const sortedInitClasses = [...initialFormData.classes].sort();
        if (sortedClasses.some((c, idx) => c !== sortedInitClasses[idx])) return true;

        return false;
    }, [formData, initialFormData]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleSave = async () => {
        if (!profile || !isDirty) return;

        try {
            const finalSchool = isOtherSchool ? formData.customSchool : formData.schoolName;
            const updateData: Record<string, unknown> = {
                name: formData.name,
                username: formData.username,
            };

            if (profile.role === UserRole.STUDENT) {
                updateData.class = formData.class;
                updateData.stream = formData.stream;
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
            } else if (profile.role === UserRole.TEACHER) {
                updateData.board = formData.board;
                updateData.schoolName = finalSchool;
                updateData.city = formData.city;
                updateData.subjects = formData.subjects;
                updateData.classes = formData.classes;
                updateData.examStrictMode = formData.examStrictMode;
            }

            const updated = await updateProfileMutation.mutateAsync(updateData);
            if (updated) {
                queryClient.setQueryData(queryKeys.user.profile(), updated);
                setProfileOverride(updated);
                const { formData: nextFormData, isOtherSchool: nextIsOtherSchool } =
                    buildFormDataFromProfile(updated);
                setFormData(nextFormData);
                setIsOtherSchool(nextIsOtherSchool);
            }

            const storedUser = localStorage.getItem("exboard_user");
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                parsed.name = formData.name;
                parsed.username = formData.username;
                if (formData.class) parsed.class = formData.class;
                parsed.stream = formData.stream || null;
                if (formData.dob) parsed.dob = formData.dob;
                if (formData.fatherName) parsed.fatherName = formData.fatherName;
                if (formData.gender) parsed.gender = formData.gender;
                if (profile.role === UserRole.TEACHER) {
                    parsed.subjects = formData.subjects;
                    parsed.classes = formData.classes;
                    parsed.board = formData.board;
                    parsed.schoolName = finalSchool;
                    parsed.examStrictMode = formData.examStrictMode;
                }
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

    const isSaving = updateProfileMutation.isPending;
    const isUploading = uploadAvatarMutation.isPending;

    const handleCropComplete = async (croppedBlob: Blob) => {
        setIsCropping(false);

        try {
            const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
            const formDataUpload = new FormData();
            formDataUpload.append("file", file);

            const data = await uploadAvatarMutation.mutateAsync(formDataUpload);
            queryClient.setQueryData<UserProfile>(queryKeys.user.profile(), (prev) =>
                prev ? { ...prev, profileImage: data.profileImage } : prev,
            );
            setProfileOverride((prev) => (prev ? { ...prev, profileImage: data.profileImage } : profile ? { ...profile, profileImage: data.profileImage } : null));

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

    const handlePresetAvatarSelect = async (src: string) => {
        if (!profile || profile.profileImage === src || isSaving || isUploading) return;

        try {
            const updated = await updateProfileMutation.mutateAsync({ profileImage: src });
            queryClient.setQueryData<UserProfile>(queryKeys.user.profile(), (prev) =>
                prev ? { ...prev, profileImage: updated.profileImage ?? src } : prev,
            );
            setProfileOverride((prev) =>
                prev ? { ...prev, profileImage: updated.profileImage ?? src } : profile ? { ...profile, profileImage: updated.profileImage ?? src } : null,
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

    const handleSchoolChange = (value: string) => {
        setIsOtherSchool(value === "Other");
        setFormData({ ...formData, schoolName: value, customSchool: value === "Other" ? formData.customSchool : "" });
    };

    const handleLogout = async () => {
        try {
            await logoutAuthSession();
            window.location.replace(FRONTEND_ROUTES.LOGIN);
        } catch {
            setToast({ type: "error", message: "Could not sign out. Please try again." });
        }
    };

    if (profileQuery.isLoading) {
        return <AppLoader />;
    }

    if (profileQuery.isError || !profile) {
        return (
            <PageContainer>
                <AppState
                    variant="error"
                    description="Failed to load profile. Please try again."
                    action={{
                        label: "Retry",
                        onClick: () => profileQuery.refetch(),
                    }}
                    fullScreen={false}
                />
            </PageContainer>
        );
    }

    const isStudent = profile?.role === UserRole.STUDENT;
    const isSchool = profile?.role === UserRole.SCHOOL;
    const isTeacher = profile?.role === UserRole.TEACHER;

    return (
        <PageContainer className="space-y-0 p-0 lg:space-y-0 lg:px-0 lg:py-0 lg:pb-0">
            {/* Toast Notification */}
            {toast ? (
                <div className={cn(
                    "fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-lg backdrop-blur-md animate-in slide-in-from-top-4 fade-in duration-300",
                    {
                        "border-trend-up/30 bg-trend-up/10 text-trend-up": toast.type === "success",
                        "border-destructive/30 bg-destructive/10 text-destructive": toast.type !== "success",
                    },
                )}>
                    {toast.type === "success" ? <CheckCircle className="size-5 shrink-0" /> : <AlertCircle className="size-5 shrink-0" />}
                    <span className="text-sm font-semibold">{toast.message}</span>
                </div>
            ) : null}

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Profile hero — edge-to-edge like dashboard */}
                <section className="relative overflow-x-clip bg-primary px-5 pb-16 pt-5 text-primary-foreground">
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute inset-0 bg-linear-to-br from-sidebar-from via-primary to-sidebar-to" />
                        <div className="absolute -right-8 -top-10 size-40 rounded-full bg-primary-foreground/10 blur-2xl" />
                        <div
                            className="absolute inset-0 opacity-[0.12]"
                            style={{
                                backgroundImage:
                                    "radial-gradient(circle at 1px 1px, var(--color-primary-foreground) 1px, transparent 0)",
                                backgroundSize: "16px 16px",
                            }}
                        />
                    </div>

                    <div className="relative z-10 flex items-center gap-4">
                        <div className="relative shrink-0">
                            <UserAvatar
                                src={profile?.profileImage}
                                name={profile?.name}
                                username={profile?.username}
                                id={profile?.id}
                                size={88}
                                showRing
                                ringClassName="ring-2 ring-primary-foreground/35 shadow-md"
                                className="size-20 sm:size-24"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                aria-label="Change profile photo"
                                className="absolute bottom-0 right-0 z-10 flex size-8 sm:size-9 items-center justify-center rounded-full border border-primary-foreground/30 bg-white text-primary dark:bg-card dark:text-foreground dark:border-white/20 shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                                {isUploading ? (
                                    <Loader2 className="size-4.5 animate-spin" />
                                ) : (
                                    <CameraSVG className="size-4.5 text-primary dark:text-foreground" />
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

                        <div className="min-w-0 flex-1">
                            <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                                {profile?.name || "User"}
                            </h1>
                            {profile?.username ? (
                                <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-primary-foreground/75">
                                    <span className="inline-flex shrink-0 items-center gap-0.5">
                                        <AtSign className="size-3 shrink-0" />
                                        {profile.username}
                                    </span>
                                    <span className="text-primary-foreground/40">·</span>
                                    <span className="min-w-0 truncate">{profile?.email}</span>
                                </p>
                            ) : (
                                <p className="mt-0.5 truncate text-xs text-primary-foreground/65">
                                    {profile?.email}
                                </p>
                            )}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground">
                                    <ClassroomSVG className="size-3" />
                                    {profile?.role}
                                </span>
                                {profile?.points !== undefined ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground">
                                        <StarSVG className="size-3" />
                                        {profile.points} Points
                                    </span>
                                ) : null}
                            </div>
                        </div>

                        <AppButton
                            type="button"
                            variant="outline"
                            onClick={handleLogout}
                            className="hidden shrink-0 rounded-xl border-primary-foreground/25 bg-destructive/15 px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-destructive/25 hover:text-primary-foreground lg:inline-flex"
                        >
                            <LogoutSVG className="mr-2 size-4" />
                            Sign Out
                        </AppButton>
                    </div>
                </section>

                {/* Edit Profile — white sheet over hero */}
                <div className="relative z-20 -mt-8 space-y-6 rounded-t-3xl bg-background px-5 pb-20 pt-5 sm:px-6 sm:pb-8 lg:px-8 lg:pb-8">
                    <SettingsAvatarPicker
                        selectedSrc={profile?.profileImage}
                        onSelect={(src) => void handlePresetAvatarSelect(src)}
                        disabled={isSaving || isUploading}
                    />

                    <div>
                        <Typography className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                            Edit Profile
                        </Typography>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Update your personal details
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 [&_input]:h-11 [&_input]:text-sm [&_input]:placeholder:text-sm">
                        <SettingsInputField
                            label="Full Name"
                            icon={UserSVG}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter your name"
                        />

                        <SettingsInputField
                            label="Username"
                            icon={AtSign}
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="unique_username"
                        />

                        <SettingsInputField
                            label="Email Address"
                            icon={MailSVG}
                            value={profile?.email || ""}
                            disabled
                            className="cursor-not-allowed opacity-60"
                        />

                        {/* Student-specific fields */}
                        {isStudent ? (
                            <>
                                <SettingsInputField
                                    label="Father's Name"
                                    icon={UserSVG}
                                    value={formData.fatherName}
                                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                                    placeholder="Enter father's name"
                                />

                                <SettingsInputField
                                    label="Date of Birth"
                                    icon={CalendarSVG}
                                    type="date"
                                    value={formData.dob}
                                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                />

                                <SettingsSelectField label="Gender" icon={GenderSVG}>
                                    <AppDropdown
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        placeholder="Select Gender"
                                        options={[
                                            { value: "Male", label: "Male" },
                                            { value: "Female", label: "Female" },
                                        ]}
                                    />
                                </SettingsSelectField>

                                <SettingsSelectField label="City" icon={LocationSVG}>
                                    <AppDropdown
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="Select City"
                                        searchable
                                        options={PAKISTAN_CITIES.map((city) => ({ value: city, label: city }))}
                                    />
                                </SettingsSelectField>

                                <SettingsSelectField label="Class" icon={ClassroomSVG}>
                                    <AppDropdown
                                        value={formData.class}
                                        onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                                        placeholder="Select Class"
                                        options={[
                                            { value: "IX", label: "IX" },
                                            { value: "X", label: "X" },
                                            { value: "XI", label: "XI" },
                                            { value: "XII", label: "XII" },
                                        ]}
                                    />
                                </SettingsSelectField>

                                <SettingsSelectField label="Group" icon={GroupSVG}>
                                    <AppDropdown
                                        value={formData.stream}
                                        onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                                        placeholder="Select Group"
                                        options={getGroupsForClass(formData.class).map((g) => ({ value: g, label: g }))}
                                    />
                                </SettingsSelectField>

                                <SettingsSelectField label="Board" icon={BoardSVG}>
                                    <AppDropdown
                                        value={formData.board}
                                        onChange={(e) => setFormData({ ...formData, board: e.target.value })}
                                        placeholder="Select Board"
                                        options={[
                                            { value: "AKUEB", label: "AKUEB" },
                                            { value: "Sindh Board", label: "Sindh Board" },
                                            { value: "Federal Board", label: "Federal Board" },
                                        ]}
                                    />
                                </SettingsSelectField>

                                <SettingsSelectField label="School" icon={BuildingSVG} className="sm:col-span-2">
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
                                </SettingsSelectField>

                                {isOtherSchool ? (
                                    <SettingsInputField
                                        label="Custom School Name"
                                        icon={BuildingSVG}
                                        wrapperClassName="sm:col-span-2"
                                        value={formData.customSchool}
                                        onChange={(e) => setFormData({ ...formData, customSchool: e.target.value })}
                                        placeholder="Enter your school name"
                                    />
                                ) : null}
                            </>
                        ) : null}

                        {isSchool ? (
                            <>
                                <SettingsInputField
                                    label="Phone Number"
                                    icon={Phone}
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="Enter phone number"
                                />
                                <SettingsInputField
                                    label="Student Count"
                                    icon={StudentsSVG}
                                    value={formData.studentCount}
                                    onChange={(e) => setFormData({ ...formData, studentCount: e.target.value })}
                                    placeholder="Number of students"
                                />
                                <SettingsInputField
                                    label="Address"
                                    icon={LocationSVG}
                                    wrapperClassName="sm:col-span-2"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Enter school address"
                                />
                            </>
                        ) : null}

                        {isTeacher ? (
                            <>
                                <SettingsSelectField label="Board" icon={BoardSVG}>
                                    <AppDropdown
                                        value={formData.board}
                                        onChange={(e) => setFormData({ ...formData, board: e.target.value })}
                                        placeholder="Select Board"
                                        options={Object.values(Board).map((board) => ({
                                            value: board,
                                            label: board,
                                        }))}
                                    />
                                </SettingsSelectField>
                                <SettingsSelectField label="City" icon={LocationSVG}>
                                    <AppDropdown
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="Select City"
                                        searchable
                                        options={PAKISTAN_CITIES.map((city) => ({ value: city, label: city }))}
                                    />
                                </SettingsSelectField>
                                <SettingsSelectField label="School" icon={BuildingSVG} className="sm:col-span-2">
                                    <AppDropdown
                                        value={formData.schoolName}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setIsOtherSchool(value === "Other");
                                            setFormData({
                                                ...formData,
                                                schoolName: value,
                                                customSchool: value === "Other" ? formData.customSchool : "",
                                            });
                                        }}
                                        placeholder="Select School"
                                        searchable
                                        options={[
                                            ...schools.map((school) => ({ value: school, label: school })),
                                            { value: "Other", label: "Other" },
                                        ]}
                                    />
                                </SettingsSelectField>
                                {isOtherSchool ? (
                                    <SettingsInputField
                                        label="Custom School Name"
                                        icon={BuildingSVG}
                                        wrapperClassName="sm:col-span-2"
                                        value={formData.customSchool}
                                        onChange={(e) => setFormData({ ...formData, customSchool: e.target.value })}
                                        placeholder="Enter your school name"
                                    />
                                ) : null}
                                <div className="space-y-2 sm:col-span-2">
                                    <SettingsLabel>Subjects you teach</SettingsLabel>
                                    <SearchableSubjectDropdown
                                        selectedSubjects={formData.subjects}
                                        onChange={(subjects) => setFormData({ ...formData, subjects })}
                                        placeholder="Search and select subjects you teach..."
                                    />
                                </div>
                                <div className="space-y-3 sm:col-span-2">
                                    <SettingsLabel>Classes you teach</SettingsLabel>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.values(Class).map((classLevel) => {
                                            const selected = formData.classes.includes(classLevel);
                                            return (
                                                <button
                                                    key={classLevel}
                                                    type="button"
                                                    onClick={() =>
                                                        setFormData({
                                                            ...formData,
                                                            classes: toggleListValue(formData.classes, classLevel),
                                                        })
                                                    }
                                                    className={cn(
                                                        "rounded-xl px-3 py-2 text-xs font-bold transition-colors",
                                                        {
                                                            "bg-primary text-primary-foreground": selected,
                                                            "bg-muted text-muted-foreground hover:bg-muted/80": !selected,
                                                        },
                                                    )}
                                                >
                                                    Class {classLevel}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Classrooms are created automatically from each subject × class pair.
                                    </p>
                                </div>

                                <div className="sm:col-span-2 pt-4 border-t border-border/60">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-border bg-muted/20 p-5 shadow-xs transition-all hover:border-primary/40">
                                        <div className="space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <ShieldCheck className="size-5 text-primary" />
                                                <h4 className="text-sm font-bold text-foreground sm:text-base">
                                                    Testing Strictness & Anti-Cheat
                                                </h4>
                                                <span
                                                    className={cn(
                                                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                                                        formData.examStrictMode
                                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                                                    )}
                                                >
                                                    {formData.examStrictMode ? "Strict Mode Active" : "Relaxed Mode"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                                                Automatically submit student papers when they switch tabs, minimize the browser, or leave the exam window. Turn this off to allow students to switch tabs freely without being auto-submitted.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={formData.examStrictMode}
                                            onClick={() =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    examStrictMode: !prev.examStrictMode,
                                                }))
                                            }
                                            className={cn(
                                                "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                                                formData.examStrictMode ? "bg-primary" : "bg-muted-foreground/30",
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "pointer-events-none inline-block size-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out dark:bg-black",
                                                    formData.examStrictMode ? "translate-x-5" : "translate-x-0",
                                                )}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>

                    {/* Save + Logout */}
                    <div className="mt-6 sm:mt-8 flex flex-col gap-2.5 lg:items-end">
                        <AppButton
                            onClick={handleSave}
                            disabled={isSaving || !isDirty}
                            className="w-full rounded-xl px-8 py-3 text-sm font-semibold lg:w-auto"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </AppButton>
                        <AppButton
                            type="button"
                            variant="outline"
                            onClick={handleLogout}
                            className="w-full rounded-xl border-destructive/20 bg-destructive/10 px-8 py-3 text-sm font-semibold text-destructive hover:bg-destructive/15 hover:text-destructive lg:hidden"
                        >
                            <LogoutSVG className="mr-2 size-4" />
                            Sign Out
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
