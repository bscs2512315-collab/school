import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import {
  getElectionAnalytics,
  getElectionForTeacher,
  parseCandidateGender,
} from "@/lib/teacher/election-schema";
import type { ElectionVote, ElectionVotesPayload } from "@/types/election";

/**
 * GET /api/teacher/elections/:id/votes
 * Full voter log for audit — name, roll number, selfie, and chosen candidate.
 * Voters are not platform users.
 */
export async function GET(
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

    const { rows: voteRows } = await db.query(
      `SELECT v.id,
              v.election_id,
              v.candidate_id,
              v.voter_name,
              v.voter_roll_number,
              v.voter_selfie_url,
              v.discarded_at,
              v.discarded_reason,
              v.resolved_at,
              v.created_at,
              c.name AS candidate_name,
              c.position AS candidate_position,
              c.gender AS candidate_gender,
              c.class_level AS candidate_class_level,
              c.profile_image_url AS candidate_profile_image_url
       FROM election_votes v
       JOIN election_candidates c ON c.id = v.candidate_id
       WHERE v.election_id = $1
       ORDER BY v.created_at DESC`,
      [id],
    );

    const votes: ElectionVote[] = voteRows.map((row) => ({
      id: row.id,
      electionId: row.election_id,
      candidateId: row.candidate_id,
      candidateName: row.candidate_name,
      candidateCategory: row.candidate_position,
      candidateGender: parseCandidateGender(row.candidate_gender),
      candidateClassLevel: row.candidate_class_level,
      candidateProfileImageUrl: row.candidate_profile_image_url,
      voterName: row.voter_name,
      voterRollNumber: row.voter_roll_number,
      voterSelfieUrl: row.voter_selfie_url || null,
      discardedAt: row.discarded_at ? new Date(row.discarded_at).toISOString() : null,
      discardedReason: row.discarded_reason || null,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at).toISOString() : null,
      createdAt: new Date(row.created_at).toISOString(),
    }));

    const analytics = await getElectionAnalytics(id);
    const payload: ElectionVotesPayload = {
      votes,
      tallies: analytics.tallies,
    };

    return successResponse(payload);
  } catch (error) {
    console.error("List election votes error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
