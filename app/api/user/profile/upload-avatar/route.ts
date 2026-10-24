import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/storage/file-upload";

/**
 * POST /api/user/profile/upload-avatar
 * Upload a profile avatar image (to Cloudinary).
 * Automatically deletes the user's old uploaded avatar from Cloudinary to keep storage free.
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized. Please login.", 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.warn("Avatar upload failed: No file found in FormData");
      return errorResponse("No file uploaded", 400);
    }

    // 1. Fetch user's current avatar to clean up after successful upload
    const { rows: userRows } = await db.query<{ profile_image: string | null }>(
      `SELECT profile_image FROM users WHERE id = $1`,
      [user.userId],
    );
    const oldProfileImage = userRows[0]?.profile_image;

    // 2. Upload new avatar to Cloudinary under "avatars" folder (with pre-compression)
    const { fileUrl } = await saveUploadedFile(file, "avatars");

    // 3. Update user's profile_image in database
    await db.query(
      `UPDATE users SET profile_image = $1, updated_at = NOW() WHERE id = $2`,
      [fileUrl, user.userId],
    );

    // 4. If the user previously had a custom Cloudinary avatar, delete it to save storage credits
    if (
      oldProfileImage &&
      oldProfileImage.includes("res.cloudinary.com") &&
      oldProfileImage !== fileUrl
    ) {
      deleteUploadedFile(oldProfileImage).catch((deleteErr) => {
        console.warn("Failed to delete previous avatar from Cloudinary:", deleteErr);
      });
    }

    return successResponse(
      { profileImage: fileUrl },
      "Avatar uploaded successfully",
    );
  } catch (error) {
    console.error("Upload avatar error:", error);
    return errorResponse("Avatar upload failed", 500);
  }
}

