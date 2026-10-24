import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { saveUploadedFile } from "@/lib/storage/file-upload";
import {
  getElectionForTeacher,
  mapElectionCandidate,
  parseCandidateGender,
  ensureElectionCategory,
  findCandidateWithSymbol,
  type CandidateRow,
} from "@/lib/teacher/election-schema";

async function getOwnedCandidate(electionId: string, candidateId: string, teacherId: string) {
  const election = await getElectionForTeacher(electionId, teacherId);
  if (!election) return { election: null, candidate: null };

  const { rows } = await db.query(
    `SELECT c.*,
            (SELECT COUNT(*)::int FROM election_votes v WHERE v.candidate_id = c.id AND v.discarded_at IS NULL) AS vote_count
     FROM election_candidates c
     WHERE c.id = $1 AND c.election_id = $2
     LIMIT 1`,
    [candidateId, electionId],
  );
  return { election, candidate: rows[0] ?? null };
}

/**
 * PATCH /api/teacher/elections/:id/candidates/:candidateId
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; candidateId: string }> },
) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    const { id, candidateId } = await params;
    const { candidate } = await getOwnedCandidate(id, candidateId, user.userId);
    if (!candidate) return errorResponse("Candidate not found", 404);

    const contentType = req.headers.get("content-type") || "";
    let name = candidate.name as string;
    let category = (candidate.position as string | null) ?? "";
    let gender = parseCandidateGender(candidate.gender as string | null);
    let classLevel = candidate.class_level as string;
    let profileUrl = candidate.profile_image_url as string;
    let symbolUrl = (candidate.symbol_url as string | null) ?? null;
    let symbolName = (candidate.symbol_name as string | null) ?? "";
    let symbolRemoved = false;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      if (form.has("name")) name = String(form.get("name") || "").trim();
      if (form.has("category") || form.has("position")) {
        category = String(form.get("category") || form.get("position") || "").trim();
      }
      if (form.has("gender")) {
        gender = parseCandidateGender(String(form.get("gender") || "").trim());
      }
      if (form.has("classLevel") || form.has("class")) {
        classLevel = String(form.get("classLevel") || form.get("class") || "").trim();
      }
      const profile = form.get("profile") ?? form.get("file");
      if (profile instanceof File && profile.size > 0) {
        const uploaded = await saveUploadedFile(profile, "elections/candidates");
        profileUrl = uploaded.fileUrl;
      }
      const symbol = form.get("symbol");
      if (form.has("symbolName")) symbolName = String(form.get("symbolName") || "").trim();
      const clearSymbol = String(form.get("removeSymbol") || "") === "1";

      if (clearSymbol) {
        symbolUrl = null;
        symbolName = "";
        symbolRemoved = true;
      } else if (symbolName) {
        if (symbol instanceof File && symbol.size > 0) {
          const symbolUpload = await saveUploadedFile(symbol, "elections/candidates/symbols");
          symbolUrl = symbolUpload.fileUrl;
        } else if (typeof symbol === "string" && symbol.trim()) {
          symbolUrl = symbol.trim();
        }
      }
    } else {
      const body = await req.json();
      if (body.name !== undefined) name = String(body.name || "").trim();
      if (body.category !== undefined || body.position !== undefined) {
        category = String(body.category || body.position || "").trim();
      }
      if (body.gender !== undefined) {
        gender = parseCandidateGender(String(body.gender || "").trim());
      }
      if (body.classLevel !== undefined || body.class !== undefined) {
        classLevel = String(body.classLevel || body.class || "").trim();
      }
      if (body.symbolUrl !== undefined) {
        symbolUrl = body.symbolUrl ? String(body.symbolUrl).trim() : null;
      }
      if (body.symbolName !== undefined) {
        symbolName = String(body.symbolName || "").trim();
      }
      if (!symbolUrl || !symbolName) {
        symbolRemoved = true;
      }
    }

    if (!name) return errorResponse("Candidate name is required", 400);
    if (!category) return errorResponse("Category is required", 400);
    if (!gender) return errorResponse("Gender is required", 400);
    if (!classLevel) return errorResponse("Class is required", 400);

    if (symbolName && !symbolRemoved) {
      const existing = await findCandidateWithSymbol(id, symbolName, candidateId);
      if (existing) {
        return errorResponse(
          `A candidate with the symbol "${symbolName}" already exists`,
          409,
        );
      }
    }

    const { rows } = await db.query<CandidateRow>(
      `UPDATE election_candidates
       SET name = $1, position = $2, gender = $3, class_level = $4, profile_image_url = $5, symbol_url = $6, symbol_name = $7
       WHERE id = $8 AND election_id = $9
       RETURNING *,
         (SELECT COUNT(*)::int FROM election_votes v WHERE v.candidate_id = election_candidates.id AND v.discarded_at IS NULL) AS vote_count`,
      [name, category, gender, classLevel, profileUrl, symbolUrl, symbolName || null, candidateId, id],
    );
    await ensureElectionCategory(id, category);

    return successResponse(mapElectionCandidate(rows[0]), "Candidate updated");
  } catch (error) {
    console.error("Update candidate error:", error);
    return errorResponse("Failed to update candidate", 500);
  }
}

/**
 * DELETE /api/teacher/elections/:id/candidates/:candidateId
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; candidateId: string }> },
) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    const { id, candidateId } = await params;
    const { candidate } = await getOwnedCandidate(id, candidateId, user.userId);
    if (!candidate) return errorResponse("Candidate not found", 404);

    if (Number(candidate.vote_count) > 0) {
      return errorResponse(
        "This candidate already has votes and cannot be removed",
        409,
      );
    }

    await db.query(
      `DELETE FROM election_candidates WHERE id = $1 AND election_id = $2`,
      [candidateId, id],
    );

    return successResponse({ id: candidateId }, "Candidate removed");
  } catch (error) {
    console.error("Delete candidate error:", error);
    return errorResponse("Failed to remove candidate", 500);
  }
}
