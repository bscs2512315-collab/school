import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { enqueuePendingManualAttemptsForNovaGrading } from "@/lib/ai/nova-paper2-grade";
import {
  PAPER2_GRADING_MODE,
  PAPER2_GRADING_MODE_KEY,
} from "@/lib/settings/paper2-grading-mode";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";

async function ensureSettingsTable() {
  await db.query(`
        CREATE TABLE IF NOT EXISTS app_settings (
            key VARCHAR(255) PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(
      req as unknown as Parameters<typeof getAdminFromRequest>[0]
    );
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access required." },
        { status: 401 },
      );
    }

    await ensureSettingsTable();
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (key) {
      const { rows } = await db.query(
        `SELECT value FROM app_settings WHERE key = $1`,
        [key],
      );
      if (rows.length > 0) {
        return NextResponse.json({ success: true, key, value: rows[0].value });
      }
      return NextResponse.json({ success: true, key, value: null });
    } else {
      const { rows } = await db.query(`SELECT key, value FROM app_settings`);
      return NextResponse.json({ success: true, settings: rows });
    }
  } catch (error: any) {
    console.error("GET /api/admin/settings Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminFromRequest(
      req as unknown as Parameters<typeof getAdminFromRequest>[0]
    );
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access required." },
        { status: 401 },
      );
    }

    await ensureSettingsTable();
    const { key, value } = await req.json();

    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: key, value" },
        { status: 400 },
      );
    }

    await db.query(
      `INSERT INTO app_settings (key, value, updated_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      [key, value],
    );

    let queuedForNova = 0;
    if (key === PAPER2_GRADING_MODE_KEY && value === PAPER2_GRADING_MODE.AI) {
      queuedForNova = await enqueuePendingManualAttemptsForNovaGrading();
    }

    return NextResponse.json({
      success: true,
      message: "Setting updated successfully",
      data: { key, value, queuedForNova },
    });
  } catch (error: any) {
    console.error("POST /api/admin/settings Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update setting" },
      { status: 500 },
    );
  }
}
