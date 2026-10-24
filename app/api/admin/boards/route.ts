import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";

const unauthorized = () =>
  NextResponse.json(
    { success: false, message: "Unauthorized. Admin access required." },
    { status: 401 }
  );

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(
      req as unknown as Parameters<typeof getAdminFromRequest>[0]
    );
    if (!admin) return unauthorized();

    const { rows } = await db.query(
      "SELECT * FROM boards ORDER BY created_at DESC"
    );
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching boards:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminFromRequest(
      req as unknown as Parameters<typeof getAdminFromRequest>[0]
    );
    if (!admin) return unauthorized();

    const body = await req.json();
    const { name, logo_url } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Board name is required" },
        { status: 400 }
      );
    }

    const { rows } = await db.query(
      "INSERT INTO boards (name, logo_url) VALUES ($1, $2) RETURNING *",
      [name, logo_url || null]
    );

    return NextResponse.json({ success: true, data: rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating board:", error);
    if (error.code === '23505') { // Unique violation
      return NextResponse.json(
        { success: false, message: "A board with this name already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
