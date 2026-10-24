import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authUser = await verifyAuth(req);
    const isAdmin =
      authUser?.role === "ADMIN" ||
      authUser?.role === "QA" ||
      authUser?.email?.toLowerCase() === "mtahatalib110+aliya@gmail.com";

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    // 1. Fetch all existing QA users
    const qaUsersRes = await db.query(
      `SELECT id, name, email, role, school_name, class, profile_image, created_at
       FROM users
       WHERE role = 'QA' OR email = 'mtahatalib110+aliya@gmail.com'
       ORDER BY created_at DESC`
    );

    // 2. If search query is provided, search signed-up app users who can be added as QA
    let candidateUsers: any[] = [];
    if (search.trim().length >= 2) {
      const searchRes = await db.query(
        `SELECT id, name, email, role, school_name, class, profile_image, created_at
         FROM users
         WHERE (name ILIKE $1 OR email ILIKE $1)
         ORDER BY (CASE WHEN role = 'QA' THEN 0 ELSE 1 END), created_at DESC
         LIMIT 15`,
        [`%${search.trim()}%`]
      );
      candidateUsers = searchRes.rows;
    }

    return NextResponse.json({
      success: true,
      qaUsers: qaUsersRes.rows,
      candidateUsers,
    });
  } catch (error: any) {
    console.error("Error fetching QA users:", error);
    return NextResponse.json(
      { error: "Failed to fetch QA users", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await verifyAuth(req);
    const isAdmin =
      authUser?.role === "ADMIN" ||
      authUser?.email?.toLowerCase() === "mtahatalib110+aliya@gmail.com";

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { userId, action, role } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const targetRole = action === "REMOVE" ? (role || "STUDENT") : "QA";

    const updateRes = await db.query(
      `UPDATE users 
       SET role = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, role`,
      [targetRole, userId]
    );

    if (updateRes.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = updateRes.rows[0];

    return NextResponse.json({
      success: true,
      message:
        action === "REMOVE"
          ? `User ${updatedUser.name || updatedUser.email} has been removed from QA team.`
          : `User ${updatedUser.name || updatedUser.email} has been promoted to QA team!`,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Error updating user QA status:", error);
    return NextResponse.json(
      { error: "Failed to update QA user", details: error.message },
      { status: 500 }
    );
  }
}
