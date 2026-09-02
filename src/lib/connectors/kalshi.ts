import type { VenueQuote } from "./types";

const BASE = "https://external-api.kalshi.com/trade-api/v2";

function dollars(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export async function fetchKalshi(limit = 40): Promise<VenueQuote[]> {
  const url = `${BASE}/events?status=open&with_nested_markets=true&limit=${Math.min(200, limit)}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Kalshi ${res.status}`);
  const data = (await res.json()) as {
    events?: Array<{
      event_ticker: string;
      title: string;
      category?: string;
      markets?: Array<{
        ticker: string;
        title: string;
        status: string;
        yes_bid_dollars?: string;
        yes_ask_dollars?: string;
        last_price_dollars?: string;
        volume_24h_fp?: string;
        close_time?: string;
        mve_collection_ticker?: string;
      }>;
    }>;
  };
  const out: VenueQuote[] = [];
  for (const ev of data.events ?? []) {
    if (ev.event_ticker?.startsWith("KXMVE")) continue;
    for (const m of ev.markets ?? []) {
      if (m.mve_collection_ticker) continue;
      if (m.status && m.status !== "active" && m.status !== "open") continue;
      const bid = dollars(m.yes_bid_dollars);
      const ask = dollars(m.yes_ask_dollars);
      const last = dollars(m.last_price_dollars);
      const yes = last ?? (bid != null && ask != null ? (bid + ask) / 2 : bid ?? ask);
      out.push({
        venue: "kalshi",
        id: m.ticker,
        title: m.title || ev.title,
        category: ev.category || "Unknown",
        url: `https://kalshi.com/markets/${ev.event_ticker.toLowerCase()}`,
        yes,
        volume24h: dollars(m.volume_24h_fp),
        closesAt: m.close_time ?? null,
        nOutcomes: 2,
      });
    }
  }
  return out.sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0)).slice(0, limit);
}
