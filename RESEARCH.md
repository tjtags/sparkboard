# Sparkboard research notes

Play-money prediction game. Not a casino, not a brokerage. The research question was: *what maker, what anti-farm rules, and what product surface make an open book that people will actually use with fake money?*

## Mechanism map

```
                    ┌─────────────────────────────────────────┐
                    │              Sparkboard                 │
                    │     play-money · no transfers           │
                    └─────────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
   Public Square                 Friend league                 Desk products
   1,000,000 ✦ / desk            invite code · 1M ✦            Fly · Call sheet · Wire
   min 5 unique traders          min 3 unique traders          politics scrapes
          │                           │
          └─────────────┬─────────────┘
                        ▼
              LMSR automated maker
              C(q) = b log Σ π_i e^{q_i/b}
              prices p = ∇C  (always a simplex)
              complete set costs 1
              max loss = b ln n
                        │
                        ▼
              Integrity gate (board only)
              unique traders · top-two volume
              opposing-cluster graph
              frozen at resolve
```

## Why LMSR (Hanson 2003, 2007)

Robin Hanson showed that a proper scoring rule can be turned into an automated market maker: each trader pays the difference in the scoring rule, and the operator only ever “pays the last forecast.” The logarithmic version is special:

1. **Prices are probabilities.** `p_i = ∂C/∂q_i`, they live in (0,1) and sum to 1.
2. **Bounded loss.** From a uniform start the operator cannot lose more than `b ln n`. Binary: `b ln 2 ≈ 0.693 b`.
3. **Complete set costs 1.** Buying one share of every outcome costs exactly 1 Spark, so there is a clean numeraire.
4. **Local independence.** Only LMSR leaves `P(B)` alone when someone trades `A | B`. That is the combinatorial property; we do not ship combinatorial books in this spike, but we keep the maker that would allow them.

Pennock’s 2006 write-up of the cost function is the implementation we used:

```
C(q) = b ln Σ_i exp(q_i / b)
p_i  = exp(q_i / b) / Σ_j exp(q_j / b)
```

We add a prior π (Othman / Chen / Pennock line of work):

```
C(q) = b ln Σ_i π_i exp(q_i / b)
```

so a House market can open at 62/38 instead of burning subsidy to get there.

Numerics: log-sum-exp. Spend inversion is closed-form, not a search.

### What we considered and rejected

| Maker | Why not (for this product) |
| --- | --- |
| Uniswap CPMM `xy = k` | Unbounded drain on a known-false outcome (Gnosis forum). Prices are not a simplex without extra machinery. |
| Maniswap `y^p n^{1-p} = k` | Best when users inject liquidity. Manifold picked it for that reason. We are a subsidized play-money square — `b` *is* the subsidy. |
| LS-LMSR (Othman & Sandholm 2013) | `b(q) = α Σ q_i` grows with volume, which is nicer in the wild, but the loss bound is no longer a number you can print on the ticket. Keep as a sequel. |
| Paradigm pm-AMM | Uniform LVR under Gaussian score dynamics. Overkill for play-money; no simple “max loss = …” story. |
| CLOB (Polymarket) | Needs professional MMs. Our long tail is questions nobody will quote. Hanson exists exactly for thin books. |

Sources: Hanson 2003/2007; Pennock, *Implementing Hanson’s Market Maker* (oddhead, 2006); Othman & Sandholm, TEAC 2013; Abernethy, Chen, Vaughan 2013 (cost-function MM ≡ scoring-rule MM); Manifold “Above the Fold: Market Mechanics”; Paradigm *pm-AMM* (2024); Gnosis LMSR vs CPMM thread.

## Market sizing

Everyone spawns with **1,000,000 Sparks** per league. That number is large enough to feel like a desk, small enough that percentages are readable.

Near 50/50, `dp/dq ≈ p(1-p)/b = 0.25/b`. Default global `b = 80,000`:

