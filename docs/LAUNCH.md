# Sparkboard — launch-ready implementation guide

Date: 2026-09-02  
Status: working product + venue connectors. Not a CFTC exchange.  
Live: https://sparkboard-zeta.vercel.app  
Repo: https://github.com/tjtags/sparkboard

This is the map from “play-money desk” to a business you can actually launch. It is grounded in **unauthenticated** Kalshi and Polymarket REST we hit today, plus the LMSR math already in `src/lib/lmsr.ts`.

---

## 0. What we are (and are not)

| We are | We are not |
| --- | --- |
| A **play-money** forecasting game (Sparks never leave a league) | Kalshi (CFTC Designated Contract Market, USD, KYC) |
| LMSR automated maker, Hanson 2003 | Polymarket (USDC CLOB on Polygon) |
| Leagues as the growth unit (fantasy football for news) | A sportsbook (we do not take the other side as the house) |
| A **read-only** tape of Kalshi + Polymarket public prices | Their order-routing, wallets, or KYC |

**Do not add cash-out, redeemable points, or a shop that converts Sparks to dollars.** That is the line between a game and a gambling/derivatives product. Real-money event contracts in the US are a **different company**: DCM registration, lawyers, 1099s, state sports fights. See §6.

---

## 1. Research: what Kalshi and Polymarket actually are

Pulled **without login** on 2026-09-02.

### 1.1 Venues

| | **Kalshi** | **Polymarket** | **Sparkboard** |
| --- | --- | --- | --- |
| Money | USD, bank | USDC, wallet | Sparks (✦), fake |
| Matching | Central limit order book | CLOB (`clob.polymarket.com`) | LMSR AMM (`src/lib/lmsr.ts`) |
| Who lists | Exchange, CFTC-approved series | Anyone (curated + CYOM) | Anyone in a league |
| US users | Yes (DCM) | Historically blocked / gray | Yes (it is a game) |
| Public data | `https://external-api.kalshi.com/trade-api/v2` **no key** | Gamma `https://gamma-api.polymarket.com` **no key** | `/api/wire/venues` |
| Sports share | ~80–90% of 2025 volume (CRS / Arnold & Porter) | Large but less dominant | Optional; not the wedge |
| Fees | ~2–5% / contract historically; sports-led revenue | Maker 0 / taker small | None (play-money) |

Kalshi 2025: ~$22.9B notional, ~$263.5M fee revenue, sports ~90% (Wissen whitepaper, mid-2026). Polymarket: tens of billions cumulative USDC notional; CLOB + UMA/oracle resolution.

### 1.2 Market taxonomy (what they list)

**Kalshi series categories** (live `GET /series`, first page + docs):

- Sports (NFL totals, CL, World Cup, streaks, Olympics)
- Economics (GDP, Fed changes, WEF)
- Financials (Nikkei, IPOs: OpenAI vs Anthropic, Ramp vs Brex)
- Politics / Elections (NATO SG, DNC chair, Xi successor, G7)
- Entertainment (Michelin, culture)
- Crypto
- Climate and Weather (2°C, supervolcano)
- Science and Technology (Mars, fusion)
- Companies / Mentions (docs)

**Polymarket live 24h tape** (`GET /markets?order=volume24hr`, no auth) included:

- Sports: US Open ATP matches
- Macro: Fed hold / +25 / −25 after **September 2026** FOMC (`yes ≈ 42.5¢` hold)
- Politics: 2028 nomination jokes (Fetterman, Gabbard at 0.15¢)
- Geopolitics: “US invade Iran before 2027” (`yes ≈ 15.5¢`)

**Product shapes both venues use** (this is the catalog Sparkboard must support as *questions*, not as a clone of their CLOB):

1. Binary Yes/No  
2. Multi-candidate (who wins — mutually exclusive legs)  
3. Nested sports (ML, spread, total, 1H)  
4. Scalar / date (“when will fusion”) as a ladder of binaries  
5. Combinatorial parlays (Kalshi `KXMVE*` — we **drop** these in the connector)  
6. Create-your-own (Polymarket `cyom`)

Sparkboard v1 LMSR already does (1) and (2). (3)–(4) are multiple LMSR books or one n-outcome book. (5) is a trap (thin, farmable). Skip parlays.

### 1.3 Matching math vs ours

**Their model (CLOB):** traders post bids/asks in cents. Price is last/mid. No subsidy. Needs professional MMs on thin books. Complete set (Yes+No) can trade vs $1 with arb.

