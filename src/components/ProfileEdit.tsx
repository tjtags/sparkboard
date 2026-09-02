"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProfileEdit({
  displayName,
  desk,
  bio,
}: {
  displayName: string;
  desk: string;
  bio: string;
}) {
  const router = useRouter();
  const [dn, setDn] = useState(displayName);
  const [d, setD] = useState(desk);
  const [b, setB] = useState(bio);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName: dn, desk: d, bio: b }),
    });
    router.refresh();
  }

  return (
    <form onSubmit={save} className="mt-6 max-w-md space-y-2">
      <K>DISPLAY</K>
      <input className="field" value={dn} onChange={(e) => setDn(e.target.value)} />
      <K>UNIT</K>
      <input className="field" value={d} onChange={(e) => setD(e.target.value)} />
      <K>BIO // 280</K>
      <textarea className="field" rows={3} maxLength={280} value={b} onChange={(e) => setB(e.target.value)} />
      <button className="border border-spark px-3 py-1 text-[11px] tracking-widest text-spark">
        WRITE
      </button>
    </form>
  );
}

function K({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] tracking-[0.24em] text-muted">{children}</div>;
}
