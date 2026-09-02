"use client";

import { useRouter } from "next/navigation";
import { formatSparks } from "@/lib/format";

type Player = { id: string; handle: string; displayName: string };

export function PlayerBar({
  players,
  currentId,
  cash,
  signedOut,
  switcher,
  handle,
  guest,
  githubTaken,
  githubEnabled,
  beatPct,
  rank,
}: {
  players: Player[];
  currentId: string | null;
  cash: number;
  signedOut: boolean;
  switcher: boolean;
  handle?: string;
  guest?: boolean;
  githubTaken?: boolean;
  githubEnabled?: boolean;
  beatPct?: number;
  rank?: number;
}) {
  const router = useRouter();

  async function switchTo(id: string) {
    await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    router.refresh();
  }

  if (signedOut) {
    return (
      <div className="flex flex-wrap items-center gap-3 text-[11px] tracking-widest">
        <span className="text-muted">NO SESSION</span>
        <a href="/join/DESK12" className="text-spark hover:underline">
          /join/DESK12
        </a>
        <a href="/signin" className="text-mag hover:underline">
          EMAIL
        </a>
        {githubEnabled && (
          <a href="/signin" className="text-copper hover:underline">
            GITHUB
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] tracking-widest">
      {switcher ? (
        <select
          className="border border-line bg-ink-2 px-2 py-1"
          value={currentId ?? ""}
          onChange={(e) => switchTo(e.target.value)}
        >
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.handle}
            </option>
          ))}
        </select>
      ) : (
        <a href={`/d/${handle}`} className="text-spark hover:underline">
          @{handle}
        </a>
      )}
      <span className="tabular text-paper">✦{formatSparks(cash)}</span>
      {rank != null && beatPct != null && (
        <span className="text-mag">
          #{rank} · P{Math.round(beatPct)}
        </span>
      )}
      {guest && githubEnabled && (
        <a href="/api/auth/signin/github" className="text-copper hover:underline">
          LINK GH
        </a>
      )}
      {githubTaken && <span className="text-warn">GH TAKEN</span>}
      <a href="/api/auth/signout" className="text-muted hover:text-paper">
        EXIT
      </a>
    </div>
  );
}
