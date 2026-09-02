import { PUBLIC_LEAGUE_ID } from "@/lib/constants";
import { actorId } from "@/lib/http";
import { devSwitcherEnabled } from "@/lib/flags";
import { loadState } from "@/lib/store";
import { currentUser, leaderboard } from "@/lib/views";
import { Nav } from "./Nav";
import { PlayerBar } from "./PlayerBar";

export async function Shell({
  here,
  children,
}: {
  here: string;
  children: React.ReactNode;
}) {
  const s = await loadState();
  const id = await actorId();
  const me = currentUser(s, id ?? undefined);
  const cash = me
    ? (s.memberships.find((m) => m.userId === me.id && m.leagueId === PUBLIC_LEAGUE_ID)?.cash ?? 0)
    : 0;
  const players = s.users
    .filter((u) => u.authKind === "seed")
    .map((u) => ({ id: u.id, handle: u.handle, displayName: u.displayName }));
  const mine = me ? leaderboard(s, PUBLIC_LEAGUE_ID).find((r) => r.user.id === me.id) : undefined;

  return (
    <div className="flex min-h-full flex-col">
      <Nav here={here} />
      <div className="border-b border-line bg-ink/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2">
          <PlayerBar
            players={players}
            currentId={me?.id ?? null}
            cash={cash}
            signedOut={!me}
            switcher={devSwitcherEnabled()}
            handle={me?.handle}
            guest={me?.authKind === "guest"}
            githubEnabled={Boolean(process.env.AUTH_GITHUB_ID)}
            beatPct={mine?.beatPct}
            rank={mine?.rank}
          />
          <div className="hidden text-[10px] tracking-[0.2em] text-muted lg:block">
            PLAY-MONEY · NO WIRE · NO CASHOUT
          </div>
        </div>
      </div>
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-6">{children}</main>
      <footer className="border-t border-line px-3 py-4 text-center text-[10px] tracking-[0.18em] text-muted">
        SPARKBOARD · LMSR HANSON 2003 · MIT · PLAY-MONEY
        {" · "}
        <a href="/legal" className="hover:text-spark">
          LEGAL
        </a>
        {" · "}
        <a href="/forecasts" className="hover:text-spark">
          FORECASTS
        </a>
        {" · "}
        <a href="/learn" className="hover:text-spark">
          LEARN
        </a>
      </footer>
    </div>
  );
}
