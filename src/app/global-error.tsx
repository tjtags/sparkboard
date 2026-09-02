"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body
        style={{
          background: "#07090c",
          color: "#c8d4e0",
          fontFamily: "ui-monospace, monospace",
          padding: 48,
        }}
      >
        <div style={{ letterSpacing: "0.2em", fontSize: 11, color: "#7cffcb" }}>SYS.FAULT</div>
        <h1 style={{ fontSize: 28, marginTop: 12 }}>The desk faulted</h1>
        <p style={{ color: "#6b7c8f", maxWidth: 520 }}>
          Play-money still does not leave the league. Reload. If it keeps dying, the oracle has
          the digest {error.digest ?? "—"}.
        </p>
      </body>
    </html>
  );
}
