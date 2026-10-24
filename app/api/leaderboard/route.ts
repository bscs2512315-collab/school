import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";

// Lightweight in-memory cache for leaderboard data (60s TTL)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const LEADERBOARD_CACHE_TTL = 60 * 1000; // 60 seconds
const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > LEADERBOARD_CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "country";
    const city = searchParams.get("city");
    const board = searchParams.get("board");
    const studentClass = searchParams.get("class");

    const cacheKey = `${type}_${city || "all"}_${board || "all"}_${studentClass || "all"}`;
    const cachedResult = getCached(cacheKey);
    if (cachedResult) {
      return NextResponse.json({
        success: true,
        message: `${type === "schools" ? "School leaderboard" : "Leaderboard"} fetched successfully (cached)`,
        data: cachedResult,
      });
    }

    if (type === "schools") {
      const studentParams: string[] = [];
      let studentWhere = `WHERE role = '${UserRole.STUDENT}' AND role != 'QA' AND email != 'mtahatalib110+aliya@gmail.com' AND school_name IS NOT NULL AND TRIM(school_name) != '' AND school_name != '—'`;

      if (city && city !== "All Cities") {
        studentWhere += ` AND city = $${studentParams.length + 1}`;
        studentParams.push(city);
      }

      if (board) {
        studentWhere += ` AND board = $${studentParams.length + 1}`;
        studentParams.push(board);
      }

      if (studentClass) {
        studentWhere += ` AND class = $${studentParams.length + 1}`;
        studentParams.push(studentClass);
      }
      let schoolCityFilter = "";
      if (city && city !== "All Cities") {
        studentParams.push(city);
        schoolCityFilter = `AND a.location = $${studentParams.length}`;
      }

      const query = `
        WITH student_stats AS (
          SELECT
            LOWER(TRIM(school_name)) AS school_key,
            ROUND(AVG(GREATEST(COALESCE(points, 0), 0))) AS points,
            COUNT(*) AS "studentCount"
          FROM users
          ${studentWhere}
          GROUP BY LOWER(TRIM(school_name))
        )
        SELECT
          a.id,
          a.name,
          COALESCE(s.points, 0) AS points,
          COALESCE(s."studentCount", 0) AS "studentCount",
          a.logo_url AS "logoUrl",
          COALESCE(a.location, 'Karachi') AS city
        FROM admin_schools a
        LEFT JOIN student_stats s ON s.school_key = LOWER(TRIM(a.name))
        WHERE a.is_verified = true
          AND COALESCE(s."studentCount", 0) > 0
        ${schoolCityFilter}
        ORDER BY points DESC, "studentCount" DESC, a.name ASC
        LIMIT 500
      `;

      const { rows } = await db.query<{
        id: string;
        name: string;
        points: string | number;
        studentCount: string | number;
        logoUrl: string | null;
        city: string | null;
      }>(query, studentParams);

      const leaderboard = rows.map((school, index) => ({
        id: school.id,
        name: school.name,
        points: Number(school.points) || 0,
        studentCount: Number(school.studentCount) || 0,
        logoUrl: school.logoUrl || null,
        city: school.city || "Karachi",
        rank: index + 1,
      }));

      setCached(cacheKey, leaderboard);

      return NextResponse.json({
        success: true,
        message: "School leaderboard fetched successfully",
        data: leaderboard,
      });
    }

    const params: string[] = [];
    let studentWhere = `WHERE role = '${UserRole.STUDENT}' AND role != 'QA' AND email != 'mtahatalib110+aliya@gmail.com' AND COALESCE(points, 0) >= 0`;

    if (city && city !== "All Cities") {
      studentWhere += ` AND city = $${params.length + 1}`;
      params.push(city);
    }

    if (board) {
      studentWhere += ` AND board = $${params.length + 1}`;
      params.push(board);
    }

    if (studentClass) {
      studentWhere += ` AND class = $${params.length + 1}`;
      params.push(studentClass);
    }

    const query = `
      WITH ranked_students AS (
        SELECT id, name, username, school_name, points, class, city, profile_image
        FROM users
        ${studentWhere}
        ORDER BY points DESC NULLS LAST, id ASC
        LIMIT 500
      )
      SELECT 
        u.id, 
        u.name, 
        u.username,
        COALESCE(a.name, r.name, u.school_name) as school_name, 
        COALESCE(u.points, 0) as points, 
        u.class, 
        COALESCE(u.city, 'Karachi') as city, 
        u.profile_image,
        COALESCE(a.logo_url, r.profile_image) as school_logo
      FROM ranked_students u 
      LEFT JOIN LATERAL (
        SELECT name, logo_url FROM admin_schools
        WHERE LOWER(TRIM(name)) = LOWER(TRIM(u.school_name))
        ORDER BY is_verified DESC, id ASC LIMIT 1
      ) a ON true
      LEFT JOIN LATERAL (
        SELECT name, profile_image FROM users
        WHERE role = '${UserRole.SCHOOL}' AND LOWER(TRIM(name)) = LOWER(TRIM(u.school_name))
        ORDER BY id ASC LIMIT 1
      ) r ON true
      ORDER BY u.points DESC NULLS LAST, u.id ASC
    `;

    const { rows } = await db.query<{
      id: string;
      name: string;
      username: string | null;
      school_name: string | null;
      school_logo: string | null;
      points: number;
      class: string | null;
      city: string | null;
      profile_image: string | null;
    }>(query, params);

    const leaderboard = rows.map((u, index) => ({
      id: u.id,
      name: u.name,
      username: u.username || undefined,
      schoolName: u.school_name || "—",
      schoolLogo: u.school_logo || null,
      points: Number(u.points) || 0,
      class: u.class || "—",
      city: u.city || "Karachi",
      profilePicture: u.profile_image || null,
      rank: index + 1,
    }));

    setCached(cacheKey, leaderboard);

    return NextResponse.json({
      success: true,
      message: "Leaderboard fetched successfully",
      data: leaderboard,
    });
  } catch (error: unknown) {
    console.error("Leaderboard Fetch Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch leaderboard" },
      { status: 500 },
    );
  }
}
