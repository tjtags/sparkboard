import { Kicker } from "@/components/Bits";
import { EmailForm } from "@/components/EmailForm";
import { JoinForm } from "@/components/JoinForm";
import { Shell } from "@/components/Shell";
import { actorId } from "@/lib/http";
import { leagueByInvite } from "@/lib/engine";
import { loadState } from "@/lib/store";
import { currentUser } from "@/lib/views";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const s = await loadState();
  const league = leagueByInvite(s, code);
  if (!league) notFound();
  const me = currentUser(s, (await actorId()) ?? undefined);
  const inLeague = me
    ? s.memberships.some((m) => m.userId === me.id && m.leagueId === league.id)
    : false;

  return (
    <Shell here="/leagues">
      <Kicker>Invite</Kicker>
      <h1 className="mt-2 text-3xl tracking-tight">Join {league.name}</h1>
      <p className="mt-2 max-w-xl text-muted">
        Play-money. You get ✦1,000,000 in this league. Sparks never leave it. This is a
        game, not gambling.
      </p>
      {me && inLeague && (
        <p className="mt-6 text-yes">You are already in this desk. Open the league board.</p>
      )}
      {me && !inLeague && (
        <form action="/api/leagues/join" method="post" className="mt-6">
          <input type="hidden" name="invite" value={league.inviteCode} />
          <button className="rounded-md bg-spark px-4 py-2 text-sm text-ink">
            Join · ✦1.00M
          </button>
        </form>
      )}
      {!me && (
        <>
          <JoinForm invite={league.inviteCode ?? code} leagueName={league.name} />
          <div className="mt-8">
            <Kicker>OR CONFIRM EMAIL</Kicker>
            <EmailForm invite={league.inviteCode} />
          </div>
        </>
      )}
    </Shell>
  );
}
