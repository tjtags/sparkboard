import { describe, expect, it } from "vitest";
import { applyTrade } from "../engine";
import { buildSeed } from "../seed";
import { rowsToState, stateToRows } from "./map";

describe("postgres row map", () => {
  it("round-trips seed including a trade", () => {
    const s = buildSeed();
    applyTrade(s, {
      userId: "user_mira",
      marketId: "mkt_house",
      outcomeId: "o0",
      side: "buy",
      amount: 1000,
      mode: "spend",
    });
    const back = rowsToState(stateToRows(s));
    expect(back.users.map((u) => u.handle)).toEqual(s.users.map((u) => u.handle));
    expect(back.leagues.some((l) => l.inviteCode === "SUNDAY")).toBe(true);
    expect(back.markets.find((m) => m.id === "mkt_house")?.q[0]).toBeCloseTo(
      s.markets.find((m) => m.id === "mkt_house")!.q[0],
    );
    expect(back.trades.at(-1)?.userId).toBe("user_mira");
    expect(back.memberships.find((m) => m.userId === "user_mira" && m.leagueId === "league_public")?.cash).toBeCloseTo(
      s.memberships.find((m) => m.userId === "user_mira" && m.leagueId === "league_public")!.cash,
    );
  });
});
