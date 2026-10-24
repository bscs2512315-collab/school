// Use require for CommonJS module (works in Next.js server-side)
// pdf-parse v1.1.0 uses a simple function-based API that works well with Next.js
// Lazy load to avoid module initialization issues
let pdfParse: ((buffer: Buffer) => Promise<{ text: string }>) | null = null;

function getPdfParse() {
  if (!pdfParse) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    pdfParse = require("pdf-parse");
  }
  return pdfParse;
}

/**
 * Parse PDF file and extract text
 * pdf-parse v1.1.0 accepts Buffer directly and returns a promise
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    // Validate buffer
    if (!buffer || buffer.length === 0) {
      throw new Error("PDF buffer is empty or invalid");
    }

    console.log(`[PDF Parser] Parsing PDF buffer of ${buffer.length} bytes`);

    // pdf-parse v1.1.0 is a simple function that takes a Buffer
    // It returns a promise that resolves to an object with a 'text' property
    const pdfParseFn = getPdfParse();
    if (!pdfParseFn) {
      throw new Error("Failed to load pdf-parse module");
    }
    const result = await pdfParseFn(buffer);
    
    // Extract text from result
    const text = result?.text || "";
    
    console.log(`[PDF Parser] Extracted ${text.length} characters from PDF`);
    
    if (text.length === 0) {
      console.warn("[PDF Parser] Warning: PDF text extraction returned empty string. The PDF might be image-based or corrupted.");
    } else {
      // Log sample of extracted text to check for formatting issues
      console.log(`[PDF Parser] First 500 characters of extracted text:`);
      console.log(text.substring(0, 500));
      console.log(`[PDF Parser] Checking for mathematical notation...`);
      
      // Check if superscripts are preserved
      const hasUnicodeSuperscripts = /[²³⁴⁵⁶⁷⁸⁹⁰¹]/.test(text);
      const hasCaretNotation = /\^/.test(text);
      const hasAsteriskNotation = /\*\*/.test(text);
      
      console.log(`[PDF Parser] Unicode superscripts found: ${hasUnicodeSuperscripts}`);
      console.log(`[PDF Parser] Caret notation (^) found: ${hasCaretNotation}`);
      console.log(`[PDF Parser] Asterisk notation (**) found: ${hasAsteriskNotation}`);
      
      if (hasUnicodeSuperscripts) {
        const superscriptMatch = text.match(/[²³⁴⁵⁶⁷⁸⁹⁰¹]+/);
        if (superscriptMatch) {
          console.log(`[PDF Parser] Found Unicode superscript example: "${superscriptMatch[0]}" at position ${text.indexOf(superscriptMatch[0])}`);
        }
      }
    }

    return text;
  } catch (error) {
    console.error("[PDF Parser] Error parsing PDF:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("[PDF Parser] Error Details:", {
      message: errorMessage,
      stack: errorStack,
      bufferLength: buffer?.length,
    });
    throw new Error(`Failed to parse PDF file: ${errorMessage}`);
  }
}

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return parsePDF(buffer);
}

