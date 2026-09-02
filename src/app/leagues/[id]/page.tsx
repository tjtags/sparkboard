import Link from "next/link";
import { notFound } from "next/navigation";
import { Kicker, SparkAmt } from "@/components/Bits";
import { MarketCard } from "@/components/MarketCard";
import { Shell } from "@/components/Shell";
import { formatSparks } from "@/lib/format";
import { readPlayerId } from "@/lib/session";
import { loadState } from "@/lib/store";
import { currentUser, flyMarkets, leaderboard } from "@/lib/views";

export const dynamic = "force-dynamic";

export default async function LeaguePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await loadState();
  const league = s.leagues.find((l) => l.id === id);
  if (!league) notFound();
  const me = currentUser(s, await readPlayerId());
  const inLeague = s.memberships.some((m) => m.userId === me.id && m.leagueId === league.id);
  const board = leaderboard(s, league.id);
  const books = flyMarkets(s, league.id);

  return (
    <Shell here="/leagues">
      <Kicker>
        {league.kind} league{league.inviteCode ? ` · invite ${league.inviteCode}` : ""}
      </Kicker>
      <h1 className="display mt-2 text-4xl">{league.name}</h1>
      <p className="mt-2 max-w-xl text-muted">{league.blurb}</p>

      {!inLeague && league.kind === "friends" && (
        <form action="/api/leagues/join" method="post" className="mt-6 flex max-w-md gap-2">
          <input type="hidden" name="leagueId" value={league.id} />
          <input name="invite" placeholder="Invite code" className="field" />
          <button className="rounded-md bg-spark px-3 text-sm text-ink">Join · ✦1.00M</button>
        </form>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <Kicker>League board</Kicker>
          <ol className="mt-3">
            {board.map((row, i) => (
              <li
                key={row.user.id}
                className="flex items-center justify-between border-b border-line/60 py-2 text-sm"
              >
                <span>
                  <span className="tabular text-muted">{i + 1}</span> {row.user.displayName}{" "}
                  <span className="text-muted">@{row.user.handle}</span>
                </span>
                <span>
                  <SparkAmt n={row.boardPnl} signed />{" "}
                  <span className="text-[12px] text-muted">
                    cash ✦{formatSparks(row.cash)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <Kicker>Books in this league</Kicker>
          <div className="mt-3 space-y-3">
            {books.map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
            {books.length === 0 && <p className="text-muted">No open books yet.</p>}
          </div>
          <Link href="/markets/new" className="mt-4 inline-block text-sm text-copper">
            Open a market here →
          </Link>
        </div>
      </div>
    </Shell>
  );
}
