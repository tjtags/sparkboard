import { Kicker } from "@/components/Bits";
import { Shell } from "@/components/Shell";
import { clustersOf, integrityOf } from "@/lib/engine";
import { loadState } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function IntegrityPage() {
  const s = await loadState();
  const cls = clustersOf(s);
  const markets = s.markets.map((m) => integrityOf(s, m.id));

  return (
    <Shell here="/integrity">
      <Kicker>Anti-farm</Kicker>
      <h1 className="display mt-2 text-4xl">How the board refuses bots</h1>
      <p className="mt-3 max-w-2xl text-muted">
        The attack is not wash trades against an order book — Sparkboard is an AMM. The
        attack is spawning desks, parking them on the wrong side of a question you already
        know, and harvesting their starting million. We do not let that print on the board.
      </p>
      <ol className="mt-6 max-w-2xl list-decimal space-y-3 pl-5 text-sm text-muted">
        <li>
          <span className="text-paper">No transfers.</span> Sparks cannot move desk-to-desk
          or league-to-league. The only path is the maker.
        </li>
        <li>
          <span className="text-paper">Market sizing.</span> 8% of cash per ticket, 25% of
          the starting million per market. You cannot dump a bankroll into a private coin
          flip in one print.
        </li>
        <li>
          <span className="text-paper">Unique traders.</span> Global books need 5 distinct
          desks; friend leagues need 3. Below that, the price may show, the board ignores
          the PnL.
        </li>
        <li>
          <span className="text-paper">Concentration.</span> If two desks are ≥90% of
          volume, the book is thin even if the headcount clears.
        </li>
        <li>
          <span className="text-paper">Opposing clusters.</span> Desks that repeatedly hold
          net-opposite books and dominate those volumes are clustered. Their farm does not
          rank.
        </li>
      </ol>

      <div className="mt-10">
        <Kicker>Live books</Kicker>
        <ul className="mt-3 space-y-2">
          {markets.map((r) => {
            const m = s.markets.find((x) => x.id === r.marketId)!;
            return (
              <li key={r.marketId} className="hairline rounded-md px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>{m.question}</span>
                  <span className={r.boardEligible ? "text-yes" : "text-warn"}>
                    {r.boardEligible ? "eligible" : "held"} · {r.uniqueTraders} desks · top-two{" "}
                    {(r.topTwoVolumeShare * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-muted">{r.reasons[0]}</p>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-8">
        <Kicker>Clusters</Kicker>
        {cls.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No multi-market opposing clusters right now. The seeded coin-flip is caught by
            the unique-trader gate instead (2 desks).
          </p>
        ) : (
          <ul className="mt-2 text-sm">
            {cls.map((c) => (
              <li key={c.id}>
                {c.userIds.join(" · ")} — {c.reason}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}
