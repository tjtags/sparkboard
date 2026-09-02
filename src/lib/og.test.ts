import { describe, expect, it } from "vitest";
import { ogPct } from "./og";
import { normalize } from "./lmsr";
import type { Market } from "./types";

const house = {
  id: "mkt_house",
  outcomes: [
    { id: "o0", name: "Yes — Democrats" },
    { id: "o1", name: "No — GOP holds" },
  ],
  q: [0, 0],
  pi: normalize([0.62, 0.38]),
  b: 80_000,
} as unknown as Market;

describe("ogPct", () => {
  it("matches the fly headline 62% on the seeded House prior", () => {
    const o = ogPct(house);
    expect(o.leader.big).toBe("62%");
    expect(o.leader.name).toContain("Democrats");
  });
});
