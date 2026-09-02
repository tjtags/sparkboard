"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function Compose({ toHandle, leagueId }: { toHandle?: string; leagueId?: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [handle, setHandle] = useState(toHandle ?? "");
  const [err, setErr] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body, toHandle: toHandle || handle || undefined, leagueId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error ?? "fail");
      return;
    }
    setBody("");
    router.refresh();
  }

  return (
    <form onSubmit={send} className="mt-3 space-y-2">
      {!toHandle && !leagueId && (
        <input
          className="field"
          placeholder="to @handle"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
        />
      )}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={500}
        rows={3}
        className="field"
        placeholder={toHandle ? `packet → @${toHandle}` : "league packet"}
      />
      {err && <p className="text-[12px] text-no">{err}</p>}
      <button className="border border-spark px-3 py-1 text-[11px] tracking-widest text-spark">
        SEND
      </button>
    </form>
  );
}