**Our model (LMSR):**

```
C(q) = b ln Σ π_i exp(q_i / b)
p_i  = ∂C/∂q_i
complete set costs 1
max AMM loss = b ln n
```

That is why we can list a question with **zero counterparties**. Kalshi/Polymarket cannot list a friend’s office-chat market. That is the product gap.

**Do not “upgrade” to a CLOB** until you have real-money and MMs. Play-money long tail is LMSR or it dies.

### 1.4 Feature checklist (them vs us)

| Feature | Kalshi | Polymarket | Sparkboard now | Launch need |
| --- | --- | --- | --- | --- |
| Order book | Yes | Yes | No (LMSR) | No |
| Portfolio / positions | Yes | Yes | Positions on market page | Profile tape — **done** `/d/[handle]` |
| Leaderboard | Weak | Whale boards | Integrity board + **percentile** | Keep |
| Categories | Series | Tags (noisy) | politics/macro/… | Map venue tags → ours |
| Sports | Core revenue | Core | Optional | League packs, not a sportsbook |
| Mobile app | Native | PWA | Web HUD | PWA last |
| Alerts | Yes | Yes | Resend magic-link only | Email on resolve / lock-in |
| API | REST+WS | Gamma+CLOB+WS | REST + venue pull | Public forecast API **is** the business |
| KYC | Yes | Wallet | Email / GitHub / guest | Stay light |
| Resolution | Exchange | UMA / announced | Creator + member (weak) | **Must harden** before press |
| Combos | Yes | Limited | No | Never in v1 |

---

## 2. Connectors (coded, no login)

Read-only. **No orders. No keys. No HTML scrape.** Official public REST only.

| File | Job |
| --- | --- |
| `src/lib/connectors/kalshi.ts` | `GET /events?status=open&with_nested_markets=true`, skip `KXMVE*` parlays |
| `src/lib/connectors/polymarket.ts` | `GET /markets?closed=false&order=volume24hr` |
| `src/lib/connectors/index.ts` | `pullVenues()` fan-in + errors |
| `GET /api/wire/venues` | JSON snapshot |
| `/wire` | HUD table, labeled **their books** |

```bash
npm run wire    # prints count
# or open /wire
```

**Legal:** displaying their public prices with attribution is ordinary market-data commentary. **Mirroring them as Sparkboard markets that pay Sparks** is fine (play-money). **Routing user money to them** is a broker. Do not build a router.

**Fit:** use their tape as (a) call-sheet priors, (b) “what the world is pricing,” (c) training data for Grok drafts. Never as our matching engine.

---

## 3. How the business makes money (without becoming a casino)

Sparkboard’s **users** play for status. The **company** sells information and infrastructure.

### 3.1 Do now (legal, on-mission)

1. **Forecast data API** — Sparkboard + venue tape, CSV/JSON, for journalists, campaigns, funds. This is how PredictIt/Metaculus/Manifold were actually valuable. Charge seats, not Sparks.  
2. **Org leagues** — a company/newsroom/class buys a private desk (SSO, admin resolve, export). Fantasy software pricing ($99–$499/mo), not betting rake.  
3. **Call sheet as media** — daily politics HUD; sponsorship of the *sheet*, not of a contract.  
4. **PWA / “desk” branding** — later.

### 3.2 Do not do

- Sell Sparks, sweepstakes, “verse cash,” loot boxes.  
- Take a rake on play-money that can be redeemed.  
- List sports as a book that pays dollars. Kalshi’s sports revenue is why state AGs are in court; we do not want that fight.  
- Clone Polymarket’s CLOB for US retail.

### 3.3 Only with a new entity + counsel

CFTC DCM / FCM, KYC, 1099-MISC, position limits, surveillance. That is “Kalshi Inc,” not this repo. If you ever go there, **fork the brand** and keep Sparkboard play-money.

**Default launch thesis:** Manifold-shaped game + Bloomberg-shaped data. Revenue from **desks and data**, not from punters.

---

## 4. Math (what must stay true)

Already tested in `src/lib/lmsr.test.ts`:

1. Prices on the simplex.  
2. Complete set costs 1.  
3. Max loss `b ln n`.  
4. Spend inversion is closed-form.

Launch defaults (already in `constants.ts`):

- Bankroll 1,000,000 ✦ / league  
- Ticket ≤ 8% of cash  
- Market exposure ≤ 25% of start  
- Global board needs 5 unique desks  

