"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Bug,
  CheckCircle2,
  Clock,
  Wrench,
  RefreshCw,
  ExternalLink,
  FileText,
  FileQuestion,
  Bot,
  Layers,
  Trash2,
  Users,
  Sliders,
  XCircle,
  Image as ImageIcon,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  Loader2,
  Gamepad2,
  Layout,
  Smartphone,
  Monitor,
  Code2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { convertMathToHTML } from "@/lib/utils/math-notation";
import QATeamManager from "@/components/qa/QATeamManager";
import QASettingsPanel from "@/components/qa/QASettingsPanel";
import AppDropdown from "@/components/AppDropdown";
import AppSearch from "@/components/AppSearch";
import AppTabs from "@/components/AppTabs";
import PageHeader from "@/components/PageHeader";

const BUG_TYPE_OPTIONS = [
  { value: "ALL", label: "All Sources" },
  { value: "QUESTION", label: "📝 Past Papers & Question Bank" },
  { value: "LAB_GAME", label: "🎮 Virtual Lab & Games" },
  { value: "UI_UX", label: "🎨 UI / UX & Improvements" },
  { value: "GLOBAL_PAGE", label: "🌐 All Other Pages" },
  { value: "NOVA_CHAT", label: "🤖 Nova AI Tutor Chat" },
  { value: "TEACHER_PAPER", label: "📄 Teacher Paper Generator" },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "REJECTED", label: "❌ Rejected (Needs Re-Fix)" },
  { value: "IN_PROGRESS", label: "⏳ In Progress / Queue" },
  { value: "FIXED", label: "🛠️ Fixed (Ready for QA)" },
  { value: "VERIFIED", label: "✅ Verified" },
];

const CLASS_OPTIONS = [
  { value: "ALL", label: "All Classes" },
  { value: "IX", label: "Class IX (9th)" },
  { value: "X", label: "Class X (10th)" },
  { value: "XI", label: "Class XI (11th)" },
  { value: "XII", label: "Class XII (12th)" },
];

const CATEGORY_OPTIONS = [
  { value: "ALL", label: "All Categories" },
  { value: "LAB_GAME_BUG", label: "🎮 Virtual Lab / Game" },
  { value: "UI_UX_IMPROVEMENT", label: "🎨 UI / UX Enhancement" },
  { value: "RESPONSIVENESS", label: "📱 Mobile / Responsive" },
  { value: "PAGE_ERROR_CRASH", label: "⚠️ Broken Feature / Error" },
  { value: "FEATURE_REQUEST", label: "💡 Feature Idea" },
  { value: "CUTOFF_DIAGRAM", label: "✂️ Cut-off Diagram" },
  { value: "MISSING_DIAGRAM", label: "❓ Missing Diagram" },
  { value: "HALLUCINATION", label: "🤖 AI Hallucination" },
  { value: "DUPLICATE_QUESTIONS", label: "🔀 Duplicate Question" },
  { value: "MATH_CHEM_FORMATTING", label: "🧮 Math/Formula/Urdu" },
  { value: "WRONG_CHAPTER", label: "📚 Wrong Chapter/SLO" },
  { value: "INCORRECT_KEY_OPTIONS", label: "❌ Incorrect Key/Options" },
  { value: "OTHER", label: "💬 Other Issue" },
];

const CARD_STATUS_OPTIONS = [
  { value: "REJECTED", label: "❌ Rejected" },
  { value: "IN_PROGRESS", label: "⏳ In Progress" },
  { value: "FIXED", label: "🛠️ Fixed (Ready QA)" },
  { value: "VERIFIED", label: "✅ Verified" },
];

