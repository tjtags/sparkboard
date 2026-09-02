# Sparkboard

Open-source **play-money** prediction markets. Anyone can open a question. Everyone spawns with **✦1,000,000 Sparks** per league. There is no wire, no cash-out, no shop. The ranking is a game about who reads the world.

Maker is Hanson’s **LMSR**. Prices are probabilities. Loss is bounded. Thin and sybil books stay on the fly and off the board.

```
npm install
npm test
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Ship it (GitHub + Vercel)

The local store is a JSON file. **Vercel has no writable disk**, so production uses a private [Vercel Blob](https://vercel.com/docs/vercel-blob) document (`sparkboard/state.json`) with ETag compare-and-swap so two tickets cannot clobber each other.

```bash
# 1. Push (if you have not already)
git push -u origin main

# 2. Link / create the Vercel project
vercel link --yes --project sparkboard

# 3. Private blob store (injects BLOB_READ_WRITE_TOKEN + BLOB_STORE_ID)
vercel blob create-store sparkboard --access private --yes \
  --environment production --environment preview --environment development

# 4. Production
vercel deploy --prod --yes
```

Or click **Import** on [vercel.com/new](https://vercel.com/new) after the GitHub repo exists, then **Storage → Create Database → Blob → Private**, and redeploy.

`GET /api/health` reports `{ store, auth, github, grok, switcher }`. If a Vercel deploy is still on `file`, the Blob store is not attached.

### Make it sendable

1. Set `AUTH_SECRET` on Vercel (required for guest desks).
2. Optional: GitHub OAuth app → `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` (callback `https://<prod>/api/auth/callback/github`).
3. Share `/join/DESK12`. Friends pick a handle. No Spawn box. No Mira default.

See `docs/GROWTH.md` for the growth loop. See `docs/LAUNCH.md` for Kalshi/Polymarket research, venue connectors, monetization, and the launch checklist. Open work is itemized at [`docs/BACKLOG.md`](./docs/BACKLOG.md) and [github.com/tjtags/sparkboard/issues](https://github.com/tjtags/sparkboard/issues).

Sentry and Postgres are wired but **dark** until you set `SENTRY_DSN` / `DATABASE_URL`. Local stays `SPARKBOARD_STORE=file`. After a Neon URL: `npm run db:push` then `npm run db:import`.

External tape (no login): `/wire` and `GET /api/wire/venues`.

Season book: `npm run sports` refreshes `data/sports-catalog.json` from the ESPN public scoreboard (NFL weeks 1–18 + postseason, NBA dates, MLB dates). Invented award/news books live in `src/lib/sports.ts`. Friend leagues can run a **weekly lock-in card** through an NFL, NBA, or MLB season — points vs `pLock`, not cash. Sparkboard is not a sportsbook.

## What you can click

| Route | What it is |
| --- | --- |
| `/` | The **fly** — Super Bowl LXI, this week's NFL slate, call sheet |
| `/week` | Sendable Sunday card · invite `SUNDAY` |
| `/call-sheet` | Politics desk printout (2026 midterms) |
| `/markets` | Desk books by category |
| `/markets/new` | Market builder (prior + liquidity `b`) |
| `/markets/[id]` | Ticket against the LMSR maker |
| `/sports` | NFL / NBA / MLB season book + Super Bowl LXI MVP |
| `/learn` | Deep paths: LMSR, integrity, weekly card, venues |
| `/leagues` | Public Square + invite desks (try `DESK12`); optional NFL/NBA/MLB weekly card |
| `/leaderboard` | Integrity-adjusted PnL |
| `/math` | Interactive LMSR sandbox |
| `/integrity` | Why coin-flip farms do not rank |
| `/wire` | Public Kalshi / Polymarket tape |
| `/forecasts` | Board-eligible Public Square tape (JSON/CSV at `/api/public/forecasts`) |
| `/legal` | Play-money terms and privacy |

Share `/join/SUNDAY` for the weekly NFL desk. Spawn a desk in the top bar, or trade as Mira / Cole / Anjali. On `/wire`, OPEN lists a play-money book with the venue yes as prior.

## Rules of the game

- **Not gambling.** Sparks never leave a league and cannot be transferred.
- **8% of cash** max per ticket, **25% of the starting million** max cost-basis in one market.
- Global books need **5 unique desks** before PnL scores the board. Friend leagues need **3**.
- Two desks at ≥90% of volume ⇒ thin, even if the headcount looks fine.
- Optional Grok drafts (`XAI_API_KEY`, model `grok-4.6` at `https://api.x.ai/v1`) on the call sheet wire.

Math, citations, and the architecture map live in [`RESEARCH.md`](./RESEARCH.md).

## Stack

Next.js 16 · TypeScript · Hanson LMSR in `src/lib/lmsr.ts` · JSON store in `data/` (gitignored, reseeded on first boot).

MIT. Build something better on it.
