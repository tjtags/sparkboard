import Link from "next/link";
import { notFound } from "next/navigation";
import { Kicker, SparkAmt } from "@/components/Bits";
import { Compose } from "@/components/Compose";
import { CopyInviteButton } from "@/components/CopyInviteButton";
import { LockInCard } from "@/components/LockInCard";
import { MarketCard } from "@/components/MarketCard";
import { Shell } from "@/components/Shell";
import { formatSparks } from "@/lib/format";
import { actorId } from "@/lib/http";
import { cardBoard, cardPool, isoWeekKey, lazyLock, weekBounds } from "@/lib/lockin";
import { prices } from "@/lib/lmsr";
import { loadState } from "@/lib/store";
import { currentUser, flyMarkets, leaderboard } from "@/lib/views";

export const dynamic = "force-dynamic";

export default async function LeaguePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await loadState();
  const league = s.leagues.find((l) => l.id === id);
  if (!league) notFound();
  const me = currentUser(s, (await actorId()) ?? undefined);
  const inLeague = Boolean(
    me && s.memberships.some((m) => m.userId === me.id && m.leagueId === league.id),
  );
  const board = leaderboard(s, league.id);
  const books = flyMarkets(s, league.id);
  const cards = cardBoard(s, league.id);
  const week = isoWeekKey();
  const { locksAt } = weekBounds(week);
  const pool = cardPool(s, league.id);
  const myPick = me
    ? s.lockInPicks.find((p) => p.userId === me.id && p.leagueId === league.id && p.week === week)
    : undefined;
  if (myPick) {
    const m = s.markets.find((x) => x.id === myPick.marketId);
    if (m) lazyLock(myPick, m);
  }
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://sparkboard-zeta.vercel.app";
  const inviteUrl = league.inviteCode ? `${origin}/join/${league.inviteCode}` : "";

  return (
    <Shell here="/leagues">
      <Kicker>
        {league.kind} league · week {week}
        {league.sportSeason ? ` · ${league.sportSeason.toUpperCase()} SEASON` : ""}
      </Kicker>
      <h1 className="mt-2 text-3xl tracking-tight">{league.name}</h1>
      <p className="mt-2 max-w-xl text-muted">{league.blurb}</p>
      {league.sportSeason && (
        <p className="mt-3 max-w-xl text-[13px] text-copper">
          Weekly lock-in through the {league.sportSeason.toUpperCase()} slate. One card a week
          until the last game. Points, not cash. Not a sportsbook.{" "}
          <Link href={`/sports?league=${league.sportSeason}`} className="text-spark">
            Open this week&apos;s book →
          </Link>
        </p>
      )}
      {inLeague && league.sportSeason && !myPick && (
        <p className="mt-3 text-[13px] text-warn">
          No card this week. Lock one before the slate starts or you sit the week.
        </p>
      )}

      {inLeague && inviteUrl && (
        <div className="mt-6">
          <Kicker>Invite</Kicker>
          <p className="mt-1 text-sm text-muted">Text this. It is the growth loop.</p>
          <div className="mt-2">
            <CopyInviteButton url={inviteUrl} />
          </div>
        </div>
      )}

      {!inLeague && league.kind === "friends" && (
        <p className="mt-6 text-sm text-muted">
          Need an invite. Ask a member, or try{" "}
          <Link href={`/join/${league.inviteCode ?? "DESK12"}`} className="text-spark">
            /join/{league.inviteCode ?? "DESK12"}
          </Link>
          .
        </p>
      )}

      {inLeague && (league.cardMode ?? "off") === "points" && (
        <div className="mt-8">
          <LockInCard
            leagueId={league.id}
            locked={new Date().toISOString() >= locksAt}
            books={pool.map((m) => ({
              id: m.id,
              question: m.question,
              outcomes: m.outcomes,
              prices: prices(m.q, m.b, m.pi),
            }))}
            current={
              myPick
                ? {
                    question: s.markets.find((m) => m.id === myPick.marketId)?.question ?? "",
                    outcome:
                      s.markets
                        .find((m) => m.id === myPick.marketId)
                        ?.outcomes.find((o) => o.id === myPick.outcomeId)?.name ?? "",
                    pLock: myPick.pLock,
                    status: myPick.status,
                  }
                : undefined
            }
          />
        </div>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <Kicker>League board</Kicker>
          <ol className="mt-3">
            {board.map((row, i) => {
              const card = cards.find((c) => c.user.id === row.user.id);
              return (
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
                    {card && (
                      <span className="text-[12px] text-copper">
                        card {card.score >= 0 ? "+" : ""}
                        {(card.score * 100).toFixed(0)}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
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
          <Link href="/markets/new" className="mt-4 inline-block text-[11px] tracking-widest text-spark">
            [+] BOOK
          </Link>
          {inLeague && (
            <div className="mt-8">
              <Kicker>LEAGUE COMMS</Kicker>
              <ul className="mt-2 max-h-64 space-y-2 overflow-auto text-[12px]">
                {s.messages
                  .filter((m) => m.leagueId === league.id)
                  .slice(-20)
                  .reverse()
                  .map((m) => {
                    const from = s.users.find((u) => u.id === m.fromId);
                    return (
                      <li key={m.id} className="border border-line p-2">
                        <span className="text-spark">@{from?.handle}</span> {m.body}
                      </li>
                    );
                  })}
              </ul>
              <Compose leagueId={league.id} />
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
