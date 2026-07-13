import { Pool } from "pg";

declare global {
  var _gymDbPool: Pool | undefined;
}

function getPool(): Pool {
  if (!global._gymDbPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL env var is not set");
    global._gymDbPool = new Pool({ connectionString });
  }
  return global._gymDbPool;
}

export const db = {
  query: <T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    params?: unknown[]
  ) => getPool().query<T>(text, params),
};
