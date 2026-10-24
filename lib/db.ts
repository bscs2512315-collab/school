import { Pool, types, type QueryResult, type QueryResultRow } from "pg";

// Parse DATE (OID 1082) as YYYY-MM-DD string to avoid timezone shifts and invalid input formats
types.setTypeParser(1082, (str: string) => str);

// To prevent multiple pool instances during hot-reloads in development
const globalForDb = global as unknown as { pool: Pool };

const isProduction = process.env.NODE_ENV === "production";

function getSanitizedDatabaseUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  try {
    const url = new URL(rawUrl);
    url.searchParams.delete("channel_binding");
    // node-postgres lets connection-string SSL parameters override Pool.ssl.
    url.searchParams.delete("sslmode");
    url.searchParams.delete("ssl");
    return url.toString();
  } catch {
    return rawUrl.replace(/([?&])channel_binding=[^&]*(&|$)/g, "$1").replace(/[?&]$/, "");
  }
}

const sslConfig =
  isProduction ? { rejectUnauthorized: true } :
  process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: true };

const pool = globalForDb.pool || new Pool({
  connectionString: getSanitizedDatabaseUrl(process.env.DATABASE_URL),
  ssl: sslConfig,
  // In serverless, keep pool modest so dozens of concurrent lambdas don't exhaust PgBouncer
  max: isProduction ? 10 : 20,
  idleTimeoutMillis: 600000, // Keep connection alive for 10 minutes (prevents 1.5s-2s TLS reconnections)
  connectionTimeoutMillis: 30000, // 30s to allow serverless Neon database compute to wake up
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Prevent process crash when Neon terminates idle connections
pool.on("error", (err: Error) => {
  console.error("⚠️ [db] Pool connection error (idle connection dropped):", err.message);
});

if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool;

function isTransientError(err: unknown): boolean {
  if (!err) return false;
  const message = err instanceof Error ? err.message : String(err);
  const code = typeof err === "object" && err !== null && "code" in err ? (err as { code: unknown }).code : "";
  return (
    code === "57P01" || // admin_shutdown
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    message.includes("Connection terminated unexpectedly") ||
    message.includes("connection timeout") ||
    message.includes("Connection lost")
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const db = {
  query: async <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> => {
    try {
      return await pool.query<T>(text, params);
    } catch (err) {
      if (isTransientError(err)) {
        console.warn("⚠️ [db] Transient connection drop detected. Retrying query in 200ms...");
        await sleep(200);
        return await pool.query<T>(text, params);
      }
      throw err;
    }
  },
  pool,
};
