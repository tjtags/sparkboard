import { describe, expect, it } from "vitest";
import { forecastsCsv, publicForecasts } from "./forecasts";
import { buildSeed } from "./seed";

describe("public forecasts", () => {
  it("exports board-eligible Public Square books and drops the coin-flip", () => {
    const s = buildSeed();
    const rows = publicForecasts(s, "https://sparkboard.example");
    expect(rows.some((r) => r.id === "mkt_house")).toBe(true);
    expect(rows.some((r) => r.id === "mkt_coinflip")).toBe(false);
    expect(rows.every((r) => r.boardEligible)).toBe(true);
    expect(rows.find((r) => r.id === "mkt_house")?.permalink).toContain("/markets/mkt_house");
    const csv = forecastsCsv(rows);
    expect(csv).toContain("mkt_house");
    expect(csv.split("\n")[0]).toContain("permalink");
  });
});
