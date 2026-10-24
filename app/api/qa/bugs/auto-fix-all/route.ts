import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    { success: false, error: "Batch auto-fix feature is disabled. QA bugs are tracked for developer manual resolution." },
    { status: 400 }
  );
}
