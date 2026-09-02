import Link from "next/link";
import { Bar, IntegrityChip, Kicker, Percentile, SparkAmt } from "@/components/Bits";
import { MarketCard } from "@/components/MarketCard";
import { Shell } from "@/components/Shell";
import { PUBLIC_LEAGUE_ID } from "@/lib/constants";
import { formatPct, relative } from "@/lib/format";
import { costToPrice } from "@/lib/lmsr";
import { loadState } from "@/lib/store";
import { callSheet, flyMarkets, leaderboard, tape } from "@/lib/views";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const s = await loadState();
  const fly = flyMarkets(s);
  const headline = fly.find((m) => m.featured) ?? fly[0];
  const sheet = callSheet(s).slice(0, 8);
  const board = leaderboard(s, PUBLIC_LEAGUE_ID).slice(0, 8);
  const prints = tape(s, undefined, 10);
  const depth = headline
    ? costToPrice(headline.q, headline.b, 0, Math.min(0.9, headline.prices[0] + 0.05), headline.pi)
    : null;

  return (
    <Shell here="/">
      <div className="mb-4 flex items-center justify-between text-[10px] tracking-[0.22em] text-muted">
        <span>CH.01 FLY</span>
        <span className="text-spark">{s.markets.filter((m) => m.status === "open").length} OPEN</span>
        <span>{s.users.filter((u) => !u.system).length} NODES</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)]">
        <section className="tick border border-line bg-ink/70 p-5">
          <Kicker>HEAD // PUBLIC SQUARE</Kicker>
          {headline && (
            <Link href={`/markets/${headline.id}`} className="mt-3 block">
              <h1 className="text-3xl leading-tight tracking-tight text-paper md:text-4xl">
                {headline.question}
              </h1>
              <div className="mt-5 flex flex-wrap items-end gap-8">
                <div>
                  <div className="text-[10px] tracking-widest text-muted">{headline.outcomes[0].name}</div>
                  <div className="glow tabular text-7xl text-spark md:text-8xl">
                    {formatPct(headline.prices[0], 0)}
                  </div>
                </div>
                <div className="min-w-48 flex-1">
                  <Bar p={headline.prices[0]} />
                  <div className="mt-2 flex justify-between text-[11px] text-muted">
                    <span>{headline.outcomes[1].name}</span>
                    <span className="tabular">{formatPct(headline.prices[1], 0)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <IntegrityChip report={headline.integrity} />
                {depth?.feasible && (
                  <span className="text-[11px] text-muted">
                    DEPTH +5pp · ✦{Math.round(depth.cost).toLocaleString()}
                  </span>
                )}
              </div>
            </Link>
          )}

          <div className="mt-8 border-t border-line pt-4">
            <Kicker>TAPE</Kicker>
            <ul className="mt-2 font-mono text-[12px]">
              {prints.map((t) => (
                <li key={t.id} className="flex justify-between gap-3 py-1 text-muted">
                  <span>
                    <span className="text-spark">@{t.user?.handle}</span> {t.side.toUpperCase()}{" "}
                    {t.outcome?.name}
                  </span>
                  <span className="tabular">
                    {Math.round(t.cost).toLocaleString()} · {relative(t.at)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="tick border border-line bg-ink/70 p-4">
            <Kicker>SHEET</Kicker>
            <ol className="mt-3 space-y-2 text-[12px]">
              {sheet.map((m, i) => (
                <li key={m.id}>
                  <Link href={`/markets/${m.id}`} className="flex justify-between gap-2 hover:text-spark">
                    <span>
                      <span className="text-muted">{String(i + 1).padStart(2, "0")}</span>{" "}
                      {m.question.replace(/\?$/, "")}
                    </span>
                    <span className="tabular text-spark">{formatPct(m.prices[0], 0)}</span>
                  </Link>
                </li>
              ))}
            </ol>
            <Link href="/call-sheet" className="mt-3 inline-block text-[11px] tracking-widest text-mag">
              OPEN SHEET →
            </Link>
          </div>

          <div className="tick border border-line bg-ink/70 p-4">
            <Kicker>RANK</Kicker>
            <ol className="mt-3 space-y-2 text-[12px]">
              {board.map((row) => (
                <li key={row.user.id} className="flex items-center justify-between gap-2">
                  <Link href={`/d/${row.user.handle}`} className="hover:text-spark">
                    <span className="tabular text-muted">{String(row.rank).padStart(2, "0")}</span>{" "}
                    @{row.user.handle}
                  </Link>
                  <span className="flex items-center gap-2">
                    <Percentile pct={row.beatPct} />
                    <SparkAmt n={row.boardPnl} signed />
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>

      <section className="mt-6">
        <Kicker>OPEN BOOKS</Kicker>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {fly.map((m) => (
            <MarketCard key={m.id} market={m} />
          ))}
        </div>
      </section>
    </Shell>
  );
}
