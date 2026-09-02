import Link from "next/link";
import { Kicker } from "@/components/Bits";
import { Shell } from "@/components/Shell";

export const dynamic = "force-dynamic";

const PATHS = [
  {
    id: "01",
    title: "Open a desk",
    blurb: "Sparks are the unit. One million per league. They never move.",
    href: "/join/DESK12",
    steps: [
      "Join with a handle. Guest is enough. GitHub or email is optional.",
      "You spawn at ✦1,000,000 in Public Square. A second league is a second million — not a transfer.",
      "There is no cash-out, no shop, no wire. Ranking is the game.",
    ],
  },
  {
    id: "02",
    title: "Read a price",
    blurb: "LMSR prices are probabilities. The maker's worst day is b ln n.",
    href: "/math",
    steps: [
      "p_i = π_i exp(q_i / b) / Σ π_j exp(q_j / b). They sum to 1 and stay in (0, 1).",
      "A complete set (one share of every outcome) always costs ✦1.",
      "Default global b = 80,000. Pushing a 50/50 book to 99¢ costs about 3.91 b.",
      "Open the sandbox and move q. Watch the cost and the max loss.",
    ],
  },
  {
    id: "03",
    title: "Size a ticket",
    blurb: "8% of cash per print. 25% of the starting million in one book.",
    href: "/markets",
    steps: [
      "Minimum ticket is ✦25.",
      "If the quote is more than 8% of cash, the engine rejects it. That is market sizing, not a tease.",
      "Cost basis across one market cannot exceed 25% of the league starting bankroll.",
      "Sell is against your shares, not short the book.",
    ],
  },
  {
    id: "04",
    title: "Integrity gates",
    blurb: "Thin and mirrored books stay on the fly and off the board.",
    href: "/integrity",
    steps: [
      "Public Square needs 5 unique desks before PnL scores the board. Friend leagues need 3.",
      "If the top two traders are ≥90% of volume, the book is thin even if headcount looks fine.",
      "Opposing clusters across two or more markets get flagged. The coin-flip fixture is the demo.",
      "boardPnL claws farmed payouts back after a thin resolve.",
    ],
  },
  {
    id: "05",
    title: "Call sheet",
    blurb: "Politics first. The midterm fly is the morning print.",
    href: "/call-sheet",
    steps: [
      "Featured books are the fly. The sheet is the politics desk's ordered list.",
      "Resolution criteria are public sources named on the market.",
      "Optional Grok drafts sit on the wire. They do not list themselves.",
    ],
  },
  {
    id: "06",
    title: "Season book",
    blurb: "NFL, NBA, MLB moneylines plus invented awards. Click any row.",
    href: "/sports",
    steps: [
      "Schedules are pulled from the ESPN public scoreboard. No login.",
      "Each game is Does away beat home? Super Bowl LXI MVP is a ten-way book.",
      "This is play-money. Sparkboard is not a sportsbook and does not take the other side as the house.",
      "Friend desks can run a weekly card through the season on those books.",
    ],
  },
  {
    id: "07",
    title: "Weekly card",
    blurb: "One lock-in a week with friends, through the last game.",
    href: "/leagues",
    steps: [
      "Create a friends league and pick NFL, NBA, or MLB season.",
      "Every ISO week (NFL: that week's slate) you lock one outcome. pLock is the LMSR price at confirm.",
      "Hit scores +(1 − pLock). Miss scores −pLock. Cash does not move. Points, not elimination.",
      "Play until the slate ends. Invite the group with /join/CODE. Sparks still never leave the league.",
    ],
  },
  {
    id: "08",
    title: "Venues vs us",
    blurb: "Kalshi and Polymarket are cash CLOBs. We read their tape. We are not them.",
    href: "/wire",
    steps: [
      "Kalshi is a CFTC DCM (USD). Polymarket is USDC on a CLOB. Sparkboard is ✦ LMSR.",
      "GET /api/wire/venues hits their public APIs with no login.",
      "We do not route orders, hold wallets, or rake cash. Monetization is data and desks, not a house edge.",
    ],
  },
];

export default function LearnPage() {
  return (
    <Shell here="/learn">
      <Kicker>PATHS // DEEP</Kicker>
      <h1 className="mt-2 text-3xl tracking-tight">How the desk works</h1>
      <p className="mt-2 max-w-2xl text-[13px] text-muted">
        Eight paths, in order. Each one lands on a live surface. Read them once, then trade a
        seeded book. The math does not change because the UI is a HUD.
      </p>
      <ol className="mt-10 space-y-8">
        {PATHS.map((p) => (
          <li key={p.id} className="tick border border-line bg-ink/60 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <Kicker>PATH {p.id}</Kicker>
              <Link href={p.href} className="text-[11px] tracking-widest text-spark">
                OPEN {p.href.toUpperCase()} →
              </Link>
            </div>
            <h2 className="mt-3 text-xl tracking-tight">{p.title}</h2>
            <p className="mt-1 text-[13px] text-muted">{p.blurb}</p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-[13px] text-paper">
              {p.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </Shell>
  );
}
