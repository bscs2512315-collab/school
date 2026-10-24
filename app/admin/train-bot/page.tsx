"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppButton from "@/components/AppButton";
import AppState from "@/components/AppState";
import NovaMarkdown from "@/components/nova/NovaMarkdown";
import { cn } from "@/lib/utils";
import {
  useAdminBotExemplars,
  useAdminBotKnowledge,
  useAdminBotSettings,
  useSyncAdminBotKnowledge,
  useUpdateAdminBotExemplar,
  useUpdateAdminBotSettings,
  useTestAdminBot,
  type BotTestResult,
} from "@/hooks/admin/useAdminBot";
import {
  Bot,
  Database,
  RefreshCw,
  Settings,
  TestTube,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { BotSettings, PaperIIExemplar } from "@/types/bot";

type Tab = "exemplars" | "knowledge" | "settings" | "test";

export default function AdminTrainBotPage() {
  const [activeTab, setActiveTab] = useState<Tab>("exemplars");
  const exemplarsQuery = useAdminBotExemplars();
  const knowledgeQuery = useAdminBotKnowledge();
  const settingsQuery = useAdminBotSettings();
  const syncMutation = useSyncAdminBotKnowledge();
  const updateExemplarMutation = useUpdateAdminBotExemplar();
  const updateSettingsMutation = useUpdateAdminBotSettings();
  const testMutation = useTestAdminBot();

  const [exemplars, setExemplars] = useState<PaperIIExemplar[]>([]);
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [testQuery, setTestQuery] = useState("");
  const [testResult, setTestResult] = useState<BotTestResult | null>(null);

  useEffect(() => {
    if (exemplarsQuery.data) {
      setExemplars(exemplarsQuery.data);
    }
  }, [exemplarsQuery.data]);

  useEffect(() => {
    if (settingsQuery.data) {
      setSettings(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const stats = knowledgeQuery.data ?? null;
  const isLoading =
    exemplarsQuery.isLoading || knowledgeQuery.isLoading || settingsQuery.isLoading;

  const handleSync = async () => {
    try {
      const data = await syncMutation.mutateAsync();
      alert(`Synced ${data.total} knowledge chunks`);
    } catch (e) {
      console.error(e);
      alert("Sync failed. Check GEMINI_API_KEY and try again.");
    }
  };

  const updateExemplar = async (exemplar: PaperIIExemplar) => {
    setSavingId(exemplar.id);
    try {
      await updateExemplarMutation.mutateAsync({
        id: exemplar.id,
        paperIIData: exemplar.paperIIData,
      });
    } catch (e) {
      console.error(e);
      alert("Failed to save exemplar");
    } finally {
      setSavingId(null);
    }
  };

  const saveSettings = async () => {
    if (!settings) {
      return;
    }
    try {
      const data = await updateSettingsMutation.mutateAsync(settings);
      setSettings(data);
      alert("Settings saved");
    } catch (e) {
      console.error(e);
    }
  };

  const runTest = async () => {
    if (!testQuery.trim()) {
      return;
    }
    try {
      const data = await testMutation.mutateAsync({ message: testQuery });
      setTestResult(data);
    } catch (e) {
      console.error(e);
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof Bot }[] = [
    { id: "exemplars", label: "Paper II Exemplars", icon: Bot },
    { id: "knowledge", label: "Knowledge Base", icon: Database },
    { id: "settings", label: "Bot Settings", icon: Settings },
    { id: "test", label: "Test Nova", icon: TestTube },
  ];

  if (isLoading) return <AppState variant="loading" />;

  return (
    <PageContainer maxWidth="6xl">
      <PageHeader
        title="Train Nova"
        showWatermark={false}
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
              {
                "bg-primary text-primary-foreground shadow-md": activeTab === tab.id,
                "bg-muted text-muted-foreground hover:bg-muted/80": activeTab !== tab.id,
              },
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "exemplars" ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Edit Better and Weaker responses for Paper II questions. Approved exemplars train Nova
            to explain board-aligned answers.
          </p>
          {exemplars.length === 0 ? (
            <AppState variant="empty" emptyMessage="No Paper II exemplars found. Upload Past Paper 2 with better/weaker responses first." />
          ) : (
            exemplars.map((ex) => (
              <div key={ex.id} className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">
                      {ex.board} · Class {ex.class} · {ex.subject} · {ex.year}
                    </p>
                    <p className="mt-1 font-semibold text-foreground">
                      Q{ex.questionNumber}
                      {ex.questionPart ? ` (${ex.questionPart})` : ""} — {ex.questionType}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{ex.questionText}</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={ex.paperIIData?.botApproved ?? false}
                      onChange={(e) => {
                        const updated = exemplars.map((item) =>
                          item.id === ex.id
                            ? {
                                ...item,
                                paperIIData: {
                                  ...item.paperIIData,
                                  botApproved: e.target.checked,
                                },
                              }
                            : item,
                        );
                        setExemplars(updated);
                      }}
                    />
                    Bot approved
                  </label>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-trend-up">
                      Better Response
                    </label>
                    <textarea
                      value={ex.paperIIData?.betterResponse ?? ""}
                      onChange={(e) => {
                        setExemplars(
                          exemplars.map((item) =>
                            item.id === ex.id
                              ? {
                                  ...item,
                                  paperIIData: {
                                    ...item.paperIIData,
                                    betterResponse: e.target.value,
                                  },
                                }
                              : item,
                          ),
                        );
                      }}
                      rows={5}
                      className="w-full rounded-xl border border-border bg-background p-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-trend-down">
                      Weaker Response
                    </label>
                    <textarea
                      value={ex.paperIIData?.weakerResponse ?? ""}
                      onChange={(e) => {
                        setExemplars(
                          exemplars.map((item) =>
                            item.id === ex.id
                              ? {
                                  ...item,
                                  paperIIData: {
                                    ...item.paperIIData,
                                    weakerResponse: e.target.value,
                                  },
                                }
                              : item,
                          ),
                        );
                      }}
                      rows={5}
                      className="w-full rounded-xl border border-border bg-background p-3 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                    Marking Notes
                  </label>
                  <textarea
                    value={ex.paperIIData?.markingNotes ?? ""}
                    onChange={(e) => {
                      setExemplars(
                        exemplars.map((item) =>
                          item.id === ex.id
                            ? {
                                ...item,
                                paperIIData: {
                                  ...item.paperIIData,
                                  markingNotes: e.target.value,
                                },
                              }
                            : item,
                        ),
                      );
                    }}
                    rows={2}
                    className="w-full rounded-xl border border-border bg-background p-3 text-sm"
                    placeholder="Why does the better response score higher?"
                  />
                </div>
                <AppButton
                  onClick={() => updateExemplar(ex)}
                  isLoading={savingId === ex.id}
                  loadingText="Saving..."
                  className="rounded-xl"
                >
                  Save & Re-index
                </AppButton>
              </div>
            ))
          )}
        </div>
      ) : null}

      {activeTab === "knowledge" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-bold uppercase text-muted-foreground">Total Chunks</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{stats?.total ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-bold uppercase text-muted-foreground">With Embeddings</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{stats?.withEmbeddings ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-bold uppercase text-muted-foreground">Paper II Exemplars</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {stats?.byType?.past_paper_p2 ?? 0}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-bold text-foreground">Sync Knowledge Base</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Index syllabus SLOs, Past Paper 1 MCQs, and Paper II exemplars into Nova&apos;s
              knowledge base. Run this after uploading new content or editing exemplars in bulk.
            </p>
            <AppButton
              onClick={handleSync}
              disabled={syncMutation.isPending}
              className="mt-4 rounded-xl"
            >
              <RefreshCw className={cn("mr-2 size-4", { "animate-spin": syncMutation.isPending })} />
              {syncMutation.isPending ? "Syncing..." : "Sync Knowledge Base"}
            </AppButton>
          </div>
        </div>
      ) : null}

      {activeTab === "settings" && settings ? (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
              System Prompt
            </label>
            <textarea
              value={settings.systemPrompt}
              onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
              rows={8}
              className="w-full rounded-xl border border-border bg-background p-3 text-sm font-mono"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
              Refusal Message
            </label>
            <textarea
              value={settings.refusalMessage}
              onChange={(e) => setSettings({ ...settings, refusalMessage: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-border bg-background p-3 text-sm"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                Temperature
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={settings.temperature}
                onChange={(e) =>
                  setSettings({ ...settings, temperature: parseFloat(e.target.value) })
                }
                className="w-full rounded-xl border border-border bg-background p-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                Top K Chunks
              </label>
              <input
                type="number"
                min="1"
                max="15"
                value={settings.topKChunks}
                onChange={(e) =>
                  setSettings({ ...settings, topKChunks: parseInt(e.target.value, 10) })
                }
                className="w-full rounded-xl border border-border bg-background p-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                Rate Limit / Hour
              </label>
              <input
                type="number"
                min="5"
                max="200"
                value={settings.rateLimitPerHour}
                onChange={(e) =>
                  setSettings({ ...settings, rateLimitPerHour: parseInt(e.target.value, 10) })
                }
                className="w-full rounded-xl border border-border bg-background p-3 text-sm"
              />
            </div>
          </div>
          <AppButton onClick={saveSettings} isLoading={updateSettingsMutation.isPending} loadingText="Saving..." className="rounded-xl">
            Save Settings
          </AppButton>
        </div>
      ) : null}

      {activeTab === "test" ? (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Test Nova with a sample student query. See classification, retrieved sources, and the
            generated reply before students use it.
          </p>
          <textarea
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            rows={3}
            placeholder="Ask Nova a test question..."
            className="w-full rounded-xl border border-border bg-background p-3 text-sm"
          />
          <AppButton onClick={runTest} isLoading={testMutation.isPending} loadingText="Testing..." className="rounded-xl">
            Run Test
          </AppButton>
          {testResult ? (
            <div className="space-y-3 rounded-xl bg-muted p-4">
              <div className="flex items-center gap-2 text-sm">
                {testResult.blocked ? (
                  <XCircle className="size-4 text-trend-down" />
                ) : (
                  <CheckCircle2 className="size-4 text-trend-up" />
                )}
                <span className="font-medium">
                  Intent: {testResult.classification?.intent} (
                  {Math.round((testResult.classification?.confidence ?? 0) * 100)}%)
                </span>
              </div>
              <NovaMarkdown content={testResult.reply} />
              {(testResult.sources?.length ?? 0) > 0 ? (
                <div className="text-xs text-muted-foreground">
                  Sources: {testResult.sources?.map((s) => s.label).join(", ")}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </PageContainer>
  );
}
