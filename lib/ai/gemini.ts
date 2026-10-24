import { GoogleGenerativeAI } from "@google/generative-ai";
import type { CurriculumAnalysis } from "@/types/admin";
import {
  getActiveGeminiApiKey,
  getOrderedApiKeys,
  isAuthOrInvalidKeyError,
  isQuotaOrRateLimitError,
  markKeyInvalid,
  markKeyQuotaExceeded,
  markKeySuccess,
  maskApiKey,
} from "./gemini-keys";

const aiClients = new Map<string, GoogleGenerativeAI>();

/**
 * Get or initialize GoogleGenerativeAI instance for a specific key (or the active primary key).
 */
export function getGeminiAI(apiKey?: string): GoogleGenerativeAI {
  const key = apiKey?.trim() || getActiveGeminiApiKey();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  let client = aiClients.get(key);
  if (!client) {
    client = new GoogleGenerativeAI(key);
    aiClients.set(key, client);
  }
  return client;
}

export function getGeminiModelsToTry(): string[] {
  // Preferred fast production models for Gemini
  const preferred = [
    process.env.GEMINI_MODEL?.trim(),
    "gemini-flash-lite-latest",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.7-flash",
    "gemini-3.8-flash",
  ].filter(Boolean) as string[];

  return [...new Set(preferred)];
}

/**
 * Low-latency models for Nova AI conversational chat (< 600ms TTFT).
 */
export function getGeminiChatModelsToTry(): string[] {
  const preferred = [
    process.env.GEMINI_CHAT_MODEL?.trim(),
    process.env.GEMINI_MODEL?.trim(),
    "gemini-flash-lite-latest",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
  ].filter(Boolean) as string[];

  return [...new Set(preferred)];
}

/**
 * Deep-reasoning models for Exam Papers, Play & Prep, Question Synthesis, and Rubric Grading.
 */
export function getGeminiPaperModelsToTry(): string[] {
  const preferred = [
    process.env.GEMINI_PAPER_MODEL?.trim(),
    process.env.GEMINI_MODEL?.trim(),
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-flash-lite-latest",
    "gemini-3.5-flash-lite",
  ].filter(Boolean) as string[];

  return [...new Set(preferred)];
}

/**
 * Get Gemini model instance
 */
export function getGeminiModel(modelName?: string, apiKey?: string) {
  const ai = getGeminiAI(apiKey);
  const model =
    modelName?.trim() || process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";
  return ai.getGenerativeModel({ model });
}

type GenerateContentRequest = Parameters<
  ReturnType<typeof getGeminiModel>["generateContent"]
>[0];

function isRetryableGeminiError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    isQuotaOrRateLimitError(m) ||
    m.includes("recitation") ||
    m.includes("blocked") ||
    m.includes("filtered") ||
    m.includes("safety") ||
    m.includes("unavailable") ||
    m.includes("500") ||
    m.includes("fetch failed") ||
    m.includes("network") ||
    m.includes("econnreset") ||
    m.includes("etimedout") ||
    m.includes("timed out") ||
    m.includes("timeout")
  );
}

function isModelNotFoundError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("404") ||
    m.includes("not found") ||
    m.includes("is not found") ||
    m.includes("no longer available") ||
    m.includes("has been shut down") ||
    m.includes("deprecated") ||
    m.includes("invalid argument")
  );
}

