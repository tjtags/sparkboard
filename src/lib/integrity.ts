import {
  CLUSTER_MIN_MARKETS,
  CLUSTER_OPPOSE,
  CLUSTER_VOLUME,
  THIN_TOP_TWO,
} from "./constants";
import type {
  Cluster,
  IntegrityReport,
  Market,
  Position,
  Trade,
} from "./types";

function volumeByUser(trades: Trade[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of trades) {
    m.set(t.userId, (m.get(t.userId) ?? 0) + t.cost);
  }
  return m;
}

function herfindahl(volumes: number[]): number {
  const total = volumes.reduce((a, b) => a + b, 0);
  if (total <= 0) return 0;
  return volumes.reduce((a, v) => a + (v / total) ** 2, 0);
}

export function marketVolume(trades: Trade[], marketId: string): Map<string, number> {
  return volumeByUser(trades.filter((t) => t.marketId === marketId));
}

export function reportMarket(
  market: Market,
  trades: Trade[],
): IntegrityReport {
  const mt = trades.filter((t) => t.marketId === market.id);
  const vol = volumeByUser(mt);
  const uniqueTraders = vol.size;
  const volumes = [...vol.values()].sort((a, b) => b - a);
  const total = volumes.reduce((a, b) => a + b, 0);
  const topTwo =
    total <= 0 ? 0 : ((volumes[0] ?? 0) + (volumes[1] ?? 0)) / total;
  const minMet = uniqueTraders >= market.minUniqueTraders;
  const thin = uniqueTraders < 2 || topTwo >= THIN_TOP_TWO;
  const reasons: string[] = [];
  if (!minMet) {
    reasons.push(
      `Needs ${market.minUniqueTraders} unique traders (has ${uniqueTraders}) before it scores the board.`,
    );
  }
  if (thin && uniqueTraders >= 2) {
    reasons.push(
      `Top two desks are ${(topTwo * 100).toFixed(0)}% of volume — treat the price as thin.`,
    );
  }
  if (uniqueTraders < 2) reasons.push("No real book yet.");
  const boardEligible = minMet && !thin;
  if (boardEligible) reasons.push("Clears market-sizing and unique-trader gates.");

  return {
    marketId: market.id,
    uniqueTraders,
    minUniqueTraders: market.minUniqueTraders,
    minMet,
    volume: total,
    topTwoVolumeShare: topTwo,
    herfindahl: herfindahl(volumes),
    thin,
    opposingPairs: [],
    boardEligible,
    reasons,
  };
}

type Vec = Map<string, number>;

function positionVector(positions: Position[], userId: string, marketId: string): Vec {
  const v: Vec = new Map();
  for (const p of positions) {
    if (p.userId === userId && p.marketId === marketId && p.shares > 1e-9) {
      v.set(p.outcomeId, p.shares);
    }
  }
  return v;
}

function cosine(a: Vec, b: Vec): number | null {
  const keys = new Set([...a.keys(), ...b.keys()]);
  if (keys.size === 0) return null;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const k of keys) {
    const x = a.get(k) ?? 0;
    const y = b.get(k) ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na <= 0 || nb <= 0) return null;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function findClusters(
  markets: Market[],
  positions: Position[],
  trades: Trade[],
): Cluster[] {
  const users = [...new Set(positions.map((p) => p.userId))].sort();
  const parent = new Map(users.map((u) => [u, u]));
  const find = (x: string): string => {
    const p = parent.get(x) ?? x;
    if (p !== x) parent.set(x, find(p));
    return parent.get(x) ?? x;
  };
  const union = (a: string, b: string) => {
    const pa = find(a);
    const pb = find(b);
    if (pa < pb) parent.set(pb, pa);
    else parent.set(pa, pb);
  };

  const pairs: { a: string; b: string; score: number }[] = [];

  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const a = users[i];
      const b = users[j];
      let oppose = 0;
      let shared = 0;
      let dominated = 0;
      for (const market of markets) {
        const va = positionVector(positions, a, market.id);
        const vb = positionVector(positions, b, market.id);
        const c = cosine(va, vb);
        if (c === null) continue;
        shared += 1;
        if (c <= CLUSTER_OPPOSE) oppose += 1;
        const vol = marketVolume(trades, market.id);
        const total = [...vol.values()].reduce((x, y) => x + y, 0);
        const theirs = (vol.get(a) ?? 0) + (vol.get(b) ?? 0);
        if (total > 0 && theirs / total >= CLUSTER_VOLUME) dominated += 1;
      }
      if (shared >= CLUSTER_MIN_MARKETS && oppose / shared >= 0.8 && dominated >= 1) {
        union(a, b);
        pairs.push({ a, b, score: oppose / shared });
      }
    }
  }

  const groups = new Map<string, string[]>();
  for (const u of users) {
    const p = find(u);
    const g = groups.get(p) ?? [];
    g.push(u);
    groups.set(p, g);
  }

  const clusters: Cluster[] = [];
  for (const [, ids] of groups) {
    if (ids.length < 2) continue;
    clusters.push({
      id: `cluster_${ids.join("_")}`,
      userIds: ids,
      reason: "Net opposing books across shared markets with concentrated volume.",
    });
  }
  return clusters;
}

export function attachPairs(
  report: IntegrityReport,
  clusters: Cluster[],
): IntegrityReport {
  const pairs = clusters.flatMap((c) => {
    const ids = c.userIds;
    const out: IntegrityReport["opposingPairs"] = [];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        out.push({ a: ids[i], b: ids[j], score: 1 });
      }
    }
    return out;
  });
  const reasons = [...report.reasons];
  if (pairs.length && report.boardEligible) {
    reasons.push("Sybil cluster detected among traders — board credit withheld.");
  }
  const boardEligible = report.boardEligible && pairs.length === 0;
  return { ...report, opposingPairs: pairs, boardEligible, reasons };
}

export function isBoardEligible(
  market: Market,
  trades: Trade[],
  clusters: Cluster[],
): boolean {
  if (market.status === "resolved") {
    return market.boardEligibleAtResolve ?? false;
  }
  const r = attachPairs(reportMarket(market, trades), clusters);
  return r.boardEligible;
}
