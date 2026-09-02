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

`GET /api/health` reports `{ store: "file" | "blob" }`. If a Vercel deploy is still on `file`, the Blob store is not attached.

## What you can click

| Route | What it is |
| --- | --- |
| `/` | The **fly** — featured book, tape, morning call sheet, board |
| `/call-sheet` | Politics desk printout (2026 midterms) |
| `/markets/new` | Market builder (prior + liquidity `b`) |
| `/markets/[id]` | Ticket against the LMSR maker |
| `/leagues` | Public Square + invite desks (try `DESK12`) |
| `/leaderboard` | Integrity-adjusted PnL |
| `/math` | Interactive LMSR sandbox |
| `/integrity` | Why coin-flip farms do not rank |

Spawn a desk in the top bar, or trade as Mira / Cole / Anjali.

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
