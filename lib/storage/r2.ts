import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

export type R2UploadResult = {
  url: string;
  key: string;
  fileName: string;
};

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "exboard-media";
const publicUrlBase =
  process.env.CLOUDFLARE_R2_PUBLIC_URL ||
  "https://pub-136d0ae2d9f64f269499026acb4e2f5e.r2.dev";

function getR2Client(): S3Client {
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Cloudflare R2 environment variables are not configured");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
}

function getContentType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}

/**
 * Upload a file Buffer directly to Cloudflare R2
 * @param fileBuffer The file content as a Buffer
 * @param fileName Original file name
 * @param subfolder Folder path in R2 (e.g., 'questions', 'student-answers', 'past-papers')
 */
export async function uploadToR2(
  fileBuffer: Buffer,
  fileName: string,
  subfolder: string = "general",
): Promise<R2UploadResult> {
  const client = getR2Client();
  const cleanSubfolder = subfolder.replace(/^\/+|\/+$/g, "");
  const cleanName = fileName.replace(/\s+/g, "-");
  const key = `${cleanSubfolder}/${cleanName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: getContentType(fileName),
  });

  await client.send(command);

  const publicUrl = `${publicUrlBase.replace(/\/+$/, "")}/${key}`;

  return {
    url: publicUrl,
    key,
    fileName,
  };
}

/**
 * Delete a file from Cloudflare R2
 * @param key File key or full public URL
 */
export async function deleteFromR2(keyOrUrl: string): Promise<void> {
  try {
    const client = getR2Client();
    let key = keyOrUrl;

    if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
      const parsed = new URL(keyOrUrl);
      key = parsed.pathname.replace(/^\/+/, "");
    }

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await client.send(command);
  } catch (error) {
    console.error(`Failed to delete from Cloudflare R2 (${keyOrUrl}):`, error);
  }
}
