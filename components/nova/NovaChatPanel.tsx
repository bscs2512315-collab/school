"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ExternalLink,
  FileText,
  Loader2,
  Paperclip,
  X,
} from "lucide-react";
import GallerySVG from "@/public/svgs/GallerySVG";
import CameraSVG from "@/public/svgs/CameraSVG";
import QuestionBankSVG from "@/public/svgs/QuestionBankSVG";
import SendSVG from "@/public/svgs/SendSVG";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import CheckSVG from "@/public/svgs/CheckSVG";
import { cn } from "@/lib/utils";
import AppButton from "@/components/AppButton";
import AppInput from "@/components/AppInput";
import AppLoader from "@/components/AppLoader";
import NovaMarkdown from "@/components/nova/NovaMarkdown";
import type { ChatAction, ChatChapterChip, ChatSource } from "@/types/bot";
import { isChatImagePaperAction, isChatPaperAction } from "@/types/bot";
import { getNovaChatErrorMessage } from "@/lib/ai/gemini-errors";
import NovaStartPanel from "@/components/nova/NovaStartPanel";
import NovaChatLoader from "@/components/nova/NovaChatLoader";
import NovaChatMessagesSkeleton from "@/components/nova/NovaChatMessagesSkeleton";
import NovaChatSessionsPanel, {
  NovaChatHistoryButton,
  type NovaChatSessionItem,
} from "@/components/nova/NovaChatSessionsPanel";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import TeacherPaperPreviewEditor from "@/components/teacher/TeacherPaperPreviewEditor";
import TeacherPublishClassroomPicker from "@/components/teacher/TeacherPublishClassroomPicker";
import toast from "react-hot-toast";
import { API_ENDPOINTS, FRONTEND_ROUTES } from "@/constants/endpoints";
import { apiPost } from "@/lib/api/api-client";
import { useStoredUser } from "@/hooks/useStoredUser";
import {
  fetchNovaChatSession,
  useDeleteNovaChatSession,
  useGeneratePaperFromImage,
  useGeneratePracticePaper,
  useNovaChatSessions,
  useSendNovaMessage,
  useUploadNovaImage,
} from "@/hooks/nova/useNovaChat";
import { parseChatMessageRow, type ChatMessage, type ChatMessageAttachment } from "@/lib/nova/chat-messages";
import { UserRole } from "@/types/enums";
import type { GeneratedSloPaperQuestion } from "@/lib/paper/slo-paper-generator";
import { examDurationFromQuestions } from "@/lib/paper/exam-duration";
import type { TeacherClassroomOption } from "@/hooks/teacher/useTeacherClassrooms";
import NovaQABugButton from "@/components/qa/NovaQABugButton";
import AddSVG from "@/public/svgs/AddSVG";

interface PendingAttachment {
  file: File;
  previewUrl: string;
  isDocument?: boolean;
}

interface TeacherDraftState {
  classroomId: string;
  generatedPaperId: string;
  paperType: "1" | "2";
  subject: string;
  classLevel: string;
  board: string;
  chapterIds: string[];
  title: string;
  questions: GeneratedSloPaperQuestion[];
  /** Image-sourced drafts can publish to any classroom */
  fromImage?: boolean;
}

