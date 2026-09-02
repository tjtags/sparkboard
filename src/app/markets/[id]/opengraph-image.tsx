import { ImageResponse } from "next/og";
import { ogPct } from "@/lib/og";
import { loadState } from "@/lib/store";

export const runtime = "nodejs";
export const revalidate = 60;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Og({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await loadState();
  const market = s.markets.find((m) => m.id === id);
  const pct = market ? ogPct(market) : null;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0B0E14",
          color: "#EDE6D6",
          padding: 72,
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 6, color: "#C4783A", textTransform: "uppercase" }}>
          Sparkboard
        </div>
        <div style={{ fontSize: 44, lineHeight: 1.15, maxWidth: 1000 }}>
          {market?.question ?? "Sparkboard"}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 20, color: "#8B93A7" }}>{pct?.leader.name}</div>
            <div style={{ fontSize: 96, color: "#E8B86D" }}>{pct?.leader.big ?? "—"}</div>
          </div>
          <div style={{ fontSize: 20, color: "#8B93A7" }}>play-money · not a forecast</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
