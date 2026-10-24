import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * @openapi
 * /api/subjects:
 *   get:
 *     summary: List active subjects
 *     description: Public list of active subjects used across the app (filters, dropdowns).
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Array of subjects
 */
export const dynamic = "force-dynamic";

let cachedSubjects: Array<{ id: string; name: string; category: string | null }> | null = null;
let lastFetched = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET() {
  const now = Date.now();
  if (cachedSubjects && now - lastFetched < CACHE_TTL_MS) {
    return NextResponse.json(cachedSubjects, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  }

  try {
    // Only live subjects reach students; "coming soon" ones are admin-only.
    const { rows } = await db.query<{ id: string; name: string; category: string | null }>(
      `SELECT id, name, category FROM subjects
       WHERE is_active = true AND coming_soon = false
       ORDER BY name ASC`,
    );
    cachedSubjects = rows;
    lastFetched = now;
    return NextResponse.json(rows, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    if (cachedSubjects) {
      return NextResponse.json(cachedSubjects);
    }
    return NextResponse.json({ error: "Subjects are temporarily unavailable" }, { status: 503 });
  }
}
