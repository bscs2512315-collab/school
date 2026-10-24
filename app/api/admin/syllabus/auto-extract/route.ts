import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { parsePDF } from "@/lib/pdf/parser";
import { extractSyllabusFromText } from "@/lib/ai/syllabus-extract";
import { insertMultipleCurriculums } from "@/lib/syllabus/insert-syllabus";
import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import { randomUUID } from "crypto";
import { downloadTrustedFile } from "@/lib/security/download";
import { readFormDataLimited } from "@/lib/security/form-data";

/**
 * POST /api/admin/syllabus/auto-extract
 * Automatically extracts chapters, subtopics, and SLOs from an uploaded PDF or remote AKUEB URL.
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let subject: string | undefined;
    let classLevel: string | undefined;
    let board = "AKUEB";
    let shouldSave = true;
    let textToProcess = "";
    let fileName = "Syllabus.pdf";

    if (contentType.includes("multipart/form-data")) {
      const formData = await readFormDataLimited(request, 42 * 1024 * 1024);
      const file = formData.get("file") as File | null;
      subject = (formData.get("subject") as string) || undefined;
      classLevel = (formData.get("classLevel") as string) || (formData.get("class") as string) || undefined;
      board = (formData.get("board") as string) || "AKUEB";
      shouldSave = formData.get("save") !== "false";

      if (!file) {
        return errorResponse("No PDF file provided", 400);
      }

      fileName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.subarray(0, 4).toString() !== "%PDF") {
        return errorResponse("Uploaded file is not a PDF", 400);
      }

      // Save temporary file for PyMuPDF or extract with parsePDF
      const tmpDir = path.join(os.tmpdir(), "syllabi");
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      const tmpPath = path.join(tmpDir, `upload_${randomUUID()}.pdf`);
      fs.writeFileSync(tmpPath, buffer);

      try {
        const pyScript = path.resolve(process.cwd(), "scripts/extract_syllabus_pdf.py");
        textToProcess = execFileSync("python3", [pyScript, tmpPath], {
          maxBuffer: 30 * 1024 * 1024,
          timeout: 30000,
          encoding: "utf-8",
        });
      } catch {
        // Fallback to pdf-parse
        textToProcess = await parsePDF(buffer);
      } finally {
        if (fs.existsSync(tmpPath)) {
          try {
            fs.unlinkSync(tmpPath);
          } catch {
            // ignore
          }
        }
      }
    } else {
      const body = await request.json();
      const { pdfUrl, text, save } = body;
      subject = body.subject;
      classLevel = body.classLevel || body.class;
      board = body.board || "AKUEB";
      shouldSave = save !== false;

      if (text && text.trim().length > 0) {
        textToProcess = text;
      } else if (pdfUrl) {
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(pdfUrl);
        } catch {
          return errorResponse("Invalid PDF URL format", 400);
        }

        fileName = path.basename(parsedUrl.pathname) || "Syllabus.pdf";
        const tmpDir = path.join(os.tmpdir(), "syllabi");
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true });
        }
        const tmpPath = path.join(tmpDir, `url_${randomUUID()}.pdf`);

        try {
          const buffer = await downloadTrustedFile(parsedUrl.toString(), {
            allowedHosts: (process.env.SYLLABUS_PDF_ALLOWED_HOSTS || "").split(","),
            maxBytes: 40 * 1024 * 1024,
            timeoutMs: 30000,
            accept: "application/pdf",
          });
          if (buffer.subarray(0, 4).toString() !== "%PDF") {
            return errorResponse("Downloaded file is not a PDF", 400);
          }
          fs.writeFileSync(tmpPath, buffer);

          const pyScript = path.resolve(process.cwd(), "scripts/extract_syllabus_pdf.py");
          try {
            textToProcess = execFileSync("python3", [pyScript, tmpPath], {
              maxBuffer: 30 * 1024 * 1024,
              timeout: 30000,
              encoding: "utf-8",
            });
          } catch {
            textToProcess = await parsePDF(buffer);
          }
        } finally {
          if (fs.existsSync(tmpPath)) {
            try {
              fs.unlinkSync(tmpPath);
            } catch {
              // ignore
            }
          }
        }
      } else {
        return errorResponse("Provide either a file upload, pdfUrl, or syllabus text", 400);
      }
    }

    if (!textToProcess || textToProcess.trim().length === 0) {
      return errorResponse("Could not extract any readable content from syllabus", 400);
    }

    // AI extraction
    const extractionResult = await extractSyllabusFromText(textToProcess, {
      subject,
      classLevel,
      board,
    });

    if (!shouldSave) {
      return successResponse(extractionResult, "Syllabus parsed successfully (preview mode)");
    }

    // Save to Database
    const savedResults = await insertMultipleCurriculums(extractionResult.curriculums, {
      uploadedBy: admin.userId,
      fileName,
    });

    return successResponse(
      {
        extracted: extractionResult.curriculums,
        saved: savedResults,
      },
      "Syllabus extracted and saved successfully into database",
      201,
    );
  } catch (error) {
    console.error("Admin auto-extract syllabus error:", error);
    if (error instanceof Error && error.message === "Upload is too large") {
      return errorResponse(error.message, 413);
    }
    return errorResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      500,
    );
  }
}
