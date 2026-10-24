import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await verifyAuth(req);
    const body = await req.json();
    const { status, description, resolutionNotes, rejectionReason } = body;

    const allowedStatuses = ["IN_PROGRESS", "FIXED", "VERIFIED", "REJECTED"];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const updates: string[] = ["updated_at = NOW()"];
    const values: any[] = [id];
    let paramIndex = 2;

    if (status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);

      if (status === "FIXED") {
        updates.push(`fixed_at = NOW()`);
      } else if (status === "VERIFIED") {
        updates.push(`verified_at = NOW()`);
        if (authUser?.userId) {
          updates.push(`verified_by_user_id = $${paramIndex++}`);
          values.push(authUser.userId);
        }
      } else if (status === "REJECTED") {
        if (authUser?.userId) {
          updates.push(`metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{rejected_by_user_id}', $${paramIndex++}::jsonb)`);
          values.push(JSON.stringify(authUser.userId));
        }
        updates.push(`metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{rejected_at}', $${paramIndex++}::jsonb)`);
        values.push(JSON.stringify(new Date().toISOString()));
      }
    }

    if (rejectionReason) {
      updates.push(`metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{rejection_reason}', $${paramIndex++}::jsonb)`);
      values.push(JSON.stringify(rejectionReason));
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }

    if (resolutionNotes !== undefined) {
      updates.push(`metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{resolution_notes}', $${paramIndex++}::jsonb)`);
      values.push(JSON.stringify(resolutionNotes));
    }

    const updateQuery = `
      UPDATE question_bugs
      SET ${updates.join(", ")}
      WHERE id = $1
      RETURNING *
    `;

    const res = await db.query(updateQuery, values);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }

    const updatedBug = res.rows[0];

    return NextResponse.json({
      success: true,
      message: `Bug status updated to ${updatedBug.status}`,
      bug: updatedBug,
    });
  } catch (error: any) {
    console.error("Error updating question bug:", error);
    return NextResponse.json(
      { error: "Failed to update bug", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await db.query(`DELETE FROM question_bugs WHERE id = $1 RETURNING id`, [id]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Bug deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting question bug:", error);
    return NextResponse.json(
      { error: "Failed to delete bug", details: error.message },
      { status: 500 }
    );
  }
}
