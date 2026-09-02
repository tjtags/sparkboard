import { NextResponse } from "next/server";
import { PLAYER_COOKIE, devSwitcherEnabled } from "@/lib/session";
import { loadState } from "@/lib/store";

export async function POST(req: Request) {
  if (!devSwitcherEnabled()) {
    return NextResponse.json({ error: "Switcher is off", code: "forbidden" }, { status: 403 });
  }
  const body = (await req.json()) as { userId?: string };
  const userId = body.userId;
  if (!userId) return NextResponse.json({ error: "Need a desk", code: "need_desk" }, { status: 401 });
  const s = await loadState();
  const u = s.users.find((x) => x.id === userId && x.authKind === "seed");
  if (!u) return NextResponse.json({ error: "Unknown seed desk" }, { status: 404 });
  const res = NextResponse.json({ ok: true, userId });
  res.cookies.set(PLAYER_COOKIE, userId, { path: "/", httpOnly: true, sameSite: "lax" });
  return res;
}
