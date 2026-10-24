import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.query(
      "UPDATE brand_advertisements SET clicks = clicks + 1 WHERE id = $1",
      [id]
    );

    return NextResponse.json({ success: true, message: "Click recorded" });
  } catch (error) {
    console.error("Error recording ad click:", error);
    return NextResponse.json(
      { success: false, message: "Error recording click" },
      { status: 500 }
    );
  }
}
