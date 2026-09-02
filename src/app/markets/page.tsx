import { MarketCard } from "@/components/MarketCard";
import { Kicker } from "@/components/Bits";
import { Shell } from "@/components/Shell";
import { loadState } from "@/lib/store";
import { flyMarkets } from "@/lib/views";

export const dynamic = "force-dynamic";

export default async function MarketsPage() {
  const s = await loadState();
  const publicBooks = flyMarkets(s);
  const privateBooks = s.leagues
    .filter((l) => l.kind === "friends")
    .flatMap((l) => flyMarkets(s, l.id));

  return (
    <Shell here="/markets">
      <Kicker>All open markets</Kicker>
      <h1 className="mt-2 text-3xl tracking-tight">The book</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Anyone can open a question. Prices are LMSR probabilities. Thin books stay on the fly
        but do not score the board.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {publicBooks.map((m) => (
          <MarketCard key={m.id} market={m} />
        ))}
      </div>
      {privateBooks.length > 0 && (
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
