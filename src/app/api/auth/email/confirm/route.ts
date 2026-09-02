import { NextResponse } from "next/server";
import { applySessionCookie, mintGuestJwt } from "@/lib/auth-cookie";
import { createUser, joinLeague, leagueByInvite } from "@/lib/engine";
import { hashToken } from "@/lib/mail";
import { mutate } from "@/lib/store";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const tokenHash = hashToken(token);
  try {
    const userId = await mutate((s) => {
      const now = new Date().toISOString();
      const ch = s.emailChallenges.find((c) => c.tokenHash === tokenHash && c.exp > now);
      if (!ch) throw new Error("expired");
      s.emailChallenges = s.emailChallenges.filter((c) => c !== ch);
      let user = s.users.find((u) => u.email === ch.email);
      if (!user) {
        const handle =
          (ch.handle || ch.email.split("@")[0] || "desk")
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "")
            .slice(0, 18) || "desk";
        let h = handle;
        let n = 2;
        while (s.users.some((u) => u.handle === h)) {
          h = `${handle}${n++}`.slice(0, 20);
        }
        user = createUser(s, h, h, { authKind: "email" });
        user.email = ch.email;
        user.emailVerifiedAt = now;
      } else {
        user.emailVerifiedAt = now;
        if (user.authKind === "guest") user.authKind = "email";
      }
      if (ch.invite) {
        const league = leagueByInvite(s, ch.invite);
        if (league) {
          try {
            joinLeague(s, user.id, league.id, league.inviteCode);
          } catch {
            /* already in */
          }
        }
      }
      return user.id;
    });
    const jwt = await mintGuestJwt(userId);
    const res = NextResponse.redirect(new URL("/", req.url));
    applySessionCookie(res, jwt);
    return res;
  } catch {
    return NextResponse.redirect(new URL("/signin?err=email", req.url));
  }
}
