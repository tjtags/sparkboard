import { describe, expect, it } from "vitest";
import {
  buyCost,
  cost,
  costToPrice,
  maxLoss,
  prices,
  sellProceeds,
  sharesForSpend,
  tradeCost,
  uniform,
} from "./lmsr";

const b = 100;
const q0 = [0, 0];
const pi = uniform(2);

describe("LMSR", () => {
  it("prices start at the prior and sum to 1", () => {
    const p = prices(q0, b, [0.7, 0.3]);
    expect(p[0]).toBeCloseTo(0.7, 10);
    expect(p[1]).toBeCloseTo(0.3, 10);
    expect(p.reduce((a, x) => a + x, 0)).toBeCloseTo(1, 12);
  });

  it("a complete set always costs 1", () => {
    const q = [12, -4];
    const c0 = cost(q, b, pi);
    const c1 = cost([q[0] + 1, q[1] + 1], b, pi);
    expect(c1 - c0).toBeCloseTo(1, 10);
  });

  it("worst-case AMM loss is b ln n from a uniform book", () => {
    expect(maxLoss(b, 2)).toBeCloseTo(b * Math.log(2), 12);
    // Drive YES to ~1, AMM loss = shares_paid - cost_collected.
    const spend = 800;
    const shares = sharesForSpend(q0, b, 0, spend, pi);
    const loss = shares - spend; // YES pays 1, NO pays 0, collected = spend
    expect(loss).toBeLessThan(maxLoss(b, 2) + 1e-6);
    expect(loss).toBeGreaterThan(maxLoss(b, 2) - 5);
  });

  it("inverts spend to shares", () => {
    const spend = 37.5;
    const shares = sharesForSpend(q0, b, 0, spend, pi);
    expect(buyCost(q0, b, 0, shares, pi)).toBeCloseTo(spend, 8);
  });

  it("prices are the gradient of C", () => {
    const q = [10, 3];
    const p = prices(q, b, pi);
    const eps = 1e-5;
    const dC = (cost([q[0] + eps, q[1]], b, pi) - cost(q, b, pi)) / eps;
    expect(dC).toBeCloseTo(p[0], 6);
  });

  it("selling undoes a buy", () => {
    const shares = 8;
    const paid = buyCost(q0, b, 0, shares, pi);
    const q1 = [shares, 0];
    const got = sellProceeds(q1, b, 0, shares, pi);
    expect(got).toBeCloseTo(paid, 8);
  });

  it("cost to 99¢ matches the closed form near a 50/50 book", () => {
    const { cost: c, feasible } = costToPrice(q0, b, 0, 0.99, pi);
    expect(feasible).toBe(true);
    // C = -b ln(1-p) - b ln 2  for uniform binary starting at 0
    const closed = -b * Math.log(0.01) - b * Math.log(2);
    expect(c).toBeCloseTo(closed, 4);
  });

  it("tradeCost is signed", () => {
    expect(tradeCost(q0, b, 0, 5, pi)).toBeGreaterThan(0);
    const q1 = [5, 0];
    expect(tradeCost(q1, b, 0, -5, pi)).toBeLessThan(0);
  });

  it("stays finite at extreme books", () => {
    const q = [800, -200];
    const p = prices(q, 10, pi);
    expect(p[0]).toBeGreaterThan(0.999);
    expect(Number.isFinite(cost(q, 10, pi))).toBe(true);
  });
});
