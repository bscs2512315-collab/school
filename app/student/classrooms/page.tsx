"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import ClassroomCard from "@/components/ClassroomCard";
import AppLoader from "@/components/AppLoader";
import AppButton from "@/components/AppButton";
import ClassroomSVG from "@/public/svgs/ClassroomSVG";
import { FRONTEND_ROUTES, API_ENDPOINTS } from "@/constants/endpoints";
import { useStudentClassrooms } from "@/hooks/student/useStudentClassrooms";
import { apiPost } from "@/lib/api/api-client";
import { KeyRound, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import LockSVG from "@/public/svgs/LockSVG";

export default function StudentClassroomsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: classrooms = [], isLoading, refetch } = useStudentClassrooms();

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const queryJoin = searchParams.get("join") || searchParams.get("pin");
    if (queryJoin) {
      setPin(queryJoin.trim().toUpperCase());
      setJoinModalOpen(true);
    }
  }, [searchParams]);

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPin = pin.trim().toUpperCase();
    if (!cleanPin) {
      toast.error("Please enter a classroom PIN");
      return;
    }

    setJoining(true);
    try {
      const res = await apiPost<{
        classroomId: string;
        name: string;
        subject: string;
        teacherName: string;
        alreadyJoined?: boolean;
      }>(API_ENDPOINTS.STUDENT.CLASSROOMS_JOIN || "/student/classrooms/join", {
        pin: cleanPin,
      });

      if (!res.success) {
        toast.error(res.message || "Invalid PIN code");
        return;
      }

      toast.success(res.message || "Classroom joined successfully!");
      setJoinModalOpen(false);
      setPin("");
      await refetch();

      if (res.data?.classroomId) {
        router.push(FRONTEND_ROUTES.STUDENT_CLASSROOM(res.data.classroomId));
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to join classroom",
      );
    } finally {
      setJoining(false);
    }
  };

  return (
    <PageContainer className="flex min-h-[calc(100dvh-12rem)] flex-col">
      <PageHeader
        title="My Classrooms"
        actions={
          <AppButton
            type="button"
            className="rounded-xl h-11 px-5 font-bold shadow-lg shadow-primary/20"
            onClick={() => setJoinModalOpen(true)}
          >
            Join with PIN
          </AppButton>
        }
      />

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-12">
          <AppLoader className="min-h-0" />
        </div>
      ) : classrooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border/80 bg-card/60 p-8 text-center sm:p-14 backdrop-blur-md my-auto">
          <div className="mb-4 flex size-14 sm:size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
            <ClassroomSVG className="size-8 sm:size-9" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-foreground">
            No classrooms joined yet
          </h3>
          <p className="mt-1.5 max-w-xs text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Ask your teacher for their 6-character Classroom PIN and join to access practice tests and study material.
          </p>
          <AppButton
            type="button"
            className="mt-6 rounded-full px-6 font-bold"
            onClick={() => setJoinModalOpen(true)}
          >
            <KeyRound className="size-4 mr-2" />
            Join Classroom with PIN
          </AppButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {classrooms.map((c) => (
            <ClassroomCard
              key={c.id}
              id={c.id}
              name={c.name}
              teacherName={c.teacherName}
              teacherImage={c.teacherImage}
              subject={c.subject}
              classLevel={c.classLevel}
              board={c.board}
              pinCode={c.pinCode || c.pin}
              schoolName={c.schoolName}
              paperCount={c.paperCount ?? 0}
              href={FRONTEND_ROUTES.STUDENT_CLASSROOM(c.id)}
            />
          ))}
        </div>
      )}

      {joinModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-border bg-background shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <LockSVG className="size-5" />
                </div>
                <div className="text-left">
                  <h2 className="text-base font-black leading-none text-foreground">
                    Join Classroom
                  </h2>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    Enter the 6-character PIN code
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setJoinModalOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleJoin} className="space-y-4 p-6">
              <div className="space-y-3">
                <label className="mb-4 block text-xs font-bold text-foreground">
                  Classroom PIN Code
                </label>
                <input
                  type="text"
                  maxLength={10}
                  autoFocus
                  placeholder="e.g. 7X9K2P"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  className="h-14 w-full rounded-2xl border-2 border-border/60 bg-muted/20 px-4 text-center font-mono text-2xl font-black tracking-[0.25em] text-foreground uppercase placeholder:text-muted-foreground/40 placeholder:tracking-normal placeholder:font-sans placeholder:text-base outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
                />
                <p className="mt-3 text-[11px] text-muted-foreground text-center">
                  Enter the 6-character code provided by your teacher.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <AppButton
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl h-11"
                  onClick={() => setJoinModalOpen(false)}
                >
                  Cancel
                </AppButton>
                <AppButton
                  type="submit"
                  className="flex-1 rounded-xl h-11 font-black"
                  disabled={joining || pin.trim().length < 4}
                >
                  {joining ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : null}
                  Join Now
                </AppButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
}
