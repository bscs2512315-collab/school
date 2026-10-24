"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  CornerDownRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { StarDuotoneIcon } from "./StarDuotoneIcon";
import { useStoredUser } from "@/hooks/useStoredUser";
import { cn } from "@/lib/utils";

export interface LectureComment {
  id: string;
  authorName: string;
  authorUsername?: string;
  authorAvatar?: string;
  authorBadge?: string;
  text: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
  replies?: LectureComment[];
}

interface LectureCommentsSectionProps {
  episodeId: string;
}

export function LectureCommentsSection({ episodeId }: LectureCommentsSectionProps) {
  const { user } = useStoredUser();
  const [comments, setComments] = useState<LectureComment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

  // Load real user comments from localStorage for this episode
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`exboard_lecture_comments_${episodeId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setComments(parsed);
        }
      } else {
        setComments([]);
      }
    } catch {
      setComments([]);
    }
  }, [episodeId]);

  const persistComments = (updated: LectureComment[]) => {
    setComments(updated);
    try {
      localStorage.setItem(`exboard_lecture_comments_${episodeId}`, JSON.stringify(updated));
    } catch {
      // Ignore write errors
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: LectureComment = {
      id: `c-${Date.now()}`,
      authorName: user?.name || "Student",
      authorUsername: user?.username || "you",
      authorAvatar: user?.profileImage || undefined,
      authorBadge: user?.class ? `Class ${user.class}` : undefined,
      text: newCommentText.trim(),
      timestamp: "Just now",
      likes: 0,
      isLiked: false,
    };

    persistComments([newComment, ...comments]);
    setNewCommentText("");
    setIsInputFocused(false);
  };

  const handlePostReply = (parentCommentId: string) => {
    if (!replyText.trim()) return;

    const newReply: LectureComment = {
      id: `r-${Date.now()}`,
      authorName: user?.name || "Student",
      authorUsername: user?.username || "you",
      authorAvatar: user?.profileImage || undefined,
      authorBadge: user?.class ? `Class ${user.class}` : undefined,
      text: replyText.trim(),
      timestamp: "Just now",
      likes: 0,
      isLiked: false,
    };

    const updated = comments.map((c) => {
      if (c.id === parentCommentId) {
        return {
          ...c,
          replies: [...(c.replies || []), newReply],
        };
      }
      return c;
    });

    persistComments(updated);
    setReplyText("");
    setReplyingToId(null);
    setExpandedReplies((prev) => ({ ...prev, [parentCommentId]: true }));
  };

  const handleToggleCommentLike = (commentId: string, isReply = false, parentId?: string) => {
    let updated: LectureComment[] = [];
    if (!isReply) {
      updated = comments.map((c) => {
        if (c.id === commentId) {
          const willLike = !c.isLiked;
          return {
            ...c,
            isLiked: willLike,
            likes: willLike ? c.likes + 1 : Math.max(0, c.likes - 1),
          };
        }
        return c;
      });
    } else if (parentId) {
      updated = comments.map((c) => {
        if (c.id === parentId && c.replies) {
          return {
            ...c,
            replies: c.replies.map((r) => {
              if (r.id === commentId) {
                const willLike = !r.isLiked;
                return {
                  ...r,
                  isLiked: willLike,
                  likes: willLike ? r.likes + 1 : Math.max(0, r.likes - 1),
                };
              }
              return r;
            }),
          };
        }
        return c;
      });
    }
    persistComments(updated);
  };

  const totalCount = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length || 0),
    0
  );

  return (
    <div className="space-y-5 pt-1">
      {/* Comments Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            {totalCount > 0 ? `${totalCount} Comments` : "Discussion"}
          </h3>
        </div>
      </div>

      {/* Main Comment Input Box */}
      <div className="flex gap-3">
        <UserAvatar
          src={user?.profileImage || undefined}
          name={user?.name || "Student"}
          username={user?.username || undefined}
          id={user?.id || "current-user"}
          size={36}
          className="size-9 shrink-0"
        />

        <form onSubmit={handlePostComment} className="flex-1 space-y-2">
          <div className="relative">
            <textarea
              rows={isInputFocused || newCommentText ? 3 : 1}
              value={newCommentText}
              onFocus={() => setIsInputFocused(true)}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Ask a question or leave a note on this lecture..."
              className={cn(
                "w-full rounded-xl border bg-card p-3 text-xs font-medium text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none",
                isInputFocused
                  ? "border-primary/50 ring-1 ring-primary/20 shadow-xs"
                  : "border-border hover:border-border/80"
              )}
            />
          </div>

          {(isInputFocused || newCommentText.trim()) && (
            <div className="flex items-center justify-end gap-2 animate-in fade-in duration-200">
              <button
                type="button"
                onClick={() => {
                  setNewCommentText("");
                  setIsInputFocused(false);
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-xs transition-opacity hover:opacity-95 disabled:opacity-40"
              >
                <Send className="size-3" />
                <span>Comment</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Clean Empty State */}
      {comments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center rounded-2xl border border-dashed border-border/80 bg-muted/10 p-6 space-y-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <MessageSquare className="size-4.5" />
          </div>
          <p className="text-xs font-bold text-foreground">No discussions yet</p>
          <p className="text-[11px] text-muted-foreground max-w-sm leading-relaxed">
            Have a question about this lecture or an SLO? Post your question above to start the discussion!
          </p>
        </div>
      )}

      {/* Comments List */}
      {comments.length > 0 && (
        <div className="space-y-3.5 pt-1">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-xl border border-border/70 bg-card p-3.5 space-y-2 hover:border-border transition-colors"
            >
              {/* Author Meta */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <UserAvatar
                    src={comment.authorAvatar}
                    name={comment.authorName}
                    username={comment.authorUsername}
                    id={comment.id}
                    size={28}
                    className="size-7 shrink-0"
                  />

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-foreground">
                      {comment.authorName}
                    </span>
                    {comment.authorBadge && (
                      <span className="rounded-md bg-muted px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">
                        {comment.authorBadge}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      • {comment.timestamp}
                    </span>
                  </div>
                </div>
              </div>

              {/* Comment Text */}
              <p className="text-xs text-foreground/90 leading-relaxed pl-9">
                {comment.text}
              </p>

              {/* Comment Action Footer */}
              <div className="flex items-center gap-4 pl-9 pt-0.5 text-xs">
                {/* Like Button with Duotone Star */}
                <button
                  type="button"
                  onClick={() => handleToggleCommentLike(comment.id)}
                  className="flex items-center gap-1 font-semibold transition-colors"
                >
                  <StarDuotoneIcon
                    size={14}
                    isFilled={comment.isLiked}
                    className={comment.isLiked ? "text-amber-500" : "text-muted-foreground hover:text-amber-500"}
                  />
                  <span className={cn(
                    "text-[10px]",
                    comment.isLiked ? "text-amber-500 font-bold" : "text-muted-foreground"
                  )}>
                    {comment.likes > 0 ? comment.likes : "Like"}
                  </span>
                </button>

                {/* Reply Button */}
                <button
                  type="button"
                  onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                  className="text-[10px] font-semibold text-muted-foreground hover:text-primary transition-colors"
                >
                  Reply
                </button>
              </div>

              {/* Inline Reply Input */}
              {replyingToId === comment.id && (
                <div className="pl-9 pt-1.5 flex gap-2 animate-in fade-in duration-200">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${comment.authorName}...`}
                    className="flex-1 rounded-lg border border-primary/40 bg-background px-2.5 py-1 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => handlePostReply(comment.id)}
                    disabled={!replyText.trim()}
                    className="rounded-lg bg-primary px-3 py-1 text-xs font-bold text-primary-foreground disabled:opacity-40"
                  >
                    Reply
                  </button>
                </div>
              )}

              {/* Nested Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="pl-9 pt-1 space-y-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedReplies((prev) => ({
                        ...prev,
                        [comment.id]: !prev[comment.id],
                      }))
                    }
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                  >
                    <CornerDownRight className="size-3" />
                    <span>
                      {expandedReplies[comment.id] ? "Hide" : "View"}{" "}
                      {comment.replies.length}{" "}
                      {comment.replies.length === 1 ? "reply" : "replies"}
                    </span>
                    {expandedReplies[comment.id] ? (
                      <ChevronUp className="size-3" />
                    ) : (
                      <ChevronDown className="size-3" />
                    )}
                  </button>

                  {expandedReplies[comment.id] && (
                    <div className="space-y-2 pt-1 border-l-2 border-border pl-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <UserAvatar
                              src={reply.authorAvatar}
                              name={reply.authorName}
                              username={reply.authorUsername}
                              id={reply.id}
                              size={20}
                              className="size-5 shrink-0"
                            />
                            <span className="text-[11px] font-bold text-foreground">
                              {reply.authorName}
                            </span>
                            <span className="text-[9px] text-muted-foreground">
                              • {reply.timestamp}
                            </span>
                          </div>

                          <p className="text-xs text-foreground/90 pl-6.5">
                            {reply.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
