import { notFound } from "next/navigation";
import { IntegrityChip, Kicker, Prob } from "@/components/Bits";
import { Shell } from "@/components/Shell";
import { TradeTicket } from "@/components/TradeTicket";
import { formatSparks, formatPct, relative } from "@/lib/format";
import { costToPrice, maxLoss } from "@/lib/lmsr";
import { actorId } from "@/lib/http";
import { loadState } from "@/lib/store";
import { currentUser, priceMarket, tape } from "@/lib/views";

export const dynamic = "force-dynamic";

export default async function MarketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await loadState();
  const raw = s.markets.find((m) => m.id === id);
  if (!raw) notFound();
  const market = priceMarket(s, raw);
  const me = currentUser(s, (await actorId()) ?? undefined);
  const mem = me
    ? s.memberships.find((m) => m.userId === me.id && m.leagueId === market.leagueId)
    : undefined;
  const holdings: Record<string, number> = {};
  if (me) {
    for (const p of s.positions.filter((p) => p.userId === me.id && p.marketId === market.id)) {
      holdings[p.outcomeId] = p.shares;
    }
  }
  const prints = tape(s, market.id, 16);
  const depth = [0.6, 0.7, 0.8, 0.9].map((t) => ({
    t,
    ...costToPrice(market.q, market.b, 0, t, market.pi),
  }));

  return (
    <Shell here="/markets">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <Kicker>
            {market.category} · b={market.b.toLocaleString()} · max loss ✦
            {formatSparks(maxLoss(market.b, market.outcomes.length))}
          </Kicker>
          <h1 className="display mt-2 text-4xl leading-tight">{market.question}</h1>
          <p className="mt-3 max-w-2xl text-muted">{market.description}</p>
          <p className="mt-2 text-[13px] text-muted">
            Resolves: {market.resolutionCriteria}
          </p>
          <div className="mt-4">
            <IntegrityChip report={market.integrity} />
          </div>
          <ul className="mt-6 space-y-3">
            {market.outcomes.map((o, i) => (
              <li key={o.id} className="hairline rounded-md px-4 py-3">
                <div className="flex items-baseline justify-between">
                  <span>{o.name}</span>
                  <Prob p={market.prices[i]} accent={i === 0 ? "yes" : "no"} />
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-3">
                  <div
                    className={i === 0 ? "h-full bg-yes" : "h-full bg-no"}
                    style={{ width: `${market.prices[i] * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Kicker>Depth to move {market.outcomes[0].name}</Kicker>
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="py-1">Target</th>
                  <th>Cost</th>
                  <th>Shares</th>
                </tr>
              </thead>
              <tbody className="tabular">
                {depth.map((d) => (
                  <tr key={d.t} className="border-t border-line/60">
                    <td className="py-2">{formatPct(d.t, 0)}</td>
                    <td>{d.feasible ? `✦${formatSparks(d.cost)}` : "already above"}</td>
                    <td>{d.feasible ? d.shares.toFixed(1) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8">
            <Kicker>Prints</Kicker>
            <ul className="mt-3 divide-y divide-line/70 text-sm">
              {prints.map((t) => (
                <li key={t.id} className="flex justify-between py-2 text-muted">
                  <span>
                    @{t.user?.handle} {t.side} {t.outcome?.name}
                  </span>
                  <span className="tabular">
                    ✦{Math.round(t.cost).toLocaleString()} @ {formatPct(t.avgPrice)} · {relative(t.at)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          {mem && market.status === "open" ? (
            <TradeTicket
              marketId={market.id}
              outcomes={market.outcomes}
              q={market.q}
              b={market.b}
              pi={market.pi}
              cash={mem.cash}
              holdings={holdings}
            />
          ) : (
            <p className="text-muted">Join this league to trade.</p>
          )}
          <ResolveBox marketId={market.id} creatorId={market.createdBy} outcomes={market.outcomes} />
          <div className="text-[12px] leading-relaxed text-muted">
            {market.integrity.reasons.map((r) => (
              <p key={r}>{r}</p>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

function ResolveBox({
  marketId,
  creatorId,
  outcomes,
}: {
  marketId: string;
  creatorId: string;
  outcomes: { id: string; name: string }[];
}) {
  void creatorId;
  return (
    <form action="/api/resolve" method="post" className="hairline rounded-lg p-4 text-sm">
      <div className="text-[11px] uppercase tracking-[0.2em] text-copper">Oracle</div>
      <p className="mt-1 text-muted">Creator or desk can resolve. Demo only.</p>
      <input type="hidden" name="marketId" value={marketId} />
      <select
        name="outcomeId"
        className="mt-2 w-full rounded-md border border-line bg-ink-2 px-2 py-1"
      >
        {outcomes.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <button className="mt-2 text-copper">Resolve</button>
    </form>
  );
}
