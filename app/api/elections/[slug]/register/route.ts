import { errorResponse, successResponse } from "@/lib/response-handlers";
import { isReservedElectionSlug } from "@/lib/elections/slug";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/storage/file-upload";
import { rateLimitDistributed, getClientIp } from "@/lib/security/rate-limit";
import { readFormDataLimited } from "@/lib/security/form-data";
import { ElectionStatus } from "@/types/enums";
import type { PublicCandidateRegistration } from "@/types/election";
import {
  getElectionBySlug,
  getElectionStatus,
  insertElectionCandidate,
  listCandidates,
  mapElectionEvent,
  matchElectionCategory,
  normalizeElectionCategories,
  parseCandidateGender,
  findCandidateWithSymbol,
  toPublicCandidate,
} from "@/lib/teacher/election-schema";

async function toPublicRegistration(
  row: NonNullable<Awaited<ReturnType<typeof getElectionBySlug>>>,
): Promise<PublicCandidateRegistration> {
  const event = mapElectionEvent(row);
  const candidates = (await listCandidates(row.id)).map(toPublicCandidate);
  return {
    name: event.name,
    slug: event.slug,
    logoUrl: event.logoUrl,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    status: event.status,
    categories: event.categories,
    registrationClosed: event.registrationClosed,
    resultsApprovedAt: event.resultsApprovedAt,
    candidates,
  };
}

/**
 * GET /api/elections/:slug/register
 * Public candidate self-registration details. No login.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const normalized = slug.trim().toLowerCase();
    if (!normalized || isReservedElectionSlug(normalized)) {
      return errorResponse("Election not found", 404);
    }

    const row = await getElectionBySlug(normalized);
    if (!row) return errorResponse("Election not found", 404);

    return successResponse(await toPublicRegistration(row));
  } catch (error) {
    console.error("Public candidate register GET error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

/**
 * POST /api/elections/:slug/register
 * Candidates nominate themselves with name, photo, category, gender, and class.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const normalized = slug.trim().toLowerCase();
    if (!normalized || isReservedElectionSlug(normalized)) {
      return errorResponse("Election not found", 404);
    }

    const row = await getElectionBySlug(normalized);
    if (!row) return errorResponse("Election not found", 404);

    const status = getElectionStatus(row.starts_at, row.ends_at);
    if (status === ElectionStatus.ENDED) {
      return errorResponse("This election is closed", 403);
    }
    if (Boolean(row.registration_closed)) {
      return errorResponse("Candidate registration is closed", 403);
    }

    const categories = normalizeElectionCategories(row.categories);
    if (categories.length === 0) {
      return errorResponse("Candidate registration is not open yet", 403);
    }
    if (!(await rateLimitDistributed(`election:register:${row.id}:${getClientIp(req)}`, 5, 3600)) ||
        !(await rateLimitDistributed(`election:register:global:${row.id}`, 200, 3600))) {
      return errorResponse("Registration request limit reached", 429);
    }
    const form = await readFormDataLimited(req, 22 * 1024 * 1024);
    const name = String(form.get("name") || "").trim();
    const selectedCategory = String(
      form.get("category") || form.get("position") || "",
    ).trim();
    const gender = parseCandidateGender(String(form.get("gender") || "").trim());
    const classLevel = String(form.get("classLevel") || form.get("class") || "").trim();
    const profile = form.get("profile") ?? form.get("file");
    const symbol = form.get("symbol");
    let symbolName = String(form.get("symbolName") || "").trim();
    const category = matchElectionCategory(categories, selectedCategory);

    if (!name) return errorResponse("Name is required", 400);
    if (!category) {
      return errorResponse("Select a category from the list", 400);
    }
    if (!gender) return errorResponse("Gender is required", 400);
    if (!classLevel) return errorResponse("Class is required", 400);

    if (!(profile instanceof File) || profile.size === 0) {
      return errorResponse("A profile photo is required", 400);
    }
    const wantsSymbol = symbol instanceof File ? symbol.size > 0 : Boolean(symbol);

    if (wantsSymbol && !symbolName) {
      return errorResponse("Symbol name is required when a symbol is selected", 400);
    }

    if (symbolName) {
      const existing = await findCandidateWithSymbol(row.id, symbolName);
      if (existing) {
        return errorResponse(
          `A candidate with the symbol "${symbolName}" already exists`,
          409,
        );
      }
    }

    const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    const uploaded = await saveUploadedFile(profile, "elections/candidates", imageTypes);
    let symbolUpload: Awaited<ReturnType<typeof saveUploadedFile>> | undefined;
    try {
      let symbolUrl: string | undefined;
      if (wantsSymbol) {
        if (symbol instanceof File) {
          symbolUpload = await saveUploadedFile(symbol, "elections/candidates/symbols", imageTypes);
          symbolUrl = symbolUpload.fileUrl;
        } else {
          symbolUrl = String(symbol).trim();
        }
      }

      const candidate = await insertElectionCandidate({
        electionId: row.id, name, category, gender, classLevel,
        profileImageUrl: uploaded.fileUrl, symbolUrl,
        symbolName: symbolName || undefined,
      });

      return successResponse(candidate, "Registration submitted", 201);
    } catch (error) {
      await Promise.all([
        deleteUploadedFile(uploaded.fileUrl, uploaded.publicId),
        symbolUpload ? deleteUploadedFile(symbolUpload.fileUrl, symbolUpload.publicId) : Promise.resolve(),
      ]).catch(() => {});
      throw error;
    }
  } catch (error) {
    console.error("Public candidate register POST error:", error);
    if (error instanceof Error && error.message === "Upload is too large") return errorResponse(error.message, 413);
    return errorResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      500,
    );
  }
}
