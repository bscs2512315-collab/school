import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import {
  ensureElectionSchema,
  getElectionForTeacher,
  listCandidates,
  mapElectionEvent,
  normalizeElectionCategories,
  type ElectionRow,
} from "@/lib/teacher/election-schema";
import { isValidElectionSlug } from "@/lib/elections/slug";
import { getRequestOrigin } from "@/lib/site";
import type { ElectionDetail } from "@/types/election";

async function requireTeacher(req: Request) {
  const user = await verifyAuth(req);
  if (!user || user.role !== UserRole.TEACHER) return null;
  return user;
}

/**
 * GET /api/teacher/elections/:id
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireTeacher(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const row = await getElectionForTeacher(id, user.userId);
    if (!row) return errorResponse("Election not found", 404);

    const event = mapElectionEvent(row, getRequestOrigin(req));
    const candidates = await listCandidates(id, true);
    const payload: ElectionDetail = { ...event, candidates };
    return successResponse(payload);
  } catch (error) {
    console.error("Get election error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

/**
 * PATCH /api/teacher/elections/:id
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireTeacher(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const existing = await getElectionForTeacher(id, user.userId);
    if (!existing) return errorResponse("Election not found", 404);

    const body = await req.json();
    const name =
      body.name !== undefined ? String(body.name || "").trim() : existing.name;
    const slug =
      body.slug !== undefined
        ? String(body.slug || "").trim().toLowerCase()
        : existing.slug;
    const startsAt = body.startsAt
      ? new Date(String(body.startsAt))
      : new Date(existing.starts_at);
    const endsAt = body.endsAt
      ? new Date(String(body.endsAt))
      : new Date(existing.ends_at);
    const categories =
      body.categories !== undefined
        ? normalizeElectionCategories(body.categories)
        : normalizeElectionCategories(existing.categories);
    const registrationClosed =
      body.registrationClosed !== undefined
        ? Boolean(body.registrationClosed)
        : Boolean(existing.registration_closed);
    const showLiveResults =
      body.showLiveResults !== undefined
        ? Boolean(body.showLiveResults)
        : existing.show_live_results ?? true;

    if (!name) return errorResponse("Election name is required", 400);
    if (!isValidElectionSlug(slug)) {
      return errorResponse(
        "Use a public URL slug like hpgs-elections (letters, numbers, hyphens)",
        400,
      );
    }
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      return errorResponse("Start and end time are required", 400);
    }
    if (endsAt <= startsAt) {
      return errorResponse("End time must be after the start time", 400);
    }

    if (slug !== existing.slug) {
      const { rows: slugRows } = await db.query(
        `SELECT id FROM election_events WHERE slug = $1 AND id != $2 LIMIT 1`,
        [slug, id],
      );
      if (slugRows.length > 0) {
        return errorResponse("That public URL is already in use", 409);
      }
    }

    await ensureElectionSchema();
    const { rows } = await db.query<ElectionRow>(
      `UPDATE election_events
       SET name = $1, slug = $2, starts_at = $3, ends_at = $4, categories = $5,
           registration_closed = $6, show_live_results = $7, updated_at = NOW()
       WHERE id = $8 AND teacher_id = $9
       RETURNING *,
         (SELECT COUNT(*)::int FROM election_candidates c WHERE c.election_id = election_events.id) AS candidate_count,
         (SELECT COUNT(*)::int FROM election_votes v WHERE v.election_id = election_events.id AND v.discarded_at IS NULL) AS vote_count`,
      [
        name,
        slug,
        startsAt.toISOString(),
        endsAt.toISOString(),
        categories,
        registrationClosed,
        showLiveResults,
        id,
        user.userId,
      ],
    );

    return successResponse(
      mapElectionEvent(rows[0], getRequestOrigin(req)),
      "Election updated",
    );
  } catch (error) {
    console.error("Update election error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

/**
 * DELETE /api/teacher/elections/:id
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireTeacher(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const existing = await getElectionForTeacher(id, user.userId);
    if (!existing) return errorResponse("Election not found", 404);

    await db.query(
      `DELETE FROM election_votes WHERE election_id = $1`,
      [id],
    );
    await db.query(
      `DELETE FROM election_candidates WHERE election_id = $1`,
      [id],
    );
    await db.query(
      `DELETE FROM election_events WHERE id = $1 AND teacher_id = $2`,
      [id, user.userId],
    );

    return successResponse({ id }, "Election deleted");
  } catch (error) {
    console.error("Delete election error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
