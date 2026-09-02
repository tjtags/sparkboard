import Link from "next/link";
import { MarketCard } from "@/components/MarketCard";
import { Kicker } from "@/components/Bits";
import { Shell } from "@/components/Shell";
import { formatPct } from "@/lib/format";
import { loadState } from "@/lib/store";
import { booksByCategory, flyMarkets, priceMarket } from "@/lib/views";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

const CATS: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "DESK" },
  { id: "politics", label: "POLITICS" },
  { id: "sports", label: "SPORTS" },
  { id: "macro", label: "MACRO" },
  { id: "culture", label: "CULTURE" },
  { id: "science", label: "SCIENCE" },
  { id: "meta", label: "META" },
];

export default async function MarketsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; sport?: string }>;
}) {
  const sp = await searchParams;
  const cat = (CATS.some((c) => c.id === sp.cat) ? sp.cat : "all") as Category | "all";
  const sport = sp.sport === "nfl" || sp.sport === "nba" || sp.sport === "mlb" ? sp.sport : undefined;
  const s = await loadState();
  const deskBooks = flyMarkets(s);
  const sports = cat === "sports" || sport
    ? booksByCategory(s, { category: "sports", sport })
    : [];
  const filtered =
    cat === "all"
      ? deskBooks
      : cat === "sports"
        ? []
        : deskBooks.filter((m) => m.category === cat).map((m) => priceMarket(s, m));
  const privateBooks = s.leagues
    .filter((l) => l.kind === "friends")
    .flatMap((l) => flyMarkets(s, l.id));

  return (
    <Shell here="/markets">
      <Kicker>All open markets</Kicker>
      <h1 className="mt-2 text-3xl tracking-tight">The book</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Desk books on this page. Season moneylines live under Sports — click any row to trade.
        Prices are LMSR probabilities. Thin books stay on the fly but do not score the board.
      </p>
      <div className="mt-6 flex flex-wrap gap-2 text-[11px] tracking-widest">
        {CATS.map((c) => (
          <Link
            key={c.id}
            href={c.id === "all" ? "/markets" : `/markets?cat=${c.id}`}
            className={`border px-2 py-1 ${cat === c.id ? "border-spark text-spark" : "border-line text-muted"}`}
          >
            {c.label}
          </Link>
        ))}
        <Link href="/sports" className="border border-mag px-2 py-1 text-mag">
          FULL SCHEDULE →
        </Link>
      </div>
      {cat === "sports" && (
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          {(["nfl", "nba", "mlb"] as const).map((l) => (
            <Link
              key={l}
              href={`/markets?cat=sports&sport=${l}`}
              className={`border px-2 py-1 ${sport === l ? "border-spark text-spark" : "border-line text-muted"}`}
            >
              {l.toUpperCase()}
            </Link>
          ))}
        </div>
      )}

      {cat !== "sports" && (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {filtered.map((m) => (
            <MarketCard key={m.id} market={m} />
          ))}
        </div>
      )}

      {(cat === "sports" || sport) && (
        <ul className="mt-8 divide-y divide-line text-[13px]">
          {sports.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 py-2">
              <Link href={`/markets/${m.id}`} className="hover:text-spark">
                {(m.tags ?? []).find((t) => t.startsWith("week-"))
                  ? `${(m.tags ?? []).find((t) => t.startsWith("week-"))?.replace("week-", "W")} · `
                  : ""}
                {m.question}
              </Link>
              <span className="tabular text-spark">{formatPct(m.prices[0] ?? 0, 0)}</span>
            </li>
          ))}
        </ul>
      )}

      {privateBooks.length > 0 && cat === "all" && (
        <section className="mt-12">
          <Kicker>Friend leagues</Kicker>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {privateBooks.map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
        </section>
      )}
    </Shell>
  );
}
