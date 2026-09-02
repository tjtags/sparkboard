import { applySessionCookie, mintGuestJwt } from "@/lib/auth-cookie";
import { ipHash, spawnGuest } from "@/lib/auth-users";
import { fail } from "@/lib/http";
import { mutate } from "@/lib/store";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { handle?: string; invite?: string };
    const fwd = req.headers.get("x-forwarded-for") ?? "local";
    const ip = fwd.split(",")[0]?.trim() || "local";
    const { user, leagueId } = await mutate((s) =>
      spawnGuest(s, {
        handle: body.handle ?? "",
        invite: body.invite ?? "",
        ipHash: ipHash(ip),
      }),
    );
    const token = await mintGuestJwt(user.id);
    const res = NextResponse.json({
      ok: true,
      userId: user.id,
      handle: user.handle,
      leagueId,
    });
    applySessionCookie(res, token);
    return res;
  } catch (e) {
    return fail(e);
  }
}
