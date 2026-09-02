import Link from "next/link";
import { Kicker } from "@/components/Bits";
import { Shell } from "@/components/Shell";
import { formatPct } from "@/lib/format";
import { loadState } from "@/lib/store";
import { callSheet } from "@/lib/views";

export const dynamic = "force-dynamic";

export default async function CallSheetPage() {
  const s = await loadState();
  const rows = callSheet(s);

  return (
    <Shell here="/call-sheet">
      <div className="tick border border-line bg-ink/70 p-6">
        <Kicker>SHEET // {new Date().toISOString().slice(0, 10)}</Kicker>
        <h1 className="mt-2 text-3xl tracking-tight">Politics bus</h1>
        <p className="mt-2 max-w-2xl text-[13px] text-muted">
          Implied LMSR, not polls. Nov 3 general. This is an instrument, not a campaign.
        </p>
        <table className="mt-6 w-full text-left text-[13px]">
          <thead className="text-[10px] tracking-[0.2em] text-muted">
            <tr>
              <th className="py-2">#</th>
              <th>CONTRACT</th>
              <th>PX</th>
              <th>B</th>
              <th>GATE</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m, i) => (
              <tr key={m.id} className="border-t border-line">
                <td className="py-2 tabular text-muted">{String(i + 1).padStart(2, "0")}</td>
                <td className="pr-4">
                  <Link href={`/markets/${m.id}`} className="hover:text-spark">
                    {m.question}
                  </Link>
                </td>
                <td className="tabular text-spark">{formatPct(m.prices[0], 1)}</td>
                <td className="tabular">{m.b.toLocaleString()}</td>
                <td className="text-[11px] text-muted">
                  {m.integrity.boardEligible ? "CLEAR" : "THIN"} · {m.integrity.uniqueTraders}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {s.wireDrafts[0] && (
        <div className="mt-6">
          <Kicker>WIRE · {s.wireDrafts[0].source.toUpperCase()}</Kicker>
          <ul className="mt-3 space-y-2">
            {s.wireDrafts[0].questions.map((q) => (
              <li key={q}>
                <Link
                  href={`/markets/new?question=${encodeURIComponent(q)}`}
                  className="text-[13px] text-spark hover:underline"
                >
                  LIST · {q}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <form action="/api/desk/suggest" method="post" className="mt-8 max-w-xl">
        <Kicker>DRAFT WIRE</Kicker>
        <div className="mt-3 flex gap-2">
          <input name="topic" defaultValue="2026 US midterms" className="field" />
          <button className="border border-spark px-3 py-2 text-[11px] tracking-widest text-spark">
            RUN
          </button>
        </div>
      </form>
    </Shell>
  );
}
