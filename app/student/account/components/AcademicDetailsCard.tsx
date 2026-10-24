"use client";

import React from "react";
import Link from "next/link";
import AppButton from "@/components/AppButton";
import BuildingSVG from "@/public/svgs/BuildingSVG";
import BoardSVG from "@/public/svgs/BoardSVG";
import ClassroomSVG from "@/public/svgs/ClassroomSVG";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import LocationSVG from "@/public/svgs/LocationSVG";
import UserSVG from "@/public/svgs/UserSVG";
import MailSVG from "@/public/svgs/MailSVG";
import SecureExamSVG from "@/public/svgs/SecureExamSVG";
import EditSVG from "@/public/svgs/EditSVG";
import { formatSchoolName } from "@/lib/utils";

interface AcademicDetailsCardProps {
  user: any;
  profileData: any;
}

export default function AcademicDetailsCard({
  user,
  profileData,
}: AcademicDetailsCardProps) {
  const schoolName = profileData?.schoolName || user.schoolName || null;
  const schoolLogo = profileData?.schoolLogo || null;
  const userClass = profileData?.class || user.class || null;
  const board = profileData?.board || user.board || null;
  const stream = profileData?.stream || user.stream || null;
  const city = profileData?.city || user.city || null;
  const email = profileData?.email || user.email || "";
  const name = profileData?.name || user.name || "";
  const username = profileData?.username || user.username || "";
  const strictMode = profileData?.examStrictMode ?? user.examStrictMode ?? true;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Academic Information */}
      <div className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ClassroomSVG className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-foreground sm:text-lg">
                Academic Profile
              </h3>
              <p className="text-xs text-muted-foreground">
                Institutional and curricular enrollment details
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* School */}
          <div className="flex items-start gap-3.5 rounded-2xl bg-muted/40 p-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card border border-border/60 p-1.5 shadow-2xs">
              {schoolLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={schoolLogo}
                  alt={schoolName || "School"}
                  className="size-full object-contain"
                />
              ) : (
                <BuildingSVG className="size-5 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Registered Institution
              </span>
              <p className="font-bold text-sm text-foreground">
                {schoolName ? formatSchoolName(schoolName) : "Independent Student"}
              </p>
            </div>
          </div>

          {/* Board & Class Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card border border-border/60 text-primary p-1.5">
                <BoardSVG className="size-4 text-primary" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Board
                </span>
                <p className="font-bold text-xs uppercase text-foreground">
                  {board || "Not specified"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card border border-border/60 text-primary p-1.5">
                <ClassroomSVG className="size-4 text-primary" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Class
                </span>
                <p className="font-bold text-xs text-foreground">
                  {userClass ? `Class ${userClass}` : "Not specified"}
                </p>
              </div>
            </div>
          </div>

          {/* Stream & City */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card border border-border/60 text-primary p-1.5">
                <BookOpenSVG className="size-4 text-primary" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Stream / Group
                </span>
                <p className="font-bold text-xs text-foreground truncate">
                  {stream || "Science / General"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card border border-border/60 text-primary p-1.5">
                <LocationSVG className="size-4 text-primary" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  City / Region
                </span>
                <p className="font-bold text-xs text-foreground">
                  {city || "Karachi"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account & Security Information */}
      <div className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <SecureExamSVG className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-foreground sm:text-lg">
                Account & Credentials
              </h3>
              <p className="text-xs text-muted-foreground">
                Security settings and account identifiers
              </p>
            </div>
          </div>

          <Link href="/student/settings">
            <AppButton variant="outline" className="rounded-xl px-3 py-1.5 text-xs font-bold gap-1.5 shadow-2xs">
              <EditSVG className="size-3.5 text-primary" />
              <span>Edit</span>
            </AppButton>
          </Link>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card border border-border/60 text-primary p-1.5">
                <UserSVG className="size-4 text-primary" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Full Name
                </span>
                <p className="font-bold text-xs text-foreground">{name}</p>
              </div>
            </div>
            {username ? (
              <span className="text-xs font-bold text-muted-foreground bg-card px-2.5 py-1 rounded-lg border border-border/60">
                @{username}
              </span>
            ) : null}
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card border border-border/60 text-primary p-1.5">
                <MailSVG className="size-4 text-primary" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Email Address
                </span>
                <p className="font-bold text-xs text-foreground truncate">{email}</p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary">
              Verified
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card border border-border/60 text-primary p-1.5">
                <SecureExamSVG className="size-4 text-primary" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Exam Strict Mode
                </span>
                <p className="font-bold text-xs text-foreground">
                  {strictMode ? "Enabled (Anti-cheat active)" : "Standard Mode"}
                </p>
              </div>
            </div>
            <span
              className={
                strictMode
                  ? "rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-black text-primary"
                  : "rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground"
              }
            >
              {strictMode ? "Active" : "Off"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