- A ✦4,000 ticket moves the fly ~0.25pp.
- Cost to 99¢ from 50/50 is `-b ln(0.01) - b ln 2 ≈ 3.91 b ≈ ✦313k`.
- Worst-case maker loss is `b ln 2 ≈ ✦55k` per binary book.

Caps, because the interesting attack is not the maker — it is other desks’ endowments:

- **8% of cash per ticket** (`MAX_TRADE_CASH_FRAC`)
- **25% of starting bankroll cost-basis per market** (`MAX_MARKET_COST_FRAC`)
- `b ∈ [5k, 400k]`

## Anti-sybil / anti-self-farm

Play-money leaderboards get farmed the same way airdrops do. Polymarket wash studies (2024–25) put synthetic volume in the 25–60% range at peaks. The Sparkboard version of the attack is simpler: mint alt desks, buy the wrong side, resolve, harvest the million.

Layered defense, all in `src/lib/integrity.ts` and `engine.ts`:

1. **No transfers.** There is no wire. The AMM is the only path.
2. **Unique traders.** Global 5, friends 3. Below that, the book can still quote — it does not score.
3. **Top-two volume ≥ 90% ⇒ thin.** Two people “making a market” at each other is a cluster even if they pass the headcount with sock puppets.
4. **Opposing-cluster graph.** Cosine of share vectors ≤ −0.7 on ≥2 shared books, and they dominate volume on at least one, ⇒ union-find cluster. Board credit withheld.
5. **Freeze at resolve.** `boardEligibleAtResolve` so later clustering cannot rewrite a settled ranking.
6. **Friend leagues are social KYC.** Invite codes. Most of the product, honestly.

This is not proof-of-personhood. It is “the ranking is not a bot farm.” The fly still shows thin prices, badged.

## Product surface

- **Fly.** Newsroom sense: the wire of top books. Featured + integrity badge + depth-to-move.
- **Call sheet.** Politics desk printout. Seeded from the 2026 midterm map (NYT toss-ups as of 26 Aug 2026, Cook moving Texas/Iowa, Ballotpedia battlegrounds, AP calendar Nov 3).
- **Market builder.** Anyone lists a question. Prior + `b` + resolution rule.
- **Leagues.** Public Square and invite desks. Isolated millions. Fantasy-football shape without being a sportsbook.
- **Board.** Integrity-adjusted PnL, with raw mark-to-market next to it so the clawback is visible.
- **Maker page.** Interactive LMSR sandbox.
- **Wire.** Optional Grok (`grok-4.6` via `https://api.x.ai/v1`) drafts questions from a topic. No key ⇒ canned midterm wire.

Not in this spike, on purpose: cash-out, combinatorial books, LMSR derivatives (yes, you can build options on `p_t` — that is a sequel), survivor-pool “lock-in cards,” real-money anything.

## Legal / ethical frame

Sparks are a database integer. They do not leave the league. There is no conversion, no prize pool, no “points you can redeem.” That is the line between a game and a gambling product. Do not add a shop.

## References (primary)

- Hanson, R. “Combinatorial Information Market Design.” *Information Systems Frontiers*, 2003.
- Hanson, R. “Logarithmic Market Scoring Rules for Modular Combinatorial Information Aggregation.” *Journal of Prediction Markets*, 2007.
- Pennock, D. “Implementing Hanson’s Market Maker.” Oddhead, 30 Oct 2006.
- Othman, A. & Sandholm, T. “Liquidity-Sensitive Automated Market Makers.” TEAC 2013.
- Abernethy, Chen, Vaughan. “Efficient Market Making via Convex Optimization.” EC / later journal version.
- Manifold Markets. “Above the Fold: Market Mechanics” (Maniswap).
- Paradigm. “pm-AMM: A Uniform AMM for Prediction Markets.” 2024.
- Gnosis forum. “On-chain AMMs for prediction markets” (LMSR vs CPMM drain).
- Columbia-affiliated Polymarket wash-trading analysis, 2024–25 (synthetic volume).
- NYT 2026 midterms tracker, updated 26 Aug 2026.
- AP 2026 election calendar (general 3 Nov 2026).
