import { encode } from "next-auth/jwt";
import { SESSION_MAX_AGE, sessionCookieName } from "./session";

export async function mintGuestJwt(userId: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required to mint a desk cookie");
  const salt = sessionCookieName();
  return encode({
    token: {
      sub: userId,
      sparkUserId: userId,
      authKind: "email",
    },
    secret,
    salt,
    maxAge: SESSION_MAX_AGE,
  });
}

export function applySessionCookie(res: { cookies: { set: Function } }, token: string) {
  const name = sessionCookieName();
  const secure = name.startsWith("__Secure-");
  res.cookies.set(name, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  res.cookies.set("sb_player", "", { path: "/", maxAge: 0 });
}
