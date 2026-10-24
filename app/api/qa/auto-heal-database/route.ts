import { NextRequest, NextResponse } from "next/server";
import { autoHealDummyQuestions } from "@/lib/ai/proactive-db-healer";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    { success: false, error: "Auto-healer is disabled. QA bugs are tracked for developer manual resolution." },
    { status: 400 }
  );
}
