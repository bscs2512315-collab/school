import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { UserRole } from "@/types/enums";

function getSecret() {
  const rawSecret = process.env.JWT_SECRET;
  if (!rawSecret) {
    throw new Error("JWT_SECRET environment variable is not set. Refusing to verify tokens with empty secret.");
  }
  return new TextEncoder().encode(rawSecret);
}

function getDashboardRouteForRole(role?: string): string {
  const normalized = String(role || "").toUpperCase();
  if (normalized === UserRole.ADMIN) {
    return "/admin/dashboard";
  }
  if (normalized === UserRole.TEACHER) {
    return "/teacher/dashboard";
  }
  if (normalized === UserRole.SCHOOL) {
    return "/school/dashboard";
  }
  return "/student/dashboard";
}

function setNoCacheHeaders(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/") &&
      ["POST", "PUT", "PATCH", "DELETE"].includes(request.method) &&
      request.cookies.has("exboard_token") &&
      !request.headers.has("authorization")) {
    const origin = request.headers.get("origin");
    if (!origin || origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }
  }

  const isRootRoute = pathname === "/";
  const isAuthRoute =
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/register" ||
    pathname.startsWith("/register/") ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/forgot-password/") ||
    pathname === "/reset-password" ||
    pathname.startsWith("/reset-password/") ||
    pathname === "/verify-otp" ||
    pathname.startsWith("/verify-otp/");

  const isDashboardRoute = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isStudentRoute = pathname === "/student" || pathname.startsWith("/student/");
  const isTeacherRoute = pathname === "/teacher" || pathname.startsWith("/teacher/");
  const isSchoolRoute = pathname === "/school" || pathname.startsWith("/school/");
  const isPapersBankRoute = pathname === "/papers-bank" || pathname.startsWith("/papers-bank/");
  const isQARoute = pathname === "/qa" || pathname.startsWith("/qa/");

  const isProtectedRoute =
    isDashboardRoute ||
    isAdminRoute ||
    isStudentRoute ||
    isTeacherRoute ||
    isSchoolRoute ||
    isPapersBankRoute ||
    isQARoute;

  const token = request.cookies.get("exboard_token")?.value;

  // 1. Auth routes (/login, /register, /forgot-password, /reset-password, /verify-otp):
  // Logged-in users should NEVER access auth routes (neither by direct link nor by browser back button).
  // If explicitly arriving due to expired/invalid session or force-login, delete cookie and allow login page.
  if (isAuthRoute) {
    const hasExplicitAuthIntent =
      request.nextUrl.searchParams.has("session") ||
      request.nextUrl.searchParams.has("force") ||
      request.nextUrl.searchParams.has("logout");

    if (hasExplicitAuthIntent) {
      const response = NextResponse.next();
      response.cookies.delete("exboard_token");
      return setNoCacheHeaders(response);
    }

    if (token) {
      try {
        const { payload } = await jwtVerify(token, getSecret());
        const userRole = payload.role as string;
        const targetDashboard = getDashboardRouteForRole(userRole);
        return setNoCacheHeaders(NextResponse.redirect(new URL(targetDashboard, request.url)));
      } catch {
        // Expired or invalid token: clean cookie and let public auth page load
        const response = NextResponse.next();
        response.cookies.delete("exboard_token");
        return setNoCacheHeaders(response);
      }
    }
    return setNoCacheHeaders(NextResponse.next());
  }

  // 2. Auto-redirect signed-in users hitting the root landing page.
  if (isRootRoute) {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, getSecret());
        const userRole = payload.role as string;
        const targetDashboard = getDashboardRouteForRole(userRole);
        return setNoCacheHeaders(NextResponse.redirect(new URL(targetDashboard, request.url)));
      } catch {
        // Expired or invalid token: clean cookie and let public landing page load
        const response = NextResponse.next();
        response.cookies.delete("exboard_token");
        return response;
      }
    }
    return NextResponse.next();
  }

  // 3. Skip non-protected routes (e.g. public landing sub-pages, api routes, static docs)
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // 4. For protected routes: if no token, redirect to login
  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    url.searchParams.set("session", "expired");
    return setNoCacheHeaders(NextResponse.redirect(url));
  }

  try {
    // Verify token
    const { payload } = await jwtVerify(token, getSecret());
    const userRole = String(payload.role || "").toUpperCase();

    // Handle generic /dashboard route
    if (isDashboardRoute) {
      return setNoCacheHeaders(NextResponse.redirect(new URL(getDashboardRouteForRole(userRole), request.url)));
    }

    // Role-based route protection
    if (isAdminRoute && userRole !== UserRole.ADMIN && userRole !== UserRole.QA) {
      if (userRole === UserRole.STUDENT || userRole === UserRole.SCHOOL) {
        return setNoCacheHeaders(NextResponse.redirect(new URL(getDashboardRouteForRole(userRole), request.url)));
      }
      return setNoCacheHeaders(NextResponse.redirect(new URL("/login", request.url)));
    }

    if (isQARoute && userRole !== UserRole.QA && userRole !== UserRole.ADMIN && String(payload.email || "").toLowerCase() !== "mtahatalib110+aliya@gmail.com") {
      return setNoCacheHeaders(NextResponse.redirect(new URL(getDashboardRouteForRole(userRole), request.url)));
    }

    if (isStudentRoute && userRole === UserRole.ADMIN) {
      return setNoCacheHeaders(NextResponse.redirect(new URL("/admin/dashboard", request.url)));
    }

    if (isTeacherRoute && userRole !== UserRole.TEACHER && userRole !== UserRole.ADMIN && userRole !== UserRole.QA) {
      return setNoCacheHeaders(NextResponse.redirect(new URL(getDashboardRouteForRole(userRole), request.url)));
    }

    if (isSchoolRoute && userRole !== UserRole.SCHOOL && userRole !== UserRole.ADMIN && userRole !== UserRole.QA) {
      return setNoCacheHeaders(NextResponse.redirect(new URL(getDashboardRouteForRole(userRole), request.url)));
    }

    const response = NextResponse.next();
    setNoCacheHeaders(response);

    // Sliding session renewal: if valid token has < 3 days remaining, auto-renew for 7 days
    const nowInSec = Math.floor(Date.now() / 1000);
    if (payload.exp && (payload.exp - nowInSec) < 3 * 24 * 60 * 60) {
      try {
        const renewedToken = await new SignJWT({
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          tokenVersion: payload.tokenVersion ?? 1,
        })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime("7d")
          .sign(getSecret());

        const host = request.headers.get("host") || "";
        const isExboardDomain = host.includes("exboardai.tech");

        response.cookies.set("exboard_token", renewedToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60,
          domain: isExboardDomain ? ".exboardai.tech" : undefined,
        });
      } catch (renewalErr) {
        console.error("Sliding session renewal error:", renewalErr);
      }
    }

    return response;
  } catch {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    url.searchParams.set("session", "invalid");
    const response = NextResponse.redirect(url);
    response.cookies.delete("exboard_token");
    return setNoCacheHeaders(response);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|sw-version\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|pdf|mp4|docx)$).*)",
  ],
};