function teacherClassroomId(
  teacherId: string,
  subject: string,
  classLevel: string,
): string {
  return `${teacherId}__${subject}__${classLevel}`;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_PDF_SIZE = 15 * 1024 * 1024;
const MAX_TEXT_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_SIZE = 20 * 1024 * 1024;
const MAX_ATTACHMENTS = 4;

export default function NovaChatPanel({ className }: { className?: string }) {
  const router = useRouter();
  const { user, isReady } = useStoredUser();
  const sessionsQuery = useNovaChatSessions();
  const sendMessageMutation = useSendNovaMessage();
  const deleteSessionMutation = useDeleteNovaChatSession();
  const uploadImageMutation = useUploadNovaImage();
  const generatePaperMutation = useGeneratePracticePaper();
  const generateFromImageMutation = useGeneratePaperFromImage();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [launchingPaper, setLaunchingPaper] = useState<number | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<NovaChatSessionItem | null>(null);
  const [teacherDraft, setTeacherDraft] = useState<TeacherDraftState | null>(null);
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [publishingDraft, setPublishingDraft] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [lastSessionImageUrl, setLastSessionImageUrl] = useState<string | null>(null);
  const [selectedChaptersByMsg, setSelectedChaptersByMsg] = useState<Record<string, number[]>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const latestAssistantRef = useRef<HTMLDivElement>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const sendingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, 160);
    textarea.style.height = `${Math.max(nextHeight, 42)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  const studentName = user?.name?.split(" ")[0] ?? "Student";
  const userImage = user?.profileImage ?? null;
  const userId = user?.id ?? "";
  const isTeacher = user?.role === UserRole.TEACHER;
  const sessions = sessionsQuery.data ?? [];
  const isLoadingSessions = sessionsQuery.isLoading;
  const isLoading = sendMessageMutation.isPending;
  const isUploadingImage = uploadImageMutation.isPending;
  const isBusy = isSending || isLoading || isUploadingImage;
  const isEmpty = messages.length === 0;
  const canSend = Boolean(input.trim() || pendingAttachments.length);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!expandedImage) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpandedImage(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [expandedImage]);

  useEffect(() => {
    const objectUrls = objectUrlsRef.current;
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    const scrollArea = scrollRef.current;
    const lastMessage = messages.at(-1);
    if (!scrollArea || !lastMessage) return;
    const frame = requestAnimationFrame(() => {
      if (lastMessage.role === "assistant" && latestAssistantRef.current) {
        const top = latestAssistantRef.current.getBoundingClientRect().top - scrollArea.getBoundingClientRect().top + scrollArea.scrollTop - 16;
        scrollArea.scrollTo({ top, behavior: "smooth" });
      } else {
        scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: "smooth" });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [messages]);

  const loadSession = async (targetSessionId: string) => {
    if (targetSessionId === sessionId && messages.length > 0) return;

    setIsLoadingMessages(true);
    try {
      const rows = await fetchNovaChatSession(targetSessionId);
      const parsed = rows.map(parseChatMessageRow);
      setSessionId(targetSessionId);
      setMessages(parsed);
      const lastImage = [...parsed]
        .reverse()
        .find((m) => m.role === "user" && m.imageUrl)?.imageUrl;
      setLastSessionImageUrl(lastImage ?? null);
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "42px";
      }
    } catch {
      toast.error("Could not load this chat");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(undefined);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "42px";
    }
    clearPendingAttachments();
    setLastSessionImageUrl(null);
  };

  const handleDeleteSessionRequest = (session: NovaChatSessionItem) => {
    setSessionToDelete(session);
  };

  const handleCloseDeleteModal = () => {
    if (!deleteSessionMutation.isPending) {
      setSessionToDelete(null);
    }
  };

  const handleConfirmDeleteSession = async () => {
    if (!sessionToDelete) return;

    try {
      await deleteSessionMutation.mutateAsync(sessionToDelete.id);
      if (sessionId === sessionToDelete.id) {
        handleNewChat();
      }
      toast.success("Chat deleted");
      setSessionToDelete(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete chat");
    }
  };

  const clearPendingAttachments = () => {
    if (pendingAttachments.some((attachment) => attachment.previewUrl === expandedImage)) setExpandedImage(null);
    pendingAttachments.forEach((attachment) => {
      URL.revokeObjectURL(attachment.previewUrl);
      objectUrlsRef.current.delete(attachment.previewUrl);
    });
    setPendingAttachments([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (documentInputRef.current) {
      documentInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const removePendingAttachment = (previewUrl: string) => {
    if (expandedImage === previewUrl) setExpandedImage(null);
    URL.revokeObjectURL(previewUrl);
    objectUrlsRef.current.delete(previewUrl);
    setPendingAttachments((current) => current.filter((attachment) => attachment.previewUrl !== previewUrl));
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    isDocument = false,
  ) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_ATTACHMENTS - pendingAttachments.length;
    if (files.length > remaining) toast.error(`Add up to ${MAX_ATTACHMENTS} files per message`);
    let totalBytes = pendingAttachments.reduce((sum, attachment) => sum + attachment.file.size, 0);
    const valid = files.slice(0, remaining).filter((file) => {
      const lower = file.name.toLowerCase();
      const isPdf = file.type === "application/pdf" || lower.endsWith(".pdf");
      const isImage = ["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        /\.(jpe?g|png|webp)$/i.test(lower);
      const isText = ["text/plain", "text/markdown", "text/csv"].includes(file.type) ||
        /\.(txt|md|csv)$/i.test(lower);

      if (!isPdf && !isImage && !isText) {
        toast.error("Please upload a PDF document, image (JPEG, PNG, WebP), or text file (.txt, .md)");
        return false;
      }
      if (isPdf && file.size > MAX_PDF_SIZE) {
        toast.error("PDF documents must be under 15MB");
        return false;
      }
      if (isImage && file.size > MAX_IMAGE_SIZE) {
        toast.error("Images must be under 10MB");
        return false;
      }
      if (isText && file.size > MAX_TEXT_SIZE) {
        toast.error("Text files must be under 5MB");
        return false;
      }
      if (totalBytes + file.size > MAX_TOTAL_ATTACHMENT_SIZE) {
        toast.error("Keep all attached files under 20MB total");
        return false;
      }
      totalBytes += file.size;
      return true;
    });
    const additions: PendingAttachment[] = valid.map((file) => {
      const lower = file.name.toLowerCase();
      const isDoc = isDocument || file.type === "application/pdf" || lower.endsWith(".pdf") ||
        lower.endsWith(".txt") || lower.endsWith(".md") || lower.endsWith(".csv");
      const previewUrl = URL.createObjectURL(file);
      objectUrlsRef.current.add(previewUrl);
      return { file, previewUrl, isDocument: isDoc };
    });
    setPendingAttachments((current) => [...current, ...additions]);
    setIsAttachMenuOpen(false);
    e.target.value = "";
  };

  useEffect(() => {
    if (!isAttachMenuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (attachMenuRef.current && !attachMenuRef.current.contains(target)) {
        setIsAttachMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAttachMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isAttachMenuOpen]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if ((!trimmed && !pendingAttachments.length) || isBusy || sendingRef.current) return;
    sendingRef.current = true;
    setIsSending(true);
    const attachmentsToSend = [...pendingAttachments];
    const hasDoc = attachmentsToSend.some((a) => a.isDocument);
    const displayContent = trimmed || (hasDoc ? "Attached document" : "Question image");

    const localAttachments: ChatMessageAttachment[] = attachmentsToSend.map((attachment) => ({
      type: attachment.isDocument ? "file" : "image",
      url: attachment.previewUrl,
      fileName: attachment.file.name,
      fileSize: attachment.file.size,
      mimeType: attachment.file.type,
    }));

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: displayContent,
      imageUrl: attachmentsToSend.find((a) => !a.isDocument)?.previewUrl,
      imageUrls: attachmentsToSend.filter((a) => !a.isDocument).map((attachment) => attachment.previewUrl),
      attachments: localAttachments,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    let uploadComplete = false;
    try {
      const uploads = await Promise.all(attachmentsToSend.map(async (attachment) => {
        const formData = new FormData();
        formData.append("file", attachment.file);
        return uploadImageMutation.mutateAsync(formData);
      }));
      const imageUrls = uploads.filter((u) => u.mimeType?.startsWith("image/")).map((upload) => upload.fileUrl);
      const serverAttachments: ChatMessageAttachment[] = uploads.map((u, i) => ({
        type: u.type || (u.mimeType?.startsWith("image/") ? "image" : "file"),
        url: u.fileUrl,
        fileName: u.fileName || attachmentsToSend[i]?.file.name,
        mimeType: u.mimeType,
        fileSize: u.fileSize || attachmentsToSend[i]?.file.size,
      }));

      uploadComplete = true;
      setMessages((prev) => prev.map((message) => message.id === userMsg.id
        ? {
          ...message,
          imageUrl: imageUrls[0],
          imageUrls,
          attachments: serverAttachments,
        }
        : message));

      if (imageUrls.length) {
        setLastSessionImageUrl(imageUrls[0]);
      }
      clearPendingAttachments();

      const history = messages.slice(-6).map((message) => ({
        role: message.role,
        content: message.content,
      }));

      // Use streaming endpoint for real-time word-by-word responses
      const assistantMsgId = crypto.randomUUID();
      let streamedContent = "";
      let streamMeta: { sessionId?: string; sources?: ChatSource[]; actions?: ChatAction[]; blocked?: boolean } = {};
      let streamStarted = false;

      const fallbackPrompt = hasDoc
        ? "Please help me understand and solve this document."
        : "Please help me understand these images.";

      const response = await fetch(`/api${API_ENDPOINTS.STUDENT.CHAT_STREAM}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed || (serverAttachments.length ? fallbackPrompt : ""),
          sessionId,
          imageUrls,
          attachments: serverAttachments,
          history,
        }),
      });

      if (!response.ok || !response.body) {
        // Fallback to non-streaming endpoint
        const data = await sendMessageMutation.mutateAsync({
          message: trimmed || (serverAttachments.length ? fallbackPrompt : ""),
          sessionId,
          imageUrls,
          attachments: serverAttachments,
          history,
        });
        setSessionId(data.sessionId);
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: "assistant",
            content: data.reply,
            sources: data.sources,
            actions: data.actions ?? [],
          },
        ]);
      } else {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr) as {
                type: string;
                text?: string;
                sessionId?: string;
                sources?: ChatSource[];
                actions?: ChatAction[];
                blocked?: boolean;
                message?: string;
              };

              if (event.type === "meta") {
                streamMeta = event;
                if (event.sessionId) setSessionId(event.sessionId);
              } else if (event.type === "delta" && event.text) {
                streamedContent += event.text;
                if (!streamStarted) {
                  streamStarted = true;
                  setIsStreaming(true);
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: assistantMsgId,
                      role: "assistant",
                      content: streamedContent,
                      sources: streamMeta.sources,
                      actions: streamMeta.actions ?? [],
                    },
                  ]);
                } else {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId
                        ? { ...msg, content: streamedContent }
                        : msg,
                    ),
                  );
                }
              } else if (event.type === "done") {
                setIsStreaming(false);
                sessionsQuery.refetch().catch(() => { });
                // Final update with all metadata
                if (streamStarted) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId
                        ? {
                          ...msg,
                          content: streamedContent,
                          sources: streamMeta.sources,
                          actions: streamMeta.actions ?? [],
                        }
                        : msg,
                    ),
                  );
                }
              } else if (event.type === "error") {
                setIsStreaming(false);
                if (!streamStarted) {
                  streamStarted = true; // Prevent the empty-stream fallback from adding a duplicate
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: assistantMsgId,
                      role: "assistant",
                      content: event.message || "Sorry, Nova couldn't answer that right now. Please try again in a moment.",
                    },
                  ]);
                } else {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId
                        ? {
                          ...msg,
                          content: `${msg.content}\n\n*(Error: ${event.message || "Connection interrupted"}*)`,
                        }
                        : msg,
                    ),
                  );
                }
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }

        // Handle case where stream ended without any delta events
        if (!streamStarted && !streamedContent) {
          setMessages((prev) => [
            ...prev,
            {
              id: assistantMsgId,
              role: "assistant",
              content: "Sorry, Nova couldn't respond. Please try again.",
            },
          ]);
        }
      }
    } catch (error: unknown) {
      if (!uploadComplete) {
        setMessages((prev) => prev.filter((message) => message.id !== userMsg.id));
        setInput(trimmed);
        toast.error(error instanceof Error ? error.message : "Failed to upload image");
      } else {
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: getNovaChatErrorMessage(error),
        }]);
      }
    } finally {
      sendingRef.current = false;
      setIsSending(false);
      setIsStreaming(false);
    }
  };

  const handleToggleChapterIndex = (msgId: string, idx: number) => {
    setSelectedChaptersByMsg((prev) => {
      const current = prev[msgId] ?? [];
      const next = current.includes(idx)
        ? current.filter((i) => i !== idx)
        : [...current, idx].sort((a, b) => a - b);
      return { ...prev, [msgId]: next };
    });
  };

  const handleSelectAllChapters = (msgId: string, totalCount: number) => {
    setSelectedChaptersByMsg((prev) => ({
      ...prev,
      [msgId]: Array.from({ length: totalCount }, (_, i) => i),
    }));
  };

  const handleClearChapters = (msgId: string) => {
    setSelectedChaptersByMsg((prev) => ({
      ...prev,
      [msgId]: [],
    }));
  };

  const handleChapterSubmit = (chips: ChatChapterChip[], selectedIndices: number[]) => {
    if (selectedIndices.length === 0 || isBusy || isLoadingMessages) return;
    const selectedChips = selectedIndices.map((i) => chips[i]);
    const baseMsg = selectedChips[0]?.message || "";
    const chapterNums = selectedChips
      .map((c) =>
        c.chapterNumber ??
        (c.label.match(/^Ch\s*(\d+):/i)?.[1]
          ? parseInt(c.label.match(/^Ch\s*(\d+):/i)![1], 10)
          : null),
      )
      .filter((n): n is number => n !== null);

    let finalMsg = "";
    if (chapterNums.length === selectedChips.length && chapterNums.length > 0) {
      const chapterPhrase =
        chapterNums.length === 1
          ? `chapter ${chapterNums[0]}`
          : `chapters ${chapterNums.join(", ")}`;
      finalMsg = baseMsg.replace(/\bchapter\s+[^,0-9]*\d+.*$/i, chapterPhrase);
      if (finalMsg === baseMsg) {
        finalMsg = baseMsg.replace(/\bchapter\b.*$/i, chapterPhrase);
      }
    } else {
      const names = selectedChips
        .map((c) => c.chapterName ?? c.label.replace(/^Ch\s*\d+:\s*/i, ""))
        .join(", ");
      finalMsg = baseMsg.replace(/\bchapter\b.*$/i, `chapters ${names}`);
    }
    void sendMessage(finalMsg || baseMsg);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textareaRef.current) {
      textareaRef.current.style.height = "42px";
    }
    void sendMessage(input);
  };

  const launchPracticePaper = async (action: ChatAction) => {
    if (!isChatPaperAction(action)) return;

    const useSlos = action.useSlos !== false;

    // Teachers: generate + preview/publish overlay — stay on Nova chat
    if (isTeacher && userId) {
      if (teacherDraftMatchesAction(teacherDraft, action)) {
        setDraftModalOpen(true);
        return;
      }
      await launchTeacherPracticeTest(action, useSlos);
      return;
    }

    await launchGeneratedPaper({
      paperType: action.paperType,
      subject: action.subject,
      classLevel: action.classLevel,
      board: action.board,
      chapterIds: action.chapterIds,
      questionCount: action.questionCount,
      useSlos,
    });
  };

  const launchPaperFromImage = async (action: ChatAction) => {
    if (!isChatImagePaperAction(action) || launchingPaper) return;

    const imageUrl = action.imageUrl || lastSessionImageUrl;
    if (!imageUrl) {
      toast.error("Upload an image first, then ask Nova to generate a paper from it.");
      return;
    }

    if (
      isTeacher &&
      teacherDraft?.fromImage &&
      teacherDraft.paperType === String(action.paperType) &&
      teacherDraft.questions.length > 0
    ) {
      setDraftModalOpen(true);
      return;
    }

    setLaunchingPaper(action.paperType);
    const toastId = toast.loading(
      isTeacher
        ? `Building Practice Test from image… this can take up to a minute`
        : action.paperType === 1
          ? `Building quiz from image… saving to My Quizzes`
          : `Building Paper 2 from image… this can take up to a minute`,
    );

    try {
      const data = await generateFromImageMutation.mutateAsync({
        imageUrl,
        paperType: action.paperType,
        questionCount: action.questionCount,
        difficulty: action.difficulty,
        userPrompt: action.userPrompt,
      });

      if (data.mode === "teacher_draft") {
        setTeacherDraft({
          classroomId: "",
          generatedPaperId: data.generatedPaperId,
          paperType: data.paperType as "1" | "2",
          subject: data.subject,
          classLevel: data.classLevel,
          board: data.board,
          chapterIds: data.chapterIds ?? [],
          title: data.title,
          questions: data.questions as GeneratedSloPaperQuestion[],
          fromImage: true,
        });
        setDraftModalOpen(true);
        toast.success(
          `Draft ready · ${data.totalQuestions} questions — pick a classroom, then publish`,
          { id: toastId },
        );
        return;
      }

      if (data.mode === "custom_quiz") {
        toast.success(`Saved to My Quizzes · ${data.totalQuestions} questions`, {
          id: toastId,
        });
        router.push(FRONTEND_ROUTES.STUDENT_CUSTOM_QUIZZES);
        return;
      }

      if (!data.generatedPaperId || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("Paper was generated but had no questions. Please try again.");
      }

      const activeExamKey = `exboard_active_exam_${userId}`;
      const timeLeft = examDurationFromQuestions(
        data.questions as Array<{ questionType?: string | null }>,
        {
          paperType: data.paperType,
        },
      );
      localStorage.setItem(
        activeExamKey,
        JSON.stringify({
          generatedPaper: data,
          paperType: String(data.paperType),
          subject: data.subject,
          userClass: data.classLevel,
          userBoard: data.board,
          mcqAnswers: {},
          uploads: {},
          timeLeft,
          currentQuestionIndex: 0,
          autoResume: true,
        }),
      );
      toast.success("Paper ready — opening exam…", { id: toastId });
      router.push(`${FRONTEND_ROUTES.STUDENT_GENERATE}?autoResume=1`);
    } catch (error: unknown) {
      const message =
        error &&
          typeof error === "object" &&
          "message" in error &&
          typeof (error as { message: unknown }).message === "string"
          ? (error as { message: string }).message
          : error instanceof Error
            ? error.message
            : "Failed to generate from image";
      toast.error(message, { id: toastId });
    } finally {
      setLaunchingPaper(null);
    }
  };

  const teacherDraftMatchesAction = (
    draft: TeacherDraftState | null,
    action: Extract<ChatAction, { type: "generate_paper" }>,
  ) => {
    if (!draft) return false;
    if (draft.paperType !== String(action.paperType)) return false;
    if (draft.subject !== action.subject) return false;
    if (draft.classLevel !== action.classLevel) return false;
    const draftChapters = [...draft.chapterIds].sort().join(",");
    const actionChapters = [...action.chapterIds].sort().join(",");
    return draftChapters === actionChapters;
  };

  const teacherPaperButtonLabel = (
    action: Extract<ChatAction, { type: "generate_paper" }>,
  ) => {
    if (teacherDraftMatchesAction(teacherDraft, action)) {
      return "View paper";
    }
    return `Generate Practice Test · Paper ${action.paperType}`;
  };

  const launchTeacherPracticeTest = async (
    action: Extract<ChatAction, { type: "generate_paper" }>,
    useSlos: boolean,
  ) => {
    if (!userId || launchingPaper) return;

    setLaunchingPaper(action.paperType);
    const isSindh =
      (action.board || "")
        .toLowerCase()
        .includes("sindh") ||
      (action.board || "")
        .toLowerCase()
        .includes("karachi");
    const sloTerm = isSindh ? "Syllabus" : "SLOs";
    const toastId = toast.loading(
      useSlos
        ? `Building Practice Test from ${sloTerm}… this can take up to a minute`
        : `Building Practice Test from Past Papers…`,
    );

    try {
      const classroomId = teacherClassroomId(
        userId,
        action.subject,
        action.classLevel,
      );

      let questions: GeneratedSloPaperQuestion[] = [];
      let generatedPaperId = "";
      let suggestedTitle = `Practice Test · ${action.subject} Class ${action.classLevel} · Paper ${action.paperType}`;

      if (useSlos) {
        const res = await apiPost<{
          generatedPaperId: string;
          questions: GeneratedSloPaperQuestion[];
          suggestedTitle?: string;
        }>(API_ENDPOINTS.TEACHER.PAPERS, {
          action: "generate",
          classroomId,
          paperType: String(action.paperType),
          subject: action.subject,
          classLevel: action.classLevel,
          board: action.board,
          chapterIds: action.chapterIds,
          questionCount: action.questionCount,
          title: suggestedTitle,
        });
        if (!res.success) {
          throw new Error(res.message || "Failed to generate Practice Test");
        }
        questions = res.data.questions ?? [];
        generatedPaperId = res.data.generatedPaperId;
        if (res.data.suggestedTitle) suggestedTitle = res.data.suggestedTitle;
      } else {
        const data = await generatePaperMutation.mutateAsync({
          userId,
          subject: action.subject,
          classLevel: action.classLevel,
          board: action.board,
          paperType: String(action.paperType),
          chapterIds: action.chapterIds,
          useSlos: false,
        });
        if (!data?.generatedPaperId || !Array.isArray(data.questions) || data.questions.length === 0) {
          throw new Error("Paper was generated but had no questions. Please try again.");
        }
        generatedPaperId = data.generatedPaperId;
        questions = data.questions as GeneratedSloPaperQuestion[];
      }

      if (questions.length === 0) {
        throw new Error("Paper was generated but had no questions. Please try again.");
      }

      setTeacherDraft({
        // Classroom chosen at publish time (school vs private)
        classroomId: "",
        generatedPaperId,
        paperType: String(action.paperType) as "1" | "2",
        subject: action.subject,
        classLevel: action.classLevel,
        board: action.board,
        chapterIds: action.chapterIds,
        title: suggestedTitle,
        questions,
      });
      setDraftModalOpen(true);
      toast.success(
        `Draft ready · ${questions.length} questions — pick a classroom, then publish`,
        { id: toastId },
      );
    } catch (error: unknown) {
      const message =
        error &&
          typeof error === "object" &&
          "message" in error &&
          typeof (error as { message: unknown }).message === "string"
          ? (error as { message: string }).message
          : error instanceof Error
            ? error.message
            : "Failed to generate Practice Test";
      toast.error(message, { id: toastId });
    } finally {
      setLaunchingPaper(null);
    }
  };

  const publishTeacherDraft = async () => {
    if (!teacherDraft) return;
    if (!teacherDraft.classroomId) {
      toast.error("Select a classroom to publish to");
      return;
    }
    if (!teacherDraft.title.trim()) {
      toast.error("Add a Practice Test title");
      return;
    }
    if (teacherDraft.questions.length === 0) {
      toast.error("Add at least one question before publishing");
      return;
    }

    setPublishingDraft(true);
    try {
      const res = await apiPost(API_ENDPOINTS.TEACHER.PAPERS, {
        action: "publish",
        classroomId: teacherDraft.classroomId,
        generatedPaperId: teacherDraft.generatedPaperId,
        title: teacherDraft.title.trim(),
        description: "Practice Test assigned by your teacher",
        paperType: teacherDraft.paperType,
        subject: teacherDraft.subject,
        classLevel: teacherDraft.classLevel,
        board: teacherDraft.board,
        chapterIds: teacherDraft.chapterIds,
        questions: teacherDraft.questions,
      });
      if (!res.success) {
        toast.error(res.message || "Failed to publish");
        return;
      }
      toast.success("Practice Test published to classroom");
      setTeacherDraft(null);
      setDraftModalOpen(false);
    } catch (error: unknown) {
      toast.error(
        error &&
          typeof error === "object" &&
          "message" in error &&
          typeof (error as { message: unknown }).message === "string"
          ? (error as { message: string }).message
          : "Failed to publish",
      );
    } finally {
      setPublishingDraft(false);
    }
  };

  const launchGeneratedPaper = async (params: {
    paperType: 1 | 2;
    subject: string;
    classLevel: string;
    board: string;
    chapterIds: string[];
    questionCount?: number;
    useSlos?: boolean;
  }) => {
    if (!userId || launchingPaper) return;

    const useSlos = params.useSlos !== false;
    setLaunchingPaper(params.paperType);
    const isSindh =
      (params.board || "")
        .toLowerCase()
        .includes("sindh") ||
      (params.board || "")
        .toLowerCase()
        .includes("karachi");
    const sloTerm = isSindh ? "Syllabus" : "SLOs";
    const toastId = toast.loading(
      useSlos
        ? `Building Paper ${params.paperType} from ${sloTerm}… this can take up to a minute`
        : `Building Paper ${params.paperType} from Past Papers…`,
    );
    try {
      const data = await generatePaperMutation.mutateAsync({
        userId,
        subject: params.subject,
        classLevel: params.classLevel,
        board: params.board,
        paperType: String(params.paperType),
        chapterIds: params.chapterIds,
        questionCount: useSlos ? params.questionCount : undefined,
        useSlos,
      });

      if (!data?.generatedPaperId || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("Paper was generated but had no questions. Please try again.");
      }

      const activeExamKey = `exboard_active_exam_${userId}`;
      const timeLeft = examDurationFromQuestions(
        data.questions as Array<{ questionType?: string | null }>,
        {
          paperType: params.paperType,
        },
      );
      localStorage.setItem(
        activeExamKey,
        JSON.stringify({
          generatedPaper: data,
          paperType: String(params.paperType),
          subject: params.subject,
          userClass: params.classLevel,
          userBoard: params.board,
          mcqAnswers: {},
          uploads: {},
          timeLeft,
          currentQuestionIndex: 0,
          autoResume: true,
        }),
      );

      toast.success("Paper ready — opening exam…", { id: toastId });
      router.push(`${FRONTEND_ROUTES.STUDENT_GENERATE}?autoResume=1`);
    } catch (error: unknown) {
      const message =
        error &&
          typeof error === "object" &&
          "message" in error &&
          typeof (error as { message: unknown }).message === "string"
          ? (error as { message: string }).message
          : error instanceof Error
            ? error.message
            : "Failed to start practice paper";
      toast.error(message, { id: toastId });
    } finally {
      setLaunchingPaper(null);
    }
  };

  if (!isReady) {
    return (
      <div
        className={cn(
          "flex h-full min-h-0 overflow-hidden bg-background sm:rounded-2xl sm:shadow-lg",
          className,
        )}
      >
        <AppLoader className="min-h-0 h-full" />
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "flex h-full min-h-0 overflow-hidden border border-border/60 bg-background sm:rounded-3xl sm:shadow-[0_20px_65px_-40px_rgba(0,0,0,.4)]",
          className,
        )}
      >
        <NovaChatSessionsPanel
          sessions={sessions}
          activeSessionId={sessionId}
          isLoading={isLoadingSessions}
          isOpen={isHistoryOpen}
          deletingSessionId={
            deleteSessionMutation.isPending ? sessionToDelete?.id : undefined
          }
          onClose={() => setIsHistoryOpen(false)}
          onNewChat={handleNewChat}
          onSelectSession={loadSession}
          onDeleteSession={handleDeleteSessionRequest}
        />

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          {isEmpty ? (
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-x-0 z-0 flex items-end justify-end pr-1 sm:pr-3 lg:pr-6",
                "bottom-[calc(8.25rem+env(safe-area-inset-bottom,0px))] lg:bottom-20"
              )}
            >
              <div className="relative h-56 w-36 min-[360px]:h-64 min-[360px]:w-44 xs:h-72 xs:w-52 sm:h-80 sm:w-60 md:h-88 md:w-64 lg:h-[min(30rem,55vh)] lg:w-[min(20rem,32%)]">
                <Image
                  src="/nova-tutor-chat.webp"
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 640px) 208px, (max-width: 1024px) 256px, 320px"
                  className="bg-transparent object-contain object-bottom"
                />
              </div>
            </div>
          ) : null}

          <div className="relative z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-primary/10 bg-gradient-to-r from-primary/[.09] via-background to-background px-4 sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <div className="relative size-8 shrink-0 overflow-hidden rounded-full border border-primary/20 sm:size-9">
                <Image
                  src="/nova-avatar.webp"
                  alt="Nova"
                  fill
                  sizes="36px"
                  className="object-cover object-top"
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-primary dark:text-white">Nova</p>
                <p className="truncate text-xs text-muted-foreground">
                  {isTeacher
                    ? `Teaching assistant · Helping ${studentName}`
                    : `AI Tutor · Chatting with ${studentName}`}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <NovaChatHistoryButton onClick={() => setIsHistoryOpen(true)} />
              <button
                type="button"
                onClick={handleNewChat}
                disabled={isBusy || isLoadingMessages}
                aria-label="New chat"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 p-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 disabled:opacity-50 dark:bg-muted dark:text-white sm:px-3 md:hidden"
              >
                <AddSVG className="size-3.5" />
                <span className="hidden min-[420px]:inline">New chat</span>
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className={cn(
              "relative z-10 min-h-0 flex-1 overflow-y-auto px-3 pt-1.5 pb-3 sm:px-4 sm:py-4 md:p-6",
              {
                "flex flex-col": isEmpty && !isLoadingMessages,
              },
            )}
          >
            {isLoadingMessages ? (
              <NovaChatMessagesSkeleton />
            ) : isEmpty ? (
              <NovaStartPanel
                studentName={studentName}
                isTeacher={isTeacher}
                onSelectQuestion={(question) => void sendMessage(question)}
                disabled={isBusy || isLoadingMessages}
              />
            ) : (
              messages.map((msg, msgIndex) => (
              <div
                key={msg.id}
                ref={msg.role === "assistant" && msg.id === messages.at(-1)?.id ? latestAssistantRef : undefined}
                className={cn("nova-message-enter mb-5 flex min-w-0 max-w-full items-start gap-2.5 sm:gap-3", {
                  "flex-row-reverse": msg.role === "user",
                })}
              >
                {msg.role === "user" ? (
                  userImage ? (
                    <div className="relative size-8 shrink-0 overflow-hidden rounded-full">
                      <Image
                        src={userImage}
                        alt={studentName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {studentName.charAt(0).toUpperCase()}
                    </div>
                  )
                ) : null}
                <div
                  className={cn("min-w-0 max-w-[88%] break-words rounded-2xl px-3 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[85%] sm:px-4 sm:py-3", {
                    "rounded-tr-md bg-primary text-primary-foreground": msg.role === "user",
                    "rounded-tl-md border border-border/70 bg-card text-foreground": msg.role === "assistant",
                  })}
                >
                  {msg.role === "assistant" ? (
                    <div className="space-y-2">
                      <NovaMarkdown content={msg.content} />
                      <div className="flex items-center justify-end pt-1 border-t border-border/40">
                        <NovaQABugButton
                          sessionId={sessionId}
                          messageId={msg.id}
                          userPrompt={msgIndex > 0 && messages[msgIndex - 1]?.role === "user" ? messages[msgIndex - 1]?.content : undefined}
                          assistantResponse={msg.content}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(msg.imageUrls?.length || msg.imageUrl) ? (
                        <div className="flex max-w-xs flex-wrap gap-1.5">
                          {(msg.imageUrls?.length ? msg.imageUrls : [msg.imageUrl!]).map((url) => (
                            <button key={url} type="button" onClick={() => setExpandedImage(url)} aria-label="Expand attached image" className="relative size-16 overflow-hidden rounded-lg border border-primary-foreground/20 bg-background/20 transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:size-20">
                              <Image src={url} alt="Attached question" fill unoptimized={url.startsWith("blob:")} sizes="80px" className="object-cover" />
                            </button>
                          ))}
                        </div>
                      ) : null}

                      {msg.attachments?.filter((a) => a.type === "file" || a.mimeType === "application/pdf" || a.fileName?.toLowerCase().endsWith(".pdf") || a.fileName?.toLowerCase().endsWith(".txt") || a.fileName?.toLowerCase().endsWith(".md")).map((doc) => (
                        <a
                          key={doc.url}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex max-w-xs items-center gap-2.5 rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-2 text-primary-foreground transition hover:bg-primary-foreground/20"
                        >
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/20">
                            <QuestionBankSVG className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold">
                              {doc.fileName || "Attached Document"}
                            </p>
                            {doc.fileSize ? (
                              <p className="text-[10px] opacity-75">
                                {(doc.fileSize / 1024 / 1024).toFixed(1)} MB
                              </p>
                            ) : null}
                          </div>
                          <ExternalLink className="size-3.5 shrink-0 opacity-70" />
                        </a>
                      ))}

                      {msg.content && msg.content !== "Question image" && msg.content !== "Attached document" ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : null}
                    </div>
                  )}
                  {msg.actions && msg.actions.length > 0 ? (() => {
                    const chapterChips = msg.actions.filter((a): a is ChatChapterChip => a.type === "chapter_chip");
                    const otherActions = msg.actions.filter((a) => a.type !== "chapter_chip");
                    const selectedIndices = selectedChaptersByMsg[msg.id] ?? [];

                    return (
                      <div className="mt-3 flex w-full min-w-0 max-w-full flex-col gap-3 border-t border-border/50 pt-3">
                        {chapterChips.length > 0 ? (
                          <div className="flex w-full flex-col gap-2.5 rounded-2xl border border-border/60 bg-muted/20 p-2.5 sm:p-3.5">
                            <div className="flex w-full items-center justify-between gap-2 pb-0.5 text-xs">
                              <div className="flex items-center gap-1.5 font-bold text-foreground">
                                <span className="inline-flex size-2 rounded-full bg-primary" />
                                <span>
                                  Select Units ({selectedIndices.length} of {chapterChips.length} selected)
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSelectAllChapters(msg.id, chapterChips.length)}
                                  disabled={isBusy || isLoadingMessages}
                                  className="text-[11px] font-bold text-primary transition-opacity hover:underline disabled:opacity-50 dark:text-primary-foreground"
                                >
                                  Select All
                                </button>
                                <span className="text-muted-foreground/40">·</span>
                                <button
                                  type="button"
                                  onClick={() => handleClearChapters(msg.id)}
                                  disabled={isBusy || isLoadingMessages || selectedIndices.length === 0}
                                  className="text-[11px] font-bold text-muted-foreground transition-opacity hover:text-foreground disabled:opacity-40"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>

                            <div className="flex max-h-[380px] w-full flex-col gap-2 overflow-y-auto pr-1">
                              {chapterChips.map((chip, idx) => {
                                const isSelected = selectedIndices.includes(idx);
                                const chNum =
                                  chip.chapterNumber ??
                                  (chip.label.match(/^Ch\s*(\d+):/i)?.[1]
                                    ? parseInt(chip.label.match(/^Ch\s*(\d+):/i)![1], 10)
                                    : idx + 1);
                                const cleanName =
                                  chip.chapterName ??
                                  chip.label.replace(/^Ch\s*\d+:\s*/i, "");

                                return (
                                  <button
                                    key={`${chip.label}-${idx}`}
                                    type="button"
                                    disabled={isBusy || isLoadingMessages}
                                    onClick={() => handleToggleChapterIndex(msg.id, idx)}
                                    className={cn(
                                      "group relative flex w-full items-center justify-between gap-3 rounded-xl border p-2.5 sm:p-3 text-left transition-all",
                                      isSelected
                                        ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30 dark:bg-primary/20"
                                        : "border-border/70 bg-card/60 hover:border-primary/40 hover:bg-muted/40",
                                      (isBusy || isLoadingMessages) && "cursor-not-allowed opacity-50",
                                    )}
                                  >
                                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                      <span
                                        className={cn(
                                          "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-black transition-colors",
                                          isSelected
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                                        )}
                                      >
                                        {chNum}
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        <p
                                          className={cn(
                                            "text-xs sm:text-sm font-semibold leading-snug break-words",
                                            isSelected
                                              ? "text-primary dark:text-white"
                                              : "text-foreground",
                                          )}
                                        >
                                          {cleanName}
                                        </p>
                                        <p className="text-[10px] font-medium text-muted-foreground">
                                          Unit {chNum}
                                        </p>
                                      </div>
                                    </div>

                                    <div
                                      className={cn(
                                        "flex size-5 shrink-0 items-center justify-center rounded-md border transition-all",
                                        isSelected
                                          ? "border-primary bg-primary text-primary-foreground"
                                          : "border-border/80 bg-background/60 group-hover:border-primary/50",
                                      )}
                                    >
                                      {isSelected ? <CheckSVG className="size-3.5" /> : null}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            <div className="pt-1.5">
                              <AppButton
                                type="button"
                                disabled={isBusy || isLoadingMessages || selectedIndices.length === 0}
                                onClick={() => handleChapterSubmit(chapterChips, selectedIndices)}
                                className="h-10 w-full justify-center gap-2 rounded-xl text-xs font-bold shadow-md"
                              >
                                {selectedIndices.length === 0
                                  ? "Select at least 1 chapter"
                                  : selectedIndices.length === 1
                                    ? "Continue with 1 Chapter"
                                    : `Continue with ${selectedIndices.length} Chapters`}
                                <ArrowRightSVG className="size-3.5" />
                              </AppButton>
                            </div>
                          </div>
                        ) : null}

                        {otherActions.length > 0 ? (
                          <div className="flex w-full min-w-0 max-w-full flex-wrap gap-2">
                            {otherActions.map((action) =>
                              action.type === "subject_chip" ||
                                action.type === "class_chip" ||
                                action.type === "paper_type_chip" ||
                                action.type === "paper_source_chip" ||
                                action.type === "question_count_chip" ||
                                action.type === "practice_mode_chip" ||
                                action.type === "challenge_type_chip" ||
                                action.type === "difficulty_chip" ? (
                                <button
                                  key={`${action.type}-${action.label}`}
                                  type="button"
                                  disabled={isBusy || isLoadingMessages}
                                  onClick={() => void sendMessage(action.message)}
                                  className="max-w-full whitespace-normal break-words rounded-full bg-primary px-3 py-1.5 text-left text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                                >
                                  {action.label}
                                </button>
                              ) : action.type === "navigate" ? (
                                <AppButton
                                  key={`${action.type}-${action.href}`}
                                  type="button"
                                  className="h-auto min-h-9 max-w-full whitespace-normal break-words rounded-lg px-3.5 py-2 text-left text-xs font-medium leading-snug"
                                  onClick={() => router.push(action.href)}
                                >
                                  <span className="min-w-0 break-words">{action.label}</span>
                                </AppButton>
                              ) : isChatPaperAction(action) ? (
                                <AppButton
                                  key={`${action.paperType}-${action.chapterIds.join("-")}`}
                                  type="button"
                                  variant="outline"
                                  className="h-auto min-h-9 max-w-full whitespace-normal break-words rounded-lg px-3.5 py-2 text-left text-xs font-medium leading-snug justify-start gap-2 sm:w-auto"
                                  disabled={launchingPaper !== null}
                                  onClick={() => void launchPracticePaper(action)}
                                >
                                  {launchingPaper === action.paperType ? (
                                    <Loader2 className="size-3.5 shrink-0 animate-spin" />
                                  ) : (
                                    <FileText className="size-3.5 shrink-0 opacity-80" />
                                  )}
                                  <span className="min-w-0 flex-1 break-words">
                                    {isTeacher
                                      ? teacherPaperButtonLabel(action)
                                      : action.label}
                                  </span>
                                </AppButton>
                              ) : isChatImagePaperAction(action) ? (
                                <AppButton
                                  key={`image-paper-${action.paperType}-${action.questionCount ?? "all"}-${action.difficulty ?? "all"}`}
                                  type="button"
                                  variant="outline"
                                  className="h-auto min-h-9 max-w-full whitespace-normal break-words rounded-lg px-3.5 py-2 text-left text-xs font-medium leading-snug justify-start gap-2 sm:w-auto"
                                  disabled={launchingPaper !== null}
                                  onClick={() => void launchPaperFromImage(action)}
                                >
                                  {launchingPaper === action.paperType ? (
                                    <Loader2 className="size-3.5 shrink-0 animate-spin" />
                                  ) : (
                                    <FileText className="size-3.5 shrink-0 opacity-80" />
                                  )}
                                  <span className="min-w-0 flex-1 break-words">
                                    {isTeacher &&
                                      teacherDraft?.fromImage &&
                                      teacherDraft.paperType === String(action.paperType) &&
                                      teacherDraft.questions.length > 0
                                      ? "View paper"
                                      : action.label}
                                  </span>
                                </AppButton>
                              ) : null,
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })() : null}
                  {msg.sources && msg.sources.length > 0 ? (
                    <div className="mt-3 min-w-0 max-w-full space-y-1 border-t border-border/50 pt-2">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        Sources
                      </p>
                      {msg.sources.slice(0, 3).map((source) => (
                        <div
                          key={source.chunkId}
                          className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground"
                        >
                          {source.sourceType.includes("syllabus") ? (
                            <BookOpen className="size-3 shrink-0" />
                          ) : (
                            <FileText className="size-3 shrink-0" />
                          )}
                          <span className="min-w-0 truncate">{source.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              ))
            )}

            {isBusy && !isStreaming ? (
              <div className="nova-message-enter mb-4 flex min-w-0 max-w-full items-start gap-3">
                <div className="min-w-0 max-w-[88%] rounded-2xl rounded-tl-md border border-primary/10 bg-primary/5 px-4 py-2.5 shadow-sm sm:max-w-[85%]">
                  <NovaChatLoader label={isUploadingImage ? "Uploading file..." : "Nova is thinking"} />
                </div>
              </div>
            ) : null}
          </div>

          <form
            onSubmit={handleSubmit}
            className={cn(
              "relative z-20 mt-auto shrink-0 border-t border-border/60 bg-background/95 backdrop-blur-md",
              "px-2.5 pt-2 sm:px-3 sm:pt-2.5 md:px-4 md:pt-3",
              "pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-3"
            )}
          >
            {pendingAttachments.length ? (
              <div className="mb-2 flex flex-wrap gap-2" aria-label="Attached files">
                {pendingAttachments.map((attachment) => (
                  attachment.isDocument ? (
                    <div
                      key={attachment.previewUrl}
                      className="nova-message-enter relative flex items-center gap-2 rounded-xl border border-border/70 bg-card/90 px-3 py-2 shadow-xs sm:max-w-xs"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                        <QuestionBankSVG className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {attachment.file.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {(attachment.file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePendingAttachment(attachment.previewUrl)}
                        disabled={isBusy}
                        aria-label={`Remove ${attachment.file.name}`}
                        className="ml-1 grid size-5 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground transition hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <div key={attachment.previewUrl} className="nova-message-enter relative size-16 rounded-xl border border-border/70 bg-muted/30 p-1 shadow-sm sm:size-18">
                      <button type="button" onClick={() => setExpandedImage(attachment.previewUrl)} aria-label="Expand attached image" className="relative block size-full overflow-hidden rounded-lg">
                        <Image src={attachment.previewUrl} alt="Attached image" fill unoptimized className="object-cover" />
                      </button>
                      <button type="button" onClick={() => removePendingAttachment(attachment.previewUrl)} disabled={isBusy} aria-label="Remove image" className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-foreground text-background shadow-md transition hover:scale-110 disabled:opacity-50">
                        <X className="size-3" />
                      </button>
                    </div>
                  )
                ))}
              </div>
            ) : null}

            <input
              ref={documentInputRef}
              type="file"
              accept="application/pdf,.pdf,text/plain,.txt,.md,.csv"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e, true)}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e, false)}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileSelect(e, false)}
            />

            <div className="flex items-end gap-1.5 sm:gap-2 rounded-2xl sm:rounded-3xl border border-border/80 bg-muted/40 dark:bg-muted/30 p-1.5 sm:p-2 shadow-xs transition-all duration-200 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15 focus-within:bg-background dark:focus-within:bg-card">
              <div ref={attachMenuRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAttachMenuOpen((open) => !open)}
                  disabled={isBusy || isLoadingMessages}
                  aria-label="Attach file or photo"
                  aria-expanded={isAttachMenuOpen}
                  className="flex size-10 sm:size-11 items-center justify-center rounded-xl text-primary transition-colors hover:bg-primary/10 disabled:opacity-50 dark:bg-muted dark:text-foreground"
                >
                  {isUploadingImage ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Paperclip className="size-5" />
                  )}
                </button>

                {isAttachMenuOpen ? (
                  <div className="absolute bottom-full left-0 z-30 mb-2 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAttachMenuOpen(false);
                        documentInputRef.current?.click();
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <QuestionBankSVG className="size-4 text-primary dark:text-foreground" />
                      Documents
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAttachMenuOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <GallerySVG className="size-4 text-primary dark:text-foreground" />
                      Photo & image
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAttachMenuOpen(false);
                        cameraInputRef.current?.click();
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <CameraSVG className="size-4 text-primary dark:text-foreground" />
                      Take photo
                    </button>
                  </div>
                ) : null}
              </div>
              <textarea
                ref={textareaRef}
                value={input}
                rows={1}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (canSend && !isBusy && !isLoadingMessages) {
                      const form = e.currentTarget.closest("form");
                      form?.requestSubmit();
                    }
                  }
                }}
                placeholder="Ask Nova anything..."
                className="max-h-40 min-h-[42px] min-w-0 flex-1 resize-none bg-transparent py-2.5 px-2 text-base sm:text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground custom-scrollbar"
                disabled={isBusy || isLoadingMessages}
                maxLength={2000}
              />
              <AppButton
                type="submit"
                disabled={isBusy || isLoadingMessages || !canSend}
                className={cn(
                  "size-10 sm:size-11 shrink-0 rounded-xl transition-all duration-200",
                  canSend ? "text-primary-foreground shadow-sm" : "opacity-40"
                )}
              >
                <SendSVG className="size-4" />
              </AppButton>
            </div>
            <p className="mt-1.5 pb-2.5 sm:pb-0 text-center text-[9px] min-[360px]:text-[10px] sm:text-[11px] tracking-tight sm:tracking-normal text-muted-foreground/80 sm:mt-2 select-none whitespace-nowrap truncate">
              Nova can make mistakes. Consider checking important information.
            </p>
          </form>
        </div>
      </div>

      {expandedImage && portalReady
        ? createPortal(
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Image preview" onClick={() => setExpandedImage(null)}>
            <button type="button" onClick={() => setExpandedImage(null)} aria-label="Close image preview" className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white">
              <X className="size-5" />
            </button>
            <div className="relative h-[min(84dvh,900px)] w-[min(92vw,1100px)]" onClick={(event) => event.stopPropagation()}>
              <Image src={expandedImage} alt="Expanded attached image" fill unoptimized className="object-contain" />
            </div>
          </div>,
          document.body,
        )
        : null}

      {teacherDraft && draftModalOpen && portalReady
        ? createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/50 p-3 backdrop-blur-sm sm:p-6">
            <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-[2rem]">
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/40 px-4 py-4 sm:px-5">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Practice Test draft
                  </p>
                  <p className="break-words text-base font-bold">
                    Paper {teacherDraft.paperType} · {teacherDraft.subject}{" "}
                    Class {teacherDraft.classLevel}
                  </p>
                  <p className="break-words text-xs text-muted-foreground">
                    Review answers, edit if needed, then publish — you stay in
                    Nova
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDraftModalOpen(false)}
                  className="rounded-lg p-2 hover:bg-muted"
                  aria-label="Close draft"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Title
                  </label>
                  <AppInput
                    value={teacherDraft.title}
                    onChange={(e) =>
                      setTeacherDraft((prev) =>
                        prev ? { ...prev, title: e.target.value } : prev,
                      )
                    }
                    className="h-11 rounded-xl"
                  />
                </div>
                <TeacherPublishClassroomPicker
                  subject={teacherDraft.subject}
                  classLevel={teacherDraft.classLevel}
                  value={teacherDraft.classroomId}
                  allowAnyClassroom={Boolean(teacherDraft.fromImage)}
                  onChange={(classroomId, classroom?: TeacherClassroomOption) =>
                    setTeacherDraft((prev) =>
                      prev
                        ? {
                          ...prev,
                          classroomId,
                          subject: classroom?.subject ?? prev.subject,
                          classLevel: classroom?.classLevel ?? prev.classLevel,
                        }
                        : prev,
                    )
                  }
                />
                <TeacherPaperPreviewEditor
                  paperType={teacherDraft.paperType}
                  questions={teacherDraft.questions}
                  onChange={(questions) =>
                    setTeacherDraft((prev) =>
                      prev ? { ...prev, questions } : prev,
                    )
                  }
                />
              </div>

              <div className="flex shrink-0 flex-col gap-2.5 border-t border-border/40 p-4 sm:flex-row sm:gap-3 sm:p-5">
                <AppButton
                  type="button"
                  variant="outline"
                  className="h-11 w-full rounded-xl sm:flex-1"
                  onClick={() => setDraftModalOpen(false)}
                >
                  Keep chatting
                </AppButton>
                <AppButton
                  type="button"
                  className="h-11 w-full rounded-xl font-bold sm:flex-1"
                  disabled={publishingDraft || !teacherDraft.classroomId}
                  onClick={() => void publishTeacherDraft()}
                >
                  {publishingDraft ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Publish to classroom
                </AppButton>
              </div>
            </div>
          </div>,
          document.body,
        )
        : null}

      <DeleteConfirmationModal
        isOpen={Boolean(sessionToDelete)}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDeleteSession}
        title="Delete chat"
        message="Are you sure you want to delete this chat?"
        itemName={sessionToDelete?.title || "New chat"}
        isLoading={deleteSessionMutation.isPending}
      />
    </>
  );
}
