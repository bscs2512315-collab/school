import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await params;
    const res = await db.query(
      `SELECT id, question_id, category, description, status, fixed_at, verified_at, created_at, metadata
       FROM question_bugs
       WHERE question_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [questionId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ bug: null });
    }

    return NextResponse.json({ bug: res.rows[0] });
  } catch (error: any) {
    console.error("Error fetching question bug by ID:", error);
    return NextResponse.json(
      { error: "Failed to fetch question bug", details: error.message },
      { status: 500 }
    );
  }
}
