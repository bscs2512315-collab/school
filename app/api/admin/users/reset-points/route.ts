import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { successResponse, errorResponse } from "@/lib/response-handlers";

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const usersResult = await client.query<{ id: string }>(
      `UPDATE users 
       SET points = 0, 
           rank = NULL, 
           school_points_at_transfer = 0 
       RETURNING id;`,
    );

    await client.query("DELETE FROM school_points_snapshots;");

    await client.query("COMMIT");

    return successResponse(
      {
        resetCount: usersResult.rowCount || 0,
      },
      `Successfully reset leaderboard points to 0 for ${usersResult.rowCount || 0} users.`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Reset points error:", error);
    return errorResponse("Failed to reset leaderboard points.", 500);
  } finally {
    client.release();
  }
}
