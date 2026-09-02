"use client";

import { useMemo, useState } from "react";
import { formatPct, formatSparks } from "@/lib/format";
import { buyCost, costToPrice, maxLoss, prices, sharesForSpend } from "@/lib/lmsr";

export function Playground() {
  const [b, setB] = useState(80000);
  const [prior, setPrior] = useState(50);
  const [spend, setSpend] = useState(8000);
  const pi = [prior / 100, 1 - prior / 100];
  const q0 = [0, 0];

  const quote = useMemo(() => {
    try {
      const shares = sharesForSpend(q0, b, 0, spend, pi);
      const paid = buyCost(q0, b, 0, shares, pi);
      const q1 = [shares, 0];
      return {
        shares,
        paid,
        start: prices(q0, b, pi),
        end: prices(q1, b, pi),
        to99: costToPrice(q0, b, 0, 0.99, pi).cost,
        maxLoss: maxLoss(b, 2),
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "n/a" };
    }
  }, [b, spend, pi]);

  return (
    <section className="mt-10 hairline rounded-lg p-5">
      <div className="text-[11px] uppercase tracking-[0.2em] text-copper">Sandbox</div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="text-[12px] uppercase tracking-wide text-muted">
          Liquidity b
          <input
            type="range"
            min={5000}
            max={200000}
            step={1000}
            value={b}
            onChange={(e) => setB(Number(e.target.value))}
            className="mt-2 w-full"
          />
          <div className="tabular text-paper">{b.toLocaleString()}</div>
        </label>
        <label className="text-[12px] uppercase tracking-wide text-muted">
          Prior on Yes
          <input
            type="range"
            min={5}
            max={95}
            value={prior}
            onChange={(e) => setPrior(Number(e.target.value))}
            className="mt-2 w-full"
          />
          <div className="tabular text-paper">{prior}%</div>
        </label>
        <label className="text-[12px] uppercase tracking-wide text-muted">
          Spend on Yes
          <input
            type="range"
            min={100}
            max={80000}
            step={100}
            value={spend}
            onChange={(e) => setSpend(Number(e.target.value))}
            className="mt-2 w-full"
          />
          <div className="tabular text-paper">✦{formatSparks(spend)}</div>
        </label>
      </div>
      {"error" in quote ? (
        <p className="mt-4 text-no">{quote.error}</p>
      ) : (
        <dl className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          <Row k="Start" v={`${formatPct(quote.start[0])} / ${formatPct(quote.start[1])}`} />
          <Row k="After buy" v={`${formatPct(quote.end[0])} / ${formatPct(quote.end[1])}`} />
          <Row k="Shares bought" v={quote.shares.toFixed(2)} />
          <Row k="Avg price" v={formatPct(quote.paid / quote.shares)} />
          <Row k="Cost to 99¢" v={`✦${formatSparks(quote.to99)}`} />
          <Row k="Max AMM loss" v={`✦${formatSparks(quote.maxLoss)}`} />
        </dl>
      )}
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-line/60 py-1">
      <dt className="text-muted">{k}</dt>
      <dd className="tabular">{v}</dd>
    </div>
  );
}
