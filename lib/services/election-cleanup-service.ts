import { db } from "@/lib/db";
import { deleteManyFromCloudinary } from "@/lib/storage/cloudinary";
import { extractCloudinaryPublicId } from "@/lib/storage/file-upload";

export interface ElectionCleanupResult {
  success: boolean;
  dryRun: boolean;
  electionsScanned: number;
  electionsCleaned: number;
  voterSelfiesFound: number;
  voterSelfiesDeleted: number;
  candidateImagesFound: number;
  candidateImagesDeleted: number;
  durationMs: number;
  samplePublicIds?: string[];
  errors?: string[];
}

/**
 * Automatically purges candidate photos and voter selfies from Cloudinary
 * once an election has concluded (ends_at <= NOW() or results approved).
 *
 * Votes, candidate names, election results, roll numbers, and analytics remain 100% intact.
 */
export async function cleanFinishedElectionImages(options?: {
  dryRun?: boolean;
  electionId?: string;
}): Promise<ElectionCleanupResult> {
  const startTime = Date.now();
  const dryRun = Boolean(options?.dryRun);
  const targetElectionId = options?.electionId;

  const errors: string[] = [];
  let electionsCleaned = 0;
  let voterSelfiesFound = 0;
  let voterSelfiesDeleted = 0;
  let candidateImagesFound = 0;
  let candidateImagesDeleted = 0;
  const samplePublicIds: string[] = [];

  try {
    // 1. Find elections that are finished and haven't had images archived yet
    const query = targetElectionId
      ? `SELECT id, name, ends_at, results_approved_at
         FROM election_events
         WHERE id = $1 AND images_archived_at IS NULL`
      : `SELECT id, name, ends_at, results_approved_at
         FROM election_events
         WHERE images_archived_at IS NULL
           AND (ends_at <= NOW() OR results_approved_at IS NOT NULL)
         ORDER BY ends_at ASC`;

    const queryParams = targetElectionId ? [targetElectionId] : [];
    const { rows: finishedElections } = await db.query<{
      id: string;
      name: string;
      ends_at: Date;
      results_approved_at: Date | null;
    }>(query, queryParams);

    for (const election of finishedElections) {
      const publicIdsToDelete: string[] = [];

      // A. Collect voter selfies
      const { rows: votes } = await db.query<{ voter_selfie_url: string }>(
        `SELECT voter_selfie_url
         FROM election_votes
         WHERE election_id = $1 AND voter_selfie_url IS NOT NULL`,
        [election.id],
      );

      for (const v of votes) {
        if (!v.voter_selfie_url) continue;
        const pid = extractCloudinaryPublicId(v.voter_selfie_url);
        if (pid) {
          publicIdsToDelete.push(pid);
          voterSelfiesFound++;
          if (samplePublicIds.length < 10) samplePublicIds.push(pid);
        }
      }

      // B. Collect candidate photos and symbols
      const { rows: candidates } = await db.query<{
        profile_image_url: string;
        symbol_url: string | null;
      }>(
        `SELECT profile_image_url, symbol_url
         FROM election_candidates
         WHERE election_id = $1`,
        [election.id],
      );

      for (const c of candidates) {
        if (c.profile_image_url) {
          const pid = extractCloudinaryPublicId(c.profile_image_url);
          if (pid) {
            publicIdsToDelete.push(pid);
            candidateImagesFound++;
            if (samplePublicIds.length < 10) samplePublicIds.push(pid);
          }
        }
        if (c.symbol_url) {
          const pid = extractCloudinaryPublicId(c.symbol_url);
          if (pid) {
            publicIdsToDelete.push(pid);
            candidateImagesFound++;
          }
        }
      }

      // C. Perform Cloudinary Deletion & DB Nullification
      if (!dryRun) {
        if (publicIdsToDelete.length > 0) {
          const { deletedCount, errors: delErrors } = await deleteManyFromCloudinary(
            publicIdsToDelete,
            "image",
          );
          if (delErrors.length) errors.push(...delErrors);
          voterSelfiesDeleted += Math.min(votes.length, deletedCount);
          candidateImagesDeleted += Math.max(0, deletedCount - votes.length);
        }

        // Nullify voter selfies in DB
        await db.query(
          `UPDATE election_votes
           SET voter_selfie_url = NULL
           WHERE election_id = $1`,
          [election.id],
        );

        // Nullify candidate images in DB (keep candidate records, vote counts & positions)
        await db.query(
          `UPDATE election_candidates
           SET profile_image_url = '', symbol_url = NULL
           WHERE election_id = $1`,
          [election.id],
        );

        // Mark election images as archived
        await db.query(
          `UPDATE election_events
           SET images_archived_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [election.id],
        );

        electionsCleaned++;
      } else {
        electionsCleaned++;
      }
    }

    return {
      success: true,
      dryRun,
      electionsScanned: finishedElections.length,
      electionsCleaned,
      voterSelfiesFound,
      voterSelfiesDeleted: dryRun ? 0 : voterSelfiesDeleted,
      candidateImagesFound,
      candidateImagesDeleted: dryRun ? 0 : candidateImagesDeleted,
      durationMs: Date.now() - startTime,
      samplePublicIds,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    console.error("cleanFinishedElectionImages error:", error);
    return {
      success: false,
      dryRun,
      electionsScanned: 0,
      electionsCleaned: 0,
      voterSelfiesFound: 0,
      voterSelfiesDeleted: 0,
      candidateImagesFound: 0,
      candidateImagesDeleted: 0,
      durationMs: Date.now() - startTime,
      errors: [error?.message || String(error)],
    };
  }
}
