import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EngineError } from "./engine";
import { PLAYER_COOKIE, devSwitcherEnabled } from "./session";
import { loadState } from "./store";
import { currentUser } from "./views";

const STATUS: Record<string, number> = {
  need_desk: 401,
  spawn_rate: 429,
  join_rate: 429,
  forbidden: 403,
};

export async function actorId(): Promise<string | null> {
  const s = await loadState();
  let userId: string | undefined;
  try {
    const { auth } = await import("@/auth");
    const session = await auth();
    const id = (session?.user as { sparkUserId?: string; id?: string } | undefined)?.sparkUserId
      ?? (session?.user as { id?: string } | undefined)?.id;
    if (id) userId = id;
  } catch {
    // Auth.js not configured yet
  }
  if (!userId && devSwitcherEnabled()) {
    const jar = await cookies();
    userId = jar.get(PLAYER_COOKIE)?.value;
  }
  return currentUser(s, userId)?.id ?? null;
}

export function formRedirect(url: string) {
  redirect(url);
}

export function fail(e: unknown, fallbackCode = "error") {
  if (
    typeof e === "object" &&
    e &&
    "digest" in e &&
    String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  ) {
    throw e;
  }
  if (e instanceof EngineError) {
    const status = STATUS[e.code] ?? 400;
    return Response.json({ error: e.message, code: e.code }, { status });
  }
  if (fallbackCode === "need_desk") {
    return Response.json({ error: "Sign in or join a league first", code: "need_desk" }, { status: 401 });
  }
  throw e;
}

export function needDesk() {
  return Response.json({ error: "Sign in or join a league first", code: "need_desk" }, { status: 401 });
}
