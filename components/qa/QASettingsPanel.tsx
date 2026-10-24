"use client";

import React, { useState } from "react";
import { useQASettings, updateLocalQASettings, type QASettings } from "@/hooks/useQASettings";
import {
  Sliders,
  CheckCircle2,
  FileQuestion,
  Bot,
  FileText,
  Sparkles,
  RefreshCw,
  Layers,
  Power,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function QASettingsPanel() {
  const { settings, loading, refetch } = useQASettings();
  const [saving, setSaving] = useState(false);

  const handleUpdate = async (newSettings: QASettings) => {
    // 1. Optimistic Local Update
    updateLocalQASettings(newSettings);

    setSaving(true);
    try {
      const res = await fetch("/api/qa/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("QA Bug Reporting Settings saved!");
      } else {
        toast.error(data.error || "Failed to update settings");
        refetch();
      }
    } catch {
      toast.error("Network error saving settings");
      refetch();
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof QASettings) => {
    const updated = {
      ...settings,
      [key]: !settings[key],
    };
    handleUpdate(updated);
  };

  const applyPreset = (preset: "ALL" | "ONLY_Q" | "Q_AND_NOVA" | "NOVA_AND_TEACHER" | "Q_AND_TEACHER" | "NONE") => {
    let target: QASettings;
    switch (preset) {
      case "ALL":
        target = { enabled_questions: true, enabled_nova: true, enabled_teacher_paper: true };
        break;
      case "ONLY_Q":
        target = { enabled_questions: true, enabled_nova: false, enabled_teacher_paper: false };
        break;
      case "Q_AND_NOVA":
        target = { enabled_questions: true, enabled_nova: true, enabled_teacher_paper: false };
        break;
      case "NOVA_AND_TEACHER":
        target = { enabled_questions: false, enabled_nova: true, enabled_teacher_paper: true };
        break;
      case "Q_AND_TEACHER":
        target = { enabled_questions: true, enabled_nova: false, enabled_teacher_paper: true };
        break;
      case "NONE":
        target = { enabled_questions: false, enabled_nova: false, enabled_teacher_paper: false };
        break;
    }
    handleUpdate(target);
  };

  const modules = [
    {
      key: "enabled_questions" as keyof QASettings,
      number: "1",
      title: "Past Papers & Question Bank Bug Reporting",
      description:
        "Displays the 'Report Bug' action pill on MCQs, Past Papers (P1 & P2), Question Bank, and Custom Quizzes during student attempt screens.",
      icon: FileQuestion,
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      enabled: settings.enabled_questions,
    },
    {
      key: "enabled_nova" as keyof QASettings,
      number: "2",
      title: "Nova AI Tutor Chat Bug Reporting",
      description:
        "Enables 'Report Issue' on Nova tutor responses to report hallucinations, LaTeX formula rendering errors, and off-topic explanations.",
      icon: Bot,
      badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      enabled: settings.enabled_nova,
    },
    {
      key: "enabled_teacher_paper" as keyof QASettings,
      number: "3",
      title: "Teacher Paper Generator Bug Reporting",
      description:
        "Enables 'Report Issue' inside Teacher Paper Preview, SLO Paper Generator, and Test Detail modals to catch duplicate questions or bad rubrics.",
      icon: FileText,
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      enabled: settings.enabled_teacher_paper,
    },
  ];

  const activeCount = [settings.enabled_questions, settings.enabled_nova, settings.enabled_teacher_paper].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <Sliders className="size-5 text-primary" />
            QA Bug Reporting Module Toggles
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select which parts of the application should display active QA bug reporting tools.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-2xl border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary">
            <ShieldCheck className="size-4" />
            <span>{activeCount} of 3 Modules Active</span>
          </span>
          {saving && <RefreshCw className="size-4 animate-spin text-muted-foreground" />}
        </div>
      </div>

      {/* Quick Combination Presets */}
      <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">
          Quick Preset Switchers
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset("ALL")}
            className={cn(
              "rounded-2xl border px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95",
              settings.enabled_questions && settings.enabled_nova && settings.enabled_teacher_paper
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background text-foreground hover:bg-muted"
            )}
          >
            ⭐ Allow All 3 (1, 2 & 3)
          </button>

          <button
            type="button"
            onClick={() => applyPreset("ONLY_Q")}
            className={cn(
              "rounded-2xl border px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95",
              settings.enabled_questions && !settings.enabled_nova && !settings.enabled_teacher_paper
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background text-foreground hover:bg-muted"
            )}
          >
            📝 Only Questions (1)
          </button>

          <button
            type="button"
            onClick={() => applyPreset("Q_AND_NOVA")}
            className={cn(
              "rounded-2xl border px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95",
              settings.enabled_questions && settings.enabled_nova && !settings.enabled_teacher_paper
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background text-foreground hover:bg-muted"
            )}
          >
            ✨ Questions + Nova (1 & 2)
          </button>

          <button
            type="button"
            onClick={() => applyPreset("NOVA_AND_TEACHER")}
            className={cn(
              "rounded-2xl border px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95",
              !settings.enabled_questions && settings.enabled_nova && settings.enabled_teacher_paper
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background text-foreground hover:bg-muted"
            )}
          >
            🤖 Nova + Teacher Paper (2 & 3)
          </button>

          <button
            type="button"
            onClick={() => applyPreset("Q_AND_TEACHER")}
            className={cn(
              "rounded-2xl border px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95",
              settings.enabled_questions && !settings.enabled_nova && settings.enabled_teacher_paper
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background text-foreground hover:bg-muted"
            )}
          >
            📄 Questions + Teacher Paper (1 & 3)
          </button>

          <button
            type="button"
            onClick={() => applyPreset("NONE")}
            className={cn(
              "rounded-2xl border px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95",
              !settings.enabled_questions && !settings.enabled_nova && !settings.enabled_teacher_paper
                ? "border-destructive bg-destructive text-white shadow-sm"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            🚫 Disable All
          </button>
        </div>
      </div>

      {/* 3 Module Toggle Cards */}
      <div className="space-y-3.5">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.key}
              className={cn(
                "group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border p-5 shadow-xs transition-all",
                mod.enabled
                  ? "border-primary/40 bg-card hover:border-primary/60"
                  : "border-border/60 bg-muted/20 opacity-75 hover:opacity-100"
              )}
            >
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-2xl border transition-transform group-hover:scale-105",
                    mod.enabled ? mod.badgeColor : "border-border bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-black text-muted-foreground">
                      Module #{mod.number}
                    </span>
                    <h3 className="text-sm font-bold text-foreground">{mod.title}</h3>
                    {mod.enabled ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3" />
                        <span>Enabled</span>
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted border border-border px-2 py-0.2 text-[10px] font-bold text-muted-foreground">
                        Disabled
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {mod.description}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <div className="flex items-center self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  role="switch"
                  aria-checked={mod.enabled}
                  onClick={() => handleToggle(mod.key)}
                  className={cn(
                    "relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    mod.enabled ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none inline-block size-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                      mod.enabled ? "translate-x-6" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
