import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { saveUploadedFile } from "@/lib/storage/file-upload";

/**
 * POST /api/admin/questions/upload-image
 * Upload an image for a specific question (to Cloudinary)
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return errorResponse("No file uploaded", 400);
    }

    // Use unified file-upload service (which now uses Cloudinary)
    const { fileUrl, fileName } = await saveUploadedFile(file, "questions");

    return successResponse(
      { fileUrl, fileName },
      "Image uploaded successfully",
    );
  } catch (error) {
    console.error("Upload question image error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      500,
    );
  }
}
