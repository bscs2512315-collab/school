"use client";

import { useEffect, useState } from "react";
import {
  X,
  Search,
  Check,
  Share2,
  Copy,
  Users,
  Loader2,
  CheckCircle2,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import AppButton from "@/components/AppButton";
import AppInput from "@/components/AppInput";
import UserAvatar from "@/components/UserAvatar";
import { apiGet, apiPost } from "@/lib/api/api-client";
import { cn } from "@/lib/utils";

interface UserSearchResult {
  id: string;
  name: string;
  username: string;
  profile_image?: string | null;
  profileImage?: string | null;
  role?: string;
}

interface PaperShareModalProps {
  paperId: string;
  paperTitle: string;
  subject: string;
  paperType: 1 | 2;
  classLevel: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PaperShareModal({
  paperId,
  paperTitle,
  subject,
  paperType,
  classLevel,
  isOpen,
  onClose,
}: PaperShareModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([]);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Search users API
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    let isMounted = true;
    setSearching(true);

    apiGet<{ users: UserSearchResult[] }>(
      `/users/search?q=${encodeURIComponent(debouncedQuery)}&all=true&limit=10`
    )
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data?.users) {
          setSearchResults(res.data.users);
        } else {
          setSearchResults([]);
        }
      })
      .catch(() => {
        if (isMounted) setSearchResults([]);
      })
      .finally(() => {
        if (isMounted) setSearching(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  if (!isOpen) return null;

  const shareableUrl = typeof window !== "undefined"
    ? `${window.location.origin}/papers-bank/${paperId}`
    : `/papers-bank/${paperId}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareableUrl);
      } else {
        const el = document.createElement("textarea");
        el.value = shareableUrl;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      toast.success("Direct link copied to clipboard! 📋");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleToggleUser = (user: UserSearchResult) => {
    if (selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers((prev) => [...prev, user]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one person to share with");
      return;
    }

    setSharing(true);
    const toastId = toast.loading("Sending paper and notifying users...");

    try {
      const res = await apiPost<{ sharedCount: number }>(
        `/papers-bank/${paperId}/share`,
        { userIds: selectedUsers.map((u) => u.id) }
      );

      if (!res.success) {
        throw new Error(res.message || "Failed to share paper");
      }

      toast.success(
        `Paper shared with ${selectedUsers.length} user${
          selectedUsers.length === 1 ? "" : "s"
        }! 🎉 They received an instant notification.`,
        { id: toastId }
      );

      setSelectedUsers([]);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to share paper";
      toast.error(msg, { id: toastId });
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3.5">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
                <Share2 className="size-3" /> Share Paper
              </span>
              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground">
                {subject} · Class {classLevel}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-foreground truncate">
              {paperTitle}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Copy Direct Link Section */}
        <div className="space-y-2 rounded-2xl border border-border/70 bg-background/50 p-3.5">
          <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            Direct Shareable Link
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 overflow-hidden rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-medium text-muted-foreground truncate">
              {shareableUrl}
            </div>
            <AppButton
              type="button"
              variant={copied ? "default" : "outline"}
              onClick={handleCopyLink}
              className="h-9 shrink-0 rounded-xl px-3.5 text-xs font-bold gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="size-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-3.5" /> Copy Link
                </>
              )}
            </AppButton>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Students opening this link will enter solve/attempt mode; teachers will view full solutions.
          </p>
        </div>

        {/* Search Users to Share */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Users className="size-3.5 text-primary" />
              Send In-App Notification to Classmates or Teachers
            </label>
            {selectedUsers.length > 0 && (
              <span className="text-xs font-bold text-primary">
                {selectedUsers.length} selected
              </span>
            )}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <AppInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student or teacher name, @username..."
              className="h-11 rounded-xl pl-10 pr-10 text-xs sm:text-sm bg-background"
            />
            {searching && (
              <Loader2 className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-primary" />
            )}
          </div>

          {/* Selected Users Chips */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
              {selectedUsers.map((u) => (
                <span
                  key={u.id}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 pl-2 pr-1.5 py-1 text-xs font-bold text-primary"
                >
                  <span className="truncate max-w-[120px]">{u.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveUser(u.id)}
                    className="flex size-4 items-center justify-center rounded-full hover:bg-primary/20 text-primary cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search Results Dropdown/List */}
          {searchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-2xl border border-border bg-background p-1.5 space-y-1 shadow-inner">
              {searchResults.map((u) => {
                const isSelected = selectedUsers.some((sel) => sel.id === u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleToggleUser(u)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl p-2 text-left transition-colors cursor-pointer",
                      isSelected
                        ? "bg-primary/15 border border-primary/30"
                        : "hover:bg-muted/60"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar
                        src={u.profileImage || u.profile_image}
                        name={u.name}
                        username={u.username}
                        id={u.id}
                        size={32}
                        className="size-8 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-foreground truncate">
                            {u.name}
                          </p>
                          {u.role === "TEACHER" && (
                            <span className="rounded-md bg-blue-500/15 px-1 py-0.2 text-[9px] font-black uppercase text-blue-700 dark:text-blue-400">
                              Teacher
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          @{u.username}
                        </p>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "bg-muted text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      {isSelected ? (
                        <>
                          <Check className="size-3" /> Selected
                        </>
                      ) : (
                        <>
                          <Plus className="size-3" /> Add
                        </>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/60">
          <AppButton
            variant="outline"
            onClick={onClose}
            className="rounded-xl px-4 text-xs font-bold"
          >
            Cancel
          </AppButton>
          <AppButton
            onClick={handleShare}
            disabled={sharing || selectedUsers.length === 0}
            className="h-10 rounded-xl px-6 text-xs font-black uppercase tracking-wider shadow-md gap-1.5"
          >
            {sharing ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Sharing…
              </>
            ) : (
              <>
                <Send className="size-3.5" /> Share ({selectedUsers.length})
              </>
            )}
          </AppButton>
        </div>
      </div>
    </div>
  );
}

function Send({ className }: { className?: string }) {
  return <Share2 className={className} />;
}
