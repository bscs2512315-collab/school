import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/response-handlers";
import { ensureLightningSchema } from "@/lib/lightning/lightning-schema";

export async function POST(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request);
    const body = await request.json();

    const { pinCode, userId: bodyUserId, name: bodyName } = body;
    const userId = auth?.userId || bodyUserId;

    if (!pinCode) {
      return errorResponse("Please enter a 6-digit Game PIN", 400);
    }

    const cleanPin = String(pinCode).trim().replace(/\s+/g, "");
    if (!/^\d{6}$/.test(cleanPin)) {
      return errorResponse("Game PIN must be a 6-digit number", 400);
    }

    await ensureLightningSchema();

    const { rows: sessionRows } = await db.query<{
      id: string;
      creator_id: string;
      creator_role: string;
      title: string;
      subject: string;
      class_level: string;
      status: string;
      phase: string;
      per_question_seconds: number;
    }>(
      `SELECT id, creator_id, creator_role, title, subject, class_level, status, phase, per_question_seconds 
       FROM lightning_sessions 
       WHERE pin_code = $1`,
      [cleanPin],
    );

    if (sessionRows.length === 0) {
      return errorResponse("No game found with this PIN. Check the code and try again.", 404);
    }

    const session = sessionRows[0];

    if (session.status === "COMPLETED" || session.status === "CANCELLED") {
      return errorResponse("This Lightning Round session has already ended.", 400);
    }

    // Lookup user details
    let participantName = bodyName || "Player";
    let participantUsername: string | null = null;
    let participantImage: string | null = null;

    if (userId) {
      const { rows: userRows } = await db.query<{
        name: string;
        username: string | null;
        profile_image: string | null;
      }>(`SELECT name, username, profile_image FROM users WHERE id = $1`, [userId]);

      if (userRows[0]) {
        participantName = userRows[0].name;
        participantUsername = userRows[0].username;
        participantImage = userRows[0].profile_image;
      }
    }

    const effectiveUserId = userId || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Check if user is already a participant (rejoin check)
    const { rows: existingPart } = await db.query<{ id: string }>(
      `SELECT id FROM lightning_participants WHERE session_id = $1 AND user_id = $2`,
      [session.id, effectiveUserId],
    );

    const isHost = session.creator_id === effectiveUserId;
    const isTeacherHost = isHost && session.creator_role === "TEACHER";

    if (existingPart.length > 0) {
      // Reconnection
      await db.query(
        `UPDATE lightning_participants 
         SET is_connected = true, last_active_at = NOW() 
         WHERE id = $1`,
        [existingPart[0].id],
      );

      return successResponse({
        sessionId: session.id,
        pinCode: cleanPin,
        isHost,
        isRejoin: true,
        title: session.title,
        subject: session.subject,
        classLevel: session.class_level,
        status: session.status,
        phase: session.phase,
      });
    }

    // Teacher hosts should not be registered as student participants attempting the quiz
    if (isTeacherHost) {
      return successResponse({
        sessionId: session.id,
        pinCode: cleanPin,
        isHost: true,
        isRejoin: false,
        title: session.title,
        subject: session.subject,
        classLevel: session.class_level,
        status: session.status,
        phase: session.phase,
      });
    }

    // New participant joining
    if (session.status !== "LOBBY") {
      return errorResponse(
        "Game is already in progress. Only players who joined in the lobby can participate.",
        403,
      );
    }

    await db.query(
      `INSERT INTO lightning_participants (
        session_id, user_id, name, username, profile_image, is_connected
      ) VALUES ($1, $2, $3, $4, $5, true)`,
      [session.id, effectiveUserId, participantName, participantUsername, participantImage],
    );

    return successResponse({
      sessionId: session.id,
      pinCode: cleanPin,
      isHost,
      isRejoin: false,
      title: session.title,
      subject: session.subject,
      classLevel: session.class_level,
      status: session.status,
      phase: session.phase,
    });
  } catch (error: any) {
    console.error("Error joining lightning session:", error);
    return errorResponse(error?.message || "Internal server error joining session", 500);
  }
}
