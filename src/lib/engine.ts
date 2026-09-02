import {
  DEFAULT_B,
  MAX_B,
  MAX_MARKET_COST_FRAC,
  MAX_TRADE_CASH_FRAC,
  MIN_B,
  MIN_TRADE,
  MIN_UNIQUE,
  PUBLIC_LEAGUE_ID,
  STARTING_BANKROLL,
} from "./constants";
import { attachPairs, findClusters, reportMarket } from "./integrity";
import {
  normalize,
  prices,
  quoteBuyShares,
  quoteBuySpend,
  quoteSellShares,
  sharesForProceeds,
  sharesForSpend,
} from "./lmsr";
import type {
  Category,
  Cluster,
  IntegrityReport,
  League,
  Market,
  Membership,
  Position,
  State,
  Trade,
  User,
} from "./types";

export class EngineError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function now() {
  return new Date().toISOString();
}

function nid(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

export function getUser(s: State, id: string) {
  const u = s.users.find((x) => x.id === id);
  if (!u) throw new EngineError("no_user", "Unknown desk");
  return u;
}

export function getLeague(s: State, id: string) {
  const l = s.leagues.find((x) => x.id === id);
  if (!l) throw new EngineError("no_league", "Unknown league");
  return l;
}

export function getMarket(s: State, id: string) {
  const m = s.markets.find((x) => x.id === id);
  if (!m) throw new EngineError("no_market", "Unknown market");
  return m;
}

export function membership(s: State, userId: string, leagueId: string) {
  const m = s.memberships.find((x) => x.userId === userId && x.leagueId === leagueId);
  if (!m) throw new EngineError("not_in_league", "Join this league first");
  return m;
}

export function outcomeIndex(market: Market, outcomeId: string) {
  const i = market.outcomes.findIndex((o) => o.id === outcomeId);
  if (i < 0) throw new EngineError("no_outcome", "Unknown outcome");
  return i;
}

export function positionOf(
  s: State,
  userId: string,
  marketId: string,
  outcomeId: string,
): Position | undefined {
  return s.positions.find(
    (p) => p.userId === userId && p.marketId === marketId && p.outcomeId === outcomeId,
  );
}

export function markToMarket(s: State, userId: string, leagueId: string): number {
  const mem = s.memberships.find((m) => m.userId === userId && m.leagueId === leagueId);
  if (!mem) return 0;
  let equity = mem.cash;
  for (const market of s.markets.filter((m) => m.leagueId === leagueId && m.status !== "resolved")) {
    for (const o of market.outcomes) {
      const pos = positionOf(s, userId, market.id, o.id);
      if (!pos || pos.shares <= 0) continue;
      const i = outcomeIndex(market, o.id);
      equity += quoteSellShares(market.q, market.b, i, pos.shares, market.pi).cost;
    }
  }
  return equity;
}

export function realizedAndOpen(s: State, userId: string, leagueId: string) {
  const mtm = markToMarket(s, userId, leagueId);
  const start = getLeague(s, leagueId).startingBankroll;
  return { equity: mtm, pnl: mtm - start };
}

export function clustersOf(s: State): Cluster[] {
  return findClusters(s.markets, s.positions, s.trades);
}

export function integrityOf(s: State, marketId: string): IntegrityReport {
  const market = getMarket(s, marketId);
  return attachPairs(reportMarket(market, s.trades), clustersOf(s));
}

export function boardPnL(s: State, userId: string, leagueId: string): number {
  const league = getLeague(s, leagueId);
  const mem = s.memberships.find((m) => m.userId === userId && m.leagueId === leagueId);
  if (!mem) return 0;
  const clusters = clustersOf(s);
  let equity = mem.cash;
  for (const market of s.markets.filter((m) => m.leagueId === leagueId)) {
    const eligible =
      market.status === "resolved"
        ? (market.boardEligibleAtResolve ?? false)
        : attachPairs(reportMarket(market, s.trades), clusters).boardEligible;

    if (market.status !== "resolved") {
      let mtm = 0;
      let basis = 0;
      for (const o of market.outcomes) {
        const pos = positionOf(s, userId, market.id, o.id);
        if (!pos || pos.shares <= 0) continue;
        basis += pos.costBasis;
        const i = outcomeIndex(market, o.id);
        mtm += quoteSellShares(market.q, market.b, i, pos.shares, market.pi).cost;
      }
      equity += eligible ? mtm : basis;
    } else if (!eligible) {
      const { netSpend, payout } = reconstructSettled(s, userId, market);
      equity -= payout - netSpend;
    }
  }
  return equity - league.startingBankroll;
}

function reconstructSettled(s: State, userId: string, market: Market) {
  let netSpend = 0;
  let shares = 0;
  for (const t of s.trades) {
    if (t.userId !== userId || t.marketId !== market.id) continue;
    if (t.side === "buy") {
      netSpend += t.cost;
      if (t.outcomeId === market.resolvedOutcomeId) shares += t.shares;
    } else {
      netSpend -= t.cost;
      if (t.outcomeId === market.resolvedOutcomeId) shares -= t.shares;
    }
  }
  return { netSpend, payout: Math.max(0, shares) };
}

export function createUser(s: State, handle: string, displayName?: string): User {
  const h = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
  if (h.length < 2) throw new EngineError("bad_handle", "Handle needs at least 2 characters");
  if (s.users.some((u) => u.handle === h)) throw new EngineError("handle_taken", "Handle already in use");
  const user: User = {
    id: nid("user"),
    handle: h,
    displayName: (displayName || handle).trim().slice(0, 40),
    desk: "Independent",
    createdAt: now(),
  };
  s.users.push(user);
  joinLeague(s, user.id, PUBLIC_LEAGUE_ID);
  return user;
}

export function joinLeague(s: State, userId: string, leagueId: string, invite?: string) {
  getUser(s, userId);
  const league = getLeague(s, leagueId);
  if (league.kind === "friends" && league.inviteCode && invite !== league.inviteCode) {
    throw new EngineError("bad_invite", "That invite code does not match");
  }
  if (s.memberships.some((m) => m.userId === userId && m.leagueId === leagueId)) {
    throw new EngineError("already_in", "Already in this league");
  }
  const mem: Membership = {
    userId,
    leagueId,
    cash: league.startingBankroll,
    joinedAt: now(),
  };
  s.memberships.push(mem);
  return mem;
}

export function createLeague(
  s: State,
  userId: string,
  name: string,
  blurb: string,
): League {
  getUser(s, userId);
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  if (slug.length < 2) throw new EngineError("bad_name", "League needs a name");
  if (s.leagues.some((l) => l.slug === slug)) throw new EngineError("slug_taken", "Name is taken");
  const league: League = {
    id: nid("league"),
    name: name.trim().slice(0, 48),
    slug,
    kind: "friends",
    blurb: blurb.trim().slice(0, 160) || "A private desk.",
    inviteCode: crypto.randomUUID().slice(0, 6).toUpperCase(),
    startingBankroll: STARTING_BANKROLL,
    minUniqueTraders: MIN_UNIQUE.friends,
    createdBy: userId,
    createdAt: now(),
  };
  s.leagues.push(league);
  joinLeague(s, userId, league.id, league.inviteCode);
  return league;
}

export function createMarket(
  s: State,
  userId: string,
  input: {
    leagueId: string;
    question: string;
    description: string;
    resolutionCriteria: string;
    category: Category;
    outcomeNames: string[];
    prior?: number[];
    b?: number;
    featured?: boolean;
    callSheet?: boolean;
    closesAt: string;
  },
): Market {
  getUser(s, userId);
  const league = getLeague(s, input.leagueId);
  membership(s, userId, league.id);
  const question = input.question.trim();
  if (question.length < 8) throw new EngineError("bad_question", "Ask a clearer question");
  const names = input.outcomeNames.map((n) => n.trim()).filter(Boolean);
  if (names.length < 2) throw new EngineError("bad_outcomes", "Need at least two outcomes");
  if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) {
    throw new EngineError("dup_outcomes", "Outcome names must be unique");
  }
  const b = Math.min(MAX_B, Math.max(MIN_B, input.b ?? DEFAULT_B[league.kind]));
  const pi = input.prior && input.prior.length === names.length ? input.prior : undefined;
  const market: Market = {
    id: nid("mkt"),
    leagueId: league.id,
    question,
    description: input.description.trim(),
    resolutionCriteria: input.resolutionCriteria.trim() || "Resolved by the creating desk from public sources.",
    category: input.category,
    featured: Boolean(input.featured),
    callSheet: Boolean(input.callSheet),
    outcomes: names.map((name, i) => ({ id: `o${i}`, name })),
    q: names.map(() => 0),
    pi: normalize(pi ?? names.map(() => 1 / names.length)),
    b,
    status: "open",
    createdBy: userId,
    closesAt: input.closesAt,
    createdAt: now(),
    minUniqueTraders: league.minUniqueTraders,
  };
  s.markets.push(market);
  return market;
}

