/**
 * Comprehensive OpenAPI 3.0 specification for ExBoard AI
 * Covers all API routes in the application
 */
export const spec = {
  openapi: "3.0.0",
  info: {
    title: "ExBoard AI API Documentation",
    version: "1.0.0",
    description:
      "Complete API documentation for the ExBoard AI — AI-powered exam preparation platform. Includes Auth, Admin, Student, and Public endpoints.",
  },
  servers: [
    {
      url: "/api",
      description: "Current server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: { type: "object" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string" },
        },
      },
    },
  },
  tags: [
    { name: "Auth", description: "Authentication & registration" },
    { name: "User Profile", description: "Profile management (all roles)" },
    { name: "Admin — Dashboard", description: "Admin dashboard statistics" },
    { name: "Admin — Curriculums", description: "Curriculum CRUD & analysis" },
    { name: "Admin — Syllabus", description: "Syllabus parsing & saving" },
    { name: "Admin — Past Papers", description: "Past paper management" },
    { name: "Admin — Questions", description: "Question bank & image uploads" },
    { name: "Student — Profile", description: "Student profile & stats" },
    { name: "Student — Curriculums", description: "Student curriculum access" },
    { name: "Student — Past Papers", description: "Student past paper access" },
    { name: "Student — Attempts", description: "Exam attempts & grading" },
    {
      name: "Student — Generate Papers",
      description: "Chapter-wise paper generation",
    },
    { name: "Student — History", description: "Exam attempt history" },
    { name: "Public", description: "Public endpoints (leaderboard, schools)" },
  ],
  paths: {
    // ─────────────────────────────────────────────
    //  AUTH
    // ─────────────────────────────────────────────
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        description:
          "Authenticate a user (student, school, or admin) and receive a JWT token.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful — returns token and user object",
          },
          401: { description: "Invalid credentials" },
          403: { description: "Email not verified" },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register Student",
        description:
          "Register a new student account. OTP verification required after registration.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password", "class", "schoolName"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6 },
                  class: { type: "string", enum: ["IX", "X", "XI", "XII"] },
                  board: { type: "string", default: "AKUEB" },
                  schoolName: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Registration successful — OTP sent to email" },
          400: { description: "Validation error or email already exists" },
        },
      },
    },
    "/auth/register/school": {
      post: {
        tags: ["Auth"],
        summary: "Register School",
        description:
          "Register a new school account with school-specific fields.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  phone: { type: "string" },
                  address: { type: "string" },
                  studentCount: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "School registration successful" },
          400: { description: "Validation error" },
        },
      },
    },
    "/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify OTP",
        description:
          "Verify the OTP sent to user's email during registration or password reset.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "otp"],
                properties: {
                  email: { type: "string", format: "email" },
                  otp: { type: "string" },
                  type: { type: "string", enum: ["registration", "reset"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "OTP verified successfully" },
          400: { description: "Invalid or expired OTP" },
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Forgot Password",
        description: "Send a password reset OTP to the user's email.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Reset OTP sent to email" },
          404: { description: "User not found" },
        },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset Password",
        description: "Reset user's password after OTP verification.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Password reset successful" },
          400: { description: "Invalid request" },
        },
      },
    },

    // ─────────────────────────────────────────────
    //  USER PROFILE (all roles)
    // ─────────────────────────────────────────────
    "/user/profile": {
      get: {
        tags: ["User Profile"],
        summary: "Get Profile",
        description:
          "Fetch the current authenticated user's full profile (any role).",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Profile data returned" },
          401: { description: "Unauthorized" },
        },
      },
      put: {
        tags: ["User Profile"],
        summary: "Update Profile",
        description:
          "Update editable profile fields. Fields available depend on user role: Students can edit name/class/board/schoolName; Schools can edit name/phone/address/studentCount; Admins can edit name.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  class: { type: "string", description: "Student only" },
                  board: { type: "string", description: "Student only" },
                  schoolName: { type: "string", description: "Student only" },
                  phone: { type: "string", description: "School only" },
                  address: { type: "string", description: "School only" },
                  studentCount: { type: "string", description: "School only" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Profile updated successfully" },
          400: { description: "No valid fields to update" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/user/profile/upload-avatar": {
      post: {
        tags: ["User Profile"],
        summary: "Upload Avatar",
        description:
          "Upload a profile picture (image file). Uploaded to Cloudinary.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Avatar uploaded — returns profileImage URL" },
          400: { description: "No file or invalid file type" },
          401: { description: "Unauthorized" },
        },
      },
    },

    // ─────────────────────────────────────────────
    //  ADMIN — DASHBOARD
    // ─────────────────────────────────────────────
    "/admin/dashboard/stats": {
      get: {
        tags: ["Admin — Dashboard"],
        summary: "Dashboard Stats",
        description:
          "Get aggregated platform statistics (total students, schools, curriculums, papers).",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Stats returned" },
          401: { description: "Admin access required" },
        },
      },
    },

    // ─────────────────────────────────────────────
    //  ADMIN — CURRICULUMS
    // ─────────────────────────────────────────────
    "/admin/curriculum": {
      get: {
        tags: ["Admin — Curriculums"],
        summary: "List All Curriculums",
        description:
          "Retrieve all curriculums with analysis status and chapter counts.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Curriculums list returned" },
          401: { description: "Admin access required" },
        },
      },
    },
    "/admin/curriculum/create": {
      post: {
        tags: ["Admin — Curriculums"],
        summary: "Create Curriculum",
        description:
          "Create a new curriculum entry with class, board, and subject.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["class", "board", "subject"],
                properties: {
                  class: { type: "string" },
                  board: { type: "string" },
                  subject: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Curriculum created" },
          401: { description: "Admin access required" },
        },
      },
    },
    "/admin/curriculum/upload": {
      post: {
        tags: ["Admin — Curriculums"],
        summary: "Upload Curriculum PDF",
        description: "Upload a PDF file for a curriculum.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary" },
                  curriculumId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "File uploaded" },
          401: { description: "Admin access required" },
        },
      },
    },
    "/admin/curriculum/chapters": {
      get: {
        tags: ["Admin — Curriculums"],
        summary: "List All Chapters",
        description:
          "Get all chapters across curriculums, optionally filtered.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Chapters list returned" },
          401: { description: "Admin access required" },
        },
      },
    },
    "/admin/curriculum/{id}": {
      get: {
        tags: ["Admin — Curriculums"],
        summary: "Get Curriculum Details",
        description:
          "Get full details of a specific curriculum including chapters and SLOs.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Curriculum details returned" },
          404: { description: "Curriculum not found" },
        },
      },
      delete: {
        tags: ["Admin — Curriculums"],
        summary: "Delete Curriculum",
        description: "Delete a curriculum and all its chapters.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Curriculum deleted" },
          404: { description: "Curriculum not found" },
        },
      },
    },
    "/admin/curriculum/{id}/analyze": {
      post: {
        tags: ["Admin — Curriculums"],
        summary: "Analyze Curriculum",
        description:
          "Trigger AI analysis of a curriculum to extract chapters and SLOs.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Analysis started/completed" },
          404: { description: "Curriculum not found" },
        },
      },
    },
    "/admin/curriculum/{id}/chapters": {
      get: {
        tags: ["Admin — Curriculums"],
        summary: "Get Curriculum Chapters",
        description: "List all chapters for a specific curriculum.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Chapters returned" },
        },
      },
      post: {
        tags: ["Admin — Curriculums"],
        summary: "Add Chapter to Curriculum",
        description: "Add a new chapter to a curriculum.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Chapter added" },
        },
      },
    },
    "/admin/curriculum/{id}/chapters/{chapterId}": {
      put: {
        tags: ["Admin — Curriculums"],
        summary: "Update Chapter",
        description: "Update a specific chapter's details.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "chapterId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Chapter updated" },
          404: { description: "Chapter not found" },
        },
      },
      delete: {
        tags: ["Admin — Curriculums"],
        summary: "Delete Chapter",
        description: "Delete a specific chapter.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "chapterId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Chapter deleted" },
          404: { description: "Chapter not found" },
        },
      },
    },

    // ─────────────────────────────────────────────
    //  ADMIN — SYLLABUS
    // ─────────────────────────────────────────────
    "/admin/syllabus/parse": {
      post: {
        tags: ["Admin — Syllabus"],
        summary: "Parse Syllabus Text",
        description:
          "Parse raw syllabus text into structured chapters and SLOs using AI.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  curriculumId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Parsed syllabus data returned" },
        },
      },
    },
    "/admin/syllabus/save": {
      post: {
        tags: ["Admin — Syllabus"],
        summary: "Save Parsed Syllabus",
        description:
          "Save the parsed syllabus (chapters and SLOs) to the database.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  curriculumId: { type: "string" },
                  chapters: { type: "array", items: { type: "object" } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Syllabus saved successfully" },
        },
      },
    },

    // ─────────────────────────────────────────────
    //  ADMIN — PAST PAPERS
    // ─────────────────────────────────────────────
    "/admin/past-paper": {
      get: {
        tags: ["Admin — Past Papers"],
        summary: "List All Past Papers",
        description: "Retrieve all past papers with metadata.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Past papers list returned" },
          401: { description: "Admin access required" },
        },
      },
    },
    "/admin/past-paper/create": {
      post: {
        tags: ["Admin — Past Papers"],
        summary: "Create Past Paper",
        description:
          "Create a new past paper entry with metadata and questions.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["class", "board", "subject", "year"],
                properties: {
                  class: { type: "string" },
                  board: { type: "string" },
                  subject: { type: "string" },
                  year: { type: "string" },
                  paperNumber: { type: "integer" },
                  questions: { type: "array", items: { type: "object" } },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Past paper created" },
          401: { description: "Admin access required" },
        },
      },
    },
    "/admin/past-paper/check-duplicate": {
      post: {
        tags: ["Admin — Past Papers"],
        summary: "Check Duplicate Paper",
        description:
          "Check if a past paper with the same class/board/subject/year/paperNumber already exists.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  class: { type: "string" },
                  board: { type: "string" },
                  subject: { type: "string" },
                  year: { type: "string" },
                  paperNumber: { type: "integer" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Duplicate check result" },
        },
      },
    },
    "/admin/past-paper/upload": {
      post: {
        tags: ["Admin — Past Papers"],
        summary: "Upload Past Paper PDF",
        description: "Upload a past paper PDF file for AI extraction.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "PDF uploaded and extraction started" },
        },
      },
    },
    "/admin/past-paper/upload/confirm": {
      post: {
        tags: ["Admin — Past Papers"],
        summary: "Confirm Uploaded Paper",
        description:
          "Confirm and save the extracted questions from an uploaded past paper.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Paper confirmed and saved" },
        },
      },
    },
    "/admin/past-paper/{id}": {
      get: {
        tags: ["Admin — Past Papers"],
        summary: "Get Past Paper Details",
        description: "Get full details of a specific past paper.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Past paper details returned" },
          404: { description: "Past paper not found" },
        },
      },
      delete: {
        tags: ["Admin — Past Papers"],
        summary: "Delete Past Paper",
        description: "Delete a past paper and all its questions.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Past paper deleted" },
          404: { description: "Past paper not found" },
        },
      },
    },
    "/admin/past-paper/{id}/questions": {
      get: {
        tags: ["Admin — Past Papers"],
        summary: "Get Paper Questions",
        description: "Get all questions for a specific past paper.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Questions returned" },
        },
      },
    },

    // ─────────────────────────────────────────────
    //  ADMIN — QUESTIONS
    // ─────────────────────────────────────────────
    "/admin/questions": {
      get: {
        tags: ["Admin — Questions"],
        summary: "List Questions (Question Bank)",
        description:
          "Get all questions in the question bank, optionally filtered by subject, class, chapter, or type.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "subject", in: "query", schema: { type: "string" } },
          { name: "class", in: "query", schema: { type: "string" } },
          { name: "chapter", in: "query", schema: { type: "string" } },
          {
            name: "type",
            in: "query",
            schema: { type: "string", enum: ["mcq", "crq", "erq"] },
          },
        ],
        responses: {
          200: { description: "Questions returned" },
          401: { description: "Admin access required" },
        },
      },
    },
    "/admin/questions/upload-image": {
      post: {
        tags: ["Admin — Questions"],
        summary: "Upload Question Image",
        description: "Upload an image for a question (to Cloudinary).",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Image uploaded — returns fileUrl and fileName" },
          400: { description: "No file uploaded" },
        },
      },
    },

    // ─────────────────────────────────────────────
    //  STUDENT — PROFILE
    // ─────────────────────────────────────────────
    "/student/me": {
      get: {
        tags: ["Student — Profile"],
        summary: "Get Current Student",
        description:
          "Fetch the current student's profile including points and profileImage.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Student profile returned" },
          401: { description: "Unauthorized" },
        },
      },
    },

    // ─────────────────────────────────────────────
    //  STUDENT — CURRICULUMS
    // ─────────────────────────────────────────────
    "/student/curriculum": {
      get: {
        tags: ["Student — Curriculums"],
        summary: "List Curriculums (Student)",
        description:
          "List all available curriculums for the student's class and board.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Curriculums returned" },
        },
      },
    },
    "/student/curriculum/{id}": {
      get: {
        tags: ["Student — Curriculums"],
        summary: "Get Curriculum Details (Student)",
        description: "Get full details of a curriculum with chapters and SLOs.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Curriculum details returned" },
          404: { description: "Curriculum not found" },
        },
      },
    },

    // ─────────────────────────────────────────────
    //  STUDENT — PAST PAPERS
    // ─────────────────────────────────────────────
    "/student/past-paper": {
      get: {
        tags: ["Student — Past Papers"],
        summary: "List Past Papers (Student)",
        description: "List all available past papers for the student's class.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Past papers list returned" },
        },
      },
    },
    "/student/past-paper/{id}": {
      get: {
        tags: ["Student — Past Papers"],
        summary: "Get Past Paper Details (Student)",
        description:
          "Get a specific past paper with all its questions for attempting.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Past paper with questions returned" },
          404: { description: "Past paper not found" },
        },
      },
    },

    // ─────────────────────────────────────────────
    //  STUDENT — ATTEMPTS
    // ─────────────────────────────────────────────
    "/student/attempt": {
      post: {
        tags: ["Student — Attempts"],
        summary: "Submit Paper 1 Attempt (MCQ)",
        description:
          "Submit answers for a Paper 1 (MCQ) exam. Auto-grades and awards points.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId", "paperId", "answers"],
                properties: {
                  userId: { type: "string" },
                  paperId: { type: "string" },
                  answers: {
                    type: "object",
                    description: "Map of questionId → selected answer",
                  },
                  timeTaken: {
                    type: "integer",
                    description: "Time taken in seconds",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              "Exam graded — returns score, percentage, pointsAwarded, and questionResults",
          },
          400: { description: "Missing required fields" },
        },
      },
    },
    "/student/attempt/paper2": {
      post: {
        tags: ["Student — Attempts"],
        summary: "Submit Paper 2 Attempt (CRQ/ERQ)",
        description:
          "Submit written answers for a Paper 2 exam. Results are sent via email after AI grading.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userId: { type: "string" },
                  paperId: { type: "string" },
                  answers: { type: "object" },
                  timeTaken: { type: "integer" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Paper 2 submitted — grading in progress" },
        },
      },
    },
    "/student/attempt/paper2/grade": {
      post: {
        tags: ["Student — Attempts"],
        summary: "Grade Paper 2 (AI)",
        description:
          "AI-grade a Paper 2 submission and send results via email.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Grading completed and emailed" },
        },
      },
    },
    "/student/answers/upload": {
      post: {
        tags: ["Student — Attempts"],
        summary: "Upload Answer Image",
        description: "Upload an image of a written answer for Paper 2.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Answer image uploaded — returns URL" },
        },
      },
    },

    // ─────────────────────────────────────────────
    //  STUDENT — GENERATE PAPERS
    // ─────────────────────────────────────────────
    "/student/generate-paper/chapters": {
      get: {
        tags: ["Student — Generate Papers"],
        summary: "Get Chapters for Generation",
        description:
          "Get available chapters filtered by class, board, and subject for paper generation.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "class",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
          { name: "board", in: "query", schema: { type: "string" } },
          {
            name: "subject",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Chapters returned" },
        },
      },
    },
    "/student/generate-paper": {
      post: {
        tags: ["Student — Generate Papers"],
        summary: "Generate Custom Paper",
        description:
          "Generate a custom paper from selected chapters. Prioritizes unattempted/incorrect questions.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["paperType", "subject", "class", "chapterIds"],
                properties: {
                  paperType: { type: "string", enum: ["paper1", "paper2"] },
                  subject: { type: "string" },
                  class: { type: "string" },
                  board: { type: "string" },
                  chapterIds: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Generated paper with questions returned" },
        },
      },
    },
    "/student/generate-paper/submit": {
      post: {
        tags: ["Student — Generate Papers"],
        summary: "Submit Generated Paper",
        description:
          "Submit answers for a generated paper. Handles both Paper 1 (instant) and Paper 2 (email) grading.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userId: { type: "string" },
                  paperType: { type: "string" },
                  subject: { type: "string" },
                  answers: { type: "object" },
                  questions: { type: "array", items: { type: "object" } },
                  timeTaken: { type: "integer" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Paper submitted and graded" },
        },
      },
    },

    // ─────────────────────────────────────────────
    //  STUDENT — HISTORY
    // ─────────────────────────────────────────────
    "/student/history": {
      get: {
        tags: ["Student — History"],
        summary: "Get Attempt History",
        description:
          "Retrieve all past exam attempts for the authenticated student.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Attempt history returned" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/student/history/{id}": {
      get: {
        tags: ["Student — History"],
        summary: "Get Attempt Details",
        description:
          "Get full details of a specific exam attempt including question results.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Attempt details returned" },
          404: { description: "Attempt not found" },
        },
      },
    },

    // ─────────────────────────────────────────────
    //  PUBLIC
    // ─────────────────────────────────────────────
    "/leaderboard": {
      get: {
        tags: ["Public"],
        summary: "Get Leaderboard",
        description:
          "Get the top 20 students ranked by points. Optionally filter by city.",
        parameters: [
          {
            name: "type",
            in: "query",
            schema: { type: "string", enum: ["country", "city"] },
          },
          { name: "city", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Leaderboard data returned" },
        },
      },
    },
    "/schools": {
      get: {
        tags: ["Public"],
        summary: "List Schools",
        description:
          "Get a list of all registered school names (used in registration dropdown).",
        responses: {
          200: { description: "Schools list returned" },
        },
      },
    },
  },
};
