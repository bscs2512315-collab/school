import ImageKit from "imagekit";

export type ImageKitUploadResult = {
  url: string;
  fileId: string;
  fileName: string;
};

let imageKitInstance: ImageKit | null = null;

export function getImageKitClient(): ImageKit {
  if (imageKitInstance) return imageKitInstance;

  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new Error("ImageKit environment variables are not fully configured");
  }

  imageKitInstance = new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint,
  });

  return imageKitInstance;
}

/**
 * Upload a file Buffer directly to ImageKit
 * @param fileBuffer The file content as a Buffer
 * @param fileName Original file name
 * @param subfolder Folder path in ImageKit (e.g. 'questions', 'student-answers', 'past-papers')
 */
export async function uploadToImageKit(
  fileBuffer: Buffer,
  fileName: string,
  subfolder: string = "general",
): Promise<ImageKitUploadResult> {
  const imagekit = getImageKitClient();
  const cleanSubfolder = subfolder.replace(/^\/+|\/+$/g, "");
  const cleanName = fileName.replace(/\s+/g, "-");

  const response = await imagekit.upload({
    file: fileBuffer,
    fileName: cleanName,
    folder: `/exboard/${cleanSubfolder}`,
    useUniqueFileName: true,
  });

  return {
    url: response.url,
    fileId: response.fileId,
    fileName: response.name,
  };
}

/**
 * Delete a file from ImageKit
 * @param fileId ImageKit fileId
 */
export async function deleteFromImageKit(fileId: string): Promise<void> {
  try {
    const imagekit = getImageKitClient();
    await imagekit.deleteFile(fileId);
  } catch (error) {
    console.error("Failed to delete file from ImageKit:", error);
  }
}
