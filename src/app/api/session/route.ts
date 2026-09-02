import { NextResponse } from "next/server";
import { createUser } from "@/lib/engine";
import { PLAYER_COOKIE } from "@/lib/session";
import { loadState, mutate } from "@/lib/store";

export async function POST(req: Request) {
  const body = (await req.json()) as { userId?: string; handle?: string };
  let userId = body.userId;
  if (!userId && body.handle) {
    userId = await mutate((s) => createUser(s, body.handle!).id);
  }
  if (!userId) return NextResponse.json({ error: "Need a desk" }, { status: 400 });
  const s = await loadState();
  if (!s.users.some((u) => u.id === userId && !u.system)) {
    return NextResponse.json({ error: "Unknown desk" }, { status: 404 });
  }
  const res = NextResponse.json({ ok: true, userId });
  res.cookies.set(PLAYER_COOKIE, userId, { path: "/", httpOnly: false, sameSite: "lax" });
  return res;
}
