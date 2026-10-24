import {
  getOrderedApiKeys,
  markKeyQuotaExceeded,
  markKeySuccess,
  maskApiKey,
} from "./gemini-keys";

const EMBEDDING_MODELS = ["text-embedding-004", "embedding-001"];

export async function embedText(text: string): Promise<number[]> {
  const input = text.trim().slice(0, 8000);
  if (!input) return [];

  const keys = getOrderedApiKeys();
  if (keys.length === 0) throw new Error("GEMINI_API_KEY is not set");

  let lastError: Error | null = null;

  for (const apiKey of keys) {
    for (const modelName of EMBEDDING_MODELS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s hard timeout for embedding

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: `models/${modelName}`,
              content: { parts: [{ text: input }] },
            }),
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          const status = response.status;
          if (status === 429 || status === 403) {
            console.warn(
              `[embeddings] Key ${maskApiKey(apiKey)} returned status ${status}. Shifting to fallback key...`,
            );
            markKeyQuotaExceeded(apiKey, `status ${status}`);
            break; // Try next API key
          }
          lastError = new Error(`Embedding API error: ${status}`);
          continue; // Try next model
        }

        const data = (await response.json()) as {
          embedding?: { values?: number[] };
        };

        if (data.embedding?.values?.length) {
          markKeySuccess(apiKey);
          return data.embedding.values;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }
  }

  throw lastError ?? new Error("Failed to generate embedding");
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
