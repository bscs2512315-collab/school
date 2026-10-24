import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Restrict destination folders to an allowlist to prevent arbitrary writes.
const ALLOWED_FOLDERS = new Set([
  "zentix/management",
  "zentix/boards",
  "zentix/schools",
  "zentix/avatars",
  "zentix/questions",
  "zentix/advertisements",
]);

export async function POST(req: Request) {
  try {
    const admin = await getAdminFromRequest(
      req as unknown as Parameters<typeof getAdminFromRequest>[0],
    );
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { image, folder = "zentix/management" } = await req.json();

    if (!image) {
      return NextResponse.json({ success: false, message: "No image provided" }, { status: 400 });
    }

    if (typeof folder !== "string" || !ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json(
        { success: false, message: "Invalid upload folder" },
        { status: 400 },
      );
    }

    // Enforce a server-side size cap on the base64 payload (~8MB decoded).
    if (typeof image !== "string" || Buffer.byteLength(image, "utf8") > 11_000_000) {
      return NextResponse.json(
        { success: false, message: "Image exceeds allowed size" },
        { status: 413 },
      );
    }

    // Upload base64 image to cloudinary
    const result = await cloudinary.uploader.upload(image, {
      folder,
      resource_type: "image",
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to upload image" },
      { status: 500 }
    );
  }
}
