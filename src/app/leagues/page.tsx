import Link from "next/link";
import { Kicker, SparkAmt } from "@/components/Bits";
import { Shell } from "@/components/Shell";
import { STARTING_BANKROLL } from "@/lib/constants";
import { formatSparks } from "@/lib/format";
import { loadState } from "@/lib/store";
import { leaderboard } from "@/lib/views";

export const dynamic = "force-dynamic";

export default async function LeaguesPage() {
  const s = await loadState();
  return (
    <Shell here="/leagues">
      <Kicker>Leagues</Kicker>
      <h1 className="mt-2 text-3xl tracking-tight">Fantasy desks, not casinos</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Every league is its own million-Spark bankroll. You cannot send Sparks to another
        desk or another league. Friend leagues are invite-only — that is most of the
        sybil defense.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {s.leagues.map((l) => {
          const n = s.memberships.filter((m) => m.leagueId === l.id).length;
          const top = leaderboard(s, l.id)[0];
          return (
            <Link key={l.id} href={`/leagues/${l.id}`} className="hairline rounded-lg p-5 hover:bg-ink-2">
              <div className="text-[11px] uppercase tracking-[0.18em] text-copper">
                {l.kind} · {n} desks
              </div>
              <h2 className="mt-2 text-xl tracking-tight">{l.name}</h2>
              <p className="mt-1 text-sm text-muted">{l.blurb}</p>
              <div className="mt-4 text-sm">
                Stake ✦{formatSparks(STARTING_BANKROLL)}
                {top && (
                  <span className="text-muted">
                    {" "}
                    · leader {top.user.handle} <SparkAmt n={top.boardPnl} signed />
                  </span>
                )}
              </div>
              {l.kind === "friends" && (
                <div className="mt-2 text-[12px] text-muted">Invite-only · join via link</div>
              )}
            </Link>
          );
        })}
      </div>

      <form action="/api/leagues" method="post" className="mt-10 max-w-md space-y-3">
        <Kicker>Start a friends league</Kicker>
        <input name="name" required placeholder="League name" className="field" />
        <input name="blurb" placeholder="One-line desk culture" className="field" />
        <button className="rounded-md bg-spark px-4 py-2 text-sm text-ink">Create league</button>
      </form>
    </Shell>
  );
}
