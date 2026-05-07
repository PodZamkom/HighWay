import { Pool, type PoolClient, type QueryResult } from "pg";

const GLOBAL_KEY = "__etrade_pg_pool__";

declare global {
  // eslint-disable-next-line no-var
  var __etrade_pg_pool__: Pool | undefined;
}

function parseSslMode(): boolean {
  const raw = (process.env.DATABASE_SSL || "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

export function isDatabaseConfigured(): boolean {
  return typeof process.env.DATABASE_URL === "string" && process.env.DATABASE_URL.trim().length > 0;
}

export function getDbPool(): Pool {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!globalThis[GLOBAL_KEY]) {
    globalThis[GLOBAL_KEY] = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: parseSslMode() ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  return globalThis[GLOBAL_KEY] as Pool;
}

export async function withDbClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const pool = getDbPool();
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function dbQuery<T = unknown>(text: string, values?: unknown[]): Promise<QueryResult<T>> {
  const pool = getDbPool();
  return pool.query<T>(text, values as never[] | undefined);
}
