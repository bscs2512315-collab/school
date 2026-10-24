"use client";

import { useEffect } from "react";
import { Loader2, X, WifiOff } from "lucide-react";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import HistorySVG from "@/public/svgs/HistorySVG";
import NewChatSVG from "@/public/svgs/NewChatSVG";
import { cn } from "@/lib/utils";
import { useIsOffline } from "@/lib/offline";

export interface NovaChatSessionItem {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface NovaChatSessionsPanelProps {
  sessions: NovaChatSessionItem[];
  activeSessionId?: string;
  isLoading: boolean;
  isOpen: boolean;
  deletingSessionId?: string;
  onClose: () => void;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (session: NovaChatSessionItem) => void;
}

function formatSessionDate(value: string): string {
  const date = new Date(value);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function NovaChatHistorySkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="space-y-1" aria-busy="true" aria-label="Loading chat history">
      {Array.from({ length: count }).map((_, index) => (
        <li
          key={index}
          className="flex flex-col gap-1.5 rounded-xl border border-transparent px-3 py-2.5 animate-pulse"
        >
          <div
            className={cn("h-4 rounded-md bg-muted/80", {
              "w-[85%]": index % 3 === 0,
              "w-[68%]": index % 3 === 1,
              "w-[78%]": index % 3 === 2,
            })}
          />
          <div
            className={cn("h-2.5 rounded-md bg-muted/50", {
              "w-12": index % 3 === 0,
              "w-16": index % 3 === 1,
              "w-14": index % 3 === 2,
            })}
          />
        </li>
      ))}
    </ul>
  );
}

export default function NovaChatSessionsPanel({
  sessions,
  activeSessionId,
  isLoading,
  isOpen,
  deletingSessionId,
  onClose,
  onNewChat,
  onSelectSession,
  onDeleteSession,
}: NovaChatSessionsPanelProps) {
  const isOffline = useIsOffline();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity md:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={cn(
          "z-50 flex shrink-0 flex-col bg-card dark:bg-zinc-950 border-r border-border/80 shadow-2xl transition-transform duration-300 ease-out",
          "fixed inset-y-0 left-0 w-[84vw] max-w-[320px] md:relative md:inset-y-auto md:w-64 md:border-r md:border-border/60 md:shadow-none md:bg-card/40 md:dark:bg-card/20 md:h-full md:z-0",
          {
            "translate-x-0": isOpen,
            "-translate-x-full md:translate-x-0": !isOpen,
          },
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 bg-muted/40 px-4 dark:bg-muted/15">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
              <HistorySVG className="size-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold tracking-tight text-foreground truncate">Chat History</h2>
              {isLoading ? (
                <div className="mt-1 h-3 w-16 animate-pulse rounded-md bg-muted/60" />
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  {sessions.length} {sessions.length === 1 ? "conversation" : "conversations"}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
            aria-label="Close chat history"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-3 pb-2">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.99]"
          >
            <NewChatSVG className="size-4 shrink-0" />
            <span>New chat</span>
          </button>
        </div>

        <div className="mb-2 italic flex items-center justify-center rounded-lg px-2 py-1 text-[10px] font-medium text-muted-foreground whitespace-nowrap text-center">
          <span>Chats & files auto-deleted after 7 days</span>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 pb-6">
          {isLoading ? (
            <NovaChatHistorySkeleton count={6} />
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-2.5">
                {isOffline ? <WifiOff className="size-5" /> : <HistorySVG className="size-5" />}
              </div>
              <p className="text-xs font-semibold text-foreground">
                {isOffline ? "You are offline" : "No previous chats"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[200px]">
                {isOffline
                  ? "Please check your internet connection to view chat history."
                  : "Start asking Nova questions. Chats & attachments are kept for 7 days."}
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {sessions.map((session) => {
                const isDeleting = deletingSessionId === session.id;
                const isActive = activeSessionId === session.id;

                return (
                  <li key={session.id}>
                    <div
                      className={cn(
                        "group relative flex items-center rounded-xl border transition-all duration-150",
                        isActive
                          ? "border-primary/30 bg-primary/10 text-primary shadow-xs dark:bg-primary/15"
                          : "border-transparent text-foreground hover:border-border/60 hover:bg-muted/50",
                        isDeleting && "pointer-events-none opacity-50",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSession(session.id);
                          onClose();
                        }}
                        disabled={isDeleting}
                        className="min-w-0 flex-1 px-3 py-2.5 text-left"
                      >
                        <p
                          className={cn(
                            "truncate text-sm font-medium",
                            isActive && "font-semibold text-primary",
                          )}
                        >
                          {session.title || "New chat"}
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                          {formatSessionDate(session.updated_at)}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session);
                        }}
                        disabled={Boolean(deletingSessionId)}
                        aria-label={`Delete ${session.title || "chat"}`}
                        className={cn(
                          "mr-1.5 flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
                          "opacity-100 md:opacity-0 md:group-hover:opacity-100",
                        )}
                      >
                        {isDeleting ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <DeleteSVG className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-border/60 bg-muted/30 px-3.5 py-2.5 text-center">
          <p className="text-[10.5px] leading-tight text-muted-foreground">
            Chats & uploaded files are auto-deleted after 7 days.
          </p>
        </div>
      </aside>
    </>
  );
}

export function NovaChatHistoryButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Chat history"
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary/10 p-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 dark:bg-muted dark:text-white md:hidden",
        className,
      )}
    >
      <HistorySVG className="size-3.5" />
      <span className="hidden min-[420px]:inline">History</span>
    </button>
  );
}
