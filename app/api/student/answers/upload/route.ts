import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { saveUploadedFile } from "@/lib/storage/file-upload";

const MAX_FILES_PER_REQUEST = 8;

/**
 * POST /api/student/answers/upload
 * Upload one or more student handwritten answer images to Cloudinary.
 * Returns immediately so the student can proceed to the next question.
 *
 * Accepts either a single `file` field (legacy) or a repeated `files` field.
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Session expired. Please log in again.", 401);
  }

  try {
    const formData = await request.formData();
    const questionId = formData.get("questionId") as string;
    const filesParam = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;

    const files = [
      ...filesParam,
      ...(singleFile ? [singleFile] : []),
    ];

    if (files.length === 0) {
      return errorResponse("No file uploaded", 400);
    }

    if (!questionId) {
      return errorResponse("Question ID is required", 400);
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      return errorResponse(
        `You can upload up to ${MAX_FILES_PER_REQUEST} images at once`,
        400,
      );
    }

    const results: Array<{ fileUrl: string; fileName: string }> = [];
    for (const file of files) {
      // Validate file type (only images for handwritten answers)
      if (!file.type.startsWith("image/")) {
        return errorResponse(
          "Only image files are allowed (JPEG, PNG, WebP)",
          400,
        );
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return errorResponse(`File size must be under 10MB`, 400);
      }

      // Upload to Cloudinary under student-answers subfolder
      const { fileUrl, fileName } = await saveUploadedFile(
        file,
        "student-answers",
      );
      results.push({ fileUrl, fileName });
    }

    return successResponse(
      {
        questionId,
        results,
        fileUrls: results.map((r) => r.fileUrl),
        fileNames: results.map((r) => r.fileName),
        fileUrl: results[0]?.fileUrl ?? null,
        fileName: results[0]?.fileName ?? null,
      },
      results.length > 1
        ? "Answer images uploaded successfully"
        : "Answer image uploaded successfully",
    );
  } catch (error) {
    console.error("Upload student answer error:", error);
    return errorResponse("Failed to upload answer image", 500);
  }
}