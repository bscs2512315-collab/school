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

    const { rows } = await db.query(`
      SELECT 
        s.id,
        s.name,
        s.logo_url,
        s.location,
        s.is_verified,
        COALESCE(s.boards, '["AKUEB"]'::jsonb) AS boards,
        s.created_at,
        COALESCE(st.student_count, 0)::int AS student_count
      FROM admin_schools s
      LEFT JOIN (
        SELECT 
          LOWER(TRIM(school_name)) AS school_key,
          COUNT(*) AS student_count
        FROM users
        WHERE role = 'STUDENT'
          AND school_name IS NOT NULL
          AND TRIM(school_name) != ''
          AND school_name != '—'
        GROUP BY LOWER(TRIM(school_name))
      ) st ON st.school_key = LOWER(TRIM(s.name))
      ORDER BY s.created_at DESC
    `);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching admin_schools:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
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
    const { name, logo_url, location, is_verified, boards } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: "School name is required" },
        { status: 400 }
      );
    }

    const assignedBoards = Array.isArray(boards) && boards.length > 0 ? boards : ["AKUEB"];

    const { rows } = await db.query(
      `INSERT INTO admin_schools (name, logo_url, location, is_verified, boards) 
       VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING *`,
      [
        name,
        logo_url || null,
        location || null,
        is_verified !== undefined ? is_verified : true,
        JSON.stringify(assignedBoards),
      ]
    );

    return NextResponse.json({ success: true, data: rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating school:", error);
    if (error.code === '23505') { 
      return NextResponse.json(
        { success: false, message: "A school with this name already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
