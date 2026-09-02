"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatSparks } from "@/lib/format";

type Player = { id: string; handle: string; displayName: string };

export function PlayerBar({
  players,
  currentId,
  cash,
}: {
  players: Player[];
  currentId: string;
  cash: number;
}) {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);

  async function switchTo(id: string) {
    setBusy(true);
    await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    setBusy(false);
    router.refresh();
  }

  async function spawn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle }),
    });
    setBusy(false);
    if (res.ok) {
      setHandle("");
      router.refresh();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-[13px]">
      <span className="text-muted">Trading as</span>
      <select
        className="rounded-md border border-line bg-ink-2 px-2 py-1"
        value={currentId}
        disabled={busy}
        onChange={(e) => switchTo(e.target.value)}
      >
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.displayName} (@{p.handle})
          </option>
        ))}
      </select>
      <span className="tabular text-spark">✦{formatSparks(cash)} cash</span>
      <form onSubmit={spawn} className="flex items-center gap-2">
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="new desk handle"
          className="w-36 rounded-md border border-line bg-ink-2 px-2 py-1 placeholder:text-muted"
        />
        <button
          disabled={busy || handle.length < 2}
          className="text-copper hover:text-spark disabled:opacity-40"
        >
          Spawn
        </button>
      </form>
    </div>
  );
}
