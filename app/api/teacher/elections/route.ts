import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { saveUploadedFile } from "@/lib/storage/file-upload";
import {
  ensureElectionSchema,
  mapElectionEvent,
  type ElectionRow,
} from "@/lib/teacher/election-schema";
import {
  isValidElectionSlug,
  slugifyElectionName,
} from "@/lib/elections/slug";
import { getRequestOrigin } from "@/lib/site";

async function requireTeacher(req: Request) {
  const user = await verifyAuth(req);
  if (!user || user.role !== UserRole.TEACHER) {
    return null;
  }
  return user;
}

/**
 * GET /api/teacher/elections
 * List elections created by this teacher. Voters are not platform users.
 */
export async function GET(req: Request) {
  try {
    const user = await requireTeacher(req);
    if (!user) return errorResponse("Unauthorized", 401);

    await ensureElectionSchema();
    const { rows } = await db.query<ElectionRow>(
      `SELECT e.*,
              (SELECT COUNT(*)::int FROM election_candidates c WHERE c.election_id = e.id) AS candidate_count,
              (SELECT COUNT(*)::int FROM election_votes v WHERE v.election_id = e.id AND v.discarded_at IS NULL) AS vote_count
       FROM election_events e
       WHERE e.teacher_id = $1
       ORDER BY e.created_at DESC`,
      [user.userId],
    );

    return successResponse(
      rows.map((row) => mapElectionEvent(row, getRequestOrigin(req))),
    );
  } catch (error) {
    console.error("List elections error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

/**
 * POST /api/teacher/elections
 * Create an election event (name, optional logo, voting window, public slug).
 */
export async function POST(req: Request) {
  try {
    const user = await requireTeacher(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const contentType = req.headers.get("content-type") || "";
    let name = "";
    let slug = "";
    let startsAtRaw = "";
    let endsAtRaw = "";
    let logoFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      name = String(form.get("name") || "").trim();
      slug = String(form.get("slug") || "").trim().toLowerCase();
      startsAtRaw = String(form.get("startsAt") || "").trim();
      endsAtRaw = String(form.get("endsAt") || "").trim();
      const uploaded = form.get("logo");
      logoFile = uploaded instanceof File && uploaded.size > 0 ? uploaded : null;
    } else {
      const body = await req.json();
      name = String(body.name || "").trim();
      slug = String(body.slug || "").trim().toLowerCase();
      startsAtRaw = String(body.startsAt || "").trim();
      endsAtRaw = String(body.endsAt || "").trim();
    }

    if (!name) return errorResponse("Election name is required", 400);

    const resolvedSlug = slug || slugifyElectionName(name);
    if (!isValidElectionSlug(resolvedSlug)) {
      return errorResponse(
        "Use a public URL slug like hpgs-elections (letters, numbers, hyphens)",
        400,
      );
    }

    const startsAt = new Date(startsAtRaw);
    const endsAt = new Date(endsAtRaw);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      return errorResponse("Start and end time are required", 400);
    }
    if (endsAt <= startsAt) {
      return errorResponse("End time must be after the start time", 400);
    }

    await ensureElectionSchema();

    const { rows: slugRows } = await db.query(
      `SELECT id FROM election_events WHERE slug = $1 LIMIT 1`,
      [resolvedSlug],
    );
    if (slugRows.length > 0) {
      return errorResponse("That public URL is already in use", 409);
    }

    let logoUrl: string | null = null;
    if (logoFile) {
      const uploaded = await saveUploadedFile(logoFile, "elections");
      logoUrl = uploaded.fileUrl;
    }

    const { rows } = await db.query<ElectionRow>(
      `INSERT INTO election_events
         (teacher_id, name, slug, logo_url, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *, 0 AS candidate_count, 0 AS vote_count`,
      [user.userId, name, resolvedSlug, logoUrl, startsAt.toISOString(), endsAt.toISOString()],
    );

    return successResponse(
      mapElectionEvent(rows[0], getRequestOrigin(req)),
      "Election created",
      201,
    );
  } catch (error) {
    console.error("Create election error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
