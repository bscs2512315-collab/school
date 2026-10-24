import { db } from "@/lib/db";
import { deleteManyFromCloudinary } from "@/lib/storage/cloudinary";
import { extractCloudinaryPublicId } from "@/lib/storage/file-upload";

export interface CleanupResult {
  success: boolean;
  dryRun: boolean;
  retentionDays: number;
  attemptsScanned: number;
  attemptsCleaned: number;
  imagesFound: number;
  imagesDeleted: number;
  draftsCleaned: number;
  durationMs: number;
  samplePublicIds?: string[];
  errors?: string[];
}

/**
 * Sweeps student exam attempts and removes uploaded answer photos from Cloudinary
 * after a specified retention window (default 2 days after grading/approval).
 *
 * Scores, feedback, teacher annotations notes, and grading history remain 100% intact.
 */
export async function cleanExpiredStudentAnswers(options?: {
  retentionDays?: number;
  limit?: number;
  dryRun?: boolean;
}): Promise<CleanupResult> {
  const startTime = Date.now();
  const retentionDays = options?.retentionDays ?? 2;
  const limit = options?.limit ?? 50;
  const dryRun = Boolean(options?.dryRun);

  const errors: string[] = [];
  let attemptsCleaned = 0;
  let totalImagesFound = 0;
  let totalImagesDeleted = 0;
  let draftsCleaned = 0;
  const collectedPublicIds: string[] = [];

  try {
    // 1. Fetch completed & graded attempts older than retentionDays with unarchived images
    const { rows: attempts } = await db.query<{
      id: string;
      user_id: string;
      answers_data: unknown;
      created_at: Date;
      updated_at: Date | null;
    }>(
      `SELECT id, user_id, answers_data, created_at, updated_at
       FROM exam_attempts
       WHERE grading_status = 'graded'
         AND images_archived_at IS NULL
         AND answers_data::text LIKE '%cloudinary%'
         AND COALESCE(updated_at, created_at) <= NOW() - make_interval(days => $1)
       ORDER BY COALESCE(updated_at, created_at) ASC
       LIMIT $2`,
      [retentionDays, limit],
    );

    for (const attempt of attempts) {
      const rawData =
        typeof attempt.answers_data === "string"
          ? JSON.parse(attempt.answers_data)
          : attempt.answers_data;

      if (!rawData || typeof rawData !== "object") continue;

      const answersData = { ...(rawData as Record<string, any>) };
      const attemptPublicIds: string[] = [];
      let attemptHasImages = false;

      // Extract image URLs from each question entry
      for (const [questionId, qVal] of Object.entries(answersData)) {
        if (!qVal || typeof qVal !== "object") continue;
        const qRecord = { ...qVal };

        const urls: string[] = [];
        if (typeof qRecord.imageUrl === "string") urls.push(qRecord.imageUrl);
        if (Array.isArray(qRecord.imageUrls)) {
          qRecord.imageUrls.forEach((u: any) => typeof u === "string" && urls.push(u));
        }
        if (typeof qRecord.annotatedImageUrl === "string") urls.push(qRecord.annotatedImageUrl);
        if (Array.isArray(qRecord.annotatedImageUrls)) {
          qRecord.annotatedImageUrls.forEach((u: any) => typeof u === "string" && urls.push(u));
        }

        for (const url of urls) {
          const publicId = extractCloudinaryPublicId(url);
          if (publicId) {
            attemptPublicIds.push(publicId);
            collectedPublicIds.push(publicId);
            attemptHasImages = true;
          }
        }

        if (attemptHasImages) {
          // Remove heavy photo URLs while keeping all marks, question info, and feedback intact
          delete qRecord.imageUrl;
          delete qRecord.imageUrls;
          delete qRecord.annotatedImageUrl;
          delete qRecord.annotatedImageUrls;
          qRecord.imagesArchived = true;
          answersData[questionId] = qRecord;
        }
      }

      totalImagesFound += attemptPublicIds.length;

      if (!dryRun) {
        if (attemptPublicIds.length > 0) {
          const { deletedCount, errors: deleteErrors } = await deleteManyFromCloudinary(
            attemptPublicIds,
            "image",
          );
          totalImagesDeleted += deletedCount;
          if (deleteErrors.length) errors.push(...deleteErrors);
        }

        // Mark attempt as archived in database
        await db.query(
          `UPDATE exam_attempts
           SET answers_data = $1, images_archived_at = NOW()
           WHERE id = $2`,
          [JSON.stringify(answersData), attempt.id],
        );
        attemptsCleaned++;
      } else {
        if (attemptHasImages) attemptsCleaned++;
      }
    }

    // 2. Cleanup abandoned student drafts older than 7 days that were never finalized
    if (!dryRun) {
      try {
        const { rows: abandonedDrafts } = await db.query<{
          id: string;
          answers_data: unknown;
        }>(
          `SELECT id, answers_data
           FROM teacher_paper_progress
           WHERE answers_data::text LIKE '%cloudinary%'
             AND updated_at <= NOW() - INTERVAL '7 days'
           LIMIT 20`,
        );

        for (const draft of abandonedDrafts) {
          const raw =
            typeof draft.answers_data === "string"
              ? JSON.parse(draft.answers_data)
              : draft.answers_data;
          if (!raw || typeof raw !== "object") continue;

          const draftPublicIds: string[] = [];
          for (const item of Object.values(raw as Record<string, any>)) {
            if (Array.isArray(item)) {
              for (const sub of item) {
                if (sub?.imageUrl) {
                  const pid = extractCloudinaryPublicId(sub.imageUrl);
                  if (pid) draftPublicIds.push(pid);
                }
              }
            } else if (item && typeof item === "object") {
              const url = (item as any).imageUrl;
              if (url) {
                const pid = extractCloudinaryPublicId(url);
                if (pid) draftPublicIds.push(pid);
              }
            }
          }

          if (draftPublicIds.length > 0) {
            await deleteManyFromCloudinary(draftPublicIds, "image");
            totalImagesDeleted += draftPublicIds.length;
          }

          await db.query(
            `DELETE FROM teacher_paper_progress WHERE id = $1`,
            [draft.id],
          );
          draftsCleaned++;
        }
      } catch (draftErr: any) {
        console.warn("Notice: abandoned drafts cleanup:", draftErr?.message || draftErr);
      }
    }

    return {
      success: true,
      dryRun,
      retentionDays,
      attemptsScanned: attempts.length,
      attemptsCleaned,
      imagesFound: totalImagesFound,
      imagesDeleted: dryRun ? 0 : totalImagesDeleted,
      draftsCleaned,
      durationMs: Date.now() - startTime,
      samplePublicIds: collectedPublicIds.slice(0, 10),
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    console.error("cleanExpiredStudentAnswers error:", error);
    return {
      success: false,
      dryRun,
      retentionDays,
      attemptsScanned: 0,
      attemptsCleaned: 0,
      imagesFound: 0,
      imagesDeleted: 0,
      draftsCleaned: 0,
      durationMs: Date.now() - startTime,
      errors: [error?.message || String(error)],
    };
  }
}
