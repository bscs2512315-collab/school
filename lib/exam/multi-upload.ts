import type { UploadItem, UploadState, UploadStatus } from "@/types/generate";

export const MAX_IMAGES_PER_QUESTION = 5;

export function createUploadItem(file: File): UploadItem {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `up_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return {
    id,
    file,
    previewUrl: URL.createObjectURL(file),
    imageUrl: null,
    status: "uploading",
  };
}

export function emptyUploadState(): UploadState {
  return {
    status: "idle",
    imageUrl: null,
    imageUrls: [],
    previewUrl: null,
    previewUrls: [],
    file: null,
    files: [],
  };
}

export function uploadItemsFromUrls(urls: string[]): UploadItem[] {
  return urls
    .filter((url): url is string => Boolean(url) && typeof url === "string")
    .map((url) => ({
      id: `stored-${url}`,
      file: null,
      previewUrl: url,
      imageUrl: url,
      status: "uploaded" as const,
    }));
}

export function aggregateState(
  files: UploadItem[],
): Omit<UploadState, "files"> {
  const uploaded = files.filter(
    (f) => f.status === "uploaded" && typeof f.imageUrl === "string",
  );
  const hasUploading = files.some((f) => f.status === "uploading");
  const hasFailed = files.some((f) => f.status === "failed");
  const hasAny = files.length > 0;

  let status: UploadStatus = "idle";
  if (hasAny) {
    status = hasUploading ? "uploading" : hasFailed ? "failed" : "uploaded";
  }

  const imageUrls = uploaded
    .map((f) => f.imageUrl as string)
    .filter((url) => Boolean(url));

  return {
    status,
    imageUrl: imageUrls[0] ?? null,
    imageUrls,
    previewUrl: files.find((f) => f.previewUrl)?.previewUrl ?? null,
    previewUrls: files
      .map((f) => f.previewUrl)
      .filter((url): url is string => Boolean(url)),
    file: files.find((f) => f.file)?.file ?? null,
  };
}

export function mergeUploadState(
  prev: UploadState | undefined,
  files: UploadItem[],
): UploadState {
  const aggregate = aggregateState(files);
  return { ...(prev ?? emptyUploadState()), ...aggregate, files };
}

export function upsertUploadItem(
  prev: UploadState | undefined,
  item: UploadItem,
): UploadState {
  const files = [...(prev?.files ?? [])].filter((f) => f.id !== item.id);
  files.push(item);
  return mergeUploadState(prev, files);
}

export function removeUploadItem(
  prev: UploadState | undefined,
  id: string,
): UploadState {
  const files = (prev?.files ?? []).filter((f) => f.id !== id);
  return mergeUploadState(prev, files);
}

/**
 * Derive the list of `UploadItem`s to display for a question, falling back to
 * legacy single-image `UploadState` shapes (no `files` array) so older
 * persisted sessions still render.
 */
export function toUploadItemList(
  upload: UploadState | undefined | null,
): UploadItem[] {
  if (!upload) return [];
  if (upload.files && upload.files.length > 0) return upload.files;
  const hasData =
    upload.status !== "idle" ||
    Boolean(upload.imageUrl) ||
    Boolean(upload.previewUrl) ||
    Boolean(upload.file);
  if (!hasData) return [];
  return [
    {
      id: "__single",
      file: upload.file,
      previewUrl: upload.previewUrl,
      imageUrl: upload.imageUrl,
      status: upload.status,
    },
  ];
}

/**
 * Convert a per-question upload map into the JSON answer payload persisted in
 * `answers_data`. Each answer carries the primary `imageUrl` (backward
 * compatible) plus the full `imageUrls` list.
 */
export function uploadsToAnswersData(
  uploads: Record<string, UploadState>,
): Record<string, { imageUrl: string; imageUrls: string[] }> {
  const out: Record<string, { imageUrl: string; imageUrls: string[] }> = {};
  for (const [qId, state] of Object.entries(uploads)) {
    const urls = (state.imageUrls ?? []).filter(
      (url): url is string => Boolean(url) && typeof url === "string",
    );
    if (urls.length === 0) continue;
    out[qId] = { imageUrl: urls[0], imageUrls: urls };
  }
  return out;
}

/**
 * Rebuild a per-question upload map from a persisted / legacy answers object,
 * restoring uploaded image lists for resume sessions.
 */
export function restoreUploadsFromAnswers(
  answers: Record<string, unknown> | undefined,
): Record<string, UploadState> {
  const out: Record<string, UploadState> = {};
  if (!answers) return out;
  for (const [qId, value] of Object.entries(answers)) {
    if (!value || typeof value !== "object") continue;
    const answer = value as Record<string, unknown>;
    const urls: string[] = Array.isArray(answer.imageUrls)
      ? (answer.imageUrls as unknown[]).filter(
          (url): url is string => typeof url === "string",
        )
      : [];
    const primary =
      typeof answer.imageUrl === "string" ? answer.imageUrl : null;
    if (primary && !urls.includes(primary)) urls.unshift(primary);
    out[qId] = urls.length
      ? {
          ...emptyUploadState(),
          status: "uploaded",
          imageUrl: urls[0],
          imageUrls: urls,
          previewUrl: urls[0],
          previewUrls: urls,
          files: uploadItemsFromUrls(urls),
        }
      : emptyUploadState();
  }
  return out;
}