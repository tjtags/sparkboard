/**
 * Logarithmic Market Scoring Rule (Hanson 2003/2007).
 *
 * Cost:    C(q) = b · log( Σ_i π_i exp(q_i / b) )
 * Price:   p_i  = ∂C/∂q_i = π_i exp(q_i/b) / Σ_j π_j exp(q_j/b)
 *
 * Buying Δ shares of i costs C(q + Δ e_i) − C(q).
 * A complete set (one of every outcome) always costs 1.
 * Worst-case AMM loss from a uniform prior is b · ln(n).
 *
 * π is an optional prior (defaults to uniform). With q = 0, prices = π.
 * Numerics go through log-sum-exp so extreme prices do not overflow.
 */

export type LmsrState = {
  q: number[];
  b: number;
  pi: number[];
};

export function uniform(n: number): number[] {
  if (n < 2) throw new Error("A market needs at least two outcomes");
  return Array.from({ length: n }, () => 1 / n);
}

export function normalize(weights: number[]): number[] {
  if (weights.some((w) => !(w > 0) || !Number.isFinite(w))) {
    throw new Error("Priors must be finite and strictly positive");
  }
  const s = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => w / s);
}

export function logSumExp(xs: number[]): number {
  if (xs.length === 0) throw new Error("logSumExp of empty list");
  let m = -Infinity;
  for (const x of xs) if (x > m) m = x;
  let sum = 0;
  for (const x of xs) sum += Math.exp(x - m);
  return m + Math.log(sum);
}

export function assertMarket(q: number[], b: number, pi?: number[]): number[] {
  if (!Number.isFinite(b) || b <= 0) throw new Error("Liquidity b must be positive");
  if (q.length < 2) throw new Error("A market needs at least two outcomes");
  if (q.some((x) => !Number.isFinite(x))) throw new Error("Share vector must be finite");
  const prior = normalize(pi ?? uniform(q.length));
  if (prior.length !== q.length) throw new Error("Prior length must match outcomes");
  return prior;
}

export function cost(q: number[], b: number, pi?: number[]): number {
  const prior = assertMarket(q, b, pi);
  const terms = q.map((qj, j) => Math.log(prior[j]) + qj / b);
  return b * logSumExp(terms);
}

export function prices(q: number[], b: number, pi?: number[]): number[] {
  const prior = assertMarket(q, b, pi);
  const terms = q.map((qj, j) => Math.log(prior[j]) + qj / b);
  const m = Math.max(...terms);
  const exps = terms.map((t) => Math.exp(t - m));
  const s = exps.reduce((a, c) => a + c, 0);
  return exps.map((e) => e / s);
}

/** Worst-case AMM subsidy from a uniform start: b ln n. */
export function maxLoss(b: number, n: number): number {
  if (b <= 0 || n < 2) throw new Error("maxLoss expects b > 0 and n ≥ 2");
  return b * Math.log(n);
}

/**
 * Cost to buy `shares` of `outcome`. Shares may be negative (a sale),
 * but the caller must ensure q[outcome] + shares stays consistent with
 * outstanding trader inventory.
 */
export function tradeCost(
  q: number[],
  b: number,
  outcome: number,
  shares: number,
  pi?: number[],
): number {
  const prior = assertMarket(q, b, pi);
  if (outcome < 0 || outcome >= q.length) throw new Error("Unknown outcome");
  if (!Number.isFinite(shares)) throw new Error("Shares must be finite");
  const next = q.slice();
  next[outcome] += shares;
  return cost(next, b, prior) - cost(q, b, prior);
}

export function buyCost(
  q: number[],
  b: number,
  outcome: number,
  shares: number,
  pi?: number[],
): number {
  if (shares < 0) throw new Error("buyCost expects a non-negative share count");
  return tradeCost(q, b, outcome, shares, pi);
}

export function sellProceeds(
  q: number[],
  b: number,
  outcome: number,
  shares: number,
  pi?: number[],
): number {
  if (shares < 0) throw new Error("sellProceeds expects a non-negative share count");
  if (q[outcome] - shares < -1e-9) {
    throw new Error("Cannot sell more shares than the book holds");
  }
  return -tradeCost(q, b, outcome, -shares, pi);
}

/**
 * Invert the cost function: how many shares of `outcome` does `spend` buy?
 *
 * Closed form from C(q + Δ e_i) = C(q) + S:
 *   π_i exp((q_i+Δ)/b) = exp((C+S)/b) − Σ_{j≠i} π_j exp(q_j/b)
 */
