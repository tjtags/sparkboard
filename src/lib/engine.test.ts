import { describe, expect, it } from "vitest";
import { CHALLENGE_MS, STARTING_BANKROLL } from "./constants";
import {
  applyTrade,
  boardPnL,
  challengeMarket,
  createMarket,
  createUser,
  integrityOf,
  joinLeague,
  resolveMarket,
  tickResolves,
} from "./engine";
import { buildSeed, emptyState } from "./seed";

describe("seeded square", () => {
  it("House market clears the unique-trader gate", () => {
    const s = buildSeed();
    const r = integrityOf(s, "mkt_house");
    expect(r.uniqueTraders).toBeGreaterThanOrEqual(5);
    expect(r.boardEligible).toBe(true);
  });

  it("coin-flip sybil book is not board-eligible", () => {
    const s = buildSeed();
    const r = integrityOf(s, "mkt_coinflip");
    expect(r.uniqueTraders).toBe(2);
    expect(r.boardEligible).toBe(false);
    expect(r.minMet).toBe(false);
  });

  it("rejects oversized tickets", () => {
    const s = buildSeed();
    expect(() =>
      applyTrade(s, {
        userId: "user_mira",
        marketId: "mkt_house",
        outcomeId: "o0",
        side: "buy",
        amount: 200_000,
        mode: "spend",
      }),
    ).toThrow(/Max is/);
  });

  it("claws farmed PnL off the board after a thin resolve", () => {
    const s = buildSeed();
    const t0 = new Date("2026-09-02T12:00:00Z");
    resolveMarket(s, "user_desk", "mkt_coinflip", "o0", { now: t0 });
    expect(s.markets.find((m) => m.id === "mkt_coinflip")?.status).toBe("closed");
    tickResolves(s, new Date(t0.getTime() + CHALLENGE_MS + 1000));
    const botte = boardPnL(s, "user_botte", "league_public");
    const echo = boardPnL(s, "user_echo", "league_public");
    expect(botte).toBeCloseTo(0, 0);
    expect(echo).toBeCloseTo(0, 0);
    const miraRaw = s.memberships.find((m) => m.userId === "user_mira" && m.leagueId === "league_public")!;
    expect(miraRaw.cash).toBeLessThan(STARTING_BANKROLL);
  });
});

describe("oracle", () => {
  it("blocks Public Square members from resolving", () => {
    const s = buildSeed();
    expect(() => resolveMarket(s, "user_mira", "mkt_house", "o0")).toThrow(/oracle/);
  });

  it("lets a friend-league creator settle immediately", () => {
    const s = buildSeed();
    resolveMarket(s, "user_anjali", "mkt_chat", "o1");
    expect(s.markets.find((m) => m.id === "mkt_chat")?.status).toBe("resolved");
    expect(s.markets.find((m) => m.id === "mkt_chat")?.resolvedBy).toBe("user_anjali");
  });

  it("blocks a friend-league member who did not create the book", () => {
    const s = buildSeed();
    expect(() => resolveMarket(s, "user_cole", "mkt_chat", "o0")).toThrow(/oracle/);
  });

  it("holds Public Square payout for 24h unless challenged", () => {
    const s = buildSeed();
    const t0 = new Date("2026-09-02T12:00:00Z");
    resolveMarket(s, "user_desk", "mkt_house", "o0", { now: t0, sourceUrl: "https://ap.org" });
    const house = s.markets.find((m) => m.id === "mkt_house")!;
    expect(house.status).toBe("closed");
    expect(house.pendingOutcomeId).toBe("o0");
    expect(house.resolutionSourceUrl).toBe("https://ap.org");
    expect(s.resolveEvents.some((e) => e.action === "propose" && e.marketId === "mkt_house")).toBe(true);
    challengeMarket(s, "user_mira", "mkt_house", { now: new Date(t0.getTime() + 1000) });
    expect(tickResolves(s, new Date(t0.getTime() + CHALLENGE_MS + 1000))).toBe(0);
    expect(s.markets.find((m) => m.id === "mkt_house")?.status).toBe("closed");
    expect(s.markets.find((m) => m.id === "mkt_house")?.challengedBy).toBe("user_mira");
  });
});

describe("new desks", () => {
  it("spawns with a million sparks and cannot transfer", () => {
    const s = emptyState();
    s.users.push({
      id: "user_desk",
      handle: "desk",
      displayName: "Desk",
      desk: "Oracle",
      createdAt: new Date().toISOString(),
      system: true,
      authKind: "system",
    });
    s.leagues.push({
      id: "league_public",
      name: "Public Square",
      slug: "public-square",
      kind: "global",
      blurb: "",
      startingBankroll: STARTING_BANKROLL,
      minUniqueTraders: 5,
      createdBy: "user_desk",
      createdAt: new Date().toISOString(),
    });
    const u = createUser(s, "nova");
    const mem = s.memberships.find((m) => m.userId === u.id)!;
    expect(mem.cash).toBe(STARTING_BANKROLL);
    expect(s.memberships.length).toBe(1);
  });

  it("LMSR prior is respected on a fresh market", () => {
    const s = buildSeed();
    const m = createMarket(s, "user_mira", {
      leagueId: "league_public",
      question: "Will it rain in Philadelphia on Inauguration Day 2027?",
      description: "NWS official.",
      resolutionCriteria: "Yes if NWS PHL records measurable precipitation that calendar day.",
      category: "science",
      outcomeNames: ["Yes", "No"],
      prior: [0.2, 0.8],
      b: 10_000,
      closesAt: "2027-01-20T23:59:00.000Z",
    });
    expect(m.pi[0]).toBeCloseTo(0.2);
    expect(m.q).toEqual([0, 0]);
  });
});

describe("joinLeague export", () => {
  it("is imported so empty-state helpers typecheck", () => {
    expect(typeof joinLeague).toBe("function");
  });
});
