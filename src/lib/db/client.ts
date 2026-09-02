import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const g = globalThis as unknown as {
  __sbSql?: ReturnType<typeof postgres>;
  __sbDb?: ReturnType<typeof drizzle<typeof schema>>;
};

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!g.__sbSql) {
    g.__sbSql = postgres(url, { max: 1, idle_timeout: 20, connect_timeout: 15 });
    g.__sbDb = drizzle(g.__sbSql, { schema });
  }
  return g.__sbDb!;
}
