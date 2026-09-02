import { Kicker, SparkAmt } from "@/components/Bits";
import { Shell } from "@/components/Shell";
import { PUBLIC_LEAGUE_ID } from "@/lib/constants";
import { formatSparks } from "@/lib/format";
import { loadState } from "@/lib/store";
import { leaderboard } from "@/lib/views";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const s = await loadState();
  const rows = leaderboard(s, PUBLIC_LEAGUE_ID);

  return (
    <Shell here="/leaderboard">
      <Kicker>Public Square</Kicker>
      <h1 className="display mt-2 text-4xl">Who reads the world</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Ranked on integrity-adjusted PnL. Thin markets, two-desk coin flips, and clustered
        opposing books do not count. Raw mark-to-market is shown so you can see what got
        clawed back.
      </p>
      <table className="mt-8 w-full text-left text-sm">
        <thead className="text-[11px] uppercase tracking-[0.16em] text-muted">
          <tr>
            <th className="py-2">#</th>
            <th>Desk</th>
            <th>Board PnL</th>
            <th>Raw PnL</th>
            <th>Cash</th>
            <th>Equity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.user.id} className="border-t border-line/70">
              <td className="py-3 tabular text-muted">{i + 1}</td>
              <td>
                {row.user.displayName}{" "}
                <span className="text-muted">@{row.user.handle}</span>
              </td>
              <td>
                <SparkAmt n={row.boardPnl} signed />
              </td>
              <td>
                <SparkAmt n={row.pnl} signed />
              </td>
              <td className="tabular">✦{formatSparks(row.cash)}</td>
              <td className="tabular">✦{formatSparks(row.equity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}
