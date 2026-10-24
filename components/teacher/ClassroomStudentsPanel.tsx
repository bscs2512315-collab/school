"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Search, X } from "lucide-react";
import ChallengeSVG from "@/public/svgs/ChallengeSVG";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import MailSVG from "@/public/svgs/MailSVG";
import toast from "react-hot-toast";
import AppButton from "@/components/AppButton";
import AppLoader from "@/components/AppLoader";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";
import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiDelete, apiGet, apiPost } from "@/lib/api/api-client";
import { ClassroomMemberStatus } from "@/types/enums";
import { classesMatch } from "@/lib/teacher/class-level";

interface ClassroomMember {
  id: string;
  studentId: string;
  status: string;
  name: string;
  email: string;
  username: string | null;
  class: string | null;
  profileImage: string | null;
  points: number;
}

interface SearchStudent {
  id: string;
  name: string;
  email: string;
  username: string | null;
  class: string | null;
  profileImage: string | null;
  points: number;
  inSchool?: boolean;
}

interface Props {
  classroomId: string;
  classLevel: string;
  isTeacher: boolean;
  visibility?: "school" | "private";
}

export default function ClassroomStudentsPanel({
  classroomId,
  classLevel,
  isTeacher,
  visibility = "school",
}: Props) {
  const isPrivate = visibility === "private";
  const [members, setMembers] = useState<ClassroomMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchStudent[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchStudent[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadMembers = async () => {
    const res = await apiGet<ClassroomMember[]>(
      API_ENDPOINTS.TEACHER.CLASSROOM_MEMBERS(classroomId),
    );
    if (res.success) setMembers(res.data);
  };

  useEffect(() => {
    if (!isTeacher) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        await loadMembers();
      } catch {
        toast.error("Failed to load classroom students");
      } finally {
        setLoading(false);
      }
    })();
  }, [classroomId, isTeacher]);

  const memberIds = useMemo(
    () => new Set(members.map((m) => m.studentId)),
    [members],
  );

  const selectedIds = useMemo(
    () => new Set(selected.map((s) => s.id)),
    [selected],
  );

  const resetInviteState = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setSelected([]);
    setSearching(false);
  };

  const closeInvite = () => {
    setInviteOpen(false);
    resetInviteState();
  };

  const runSearch = async () => {
    const q = query.trim();
    if (q.length < 2) {
      toast.error("Type at least 2 characters to search");
      return;
    }

    setSearching(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams({
        q,
        visibility: isPrivate ? "private" : "school",
        classLevel,
      });
      const res = await apiGet<SearchStudent[]>(
        `${API_ENDPOINTS.TEACHER.STUDENTS_SEARCH}?${params.toString()}`,
      );
      if (!res.success) {
        toast.error(res.message || "Search failed");
        setResults([]);
        return;
      }
      setResults(res.data.filter((s) => !memberIds.has(s.id)));
    } catch (error: unknown) {
      setResults([]);
      toast.error(
        error &&
          typeof error === "object" &&
          "message" in error &&
          typeof (error as { message: unknown }).message === "string"
          ? (error as { message: string }).message
          : "Search failed",
      );
    } finally {
      setSearching(false);
    }
  };

  const toggleSelected = (student: SearchStudent) => {
    setSelected((prev) => {
      if (prev.some((s) => s.id === student.id)) {
        return prev.filter((s) => s.id !== student.id);
      }
      return [...prev, student];
    });
  };

  const handleInvite = async () => {
    if (selected.length === 0) {
      toast.error("Select at least one student to invite");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiPost<{ count: number; skipped?: Array<{ reason: string }> }>(
        API_ENDPOINTS.TEACHER.CLASSROOM_MEMBERS(classroomId),
        {
          studentIds: selected.map((s) => s.id),
          autoAccept: false,
        },
      );
      if (!res.success) {
        toast.error(res.message || "Failed to invite students");
        return;
      }
      toast.success(
        res.message ||
          `Invite sent to ${selected.length} student${selected.length === 1 ? "" : "s"}`,
      );
      closeInvite();
      await loadMembers();
    } catch (error: unknown) {
      toast.error(
        error &&
          typeof error === "object" &&
          "message" in error &&
          typeof (error as { message: unknown }).message === "string"
          ? (error as { message: string }).message
          : "Failed to invite students",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (studentId: string) => {
    setRemovingId(studentId);
    try {
      const res = await apiDelete(
        API_ENDPOINTS.TEACHER.CLASSROOM_MEMBER(classroomId, studentId),
      );
      if (!res.success) {
        toast.error(res.message || "Failed to remove student");
        return;
      }
      toast.success("Student removed");
      setMembers((prev) => prev.filter((m) => m.studentId !== studentId));
    } catch {
      toast.error("Failed to remove student");
    } finally {
      setRemovingId(null);
    }
  };

  if (!isTeacher) return null;

  if (loading) {
    return <AppLoader className="min-h-[350px] w-full flex-1" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Typography className="font-bold">Classroom roster</Typography>
          <Typography variant="muted" className="text-sm">
            {
              members.filter((m) => m.status === ClassroomMemberStatus.ACCEPTED)
                .length
            }{" "}
            joined
            {members.some((m) => m.status === ClassroomMemberStatus.PENDING)
              ? ` · ${
                  members.filter(
                    (m) => m.status === ClassroomMemberStatus.PENDING,
                  ).length
                } pending`
              : ""}
          </Typography>
        </div>
        <AppButton
          type="button"
          className="rounded-xl font-bold"
          onClick={() => {
            resetInviteState();
            setInviteOpen(true);
          }}
        >
          <ChallengeSVG className="size-4" />
          Invite students
        </AppButton>
      </div>

      {members.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-border/50 bg-card/30 py-16 text-center">
          <ChallengeSVG className="mx-auto mb-3 size-12 text-muted-foreground/30" />
          <Typography className="font-bold text-muted-foreground">
            No students yet
          </Typography>
          <Typography variant="muted" className="mt-1 block text-sm">
            Search by name, username, or email, select students, then send invites.
          </Typography>
        </div>
      ) : (
        <div className="grid gap-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-start gap-3 rounded-[1.5rem] border border-border/50 bg-card/40 p-4 transition-colors hover:bg-card/70 sm:items-center sm:gap-4"
            >
              {member.profileImage ? (
                <img
                  src={member.profileImage}
                  alt={member.name}
                  className="size-11 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-black text-primary">
                  {member.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="break-words font-bold leading-snug">{member.name}</p>
                <div className="mt-0.5 flex items-start gap-1.5 text-muted-foreground">
                  <MailSVG className="mt-0.5 size-3 shrink-0" />
                  <span className="break-words text-xs">{member.email}</span>
                </div>
              </div>
              <AppButton
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={removingId === member.studentId}
                onClick={() => void handleRemove(member.studentId)}
              >
                {removingId === member.studentId ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <DeleteSVG className="size-4" />
                )}
              </AppButton>
            </div>
          ))}
        </div>
      )}

      {inviteOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-[2rem] border border-border bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
              <div>
                <Typography className="font-bold">Invite students</Typography>
                <p className="text-xs text-muted-foreground">
                  Search, select one or more, then send invites
                  {isPrivate ? " · Private classroom" : ` · Class ${classLevel}`}
                </p>
              </div>
              <button
                type="button"
                onClick={closeInvite}
                className="rounded-lg p-2 hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto p-5">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void runSearch();
                }}
              >
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name, @username, or email"
                    autoFocus
                    className="h-11 w-full rounded-xl border border-border/40 bg-muted/30 pr-3 pl-10 text-sm outline-none focus:border-primary/50"
                  />
                </div>
                <AppButton
                  type="submit"
                  className="h-11 shrink-0 rounded-xl px-4 font-bold"
                  disabled={searching}
                >
                  {searching ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Search"
                  )}
                </AppButton>
              </form>

              {selected.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2">
                  <span className="text-xs font-bold text-primary">
                    {selected.length} selected
                  </span>
                  {selected.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSelected(s)}
                      className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground"
                    >
                      {s.name}
                      <X className="size-3" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelected([])}
                    className="ml-auto text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                </div>
              ) : null}

              <div className="max-h-72 space-y-2 overflow-y-auto">
                {!hasSearched ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Type a name like <span className="font-semibold">taha</span>{" "}
                    and press Search or Enter.
                  </p>
                ) : searching ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="size-6 animate-spin text-primary" />
                  </div>
                ) : results.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No students found for “{query.trim()}”.
                    {isPrivate
                      ? ""
                      : " Try another spelling, or check they are in your school."}
                  </p>
                ) : (
                  results.map((student) => {
                    const isSelected = selectedIds.has(student.id);
                    const sameClass = classesMatch(student.class, classLevel);
                    return (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => toggleSelected(student)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors",
                          {
                            "border-primary bg-primary/5": isSelected,
                            "border-border/40 hover:bg-muted/40": !isSelected,
                          },
                        )}
                      >
                        <div
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-md border",
                            {
                              "border-primary bg-primary text-primary-foreground":
                                isSelected,
                              "border-border": !isSelected,
                            },
                          )}
                        >
                          {isSelected ? <Check className="size-3.5" /> : null}
                        </div>
                        {student.profileImage ? (
                          <img
                            src={student.profileImage}
                            alt={student.name}
                            className="size-9 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">
                            {student.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">
                            {student.name}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {student.email}
                            {student.username ? ` · @${student.username}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-0.5">
                          <span
                            className={cn("text-[10px] font-black uppercase", {
                              "text-muted-foreground": sameClass,
                              "text-error": !sameClass,
                            })}
                          >
                            {student.class ? `Class ${student.class}` : "—"}
                          </span>
                          {!isPrivate && student.inSchool === false ? (
                            <span className="text-[9px] font-semibold text-muted-foreground">
                              Other school
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Selected students get an in-app notification and email with a
                Join Classroom button.
              </p>
            </div>

            <div className="flex gap-3 border-t border-border/40 p-5">
              <AppButton
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={closeInvite}
              >
                Cancel
              </AppButton>
              <AppButton
                type="button"
                className="flex-1 rounded-xl font-bold"
                disabled={submitting || selected.length === 0}
                onClick={() => void handleInvite()}
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ChallengeSVG className="size-4" />
                )}
                Invite {selected.length > 0 ? selected.length : ""}
              </AppButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
