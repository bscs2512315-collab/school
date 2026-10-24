import type { ChatAction, ChatSource } from "@/types/bot";

export interface ChatMessageAttachment {
  type: "image" | "file";
  url: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
}

export interface ChatMessageRow {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[] | string | null;
  actions?: ChatAction[] | string | null;
  attachments?: ChatMessageAttachment[] | string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  actions?: ChatAction[];
  imageUrl?: string;
  imageUrls?: string[];
  attachments?: ChatMessageAttachment[];
}

function parseAttachments(
  raw: ChatMessageAttachment[] | string | null | undefined,
): ChatMessageAttachment[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as ChatMessageAttachment[];
    } catch {
      return [];
    }
  }
  return raw;
}

export function getMessageImageUrl(attachments: ChatMessageAttachment[]): string | undefined {
  const image = attachments.find(
    (item) => (item.type === "image" || item.mimeType?.startsWith("image/")) && item.url,
  );
  return image?.url;
}

export function parseChatMessageRow(msg: ChatMessageRow): ChatMessage {
  const sources =
    typeof msg.sources === "string"
      ? (JSON.parse(msg.sources) as ChatSource[])
      : (msg.sources ?? []);
  const actions =
    typeof msg.actions === "string"
      ? (JSON.parse(msg.actions) as ChatAction[])
      : (msg.actions ?? []);
  const attachments = parseAttachments(msg.attachments);
  const imageAttachments = attachments.filter(
    (item) => (item.type === "image" || item.mimeType?.startsWith("image/")) && item.url,
  );

  return {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    sources,
    actions,
    imageUrl: getMessageImageUrl(attachments),
    imageUrls: imageAttachments.map((item) => item.url),
    attachments,
  };
}
