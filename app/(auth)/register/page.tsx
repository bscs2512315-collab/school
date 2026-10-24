"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    School, Loader2,
    AtSign, Check
} from "lucide-react";
import MailSVG from "@/public/svgs/MailSVG";
import EyeSVG from "@/public/svgs/EyeSVG";
import EyeOffSVG from "@/public/svgs/EyeOffSVG";
import LockSVG from "@/public/svgs/LockSVG";
import UserSVG from "@/public/svgs/UserSVG";
import CalendarSVG from "@/public/svgs/CalendarSVG";
import BuildingSVG from "@/public/svgs/BuildingSVG";
import ClassroomSVG from "@/public/svgs/ClassroomSVG";
import SyllabusSVG from "@/public/svgs/SyllabusSVG";
import PhoneSVG from "@/public/svgs/PhoneSVG";
import LocationSVG from "@/public/svgs/LocationSVG";
import { useRegister, useRegisterSchool, useRegisterTeacher } from "@/hooks/useAuth";
import AppInput from "@/components/AppInput";
import AppButton from "@/components/AppButton";
import AppDropdown from "@/components/AppDropdown";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { AuthFooter, AuthPageShell } from "@/components/auth/AuthPageShell";
import { Typography } from "@/components/ui/Typography";
import { RegistrationStep, RegistrationRole, Class, Subject, Board } from "@/types/enums";
import type { StudentRegistrationData, SchoolRegistrationData, TeacherRegistrationData } from "@/types/auth";
import { PAKISTAN_CITIES, getGroupsForClass } from "@/constants";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { getPasswordChecks } from "@/lib/auth/password-policy";
import SearchableSubjectDropdown from "@/components/ui/SearchableSubjectDropdown";

const DEFAULT_SCHOOLS = [
    "IISAR Foundation Higher Secondary School & College",
    "Happy Palace Group of Schools",
    "College for Advanced Studies CAS-HPGS",
    "Sultan Muhammad Shah Secondary School",
    "Aga Khan College",
] as const;

type SchoolOption = { id: string; name: string };

function toggleListValue(list: string[], value: string) {
    return list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value];
}

function registrationTitle(role: RegistrationRole) {
    if (role === RegistrationRole.STUDENT) return "Student Registration";
    if (role === RegistrationRole.TEACHER) return "Teacher Registration";
    return "School Registration";
}

function registrationSubtitle(role: RegistrationRole) {
    if (role === RegistrationRole.STUDENT) return "Complete your student profile";
    if (role === RegistrationRole.TEACHER) return "Complete your teacher profile";
    return "Complete your school profile";
}

const ROLE_OPTIONS = [
    {
        role: RegistrationRole.STUDENT,
        title: "Student",
        description: "Past papers, AI marking, and Nova tutoring.",
        icon: ClassroomSVG,
    },
    {
        role: RegistrationRole.TEACHER,
        title: "Teacher",
        description: "Create classrooms and assign papers.",
        icon: SyllabusSVG,
    },
    {
        role: RegistrationRole.SCHOOL,
        title: "School / Organization",
        description: "Register your institution and students.",
        icon: BuildingSVG,
    },
] as const;

function emailLabel(role: RegistrationRole) {
    if (role === RegistrationRole.STUDENT) return "Personal Email";
    if (role === RegistrationRole.TEACHER) return "Work Email";
    return "Official Institution Email";
}

