import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export async function GET() {
  try {
    // Single source of truth: admin_schools managed by admin at /admin/schools
    const { rows: adminSchoolsRows } = await db.query<{
      id: string;
      name: string;
      logo_url: string | null;
      location: string | null;
    }>(`
      SELECT id, name, logo_url, location
      FROM admin_schools
      WHERE is_verified = true
      ORDER BY name ASC
    `);

    const schools = adminSchoolsRows.map((s) => ({
      id: s.id,
      name: s.name,
      logo: s.logo_url,
      location: s.location,
      initials: getInitials(s.name),
      isRegistered: true,
    }));

    return NextResponse.json(schools, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error) {
    console.error("Error fetching schools:", error);
    return NextResponse.json([], { status: 500 });
  }
}
