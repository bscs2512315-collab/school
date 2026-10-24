import { uploadToCloudinary, deleteFromCloudinary } from "./cloudinary";
import { uploadToR2, deleteFromR2 } from "./r2";
import { uploadToImageKit, deleteFromImageKit } from "./imagekit";

async function getSharp() {
  try {
    const sharpModule = await import("sharp");
    return sharpModule.default || sharpModule;
  } catch (err) {
    console.warn("⚠️ [file-upload] Sharp module not available in this environment:", err);
    return null;
  }
}

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "10485760"); // 10MB default

// Note: SVG is intentionally excluded. It can contain embedded scripts and is
// a stored-XSS vector when served from a same-origin CDN.
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "text/markdown",
  "text/csv",
]);

function isTextBuffer(buffer: Buffer): boolean {
  if (buffer.length === 0) return true;
  const sampleLength = Math.min(buffer.length, 4096);
  for (let i = 0; i < sampleLength; i++) {
    // Null byte indicates binary
    if (buffer[i] === 0x00) return false;
  }
  return true;
}

/**
 * Save uploaded file (to Cloudinary)
 */
function detectMime(buffer: Buffer, fileName?: string): string | null {
  // PDF: %PDF
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return "application/pdf";
  }
  // JPEG: FF D8 FF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  // WebP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString("latin1", 0, 4) === "RIFF" &&
    buffer.toString("latin1", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  // HEIC/HEIF: ISO Base Media file with an `ftyp` brand of heic/heix/heif/mif1
  // (iOS default camera format). Matches h[ei][csx]x and related brands.
  if (
    buffer.length >= 12 &&
    buffer.toString("latin1", 4, 8) === "ftyp" &&
    /^hei[csx]|^heix|^mif1|^msf1|^hev[cm]/.test(
      buffer.toString("latin1", 8, 12),
    )
  ) {
    return "image/heic";
  }
  // Safe text documents (plain text, markdown, CSV)
  if (fileName && isTextBuffer(buffer)) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "txt") return "text/plain";
    if (ext === "md") return "text/markdown";
    if (ext === "csv") return "text/csv";
  }
  return null;
}

/**
 * Save uploaded file (to Cloudinary)
 */
