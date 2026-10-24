import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";

const unauthorized = () =>
  NextResponse.json(
    { success: false, message: "Unauthorized. Admin access required." },
    { status: 401 }
  );

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(
      req as unknown as Parameters<typeof getAdminFromRequest>[0]
    );
    if (!admin) return unauthorized();

    const { rows } = await db.query(
      `SELECT * FROM brand_advertisements 
       ORDER BY display_order ASC, created_at DESC`
    );

    // Also calculate summary statistics
    const totalAds = rows.length;
    const activeAds = rows.filter((r) => r.is_active).length;
    const totalImpressions = rows.reduce((acc, r) => acc + (Number(r.impressions) || 0), 0);
    const totalClicks = rows.reduce((acc, r) => acc + (Number(r.clicks) || 0), 0);

    // Retrieve showcase settings from app_settings
    let settings = {
      slideInterval: 10,
      autoPlay: true,
      pauseOnHover: true,
      spiritualFallback: true,
    };

    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS app_settings (
          key VARCHAR(255) PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
      `);
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
      console.error("Error retrieving showcase settings:", e);
    }

    return NextResponse.json({
      success: true,
      data: rows,
      stats: {
        totalAds,
        activeAds,
        totalImpressions,
        totalClicks,
      },
      settings,
    });
  } catch (error) {
    console.error("Error fetching advertisements:", error);
    return NextResponse.json(
      { success: false, message: "Server error fetching advertisements" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await getAdminFromRequest(
      req as unknown as Parameters<typeof getAdminFromRequest>[0]
    );
    if (!admin) return unauthorized();

    const body = await req.json();
    const { slideInterval, autoPlay, pauseOnHover, spiritualFallback } = body;

    await db.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const updates: [string, string][] = [];
    if (slideInterval !== undefined) {
      const intervalVal = Math.max(3, Math.min(60, Number(slideInterval) || 10));
      updates.push(["ad_showcase_interval", String(intervalVal)]);
    }
    if (autoPlay !== undefined) {
      updates.push(["ad_showcase_auto_play", String(Boolean(autoPlay))]);
    }
    if (pauseOnHover !== undefined) {
      updates.push(["ad_showcase_pause_on_hover", String(Boolean(pauseOnHover))]);
    }
    if (spiritualFallback !== undefined) {
      updates.push(["ad_showcase_spiritual_fallback", String(Boolean(spiritualFallback))]);
    }

    for (const [key, value] of updates) {
      await db.query(
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
        [key, value]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Showcase settings updated successfully",
      settings: {
        slideInterval: slideInterval !== undefined ? Math.max(3, Math.min(60, Number(slideInterval) || 10)) : 10,
        autoPlay: autoPlay !== undefined ? Boolean(autoPlay) : true,
        pauseOnHover: pauseOnHover !== undefined ? Boolean(pauseOnHover) : true,
        spiritualFallback: spiritualFallback !== undefined ? Boolean(spiritualFallback) : true,
      },
    });
  } catch (error: any) {
    console.error("Error updating showcase settings:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Server error updating settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminFromRequest(
      req as unknown as Parameters<typeof getAdminFromRequest>[0]
    );
    if (!admin) return unauthorized();

    const body = await req.json();
    const {
      brand_name,
      tagline,
      image_url,
      target_url,
      placement = "dashboard_showcase",
      is_active = true,
      display_order = 0,
      start_date,
      end_date,
    } = body;

    if (!brand_name || !brand_name.trim()) {
      return NextResponse.json(
        { success: false, message: "Brand name is required" },
        { status: 400 }
      );
    }

    if (!image_url || !image_url.trim()) {
      return NextResponse.json(
        { success: false, message: "Advertisement image URL is required" },
        { status: 400 }
      );
    }

    const { rows } = await db.query(
      `INSERT INTO brand_advertisements (
        brand_name,
        tagline,
        image_url,
        target_url,
        placement,
        is_active,
        display_order,
        start_date,
        end_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        brand_name.trim(),
        tagline ? tagline.trim() : null,
        image_url.trim(),
        target_url ? target_url.trim() : null,
        placement || "dashboard_showcase",
        Boolean(is_active),
        Number(display_order) || 0,
        start_date ? new Date(start_date) : null,
        end_date ? new Date(end_date) : null,
      ]
    );

    return NextResponse.json(
      { success: true, message: "Advertisement created successfully", data: rows[0] },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating advertisement:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Server error creating advertisement" },
      { status: 500 }
    );
  }
}
