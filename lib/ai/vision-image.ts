export interface FetchedImageData {
  base64: string;
  mimeType: string;
}
import { downloadTrustedFile } from "@/lib/security/download";

async function getSharp() {
  try {
    const sharpModule = await import("sharp");
    return sharpModule.default || sharpModule;
  } catch (err) {
    console.warn("⚠️ [vision-image] Sharp module not available in this environment:", err);
    return null;
  }
}

function detectMimeTypeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }
  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return "image/gif";
  }
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15MB
const MAX_IMAGE_DIMENSION = 12000;
const MAX_IMAGE_PIXELS = 40_000_000;

export async function fetchImageAsBase64(
  imageUrl: string,
  preferredMimeType?: string,
): Promise<FetchedImageData> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    throw new Error("Invalid image URL");
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const isCloudinary =
    Boolean(cloudName &&
    parsedUrl.hostname === "res.cloudinary.com" &&
    parsedUrl.pathname.startsWith(`/${cloudName}/image/upload/`));

  let r2PublicHost: string | null = null;
  try {
    if (process.env.CLOUDFLARE_R2_PUBLIC_URL) {
      r2PublicHost = new URL(process.env.CLOUDFLARE_R2_PUBLIC_URL).hostname;
    }
  } catch {}

  const isR2 = Boolean(
    (r2PublicHost && parsedUrl.hostname === r2PublicHost) ||
    parsedUrl.hostname.endsWith(".r2.dev")
  );

  if (!isCloudinary && !isR2) {
    throw new Error("Image must be an upload from this application's storage account");
  }

  const allowedHosts = ["res.cloudinary.com"];
  if (r2PublicHost) allowedHosts.push(r2PublicHost);
  if (parsedUrl.hostname.endsWith(".r2.dev") && !allowedHosts.includes(parsedUrl.hostname)) {
    allowedHosts.push(parsedUrl.hostname);
  }

  const nodeBuffer = await downloadTrustedFile(imageUrl, {
    allowedHosts,
    maxBytes: MAX_IMAGE_BYTES,
    allowedPathPrefix: isCloudinary && cloudName ? `/${cloudName}/image/upload/` : "/",
    timeoutMs: 15000,
    accept: "image/*",
  });
  const detectedFromMagic = detectMimeTypeFromBuffer(nodeBuffer);
  const effectiveMime = detectedFromMagic;
  if (!effectiveMime) {
    throw new Error("Only valid image attachments are supported");
  }

  const sharpInstance = await getSharp();
  if (sharpInstance) {
    let metadata;
    try {
      metadata = await sharpInstance(nodeBuffer, { limitInputPixels: MAX_IMAGE_PIXELS }).metadata();
    } catch {
      throw new Error("Image attachment could not be decoded safely");
    }
    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width > MAX_IMAGE_DIMENSION ||
      metadata.height > MAX_IMAGE_DIMENSION ||
      metadata.width * metadata.height > MAX_IMAGE_PIXELS ||
      (metadata.pages ?? 1) > 1 ||
      metadata.format !== effectiveMime.split("/")[1]
    ) {
      throw new Error("Image attachment has an invalid format or dimensions");
    }
  } else if (nodeBuffer.length > MAX_IMAGE_BYTES) {
    throw new Error("Image exceeds maximum allowed size");
  }

  const base64 = nodeBuffer.toString("base64");
  return { base64, mimeType: effectiveMime };
}
