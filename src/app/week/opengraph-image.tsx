import { ImageResponse } from "next/og";
import { loadState } from "@/lib/store";
import { thisWeekSlate } from "@/lib/views";

export const runtime = "nodejs";
export const revalidate = 60;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Og() {
  const s = await loadState();
  const { week, games } = thisWeekSlate(s);
  const line = games[0]?.question ?? "Sunday card";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#07090c",
          color: "#c8d4e0",
          padding: 72,
          fontFamily: "ui-monospace, monospace",
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 6, color: "#7cffcb" }}>SPARKBOARD · WEEK {week}</div>
        <div style={{ fontSize: 40, lineHeight: 1.2, maxWidth: 1000 }}>{line}</div>
        <div style={{ fontSize: 22, color: "#6b7c8f" }}>/join/SUNDAY · play-money · not a sportsbook</div>
      </div>
    ),
    { ...size },
  );
}
