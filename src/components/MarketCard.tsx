import Link from "next/link";
import { formatPct } from "@/lib/format";
import type { PricedMarket } from "@/lib/views";
import { Bar, IntegrityChip } from "./Bits";

export function MarketCard({ market }: { market: PricedMarket }) {
  const top = market.prices[0] ?? 0;
  return (
    <Link
      href={`/markets/${market.id}`}
      className="tick block border border-line bg-ink/60 p-4 hover:border-spark/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-[10px] tracking-[0.2em] text-muted">
          {market.category.toUpperCase()}
          {market.featured ? " · HEAD" : ""}
        </div>
        <IntegrityChip report={market.integrity} />
      </div>
      <h3 className="mt-2 text-[15px] leading-snug">{market.question}</h3>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] tracking-widest text-muted">{market.outcomes[0]?.name}</div>
          <div className="tabular text-2xl text-spark">{formatPct(top, 0)}</div>
        </div>
        <div className="w-28">
          <Bar p={top} />
        </div>
      </div>
    </Link>
  );
}
