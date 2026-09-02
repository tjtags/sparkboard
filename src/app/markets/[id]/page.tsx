import { notFound } from "next/navigation";
import { IntegrityChip, Kicker, Prob } from "@/components/Bits";
import { Shell } from "@/components/Shell";
import { TradeTicket } from "@/components/TradeTicket";
import { formatSparks, formatPct, relative } from "@/lib/format";
import { costToPrice, maxLoss } from "@/lib/lmsr";
import { canChallenge, canResolve } from "@/lib/engine";
import { actorId } from "@/lib/http";
import { ensureMarketById } from "@/lib/sports";
import { loadState, mutate } from "@/lib/store";
import { currentUser, priceMarket, tape } from "@/lib/views";

export const dynamic = "force-dynamic";

export default async function MarketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let s = await loadState();
  let raw = s.markets.find((m) => m.id === id);
  if (!raw) {
    raw = await mutate((state) => ensureMarketById(state, id));
    s = await loadState();
    raw = s.markets.find((m) => m.id === id) ?? raw;
  }
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
            {market.category}
            {market.sport ? ` · ${market.sport}` : ""}
            {market.tags?.length ? ` · ${market.tags.join(" ")}` : ""} · b=
            {market.b.toLocaleString()} · max loss ✦
            {formatSparks(maxLoss(market.b, market.outcomes.length))}
          </Kicker>
          <h1 className="mt-2 text-3xl leading-tight tracking-tight">{market.question}</h1>
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
          {market.status === "closed" && market.pendingOutcomeId && (
            <div className="hairline rounded-lg p-4 text-[13px]">
              <Kicker>CHALLENGE WINDOW</Kicker>
              <p className="mt-2">
                Oracle proposed{" "}
                <span className="text-spark">
                  {market.outcomes.find((o) => o.id === market.pendingOutcomeId)?.name}
                </span>
                . Payout waits until {market.challengeUntil?.slice(0, 16).replace("T", " ")}Z
                {market.challengedBy ? " — challenged, waiting on the desk." : "."}
              </p>
              {market.resolutionSourceUrl && (
                <p className="mt-1 text-muted">
                  Source: {market.resolutionSourceUrl}
                </p>
              )}
            </div>
          )}
          <ResolveBox
            marketId={market.id}
            outcomes={market.outcomes}
            status={market.status}
            canOracle={Boolean(me && canResolve(s, me, market))}
            canChallenge={Boolean(me && canChallenge(s, me, market))}
            pending={Boolean(market.pendingOutcomeId)}
          />
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
  outcomes,
  status,
  canOracle,
  canChallenge,
  pending,
}: {
  marketId: string;
  outcomes: { id: string; name: string }[];
  status: string;
  canOracle: boolean;
  canChallenge: boolean;
  pending: boolean;
}) {
  if (status === "resolved") {
    return <p className="text-[12px] text-muted">Resolved. See the log on this book.</p>;
  }
  return (
    <div className="space-y-3">
      {canOracle && (
        <form action="/api/resolve" method="post" className="hairline rounded-lg p-4 text-sm">
          <div className="text-[11px] uppercase tracking-[0.2em] text-copper">Oracle</div>
          <p className="mt-1 text-muted">
            Public Square: propose, then 24h challenge, then payout. Friend desks settle now.
            Not copied from Kalshi or Polymarket.
          </p>
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
          <input
            name="sourceUrl"
            placeholder="Source URL"
            className="mt-2 w-full rounded-md border border-line bg-ink-2 px-2 py-1"
          />
          <button className="mt-2 text-copper">{pending ? "Re-propose" : "Propose resolve"}</button>
        </form>
      )}
      {canChallenge && (
        <form action="/api/resolve/challenge" method="post" className="hairline rounded-lg p-4 text-sm">
          <div className="text-[11px] uppercase tracking-[0.2em] text-warn">Challenge</div>
          <p className="mt-1 text-muted">You traded this book. Flag the proposal before the window closes.</p>
          <input type="hidden" name="marketId" value={marketId} />
          <button className="mt-2 text-warn">Challenge</button>
        </form>
      )}
      {!canOracle && !canChallenge && status === "open" && (
        <p className="text-[12px] text-muted">
          Public Square payouts wait on the oracle desk and a 24h challenge window. Friend-league
          creators resolve their own books.
        </p>
      )}
    </div>
  );
}
