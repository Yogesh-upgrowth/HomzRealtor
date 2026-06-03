import { Pool } from "pg";

// Singleton pool — avoids exhausting connections during dev hot-reload.
const globalForDb = globalThis as unknown as { __pgPool?: Pool };

export const pool: Pool =
  globalForDb.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__pgPool = pool;
}

export async function query<T = any>(
  text: string,
  params?: any[],
): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}
