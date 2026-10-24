"use client";

import React, { useState, useEffect, useMemo } from "react";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import { Typography } from "@/components/ui/Typography";
import AppButton from "@/components/AppButton";
import {
  Loader2,
  X,
  Plus,
  Check,
} from "lucide-react";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import EditSVG from "@/public/svgs/EditSVG";
import AddSVG from "@/public/svgs/AddSVG";
import BuildingSVG from "@/public/svgs/BuildingSVG";
import StudentsSVG from "@/public/svgs/StudentsSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import LocationSVG from "@/public/svgs/LocationSVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import SearchSVG from "@/public/svgs/SearchSVG";
import FilterSVG from "@/public/svgs/FilterSVG";
import BoardSVG from "@/public/svgs/BoardSVG";
import apiInstance from "@/lib/api-instance";
import { toast } from "sonner";
import { cn, formatSchoolName } from "@/lib/utils";
import { compressImageFile } from "@/lib/utils/image-compressor";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import AppLoader from "@/components/AppLoader";

const DEFAULT_BOARD_LIST = [
  "AKUEB",
  "Sindh Board",
  "Federal Board",
  "Punjab Board",
  "KPK Board",
  "Balochistan Board",
  "Cambridge / O-Levels",
];

interface School {
  id: string;
  name: string;
  logo_url: string | null;
  location: string | null;
  is_verified: boolean;
  boards: string[];
  created_at: string;
  student_count?: number;
}

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "pending">("all");
  const [boardFilter, setBoardFilter] = useState<string>("all");
  const [availableBoards, setAvailableBoards] = useState<string[]>(DEFAULT_BOARD_LIST);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  // Deletion modal state
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [locationStr, setLocationStr] = useState("");
  const [isVerified, setIsVerified] = useState(true);
  const [selectedBoards, setSelectedBoards] = useState<string[]>(["AKUEB"]);
  const [customBoardInput, setCustomBoardInput] = useState("");
  const [showCustomBoardInput, setShowCustomBoardInput] = useState(false);
  const [logoBase64, setLogoBase64] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSchools();
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const res = (await apiInstance.get("/boards")) as Array<{ name: string }>;
      if (Array.isArray(res) && res.length > 0) {
        const boardNames = res.map((b) => b.name).filter(Boolean);
        const merged = Array.from(new Set([...DEFAULT_BOARD_LIST, ...boardNames]));
        setAvailableBoards(merged);
      }
    } catch {
      // Keep defaults
    }
  };

  const fetchSchools = async () => {
    try {
      const res = (await apiInstance.get("/admin/schools")) as {
        success: boolean;
        data: School[];
      };
      if (res.success) {
        // Ensure boards field is always a string array
        const normalized = res.data.map((s) => ({
          ...s,
          boards: Array.isArray(s.boards) && s.boards.length > 0 ? s.boards : ["AKUEB"],
        }));
        setSchools(normalized);
      }
    } catch (error) {
      toast.error("Failed to load institutes");
    } finally {
      setLoading(false);
    }
  };

  const totalStudentsCount = useMemo(() => {
    return schools.reduce((acc, s) => acc + (s.student_count || 0), 0);
  }, [schools]);

  const verifiedCount = useMemo(() => {
    return schools.filter((s) => s.is_verified).length;
  }, [schools]);

  const pendingCount = useMemo(() => {
    return schools.filter((s) => !s.is_verified).length;
  }, [schools]);

  // Unique list of boards currently present across schools for filter chips
  const presentBoards = useMemo(() => {
    const set = new Set<string>();
    schools.forEach((s) => {
      (s.boards || ["AKUEB"]).forEach((b) => set.add(b));
    });
    return Array.from(set);
  }, [schools]);

  const filteredSchools = useMemo(() => {
    return schools.filter((s) => {
      const schoolBoards = s.boards || ["AKUEB"];
      const matchesSearch =
        searchQuery.trim() === "" ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.location && s.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        schoolBoards.some((b) => b.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "verified" && s.is_verified) ||
        (statusFilter === "pending" && !s.is_verified);

      const matchesBoard =
        boardFilter === "all" || schoolBoards.includes(boardFilter);

      return matchesSearch && matchesStatus && matchesBoard;
    });
  }, [schools, searchQuery, statusFilter, boardFilter]);

  const handleOpenAdd = () => {
    setModalMode("add");
    setSelectedSchool(null);
    setName("");
    setLocationStr("");
    setIsVerified(true);
    setSelectedBoards(["AKUEB"]);
    setCustomBoardInput("");
    setShowCustomBoardInput(false);
    setLogoBase64("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: School) => {
    setModalMode("edit");
    setSelectedSchool(s);
    setName(s.name);
    setLocationStr(s.location || "");
    setIsVerified(s.is_verified);
    setSelectedBoards(Array.isArray(s.boards) && s.boards.length > 0 ? s.boards : ["AKUEB"]);
    setCustomBoardInput("");
    setShowCustomBoardInput(false);
    setLogoBase64(s.logo_url || "");
    setIsModalOpen(true);
  };

  const toggleBoardSelection = (boardName: string) => {
    setSelectedBoards((prev) => {
      if (prev.includes(boardName)) {
        // Prevent deselecting everything — keep at least one
        if (prev.length === 1) {
          toast.warning("At least one affiliated board must remain selected.");
          return prev;
        }
        return prev.filter((b) => b !== boardName);
      } else {
        return [...prev, boardName];
      }
    });
  };

  const handleAddCustomBoard = () => {
    const trimmed = customBoardInput.trim();
    if (!trimmed) return;
    if (!availableBoards.includes(trimmed)) {
      setAvailableBoards((prev) => [...prev, trimmed]);
    }
    if (!selectedBoards.includes(trimmed)) {
      setSelectedBoards((prev) => [...prev, trimmed]);
    }
    setCustomBoardInput("");
    setShowCustomBoardInput(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImageFile(file, {
        maxDimension: 400,
        quality: 0.85,
      });
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(reader.result as string);
      };
      reader.readAsDataURL(compressed);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    let finalLogoUrl = selectedSchool?.logo_url || "";

    try {
      // 1. Upload new image if it's a base64 string
      if (logoBase64 && logoBase64.startsWith("data:image")) {
        const uploadRes = (await apiInstance.post("/upload/cloudinary", {
          image: logoBase64,
          folder: "zentix/schools",
        })) as { success: boolean; url: string };
        if (uploadRes.success) {
          finalLogoUrl = uploadRes.url;
        } else {
          toast.error("Image upload failed");
          setIsSubmitting(false);
          return;
        }
      }

      const payloadBoards = selectedBoards.length > 0 ? selectedBoards : ["AKUEB"];

      // 2. Add or Update School
      if (modalMode === "add") {
        await apiInstance.post("/admin/schools", {
          name,
          location: locationStr,
          is_verified: isVerified,
          boards: payloadBoards,
          logo_url: finalLogoUrl,
        });
        toast.success("Institute created successfully!");
      } else if (modalMode === "edit" && selectedSchool) {
        await apiInstance.patch(`/admin/schools/${selectedSchool.id}`, {
          name,
          location: locationStr,
          is_verified: isVerified,
          boards: payloadBoards,
          logo_url: finalLogoUrl || null,
        });
        toast.success("Institute updated successfully!");
      }

      setIsModalOpen(false);
      fetchSchools();
    } catch (error: any) {
      toast.error(error?.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!schoolToDelete) return;
    setIsDeleting(true);
    try {
      await apiInstance.delete(`/admin/schools/${schoolToDelete.id}`);
      toast.success("Institute deleted successfully!");
      setSchoolToDelete(null);
      fetchSchools();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete institute.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Manage Institutes"
        description="Centralized administration for registered institutions, campus locations, affiliated boards, verified badges, and student enrollment."
        actions={
          <AppButton
            onClick={handleOpenAdd}
            className="rounded-xl h-11 sm:h-12 px-6 font-bold shadow-lg shadow-primary/20 cursor-pointer"
          >
            <AddSVG className="mr-2 size-5" />
            Add New Institute
          </AppButton>
        }
      />

      {/* KPI Overview Summary - Platform Vitals Signature Style */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
        {/* Total Institutes Card */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 p-4 sm:p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-linear-to-br from-sidebar-from via-primary to-sidebar-to">
          {/* Ambient Watermark & Glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <div className="absolute -top-[35%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[30px]" />
            <div className="absolute -bottom-[35%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[25px]" />
            <div className="absolute -right-3 -top-3 opacity-15 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-25">
              <BuildingSVG className="size-24 sm:size-28 text-white" />
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 ring-1 ring-white/30 text-white backdrop-blur-md shadow-xs transition-transform duration-300 group-hover:scale-105">
              <BuildingSVG className="size-5 sm:size-6 text-white" />
            </div>
            <span className="rounded-full bg-white/20 border border-white/25 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
              Platform
            </span>
          </div>

          <div className="relative z-10 mt-3 sm:mt-4 min-w-0">
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
              {schools.length}
            </p>
            <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-white/95 truncate drop-shadow-xs">
              Total Institutes
            </p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] font-medium text-white/80 truncate">
              Registered Campuses
            </p>
          </div>
        </div>

        {/* Enrolled Students Card */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 p-4 sm:p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-linear-to-br from-sidebar-from via-primary to-sidebar-to">
          {/* Ambient Watermark & Glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <div className="absolute -top-[35%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[30px]" />
            <div className="absolute -bottom-[35%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[25px]" />
            <div className="absolute -right-3 -top-3 opacity-15 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-25">
              <StudentsSVG className="size-24 sm:size-28 text-white" />
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 ring-1 ring-white/30 text-white backdrop-blur-md shadow-xs transition-transform duration-300 group-hover:scale-105">
              <StudentsSVG className="size-5 sm:size-6 text-white" />
            </div>
            <span className="rounded-full bg-white/20 border border-white/25 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
              Enrollment
            </span>
          </div>

          <div className="relative z-10 mt-3 sm:mt-4 min-w-0">
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
              {totalStudentsCount.toLocaleString()}
            </p>
            <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-white/95 truncate drop-shadow-xs">
              Enrolled Students
            </p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] font-medium text-white/80 truncate">
              Total Active Learners
            </p>
          </div>
        </div>

        {/* Verified Badges Card */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 p-4 sm:p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-linear-to-br from-sidebar-from via-primary to-sidebar-to">
          {/* Ambient Watermark & Glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <div className="absolute -top-[35%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[30px]" />
            <div className="absolute -bottom-[35%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[25px]" />
            <div className="absolute -right-3 -top-3 opacity-15 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-25">
              <CheckCircleSVG className="size-24 sm:size-28 text-white" />
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 ring-1 ring-white/30 text-white backdrop-blur-md shadow-xs transition-transform duration-300 group-hover:scale-105">
              <CheckCircleSVG className="size-5 sm:size-6 text-white" />
            </div>
            <span className="rounded-full bg-white/20 border border-white/25 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
              Verified
            </span>
          </div>

          <div className="relative z-10 mt-3 sm:mt-4 min-w-0">
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
              {verifiedCount} <span className="text-base sm:text-lg font-bold text-white/75">/ {schools.length}</span>
            </p>
            <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-white/95 truncate drop-shadow-xs">
              Verified Badges
            </p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] font-medium text-white/80 truncate">
              {schools.length > 0 ? Math.round((verifiedCount / schools.length) * 100) : 0}% verification rate
            </p>
          </div>
        </div>
      </div>

      {/* Search & Status Filter Bar */}
      <div className="mb-6 flex flex-col gap-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <SearchSVG className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by institute name, city, or affiliated board..."
              className="h-11 w-full rounded-xl border border-border/60 bg-card pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Tabs - User Activities Style */}
          <div className="inline-flex p-1 bg-muted/60 border border-border/50 rounded-xl sm:rounded-2xl self-start sm:self-auto">
            {(["all", "verified", "pending"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={cn(
                  "px-3 sm:px-3.5 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold capitalize transition-all cursor-pointer",
                  statusFilter === filter
                    ? "bg-primary text-white shadow-xs font-extrabold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
              >
                {filter}{" "}
                <span className="opacity-80 font-semibold text-[11px]">
                  (
                  {filter === "all"
                    ? schools.length
                    : filter === "verified"
                    ? verifiedCount
                    : pendingCount}
                  )
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Affiliated Board Quick Filter Chips */}
        {presentBoards.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
              <FilterSVG className="size-3" /> Board:
            </span>
            <button
              onClick={() => setBoardFilter("all")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer",
                boardFilter === "all"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              All Boards ({schools.length})
            </button>
            {presentBoards.map((b) => {
              const count = schools.filter((s) => (s.boards || ["AKUEB"]).includes(b)).length;
              return (
                <button
                  key={b}
                  onClick={() => setBoardFilter(b)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                    boardFilter === b
                      ? "bg-primary text-white shadow-xs"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
                  )}
                >
                  <BoardSVG className="size-3" />
                  <span>{b}</span>
                  <span className="opacity-75 font-semibold text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <AppLoader className="min-h-0" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSchools.map((school) => {
            const schoolBoards = school.boards && school.boards.length > 0 ? school.boards : ["AKUEB"];

            return (
              <div
                key={school.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/60 bg-card p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl dark:bg-card/90"
              >
                {/* Top Header: Verification Status on Left, Direct Action Controls on Right */}
                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3.5">
                  {school.is_verified ? (
                    <div className="flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                      <CheckCircleSVG className="size-3 shrink-0 text-primary" />
                      <span>Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      <ClockSVG className="size-3 shrink-0 text-amber-500" />
                      <span>Pending</span>
                    </div>
                  )}

                  {/* Direct Action Controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(school)}
                      title="Edit Institute"
                      className="flex size-8 items-center justify-center rounded-xl border border-border/60 bg-muted/60 text-muted-foreground transition-all duration-200 hover:scale-105 hover:border-primary/40 hover:bg-primary/15 hover:text-primary active:scale-95 cursor-pointer shadow-2xs"
                    >
                      <EditSVG className="size-3.5 text-current" />
                    </button>
                    <button
                      onClick={() => setSchoolToDelete(school)}
                      title="Delete Institute"
                      className="flex size-8 items-center justify-center rounded-xl border border-border/60 bg-muted/60 text-muted-foreground transition-all duration-200 hover:scale-105 hover:border-rose-500/40 hover:bg-rose-500/15 hover:text-rose-600 active:scale-95 cursor-pointer shadow-2xs"
                    >
                      <DeleteSVG className="size-3.5 text-current" />
                    </button>
                  </div>
                </div>

                {/* School Logo & Title Body */}
                <div className="my-4 flex flex-col items-center text-center">
                  <div className="relative mb-3.5 flex size-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-border/50 bg-white p-2.5 shadow-md transition-transform duration-300 group-hover:scale-105 dark:border-white/15 dark:bg-white">
                    {school.logo_url ? (
                      <img
                        src={school.logo_url}
                        alt={school.name}
                        className="size-full object-contain"
                      />
                    ) : (
                      <BuildingSVG className="size-9 text-slate-700" />
                    )}
                  </div>

                  <Typography
                    variant="h4"
                    className="line-clamp-2 min-h-12 text-sm sm:text-[15px] font-extrabold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary"
                  >
                    {formatSchoolName(school.name)}
                  </Typography>

                  {/* Affiliated Board Badges */}
                  <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
                    {schoolBoards.map((b) => (
                      <span
                        key={b}
                        className="inline-flex items-center gap-1 rounded-lg border border-primary/25 bg-primary/8 px-2 py-0.5 text-[11px] font-bold text-primary dark:text-primary/90"
                      >
                        <BoardSVG className="size-3 shrink-0 text-primary" />
                        <span>{b}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Metadata Badges */}
                <div className="mt-auto border-t border-border/40 pt-3.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-2.5 py-1.5 text-center">
                      <LocationSVG className="size-3.5 shrink-0 text-primary" />
                      <span className="truncate text-[11px] font-bold text-primary">
                        {school.location || "Karachi"}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-2.5 py-1.5 text-center">
                      <StudentsSVG className="size-3.5 shrink-0 text-primary" />
                      <span className="truncate text-[11px] font-black text-primary">
                        {Number(school.student_count || 0).toLocaleString()}{" "}
                        {Number(school.student_count || 0) === 1 ? "Student" : "Students"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredSchools.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-border/60 bg-card/40 py-16 text-center">
              <BuildingSVG className="mx-auto mb-3 size-12 text-muted-foreground/40" />
              <Typography variant="h4" className="font-bold text-foreground">
                No Institutes Found
              </Typography>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery || boardFilter !== "all" || statusFilter !== "all"
                  ? "No institutes match your search or filter criteria."
                  : "No institutes are currently registered."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal for Add / Edit Institute */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative my-8 w-full max-w-lg rounded-3xl border border-border/60 bg-card p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-muted/60 p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
            >
              <X className="size-5" />
            </button>
            <Typography variant="h3" className="mb-6 font-black tracking-tight text-foreground">
              {modalMode === "add" ? "Register New Institute" : "Edit Institute"}
            </Typography>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Typography
                  variant="small"
                  className="mb-1.5 ml-1 block font-bold text-muted-foreground"
                >
                  Institute Name
                </Typography>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12 w-full rounded-xl border border-border/60 bg-background px-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. Beaconhouse School System"
                />
              </div>

              <div>
                <Typography
                  variant="small"
                  className="mb-1.5 ml-1 block font-bold text-muted-foreground"
                >
                  City / Location
                </Typography>
                <div className="relative">
                  <LocationSVG className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={locationStr}
                    onChange={(e) => setLocationStr(e.target.value)}
                    className="h-12 w-full rounded-xl border border-border/60 bg-background pl-11 pr-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g. Karachi"
                  />
                </div>
              </div>

              {/* Affiliated Boards (Multi-Select) */}
              <div>
                <div className="mb-1.5 ml-1 flex items-center justify-between">
                  <Typography
                    variant="small"
                    className="block font-bold text-muted-foreground"
                  >
                    Affiliated Academic Boards
                  </Typography>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    (Select all that apply)
                  </span>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                  <div className="flex flex-wrap gap-2">
                    {availableBoards.map((b) => {
                      const isSelected = selectedBoards.includes(b);
                      return (
                        <button
                          type="button"
                          key={b}
                          onClick={() => toggleBoardSelection(b)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                            isSelected
                              ? "border border-primary bg-primary text-primary-foreground shadow-xs shadow-primary/20 scale-[1.02]"
                              : "border border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          )}
                        >
                          {isSelected ? (
                            <Check className="size-3.5 stroke-[3]" />
                          ) : (
                            <BoardSVG className="size-3.5 opacity-60" />
                          )}
                          <span>{b}</span>
                        </button>
                      );
                    })}

                    {!showCustomBoardInput ? (
                      <button
                        type="button"
                        onClick={() => setShowCustomBoardInput(true)}
                        className="flex items-center gap-1 rounded-xl border border-dashed border-border/80 bg-background/50 px-3 py-1.5 text-xs font-bold text-muted-foreground hover:border-primary hover:text-primary transition-all cursor-pointer"
                      >
                        <Plus className="size-3.5" />
                        <span>Other Board</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={customBoardInput}
                          onChange={(e) => setCustomBoardInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomBoard();
                            }
                          }}
                          placeholder="e.g. FBISE"
                          className="h-8 rounded-lg border border-primary/60 bg-background px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-28"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomBoard}
                          className="h-8 rounded-lg bg-primary px-2.5 text-xs font-bold text-white hover:bg-primary/90 cursor-pointer"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomBoardInput(false);
                            setCustomBoardInput("");
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Selected:{" "}
                    <span className="font-bold text-foreground">
                      {selectedBoards.length > 0 ? selectedBoards.join(", ") : "None (Default: AKUEB)"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Logo Upload */}
              <div>
                <Typography
                  variant="small"
                  className="mb-1.5 ml-1 block font-bold text-muted-foreground"
                >
                  Institute Logo / Emblem
                </Typography>

                <div className="flex items-center gap-4">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-border/60 bg-white p-2 shadow-xs">
                    {logoBase64 ? (
                      <img
                        src={logoBase64}
                        alt="Preview"
                        className="size-full object-contain"
                      />
                    ) : (
                      <BuildingSVG className="size-7 text-slate-700" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-primary/30 transition-colors hover:border-primary hover:bg-primary/5">
                      <span className="text-xs font-bold text-primary">
                        {logoBase64 ? "Change Logo" : "Upload Emblem / Logo"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex cursor-pointer items-center gap-3.5 rounded-2xl border border-border/60 p-3.5 transition-colors hover:bg-muted/40">
                  <div className="relative flex h-5 items-center">
                    <input
                      type="checkbox"
                      checked={isVerified}
                      onChange={(e) => setIsVerified(e.target.checked)}
                      className="peer size-5 appearance-none rounded-lg border-2 border-muted-foreground bg-background transition-colors checked:border-primary checked:bg-primary cursor-pointer"
                    />
                    <CheckCircleSVG className="pointer-events-none absolute left-0.5 top-0.5 size-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                  </div>
                  <div className="flex flex-col">
                    <Typography variant="small" className="font-extrabold text-foreground">
                      Verified Institute Status
                    </Typography>
                    <Typography
                      variant="muted"
                      className="mt-0.5 text-xs leading-tight text-muted-foreground"
                    >
                      Displays an official verified badge across student leaderboards and ranking portals.
                    </Typography>
                  </div>
                </label>
              </div>

              <div className="pt-2">
                <AppButton
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-xl text-sm font-bold shadow-lg shadow-primary/25 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : modalMode === "add" ? (
                    "Save & Register Institute"
                  ) : (
                    "Update Institute Details"
                  )}
                </AppButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={Boolean(schoolToDelete)}
        onClose={() => {
          if (!isDeleting) setSchoolToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Institute"
        message="Are you sure you want to delete this institute?"
        itemName={schoolToDelete ? formatSchoolName(schoolToDelete.name) : undefined}
        isLoading={isDeleting}
      />
    </PageContainer>
  );
}

