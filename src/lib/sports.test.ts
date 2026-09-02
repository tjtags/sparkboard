import { describe, expect, it } from "vitest";
import { cardPool } from "./lockin";
import { buildSeed, emptyState } from "./seed";
import {
  catalogCounts,
  ensureMarketById,
  ensureSportsMarkets,
  INVENTED,
  marketIdFor,
  specFromGame,
} from "./sports";

describe("sports catalog", () => {
  it("names Super Bowl LXI MVP as mkt_sb-lxi-mvp with ten outcomes", () => {
    const g = INVENTED.find((x) => x.id === "sb-lxi-mvp");
    expect(g).toBeTruthy();
    expect(marketIdFor(g!)).toBe("mkt_sb-lxi-mvp");
    const spec = specFromGame(g!);
    expect(spec.outcomes).toHaveLength(10);
    expect(spec.featured).toBe(true);
    expect(spec.category).toBe("sports");
  });

  it("lists at least a thousand unique games after catalog + invented pack", () => {
    const c = catalogCounts();
    expect(c.total).toBeGreaterThanOrEqual(1000);
    expect(c.nfl).toBeGreaterThanOrEqual(250);
  });

  it("upserts invented books and is idempotent", () => {
    const s = emptyState();
    ensureSportsMarkets(s, 40);
    expect(s.markets.some((m) => m.id === "mkt_sb-lxi-mvp")).toBe(true);
    const n = s.markets.length;
    ensureSportsMarkets(s, 40);
    expect(s.markets.length).toBe(n);
  });

  it("opens a catalog row on demand", () => {
    const s = emptyState();
    const opened = ensureMarketById(s, "mkt_sb-lxi-mvp");
    expect(opened?.question).toMatch(/Super Bowl LXI MVP/);
    expect(ensureMarketById(s, "mkt_sb-lxi-mvp")?.id).toBe(opened?.id);
    expect(ensureMarketById(s, "mkt_does_not_exist")).toBeUndefined();
  });
});

describe("season card pool", () => {
  it("NFL desks only see that week's moneylines", () => {
    const s = buildSeed();
    ensureSportsMarkets(s, 400);
    const desk = s.leagues.find((l) => l.id === "league_desk12")!;
    desk.sportSeason = "nfl";
    const pool = cardPool(s, "league_desk12", new Date("2026-09-10T18:00:00Z"));
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((m) => m.sport === "nfl")).toBe(true);
    expect(pool.every((m) => (m.tags ?? []).includes("week-1"))).toBe(true);
  });
});
