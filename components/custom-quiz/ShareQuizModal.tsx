"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, UserPlus, X } from "lucide-react";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import AddSVG from "@/public/svgs/AddSVG";
import ShareSVG from "@/public/svgs/ShareSVG";
import toast from "react-hot-toast";
import AppButton from "@/components/AppButton";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/Typography";
import { useUserSearch } from "@/hooks/user/useUserSearch";
import { useApiMutation } from "@/hooks/api/useApiMutation";
import { apiPost } from "@/lib/api/api-client";
import { API_ENDPOINTS } from "@/constants/endpoints";
import type { CustomQuizSummary, QuizShareResult } from "@/types/custom-quiz";

interface InviteUser {
  id: string;
  name: string;
  username: string;
  profileImage: string | null;
}

interface ShareQuizModalProps {
  quiz: CustomQuizSummary | null;
  onClose: () => void;
}

export default function ShareQuizModal({ quiz, onClose }: ShareQuizModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [invited, setInvited] = useState<InviteUser[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(searchQuery.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset picker state whenever a different quiz is opened.
  useEffect(() => {
    setSearchQuery("");
    setDebounced("");
    setInvited([]);
  }, [quiz?.id]);

  const searchResult = useUserSearch(debounced);
  const results: InviteUser[] = (searchResult.data?.users ?? []).map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username ?? "",
    profileImage: u.profileImage,
  }));

  const shareMutation = useApiMutation<QuizShareResult, string[]>({
    mutationFn: (usernames) =>
      apiPost<QuizShareResult>(API_ENDPOINTS.STUDENT.CUSTOM_QUIZ_SHARE(quiz!.id), {
        usernames,
      }),
    onSuccess: (data) => {
      if (data.invited.length > 0) {
        toast.success(
          `Challenge sent to ${data.invited.length} friend${data.invited.length === 1 ? "" : "s"}`,
        );
      }
      if (data.alreadyShared.length > 0) {
        toast(`Already shared with: ${data.alreadyShared.join(", ")}`);
      }
      if (data.notFound.length > 0) {
        toast.error(`Not found: ${data.notFound.join(", ")}`);
      }
      if (data.invited.length > 0) onClose();
    },
    onError: (error) => toast.error(error.message || "Failed to share quiz"),
  });

  if (!quiz) return null;

  const addUser = (user: InviteUser) => {
    if (invited.some((u) => u.id === user.id)) {
      toast.error("Already added");
      return;
    }
    if (!user.username) {
      toast.error("This user can't be challenged (no username)");
      return;
    }
    setInvited((prev) => [...prev, user]);
    setSearchQuery("");
    setDebounced("");
  };

  const removeUser = (id: string) => setInvited((prev) => prev.filter((u) => u.id !== id));

  const handleShare = () => {
    if (invited.length === 0) {
      toast.error("Add at least one friend");
      return;
    }
    shareMutation.mutate(invited.map((u) => u.username));
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-4xl border-0 bg-card p-5 shadow-2xl animate-in zoom-in-95 duration-200 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 transition-colors hover:bg-muted"
        >
          <X className="size-5 text-muted-foreground" />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
            <ShareSVG className="size-6 text-primary" />
          </div>
          <div className="min-w-0">
            <Typography variant="h2" className="text-lg font-black text-foreground sm:text-xl">
              Challenge Friends
            </Typography>
            <p className="truncate text-sm text-muted-foreground">{quiz.title}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search friends by name or @username"
            className="h-12 rounded-2xl pl-11 pr-11"
          />
          {searchResult.isFetching ? (
            <Loader2 className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-primary" />
          ) : null}

          {debounced && results.length > 0 ? (
            <div className="absolute top-full z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-border bg-card shadow-lg">
              {results.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => addUser(user)}
                  className="flex w-full items-center gap-3 border-b border-border p-3 text-left last:border-b-0 hover:bg-muted/50"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-primary">{user.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">@{user.username}</p>
                  </div>
                  <AddSVG className="size-4 shrink-0 text-primary" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Invited list */}
        <div className="mt-5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Challenging ({invited.length})
          </p>
          {invited.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-6 py-8 text-center">
              <UserPlus className="mx-auto mb-2 size-7 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Search and add friends to challenge them with this quiz.
              </p>
            </div>
          ) : (
            <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {invited.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-background p-2.5"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-primary">{user.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">@{user.username}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeUser(user.id)}
                    className="flex size-7 items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <DeleteSVG className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <AppButton
            variant="outline"
            onClick={onClose}
            disabled={shareMutation.isPending}
            className="h-12 flex-1 rounded-2xl font-bold"
          >
            Cancel
          </AppButton>
          <AppButton
            onClick={handleShare}
            disabled={shareMutation.isPending || invited.length === 0}
            className="h-12 flex-1 rounded-2xl font-bold"
          >
            {shareMutation.isPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <ShareSVG className="size-4" />
                Send Challenge
              </>
            )}
          </AppButton>
        </div>
      </div>
    </div>
  );
}