export type TradeInput = {
  userId: string;
  marketId: string;
  outcomeId: string;
  side: "buy" | "sell";
  /** Spend sparks (buy) or raise sparks (sell) when mode is 'spend'. */
  amount: number;
  mode: "spend" | "shares";
};

export function quoteTrade(s: State, input: TradeInput) {
  const market = getMarket(s, input.marketId);
  if (market.status !== "open") throw new EngineError("closed", "Market is not open");
  const i = outcomeIndex(market, input.outcomeId);
  membership(s, input.userId, market.leagueId);
  const pos = positionOf(s, input.userId, market.id, input.outcomeId);
  if (input.mode === "spend") {
    if (input.side === "buy") {
      return quoteBuySpend(market.q, market.b, i, input.amount, market.pi);
    }
    const shares = sharesForProceeds(
      market.q,
      market.b,
      i,
      input.amount,
      pos?.shares ?? 0,
      market.pi,
    );
    if (shares <= 0) throw new EngineError("no_position", "Nothing to sell");
    return quoteSellShares(market.q, market.b, i, shares, market.pi);
  }
  if (input.side === "buy") {
    return quoteBuyShares(market.q, market.b, i, input.amount, market.pi);
  }
  if (!pos || pos.shares < input.amount) throw new EngineError("no_position", "Not enough shares");
  return quoteSellShares(market.q, market.b, i, input.amount, market.pi);
}

