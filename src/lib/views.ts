import { DESK_USER_ID, PUBLIC_LEAGUE_ID } from "./constants";
import { devSwitcherEnabled } from "./flags";
import { boardPnL, integrityOf, markToMarket, realizedAndOpen } from "./engine";
import { prices } from "./lmsr";
import type { Category, IntegrityReport, Market, State, User } from "./types";

export type PricedMarket = Market & {
  prices: number[];
  integrity: IntegrityReport;
};

export function priceMarket(s: State, m: Market): PricedMarket {
  return {
    ...m,
    prices: prices(m.q, m.b, m.pi),
    integrity: integrityOf(s, m.id),
  };
}

export function isCatalogSport(m: Market) {
  return m.category === "sports" && m.createdBy === DESK_USER_ID && !m.featured;
}

export function flyMarkets(s: State, leagueId = PUBLIC_LEAGUE_ID): PricedMarket[] {
  return s.markets
    .filter((m) => m.leagueId === leagueId && m.status !== "resolved" && !isCatalogSport(m))
    .sort((a, b) => Number(b.featured) - Number(a.featured) || b.createdAt.localeCompare(a.createdAt))
    .map((m) => priceMarket(s, m));
}

export function booksByCategory(
  s: State,
  opts: { category?: Category | "all"; sport?: Market["sport"]; leagueId?: string } = {},
) {
  const leagueId = opts.leagueId ?? PUBLIC_LEAGUE_ID;
  return s.markets
    .filter((m) => m.leagueId === leagueId && m.status !== "resolved")
    .filter((m) => (opts.category && opts.category !== "all" ? m.category === opts.category : true))
    .filter((m) => (opts.sport ? m.sport === opts.sport : true))
    .sort((a, b) => a.closesAt.localeCompare(b.closesAt))
    .map((m) => ({ ...m, prices: prices(m.q, m.b, m.pi) }));
}

export function callSheet(s: State): PricedMarket[] {
  return s.markets
    .filter((m) => m.callSheet && m.status !== "resolved")
    .map((m) => priceMarket(s, m))
    .sort((a, b) => b.prices[0] - a.prices[0]);
}

export type BoardRow = {
  user: User;
  equity: number;
  pnl: number;
  boardPnl: number;
  cash: number;
  rank: number;
  beatPct: number;
};

export function leaderboard(s: State, leagueId: string): BoardRow[] {
  const members = s.memberships.filter((m) => m.leagueId === leagueId);
  const raw: Omit<BoardRow, "rank" | "beatPct">[] = [];
  for (const mem of members) {
    const user = s.users.find((u) => u.id === mem.userId);
    if (!user || user.system) continue;
    const { equity, pnl } = realizedAndOpen(s, user.id, leagueId);
    raw.push({
      user,
      equity,
      pnl,
      boardPnl: boardPnL(s, user.id, leagueId),
      cash: mem.cash,
    });
  }
  const sorted = raw.sort((a, b) => b.boardPnl - a.boardPnl);
  const n = sorted.length;
  return sorted.map((r, i) => ({
    ...r,
    rank: i + 1,
    beatPct: n <= 1 ? 100 : ((n - (i + 1)) / (n - 1)) * 100,
  }));
}

export function deskByHandle(s: State, handle: string) {
  const h = handle.toLowerCase();
  return s.users.find((u) => u.handle === h && !u.system) ?? null;
}

export function userPositions(s: State, userId: string, leagueId: string) {
  return s.positions
    .filter((p) => p.userId === userId)
    .map((p) => {
      const market = s.markets.find((m) => m.id === p.marketId);
      if (!market || market.leagueId !== leagueId) return null;
      const i = market.outcomes.findIndex((o) => o.id === p.outcomeId);
      const px = prices(market.q, market.b, market.pi)[i] ?? 0;
      return { ...p, market, outcome: market.outcomes[i], mark: p.shares * px };
    })
    .filter((x) => x !== null);
}

export function tape(s: State, marketId?: string, limit = 24) {
  const list = (marketId ? s.trades.filter((t) => t.marketId === marketId) : s.trades)
    .slice()
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
  return list.map((t) => {
    const user = s.users.find((u) => u.id === t.userId);
    const market = s.markets.find((m) => m.id === t.marketId);
    const outcome = market?.outcomes.find((o) => o.id === t.outcomeId);
    return { ...t, user, market, outcome };
  });
}

export function currentUser(s: State, userId: string | undefined) {
  if (!userId) return null;
  const u = s.users.find((x) => x.id === userId);
  if (!u || u.system) return null;
  if (u.authKind === "seed" && !devSwitcherEnabled()) return null;
  return u;
}

export { markToMarket };
