"use client";

import { useState } from "react";

export function CopyInviteButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* readonly field still works */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input readOnly value={url} className="field max-w-md text-[13px]" />
      <button
        type="button"
        onClick={copy}
        className="rounded-md bg-spark px-3 py-2 text-sm text-ink"
      >
        {copied ? "Copied" : "Copy invite"}
      </button>
    </div>
  );
}
