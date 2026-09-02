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
      <div className="rounded-lg bg-paper px-6 py-8 text-ink md:px-10">
        <Kicker>
          <span className="text-copper">Sparkboard desk · 2 September 2026</span>
        </Kicker>
        <h1 className="display mt-2 text-4xl text-ink">Politics call sheet</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink/70">
          Morning printout. Implied probabilities from the LMSR book, not polls. Nov 3
          general. Senate toss-ups on the NYT sheet: Alaska, Iowa, Maine, Michigan, Ohio,
          Texas. House: 21 toss-ups as of Aug 26.
        </p>
        <table className="mt-8 w-full text-left text-sm">
          <thead className="text-[11px] uppercase tracking-[0.16em] text-copper">
            <tr>
              <th className="py-2">#</th>
              <th>Market</th>
              <th>Implied</th>
              <th>b</th>
              <th>Integrity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m, i) => (
              <tr key={m.id} className="border-t border-ink/10">
                <td className="py-3 tabular">{i + 1}</td>
                <td className="py-3 pr-4">
                  <Link href={`/markets/${m.id}`} className="hover:underline">
                    {m.question}
                  </Link>
                </td>
                <td className="tabular font-medium">{formatPct(m.prices[0], 1)}</td>
                <td className="tabular">{m.b.toLocaleString()}</td>
                <td>
                  <span className="text-[12px]">
                    {m.integrity.boardEligible ? "clears" : "thin"} · {m.integrity.uniqueTraders} desks
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-8 max-w-2xl text-[13px] text-ink/60">
          Sources mixed into the seed: NYT midterms tracker (updated Aug 26, 2026), Cook
          ratings moving Texas and Iowa to toss-up, Ballotpedia battleground list, AP
          election calendar (Nov 3). This is a game book, not a forecast product.
        </p>
      </div>
      <form action="/api/desk/suggest" method="post" className="mt-8 max-w-xl">
        <Kicker>Wire · optional Grok scrape</Kicker>
        <p className="mt-2 text-sm text-muted">
          If <code className="text-spark">XAI_API_KEY</code> is set, Grok drafts new politics
          questions from a topic. Otherwise you get the canned midterm wire.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            name="topic"
            defaultValue="2026 US midterms"
            className="field"
          />
          <button className="rounded-md bg-spark px-3 py-2 text-sm text-ink">Draft</button>
        </div>
      </form>
    </Shell>
  );
}
