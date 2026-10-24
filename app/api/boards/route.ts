import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

let cachedBoards: Array<{ id: string | null; name: string; logo_url: string | null }> | null = null;
let lastFetched = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET() {
  const now = Date.now();
  if (cachedBoards && now - lastFetched < CACHE_TTL_MS) {
    return NextResponse.json(cachedBoards, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  }

  try {
    const { rows } = await db.query<{ id: string; name: string; logo_url: string | null }>(
      "SELECT id, name, logo_url FROM boards ORDER BY name ASC"
    );
    cachedBoards = rows;
    lastFetched = now;
    return NextResponse.json(rows, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error fetching boards:", error);
    if (cachedBoards) {
      return NextResponse.json(cachedBoards);
    }
    return NextResponse.json({ error: "Boards are temporarily unavailable" }, { status: 503 });
  }
}
