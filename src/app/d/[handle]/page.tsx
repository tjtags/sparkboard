import Link from "next/link";
import { notFound } from "next/navigation";
import { Kicker, Percentile, SparkAmt } from "@/components/Bits";
import { Compose } from "@/components/Compose";
import { ProfileEdit } from "@/components/ProfileEdit";
import { Shell } from "@/components/Shell";
import { PUBLIC_LEAGUE_ID } from "@/lib/constants";
import { actorId } from "@/lib/http";
import { loadState } from "@/lib/store";
import { currentUser, deskByHandle, leaderboard, tape } from "@/lib/views";

export const dynamic = "force-dynamic";

export default async function DeskPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const s = await loadState();
  const desk = deskByHandle(s, handle);
  if (!desk) notFound();
  const me = currentUser(s, (await actorId()) ?? undefined);
  const board = leaderboard(s, PUBLIC_LEAGUE_ID);
  const row = board.find((r) => r.user.id === desk.id);
  const prints = tape(s, undefined, 40).filter((t) => t.userId === desk.id).slice(0, 12);
  const wall = s.messages
    .filter((m) => m.toId === desk.id)
    .slice(-20)
    .reverse();
  const mine = me?.id === desk.id;

  return (
    <Shell here="/leaderboard">
      <Kicker>NODE // @{desk.handle}</Kicker>
      <h1 className="mt-2 text-3xl">{desk.displayName}</h1>
      <p className="mt-1 text-[12px] tracking-widest text-muted">
        {desk.desk} · {desk.authKind.toUpperCase()}
        {desk.emailVerifiedAt ? " · MAIL.OK" : ""}
      </p>
      {row && (
        <p className="mt-4 text-sm">
          Rank <span className="text-spark">#{row.rank}</span> · <Percentile pct={row.beatPct} /> ·{" "}
          <SparkAmt n={row.boardPnl} signed />
        </p>
      )}
      {desk.bio && <p className="mt-4 max-w-xl text-sm text-paper/90">{desk.bio}</p>}
      {mine && <ProfileEdit displayName={desk.displayName} desk={desk.desk} bio={desk.bio ?? ""} />}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <Kicker>TAPE</Kicker>
          <ul className="mt-2 text-[12px] text-muted">
            {prints.map((t) => (
              <li key={t.id} className="flex justify-between py-1">
                <span>
                  {t.side} {t.outcome?.name}
                </span>
                <Link href={`/markets/${t.marketId}`} className="text-spark">
                  {t.market?.question.slice(0, 42)}
                </Link>
              </li>
            ))}
            {prints.length === 0 && <li>No prints.</li>}
          </ul>
        </div>
        <div>
          <Kicker>WALL</Kicker>
          <ul className="mt-2 space-y-2 text-[13px]">
            {wall.map((m) => {
              const from = s.users.find((u) => u.id === m.fromId);
              return (
                <li key={m.id} className="border border-line p-2">
                  <Link href={`/d/${from?.handle}`} className="text-spark">
                    @{from?.handle}
                  </Link>{" "}
                  <span className="text-muted">{m.at.slice(11, 16)}Z</span>
                  <p className="mt-1">{m.body}</p>
                </li>
              );
            })}
          </ul>
          {me && !mine && <Compose toHandle={desk.handle} />}
        </div>
      </div>
    </Shell>
  );
}
