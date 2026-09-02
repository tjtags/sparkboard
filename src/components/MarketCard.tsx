import Link from "next/link";
import { formatPct } from "@/lib/format";
import type { PricedMarket } from "@/lib/views";
import { Bar, IntegrityChip } from "./Bits";

export function MarketCard({ market }: { market: PricedMarket }) {
  const top = market.prices[0] ?? 0;
  return (
    <Link
      href={`/markets/${market.id}`}
      className="block hairline rounded-lg bg-ink-2/60 p-4 transition hover:bg-ink-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted">
          {market.category}
          {market.featured ? " · fly" : ""}
          {market.callSheet ? " · sheet" : ""}
        </div>
        <IntegrityChip report={market.integrity} />
      </div>
      <h3 className="display mt-2 text-lg leading-snug">{market.question}</h3>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted">
            {market.outcomes[0]?.name}
          </div>
          <div className="tabular text-2xl text-spark">{formatPct(top, 0)}</div>
        </div>
        <div className="w-32">
          <Bar p={top} />
        </div>
      </div>
    </Link>
  );
}
