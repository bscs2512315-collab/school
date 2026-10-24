import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

interface QASettings {
  enabled_questions: boolean;
  enabled_nova: boolean;
  enabled_teacher_paper: boolean;
}

const DEFAULT_SETTINGS: QASettings = {
  enabled_questions: true,
  enabled_nova: true,
  enabled_teacher_paper: true,
};

export async function GET() {
  try {
    const res = await db.query(
      `SELECT key, value FROM app_settings 
       WHERE key IN ('qa_bugs_enabled_questions', 'qa_bugs_enabled_nova', 'qa_bugs_enabled_teacher_paper')`
    );

    const settings: QASettings = { ...DEFAULT_SETTINGS };

    for (const row of res.rows) {
      if (row.key === "qa_bugs_enabled_questions") {
        settings.enabled_questions = row.value === "true" || row.value === true;
      } else if (row.key === "qa_bugs_enabled_nova") {
        settings.enabled_nova = row.value === "true" || row.value === true;
      } else if (row.key === "qa_bugs_enabled_teacher_paper") {
        settings.enabled_teacher_paper = row.value === "true" || row.value === true;
      }
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error("Error fetching QA settings:", error);
    return NextResponse.json({
      success: true,
      settings: DEFAULT_SETTINGS,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await verifyAuth(req);
    // Allow Admins or primary QA email
    const isAdmin =
      authUser?.role === "ADMIN" ||
      authUser?.email?.toLowerCase() === "mtahatalib110+aliya@gmail.com";

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { enabled_questions, enabled_nova, enabled_teacher_paper } = body;

    const updates = [
      { key: "qa_bugs_enabled_questions", val: String(Boolean(enabled_questions)) },
      { key: "qa_bugs_enabled_nova", val: String(Boolean(enabled_nova)) },
      { key: "qa_bugs_enabled_teacher_paper", val: String(Boolean(enabled_teacher_paper)) },
    ];

    for (const item of updates) {
      await db.query(
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [item.key, item.val]
      );
    }

    return NextResponse.json({
      success: true,
      message: "QA settings updated successfully.",
      settings: {
        enabled_questions: Boolean(enabled_questions),
        enabled_nova: Boolean(enabled_nova),
        enabled_teacher_paper: Boolean(enabled_teacher_paper),
      },
    });
  } catch (error: any) {
    console.error("Error updating QA settings:", error);
    return NextResponse.json(
      { error: "Failed to update QA settings", details: error.message },
      { status: 500 }
    );
  }
}
