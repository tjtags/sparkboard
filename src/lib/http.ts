import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EngineError } from "./engine";
import { PLAYER_COOKIE } from "./session";
import { currentUser } from "./views";
import { loadState } from "./store";

export async function actorId() {
  const s = await loadState();
  const jar = await cookies();
  return currentUser(s, jar.get(PLAYER_COOKIE)?.value).id;
}

export function formRedirect(url: string) {
  redirect(url);
}

export function fail(e: unknown) {
  if (
    typeof e === "object" &&
    e &&
    "digest" in e &&
    String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  ) {
    throw e;
  }
  if (e instanceof EngineError) {
    return Response.json({ error: e.message, code: e.code }, { status: 400 });
  }
  throw e;
}
