import { cookies } from "next/headers";
export { devSwitcherEnabled } from "./flags";

export const PLAYER_COOKIE = "sb_player";
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export function sessionCookieName() {
  return process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}

export async function readPlayerId() {
  const jar = await cookies();
  return jar.get(PLAYER_COOKIE)?.value;
}
