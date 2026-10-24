import { downloadTrustedFile } from "@/lib/security/download";
import { fetchImageAsBase64, FetchedImageData } from "./vision-image";
import { parsePDF } from "@/lib/pdf/parser";
import type { ChatMessageAttachment } from "@/lib/nova/chat-messages";

export interface LoadedAttachment {
  type: "image" | "pdf" | "text";
  url: string;
  fileName?: string;
  mimeType: string;
  base64?: string;
  textContent?: string;
}

const MAX_ATTACHMENT_BYTES = 16 * 1024 * 1024; // 16MB

function isPdfBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  );
}

function isImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
  // WebP
  if (buffer.length >= 12 && buffer.toString("latin1", 0, 4) === "RIFF" && buffer.toString("latin1", 8, 12) === "WEBP") return true;
  return false;
}

/**
 * Safely fetches and parses an attachment (PDF, image, or text file)
 * uploaded to Cloudinary for AI ingestion.
 */
export async function fetchAttachmentForAi(
  attachment: ChatMessageAttachment | { url: string; fileName?: string; mimeType?: string; type?: string },
): Promise<LoadedAttachment> {
  const { url, fileName } = attachment;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("Invalid attachment URL");
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const isCloudinaryHost = parsedUrl.hostname === "res.cloudinary.com";
  const isApprovedCloud =
    Boolean(cloudName &&
    isCloudinaryHost &&
    (parsedUrl.pathname.startsWith(`/${cloudName}/image/upload/`) ||
      parsedUrl.pathname.startsWith(`/${cloudName}/raw/upload/`)));

  let r2PublicHost: string | null = null;
  try {
    if (process.env.CLOUDFLARE_R2_PUBLIC_URL) {
      r2PublicHost = new URL(process.env.CLOUDFLARE_R2_PUBLIC_URL).hostname;
    }
  } catch {}

  const isR2Host = Boolean(
    (r2PublicHost && parsedUrl.hostname === r2PublicHost) ||
    parsedUrl.hostname.endsWith(".r2.dev")
  );

  if (!isApprovedCloud && !isR2Host) {
    throw new Error("Attachment must be an upload from this application's storage account");
  }

  // If it's explicitly an image on the image/upload path, we can also use fetchImageAsBase64
  const pathIsImage = isCloudinaryHost
    ? parsedUrl.pathname.startsWith(`/${cloudName}/image/upload/`)
    : /\.(jpe?g|png|webp|gif|svg)$/i.test(parsedUrl.pathname);
  const declaredMime = attachment.mimeType?.toLowerCase();
  const lowerName = (fileName || parsedUrl.pathname).toLowerCase();

  // If image extension and path:
  if (
    pathIsImage &&
    !lowerName.endsWith(".pdf") &&
    declaredMime !== "application/pdf" &&
    (declaredMime?.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(lowerName))
  ) {
    const imageData: FetchedImageData = await fetchImageAsBase64(url, declaredMime);
    return {
      type: "image",
      url,
      fileName,
      mimeType: imageData.mimeType,
      base64: imageData.base64,
    };
  }

  // Otherwise, download the file safely
  const allowedHosts = ["res.cloudinary.com"];
  if (r2PublicHost) allowedHosts.push(r2PublicHost);
  if (parsedUrl.hostname.endsWith(".r2.dev") && !allowedHosts.includes(parsedUrl.hostname)) {
    allowedHosts.push(parsedUrl.hostname);
  }

  const allowedPrefix = isCloudinaryHost
    ? (pathIsImage ? `/${cloudName}/image/upload/` : `/${cloudName}/raw/upload/`)
    : "/";

  const buffer = await downloadTrustedFile(url, {
    allowedHosts,
    maxBytes: MAX_ATTACHMENT_BYTES,
    allowedPathPrefix: allowedPrefix,
    timeoutMs: 20000,
    accept: "*/*",
  });

  // 1. PDF Check
  if (isPdfBuffer(buffer) || lowerName.endsWith(".pdf") || declaredMime === "application/pdf") {
    let extractedText = "";
    try {
      extractedText = await parsePDF(buffer);
    } catch (pdfErr) {
      console.warn("Could not extract text from PDF via pdf-parse, will rely on multimodal:", pdfErr);
    }

    return {
      type: "pdf",
      url,
      fileName: fileName || "Document.pdf",
      mimeType: "application/pdf",
      base64: buffer.toString("base64"),
      textContent: extractedText.trim() || undefined,
    };
  }

  // 2. Image Check
  if (isImageBuffer(buffer) || declaredMime?.startsWith("image/")) {
    const imageData = await fetchImageAsBase64(url, declaredMime);
    return {
      type: "image",
      url,
      fileName,
      mimeType: imageData.mimeType,
      base64: imageData.base64,
    };
  }

  // 3. Plain Text / Markdown / CSV
  const textContent = buffer.toString("utf-8");
  return {
    type: "text",
    url,
    fileName: fileName || "notes.txt",
    mimeType: declaredMime || "text/plain",
    textContent,
  };
}
