import { describe, expect, it } from "vitest";
import { buildSeed } from "./seed";
import { openWireBook, wireMarketId } from "./wire-book";

describe("wire book", () => {
  it("lists a venue print as a play-money prior and is idempotent", () => {
    const s = buildSeed();
    const quote = {
      venue: "kalshi" as const,
      id: "FED-SEP",
      title: "Fed holds in September",
      category: "Economics",
      url: "https://kalshi.com/markets/fed",
      yes: 0.42,
      volume24h: 1000,
      closesAt: "2026-09-17T18:00:00.000Z",
      nOutcomes: 2,
    };
    const a = openWireBook(s, "user_mira", quote);
    expect(a.id).toBe(wireMarketId("kalshi", "FED-SEP"));
    expect(a.pi[0]).toBeCloseTo(0.42, 5);
    expect(a.resolutionCriteria).toMatch(/Not copied/);
    const b = openWireBook(s, "user_cole", quote);
    expect(b.id).toBe(a.id);
    expect(s.markets.filter((m) => m.id === a.id)).toHaveLength(1);
  });
});
