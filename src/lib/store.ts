import fs from "node:fs/promises";
import path from "node:path";
import {
  BlobNotFoundError,
  BlobPreconditionFailedError,
  get,
  head,
  put,
} from "@vercel/blob";
import { buildSeed } from "./seed";
import type { State } from "./types";

const FILE = path.join(process.cwd(), "data", "sparkboard.json");
const BLOB_PATH = "sparkboard/state.json";
const ACCESS = "private" as const;

const g = globalThis as unknown as { __sparkboard?: State };

export type StoreKind = "file" | "blob";

export function storeKind(): StoreKind {
  if (process.env.SPARKBOARD_STORE === "file") return "file";
  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) return "blob";
  return "file";
}

function assertProdStore() {
  if (process.env.VERCEL && storeKind() !== "blob") {
    throw new Error(
      "Sparkboard on Vercel needs a private Blob store. In the project: Storage → Create → Blob (Private), or `vercel blob create-store sparkboard --access private --yes`.",
    );
  }
}

export async function loadState(): Promise<State> {
  assertProdStore();
  if (storeKind() === "blob") return loadBlob();
  return loadFile();
}

export async function mutate<T>(fn: (s: State) => T): Promise<T> {
  assertProdStore();
  if (storeKind() === "blob") return mutateBlob(fn);
  const s = await loadFile();
  const result = fn(s);
  s.updatedAt = new Date().toISOString();
  g.__sparkboard = s;
  await persistFile(s);
  return result;
}

export async function resetState(): Promise<State> {
  const seeded = buildSeed();
  if (storeKind() === "blob") {
    await writeBlob(seeded);
    return seeded;
  }
  g.__sparkboard = seeded;
  await persistFile(seeded);
  return seeded;
}

async function loadFile(): Promise<State> {
  if (g.__sparkboard) return g.__sparkboard;
  try {
    const raw = await fs.readFile(FILE, "utf8");
    g.__sparkboard = JSON.parse(raw) as State;
    return g.__sparkboard;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    const seeded = buildSeed();
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
    const seeded = buildSeed();
    await writeBlob(seeded);
    return seeded;
  }
  const text = await new Response(result.stream).text();
  return JSON.parse(text) as State;
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
    const meta = await head(BLOB_PATH);
    return meta.etag;
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
