import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import {
  getElectionForTeacher,
  invalidateAnalyticsCache,
  invalidateElectionCache,
} from "@/lib/teacher/election-schema";
import { getRaceKey } from "@/lib/elections/races";

interface EditVoteChange {
  voteId?: string;
  raceKey?: string;
  candidateId: string;
}

/**
 * POST /api/teacher/elections/:id/votes/edit
 * Allows teacher to modify a voter's vote, reassigning the candidate in a race.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const election = await getElectionForTeacher(id, user.userId);
    if (!election) return errorResponse("Election not found", 404);

    const body = (await req.json().catch(() => null)) as {
      voteId?: unknown;
      candidateId?: unknown;
      raceKey?: unknown;
      voterRollNumber?: unknown;
      changes?: unknown;
      reason?: unknown;
    } | null;

    if (!body) {
      return errorResponse("Invalid request body", 400);
    }

    const changes: EditVoteChange[] = [];

    if (typeof body.voteId === "string" && typeof body.candidateId === "string") {
      changes.push({
        voteId: body.voteId.trim(),
        raceKey: typeof body.raceKey === "string" ? body.raceKey.trim() : undefined,
        candidateId: body.candidateId.trim(),
      });
    } else if (Array.isArray(body.changes) && body.changes.length > 0) {
      for (const item of body.changes) {
        if (
          item &&
          typeof item === "object" &&
          typeof (item as Record<string, unknown>).candidateId === "string"
        ) {
          const c = item as Record<string, unknown>;
          changes.push({
            voteId: typeof c.voteId === "string" ? c.voteId.trim() : undefined,
            raceKey: typeof c.raceKey === "string" ? c.raceKey.trim() : undefined,
            candidateId: String(c.candidateId).trim(),
          });
        }
      }
    }

    if (changes.length === 0) {
      return errorResponse("No vote changes provided", 400);
    }

    const voterRoll =
      typeof body.voterRollNumber === "string"
        ? body.voterRollNumber.trim()
        : "";

    let updatedCount = 0;

    for (const change of changes) {
      // 1. Verify candidate exists in this election
      const { rows: candRows } = await db.query(
        `SELECT id, name, position, gender
         FROM election_candidates
         WHERE id = $1 AND election_id = $2
         LIMIT 1`,
        [change.candidateId, id],
      );

      if (candRows.length === 0) {
        return errorResponse("Candidate not found in this election", 400);
      }

      const candidate = candRows[0];
      const targetRaceKey =
        change.raceKey || getRaceKey(candidate.position, candidate.gender);

      if (change.voteId) {
        // 2a. Update existing vote by voteId
        const { rowCount } = await db.query(
          `UPDATE election_votes
           SET candidate_id = $1,
               race_key = $2
           WHERE id = $3 AND election_id = $4`,
          [candidate.id, targetRaceKey, change.voteId, id],
        );
        updatedCount += Number(rowCount ?? 0);
      } else if (voterRoll) {
        // 2b. Update or insert by voterRollNumber + raceKey
        const normalizedRoll = voterRoll.toLowerCase();
        const { rows: existingVoteRows } = await db.query(
          `SELECT id FROM election_votes
           WHERE election_id = $1
             AND voter_roll_normalized = $2
             AND race_key = $3
             AND discarded_at IS NULL
           LIMIT 1`,
          [id, normalizedRoll, targetRaceKey],
        );

        if (existingVoteRows.length > 0) {
          const { rowCount } = await db.query(
            `UPDATE election_votes
             SET candidate_id = $1
             WHERE id = $2 AND election_id = $3`,
            [candidate.id, existingVoteRows[0].id, id],
          );
          updatedCount += Number(rowCount ?? 0);
        } else {
          // Find existing voter info to copy metadata
          const { rows: metaRows } = await db.query(
            `SELECT voter_name, voter_selfie_url, voter_email
             FROM election_votes
             WHERE election_id = $1 AND voter_roll_normalized = $2
             LIMIT 1`,
            [id, normalizedRoll],
          );
          const voterName = metaRows[0]?.voter_name || "Voter";
          const selfieUrl = metaRows[0]?.voter_selfie_url || null;
          const email = metaRows[0]?.voter_email || "";

          await db.query(
            `INSERT INTO election_votes (
               election_id, candidate_id, voter_name, voter_roll_number,
               voter_roll_normalized, voter_email, voter_selfie_url, race_key
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              id,
              candidate.id,
              voterName,
              voterRoll,
              normalizedRoll,
              email,
              selfieUrl,
              targetRaceKey,
            ],
          );
          updatedCount += 1;
        }
      }
    }

    // Invalidate caches so tallies and lists update immediately
    invalidateAnalyticsCache(election.slug);
    invalidateElectionCache(election.slug);
    invalidateElectionCache(id);

    return successResponse(
      { updatedCount },
      `${updatedCount} vote${updatedCount === 1 ? "" : "s"} updated successfully`,
    );
  } catch (error) {
    console.error("Edit election vote error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
