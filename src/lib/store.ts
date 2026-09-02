import fs from "node:fs/promises";
import path from "node:path";
import {
  BlobNotFoundError,
  BlobPreconditionFailedError,
  get,
  head,
  put,
} from "@vercel/blob";
import { hasDatabaseUrl } from "./db/client";
import { loadPostgres, PostgresConflictError, writePostgres } from "./db/persist";
import { hasDueResolves, tickResolves } from "./engine";
import { migrate } from "./migrate";
import { buildSeed } from "./seed";
import { ensureSportsMarkets } from "./sports";
import type { State } from "./types";

const FILE = path.join(process.cwd(), "data", "sparkboard.json");
const BLOB_PATH = "sparkboard/state.json";
const ACCESS = "private" as const;

const g = globalThis as unknown as { __sparkboard?: State };

export type StoreKind = "file" | "blob" | "postgres";

export function storeKind(): StoreKind {
  if (process.env.SPARKBOARD_STORE === "file") return "file";
  if (process.env.SPARKBOARD_STORE === "postgres") return "postgres";
  if (process.env.SPARKBOARD_STORE === "blob") return "blob";
  if (hasDatabaseUrl()) return "postgres";
  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) return "blob";
  return "file";
}

function assertProdStore() {
  if (process.env.VERCEL && storeKind() === "file") {
    throw new Error(
      "Sparkboard on Vercel needs Postgres (DATABASE_URL) or a private Blob store. Set SPARKBOARD_STORE=postgres or attach Blob.",
    );
  }
}

function ready(s: State) {
  return ensureSportsMarkets(migrate(s));
}

export async function loadState(): Promise<State> {
  assertProdStore();
  const s = await loadRaw();
  if (!hasDueResolves(s)) return s;
  return mutate((st) => {
    tickResolves(st);
    return st;
  });
}

async function loadRaw(): Promise<State> {
  const kind = storeKind();
  if (kind === "postgres") return loadPg();
  if (kind === "blob") return loadBlob();
  return loadFile();
}

export async function mutate<T>(fn: (s: State) => T): Promise<T> {
  assertProdStore();
  const kind = storeKind();
  if (kind === "postgres") return mutatePg(fn);
  if (kind === "blob") return mutateBlob(fn);
  const s = await loadFile();
  const result = fn(s);
  s.updatedAt = new Date().toISOString();
  g.__sparkboard = s;
  await persistFile(s);
  return result;
}

export async function resetState(): Promise<State> {
  const seeded = ensureSportsMarkets(buildSeed());
  const kind = storeKind();
  if (kind === "postgres") {
    await writePostgres(seeded, null);
    return seeded;
  }
  if (kind === "blob") {
    await writeBlob(seeded);
    return seeded;
  }
  g.__sparkboard = seeded;
  await persistFile(seeded);
  return seeded;
}

async function loadPg(): Promise<State> {
  const loaded = await loadPostgres();
  if (!loaded) {
    const seeded = ensureSportsMarkets(buildSeed());
    await writePostgres(seeded, null);
    return seeded;
  }
  return ready(loaded.state);
}

async function mutatePg<T>(fn: (s: State) => T): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < 8; i++) {
    const loaded = await loadPostgres();
    const version = loaded?.version ?? null;
    const s = loaded ? ready(loaded.state) : ensureSportsMarkets(buildSeed());
    const result = fn(s);
    s.updatedAt = new Date().toISOString();
    try {
      await writePostgres(s, version);
      return result;
    } catch (e) {
      if (e instanceof PostgresConflictError) {
        lastErr = e;
        await new Promise((r) => setTimeout(r, 40 * (i + 1)));
        continue;
      }
      throw e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Sparkboard store is busy; retry the ticket");
}

async function loadFile(): Promise<State> {
  if (g.__sparkboard) return g.__sparkboard;
  try {
    const raw = await fs.readFile(FILE, "utf8");
    g.__sparkboard = ready(JSON.parse(raw) as State);
    return g.__sparkboard;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    const seeded = ensureSportsMarkets(buildSeed());
    g.__sparkboard = seeded;
    await persistFile(seeded);
    return seeded;
  }
}

async function persistFile(s: State) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(s, null, 2));
}

async function loadBlob(): Promise<State> {
  const result = await get(BLOB_PATH, { access: ACCESS, useCache: false });
  if (!result || result.statusCode !== 200) {
    const seeded = ensureSportsMarkets(buildSeed());
    await writeBlob(seeded);
    return seeded;
  }
  const text = await new Response(result.stream).text();
  return ready(JSON.parse(text) as State);
}

async function writeBlob(s: State, etag?: string) {
  await put(BLOB_PATH, JSON.stringify(s), {
    access: ACCESS,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
    ...(etag ? { ifMatch: etag } : {}),
  });
}

async function currentEtag(): Promise<string | undefined> {
  try {
    const metaHead = await head(BLOB_PATH);
    return metaHead.etag;
  } catch (e) {
    if (e instanceof BlobNotFoundError) return undefined;
    throw e;
  }
}

async function mutateBlob<T>(fn: (s: State) => T): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < 8; i++) {
    const etag = await currentEtag();
    const s = etag ? await loadBlob() : buildSeed();
    const result = fn(s);
    s.updatedAt = new Date().toISOString();
    try {
      await writeBlob(s, etag);
      return result;
    } catch (e) {
      if (e instanceof BlobPreconditionFailedError) {
        lastErr = e;
        await new Promise((r) => setTimeout(r, 40 * (i + 1)));
        continue;
      }
      throw e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Sparkboard store is busy; retry the ticket");
}
