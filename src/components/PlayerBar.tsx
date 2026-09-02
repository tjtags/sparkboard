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
      <div className="flex flex-wrap items-center gap-3 text-[13px]">
        <span className="text-muted">Read-only until you have a desk.</span>
        <a href="/join/DESK12" className="text-spark hover:underline">
          Join Desk 12
        </a>
        {githubEnabled && (
          <a href="/signin" className="text-copper hover:underline">
            Sign in with GitHub
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-[13px]">
      <span className="text-muted">Trading as</span>
      {switcher ? (
        <select
          className="rounded-md border border-line bg-ink-2 px-2 py-1"
          value={currentId ?? ""}
          onChange={(e) => switchTo(e.target.value)}
        >
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.displayName} (@{p.handle})
            </option>
          ))}
        </select>
      ) : (
        <span className="text-paper">@{handle}</span>
      )}
      <span className="tabular text-spark">✦{formatSparks(cash)} cash</span>
      {guest && githubEnabled && (
        <a href="/api/auth/signin/github" className="text-copper hover:underline">
          Connect GitHub
        </a>
      )}
      {githubTaken && (
        <span className="text-warn">That GitHub is already a desk. You are still this guest.</span>
      )}
      <a href="/api/auth/signout" className="text-muted hover:text-paper">
        Sign out
      </a>
    </div>
  );
}
