/**
 * Browser-side image compression & downscaling utility.
 * Reduces 5MB-15MB mobile photos down to 100KB-350KB before network upload.
 */

export interface CompressImageOptions {
  maxDimension?: number; // Max width or height in pixels (default 1600)
  quality?: number; // JPEG/WebP quality from 0 to 1 (default 0.85)
  mimeType?: "image/jpeg" | "image/webp";
}

export async function compressImageFile(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  // If not an image or is SVG/GIF (which we shouldn't compress into jpeg), return as-is
  if (!file.type.startsWith("image/") || file.type.includes("svg") || file.type.includes("gif")) {
    return file;
  }

  const {
    maxDimension = 1600,
    quality = 0.85,
    mimeType = "image/jpeg",
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();

      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // If dimensions are already within bounds and file is small (< 300KB), return original
        if (width <= maxDimension && height <= maxDimension && file.size < 350 * 1024) {
          resolve(file);
          return;
        }

        // Calculate proportional scale
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file); // Fallback to original if context creation fails
          return;
        }

        // Use high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Create compressed file with clean filename
            const ext = mimeType === "image/webp" ? ".webp" : ".jpg";
            const newName = file.name.replace(/\.[^.]+$/, "") + ext;
            const compressedFile = new File([blob], newName, {
              type: mimeType,
              lastModified: Date.now(),
            });

            // If compressed is somehow larger than original, return original
            if (compressedFile.size > file.size) {
              resolve(file);
            } else {
              resolve(compressedFile);
            }
          },
          mimeType,
          quality,
        );
      };

      img.onerror = () => resolve(file); // Fallback to original
      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => resolve(file); // Fallback to original
    reader.readAsDataURL(file);
  });
}
