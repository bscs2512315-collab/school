import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { promisify } from "util";
import { uploadToCloudinary } from "@/lib/storage/cloudinary";

const execFileAsync = promisify(execFile);

export interface ExtractedDiagram {
  questionNumber: number | null;
  pageNumber: number;
  imagePath: string;
  fileName: string;
  width: number;
  height: number;
  imageUrl?: string;
}

export interface PdfProcessingResult {
  cleanedPdfPath: string;
  cleanedPdfBuffer: Buffer;
  diagrams: ExtractedDiagram[];
  diagramMap: Map<number, string>; // questionNumber -> imageUrl
}

/**
 * Strips watermarks from past paper PDF using PyMuPDF and automatically extracts
 * cropped diagrams for each question, uploading them directly to Cloudinary.
 */
export async function processPastPaperPdf(
  inputPdfBuffer: Buffer,
  fileName: string = "paper.pdf",
): Promise<PdfProcessingResult> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "past-paper-"));
  const inputPdfPath = path.join(tmpDir, fileName);
  fs.writeFileSync(inputPdfPath, inputPdfBuffer);

  const scriptPath = path.resolve(process.cwd(), "scripts/pdf_past_paper_processor.py");

  try {
    const { stdout, stderr } = await execFileAsync(
      "python3",
      [scriptPath, inputPdfPath, "--out-dir", tmpDir],
      { maxBuffer: 10 * 1024 * 1024 },
    );

    if (stderr && stderr.trim()) {
      console.warn("[pdf-processor python warning]", stderr);
    }

    const jsonStart = stdout.indexOf("{");
    const jsonEnd = stdout.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error(`Failed to locate JSON in python output: ${stdout}`);
    }
    const result = JSON.parse(stdout.substring(jsonStart, jsonEnd + 1));
    const cleanedPdfPath = result.cleanedPdf;
    const cleanedPdfBuffer = fs.readFileSync(cleanedPdfPath);
    const diagrams: ExtractedDiagram[] = result.diagrams || [];

    // Upload extracted diagrams to Cloudinary with limited concurrency
    const diagramMap = new Map<number, string>();

    const CONCURRENCY = 4;
    let index = 0;

    async function uploadNext(): Promise<void> {
      while (index < diagrams.length) {
        const current = index++;
        const diagram = diagrams[current];
        try {
          if (fs.existsSync(diagram.imagePath)) {
            const imgBuffer = fs.readFileSync(diagram.imagePath);
            const uploadRes = await uploadToCloudinary(
              imgBuffer,
              diagram.fileName,
              "questions",
            );
            diagram.imageUrl = uploadRes.url;
            if (diagram.questionNumber !== null && diagram.questionNumber !== undefined) {
              diagramMap.set(diagram.questionNumber, uploadRes.url);
            }
          }
        } catch (uploadErr) {
          console.error(`Failed to upload diagram ${diagram.fileName} to Cloudinary:`, uploadErr);
        }
      }
    }

    const workers: Promise<void>[] = [];
    for (let i = 0; i < Math.min(CONCURRENCY, diagrams.length); i++) {
      workers.push(uploadNext());
    }
    await Promise.all(workers);

    return {
      cleanedPdfPath,
      cleanedPdfBuffer,
      diagrams,
      diagramMap,
    };
  } finally {
    // Keep directory until next GC or cleanup files
    setTimeout(() => {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {}
    }, 60000);
  }
}
