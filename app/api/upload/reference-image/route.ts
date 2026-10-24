import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { saveUploadedFile } from "@/lib/storage/file-upload";

const MAX_FILES_PER_REQUEST = 6;

/**
 * POST /api/upload/reference-image
 * Upload reference images for custom paper generation or prompt assistance.
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const formData = await request.formData();
    const filesParam = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;

    const files = [
      ...filesParam,
      ...(singleFile ? [singleFile] : []),
    ];

    if (files.length === 0) {
      return errorResponse("No file uploaded", 400);
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      return errorResponse(
        `You can upload up to ${MAX_FILES_PER_REQUEST} images at once`,
        400,
      );
    }

    const results: Array<{ fileUrl: string; fileName: string }> = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return errorResponse("Only image files are allowed (JPEG, PNG, WebP)", 400);
      }
      if (file.size > 10 * 1024 * 1024) {
        return errorResponse("File size must be under 10MB", 400);
      }

      const { fileUrl, fileName } = await saveUploadedFile(file, "reference-images");
      results.push({ fileUrl, fileName });
    }

    return successResponse(
      {
        results,
        fileUrls: results.map((r) => r.fileUrl),
        fileNames: results.map((r) => r.fileName),
        fileUrl: results[0]?.fileUrl ?? null,
        fileName: results[0]?.fileName ?? null,
      },
      results.length > 1
        ? "Images uploaded successfully"
        : "Image uploaded successfully",
    );
  } catch (error) {
    console.error("Upload reference image error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload image";
    return errorResponse(message, 500);
  }
}