export default function QABugsManager() {
  const [activeTab, setActiveTab] = useState<"tracker" | "team" | "settings">("tracker");
  const [bugs, setBugs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    total: 0,
    rejected: 0,
    in_progress: 0,
    fixed: 0,
    verified: 0,
    questions_count: 0,
    nova_count: 0,
    teacher_paper_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  // Rejection modal on tracker
  const [rejectingBug, setRejectingBug] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      search.trim() ||
        selectedType !== "ALL" ||
        selectedStatus !== "ALL" ||
        selectedClass !== "ALL" ||
        selectedCategory !== "ALL"
    );
  }, [search, selectedType, selectedStatus, selectedClass, selectedCategory]);

  const resetFilters = () => {
    setSearch("");
    setSelectedType("ALL");
    setSelectedStatus("ALL");
    setSelectedClass("ALL");
    setSelectedCategory("ALL");
    setPage(1);
  };

  const fetchBugs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== "ALL") params.append("bug_type", selectedType);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (selectedClass !== "ALL") params.append("class", selectedClass);
      if (selectedCategory !== "ALL") params.append("category", selectedCategory);
      if (search) params.append("search", search);
      params.append("page", page.toString());
      params.append("limit", "25");

      const res = await fetch(`/api/qa/bugs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBugs(data.bugs || []);
        setSummary(
          data.summary || {
            total: 0,
            rejected: 0,
            in_progress: 0,
            fixed: 0,
            verified: 0,
            questions_count: 0,
            nova_count: 0,
            teacher_paper_count: 0,
          }
        );
        setPagination(data.pagination || { totalPages: 1, total: 0 });
      }
    } catch (err) {
      console.error("Error fetching bugs:", err);
      toast.error("Failed to load bugs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "tracker") {
      fetchBugs();
    }
  }, [activeTab, selectedType, selectedStatus, selectedClass, selectedCategory, search, page]);

  const handleStatusChange = async (bugId: string, newStatus: string, reason?: string) => {
    if (newStatus === "REJECTED" && !reason) {
      const target = bugs.find((b) => b.id === bugId);
      setRejectingBug(target || { id: bugId });
      return;
    }

    setBugs((prev) =>
      prev.map((b) =>
        b.id === bugId
          ? {
              ...b,
              status: newStatus,
              metadata: {
                ...(b.metadata || {}),
                ...(reason ? { rejection_reason: reason } : {}),
              },
            }
          : b
      )
    );

    try {
      const res = await fetch(`/api/qa/bugs/${bugId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          rejectionReason: reason,
        }),
      });
      if (res.ok) {
        toast.success(`Status updated to ${newStatus}`);
        fetchBugs();
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Error updating status");
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingBug?.id) return;
    const feedback = rejectionReason.trim() || "QA tester rejected fix.";
    const targetId = rejectingBug.id;
    setRejectingBug(null);
    setRejectionReason("");
    await handleStatusChange(targetId, "REJECTED", feedback);
  };

  const handleDeleteBug = async (bugId: string) => {
    if (!confirm("Are you sure you want to delete this bug report?")) return;
    try {
      const res = await fetch(`/api/qa/bugs/${bugId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Bug report deleted");
        fetchBugs();
      }
    } catch {
      toast.error("Failed to delete bug");
    }
  };

  const getBugTypeBadge = (type: string) => {
    switch (type) {
      case "LAB_GAME":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 px-2.5 py-1 text-[11px] font-bold text-purple-700 dark:text-purple-300 shrink-0">
            <Gamepad2 className="size-3.5" />
            <span>Virtual Lab & Game</span>
          </span>
        );
      case "UI_UX":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 shrink-0">
            <Layout className="size-3.5" />
            <span>UI / UX Design</span>
          </span>
        );
      case "GLOBAL_PAGE":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-1 text-[11px] font-bold text-cyan-700 dark:text-cyan-300 shrink-0">
            <Monitor className="size-3.5" />
            <span>Page Feedback</span>
          </span>
        );
      case "NOVA_CHAT":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-purple-500/10 border border-purple-500/25 px-2.5 py-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 shrink-0">
            <Bot className="size-3.5" />
            <span>Nova AI Tutor</span>
          </span>
        );
      case "TEACHER_PAPER":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
            <FileText className="size-3.5" />
            <span>Teacher Paper</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500/10 border border-blue-500/25 px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 shrink-0">
            <FileQuestion className="size-3.5" />
            <span>Past Paper Question</span>
          </span>
        );
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "LAB_GAME_BUG":
        return <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2.5 py-0.5 text-[11px] font-bold">🎮 Lab Game Issue</span>;
      case "UI_UX_IMPROVEMENT":
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2.5 py-0.5 text-[11px] font-bold">🎨 UI / UX Enhancement</span>;
      case "RESPONSIVENESS":
        return <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 text-[11px] font-bold">📱 Responsive Layout</span>;
      case "PAGE_ERROR_CRASH":
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold">⚠️ Broken Feature</span>;
      case "FEATURE_REQUEST":
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold">💡 Feature Idea</span>;
      case "CUTOFF_DIAGRAM":
        return <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 px-2.5 py-0.5 text-[11px] font-bold">✂️ Cut-off Diagram</span>;
      case "MISSING_DIAGRAM":
        return <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold">❓ Missing Diagram</span>;
      case "REDUNDANT_TEXT":
        return <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2.5 py-0.5 text-[11px] font-bold">📝 Redundant Options</span>;
      case "WRONG_CHAPTER":
      case "WRONG_CHAPTER_SLO":
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2.5 py-0.5 text-[11px] font-bold">📚 Wrong Chapter/SLO</span>;
      case "MATH_CHEM_FORMATTING":
      case "MATH_CHEM_FORMULA":
      case "MATH_URDU_FORMAT":
        return <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 text-[11px] font-bold">🧮 Math/Formula/Urdu</span>;
      case "INCORRECT_KEY_OPTIONS":
      case "INCORRECT_KEY_RUBRIC":
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-2.5 py-0.5 text-[11px] font-bold">❌ Incorrect Key/Rubric</span>;
      case "HALLUCINATION":
        return <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2.5 py-0.5 text-[11px] font-bold">🤖 AI Hallucination</span>;
      case "CUTOFF_INCOMPLETE":
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold">✂️ Cut-off/Incomplete</span>;
      case "IRRELEVANT_OFFTOPIC":
        return <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20 px-2.5 py-0.5 text-[11px] font-bold">📝 Irrelevant Reply</span>;
      case "DUPLICATE_QUESTIONS":
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold">🔀 Duplicate Question</span>;
      case "BAD_DIFFICULTY_DIST":
        return <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 text-[11px] font-bold">📐 Bad Difficulty</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground border border-border px-2.5 py-0.5 text-[11px] font-bold">💬 General Issue</span>;
    }
  };

  const getCleanDiagramName = (url?: string) => {
    if (!url) return "";
    try {
      const parts = url.split("/");
      const last = parts[parts.length - 1] || "diagram.png";
      return last.replace(/^\d+-/, "");
    } catch {
      return "diagram.png";
    }
  };

  const qaTabs = [
    { label: "Bugs Tracker", value: "tracker", icon: Bug, count: summary.total },
    { label: "QA Team & Permissions", value: "team", icon: Users },
    { label: "Module Toggles & Settings", value: "settings", icon: Sliders },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Sync */}
      <PageHeader
        title="QA Bugs Tracker"
        showLine
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchBugs}
              className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground shadow-xs hover:bg-muted hover:border-primary/40 transition-all active:scale-95"
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              <span>Refresh List</span>
            </button>
          </div>
        }
      />

      {/* Main Hero Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-xs">
              <Bug className="size-5 sm:size-6" />
            </span>
            QA Quality Control & Bug Hub
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Monitor, fix, reject, and verify reported issues across Past Papers, Nova AI Tutor, and Teacher Paper Generator.
          </p>
        </div>

        {activeTab === "tracker" && (
          <button
            type="button"
            onClick={fetchBugs}
            className="hidden sm:inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-xs hover:bg-muted hover:border-primary/40 transition-all active:scale-95 shrink-0"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            <span>Refresh List</span>
          </button>
        )}
      </div>

      {/* Standard AppTabs Navigation */}
      <div className="w-full shrink-0">
        <AppTabs
          fullWidth
          tabs={qaTabs}
          activeTab={activeTab}
          onChange={(value) => setActiveTab(value as any)}
        />
      </div>

      {/* Tab 1: Bugs Tracker */}
      {activeTab === "tracker" && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-3.5">
            {/* Total */}
            <div
              onClick={() => setSelectedStatus("ALL")}
              className={cn(
                "cursor-pointer rounded-3xl border p-4 shadow-xs transition-all hover:scale-[1.01] active:scale-95",
                selectedStatus === "ALL" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border bg-card"
              )}
            >
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total</span>
                <Layers className="size-4 text-primary" />
              </div>
              <p className="mt-2 text-2xl font-black text-foreground">{summary.total}</p>
            </div>

            {/* Rejected */}
            <div
              onClick={() => setSelectedStatus("REJECTED")}
              className={cn(
                "cursor-pointer rounded-3xl border p-4 shadow-xs transition-all hover:scale-[1.01] active:scale-95",
                selectedStatus === "REJECTED" ? "border-rose-500 bg-rose-500/5 ring-2 ring-rose-500/20" : "border-border bg-card"
              )}
            >
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Rejected ❌</span>
                <RotateCcw className="size-4" />
              </div>
              <p className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">{summary.rejected || 0}</p>
            </div>

            {/* In Queue */}
            <div
              onClick={() => setSelectedStatus("IN_PROGRESS")}
              className={cn(
                "cursor-pointer rounded-3xl border p-4 shadow-xs transition-all hover:scale-[1.01] active:scale-95",
                selectedStatus === "IN_PROGRESS" ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20" : "border-border bg-card"
              )}
            >
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">In Queue</span>
                <Wrench className="size-4" />
              </div>
              <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">{summary.in_progress}</p>
            </div>

            {/* Fixed */}
            <div
              onClick={() => setSelectedStatus("FIXED")}
              className={cn(
                "cursor-pointer rounded-3xl border p-4 shadow-xs transition-all hover:scale-[1.01] active:scale-95",
                selectedStatus === "FIXED" ? "border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20" : "border-border bg-card"
              )}
            >
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Fixed (Ready QA)</span>
                <Clock className="size-4" />
              </div>
              <p className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">{summary.fixed}</p>
            </div>

            {/* Verified */}
            <div
              onClick={() => setSelectedStatus("VERIFIED")}
              className={cn(
                "cursor-pointer rounded-3xl border p-4 shadow-xs transition-all hover:scale-[1.01] active:scale-95 col-span-2 sm:col-span-1",
                selectedStatus === "VERIFIED" ? "border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20" : "border-border bg-card"
              )}
            >
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Verified ✅</span>
                <CheckCircle2 className="size-4" />
              </div>
              <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">{summary.verified}</p>
            </div>
          </div>

          {/* Global Standard AppSearch with Filter Drawer */}
          <AppSearch
            searchLabel="GLOBAL SEARCH"
            placeholder="Search questions, prompts, notes, or reporter email..."
            searchTerm={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            isLoading={loading}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={resetFilters}
            dropdowns={[
              {
                id: "type-filter",
                label: "Source Module",
                value: selectedType,
                placeholder: "Filter by source module",
                onChange: (e) => {
                  setSelectedType(e.target.value);
                  setPage(1);
                },
                options: BUG_TYPE_OPTIONS,
              },
              {
                id: "status-filter",
                label: "Bug Status",
                value: selectedStatus,
                placeholder: "Filter by bug status",
                onChange: (e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                },
                options: STATUS_OPTIONS,
              },
              {
                id: "class-filter",
                label: "Class / Grade",
                value: selectedClass,
                placeholder: "Filter by class level",
                onChange: (e) => {
                  setSelectedClass(e.target.value);
                  setPage(1);
                },
                options: CLASS_OPTIONS,
              },
              {
                id: "category-filter",
                label: "Bug Category",
                value: selectedCategory,
                placeholder: "Filter by issue category",
                onChange: (e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                },
                options: CATEGORY_OPTIONS,
              },
            ]}
          />

          {/* Bugs List */}
          <div className="space-y-3.5">
            {loading ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card py-16 text-center">
                <RefreshCw className="size-8 animate-spin text-primary" />
                <p className="mt-3 text-sm font-semibold text-muted-foreground">Loading reported bugs...</p>
              </div>
            ) : bugs.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card py-16 text-center">
                <div className="flex size-14 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
                  <CheckCircle2 className="size-8" />
                </div>
                <h3 className="text-base font-bold text-foreground">No bugs found in this view!</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                  {hasActiveFilters
                    ? "Try adjusting your filters or search query to find bug reports."
                    : "All bug reports match your filter criteria or have been verified."}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-primary/10 text-primary border border-primary/20 px-4 py-2 text-xs font-bold hover:bg-primary/20 transition-all"
                  >
                    <XCircle className="size-3.5" />
                    <span>Reset All Filters</span>
                  </button>
                )}
              </div>
            ) : (
              bugs.map((bug) => {
                const meta = bug.metadata || {};
                const bugType = bug.bug_type || "QUESTION";
                const subject = bug.subject || meta.subject || "";
                const cls = bug.class || meta.class || meta.classLevel || "";
                const year = bug.year || meta.year || "";
                const qnum = bug.question_number || meta.question_number || "";
                const pnum = bug.paper_number || meta.paper_number || "";
                const rawImageUrl = bug.image_url || meta.image_url;
                const diagramName = getCleanDiagramName(rawImageUrl);

                return (
                  <div
                    key={bug.id}
                    className={cn(
                      "group relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 rounded-3xl border p-4 sm:p-5 transition-all hover:shadow-md",
                      bug.status === "REJECTED"
                        ? "border-rose-500/50 bg-rose-500/5 hover:border-rose-500"
                        : "border-border/80 bg-card hover:border-primary/40"
                    )}
                  >
                    {/* Left Section: Context & Bug Details */}
                    <div className="flex-1 min-w-0 space-y-2.5">
                      {/* Top Meta Badges Line */}
                      <div className="flex flex-wrap items-center gap-2">
                        {getBugTypeBadge(bugType)}

                        {subject && (
                          <span className="rounded-xl bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary shrink-0">
                            {subject} {cls ? `Class ${cls}` : ""} {year ? `(${year})` : ""} {pnum ? `P${pnum}` : ""} {qnum ? `· Q${qnum}` : ""}
                          </span>
                        )}

                        {getCategoryBadge(bug.category)}

                        {bug.status === "REJECTED" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 px-2.5 py-0.5 text-[11px] font-black">
                            <RotateCcw className="size-3" />
                            <span>Fix Rejected</span>
                          </span>
                        )}

                        <span className="text-[11px] text-muted-foreground ml-auto sm:ml-0 inline-flex items-center gap-1">
                          <Clock className="size-3 shrink-0 text-muted-foreground" />
                          <span>
                            Reported by <span className="font-semibold text-foreground">{bug.reporter_email}</span> •{" "}
                            {new Date(bug.created_at).toLocaleDateString()} at{" "}
                            {new Date(bug.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                          </span>
                        </span>
                      </div>

                      {/* Content Preview */}
                      {bugType === "LAB_GAME" || bugType === "UI_UX" || bugType === "GLOBAL_PAGE" ? (
                        <div className="space-y-2 rounded-2xl bg-muted/30 p-3.5 border border-border/50 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-foreground">
                              <Monitor className="size-3.5 text-primary shrink-0" />
                              <span className="truncate max-w-[280px] sm:max-w-md">{meta.page_pathname || meta.page_url || "Platform Page"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {meta.screen_resolution && (
                                <span className="rounded-lg bg-background border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                  📱 {meta.device_type || "Device"} ({meta.screen_resolution})
                                </span>
                              )}
                              {meta.priority && meta.priority !== "NORMAL" && (
                                <span className={cn(
                                  "rounded-lg border px-2 py-0.5 text-[10px] font-bold",
                                  meta.priority === "CRITICAL" ? "bg-rose-500/20 text-rose-600 border-rose-500/30" : "bg-amber-500/20 text-amber-600 border-amber-500/30"
                                )}>
                                  {meta.priority} ⚡
                                </span>
                              )}
                            </div>
                          </div>
                          {meta.page_title && (
                            <p className="text-xs font-semibold text-foreground/90">{meta.page_title}</p>
                          )}
                        </div>
                      ) : bugType === "NOVA_CHAT" ? (
                        <div className="space-y-1.5 rounded-2xl bg-muted/30 p-3 border border-border/50 text-xs">
                          {meta.prompt && (
                            <p className="text-foreground font-semibold">
                              <span className="text-muted-foreground font-normal">Student Prompt: </span>"{meta.prompt}"
                            </p>
                          )}
                          {meta.response_preview && (
                            <p className="text-muted-foreground line-clamp-2">
                              <span className="font-semibold text-foreground">AI Response: </span>{meta.response_preview}
                            </p>
                          )}
                        </div>
                      ) : bugType === "TEACHER_PAPER" ? (
                        <div className="text-xs sm:text-sm font-semibold text-foreground leading-relaxed">
                          <p>{bug.title || meta.paper_title || "Teacher Generated Test Paper"}</p>
                          {meta.question_text_preview && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic font-normal">
                              "{meta.question_text_preview}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <div
                          className="text-xs sm:text-sm text-foreground leading-relaxed line-clamp-2"
                          dangerouslySetInnerHTML={{
                            __html: convertMathToHTML(bug.question_text || meta.question_text_preview || ""),
                          }}
                        />
                      )}

                      {/* User Initial Note / Feedback */}
                      {bug.description && (
                        <div className="rounded-2xl bg-muted/40 p-2.5 border border-border/50 text-xs text-muted-foreground flex items-start gap-2">
                          <span className="font-bold text-foreground shrink-0">QA Feedback:</span>
                          <span className="italic">{bug.description}</span>
                        </div>
                      )}

                      {/* AI Code Diff & Implementation Plan */}
                      {meta.details?.suggestedCodeDiff && (
                        <div className="rounded-2xl bg-zinc-950 p-3 border border-zinc-800 text-xs text-zinc-300 space-y-1.5 font-mono">
                          <div className="flex items-center gap-1.5 font-bold text-amber-400">
                            <Code2 className="size-3.5" />
                            <span>AI Suggested Code Fix / Diff ({meta.details?.affectedFile || "Component"}):</span>
                          </div>
                          <pre className="overflow-x-auto text-[11px] leading-relaxed text-emerald-400 p-2 rounded-xl bg-zinc-900 border border-zinc-800/80 max-h-48 whitespace-pre-wrap">
                            {typeof meta.details.suggestedCodeDiff === "string"
                              ? meta.details.suggestedCodeDiff
                              : JSON.stringify(meta.details.suggestedCodeDiff, null, 2)}
                          </pre>
                          {meta.details?.implementationPlan && (
                            <p className="text-[11px] text-zinc-400 font-sans mt-1">
                              <span className="font-semibold text-zinc-200">Plan: </span>{meta.details.implementationPlan}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Screenshot Attachment Preview */}
                      {(meta.screenshot_url || rawImageUrl) && (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-0.5">
                          <span className="font-semibold text-foreground/80 flex items-center gap-1 shrink-0">
                            <ImageIcon className="size-3.5 text-muted-foreground" />
                            {meta.screenshot_url ? "Attached Screenshot:" : "Attached Diagram:"}
                          </span>
                          <a
                            href={meta.screenshot_url || rawImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 hover:border-primary/40 transition-all max-w-full"
                            title="Open screenshot in new tab"
                          >
                            <span className="max-w-[200px] sm:max-w-[320px] truncate font-mono text-[11px]">
                              {meta.screenshot_url ? "view_screenshot.png" : diagramName}
                            </span>
                            <ExternalLink className="size-3 shrink-0" />
                          </a>
                        </div>
                      )}

                      {/* Rejection Feedback Banner */}
                      {meta.rejection_reason && (
                        <div className="rounded-2xl bg-rose-500/10 p-3 border border-rose-500/25 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                          <AlertTriangle className="size-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                          <div>
                            <span className="font-bold">QA Rejection Reason:</span>
                            <p className="mt-0.5 font-medium">{meta.rejection_reason}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Section: Status Control & Verification */}
                    <div className="flex shrink-0 flex-wrap items-center gap-2.5 pt-3 xl:pt-0 border-t border-border/60 xl:border-t-0 justify-start xl:justify-end">
                      {/* Status Reusable Dropdown */}
                      <div className="w-[180px] sm:w-[195px] shrink-0">
                        <AppDropdown
                          value={bug.status}
                          options={CARD_STATUS_OPTIONS}
                          onChange={(e) => handleStatusChange(bug.id, e.target.value)}
                          className="text-xs font-bold h-9"
                        />
                      </div>

                      {/* Fast Verify & Reject Buttons when FIXED */}
                      {bug.status === "FIXED" && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(bug.id, "VERIFIED")}
                            className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 active:scale-95 transition-all"
                            title="Mark verified"
                          >
                            <CheckCircle2 className="size-3.5" />
                            <span>Verify ✅</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRejectingBug(bug)}
                            className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-all"
                            title="Reject fix and send back with reason"
                          >
                            <XCircle className="size-3.5" />
                            <span>Reject ❌</span>
                          </button>
                        </div>
                      )}

                      {/* Direct Link to Page / Past Paper / Nova */}
                      {meta.page_pathname || meta.page_url ? (
                        <Link
                          href={meta.page_pathname || meta.page_url}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted hover:border-primary/30 transition-all shadow-2xs active:scale-95"
                          title="Open page in new tab"
                        >
                          <span>{bugType === "LAB_GAME" ? "Open Lab Game" : "Open Page"}</span>
                          <ExternalLink className="size-3 text-muted-foreground" />
                        </Link>
                      ) : bug.past_paper_id ? (
                        <Link
                          href={`/student/past-paper/${bug.past_paper_id}/view`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted hover:border-primary/30 transition-all shadow-2xs active:scale-95"
                          title="Open paper in new tab"
                        >
                          <span>Open Paper</span>
                          <ExternalLink className="size-3 text-muted-foreground" />
                        </Link>
                      ) : bug.bug_type === "NOVA_CHAT" ? (
                        <Link
                          href={`/student/nova`}
                          className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted hover:border-primary/30 transition-all shadow-2xs active:scale-95"
                          title="Open Nova AI Tutor"
                        >
                          <span>Nova Tutor</span>
                          <ExternalLink className="size-3 text-muted-foreground" />
                        </Link>
                      ) : null}

                      {/* Delete Bug */}
                      <button
                        type="button"
                        onClick={() => handleDeleteBug(bug.id)}
                        className="rounded-2xl p-2 text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 border border-transparent transition-all active:scale-95"
                        title="Delete bug report"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-4 text-xs font-medium text-muted-foreground">
              <span>
                Page {page} of {pagination.totalPages} ({pagination.total} total bugs)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-2xl border border-border bg-card px-4 py-2 font-bold hover:bg-muted disabled:opacity-40 transition-all"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-2xl border border-border bg-card px-4 py-2 font-bold hover:bg-muted disabled:opacity-40 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reject Fix Dialog */}
      {rejectingBug && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg rounded-3xl border border-rose-500/30 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                  <XCircle className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Reject QA Fix & Return to Queue</h3>
                  <p className="text-xs text-muted-foreground">Explain specifically why this fix is not accepted</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRejectingBug(null);
                  setRejectionReason("");
                }}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <XCircle className="size-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold text-foreground">
                  Rejection Reason / Notes <span className="text-destructive">*</span>
                </label>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {[
                    "✂️ Diagram still cut off / wrong crop",
                    "❓ Diagram still missing or blank",
                    "🧮 Math / formula / LaTeX formatting broken",
                    "❌ Answer key / options still incorrect",
                    "📝 Irrelevant or duplicate content",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectionReason(preset)}
                      className={cn(
                        "rounded-xl border px-2.5 py-1 text-[11px] font-medium transition-all",
                        rejectionReason === preset
                          ? "border-rose-500 bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold"
                          : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Describe specifically what is still broken so developers can re-fix it..."
                  rows={4}
                  required
                  className="w-full resize-none rounded-2xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 shadow-xs focus:border-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingBug(null);
                    setRejectionReason("");
                  }}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-500 transition-all active:scale-95"
                >
                  <XCircle className="size-3.5" />
                  <span>Reject Fix & Send to Queue</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: QA Team Management */}
      {activeTab === "team" && <QATeamManager />}

      {/* Tab 3: Module Toggles & Settings */}
      {activeTab === "settings" && <QASettingsPanel />}
    </div>
  );
}
