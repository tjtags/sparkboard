"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function JoinForm({ invite, leagueName }: { invite: string; leagueName: string }) {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/join/guest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle, invite }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(data.error ?? "Could not open a desk");
      return;
    }
    router.push(data.leagueId ? `/leagues/${data.leagueId}` : "/leagues");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-8 max-w-sm space-y-3">
      <p className="text-sm text-muted">
        Pick a handle for {leagueName}. It lives in this browser until you connect GitHub.
      </p>
      <input
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        required
        minLength={2}
        placeholder="handle"
        className="field"
      />
      {err && <p className="text-sm text-no">{err}</p>}
      <button
        disabled={busy || handle.length < 2}
        className="rounded-md bg-spark px-4 py-2 text-sm text-ink disabled:opacity-40"
      >
        {busy ? "Opening desk…" : "Open a desk · ✦1.00M"}
      </button>
    </form>
  );
}
