import Link from "next/link";
import { Kicker } from "@/components/Bits";
import { Shell } from "@/components/Shell";
import { formatPct } from "@/lib/format";
import { publicForecasts } from "@/lib/forecasts";
import { appOrigin } from "@/lib/mail";
import { loadState } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ForecastsPage() {
  const s = await loadState();
  const rows = publicForecasts(s, appOrigin());

  return (
    <Shell here="/forecasts">
      <Kicker>DATA // BOARD-ELIGIBLE</Kicker>
      <h1 className="mt-2 text-3xl tracking-tight">Forecast tape</h1>
      <p className="mt-2 max-w-2xl text-[13px] text-muted">
        Public Square books that cleared the unique-trader gate. Play-money LMSR probabilities.
        Quote the permalink. JSON and CSV are the product; this page is the printout.
      </p>
      <p className="mt-3 text-[12px]">
        <Link href="/api/public/forecasts" className="text-spark">
          JSON
        </Link>
        {" · "}
        <Link href="/api/public/forecasts?format=csv" className="text-spark">
          CSV
        </Link>
        {" · "}
        <Link href="/legal" className="text-muted">
          terms
        </Link>
      </p>
      <ul className="mt-8 divide-y divide-line text-[13px]">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
            <Link href={`/markets/${r.id}`} className="hover:text-spark">
              {r.question}
            </Link>
            <span className="tabular text-spark">
              {r.outcomes[0]?.name} {formatPct(r.outcomes[0]?.p ?? 0, 0)}
            </span>
          </li>
        ))}
      </ul>
      {rows.length === 0 && (
        <p className="mt-8 text-muted">No board-eligible public books yet.</p>
      )}
    </Shell>
  );
}
