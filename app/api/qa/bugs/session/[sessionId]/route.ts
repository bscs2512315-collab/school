import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const res = await db.query(
      `SELECT id, bug_type, session_id, status, category, description, created_at, fixed_at, verified_at
       FROM question_bugs
       WHERE session_id = $1 AND bug_type = 'NOVA_CHAT'
       ORDER BY created_at DESC
       LIMIT 1`,
      [sessionId]
    );

    return NextResponse.json({
      success: true,
      bug: res.rows[0] || null,
    });
  } catch (error: any) {
    console.error("Error fetching Nova session bug status:", error);
    return NextResponse.json(
      { error: "Failed to fetch bug status", details: error.message },
      { status: 500 }
    );
  }
}
