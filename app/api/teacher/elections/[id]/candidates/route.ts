import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { saveUploadedFile } from "@/lib/storage/file-upload";
import {
  getElectionForTeacher,
  insertElectionCandidate,
  ensureElectionCategory,
  parseCandidateGender,
  findCandidateWithSymbol,
} from "@/lib/teacher/election-schema";

/**
 * POST /api/teacher/elections/:id/candidates
 * Candidates are school nominees — not platform registered users.
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

    if (Boolean(election.registration_closed)) {
      return errorResponse("Candidate registration is closed", 403);
    }

    const form = await req.formData();
    const name = String(form.get("name") || "").trim();
    const category = String(
      form.get("category") || form.get("position") || "",
    ).trim();
    const gender = parseCandidateGender(String(form.get("gender") || "").trim());
    const classLevel = String(form.get("classLevel") || form.get("class") || "").trim();
    const profile = form.get("profile") ?? form.get("file");
    const symbol = form.get("symbol");
    let symbolName = String(form.get("symbolName") || "").trim();

    if (!name) return errorResponse("Candidate name is required", 400);
    if (!category) return errorResponse("Category is required", 400);
    if (!gender) return errorResponse("Gender is required", 400);
    if (!classLevel) return errorResponse("Class is required", 400);

    if (!(profile instanceof File) || profile.size === 0) {
      return errorResponse("Candidate profile photo is required", 400);
    }
    const uploaded = await saveUploadedFile(profile, "elections/candidates");
    const profileUrl = uploaded.fileUrl;

    let symbolUrl: string | undefined;
    const wantsSymbol = symbol instanceof File ? symbol.size > 0 : Boolean(symbol);

    if (wantsSymbol) {
      if (symbol instanceof File) {
        const symbolUpload = await saveUploadedFile(symbol, "elections/candidates/symbols");
        symbolUrl = symbolUpload.fileUrl;
      } else {
        symbolUrl = String(symbol).trim();
      }
    }

    if (wantsSymbol && !symbolName) {
      return errorResponse("Symbol name is required when a symbol is selected", 400);
    }

    if (symbolName) {
      const existing = await findCandidateWithSymbol(id, symbolName);
      if (existing) {
        return errorResponse(
          `A candidate with the symbol "${symbolName}" already exists`,
          409,
        );
      }
    }

    const candidate = await insertElectionCandidate({
      electionId: id,
      name,
      category,
      gender,
      classLevel,
      profileImageUrl: profileUrl,
      symbolUrl,
      symbolName: symbolName || undefined,
    });
    await ensureElectionCategory(id, category);

    return successResponse(candidate, "Candidate added", 201);
  } catch (error) {
    console.error("Add candidate error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to add candidate",
      500,
    );
  }
}
