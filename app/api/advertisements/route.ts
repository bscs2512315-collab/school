import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const placement = searchParams.get("placement") || "dashboard_showcase";

    // Query active ads that match requested placement, parent placement, or global
    const { rows } = await db.query(
      `SELECT id, brand_name, tagline, image_url, target_url, placement, display_order
       FROM brand_advertisements
       WHERE is_active = TRUE
         AND (
           placement = $1 
           OR placement = 'all'
           OR ($1 = 'paper_1' AND placement IN ('all_papers', 'paper_header'))
           OR ($1 = 'paper_2' AND placement IN ('all_papers', 'paper_header'))
           OR ($1 = 'paper_header' AND placement IN ('paper_1', 'paper_2', 'all_papers'))
           OR ($1 = 'all_papers' AND placement IN ('paper_1', 'paper_2', 'paper_header'))
         )
         AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
         AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP)
       ORDER BY display_order ASC, created_at DESC`,
      [placement]
    );

    // Atomically increment impression counts for delivered ads
    if (rows.length > 0) {
      const adIds = rows.map((r) => r.id);
      db.query(
        "UPDATE brand_advertisements SET impressions = impressions + 1 WHERE id = ANY($1)",
        [adIds]
      ).catch((err) => {
        console.error("Failed to update ad impressions:", err);
      });
    }

    // Retrieve active showcase configuration
    let settings = {
      slideInterval: 10,
      autoPlay: true,
      pauseOnHover: true,
      spiritualFallback: true,
    };

    try {
      const { rows: settingRows } = await db.query(
        `SELECT key, value FROM app_settings WHERE key LIKE 'ad_showcase_%'`
      );
      const map = Object.fromEntries(settingRows.map((r: any) => [r.key, r.value]));
      if (map["ad_showcase_interval"]) {
        settings.slideInterval = Math.max(3, Math.min(60, Number(map["ad_showcase_interval"]) || 10));
      }
      if (map["ad_showcase_auto_play"] !== undefined) {
        settings.autoPlay = map["ad_showcase_auto_play"] === "true";
      }
      if (map["ad_showcase_pause_on_hover"] !== undefined) {
        settings.pauseOnHover = map["ad_showcase_pause_on_hover"] === "true";
      }
      if (map["ad_showcase_spiritual_fallback"] !== undefined) {
        settings.spiritualFallback = map["ad_showcase_spiritual_fallback"] === "true";
      }
    } catch (e) {
      // Gracefully continue with defaults
    }

    return NextResponse.json({
      success: true,
      data: rows,
      hasActiveAds: rows.length > 0,
      settings,
    });
  } catch (error) {
    console.error("Error loading active advertisements:", error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        hasActiveAds: false,
        settings: {
          slideInterval: 10,
          autoPlay: true,
          pauseOnHover: true,
          spiritualFallback: true,
        },
        message: "Error loading ads",
      },
      { status: 500 }
    );
  }
}
