import Link from "next/link";
import { Kicker } from "@/components/Bits";
import { Shell } from "@/components/Shell";
import { pullVenues } from "@/lib/connectors";
import { formatPct } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function WirePage() {
  const snap = await pullVenues("all");
  return (
    <Shell here="/call-sheet">
      <Kicker>EXTERNAL TAPE // READ-ONLY</Kicker>
      <h1 className="mt-2 text-3xl tracking-tight">Kalshi + Polymarket</h1>
      <p className="mt-2 max-w-2xl text-[13px] text-muted">
        Public REST, no login. These are <em>their</em> books, not Sparkboard markets. We
        do not route orders. Prices are implied probabilities from the venue. Pulled{" "}
        {snap.at.slice(11, 19)}Z.
      </p>
      {snap.errors.length > 0 && (
        <p className="mt-3 text-[12px] text-no">
          {snap.errors.map((e) => `${e.venue}: ${e.message}`).join(" · ")}
        </p>
      )}
      <table className="mt-6 w-full text-left text-[12px]">
        <thead className="text-[10px] tracking-[0.2em] text-muted">
          <tr>
            <th className="py-2">VENUE</th>
            <th>CONTRACT</th>
            <th>YES</th>
            <th>VOL 24H</th>
          </tr>
        </thead>
        <tbody>
          {snap.quotes.map((q) => (
            <tr key={`${q.venue}-${q.id}`} className="border-t border-line">
              <td className="py-2 uppercase text-mag">{q.venue}</td>
              <td className="pr-3">
                <a href={q.url} className="hover:text-spark" target="_blank" rel="noreferrer">
                  {q.title}
                </a>
                <div className="text-[10px] text-muted">{q.category}</div>
              </td>
              <td className="tabular text-spark">{q.yes != null ? formatPct(q.yes, 1) : "—"}</td>
              <td className="tabular text-muted">
                {q.volume24h != null ? Math.round(q.volume24h).toLocaleString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-6 text-[11px] text-muted">
        JSON: <Link href="/api/wire/venues" className="text-spark">/api/wire/venues</Link>
      </p>
    </Shell>
  );
}
