import Link from "next/link";
import { Kicker, Percentile, SparkAmt } from "@/components/Bits";
import { Shell } from "@/components/Shell";
import { PUBLIC_LEAGUE_ID } from "@/lib/constants";
import { formatSparks } from "@/lib/format";
import { actorId } from "@/lib/http";
import { loadState } from "@/lib/store";
import { currentUser, leaderboard } from "@/lib/views";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const s = await loadState();
  const rows = leaderboard(s, PUBLIC_LEAGUE_ID);
  const me = currentUser(s, (await actorId()) ?? undefined);
  const mine = me ? rows.find((r) => r.user.id === me.id) : undefined;

  return (
    <Shell here="/leaderboard">
      <Kicker>PUBLIC SQUARE // RANK</Kicker>
      <h1 className="mt-2 text-3xl tracking-tight">Integrity board</h1>
      {mine && (
        <p className="mt-3 border border-spark/40 bg-ink-2 px-3 py-2 text-sm">
          You are <span className="text-spark">#{mine.rank}</span> of {rows.length}.{" "}
          <Percentile pct={mine.beatPct} /> of desks on this board.
        </p>
      )}
      <table className="mt-6 w-full text-left text-[13px]">
        <thead className="text-[10px] tracking-[0.2em] text-muted">
          <tr>
            <th className="py-2">RK</th>
            <th>NODE</th>
            <th>BEATS</th>
            <th>BOARD</th>
            <th>RAW</th>
            <th>CASH</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.user.id}
              className={`border-t border-line ${me?.id === row.user.id ? "bg-spark/5" : ""}`}
            >
              <td className="py-2 tabular text-muted">{String(row.rank).padStart(2, "0")}</td>
              <td>
                <Link href={`/d/${row.user.handle}`} className="hover:text-spark">
                  @{row.user.handle}
                </Link>
              </td>
              <td>
                <Percentile pct={row.beatPct} />
              </td>
              <td>
                <SparkAmt n={row.boardPnl} signed />
              </td>
              <td>
                <SparkAmt n={row.pnl} signed />
              </td>
              <td className="tabular">✦{formatSparks(row.cash)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}
