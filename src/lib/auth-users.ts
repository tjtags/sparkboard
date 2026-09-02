import { createHash } from "node:crypto";
import { PUBLIC_LEAGUE_ID } from "./constants";
import { createUser, EngineError, joinLeague, leagueByInvite } from "./engine";
import type { State, User } from "./types";

const SPAWN_PER_HOUR = 3;
const JOIN_FAILS_PER_HOUR = 10;

function hourAgo(now: string) {
  return new Date(new Date(now).getTime() - 60 * 60 * 1000).toISOString();
}

export function ipHash(ip: string) {
  const salt = process.env.AUTH_SECRET ?? "sparkboard-dev";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 16);
}

export function spawnGuest(
  s: State,
  input: { handle: string; invite: string; ipHash: string },
): { user: User; leagueId: string } {
  const now = new Date().toISOString();
  const recent = s.spawnEvents.filter((e) => e.ipHash === input.ipHash && e.at >= hourAgo(now));
  if (recent.length >= SPAWN_PER_HOUR) {
    throw new EngineError("spawn_rate", "Too many desks from this network. Try later.");
  }
  const league = leagueByInvite(s, input.invite);
  if (!league || league.kind !== "friends") {
    throw new EngineError("bad_invite", "That invite code does not match");
  }
  const user = createUser(s, input.handle, input.handle, { authKind: "guest" });
  joinLeague(s, user.id, league.id, league.inviteCode);
  s.spawnEvents.push({ at: now, ipHash: input.ipHash, userId: user.id });
  return { user, leagueId: league.id };
}

export function upsertGitHubUser(
  s: State,
  profile: { id: string; login: string; name?: string | null; avatar_url?: string | null },
  opts?: { guestId?: string },
): { user: User; created: boolean; githubTaken: boolean } {
  const existing = s.users.find((u) => u.githubId === profile.id);
  if (existing) return { user: existing, created: false, githubTaken: false };
  if (opts?.guestId) {
    const guest = s.users.find((u) => u.id === opts.guestId && u.authKind === "guest");
    if (guest) {
      guest.githubId = profile.id;
      guest.githubLogin = profile.login;
      guest.avatarUrl = profile.avatar_url ?? undefined;
      guest.authKind = "github";
      return { user: guest, created: false, githubTaken: false };
    }
  }
  const handle = uniqueHandle(s, profile.login);
  const user = createUser(s, handle, profile.name ?? profile.login, {
    authKind: "github",
    githubId: profile.id,
    githubLogin: profile.login,
    avatarUrl: profile.avatar_url ?? undefined,
  });
  return { user, created: true, githubTaken: false };
}

function uniqueHandle(s: State, login: string) {
  const base = login.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 18) || "desk";
  if (!s.users.some((u) => u.handle === base)) return base;
  for (let i = 2; i < 99; i++) {
    const h = `${base}${i}`.slice(0, 20);
    if (!s.users.some((u) => u.handle === h)) return h;
  }
  return `${base}${Date.now().toString(36).slice(-4)}`;
}

export function noteJoinProbe(s: State, userId: string, ok: boolean) {
  const now = new Date().toISOString();
  s.joinProbes.push({ at: now, userId, ok });
  if (ok) return;
  const fails = s.joinProbes.filter((p) => p.userId === userId && !p.ok && p.at >= hourAgo(now));
  if (fails.length >= JOIN_FAILS_PER_HOUR) {
    throw new EngineError("join_rate", "Too many bad invites. Slow down.");
  }
}

export { PUBLIC_LEAGUE_ID };
