"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import { Typography } from "@/components/ui/Typography";
import AppButton from "@/components/AppButton";
import AppDropdown from "@/components/AppDropdown";
import {
  Search,
  Trash2,
  RefreshCw,
  Trophy,
  ShieldAlert,
  Check,
  Copy,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Loader2,
  Calendar,
} from "lucide-react";
import StudentsSVG from "@/public/svgs/StudentsSVG";
import ClassroomSVG from "@/public/svgs/ClassroomSVG";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import BuildingSVG from "@/public/svgs/BuildingSVG";
import CrownSVG from "@/public/svgs/CrownSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import UserAvatar from "@/components/UserAvatar";
import apiInstance from "@/lib/api-instance";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import AppLoader from "@/components/AppLoader";

const SORT_OPTIONS = [
  { value: "created_at", label: "Joined Date" },
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "points", label: "Points" },
  { value: "role", label: "Role" },
];

const SORT_ORDER_OPTIONS = [
  { value: "DESC", label: "Desc ↓" },
  { value: "ASC", label: "Asc ↑" },
];

const LIMIT_OPTIONS = [
  { value: "10", label: "10 / page" },
  { value: "20", label: "20 / page" },
  { value: "50", label: "50 / page" },
  { value: "100", label: "100 / page" },
];

interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  class: string | null;
  board: string | null;
  school_name: string | null;
  points: number | null;
  rank: number | null;
  profile_image: string | null;
  username: string | null;
  city: string | null;
  phone: string | null;
  is_verified: boolean;
  registered_by_school: boolean;
  created_at: string;
  solved_papers_count?: number;
  generated_papers_count?: number;
  last_attempt_at?: string | null;
  last_solved_paper?: string | null;
  challenges_joined?: number;
}

interface StatsOverview {
  total: number;
  students: number;
  teachers: number;
  schools: number;
  admins: number;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsOverview>({
    total: 0,
    students: 0,
    teachers: 0,
    schools: 0,
    admins: 0,
  });
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC">("DESC");

