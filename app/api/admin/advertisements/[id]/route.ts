import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";

const unauthorized = () =>
  NextResponse.json(
    { success: false, message: "Unauthorized. Admin access required." },
    { status: 401 }
  );

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(
      req as unknown as Parameters<typeof getAdminFromRequest>[0]
    );
    if (!admin) return unauthorized();

    const { id } = await params;
    const { rows } = await db.query(
      "SELECT * FROM brand_advertisements WHERE id = $1",
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Advertisement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error fetching advertisement:", error);
    return NextResponse.json(
      { success: false, message: "Server error fetching advertisement" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(
      req as unknown as Parameters<typeof getAdminFromRequest>[0]
    );
    if (!admin) return unauthorized();

    const { id } = await params;
    const body = await req.json();
    const {
      brand_name,
      tagline,
      image_url,
      target_url,
      placement,
      is_active,
      display_order,
      start_date,
      end_date,
      reset_stats,
    } = body;

    const existing = await db.query(
      "SELECT * FROM brand_advertisements WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Advertisement not found" },
        { status: 404 }
      );
    }

    const current = existing.rows[0];

    const updatedBrandName = brand_name !== undefined ? brand_name.trim() : current.brand_name;
    const updatedTagline = tagline !== undefined ? (tagline ? tagline.trim() : null) : current.tagline;
    const updatedImageUrl = image_url !== undefined ? image_url.trim() : current.image_url;
    const updatedTargetUrl = target_url !== undefined ? (target_url ? target_url.trim() : null) : current.target_url;
    const updatedPlacement = placement !== undefined ? placement : current.placement;
    const updatedIsActive = is_active !== undefined ? Boolean(is_active) : current.is_active;
    const updatedDisplayOrder = display_order !== undefined ? Number(display_order) : current.display_order;
    const updatedStartDate = start_date !== undefined ? (start_date ? new Date(start_date) : null) : current.start_date;
    const updatedEndDate = end_date !== undefined ? (end_date ? new Date(end_date) : null) : current.end_date;

    const impressionsVal = reset_stats ? 0 : current.impressions;
    const clicksVal = reset_stats ? 0 : current.clicks;

    const { rows } = await db.query(
      `UPDATE brand_advertisements SET
        brand_name = $1,
        tagline = $2,
        image_url = $3,
        target_url = $4,
        placement = $5,
        is_active = $6,
        display_order = $7,
        start_date = $8,
        end_date = $9,
        impressions = $10,
        clicks = $11,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *`,
      [
        updatedBrandName,
        updatedTagline,
        updatedImageUrl,
        updatedTargetUrl,
        updatedPlacement,
        updatedIsActive,
        updatedDisplayOrder,
        updatedStartDate,
        updatedEndDate,
        impressionsVal,
        clicksVal,
        id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Advertisement updated successfully",
      data: rows[0],
    });
  } catch (error: any) {
    console.error("Error updating advertisement:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Server error updating advertisement" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(
      req as unknown as Parameters<typeof getAdminFromRequest>[0]
    );
    if (!admin) return unauthorized();

    const { id } = await params;
    const { rows } = await db.query(
      "DELETE FROM brand_advertisements WHERE id = $1 RETURNING id",
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Advertisement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Advertisement deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting advertisement:", error);
    return NextResponse.json(
      { success: false, message: "Server error deleting advertisement" },
      { status: 500 }
    );
  }
}
