import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type UploadResult = {
  url: string;
  publicId: string;
  fileName: string;
};

/**
 * Upload a file to Cloudinary
 * @param fileBuffer The file content as a Buffer
 * @param fileName Original file name
 * @param subfolder Folder name in Cloudinary (e.g., 'past-papers', 'curriculums', 'questions')
 * @returns Upload result with URL and public ID
 */
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function uploadOnce(
  fileBuffer: Buffer,
  fileName: string,
  subfolder: string,
  timeoutMs: number,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      folder: `zentix/${subfolder}`,
      resource_type: "auto", // Automatically detect if it's an image, video, or raw file (PDF)
      public_id: `${Date.now()}-${fileName.split(".")[0].replace(/\s+/g, "-")}`,
      timeout: timeoutMs,
    };

    // Use upload_stream for buffers
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          return reject(
            new Error(`Cloudinary upload failed: ${error.message}`),
          );
        }
        if (!result) {
          return reject(
            new Error("Cloudinary upload failed: No result returned"),
          );
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          fileName: fileName,
        });
      },
    );

    uploadStream.end(fileBuffer);
  });
}

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  fileName: string,
  subfolder: string = "general",
): Promise<UploadResult> {
  const maxAttempts = 2;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await uploadOnce(fileBuffer, fileName, subfolder, 15000);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `Cloudinary upload error (attempt ${attempt}/${maxAttempts}) for ${fileName}:`,
        message,
      );
      if (attempt < maxAttempts) {
        await sleep(300 * attempt);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Cloudinary upload failed after ${maxAttempts} attempts`);
}

/**
 * Delete a file from Cloudinary
 * @param publicId Cloudinary public ID
 * @param resourceType Optional resource type ('image', 'raw', 'video')
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "raw" | "video" | "auto" = "auto",
): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
  } catch (error) {
    console.error(`Failed to delete from Cloudinary (${publicId}):`, error);
  }
}

/**
 * Delete multiple files from Cloudinary in batch (up to 100 per call)
 * @param publicIds Array of Cloudinary public IDs
 * @param resourceType Resource type ('image', 'raw', 'video')
 */
export async function deleteManyFromCloudinary(
  publicIds: string[],
  resourceType: "image" | "raw" | "video" = "image",
): Promise<{ deletedCount: number; errors: string[] }> {
  if (!publicIds.length) return { deletedCount: 0, errors: [] };

  const errors: string[] = [];
  let deletedCount = 0;
  const batchSize = 100;

  for (let i = 0; i < publicIds.length; i += batchSize) {
    const chunk = publicIds.slice(i, i + batchSize);
    try {
      const res = await cloudinary.api.delete_resources(chunk, {
        resource_type: resourceType,
        invalidate: true,
      });
      if (res && res.deleted) {
        deletedCount += Object.keys(res.deleted).length;
      }
    } catch (err: any) {
      console.error("Cloudinary batch delete error, falling back to individual deletion:", err?.message || err);
      // Fallback: delete one by one
      for (const id of chunk) {
        try {
          await cloudinary.uploader.destroy(id, {
            resource_type: resourceType,
            invalidate: true,
          });
          deletedCount++;
        } catch (singleErr: any) {
          errors.push(`${id}: ${singleErr?.message || singleErr}`);
        }
      }
    }
  }

  return { deletedCount, errors };
}

