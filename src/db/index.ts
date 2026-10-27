import "server-only";
import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { BOOTSTRAP_SQL } from "./bootstrap";

type DB = PostgresJsDatabase<typeof schema>;
const g = globalThis as unknown as { __cqSql?: postgres.Sql; __cqDb?: DB; __cqReady?: Promise<void> };

function connect(): DB {
  if (g.__cqDb) return g.__cqDb;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add your Neon connection string to the environment (see .env.example).");
  // prepare:false keeps this compatible with Neon's pooled (PgBouncer) connection strings.
  const sql = postgres(url, { prepare: false, max: process.env.NODE_ENV === "production" ? 3 : 5, idle_timeout: 20, connect_timeout: 15, onnotice: () => {} });
  g.__cqSql = sql;
  g.__cqDb = drizzle(sql, { schema });
  return g.__cqDb;
}

/** Returns the Drizzle client, creating tables on the first call if they don't exist yet. */
export async function getDb(): Promise<DB> {
  const db = connect();
  if (!g.__cqReady) {
    g.__cqReady = g.__cqSql!.unsafe(BOOTSTRAP_SQL).then(() => undefined).catch((e) => { g.__cqReady = undefined; throw e; });
  }
  await g.__cqReady;
  return db;
}

export { schema };
