"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPct } from "@/lib/format";

type Book = { id: string; question: string; outcomes: { id: string; name: string }[]; prices: number[] };

export function LockInCard({
  leagueId,
  books,
  locked,
  current,
}: {
  leagueId: string;
  books: Book[];
  locked: boolean;
  current?: { question: string; outcome: string; pLock: number; status: string };
}) {
  const router = useRouter();
  const [marketId, setMarketId] = useState(books[0]?.id ?? "");
  const [outcomeId, setOutcomeId] = useState(books[0]?.outcomes[0]?.id ?? "");
  const [err, setErr] = useState<string | null>(null);
  const book = books.find((b) => b.id === marketId) ?? books[0];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/api/lockin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ leagueId, marketId, outcomeId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error ?? "Could not lock");
      return;
    }
    router.refresh();
  }

  if (current && (locked || current.status !== "open")) {
    return (
      <div className="hairline rounded-lg p-4 text-sm">
        <div className="text-[11px] uppercase tracking-[0.2em] text-copper">This week&apos;s card</div>
        <p className="mt-2">
          {current.question} → {current.outcome}
        </p>
        <p className="mt-1 text-muted">
          Locked at {formatPct(current.pLock)} when you last confirmed. {current.status}.
        </p>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <p className="text-sm text-muted">
        The card pool is empty this week. The commissioner can list more books; resolved
        cards can be reused.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="hairline rounded-lg p-4 text-sm">
      <div className="text-[11px] uppercase tracking-[0.2em] text-copper">Lock a card</div>
      <p className="mt-1 text-muted">One book per week. Not a bet — points vs the price you locked.</p>
      <select
        className="field mt-3"
        value={marketId}
        onChange={(e) => {
          setMarketId(e.target.value);
          const b = books.find((x) => x.id === e.target.value);
          setOutcomeId(b?.outcomes[0]?.id ?? "");
        }}
      >
        {books.map((b) => (
          <option key={b.id} value={b.id}>
            {b.question}
          </option>
        ))}
      </select>
      <select className="field mt-2" value={outcomeId} onChange={(e) => setOutcomeId(e.target.value)}>
        {book?.outcomes.map((o, i) => (
          <option key={o.id} value={o.id}>
            {o.name} ({formatPct(book.prices[i] ?? 0)})
          </option>
        ))}
      </select>
      {err && <p className="mt-2 text-no">{err}</p>}
      <button className="mt-3 rounded-md bg-spark px-3 py-1.5 text-ink">Lock it in</button>
    </form>
  );
}