function parseRetryDelayMs(message: string): number | null {
  const matchSec =
    message.match(/retry\s+(?:in|delay(?:\s*is)?)\s*:?\s*(\d+(?:\.\d+)?)\s*s/i) ||
    message.match(/retryDelay"?:\s*"(\d+(?:\.\d+)?)s?"/i);
  if (matchSec && matchSec[1]) {
    const sec = parseFloat(matchSec[1]);
    if (!isNaN(sec) && sec > 0) {
      return Math.ceil(sec * 1000) + 1500; // add 1.5s safety buffer
    }
  }
  return null;
}

export async function generateGeminiContentWithRetry(
  request: GenerateContentRequest,
  options?: {
    modelsToTry?: string[];
    maxAttempts?: number;
    retryDelayMs?: number;
    timeoutMs?: number;
  },
) {
  const modelsToTry =
    options?.modelsToTry?.length
      ? options.modelsToTry
      : getGeminiModelsToTry();

  const maxAttempts = options?.maxAttempts ?? 5;
  const timeoutMs = options?.timeoutMs ?? 45000;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const keysToTry = getOrderedApiKeys();

    if (keysToTry.length === 0) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }

    // Try each available API key (failover on quota/rate-limit/auth errors)
    for (const apiKey of keysToTry) {
      for (const modelName of modelsToTry) {
        try {
          const model = getGeminiModel(modelName, apiKey);

          // Race the actual Gemini call against a hard timeout
          const result = await Promise.race([
            model.generateContent(request),
            new Promise<never>((_, reject) =>
              setTimeout(
                () =>
                  reject(
                    new Error(`Gemini call timed out after ${timeoutMs}ms`),
                  ),
                timeoutMs,
              ),
            ),
          ]);

          // Mark this key as healthy on success
          markKeySuccess(apiKey);
          return result;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          lastError =
            error instanceof Error ? error : new Error(String(error));

          // Check if quota/rate-limit exceeded on this key
          if (isQuotaOrRateLimitError(errorMessage)) {
            console.warn(
              `[gemini] Key ${maskApiKey(apiKey)} with model ${modelName} hit quota/rate-limit.`,
            );
            // If the quota error is model-specific (e.g. 20 RPD on 2.5), try next model first!
            if (errorMessage.includes("PerModel") || errorMessage.includes("model:") || errorMessage.includes("503")) {
              continue;
            }
            markKeyQuotaExceeded(apiKey, errorMessage);
            break;
          }

          // Check if API key is invalid/unauthorized
          if (isAuthOrInvalidKeyError(errorMessage)) {
            console.warn(
              `[gemini] Key ${maskApiKey(apiKey)} is invalid/unauthorized. Switching to next key...`,
            );
            markKeyInvalid(apiKey, errorMessage);
            break;
          }

          // Model doesn't exist on this API key — try the next model in the list
          if (isModelNotFoundError(errorMessage)) {
            continue;
          }

          // Transient network error on this model/key — try next model
          if (isRetryableGeminiError(errorMessage)) {
            continue;
          }

          // Any unrecoverable structural error — fail immediately
          throw lastError;
        }
      }
    }

    // If all keys hit quota/transient errors, wait before next outer attempt
    if (attempt < maxAttempts && lastError && isRetryableGeminiError(lastError.message)) {
      const parsedDelay = parseRetryDelayMs(lastError.message);
      const delayToUse = parsedDelay ?? options?.retryDelayMs ?? (attempt * 5000);
      console.warn(
        `⏳ Rate limits hit across available keys. Waiting ${delayToUse}ms before attempt ${attempt + 1}/${maxAttempts}...`,
      );
      await new Promise((r) => setTimeout(r, delayToUse));
    }
  }

  if (
    lastError?.message &&
    isQuotaOrRateLimitError(lastError.message)
  ) {
    throw new Error(
      "All Gemini API keys exceeded quota. Please wait a moment and try again.",
    );
  }

  if (
    lastError?.message &&
    (lastError.message.includes("404") ||
      lastError.message.toLowerCase().includes("not found"))
  ) {
    throw new Error(
      `Gemini model not available on configured API keys. Set GEMINI_MODEL to a supported model (e.g. gemini-2.5-flash).`,
    );
  }

  throw new Error(
    `AI generation failed. Last error: ${lastError?.message || "Unknown error"}`,
  );
}

/**
 * Stream Gemini content — yields text chunks as they arrive.
 * Falls back through models/keys like the non-streaming version.
 */
