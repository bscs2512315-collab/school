import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";

const unauthorized = () =>
  NextResponse.json(
    { success: false, message: "Unauthorized. Admin access required." },
    { status: 401 }
  );

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromRequest(
      req as unknown as Parameters<typeof getAdminFromRequest>[0]
    );
    if (!admin) return unauthorized();

    const { id } = await params;
    const body = await req.json();
    const { name, logo_url } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Board name is required" },
        { status: 400 }
      );
    }

    const { rows } = await db.query(
      "UPDATE boards SET name = $1, logo_url = $2 WHERE id = $3 RETURNING *",
      [name, logo_url || null, id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Board not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error: any) {
    console.error("Error updating board:", error);
    if (error.code === '23505') {
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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromRequest(
      req as unknown as Parameters<typeof getAdminFromRequest>[0]
    );
    if (!admin) return unauthorized();

    const { id } = await params;

    const { rowCount } = await db.query(
      "DELETE FROM boards WHERE id = $1",
      [id]
    );

    if (rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "Board not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Board deleted successfully" });
  } catch (error) {
    console.error("Error deleting board:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
