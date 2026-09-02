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
  s.version = 2;
  return s;
}
