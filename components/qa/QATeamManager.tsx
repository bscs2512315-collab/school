"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Search,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Mail,
  School,
  GraduationCap,
  X,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/UserAvatar";

export default function QATeamManager() {
  const [qaUsers, setQaUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [candidateUsers, setCandidateUsers] = useState<any[]>([]);
  const [searchingCandidates, setSearchingCandidates] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchQaUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/qa-users");
      if (res.ok) {
        const data = await res.json();
        setQaUsers(data.qaUsers || []);
      }
    } catch {
      toast.error("Failed to load QA users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQaUsers();
  }, []);

  // Search candidate registered app users
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setCandidateUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingCandidates(true);
      try {
        const res = await fetch(`/api/admin/qa-users?search=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setCandidateUsers(data.candidateUsers || []);
        }
      } catch {
        // ignore
      } finally {
        setSearchingCandidates(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleToggleRole = async (user: any, action: "ADD" | "REMOVE") => {
    // Optimistic UI
    if (action === "REMOVE") {
      setQaUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      setQaUsers((prev) => [{ ...user, role: "QA" }, ...prev.filter((u) => u.id !== user.id)]);
      setIsAddModalOpen(false);
      setSearchQuery("");
    }

    try {
      const res = await fetch("/api/admin/qa-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "User role updated");
        fetchQaUsers();
      } else {
        toast.error(data.error || "Failed to update user role");
        fetchQaUsers();
      }
    } catch {
      toast.error("Network error updating QA role");
      fetchQaUsers();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <Users className="size-5 text-primary" />
            QA Team & Testers
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage authenticated users with QA permissions to report and verify bugs across the app.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchQaUsers}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-all"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"
          >
            <UserPlus className="size-4" />
            <span>Add QA Member</span>
          </button>
        </div>
      </div>

      {/* QA Members Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card py-16 text-center">
          <RefreshCw className="size-8 animate-spin text-primary" />
          <p className="mt-3 text-sm font-semibold text-muted-foreground">Loading QA team...</p>
        </div>
      ) : qaUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-3">
            <ShieldAlert className="size-8" />
          </div>
          <h3 className="text-base font-bold text-foreground">No QA members assigned yet</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            Click "Add QA Member" to select any signed-up app user and assign them the QA testing role.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {qaUsers.map((user) => {
            const isProtected = user.email?.toLowerCase() === "mtahatalib110+aliya@gmail.com";
            return (
              <div
                key={user.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={user.profile_image}
                      name={user.name || user.email}
                      size={44}
                      showRing
                      ringClassName="ring-2 ring-primary/20"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="truncate text-sm font-black text-foreground">
                          {user.name || "App User"}
                        </h4>
                        <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[10px] font-black uppercase tracking-wide text-amber-600 dark:text-amber-400">
                          QA
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Mail className="size-3 shrink-0" />
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex flex-col gap-0.5">
                    {user.school_name && (
                      <span className="flex items-center gap-1 text-[11px] truncate max-w-[160px]">
                        <School className="size-3" />
                        {user.school_name}
                      </span>
                    )}
                    {user.class && (
                      <span className="flex items-center gap-1 text-[11px]">
                        <GraduationCap className="size-3" />
                        Class {user.class}
                      </span>
                    )}
                  </div>

                  {!isProtected ? (
                    <button
                      type="button"
                      onClick={() => handleToggleRole(user, "REMOVE")}
                      className="inline-flex items-center gap-1 rounded-xl border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-[11px] font-bold text-destructive hover:bg-destructive hover:text-white transition-all active:scale-95"
                      title="Revoke QA permissions"
                    >
                      <UserX className="size-3.5" />
                      <span>Remove QA</span>
                    </button>
                  ) : (
                    <span className="rounded-xl bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                      Primary QA
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add QA Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <UserPlus className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Add QA Team Member</h3>
                  <p className="text-xs text-muted-foreground">
                    Search registered app users by name or email to assign QA role.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type name or email (e.g. taha, aliya, student@gmail.com)..."
                  className="w-full rounded-2xl border border-border bg-background py-2.5 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Candidates Results */}
            <div className="mt-4 max-h-72 overflow-y-auto space-y-2 pr-1">
              {searchingCandidates ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-primary" />
                  Searching registered users...
                </div>
              ) : searchQuery.trim().length >= 2 && candidateUsers.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No registered users found matching "{searchQuery}".
                </div>
              ) : candidateUsers.length > 0 ? (
                candidateUsers.map((cand) => {
                  const isAlreadyQA = cand.role === "QA";
                  return (
                    <div
                      key={cand.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background p-3 hover:border-primary/40 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar src={cand.profile_image} name={cand.name || cand.email} size={36} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-foreground">
                            {cand.name || "User"}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">{cand.email}</p>
                        </div>
                      </div>

                      {isAlreadyQA ? (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <UserCheck className="size-3" />
                          <span>Active QA</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleRole(cand, "ADD")}
                          className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 active:scale-95 transition-all"
                        >
                          <UserPlus className="size-3.5" />
                          <span>Make QA</span>
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Type at least 2 characters to search signed up app users.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 border-t border-border/60 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
