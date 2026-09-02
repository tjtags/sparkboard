"use client";

import { useState } from "react";

export function EmailForm({ invite }: { invite?: string }) {
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/auth/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, handle, invite }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error ?? "fail");
      return;
    }
    setMsg(data.sent ? "Check your mail. Confirm the desk." : "Resend unset — use this confirm link:");
    if (data.confirmUrl) setLink(data.confirmUrl);
  }

  return (
    <form onSubmit={send} className="mt-6 max-w-sm space-y-3">
      <input
        type="email"
        required
        className="field"
        placeholder="you@node.tld"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="field"
        placeholder="handle (optional)"
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
      />
      <button
        disabled={busy}
        className="border border-spark px-3 py-2 text-[11px] tracking-widest text-spark disabled:opacity-40"
      >
        {busy ? "TX…" : "SEND CONFIRM"}
      </button>
      {msg && <p className="text-[12px] text-muted">{msg}</p>}
      {link && (
        <a href={link} className="block break-all text-[11px] text-spark">
          {link}
        </a>
      )}
    </form>
  );
}