export async function saveUploadedFile(
  file: File,
  subfolder: string = "general",
  allowedMimeTypes: ReadonlySet<string> = ALLOWED_MIME_TYPES,
): Promise<{ fileUrl: string; fileName: string; publicId?: string; mimeType: string }> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    );
  }

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  let buffer = Buffer.from(arrayBuffer);

  // Validate by content magic bytes, not by the client-supplied MIME/extension.
  let detectedMime = detectMime(buffer, file.name);
  let uploadName = file.name;

  // iOS photos (HEIC/HEIF) are decoded and normalized to JPEG so downstream
  // consumers (Cloudinary, <img>, Nova vision) always get a web-friendly image.
  if (detectedMime === "image/heic") {
    try {
      const sharpInstance = await getSharp();
      if (!sharpInstance) {
        throw new Error("Image processing service is temporarily unavailable for HEIC files");
      }
      buffer = Buffer.from(await sharpInstance(buffer, { failOn: "none" }).jpeg({ quality: 85 }).toBuffer());
      detectedMime = "image/jpeg";
      uploadName = uploadName.replace(/\.[^.]+$/, "") + ".jpg";
    } catch (error) {
      console.error("HEIC -> JPEG conversion failed:", error);
      throw new Error("Could not process this image format");
    }
  }

  // Pre-upload optimization: For image files (like student-answers, avatars, questions),
  // resize overly large camera photos (e.g. 4000x3000, 8MB) to max 1600px width/height
  // and compress at 80% quality. This preserves full readability while reducing file size by 90-95%.
  if (detectedMime && detectedMime.startsWith("image/") && detectedMime !== "image/svg+xml") {
    try {
      const sharpInstance = await getSharp();
      if (sharpInstance) {
        const pipeline = sharpInstance(buffer, { failOn: "none" })
          .rotate() // Auto-orient smartphone photos according to EXIF
          .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true });

        if (detectedMime === "image/png") {
          buffer = Buffer.from(await pipeline.png({ quality: 80, compressionLevel: 8 }).toBuffer());
        } else if (detectedMime === "image/webp") {
          buffer = Buffer.from(await pipeline.webp({ quality: 80 }).toBuffer());
        } else {
          buffer = Buffer.from(await pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer());
          detectedMime = "image/jpeg";
        }
      }
    } catch (optError) {
      console.warn("⚠️ [file-upload] Image pre-compression skipped:", optError);
    }
  }

  if (!detectedMime || !allowedMimeTypes.has(detectedMime)) {
    throw new Error("Only PDF, JPEG, PNG and WebP files are allowed");
  }

  // Prefer ImageKit if configured (20GB free storage + 20GB free bandwidth)
  if (
    process.env.IMAGEKIT_PUBLIC_KEY &&
    process.env.IMAGEKIT_PRIVATE_KEY &&
    process.env.IMAGEKIT_URL_ENDPOINT
  ) {
    try {
      const ikResult = await uploadToImageKit(buffer, uploadName, subfolder);
      return {
        fileUrl: ikResult.url,
        fileName: ikResult.fileName,
        publicId: ikResult.fileId,
        mimeType: detectedMime,
      };
    } catch (ikError) {
      console.warn("⚠️ ImageKit upload failed, falling back to secondary storage:", ikError);
    }
  }

  // Fallback to Cloudflare R2 if configured
  if (
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
    process.env.CLOUDFLARE_R2_ACCOUNT_ID
  ) {
    try {
      const r2Result = await uploadToR2(buffer, uploadName, subfolder);
      return {
        fileUrl: r2Result.url,
        fileName: r2Result.fileName,
        publicId: r2Result.key,
        mimeType: detectedMime,
      };
    } catch (r2Error) {
      console.warn("⚠️ Cloudflare R2 upload failed, falling back to Cloudinary:", r2Error);
    }
  }

  // Upload to Cloudinary
  const result = await uploadToCloudinary(buffer, uploadName, subfolder);

  return {
    fileUrl: result.url,
    fileName: result.fileName,
    publicId: result.publicId,
    mimeType: detectedMime,
  };
}

/**
 * Extract Cloudinary public ID (including folder prefix) from a URL
 */
export function extractCloudinaryPublicId(url: string): string | null {
  if (!url || !url.includes("res.cloudinary.com")) return null;
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const uploadIndex = parts.findIndex((p) => p === "upload");
    if (uploadIndex === -1) return null;

    const subParts = parts.slice(uploadIndex + 1);
    const versionIdx = subParts.findIndex((p) => /^v\d+$/.test(p));
    const folderAndFileParts = versionIdx !== -1 ? subParts.slice(versionIdx + 1) : subParts;
    const fullPathWithExt = folderAndFileParts.join("/");
    return fullPathWithExt.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
}

/**
 * Delete uploaded file (from Cloudinary or local if it starts with /uploads)
 */
export async function deleteUploadedFile(
  fileUrl: string,
  publicId?: string,
): Promise<void> {
  // If we have a publicId, it's definitely in Cloudinary
  if (publicId) {
    await deleteFromCloudinary(publicId);
    return;
  }

  // If it's a local file relative path (legacy)
  if (fileUrl.startsWith("/uploads/")) {
    const { unlink } = await import("fs/promises");
    const { join } = await import("path");

    // Remove leading slash and convert to file system path
    const filePath = join(process.cwd(), "public", "uploads", fileUrl.replace(/^\/uploads\/?/, ""));

    try {
      await unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete local file ${filePath}:`, error);
    }
    return;
  }

  // If it's an ImageKit URL or fileId
  if (fileUrl.includes("ik.imagekit.io")) {
    if (publicId) {
      await deleteFromImageKit(publicId);
    }
    return;
  }

  // If it's an R2 URL or key
  if (fileUrl.includes(".r2.dev") || (publicId && !fileUrl.includes("res.cloudinary.com"))) {
    await deleteFromR2(publicId || fileUrl);
    return;
  }

  // If it's a Cloudinary URL, extract publicId
  const extractedId = extractCloudinaryPublicId(fileUrl);
  if (extractedId) {
    await deleteFromCloudinary(extractedId);
  }
}

