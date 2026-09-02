import { EngineError, getLeague, membership, outcomeIndex } from "./engine";
import { isoWeekKey, weekBounds } from "./lockin-week";
import { prices } from "./lmsr";
import { inSportWeek } from "./sports";
import type { LockInPick, Market, State } from "./types";

export { isoWeekKey, weekBounds };

function nid(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

export function cardEligible(m: Market) {
  return m.status === "open" && m.category !== "meta" && m.id !== "mkt_coinflip";
}

export function cardPool(s: State, leagueId: string, now = new Date()): Market[] {
  const league = getLeague(s, leagueId);
  if (league.sportSeason) {
    return s.markets.filter((m) => cardEligible(m) && inSportWeek(m, league.sportSeason!, now));
  }
  const pool = league.cardPool ?? (league.kind === "friends" ? "league+public" : "league");
  return s.markets.filter((m) => {
    if (!cardEligible(m)) return false;
    if (m.leagueId === leagueId) return true;
    if (pool === "league+public" && m.leagueId === "league_public") return true;
    return false;
  });
}

export function lockDeadline(week: string, market: Market) {
  const { locksAt } = weekBounds(week);
  const close = new Date(market.closesAt).getTime();
  const weekLock = new Date(locksAt).getTime();
  return new Date(Math.min(close, weekLock)).toISOString();
}

export function lazyLock(pick: LockInPick, market: Market, now = new Date()) {
  if (pick.status !== "open") return pick;
  if (now.toISOString() >= lockDeadline(pick.week, market)) {
    pick.status = "locked";
  }
  return pick;
}

export function setLockInPick(
  s: State,
  userId: string,
  leagueId: string,
  marketId: string,
  outcomeId: string,
  now = new Date(),
): LockInPick {
  membership(s, userId, leagueId);
  const league = getLeague(s, leagueId);
  if ((league.cardMode ?? "off") === "off") {
    throw new EngineError("cards_off", "This league is not running cards");
  }
  const week = isoWeekKey(now);
  const market = s.markets.find((m) => m.id === marketId);
  if (!market || !cardEligible(market)) throw new EngineError("bad_card", "That book is not on the card");
  if (!cardPool(s, leagueId).some((m) => m.id === marketId)) {
    throw new EngineError("bad_card", "That book is not in this league's pool");
  }
  const deadline = lockDeadline(week, market);
  if (now.toISOString() >= deadline) throw new EngineError("locked", "This week's card is locked");
  outcomeIndex(market, outcomeId);
  const px = prices(market.q, market.b, market.pi)[outcomeIndex(market, outcomeId)];

  const reused = s.lockInPicks.find(
    (p) =>
      p.userId === userId &&
      p.leagueId === leagueId &&
      p.marketId === marketId &&
      p.week !== week &&
      p.status !== "hit" &&
      p.status !== "miss" &&
      p.status !== "void",
  );
  if (reused) throw new EngineError("reuse", "You already have that book on an unsettled card");

  let pick = s.lockInPicks.find(
    (p) => p.userId === userId && p.leagueId === leagueId && p.week === week,
  );
  if (pick) {
    lazyLock(pick, s.markets.find((m) => m.id === pick!.marketId) ?? market, now);
    if (pick.status !== "open") throw new EngineError("locked", "This week's card is locked");
    pick.marketId = marketId;
    pick.outcomeId = outcomeId;
    pick.pLock = px;
    pick.updatedAt = now.toISOString();
    return pick;
  }
  pick = {
    id: nid("card"),
    userId,
    leagueId,
    week,
    marketId,
    outcomeId,
    pLock: px,
    status: "open",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  s.lockInPicks.push(pick);
  return pick;
}

export function settlePicksForMarket(s: State, market: Market) {
  const winner = market.resolvedOutcomeId;
  for (const pick of s.lockInPicks) {
    if (pick.marketId !== market.id) continue;
    if (pick.status === "hit" || pick.status === "miss" || pick.status === "void") continue;
    if (!winner) {
      pick.status = "void";
      pick.edge = 0;
      continue;
    }
    const hit = pick.outcomeId === winner;
    pick.status = hit ? "hit" : "miss";
    pick.edge = hit ? 1 - pick.pLock : -pick.pLock;
  }
}

export function cardBoard(s: State, leagueId: string, week = isoWeekKey()) {
  const members = s.memberships.filter((m) => m.leagueId === leagueId);
  return members
    .map((mem) => {
      const user = s.users.find((u) => u.id === mem.userId);
      if (!user || user.system) return null;
      const picks = s.lockInPicks.filter((p) => p.userId === user.id && p.leagueId === leagueId);
      const weekPick = picks.find((p) => p.week === week);
      const score = picks.reduce((a, p) => a + (p.edge ?? 0), 0);
      return { user, weekPick, score, hits: picks.filter((p) => p.status === "hit").length };
    })
    .filter((x) => x !== null)
    .sort((a, b) => b.score - a.score);
}

export function edgePoints(pLock: number, hit: boolean) {
  const edge = hit ? 1 - pLock : -pLock;
  return Math.round(edge * 100);
}

export function needsSit(s: State, now = new Date()) {
  const week = isoWeekKey(now);
  if (now.toISOString() < weekBounds(week).locksAt) return false;
  for (const league of s.leagues) {
    if (!league.sportSeason || (league.cardMode ?? "off") === "off") continue;
    for (const mem of s.memberships.filter((m) => m.leagueId === league.id)) {
      const user = s.users.find((u) => u.id === mem.userId);
      if (!user || user.system) continue;
      const has = s.lockInPicks.some((p) => p.userId === user.id && p.leagueId === league.id && p.week === week);
      if (!has) return true;
    }
  }
  return false;
}

/** After this week's lock, season-desk members with no pick sit the week. Sparks do not move. */
export function sitMissedCards(s: State, now = new Date()) {
  const week = isoWeekKey(now);
  const { locksAt } = weekBounds(week);
  if (now.toISOString() < locksAt) return 0;
  let n = 0;
  for (const league of s.leagues) {
    if (!league.sportSeason) continue;
    if ((league.cardMode ?? "off") === "off") continue;
    for (const mem of s.memberships.filter((m) => m.leagueId === league.id)) {
      const user = s.users.find((u) => u.id === mem.userId);
      if (!user || user.system) continue;
      const has = s.lockInPicks.some((p) => p.userId === user.id && p.leagueId === league.id && p.week === week);
      if (has) continue;
      s.lockInPicks.push({
        id: nid("sit"),
        userId: user.id,
        leagueId: league.id,
        week,
        marketId: "mkt_sit",
        outcomeId: "sit",
        pLock: 0,
        status: "void",
        edge: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
      n += 1;
    }
  }
  return n;
}
