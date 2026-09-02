import { cookies } from "next/headers";

export const PLAYER_COOKIE = "sb_player";

export async function readPlayerId() {
  const jar = await cookies();
  return jar.get(PLAYER_COOKIE)?.value;
}
