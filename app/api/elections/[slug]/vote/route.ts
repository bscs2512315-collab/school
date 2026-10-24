import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/response-handlers";
import { ElectionStatus } from "@/types/enums";
import { normalizeRollNumber } from "@/lib/elections/slug";
import { formatRaceLabel, getRaceKey } from "@/lib/elections/races";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/storage/file-upload";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { UserRole } from "@/types/enums";
import { rateLimitDistributed } from "@/lib/security/rate-limit";
import type { NextRequest } from "next/server";
import { readFormDataLimited } from "@/lib/security/form-data";
import {
  getElectionBySlug,
  getElectionStatus,
  invalidateAnalyticsCache,
} from "@/lib/teacher/election-schema";

/**
 * POST /api/elections/:slug/vote
 * A school-registered student may vote with their roster roll number.
 * One vote per category (category + gender) per roll number.
 * The school account, not the form fields, establishes eligibility.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const row = await getElectionBySlug(slug.trim().toLowerCase());
    if (!row) return errorResponse("Election not found", 404);

    const status = getElectionStatus(row.starts_at, row.ends_at);
    if (status === ElectionStatus.UPCOMING) {
      return errorResponse("Voting has not started yet", 403);
    }
    if (status === ElectionStatus.ENDED) {
      return errorResponse("This election is closed", 403);
    }

    const user = await getUserFromRequest(req);
    if (!user || (user.role !== UserRole.STUDENT && user.role !== UserRole.QA && user.role !== "QA")) {
      return errorResponse("Sign in as an eligible student to vote", 401);
    }
    if (!(await rateLimitDistributed(`election:vote:${row.id}:${user.userId}`, 10, 3600)) ||
        !(await rateLimitDistributed(`election:vote:global:${row.id}`, 2000, 3600))) {
      return errorResponse("Voting request limit reached", 429);
    }
    const form = await readFormDataLimited(req, 12 * 1024 * 1024);
    const voterName = String(form.get("name") || form.get("voterName") || "").trim();
    const voterRollNumber = String(
      form.get("rollNumber") || form.get("voterRollNumber") || "",
    ).trim();
    const selfie = form.get("selfie");
    const candidateIds = parseCandidateIds(form);

    if (!voterName) return errorResponse("Name is required", 400);
    if (!voterRollNumber) return errorResponse("Roll number is required", 400);
    if (!(selfie instanceof File) || selfie.size === 0) {
      return errorResponse("A live selfie is required", 400);
    }

    const allowedSelfieMimes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
    if (!allowedSelfieMimes.has(selfie.type.toLowerCase())) {
      return errorResponse("Only JPEG, PNG, and WebP selfie images are allowed", 400);
    }

    if (candidateIds.length === 0) {
      return errorResponse("Select a candidate", 400);
    }

    const rollNormalized = normalizeRollNumber(voterRollNumber);
    if (!rollNormalized) {
      return errorResponse("Roll number is required", 400);
    }
    const { rows: eligibleRows } = await db.query<{
      name: string; registration_id: string; school_name: string;
    }>(
      `SELECT s.name, s.registration_id, s.school_name FROM users s
       JOIN users t ON t.id = $2
       WHERE s.id = $1 AND s.role = $3 AND s.is_verified = TRUE
         AND s.registered_by_school = TRUE AND s.registration_id IS NOT NULL
         AND t.registered_by_school = TRUE AND t.school_id IS NOT NULL
         AND s.school_id = t.school_id`,
      [user.userId, row.teacher_id, UserRole.STUDENT],
    );
    const eligible = eligibleRows[0];
    if (!eligible || normalizeRollNumber(eligible.registration_id) !== rollNormalized ||
        eligible.name.trim().toLowerCase() !== voterName.toLowerCase()) {
      return errorResponse("Voter identity does not match the school roster", 403);
    }

    const { rows: candidateRows } = await db.query<{
      id: string;
      position: string | null;
      gender: string | null;
    }>(
      `SELECT id, position, gender FROM election_candidates
       WHERE election_id = $1 AND id = ANY($2::uuid[])`,
      [row.id, candidateIds],
    );

    if (candidateRows.length !== candidateIds.length) {
      return errorResponse("Candidate not found", 404);
    }

    const candidatesById = new Map(candidateRows.map((candidate) => [candidate.id, candidate]));
    const chosen = candidateIds.map((id) => {
      const candidate = candidatesById.get(id);
      if (!candidate) return null;
      const raceKey = getRaceKey(candidate.position, candidate.gender);
      return {
        id,
        raceKey,
        label: formatRaceLabel(candidate.position, candidate.gender),
      };
    });

    if (chosen.some((item) => item === null)) {
      return errorResponse("Candidate not found", 404);
    }

    const picks = chosen.filter((item): item is NonNullable<typeof item> => item !== null);
    const raceKeys = new Set<string>();
    for (const pick of picks) {
      if (raceKeys.has(pick.raceKey)) {
        return errorResponse(
          `Select only one candidate for ${pick.label}`,
          400,
        );
      }
      raceKeys.add(pick.raceKey);
    }

    const { rows: existingVotes } = await db.query<{
      voter_roll_normalized: string;
      race_key: string;
    }>(
      `SELECT voter_roll_normalized, race_key
       FROM election_votes
       WHERE election_id = $1
         AND race_key = ANY($2)
         AND voter_roll_normalized = $3`,
      [row.id, [...raceKeys], rollNormalized],
    );

    const alreadyVoted = picks.find((pick) =>
      existingVotes.some((vote) => vote.race_key === pick.raceKey),
    );
    if (alreadyVoted) {
      return errorResponse(
        `This roll number has already voted in ${alreadyVoted.label}`,
        409,
      );
    }

    // Only upload selfie AFTER candidate validation and duplicate check pass
    const uploaded = await saveUploadedFile(selfie, "elections/voters", new Set([
      "image/jpeg", "image/png", "image/webp",
    ]));
    const selfieUrl = uploaded.fileUrl;

    // Batch insert all category picks in a single query for maximum throughput
    const valuePlaceholders: string[] = [];
    const values: unknown[] = [];
    let pIdx = 1;

    for (const pick of picks) {
      valuePlaceholders.push(
        `($${pIdx}, $${pIdx + 1}, $${pIdx + 2}, $${pIdx + 3}, $${pIdx + 4}, $${pIdx + 5}, $${pIdx + 6}, $${pIdx + 7})`,
      );
      values.push(
        row.id,
        pick.id,
        voterName,
        voterRollNumber,
        rollNormalized,
        "",
        selfieUrl,
        pick.raceKey,
      );
      pIdx += 8;
    }

    const insertSql = `
      INSERT INTO election_votes
        (election_id, candidate_id, voter_name, voter_roll_number, voter_roll_normalized, voter_email, voter_selfie_url, race_key)
      VALUES ${valuePlaceholders.join(", ")}
    `;

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(insertSql, values);
      await client.query("COMMIT");
    } catch (error: unknown) {
      await client.query("ROLLBACK");
      await deleteUploadedFile(uploaded.fileUrl, uploaded.publicId).catch(() => {});
      const code =
        typeof error === "object" && error && "code" in error
          ? String((error as { code: unknown }).code)
          : "";
      if (code === "23505") {
        return errorResponse("This roll number has already voted in that category", 409);
      }
      throw error;
    } finally {
      client.release();
    }

    // Invalidate analytics cache so fresh tally reflects immediately
    invalidateAnalyticsCache(row.slug);

    return successResponse(
      { ok: true, voteCount: picks.length },
      picks.length === 1 ? "Vote submitted" : "Votes submitted",
    );
  } catch (error) {
    console.error("Public vote error:", error);
    if (error instanceof Error && error.message === "Upload is too large") return errorResponse(error.message, 413);
    return errorResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      500,
    );
  }
}

function parseCandidateIds(form: FormData): string[] {
  const raw = form.get("candidateIds");
  const fromJson = parseJsonIds(raw);
  const fromSingle = String(form.get("candidateId") || "").trim();
  const ids = fromJson.length > 0 ? fromJson : fromSingle ? [fromSingle] : [];
  return [...new Set(ids)];
}

function parseJsonIds(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((id) => String(id || "").trim()).filter(Boolean);
  } catch {
    return [];
  }
}