**Do not change LMSR numerics to “feel more like Polymarket.”** Their prices are CLOB mids; ours are scoring-rule probabilities. Both are valid; mixing them in one book is a bug.

Venue `yes` from connectors is a **prior or a chart**, not `q`.

---

## 5. Step-by-step until launch-ready

Each step is independently shippable. Do not skip 5.3.

### Step A — Already shipped (do not rebuild)

- LMSR maker, integrity board, leagues, lock-in cards, HUD UI  
- Guest `/join/DESK12`, email confirm (Resend optional), profiles `/d/[handle]`, percentile  
- Vercel Blob store, GitHub auto-deploy  
- Venue connectors + `/wire`

### Step B — Resolution (shipped)

Public Square is oracle-only. Friend-league creators still settle their own books.

1. Public Square: `user_desk` / `SPARKBOARD_ADMIN_EMAIL` / `x-sparkboard-admin` proposes; **24h challenge**; then `tickResolves` pays.  
2. `resolutionSourceUrl` on the book + propose form.  
3. `resolveEvents[]` logs propose / challenge / finalize with actor.  
4. Copy on the oracle box: we do not auto-copy Kalshi/Polymarket settlement.

### Step C — Coverage packs (product, not scrape)

Build **packs**, not 83k Kalshi rows:

1. **Midterms 2026** (already seeded)  
2. **Fed / CPI / GDP** — one LMSR book per print, prior from `/api/wire/venues`  
3. **Culture / tech** — user-created  
4. **Sports** — only inside friend leagues, labeled game

Script: “propose pack from venue tape” (Grok + human). Never bulk-import parlays.

### Step D — Identity for launch

1. Set `RESEND_API_KEY` + `RESEND_FROM` on Vercel so `/signin` actually mails.  
2. Optional GitHub OAuth (callback `https://sparkboard-zeta.vercel.app/api/auth/callback/github`).  
3. Keep guests invite-gated.  
4. Custom domain (optional).

### Step E — Data product (shipped, nightly dump later)

1. `GET /api/public/forecasts` — board-eligible Public Square prices. `?format=csv` for the dump.  
2. `GET /api/wire/venues` — Kalshi + Polymarket public tape.  
3. Human printout: `/forecasts`.  
4. Terms: `/legal` — attribution required; no high-frequency scrape of us without asking.

### Step F — Org desk (first dollar)

1. Stripe seat for a private league (SSO later).  
2. Admin resolve, export, no Public Square bleed.  
3. Contract: “software for a game,” not “wagering.”

### Step G — Launch checklist

- [ ] `/join/DESK12` works for a stranger on production  
- [ ] `GET /api/health` → `store:blob`, `switcher:false`, `auth:true`  
- [x] `/wire` shows Kalshi + Polymarket without keys  
- [x] Public Square resolve is restricted (oracle + 24h challenge)  
- [x] Privacy + game ToS (play-money, no prize) — `/legal`  
- [x] Integrity gates still on  
- [x] No SparkAmt on lock-in cards  
- [ ] Resend confirm works or is clearly “link printed”  
- [x] One journalist can quote the call sheet / `/forecasts` with a permalink  

When those boxes are ticked, **launch the game**. Not the exchange.

---

## 6. Risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| People treat Sparks as money | High | Copy, no cash-out, no shop |
| State AG “this is sports betting” | High if we list $ sports | Friend-league only, play-money |
| Venue API ToS / rate limit | Medium | 60s cache, attribution, backoff |
| Kalshi combo spam | Medium | Drop `KXMVE*` |
| Sybil boards | Medium | Already gated; GitHub/email helps |
| Creator-resolve griefing | High | Step B |
| Copying Polymarket UX 1:1 | Product | We are a desk + league, not a CLOB |

---

## 7. References

- Kalshi public data: https://docs.kalshi.com/getting_started/quick_start_market_data — `https://external-api.kalshi.com/trade-api/v2`  
- Polymarket Gamma: https://docs.polymarket.com/getting-started/api — `https://gamma-api.polymarket.com`  
- Hanson LMSR: `docs/GROWTH.md`, `RESEARCH.md`, `src/lib/lmsr.ts`  
- CRS IF13187 (2026): sports ~87% of Kalshi volume  
- Arnold & Porter (Aug 2026): state vs CFTC sports jurisdiction still contested  

Live check (this repo):

```
curl -s https://sparkboard-zeta.vercel.app/api/wire/venues | head
```
