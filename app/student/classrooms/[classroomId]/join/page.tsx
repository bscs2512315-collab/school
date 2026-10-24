"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLoader from "@/components/AppLoader";
import toast from "react-hot-toast";
import { API_ENDPOINTS, FRONTEND_ROUTES } from "@/constants/endpoints";
import { apiPost } from "@/lib/api/api-client";
import { Typography } from "@/components/ui/Typography";
import AppButton from "@/components/AppButton";

interface JoinResult {
  classroomId: string;
  redirectTo?: string;
  alreadyJoined?: boolean;
}

export default function JoinClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const classroomId = decodeURIComponent(String(params.classroomId || ""));
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const joinClassroom = useCallback(async () => {
    if (!classroomId) {
      setError("Invalid classroom link");
      setJoining(false);
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const res = await apiPost<JoinResult>(
        API_ENDPOINTS.CLASSROOMS.JOIN(classroomId),
        {},
      );
      if (!res.success) {
        setError(res.message || "Could not join classroom");
        setJoining(false);
        return;
      }
      toast.success(
        res.data.alreadyJoined
          ? "You're already in this classroom"
          : "Joined classroom!",
      );
      router.replace(
        res.data.redirectTo || FRONTEND_ROUTES.STUDENT_CLASSROOM(classroomId),
      );
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as { message: unknown }).message === "string"
          ? (err as { message: string }).message
          : "Could not join classroom";
      setError(message);
      setJoining(false);
    }
  }, [classroomId, router]);

  useEffect(() => {
    void joinClassroom();
  }, [joinClassroom, attempt]);

  return (
    <div className="flex min-h-[calc(100dvh-12rem)] flex-col items-center justify-center gap-4 px-4 text-center">
      {joining ? (
        <>
          <AppLoader className="min-h-0" />
          <Typography className="font-bold">Joining classroom…</Typography>
        </>
      ) : null}

      {error ? (
        <>
          <Typography className="font-bold text-error">{error}</Typography>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <AppButton
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => router.push(FRONTEND_ROUTES.STUDENT_CLASSROOMS)}
            >
              My Classrooms
            </AppButton>
            <AppButton
              type="button"
              className="rounded-xl font-bold"
              onClick={() => setAttempt((n) => n + 1)}
            >
              Try again
            </AppButton>
          </div>
        </>
      ) : null}
    </div>
  );
}
