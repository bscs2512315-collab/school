import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { saveUploadedFile } from "@/lib/storage/file-upload";

const MAX_CHAT_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_CHAT_PDF_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_CHAT_TEXT_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_UPLOAD_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "text/markdown",
  "text/csv",
]);

/**
 * POST /api/student/chat/upload
 * Upload a document or image for Nova chat (PDF notes, syllabus, question photo, text notes, etc.)
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Session expired. Please log in again.", 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse("No file uploaded", 400);
    }

    const lowerName = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || lowerName.endsWith(".pdf");
    const isImage = ["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      /\.(jpe?g|png|webp)$/i.test(lowerName);
    const isText = ["text/plain", "text/markdown", "text/csv"].includes(file.type) ||
      /\.(txt|md|csv)$/i.test(lowerName);

    if (!isPdf && !isImage && !isText) {
      return errorResponse(
        "Supported file types: PDF documents, images (JPEG, PNG, WebP), and text files (.txt, .md, .csv)",
        400,
      );
    }

    if (isPdf && file.size > MAX_CHAT_PDF_SIZE) {
      return errorResponse("PDF document must be under 15MB", 400);
    }
    if (isImage && file.size > MAX_CHAT_IMAGE_SIZE) {
      return errorResponse("Image must be under 10MB", 400);
    }
    if (isText && file.size > MAX_CHAT_TEXT_SIZE) {
      return errorResponse("Text file must be under 5MB", 400);
    }

    const { fileUrl, fileName, mimeType } = await saveUploadedFile(
      file,
      "nova-chat",
      ALLOWED_UPLOAD_TYPES,
    );

    const isImageMime = mimeType.startsWith("image/");
    const attachmentType: "image" | "file" = isImageMime ? "image" : "file";

    return successResponse(
      {
        fileUrl,
        fileName,
        mimeType,
        fileSize: file.size,
        type: attachmentType,
      },
      "File uploaded successfully",
    );
  } catch (error) {
    console.error("Nova chat upload error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to upload file",
      500,
    );
  }
}