export function sharesForSpend(
  q: number[],
  b: number,
  outcome: number,
  spend: number,
  pi?: number[],
): number {
  const prior = assertMarket(q, b, pi);
  if (outcome < 0 || outcome >= q.length) throw new Error("Unknown outcome");
  if (!Number.isFinite(spend) || spend < 0) throw new Error("Spend must be ≥ 0");
  if (spend === 0) return 0;

  const C = cost(q, b, prior);
  const m = (spend + C) / b;
  let others = 0;
  for (let j = 0; j < q.length; j++) {
    if (j === outcome) continue;
    others += prior[j] * Math.exp(q[j] / b - m);
  }
  const rhs = 1 - others;
  if (!(rhs > 1e-15)) {
    throw new Error("That spend would drive probability to 1; size down");
  }
  const delta = b * (m + Math.log(rhs / prior[outcome])) - q[outcome];
  if (!Number.isFinite(delta) || delta < -1e-6) {
    throw new Error("Numerical inversion failed");
  }
  return Math.max(0, delta);
}

/** Shares to sell to raise approximately `proceeds` sparks (binary search). */
export function sharesForProceeds(
  q: number[],
  b: number,
  outcome: number,
  proceeds: number,
  maxShares: number,
  pi?: number[],
): number {
  const prior = assertMarket(q, b, pi);
  if (proceeds <= 0) return 0;
  if (maxShares <= 0) return 0;
  const cap = Math.min(maxShares, q[outcome]);
  if (cap <= 0) return 0;
  const maxP = sellProceeds(q, b, outcome, cap, prior);
  if (proceeds >= maxP) return cap;
  let lo = 0;
  let hi = cap;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const got = sellProceeds(q, b, outcome, mid, prior);
    if (got < proceeds) lo = mid;
    else hi = mid;
  }
  return hi;
}

export type Quote = {
  side: "buy" | "sell";
  outcome: number;
  shares: number;
  cost: number;
  avgPrice: number;
  startPrices: number[];
  endPrices: number[];
  impact: number;
};

function quoteFromDelta(
  q: number[],
  b: number,
  outcome: number,
  shares: number,
  pi: number[],
  side: "buy" | "sell",
): Quote {
  const startPrices = prices(q, b, pi);
  const next = q.slice();
  next[outcome] += side === "buy" ? shares : -shares;
  const endPrices = prices(next, b, pi);
  const costAbs =
    side === "buy"
      ? cost(next, b, pi) - cost(q, b, pi)
      : cost(q, b, pi) - cost(next, b, pi);
  return {
    side,
    outcome,
    shares,
    cost: costAbs,
    avgPrice: shares > 0 ? costAbs / shares : startPrices[outcome],
    startPrices,
    endPrices,
    impact: endPrices[outcome] - startPrices[outcome],
  };
}

export function quoteBuyShares(
  q: number[],
  b: number,
  outcome: number,
  shares: number,
  pi?: number[],
): Quote {
  const prior = assertMarket(q, b, pi);
  if (shares <= 0) throw new Error("Share size must be positive");
  return quoteFromDelta(q, b, outcome, shares, prior, "buy");
}

export function quoteBuySpend(
  q: number[],
  b: number,
  outcome: number,
  spend: number,
  pi?: number[],
): Quote {
  const prior = assertMarket(q, b, pi);
  const shares = sharesForSpend(q, b, outcome, spend, prior);
  return quoteFromDelta(q, b, outcome, shares, prior, "buy");
}

export function quoteSellShares(
  q: number[],
  b: number,
  outcome: number,
  shares: number,
  pi?: number[],
): Quote {
  const prior = assertMarket(q, b, pi);
  if (shares <= 0) throw new Error("Share size must be positive");
  return quoteFromDelta(q, b, outcome, shares, prior, "sell");
}

/** Cost to push outcome i's instantaneous price to `target` (0,1). */
export function costToPrice(
  q: number[],
  b: number,
  outcome: number,
  target: number,
  pi?: number[],
): { shares: number; cost: number; feasible: boolean } {
  const prior = assertMarket(q, b, pi);
  if (!(target > 0 && target < 1)) throw new Error("Target price must be in (0, 1)");
  const p0 = prices(q, b, prior)[outcome];
  if (Math.abs(target - p0) < 1e-9) return { shares: 0, cost: 0, feasible: true };
  if (target < p0) {
    return { shares: 0, cost: 0, feasible: false };
  }
  let lo = 0;
  let hi = b * 8;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    const next = q.slice();
    next[outcome] += mid;
    const p = prices(next, b, prior)[outcome];
    if (p < target) lo = mid;
    else hi = mid;
  }
  const shares = hi;
  const next = q.slice();
  next[outcome] += shares;
  return {
    shares,
    cost: cost(next, b, prior) - cost(q, b, prior),
    feasible: true,
  };
}

/** Instantaneous depth: sparks needed to move price by `bps` (100 = 1pp). */
export function depthForMove(
  q: number[],
  b: number,
  outcome: number,
  bps: number,
  pi?: number[],
): number {
  const prior = assertMarket(q, b, pi);
  const p0 = prices(q, b, prior)[outcome];
  const target = Math.min(0.99, Math.max(0.01, p0 + bps / 10000));
  if (target <= p0) return 0;
  return costToPrice(q, b, outcome, target, prior).cost;
}
