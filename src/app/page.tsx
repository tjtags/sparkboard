import Link from "next/link";
import { Bar, IntegrityChip, Kicker, SparkAmt } from "@/components/Bits";
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
  const sheet = callSheet(s).slice(0, 6);
  const board = leaderboard(s, PUBLIC_LEAGUE_ID).slice(0, 6);
  const prints = tape(s, undefined, 8);

  const depth = headline
    ? costToPrice(headline.q, headline.b, 0, Math.min(0.9, headline.prices[0] + 0.05), headline.pi)
    : null;

  return (
    <Shell here="/">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <section>
          <Kicker>The fly · Public Square</Kicker>
          {headline && (
            <Link href={`/markets/${headline.id}`} className="mt-3 block">
              <h1 className="display text-4xl leading-[1.1] md:text-5xl">{headline.question}</h1>
              <div className="mt-5 flex flex-wrap items-end gap-8">
                <div>
                  <div className="text-[12px] uppercase tracking-wide text-muted">
                    {headline.outcomes[0].name}
                  </div>
                  <div className="tabular text-6xl text-spark md:text-7xl">
                    {formatPct(headline.prices[0], 0)}
                  </div>
                </div>
                <div className="min-w-48 flex-1">
                  <Bar p={headline.prices[0]} />
                  <div className="mt-2 flex justify-between text-[12px] text-muted">
                    <span>{headline.outcomes[1].name}</span>
                    <span className="tabular">{formatPct(headline.prices[1], 0)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <IntegrityChip report={headline.integrity} />
                {depth?.feasible && (
                  <span className="text-[13px] text-muted">
                    ✦{Math.round(depth.cost).toLocaleString()} to +5pp
                  </span>
                )}
              </div>
            </Link>
          )}

          <div className="mt-10">
            <Kicker>Tape</Kicker>
            <ul className="mt-3 divide-y divide-line/80 text-sm">
              {prints.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-muted">
                    <span className="text-paper">@{t.user?.handle}</span> {t.side}{" "}
                    {t.outcome?.name}
                  </span>
                  <span className="tabular text-muted">
                    ✦{Math.round(t.cost).toLocaleString()} · {relative(t.at)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <aside className="space-y-8">
          <div className="rounded-lg bg-paper p-5 text-ink">
            <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-copper">
              Morning call sheet
            </div>
            <p className="display mt-1 text-xl italic">2026 midterms, desk copy.</p>
            <ol className="mt-4 space-y-3">
              {sheet.map((m, i) => (
                <li key={m.id}>
                  <Link href={`/markets/${m.id}`} className="flex items-baseline justify-between gap-3">
                    <span>
                      <span className="tabular text-copper">{i + 1}.</span> {m.question.replace(/\?$/, "")}
                    </span>
                    <span className="tabular font-medium">{formatPct(m.prices[0], 0)}</span>
                  </Link>
                </li>
              ))}
            </ol>
            <Link href="/call-sheet" className="mt-4 inline-block text-[13px] text-copper">
              Full sheet →
            </Link>
          </div>

          <div>
            <Kicker>Board · integrity-adjusted</Kicker>
            <ol className="mt-3 space-y-2">
              {board.map((row, i) => (
                <li key={row.user.id} className="flex items-center justify-between text-sm">
                  <span>
                    <span className="tabular text-muted">{i + 1}</span> {row.user.displayName}
                  </span>
                  <SparkAmt n={row.boardPnl} signed />
                </li>
              ))}
            </ol>
            <Link href="/leaderboard" className="mt-3 inline-block text-[13px] text-copper">
              Full board →
            </Link>
          </div>
        </aside>
      </div>

      <section className="mt-12">
        <Kicker>Open books</Kicker>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {fly.map((m) => (
            <MarketCard key={m.id} market={m} />
          ))}
        </div>
      </section>
    </Shell>
  );
}
