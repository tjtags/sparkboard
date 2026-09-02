import Link from "next/link";
import { Kicker } from "@/components/Bits";
import { LockInCard } from "@/components/LockInCard";
import { Shell } from "@/components/Shell";
import { CopyInviteButton } from "@/components/CopyInviteButton";
import { SUNDAY_INVITE, SUNDAY_LEAGUE_ID } from "@/lib/constants";
import { formatPct } from "@/lib/format";
import { actorId } from "@/lib/http";
import { cardPool, isoWeekKey, lazyLock, weekBounds } from "@/lib/lockin";
import { prices } from "@/lib/lmsr";
import { appOrigin } from "@/lib/mail";
import { loadState } from "@/lib/store";
import { currentUser, thisWeekSlate } from "@/lib/views";

export const dynamic = "force-dynamic";

export default async function WeekPage({
  searchParams,
}: {
  searchParams: Promise<{ league?: string }>;
}) {
  const sp = await searchParams;
  const sport = sp.league === "nba" || sp.league === "mlb" ? sp.league : "nfl";
  const s = await loadState();
  const me = currentUser(s, (await actorId()) ?? undefined);
  const { week, games, mvp } = thisWeekSlate(s, new Date(), sport);
  const sunday = s.leagues.find((l) => l.id === SUNDAY_LEAGUE_ID);
  const inSunday = Boolean(
    me && s.memberships.some((m) => m.userId === me.id && m.leagueId === SUNDAY_LEAGUE_ID),
  );
  const seasonDesk =
    me &&
    s.leagues.find(
      (l) =>
        l.sportSeason && s.memberships.some((m) => m.userId === me.id && m.leagueId === l.id),
    );
  const iso = isoWeekKey();
  const { locksAt } = weekBounds(iso);
  const pool = seasonDesk ? cardPool(s, seasonDesk.id) : [];
  const myPick =
    me && seasonDesk
      ? s.lockInPicks.find((p) => p.userId === me.id && p.leagueId === seasonDesk.id && p.week === iso)
      : undefined;
  if (myPick) {
    const m = s.markets.find((x) => x.id === myPick.marketId);
    if (m) lazyLock(myPick, m);
  }
  const inviteUrl = `${appOrigin()}/join/${SUNDAY_INVITE}`;

  return (
    <Shell here="/week">
      <Kicker>
        WEEK {week} // {sport.toUpperCase()} // PLAY-MONEY
      </Kicker>
      <div className="mt-2 flex gap-2 text-[11px] tracking-widest">
        {(["nfl", "nba", "mlb"] as const).map((l) => (
          <Link
            key={l}
            href={l === "nfl" ? "/week" : `/week?league=${l}`}
            className={sport === l ? "text-spark" : "text-muted"}
          >
            {l.toUpperCase()}
          </Link>
        ))}
      </div>
      <h1 className="mt-2 text-3xl tracking-tight">This week&apos;s card</h1>
      <p className="mt-2 max-w-2xl text-[13px] text-muted">
        One lock-in from this slate, with your friends, through the last game. Points vs the
        price you locked. Sparks do not move. Not a sportsbook. Text the invite.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <CopyInviteButton url={inviteUrl} />
        <Link href={`/join/${SUNDAY_INVITE}`} className="text-[11px] tracking-widest text-spark">
          /join/{SUNDAY_INVITE}
        </Link>
        {sunday && (
          <Link href={`/leagues/${sunday.id}`} className="text-[11px] tracking-widest text-muted">
            SUNDAY BOARD →
          </Link>
        )}
      </div>

      {mvp && (
        <Link href={`/markets/${mvp.id}`} className="mt-8 block tick border border-spark/40 bg-ink/70 p-4">
          <Kicker>SEASON // SUPER BOWL LXI</Kicker>
          <h2 className="mt-2 text-xl tracking-tight">{mvp.question}</h2>
          <p className="mt-2 tabular text-spark">{formatPct(mvp.prices[0] ?? 0, 0)} {mvp.outcomes[0]?.name}</p>
        </Link>
      )}

      {inSunday && seasonDesk && (
        <div className="mt-8">
          <LockInCard
            leagueId={seasonDesk.id}
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

      {!inSunday && (
        <p className="mt-8 text-[13px] text-copper">
          Join Sunday to lock a card this week. Guest is enough.{" "}
          <Link href={`/join/${SUNDAY_INVITE}`} className="text-spark">
            Open the invite →
          </Link>
        </p>
      )}

      <ul className="mt-8 divide-y divide-line text-[13px]">
        {games.map((g) => (
          <li key={g.id} className="flex items-center justify-between gap-3 py-2">
            <Link href={`/markets/${g.id}`} className="hover:text-spark">
              {g.question}
            </Link>
            <span className="shrink-0 tabular text-spark">{formatPct(g.prices[0] ?? 0, 0)}</span>
          </li>
        ))}
      </ul>
      {games.length === 0 && (
        <p className="mt-8 text-muted">No NFL books this week — check /sports.</p>
      )}
    </Shell>
  );
}