export default function RegisterPage() {
    const [step, setStep] = useState<RegistrationStep>(RegistrationStep.ROLE);
    const [role, setRole] = useState<RegistrationRole>(RegistrationRole.STUDENT);
    const [schools, setSchools] = React.useState<SchoolOption[]>(
        DEFAULT_SCHOOLS.map((name) => ({ id: name, name })),
    );
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const [formData, setFormData] = useState({
        // Common
        email: "",
        password: "",
        confirmPassword: "",
        username: "",
        // Student specific
        name: "",
        fatherName: "",
        dob: "",
        gender: "",
        class: "",
        stream: "",
        schoolName: "",
        schoolId: "",
        customSchool: "",
        city: "",
        // School specific
        contactPerson: "",
        schoolPhone: "",
        address: "",
        studentCount: "",
        // Teacher specific
        subjects: [] as string[],
        classes: [] as string[],
        board: "",
    });

    const [isOtherSchool, setIsOtherSchool] = useState(false);

    // Hooks
    const { mutate: registerStudent, isPending: isStudentPending } = useRegister();
    const { mutate: registerSchool, isPending: isSchoolPending } = useRegisterSchool();
    const { mutate: registerTeacher, isPending: isTeacherPending } = useRegisterTeacher();

    const isPending = isStudentPending || isSchoolPending || isTeacherPending;
    const passwordChecks = getPasswordChecks(formData.password);
    const passwordIsValid = passwordChecks.every((check) => check.valid);
    const passwordsMatch = formData.confirmPassword === formData.password;

    React.useEffect(() => {
        fetch("/api/schools")
            .then(res => res.json())
            .then((data: unknown) => {
                const options = Array.isArray(data)
                    ? data
                          .map((s) => {
                              if (typeof s === "string") return { id: s, name: s };
                              if (s && typeof s === "object" && "name" in s) {
                                  const name = String((s as { name?: string }).name || "").trim();
                                  const id = String((s as { id?: string }).id || name).trim();
                                  if (!name) return null;
                                  return { id, name };
                              }
                              return null;
                          })
                          .filter((s): s is SchoolOption => Boolean(s))
                    : [];
                setSchools(options.length > 0 ? options : DEFAULT_SCHOOLS.map((name) => ({ id: name, name })));
            })
            .catch(() => setSchools(DEFAULT_SCHOOLS.map((name) => ({ id: name, name }))));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === "schoolName") {
            const isOther = value === "Other";
            setIsOtherSchool(isOther);
            if (isOther) {
                setFormData({ ...formData, schoolName: "Other", schoolId: "", customSchool: formData.customSchool });
                return;
            }
            const selected = schools.find((s) => s.id === value || s.name === value);
            setFormData({
                ...formData,
                schoolName: selected?.name || value,
                schoolId: selected?.id || "",
                customSchool: "",
            });
            return;
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();

        const unmetRequirement = passwordChecks.find((check) => !check.valid);
        if (unmetRequirement) {
            toast.error(unmetRequirement.message);
            return;
        }
        if (!passwordsMatch) {
            toast.error("Passwords don't match");
            return;
        }

        if (!acceptedTerms) {
            toast.error("Please accept the Terms & Conditions and review the Privacy Policy to continue");
            return;
        }

        if (role === RegistrationRole.SCHOOL) {
            const schoolData: SchoolRegistrationData = {
                schoolName: formData.customSchool || formData.schoolName || formData.name,
                city: formData.city,
                username: formData.username,
                email: formData.email,
                phone: formData.schoolPhone,
                address: formData.address,
                studentCount: formData.studentCount,
                password: formData.password,
                confirmPassword: formData.confirmPassword
            };
            registerSchool(schoolData);
            return;
        }

        if (role === RegistrationRole.TEACHER) {
            const finalSchool = isOtherSchool ? formData.customSchool : formData.schoolName;
            if (!finalSchool.trim()) {
                toast.error("Please select or enter your school");
                return;
            }
            if (formData.subjects.length === 0) {
                toast.error("Select at least one subject");
                return;
            }
            if (formData.classes.length === 0) {
                toast.error("Select at least one class");
                return;
            }
            if (!formData.board) {
                toast.error("Please select a board");
                return;
            }

            const teacherData: TeacherRegistrationData = {
                name: formData.name,
                email: formData.email,
                username: formData.username,
                subjects: formData.subjects,
                classes: formData.classes,
                schoolId: isOtherSchool ? undefined : formData.schoolId || undefined,
                schoolName: finalSchool,
                board: formData.board as Board,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
            };
            registerTeacher(teacherData);
            return;
        }

        const finalSchool = isOtherSchool ? formData.customSchool : formData.schoolName;
        const studentData: StudentRegistrationData = {
            name: formData.name,
            fatherName: formData.fatherName,
            dob: formData.dob,
            gender: formData.gender ? formData.gender as StudentRegistrationData["gender"] : undefined,
            class: formData.class as Class,
            stream: formData.stream || undefined,
            schoolName: finalSchool,
            city: formData.city,
            username: formData.username,
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword
        };
        registerStudent(studentData);
    };

    const selectRole = (selectedRole: RegistrationRole) => {
        setRole(selectedRole);
        setStep(RegistrationStep.FORM);
    };

    if (step === RegistrationStep.ROLE) {
        return (
            <AuthPageShell
                wide
                title="Create Account"
                subtitle="How would you like to use ExBoard AI?"
                footer={
                    <AuthFooter
                        prompt="Already have an account?"
                        linkText="Sign in"
                        linkHref={FRONTEND_ROUTES.LOGIN}
                    />
                }
            >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                    {ROLE_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        return (
                            <button
                                key={option.role}
                                type="button"
                                onClick={() => selectRole(option.role)}
                                className="group flex h-full min-h-44 flex-col items-center justify-center rounded-2xl border-2 border-border/50 bg-auth-input-bg px-5 py-6 text-center shadow-sm transition-all duration-300 hover:border-primary hover:bg-primary/5 hover:shadow-md"
                            >
                                <div className="mb-3 rounded-xl bg-primary/10 p-3 text-primary transition-transform group-hover:scale-110">
                                    <Icon className="size-7" />
                                </div>
                                <Typography variant="h3" className="mb-1.5 text-sm font-semibold leading-tight text-foreground sm:text-base">
                                    {option.title}
                                </Typography>
                                <Typography variant="muted" className="text-xs leading-relaxed">
                                    {option.description}
                                </Typography>
                            </button>
                        );
                    })}
                </div>
            </AuthPageShell>
        );
    }

    return (
        <AuthPageShell
            wide
            title={registrationTitle(role)}
            subtitle={registrationSubtitle(role)}
        >
            <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {role === RegistrationRole.STUDENT ? (
                            <>
                                {/* Student Name */}
                                <div className="space-y-1.5">
                                    <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Full Name
                                    </Typography>
                                    <div className="relative group">
                                        <AppInput
                                            type="text"
                                            name="name"
                                            placeholder="Full Name"
                                            className="bg-auth-input-bg border-border/50 focus-visible:border-primary transition-all h-11 px-4 text-sm"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                        <UserSVG className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                    </div>
                                </div>

                                {/* Username */}
                                <div className="space-y-1.5">
                                    <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Username
                                    </Typography>
                                    <div className="relative group">
                                        <AppInput
                                            type="text"
                                            name="username"
                                            placeholder="unique_username"
                                            className="bg-auth-input-bg border-border/50 focus-visible:border-primary transition-all h-11 px-4 text-sm"
                                            value={formData.username}
                                            onChange={handleChange}
                                            required
                                        />
                                        <AtSign className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                                    </div>
                                </div>

                                {/* Father's Name */}
                                <div className="space-y-1.5">
                                    <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Father&apos;s Name
                                    </Typography>
                                    <div className="relative group">
                                        <AppInput
                                            type="text"
                                            name="fatherName"
                                            placeholder="Father's Name"
                                            className="bg-auth-input-bg border-border/50 focus-visible:border-primary transition-all h-11 px-4 text-sm"
                                            value={formData.fatherName}
                                            onChange={handleChange}
                                            required
                                        />
                                        <UserSVG className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                                    </div>
                                </div>

                                {/* Date of Birth */}
                                <div className="space-y-1.5">
                                    <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Date of Birth
                                    </Typography>
                                    <div className="relative group">
                                        <AppInput
                                            type="date"
                                            name="dob"
                                            className="bg-auth-input-bg border-border/50 focus-visible:border-primary transition-all h-11 px-4 text-sm text-muted-foreground w-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                            value={formData.dob}
                                            onChange={handleChange}
                                            required
                                            onClick={(e: React.MouseEvent<HTMLInputElement>) => {
                                                if ('showPicker' in HTMLInputElement.prototype) {
                                                    try {
                                                        (e.target as HTMLInputElement).showPicker();
                                                    } catch (err) {
                                                        console.log(err);
                                                    }
                                                }
                                            }}
                                        />
                                        <CalendarSVG className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                    </div>
                                </div>

                                {/* Gender */}
                                <div className="space-y-1.5">
                                    <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Gender
                                    </Typography>
                                    <AppDropdown
                                        name="gender"
                                        className="h-11 bg-auth-input-bg border-border/50"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        placeholder="Select Gender"
                                        options={[
                                            { value: "Male", label: "Male" },
                                            { value: "Female", label: "Female" },
                                        ]}
                                    />
                                </div>

                                {/* Class */}
                                <div className="space-y-1.5">
                                    <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Class
                                    </Typography>
                                    <AppDropdown
                                        name="class"
                                        className="h-11 bg-auth-input-bg border-border/50"
                                        value={formData.class}
                                        onChange={handleChange}
                                        placeholder="Select Class"
                                        options={[
                                            { value: "IX", label: "Class IX" },
                                            { value: "X", label: "Class X" },
                                            { value: "XI", label: "Class XI" },
                                            { value: "XII", label: "Class XII" },
                                        ]}
                                    />
                                </div>

                                {/* Group / Stream */}
                                <div className="space-y-1.5">
                                    <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Group
                                    </Typography>
                                    <AppDropdown
                                        name="stream"
                                        className="h-11 bg-auth-input-bg border-border/50"
                                        value={formData.stream}
                                        onChange={handleChange}
                                        placeholder="Select Group"
                                        options={getGroupsForClass(formData.class).map((g) => ({ value: g, label: g }))}
                                    />
                                </div>

                                {/* School */}
                                <div className="space-y-1.5">
                                    <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        School
                                    </Typography>
                                    <AppDropdown
                                        name="schoolName"
                                        className="h-11 bg-auth-input-bg border-border/50"
                                        value={isOtherSchool ? "Other" : (formData.schoolId || formData.schoolName)}
                                        onChange={handleChange}
                                        placeholder="Select School"
                                        searchable
                                        options={[
                                            ...schools.map((s) => ({ value: s.id, label: s.name })),
                                            { value: "Other", label: "Other" },
                                        ]}
                                    />
                                </div>

                                {/* City */}
                                <div className="space-y-1.5">
                                    <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        City
                                    </Typography>
                                    <AppDropdown
                                        name="city"
                                        className="h-11 bg-auth-input-bg border-border/50"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="Select City"
                                        searchable
                                        options={PAKISTAN_CITIES.map((city) => ({ value: city, label: city }))}
                                    />
                                </div>

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Email
                                    </Typography>
                                    <div className="relative group">
                                        <AppInput
                                            type="email"
                                            name="email"
                                            placeholder="email@example.com"
                                            className="bg-auth-input-bg border-border/50 focus-visible:border-primary transition-all h-11 px-4 text-sm"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                        <MailSVG className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                                    </div>
                                </div>

                                {isOtherSchool && (
                                    <div className="space-y-1.5 md:col-span-2">
                                        <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Custom School Name
                                        </Typography>
                                        <div className="relative group">
                                            <AppInput
                                                type="text"
                                                name="customSchool"
                                                placeholder="Enter School Name"
                                                className="bg-auth-input-bg border-border/50 focus-visible:border-primary transition-all h-11 px-4 text-sm"
                                                value={formData.customSchool}
                                                onChange={handleChange}
                                                required
                                            />
                                            <School className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : role === RegistrationRole.TEACHER ? (
                            <>
                                <div className="space-y-1.5">
                                    <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Full Name
                                    </Typography>
                                    <div className="relative group">
                                        <AppInput
                                            type="text"
                                            name="name"
                                            placeholder="Full Name"
                                            className="h-11 border-border/50 bg-auth-input-bg px-4 text-sm transition-all focus-visible:border-primary"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                        <UserSVG className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Username
                                    </Typography>
                                    <div className="relative group">
                                        <AppInput
                                            type="text"
                                            name="username"
                                            placeholder="unique_username"
                                            className="h-11 border-border/50 bg-auth-input-bg px-4 text-sm transition-all focus-visible:border-primary"
                                            value={formData.username}
                                            onChange={handleChange}
                                            required
                                        />
                                        <AtSign className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Board
                                    </Typography>
                                    <AppDropdown
                                        name="board"
                                        className="h-11 border-border/50 bg-auth-input-bg"
                                        value={formData.board}
                                        onChange={handleChange}
                                        placeholder="Select Board"
                                        options={Object.values(Board).map((board) => ({ value: board, label: board }))}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        School
                                    </Typography>
                                    <AppDropdown
                                        name="schoolName"
                                        className="h-11 border-border/50 bg-auth-input-bg"
                                        value={isOtherSchool ? "Other" : (formData.schoolId || formData.schoolName)}
                                        onChange={handleChange}
                                        placeholder="Select School"
                                        searchable
                                        options={[
                                            ...schools.map((s) => ({ value: s.id, label: s.name })),
                                            { value: "Other", label: "Other" },
                                        ]}
                                    />
                                </div>

                                {isOtherSchool ? (
                                    <div className="space-y-1.5 md:col-span-2">
                                        <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Custom School Name
                                        </Typography>
                                        <div className="relative group">
                                            <AppInput
                                                type="text"
                                                name="customSchool"
                                                placeholder="Enter School Name"
                                                className="h-11 border-border/50 bg-auth-input-bg px-4 text-sm transition-all focus-visible:border-primary"
                                                value={formData.customSchool}
                                                onChange={handleChange}
                                                required
                                            />
                                            <School className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                        </div>
                                    </div>
                                ) : null}

                                <div className="space-y-2 md:col-span-2">
                                    <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Subjects you teach
                                    </Typography>
                                    <SearchableSubjectDropdown
                                        selectedSubjects={formData.subjects}
                                        onChange={(subjects) => setFormData({ ...formData, subjects })}
                                        placeholder="Search and select subjects you teach..."
                                    />
                                </div>

                                <div className="space-y-3 md:col-span-2">
                                    <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Classes you teach
                                    </Typography>
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
                            </>
                        ) : (
                            <>
                                {/* School Name */}
                                <div className="space-y-1.5 md:col-span-2">
                                    <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        School / Organization Name
                                    </Typography>
                                    <div className="relative group">
                                        <AppInput
                                            type="text"
                                            name="name"
                                            placeholder="Ex: Green Valley High"
                                            className="bg-auth-input-bg border-border/50 focus-visible:border-primary transition-all h-11 px-4 text-sm"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                        <BuildingSVG className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                    </div>
                                </div>

                                {/* Contact Person */}
                                <div className="space-y-1.5">
                                    <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Contact Person (Principal/Admin)
                                    </Typography>
                                    <div className="relative group">
                                        <AppInput
                                            type="text"
                                            name="contactPerson"
                                            placeholder="Full Name"
                                            className="bg-auth-input-bg border-border/50 focus-visible:border-primary transition-all h-11 px-4 text-sm"
                                            value={formData.contactPerson}
                                            onChange={handleChange}
                                            required
                                        />
                                        <UserSVG className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                    </div>
                                </div>

                                {/* Username (School) */}
                                <div className="space-y-1.5">
                                    <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Username
                                    </Typography>
                                    <div className="relative group">
                                        <AppInput
                                            type="text"
                                            name="username"
                                            placeholder="unique_username"
                                            className="bg-auth-input-bg border-border/50 focus-visible:border-primary transition-all h-11 px-4 text-sm"
                                            value={formData.username}
                                            onChange={handleChange}
                                            required
                                        />
                                        <AtSign className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="space-y-1.5">
                                    <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Official Contact Number
                                    </Typography>
                                    <div className="relative group">
                                        <AppInput
                                            type="tel"
                                            name="schoolPhone"
                                            placeholder="+92 XXX XXXXXXX"
                                            className="bg-auth-input-bg border-border/50 focus-visible:border-primary transition-all h-11 px-4 text-sm"
                                            value={formData.schoolPhone}
                                            onChange={handleChange}
                                            required
                                        />
                                        <PhoneSVG className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="space-y-1.5 md:col-span-2">
                                    <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Address / Location
                                    </Typography>
                                    <div className="relative group">
                                        <AppInput
                                            type="text"
                                            name="address"
                                            placeholder="Full Address"
                                            className="bg-auth-input-bg border-border/50 focus-visible:border-primary transition-all h-11 px-4 text-sm"
                                            value={formData.address}
                                            onChange={handleChange}
                                            required
                                        />
                                        <LocationSVG className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                    </div>
                                </div>

                                {/* City (School) */}
                                <div className="space-y-1.5 md:col-span-2">
                                    <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        City
                                    </Typography>
                                    <AppDropdown
                                        name="city"
                                        className="h-11 bg-auth-input-bg border-border/50"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="Select City"
                                        searchable
                                        options={PAKISTAN_CITIES.map((city) => ({ value: city, label: city }))}
                                    />
                                </div>

                                {/* Estimated Students */}
                                <div className="space-y-1.5 md:col-span-2">
                                    <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Expected Number of Students
                                    </Typography>
                                    <AppDropdown
                                        name="studentCount"
                                        className="h-11 bg-auth-input-bg border-border/50"
                                        value={formData.studentCount}
                                        onChange={handleChange}
                                        placeholder="Select Range"
                                        options={[
                                            { value: "1-100", label: "1 - 100" },
                                            { value: "101-500", label: "101 - 500" },
                                            { value: "501-2000", label: "501 - 2000" },
                                            { value: "2000+", label: "2000+" },
                                        ]}
                                    />
                                </div>
                            </>
                        )}

                        {/* Common Email Field (student email is placed next to City above) */}
                        {role !== RegistrationRole.STUDENT ? (
                            <div className="space-y-1.5 md:col-span-2">
                                <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    {emailLabel(role)}
                                </Typography>
                                <div className="relative group">
                                    <AppInput
                                        type="email"
                                        name="email"
                                        placeholder="email@example.com"
                                        className="bg-auth-input-bg border-border/50 focus-visible:border-primary transition-all h-11 px-4 text-sm"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                    <MailSVG className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                                </div>
                            </div>
                        ) : null}

                        {/* Password / Confirm Password Side-by-Side */}
                        <div className="space-y-1.5">
                            <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Password
                            </Typography>
                            <div className="relative group">
                                <LockSVG className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <AppInput
                                    id="register-password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    aria-describedby="register-password-requirements"
                                    aria-invalid={Boolean(formData.password) && !passwordIsValid}
                                    placeholder="••••••••"
                                    className="bg-auth-input-bg border-border/50 focus-visible:border-primary transition-all h-11 pl-11 pr-11 text-sm"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 flex size-4 -translate-y-1/2 items-center justify-center p-0 text-muted-foreground group-focus-within:text-primary transition-colors hover:text-primary cursor-pointer"
                                >
                                    {showPassword ? (
                                        <EyeOffSVG className="size-4" />
                                    ) : (
                                        <EyeSVG className="size-4" />
                                    )}
                                </button>
                            </div>
                            <ul id="register-password-requirements" className="mt-2 space-y-1.5 text-xs" aria-label="Password requirements">
                                {passwordChecks.map((check) => (
                                    <li key={check.id} className={cn("flex items-center gap-2", check.valid ? "text-primary" : "text-muted-foreground")}>
                                        <span aria-hidden className={cn("flex size-4 items-center justify-center rounded-full border", check.valid ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                                            {check.valid ? <Check className="size-3" /> : null}
                                        </span>
                                        {check.label}<span className="sr-only">{check.valid ? " met" : " needed"}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-1.5">
                            <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Confirm Password
                            </Typography>
                            <div className="relative group">
                                <LockSVG className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <AppInput
                                    id="register-confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    aria-describedby={formData.confirmPassword ? "register-password-match" : undefined}
                                    aria-invalid={Boolean(formData.confirmPassword) && !passwordsMatch}
                                    placeholder="••••••••"
                                    className="bg-auth-input-bg border-border/50 focus-visible:border-primary transition-all h-11 pl-11 pr-11 text-sm"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 flex size-4 -translate-y-1/2 items-center justify-center p-0 text-muted-foreground group-focus-within:text-primary transition-colors hover:text-primary cursor-pointer"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOffSVG className="size-4" />
                                    ) : (
                                        <EyeSVG className="size-4" />
                                    )}
                                </button>
                            </div>
                            {formData.confirmPassword ? (
                                <p id="register-password-match" aria-live="polite" className={cn("mt-2 text-xs font-medium", passwordsMatch ? "text-primary" : "text-destructive")}>
                                    {passwordsMatch ? "Passwords match" : "Passwords don't match"}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    {/* Terms & Privacy Acceptance Checkmark */}
                    <div className="rounded-xl border border-border/60 bg-auth-input-bg p-3.5 transition-all">
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                            <button
                                type="button"
                                role="checkbox"
                                aria-checked={acceptedTerms}
                                onClick={() => setAcceptedTerms(!acceptedTerms)}
                                className={cn(
                                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 cursor-pointer",
                                    acceptedTerms
                                        ? "border-primary bg-primary text-primary-foreground shadow-xs shadow-primary/30"
                                        : "border-border/80 bg-background hover:border-primary/60"
                                )}
                            >
                                {acceptedTerms && <Check className="size-3.5 stroke-[3]" />}
                            </button>
                            <span className="text-xs leading-relaxed text-muted-foreground">
                                I accept the{" "}
                                <Link
                                    href={FRONTEND_ROUTES.TERMS}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-foreground transition-colors hover:text-primary"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Terms &amp; Conditions
                                </Link>{" "}
                                and confirm that I have reviewed the{" "}
                                <Link
                                    href={FRONTEND_ROUTES.PRIVACY}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-foreground transition-colors hover:text-primary"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Privacy Policy
                                </Link>
                                .
                            </span>
                        </label>
                    </div>

                    <div className="space-y-3">
                        <AppButton
                            type="submit"
                            size="lg"
                            className="h-12 w-full rounded-xl text-base font-bold shadow-lg shadow-primary/25"
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : "Complete Registration"}
                        </AppButton>
                        <button
                            type="button"
                            onClick={() => setStep(RegistrationStep.ROLE)}
                            className="w-full text-center text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
                        >
                            Back to create account
                        </button>
                    </div>
                </form>
        </AuthPageShell>
    );
}
