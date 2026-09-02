import { describe, expect, it } from "vitest";
import { buildSeed } from "./seed";
import { currentUser, leaderboard } from "./views";

describe("currentUser", () => {
  it("does not default to Mira", () => {
    const s = buildSeed();
    expect(currentUser(s, undefined)).toBeNull();
  });

  it("rejects seed desks unless the switcher is on", () => {
    const prev = process.env.SPARKBOARD_DEV_SWITCHER;
    delete process.env.SPARKBOARD_DEV_SWITCHER;
    const s = buildSeed();
    expect(currentUser(s, "user_mira")).toBeNull();
    if (prev === undefined) delete process.env.SPARKBOARD_DEV_SWITCHER;
    else process.env.SPARKBOARD_DEV_SWITCHER = prev;
  });

  it("never returns the oracle", () => {
    const s = buildSeed();
    expect(currentUser(s, "user_desk")).toBeNull();
  });

  it("ranks and reports beat percentile", () => {
    const s = buildSeed();
    const rows = leaderboard(s, "league_public");
    expect(rows[0].rank).toBe(1);
    expect(rows[0].beatPct).toBeGreaterThanOrEqual(rows.at(-1)?.beatPct ?? 0);
    expect(rows.at(-1)?.beatPct).toBe(0);
  });
});