export async function* streamGeminiContent(
  request: GenerateContentRequest,
  options?: {
    modelsToTry?: string[];
    timeoutMs?: number;
    maxAttempts?: number;
  },
): AsyncGenerator<string, void, undefined> {
  const modelsToTry =
    options?.modelsToTry?.length
      ? options.modelsToTry
      : getGeminiModelsToTry();

  const maxAttempts = options?.maxAttempts ?? 3;
  const deadline = Date.now() + (options?.timeoutMs ?? 30000);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const keysToTry = getOrderedApiKeys();
    if (keysToTry.length === 0) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }

    for (const apiKey of keysToTry) {
      for (const modelName of modelsToTry) {
        const remainingMs = deadline - Date.now();
        if (remainingMs <= 0) {
          throw lastError ?? new Error("Gemini stream timed out");
        }
        let hasYielded = false;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), remainingMs);
        try {
          const model = getGeminiModel(modelName, apiKey);
          const streamResult = await model.generateContentStream(request, {
            signal: controller.signal,
          });

          for await (const chunk of streamResult.stream) {
            try {
              const text = chunk.text();
              if (text) {
                hasYielded = true;
                yield text;
              }
            } catch {
              // Some chunks (e.g. thinking-only) have no text — skip silently
            }
          }
          if (!hasYielded) {
            lastError = new Error(`Gemini returned an empty response for model ${modelName}`);
            continue;
          }
          markKeySuccess(apiKey);
          return; // Successfully streamed
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          lastError = controller.signal.aborted
            ? new Error("Gemini stream timed out")
            : error instanceof Error ? error : new Error(String(error));

          // If we already yielded content to client, do not retry from the start to prevent duplicate prefix
          if (hasYielded) {
            console.error(
              `[gemini-stream] Error occurred mid-stream for model ${modelName}:`,
              errorMessage,
            );
            throw lastError;
          }

          if (isQuotaOrRateLimitError(errorMessage)) {
            console.warn(
              `[gemini-stream] Key ${maskApiKey(apiKey)} with model ${modelName} hit quota/rate-limit.`,
            );
            // If the quota error is model-specific (e.g. PerModel limit on 3.7 or 503 high demand), try next model first!
            if (
              errorMessage.includes("PerModel") ||
              errorMessage.includes("model:") ||
              errorMessage.includes("503") ||
              errorMessage.toLowerCase().includes("high demand") ||
              errorMessage.toLowerCase().includes("overloaded")
            ) {
              continue;
            }
            markKeyQuotaExceeded(apiKey, errorMessage);
            break;
          }

          if (isAuthOrInvalidKeyError(errorMessage)) {
            console.warn(
              `[gemini-stream] Key ${maskApiKey(apiKey)} is invalid/unauthorized. Switching to next key...`,
            );
            markKeyInvalid(apiKey, errorMessage);
            break;
          }

          if (isModelNotFoundError(errorMessage) || isRetryableGeminiError(errorMessage)) {
            continue;
          }

          throw lastError;
        } finally {
          clearTimeout(timeoutId);
        }
      }
    }

    if (attempt < maxAttempts) {
      const waitMs = Math.min(attempt * 1200, Math.max(0, deadline - Date.now()));
      if (waitMs <= 0) break;
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }

  throw lastError ?? new Error("AI streaming failed");
}

/**
 * Analyze curriculum document
 */
export async function analyzeCurriculum(
  curriculumText: string,
): Promise<CurriculumAnalysis> {
  if (!curriculumText || curriculumText.trim().length === 0) {
    throw new Error("Curriculum text is empty. Cannot analyze.");
  }

  const prompt = `Analyze the following curriculum document and extract structured information.

Extract:
1. All chapters/topics with their descriptions
2. Learning objectives for each chapter (if available)
3. Chapter numbers if mentioned

Return the response as a valid JSON object with this structure:
{
  "chapters": [
    {
      "chapterNumber": 1,
      "chapterName": "Chapter Name",
      "description": "Chapter description",
      "learningObjectives": ["Objective 1", "Objective 2"]
    }
  ],
  "summary": "Brief summary of the curriculum"
}

Curriculum Document:
${curriculumText}

Return ONLY the JSON object, no additional text.`;

  const result = await generateGeminiContentWithRetry(prompt, {
    maxAttempts: 2,
    timeoutMs: 40000,
  });

  const text = result.response.text().trim();
  let jsonText = text;
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/```\n?/g, "").replace(/```\n?/g, "");
  }

  const analysis = JSON.parse(jsonText.trim()) as CurriculumAnalysis;
  analysis.extractedAt = new Date();

  return analysis;
}