export function applyTrade(s: State, input: TradeInput): Trade {
  const user = getUser(s, input.userId);
  if (user.system) throw new EngineError("system", "The oracle desk does not trade");
  const market = getMarket(s, input.marketId);
  if (market.status !== "open") throw new EngineError("closed", "Market is not open");
  if (new Date(market.closesAt).getTime() < Date.now()) {
    market.status = "closed";
    throw new EngineError("closed", "Market has closed");
  }
  const league = getLeague(s, market.leagueId);
  const mem = membership(s, input.userId, market.leagueId);
  const i = outcomeIndex(market, input.outcomeId);
  const pos = positionOf(s, input.userId, market.id, input.outcomeId);

  let shares: number;
  let costAmt: number;
  if (input.side === "buy") {
    if (input.mode === "spend") {
      if (input.amount < MIN_TRADE) {
        throw new EngineError("min_trade", `Minimum ticket is ✦${MIN_TRADE}`);
      }
      shares = sharesForSpend(market.q, market.b, i, input.amount, market.pi);
      costAmt = input.amount;
    } else {
      const q = quoteBuyShares(market.q, market.b, i, input.amount, market.pi);
      shares = q.shares;
      costAmt = q.cost;
    }
    if (costAmt > mem.cash + 1e-6) throw new EngineError("broke", "Not enough sparks");
    const cap = mem.cash * MAX_TRADE_CASH_FRAC;
    if (costAmt > cap + 1e-6) {
      throw new EngineError(
        "size",
        `Ticket is ${((costAmt / mem.cash) * 100).toFixed(0)}% of cash. Max is ${(MAX_TRADE_CASH_FRAC * 100).toFixed(0)}% — market sizing.`,
      );
    }
    const currentBasis = s.positions
      .filter((p) => p.userId === input.userId && p.marketId === market.id)
      .reduce((a, p) => a + p.costBasis, 0);
    if (currentBasis + costAmt > league.startingBankroll * MAX_MARKET_COST_FRAC + 1e-6) {
      throw new EngineError(
        "exposure",
        `This book would exceed ${(MAX_MARKET_COST_FRAC * 100).toFixed(0)}% of your starting bankroll in one market.`,
      );
    }
    mem.cash -= costAmt;
    market.q[i] += shares;
    upsertPosition(s, input.userId, market.id, input.outcomeId, shares, costAmt);
  } else {
    if (!pos || pos.shares <= 0) throw new EngineError("no_position", "Nothing to sell");
    if (input.mode === "spend") {
      shares = sharesForProceeds(market.q, market.b, i, input.amount, pos.shares, market.pi);
    } else {
      shares = Math.min(input.amount, pos.shares);
    }
    if (shares <= 0) throw new EngineError("no_position", "Nothing to sell");
    const quote = quoteSellShares(market.q, market.b, i, shares, market.pi);
    costAmt = quote.cost;
    mem.cash += costAmt;
    market.q[i] -= shares;
    const frac = shares / pos.shares;
    pos.shares -= shares;
    pos.costBasis *= 1 - frac;
    if (pos.shares <= 1e-9) {
      s.positions = s.positions.filter((p) => p !== pos);
    }
  }

  const trade: Trade = {
    id: nid("tr"),
    userId: input.userId,
    marketId: market.id,
    outcomeId: input.outcomeId,
    side: input.side,
    shares,
    cost: costAmt,
    avgPrice: shares > 0 ? costAmt / shares : 0,
    pricesAfter: prices(market.q, market.b, market.pi),
    at: now(),
  };
  s.trades.push(trade);
  s.updatedAt = trade.at;
  return trade;
}

