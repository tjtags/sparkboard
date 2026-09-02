import { describe, expect, it } from "vitest";
import type { VenueQuote } from "./types";

function midYes(bid?: string, ask?: string, last?: string) {
  const n = (s?: string) => (s == null ? null : Number(s));
  const l = n(last);
  if (l != null && Number.isFinite(l)) return l;
  const b = n(bid);
  const a = n(ask);
  if (b != null && a != null) return (b + a) / 2;
  return b ?? a;
}

describe("venue quote math", () => {
  it("mids Kalshi yes bid/ask", () => {
    expect(midYes("0.40", "0.44", undefined)).toBeCloseTo(0.42);
    expect(midYes("0.40", "0.44", "0.41")).toBeCloseTo(0.41);
  });

  it("keeps Sparkboard quotes as probabilities in (0,1)", () => {
    const q: VenueQuote = {
      venue: "polymarket",
      id: "1",
      title: "Fed holds",
      category: "Economics",
      url: "https://polymarket.com",
      yes: 0.425,
      volume24h: 960011,
      closesAt: null,
      nOutcomes: 2,
    };
    expect(q.yes).toBeGreaterThan(0);
    expect(q.yes).toBeLessThan(1);
  });
});
