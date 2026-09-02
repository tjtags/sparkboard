"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPct, formatSparks } from "@/lib/format";
import { quoteBuySpend, quoteSellShares, sharesForProceeds } from "@/lib/lmsr";

type Outcome = { id: string; name: string };

export function TradeTicket({
  marketId,
  outcomes,
  q,
  b,
  pi,
  cash,
  holdings,
}: {
  marketId: string;
  outcomes: Outcome[];
  q: number[];
  b: number;
  pi: number[];
  cash: number;
  holdings: Record<string, number>;
}) {
  const router = useRouter();
  const [outcomeId, setOutcomeId] = useState(outcomes[0]?.id ?? "o0");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("4000");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const i = Math.max(0, outcomes.findIndex((o) => o.id === outcomeId));
  const spend = Number(amount) || 0;
  const held = holdings[outcomeId] ?? 0;

  const quote = useMemo(() => {
    try {
      if (side === "buy") {
        if (spend <= 0) return null;
        return quoteBuySpend(q, b, i, spend, pi);
      }
      const shares = sharesForProceeds(q, b, i, spend, held, pi);
      if (shares <= 0) return null;
      return quoteSellShares(q, b, i, shares, pi);
    } catch {
      return null;
    }
  }, [q, b, i, spend, pi, side, held]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/trade", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ marketId, outcomeId, side, amount: spend, mode: "spend" }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(data.error ?? "Trade failed");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="hairline rounded-lg bg-ink-2 p-4">
      <div className="text-[11px] uppercase tracking-[0.2em] text-copper">Ticket</div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {outcomes.map((o, idx) => (
          <button
            type="button"
            key={o.id}
            onClick={() => setOutcomeId(o.id)}
            className={`rounded-md px-3 py-2 text-left text-sm ${
              outcomeId === o.id ? "bg-ink-3 text-paper" : "bg-ink text-muted"
            }`}
          >
            <div className="text-[11px] uppercase tracking-wide">{o.name}</div>
            <div className="tabular text-lg text-spark">
              {quote ? formatPct(quote.startPrices[idx] ?? 0, 1) : "—"}
            </div>
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        {(["buy", "sell"] as const).map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => setSide(s)}
            className={`flex-1 rounded-md py-1.5 text-sm capitalize ${
              side === s ? (s === "buy" ? "bg-yes text-ink" : "bg-no text-ink") : "bg-ink text-muted"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <label className="mt-3 block text-[12px] text-muted">
        Sparks {side === "buy" ? "to spend" : "to raise"}
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-2 tabular"
        />
      </label>
      <div className="mt-3 space-y-1 text-[13px] text-muted">
        <Row k="Cash" v={`✦${formatSparks(cash)}`} />
        <Row k="Held" v={held.toFixed(2)} />
        {quote && (
          <>
            <Row k="Shares" v={quote.shares.toFixed(2)} />
            <Row k="Avg price" v={formatPct(quote.avgPrice)} />
            <Row
              k="New price"
              v={`${formatPct(quote.endPrices[i] ?? 0)} (${quote.impact >= 0 ? "+" : ""}${(quote.impact * 100).toFixed(2)}pp)`}
            />
          </>
        )}
      </div>
      {err && <p className="mt-2 text-sm text-no">{err}</p>}
      <button
        disabled={busy || !quote}
        className="mt-4 w-full rounded-md bg-spark py-2 text-sm font-medium text-ink disabled:opacity-40"
      >
        {busy ? "Routing…" : side === "buy" ? "Buy from the maker" : "Sell to the maker"}
      </button>
      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        Play-money. No transfers. 8% cash cap per ticket, 25% of starting bankroll per market.
      </p>
    </form>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span>{k}</span>
      <span className="tabular text-paper">{v}</span>
    </div>
  );
}
