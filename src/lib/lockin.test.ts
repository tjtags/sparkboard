import { describe, expect, it } from "vitest";
import { edgePoints, isoWeekKey, setLockInPick, settlePicksForMarket } from "./lockin";
import { buildSeed } from "./seed";

describe("lock-in", () => {
  it("scores a 62¢ hit as +38 and a miss as −62", () => {
    expect(edgePoints(0.62, true)).toBe(38);
    expect(edgePoints(0.62, false)).toBe(-62);
  });

  it("does not touch cash when a market resolves", () => {
    const s = buildSeed();
    const before = s.memberships.find((m) => m.userId === "user_anjali" && m.leagueId === "league_desk12")!.cash;
    setLockInPick(s, "user_anjali", "league_desk12", "mkt_house", "o0");
    const market = s.markets.find((m) => m.id === "mkt_house")!;
    market.status = "resolved";
    market.resolvedOutcomeId = "o0";
    settlePicksForMarket(s, market);
    const after = s.memberships.find((m) => m.userId === "user_anjali" && m.leagueId === "league_desk12")!.cash;
    expect(after).toBe(before);
    const pick = s.lockInPicks[0];
    expect(pick.status).toBe("hit");
  });

  it("prints an ISO week key", () => {
    expect(isoWeekKey(new Date("2026-09-02T12:00:00Z"))).toMatch(/^2026-W\d{2}$/);
  });
});
