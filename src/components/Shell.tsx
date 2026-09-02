import { PUBLIC_LEAGUE_ID } from "@/lib/constants";
import { actorId } from "@/lib/http";
import { devSwitcherEnabled } from "@/lib/flags";
import { loadState } from "@/lib/store";
import { currentUser } from "@/lib/views";
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
  const switcher = devSwitcherEnabled();

  return (
    <div className="flex min-h-full flex-col">
      <Nav here={here} />
      <div className="border-b border-line/70 bg-ink-2/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
          <PlayerBar
            players={players}
            currentId={me?.id ?? null}
            cash={cash}
            signedOut={!me}
            switcher={switcher}
            handle={me?.handle}
            guest={me?.authKind === "guest"}
            githubEnabled={Boolean(process.env.AUTH_GITHUB_ID)}
          />
          <div className="hidden text-[11px] uppercase tracking-[0.18em] text-muted md:block">
            Play-money · no cash-out · not gambling
          </div>
        </div>
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-line/70 px-4 py-6 text-center text-[12px] text-muted">
        Sparkboard is an open-source play-money prediction game. Sparks (✦) never leave a league.
        LMSR maker, Hanson 2003. MIT licensed.
      </footer>
    </div>
  );
}
