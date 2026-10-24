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
    const { name, logo_url, location, is_verified, boards } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: "School name is required" },
        { status: 400 }
      );
    }

    // Check existing school to detect name changes
    const { rows: existingRows } = await db.query<{ name: string }>(
      "SELECT name FROM admin_schools WHERE id = $1",
      [id]
    );

    if (existingRows.length === 0) {
      return NextResponse.json(
        { success: false, message: "School not found" },
        { status: 404 }
      );
    }

    const oldName = existingRows[0].name;
    const assignedBoards = Array.isArray(boards) && boards.length > 0 ? boards : ["AKUEB"];

    const { rows } = await db.query(
      "UPDATE admin_schools SET name = $1, logo_url = $2, location = $3, is_verified = $4, boards = $5::jsonb WHERE id = $6 RETURNING *",
      [
        name,
        logo_url || null,
        location || null,
        is_verified !== undefined ? is_verified : true,
        JSON.stringify(assignedBoards),
        id,
      ]
    );

    // If name changed, update users associated with the old school name
    if (oldName && oldName !== name) {
      await db.query(
        "UPDATE users SET school_name = $1 WHERE school_name = $2",
        [name, oldName]
      );
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error: any) {
    console.error("Error updating admin_school:", error);
    if (error.code === "23505") {
      return NextResponse.json(
        { success: false, message: "A school with this name already exists" },
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
      "DELETE FROM admin_schools WHERE id = $1",
      [id]
    );

    if (rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "School not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "School deleted successfully" });
  } catch (error) {
    console.error("Error deleting admin_school:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
