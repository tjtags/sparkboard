import { MIN_UNIQUE, STARTING_BANKROLL, SUNDAY_INVITE, SUNDAY_LEAGUE_ID } from "./constants";
import type { State, User } from "./types";

export function migrate(raw: State): State {
  const s = raw as State;
  s.lockInPicks ??= [];
  s.wireDrafts ??= [];
  s.spawnEvents ??= [];
  s.joinProbes ??= [];
  s.emailChallenges ??= [];
  s.messages ??= [];
  s.resolveEvents ??= [];
  for (const u of s.users as User[]) {
    if (!u.authKind) {
      u.authKind = u.system ? "system" : "seed";
    }
  }
  for (const l of s.leagues) {
    if (l.kind === "friends") {
      l.cardMode ??= "points";
      l.cardPool ??= "league+public";
    } else {
      l.cardMode ??= "off";
      l.cardPool ??= "league";
    }
  }
  if (!s.leagues.some((l) => l.id === SUNDAY_LEAGUE_ID || l.inviteCode === SUNDAY_INVITE)) {
    s.leagues.push({
      id: SUNDAY_LEAGUE_ID,
      name: "Sunday",
      slug: "sunday",
      kind: "friends",
      blurb: "One lock-in a week through the NFL slate. Points, not cash. Text /join/SUNDAY.",
      inviteCode: SUNDAY_INVITE,
      startingBankroll: STARTING_BANKROLL,
      minUniqueTraders: MIN_UNIQUE.friends,
      createdBy: s.users.find((u) => u.handle === "anjali")?.id ?? s.users[0]?.id ?? "user_desk",
      createdAt: new Date().toISOString(),
      cardMode: "points",
      cardPool: "league+public",
      sportSeason: "nfl",
    });
  }
  s.version = 2;
  return s;
}