function upsertPosition(
  s: State,
  userId: string,
  marketId: string,
  outcomeId: string,
  shares: number,
  costAmt: number,
) {
  const existing = positionOf(s, userId, marketId, outcomeId);
  if (existing) {
    existing.shares += shares;
    existing.costBasis += costAmt;
    return;
  }
  s.positions.push({ userId, marketId, outcomeId, shares, costBasis: costAmt });
}

export function resolveMarket(s: State, actorId: string, marketId: string, outcomeId: string) {
  const actor = getUser(s, actorId);
  const market = getMarket(s, marketId);
  if (market.status === "resolved") throw new EngineError("resolved", "Already resolved");
  const inLeague = s.memberships.some(
    (m) => m.userId === actor.id && m.leagueId === market.leagueId,
  );
  const can = actor.system || actor.id === market.createdBy || inLeague;
  if (!can) throw new EngineError("forbidden", "Join the league to resolve (demo oracle)");
  outcomeIndex(market, outcomeId);
  const report = integrityOf(s, market.id);
  market.status = "resolved";
  market.resolvedOutcomeId = outcomeId;
  market.resolvedAt = now();
  market.boardEligibleAtResolve = report.boardEligible;

  const holders = s.positions.filter((p) => p.marketId === market.id);
  for (const pos of holders) {
    const mem = membership(s, pos.userId, market.leagueId);
    if (pos.outcomeId === outcomeId) mem.cash += pos.shares;
  }
  s.positions = s.positions.filter((p) => p.marketId !== market.id);
  s.updatedAt = market.resolvedAt;
  return market;
}