  // Selection
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Deletion Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [usersToDelete, setUsersToDelete] = useState<ManagedUser[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await apiInstance.get("/admin/users", {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch,
          role: selectedRole,
          sortBy,
          sortOrder,
        },
      })) as {
        success: boolean;
        data: {
          users: ManagedUser[];
          pagination: PaginationMeta;
          stats: StatsOverview;
        };
      };

      if (res.success && res.data) {
        setUsers(res.data.users);
        setPagination(res.data.pagination);
        setStats(res.data.stats);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load users";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, selectedRole, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Clear selections when page/filter changes
  useEffect(() => {
    setSelectedUserIds([]);
  }, [pagination.page, selectedRole, debouncedSearch]);

  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    toast.success("Email copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Selection Logic
  const selectableUsers = users.filter((u) => u.role !== "ADMIN");
  const isAllSelected =
    selectableUsers.length > 0 &&
    selectableUsers.every((u) => selectedUserIds.includes(u.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(selectableUsers.map((u) => u.id));
    }
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  // Single User Delete
  const handleInitiateSingleDelete = (user: ManagedUser) => {
    if (user.role === "ADMIN") {
      toast.error("Administrator accounts cannot be deleted.");
      return;
    }
    setUsersToDelete([user]);
    setIsDeleteModalOpen(true);
  };

  // Bulk Delete
  const handleInitiateBulkDelete = () => {
    const targets = users.filter((u) => selectedUserIds.includes(u.id) && u.role !== "ADMIN");
    if (targets.length === 0) {
      toast.error("Please select at least one non-admin user to delete.");
      return;
    }
    setUsersToDelete(targets);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (usersToDelete.length === 0) return;
    setIsDeleting(true);
    try {
      const userIds = usersToDelete.map((u) => u.id);
      const res = (await apiInstance.delete("/admin/users", {
        data: { userIds },
      })) as { success: boolean; message: string };

      if (res.success) {
        toast.success(res.message || "User account(s) deleted successfully.");
        setIsDeleteModalOpen(false);
        setUsersToDelete([]);
        setSelectedUserIds([]);
        fetchUsers();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete user(s).";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role?.toUpperCase()) {
      case "STUDENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <ClassroomSVG className="size-3.5" /> Student
          </span>
        );
      case "TEACHER":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <BookOpenSVG className="size-3.5" /> Teacher
          </span>
        );
      case "SCHOOL":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <BuildingSVG className="size-3.5" /> Institute
          </span>
        );
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <CrownSVG className="size-3.5" /> Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-muted text-muted-foreground border border-border/50">
            {role}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const activeFiltersCount = (searchTerm ? 1 : 0) + (selectedRole !== "ALL" ? 1 : 0);

  const roleFilterCards = [
    {
      label: "Total Users",
      count: stats.total,
      roleKey: "ALL",
      icon: StudentsSVG,
      badge: "Platform",
      gradientClass: "bg-linear-to-br from-[#008503] via-[#005f02] to-[#004a02]",
      borderClass: "border-primary-light/30",
    },
    {
      label: "Students",
      count: stats.students,
      roleKey: "STUDENT",
      icon: ClassroomSVG,
      badge: "Learners",
      gradientClass: "bg-linear-to-br from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]",
      borderClass: "border-blue-300/30",
    },
    {
      label: "Teachers",
      count: stats.teachers,
      roleKey: "TEACHER",
      icon: BookOpenSVG,
      badge: "Faculty",
      gradientClass: "bg-linear-to-br from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9]",
      borderClass: "border-purple-300/30",
    },
    {
      label: "Institutes",
      count: stats.schools,
      roleKey: "SCHOOL",
      icon: BuildingSVG,
      badge: "Campuses",
      gradientClass: "bg-linear-to-br from-[#f59e0b] via-[#d97706] to-[#b45309]",
      borderClass: "border-amber-300/30",
    },
    {
      label: "Admins",
      count: stats.admins,
      roleKey: "ADMIN",
      icon: CrownSVG,
      badge: "Root Access",
      gradientClass: "bg-linear-to-br from-[#f43f5e] via-[#e11d48] to-[#be123c]",
      borderClass: "border-rose-300/30",
    },
  ];

  return (
    <PageContainer className="p-3 sm:p-5 md:p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader title="User Management" />

      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              Identity & Access Control
            </span>
            <span className="text-xs text-muted-foreground">
              {stats.total} registered accounts
            </span>
          </div>
          <Typography
            as="h1"
            className="text-2xl sm:text-3xl font-black text-foreground mt-1.5 tracking-tight"
          >
            User Accounts & Directory
          </Typography>
          <Typography
            as="p"
            className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl"
          >
            Search, filter, inspect academic details, solve history, and safely manage user accounts across all roles.
          </Typography>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <AppButton
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
            className="h-10 px-3.5 rounded-2xl border-border/60 hover:bg-muted/60"
          >
            <RefreshCw className={cn("size-4 mr-1.5 text-muted-foreground", loading && "animate-spin text-primary")} />
            <span className="text-xs font-semibold">Refresh</span>
          </AppButton>
        </div>
      </div>

      {/* 2. KPI Stats & Role Filter Cards Grid (Grading Pipeline Stream / Coverage Aesthetic) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {roleFilterCards.map((item) => {
          const isSelected = selectedRole === item.roleKey;
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setSelectedRole(item.roleKey);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-5 text-left text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer min-w-[130px]",
                item.gradientClass,
                item.borderClass,
                isSelected ? "ring-3 ring-white/90 shadow-2xl scale-[1.02]" : "opacity-90 hover:opacity-100"
              )}
            >
              {/* Ambient Background & Watermark */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                <div className="absolute -top-[20%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[25px]" />
                <div className="absolute -bottom-[20%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[30px]" />
                <div
                  className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
                  style={{
                    backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                    backgroundSize: "18px 18px",
                  }}
                />
                <div className="pointer-events-none absolute -bottom-2 -right-2 opacity-15 transition-transform duration-500 group-hover:scale-110">
                  <Icon className="size-20 sm:size-24 text-white" />
                </div>
              </div>

              {/* Top row with icon & badge */}
              <div className="relative z-10 flex items-center justify-between gap-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-white/95 flex items-center gap-1.5 drop-shadow-2xs">
                  <Icon className="size-4 text-white" />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="rounded-full bg-white/20 border border-white/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs shrink-0">
                  {item.badge}
                </span>
              </div>

              {/* Value & Active Status Indicator */}
              <div className="relative z-10 mt-3 sm:mt-4 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-xs">
                    {loading ? "..." : item.count.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-white/90">
                  {isSelected ? (
                    <>
                      <span className="size-1.5 rounded-full bg-white animate-pulse" />
                      <span>Active Filter</span>
                    </>
                  ) : (
                    <span className="text-white/70 font-semibold">Click to filter</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Search and Filters Bar */}
      <div className="bg-card border border-border/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student, teacher, email, username, or school..."
              className="w-full h-11 bg-background border border-border/60 rounded-2xl pl-11 pr-10 text-sm focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/60"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Reusable Dropdowns: Sort By, Sort Order, Page Limit */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <div className="w-[150px] sm:w-[160px]">
              <AppDropdown
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                options={SORT_OPTIONS}
                className="h-11 rounded-2xl text-xs font-semibold"
              />
            </div>

            <div className="w-[105px]">
              <AppDropdown
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "DESC" | "ASC")}
                options={SORT_ORDER_OPTIONS}
                className="h-11 rounded-2xl text-xs font-semibold"
              />
            </div>

            <div className="w-[125px]">
              <AppDropdown
                value={String(pagination.limit)}
                onChange={(e) => {
                  setPagination((prev) => ({
                    ...prev,
                    limit: parseInt(e.target.value, 10),
                    page: 1,
                  }));
                }}
                options={LIMIT_OPTIONS}
                className="h-11 rounded-2xl text-xs font-semibold"
              />
            </div>

            {/* Clear Filters Button */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedRole("ALL");
                }}
                className="inline-flex items-center gap-1.5 h-11 px-3.5 rounded-2xl text-xs font-bold text-destructive bg-destructive/10 hover:bg-destructive/15 border border-destructive/20 transition-all cursor-pointer shrink-0"
              >
                <X className="size-3.5" />
                <span>Reset ({activeFiltersCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Floating Batch Actions Bar */}
      {selectedUserIds.length > 0 && (
        <div className="sticky top-4 z-30 flex items-center justify-between bg-card/95 border border-primary/40 rounded-2xl p-3.5 sm:px-6 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-xl bg-primary/10 text-primary font-black text-xs">
              {selectedUserIds.length}
            </span>
            <span className="text-sm font-bold text-foreground">
              {selectedUserIds.length} account{selectedUserIds.length > 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => setSelectedUserIds([])}
              className="text-xs text-muted-foreground hover:text-foreground underline ml-2 cursor-pointer font-medium"
            >
              Deselect All
            </button>
          </div>

          <button
            onClick={handleInitiateBulkDelete}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Trash2 className="size-3.5" />
            <span>Delete Selected ({selectedUserIds.length})</span>
          </button>
        </div>
      )}

      {/* 5. Users Table / Grid */}
      <div className="bg-card border border-border/60 rounded-2xl sm:rounded-3xl shadow-xs overflow-hidden">
        {/* Table Header Summary */}
        <div className="p-4 sm:p-5 border-b border-border/50 flex items-center justify-between">
          <div>
            <Typography variant="h3" className="font-bold text-foreground text-base">
              Registered Accounts Directory
            </Typography>
            <p className="text-xs text-muted-foreground mt-0.5">
              Showing {users.length} of {pagination.total.toLocaleString()} total accounts
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-xl bg-muted text-muted-foreground">
            Page {pagination.page} / {Math.max(1, pagination.totalPages)}
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <AppLoader className="min-h-0" />
            <Typography variant="muted" className="text-xs font-semibold">
              Loading user directory...
            </Typography>
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="size-16 rounded-3xl bg-muted/50 flex items-center justify-center text-muted-foreground mb-4">
              <StudentsSVG className="size-8" />
            </div>
            <Typography variant="h4" className="text-lg font-bold mb-1 text-foreground">
              No Users Found
            </Typography>
            <Typography variant="muted" className="text-xs max-w-sm mb-4">
              {searchTerm || selectedRole !== "ALL"
                ? "Try adjusting your search query or role filters to find what you're looking for."
                : "There are currently no registered users in the database."}
            </Typography>
            {activeFiltersCount > 0 && (
              <AppButton
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedRole("ALL");
                }}
                className="rounded-xl text-xs font-semibold"
              >
                Clear all filters
              </AppButton>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20 text-muted-foreground text-xs uppercase tracking-wider font-bold">
                  <th className="py-4 pl-6 pr-3 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                      disabled={selectableUsers.length === 0}
                      aria-label="Select all users on this page"
                      className="size-4 rounded-md border-border text-primary focus:ring-primary/20 cursor-pointer"
                    />
                  </th>
                  <th className="py-4 px-4 font-bold min-w-[240px]">User Account</th>
                  <th className="py-4 px-4 font-bold min-w-[120px]">Role</th>
                  <th className="py-4 px-4 font-bold min-w-[240px]">Institute & Academic</th>
                  <th className="py-4 px-4 font-bold min-w-[190px]">Activity & Solved</th>
                  <th className="py-4 px-4 font-bold min-w-[100px]">Points</th>
                  <th className="py-4 px-4 font-bold min-w-[120px]">Joined</th>
                  <th className="py-4 px-4 font-bold text-center min-w-[110px]">Status</th>
                  <th className="py-4 pr-6 pl-4 text-right font-bold min-w-[90px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {users.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  const isAdmin = user.role === "ADMIN";
                  return (
                    <tr
                      key={user.id}
                      className={cn(
                        "hover:bg-muted/30 transition-colors group",
                        isSelected && "bg-primary/5 hover:bg-primary/10",
                      )}
                    >
                      {/* Checkbox */}
                      <td className="py-4 pl-6 pr-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectUser(user.id)}
                          disabled={isAdmin}
                          title={isAdmin ? "Administrator accounts cannot be deleted" : "Select user"}
                          aria-label={`Select ${user.name}`}
                          className={cn(
                            "size-4 rounded-md border-border text-primary focus:ring-primary/20",
                            isAdmin ? "opacity-30 cursor-not-allowed" : "cursor-pointer",
                          )}
                        />
                      </td>

                      {/* User Avatar + Name + Email */}
                      <td className="py-4 px-4 min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={user.profile_image}
                            name={user.name}
                            username={user.username || undefined}
                            id={user.id}
                            size={40}
                            className="size-10 rounded-2xl shrink-0 border border-border/50"
                            fallbackClassName="rounded-2xl text-xs font-bold bg-primary/10 text-primary"
                            imageClassName="rounded-2xl"
                          />
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-foreground truncate text-sm">{user.name}</p>
                              {user.username && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground truncate">
                                  @{user.username}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="truncate max-w-[170px]">{user.email}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyEmail(user.email, user.id)}
                                title="Copy Email"
                                className="p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              >
                                {copiedId === user.id ? (
                                  <Check className="size-3 text-primary font-bold" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>

                      {/* Institute & Academic Info */}
                      <td className="py-4 px-4 min-w-[240px]">
                        <div className="space-y-1">
                          {user.school_name ? (
                            <div className="flex items-center gap-1.5">
                              <BuildingSVG className="size-3.5 text-muted-foreground shrink-0" />
                              <span className="font-semibold text-foreground text-xs truncate max-w-[200px]" title={user.school_name}>
                                {user.school_name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/60 italic text-xs">—</span>
                          )}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {user.class && (
                              <span className="inline-flex items-center whitespace-nowrap px-2 py-0.5 rounded-md bg-muted text-foreground text-[10px] font-bold border border-border/40">
                                Class {user.class}
                              </span>
                            )}
                            {user.board && (
                              <span className="inline-flex items-center whitespace-nowrap px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground text-[10px] font-semibold border border-border/30">
                                {user.board}
                              </span>
                            )}
                            {user.city && (
                              <span className="text-[10px] text-muted-foreground pl-0.5">
                                • {user.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Activity & Solved Papers */}
                      <td className="py-4 px-4 min-w-[190px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary border border-primary/20">
                              <CheckCircleSVG className="size-3 shrink-0" />
                              {user.solved_papers_count ?? 0} Solved
                            </span>
                            {(user.generated_papers_count ?? 0) > 0 && (
                              <span className="inline-flex items-center rounded-lg bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border/40">
                                {user.generated_papers_count} Generated
                              </span>
                            )}
                          </div>
                          {user.last_solved_paper ? (
                            <p className="text-[11px] text-muted-foreground truncate max-w-[180px]" title={user.last_solved_paper}>
                              Last: <span className="text-foreground font-semibold">{user.last_solved_paper}</span>
                            </p>
                          ) : (
                            <p className="text-[11px] text-muted-foreground/60 italic">No papers solved yet</p>
                          )}
                        </div>
                      </td>

                      {/* Points & Rank */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-xs">
                          <span className="font-black text-foreground text-sm">
                            {user.points !== null ? user.points.toLocaleString() : 0}
                          </span>
                          <span className="text-muted-foreground text-[10px] ml-1 font-semibold">pts</span>
                          {user.rank ? (
                            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5 mt-0.5">
                              <Trophy className="size-2.5" /> Rank #{user.rank}
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-xs text-muted-foreground font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-muted-foreground/60" />
                          <span>{formatDate(user.created_at)}</span>
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {user.is_verified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                            <CheckCircleSVG className="size-3" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                            Unverified
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 pr-6 pl-4 text-right whitespace-nowrap">
                        {isAdmin ? (
                          <span
                            title="Root Administrator accounts cannot be deleted."
                            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 px-2 py-1"
                          >
                            <CrownSVG className="size-3" /> Protected
                          </span>
                        ) : (
                          <button
                            onClick={() => handleInitiateSingleDelete(user)}
                            title={`Safely delete ${user.name}`}
                            className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. Pagination Footer */}
        {users.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20">
            <p className="text-xs text-muted-foreground font-medium">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total.toLocaleString()} users
            </p>

            <div className="flex items-center gap-2">
              <AppButton
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page <= 1 || loading}
                className="h-9 px-3 rounded-xl border-border/60 text-xs font-semibold"
              >
                <ChevronLeft className="size-3.5 mr-1" />
                Previous
              </AppButton>

              <span className="px-3 py-1 text-xs font-bold text-foreground bg-muted/50 rounded-lg">
                {pagination.page} / {Math.max(1, pagination.totalPages)}
              </span>

              <AppButton
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="h-9 px-3 rounded-xl border-border/60 text-xs font-semibold"
              >
                Next
                <ChevronRight className="size-3.5 ml-1" />
              </AppButton>
            </div>
          </div>
        )}
      </div>

      {/* 7. SAFE DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border/80 w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-7 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-start gap-4 mb-5">
              <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0 border border-destructive/20">
                <AlertTriangle className="size-6" />
              </div>
              <div className="flex-1">
                <Typography variant="h3" className="text-lg font-bold text-foreground">
                  Confirm Safe User Deletion
                </Typography>
                <Typography variant="muted" className="text-xs mt-1 leading-relaxed">
                  You are about to permanently delete{" "}
                  <span className="font-semibold text-foreground">
                    {usersToDelete.length} account{usersToDelete.length > 1 ? "s" : ""}
                  </span>
                  .
                </Typography>
              </div>
              <button
                onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Warning Details */}
            <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4 mb-5 space-y-2">
              <div className="flex items-center gap-2 text-destructive font-bold text-xs">
                <ShieldAlert className="size-4 shrink-0" />
                <span>Cascade Clean-up Guarantee:</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 pl-6 list-disc">
                <li>Associated exam attempts, test papers, and quizzes are pruned.</li>
                <li>Public past papers & curriculums are preserved with uploader unlinked.</li>
                <li>Chat sessions, notifications, and classroom enrollments are cleaned.</li>
                <li>This action is permanent and cannot be undone.</li>
              </ul>
            </div>

            {/* List of Accounts being deleted */}
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                Accounts to be deleted ({usersToDelete.length}):
              </span>
              <div className="max-h-44 overflow-y-auto custom-scrollbar border border-border/50 rounded-2xl divide-y divide-border/30 bg-background/50">
                {usersToDelete.map((u) => (
                  <div key={u.id} className="p-2.5 px-3 flex items-center justify-between text-xs">
                    <div className="truncate mr-2">
                      <p className="font-semibold text-foreground truncate">{u.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <div>{getRoleBadge(u.role)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Deleting Safely...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" />
                    <span>Yes, Delete Account{usersToDelete.length > 1 ? "s" : ""}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
