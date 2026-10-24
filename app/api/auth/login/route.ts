import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signJWT } from "@/lib/auth";
import { z } from "zod";
import { successResponse, errorResponse, handleApiError } from "@/lib/response-handlers";
import { allowAuthRequest, rateLimitDistributed } from "@/lib/security/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const MAX_LOGIN_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Authenticate student and get JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    // Rate limit per account and trusted IP, with a generous site-wide ceiling.
    if (
      !(await rateLimitDistributed(`login:${email}`, MAX_LOGIN_ATTEMPTS, LOGIN_WINDOW_MS / 1000)) ||
      !(await allowAuthRequest(req, "login", MAX_LOGIN_ATTEMPTS * 5, 5000, LOGIN_WINDOW_MS / 1000))
    ) {
      return errorResponse(
        "Too many login attempts. Please try again later.",
        429,
      );
    }

    const { rows: users } = await db.query<{
      id: string;
      email: string;
      password: string;
      is_verified: boolean;
      role: string;
      name: string;
      class?: string | null;
      registered_by_school: boolean;
      onboarding_completed: boolean;
      city?: string | null;
      school_name?: string | null;
      points?: number;
      token_version?: number | null;
    }>("SELECT * FROM users WHERE email = $1", [email]);
    const user = users[0];

    if (!user) {
      return errorResponse("Invalid credentials", 401);
    }

    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (!passwordsMatch) {
      return errorResponse("Invalid credentials", 401);
    }

    if (!user.is_verified) {
      return errorResponse("Please verify your email address first.", 403);
    }

    const token = await signJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.token_version ?? 1,
    });

    const response = successResponse(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          class: user.class,
          stream: (user as { stream?: string | null }).stream ?? null,
          role: user.role,
          city: user.city || "Karachi",
          schoolName: user.school_name,
          points: user.points || 0,
          registeredBySchool: user.registered_by_school,
          onboardingCompleted: user.onboarding_completed,
        },
      },
      "Login successful",
    );
    const host = req.headers.get("host") || "";
    const isExboardDomain = host.includes("exboardai.tech");

    response.cookies.set("exboard_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
      domain: isExboardDomain ? ".exboardai.tech" : undefined,
    });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Convert ZodError issues to ApiErrorDetail format
      const errorDetails = error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path.map((p) => String(p)),
        code: issue.code,
      }));
      return errorResponse(errorDetails, 400);
    }
    console.error("Login error:", error);
    return handleApiError(error, "Internal Server Error");
  }
}
