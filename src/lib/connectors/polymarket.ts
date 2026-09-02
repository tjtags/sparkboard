import type { VenueQuote } from "./types";

const BASE = "https://gamma-api.polymarket.com";

function parseList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function fetchPolymarket(limit = 40): Promise<VenueQuote[]> {
  const url = `${BASE}/markets?closed=false&limit=${Math.min(100, limit)}&order=volume24hr&ascending=false`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Polymarket ${res.status}`);
  const data = (await res.json()) as Array<{
    id?: string;
    slug?: string;
    question?: string;
    groupItemTitle?: string;
    volume24hr?: number;
    outcomePrices?: string | string[];
    outcomes?: string | string[];
    endDate?: string;
    closed?: boolean;
  }>;
  const quotes: VenueQuote[] = [];
  for (const m of data ?? []) {
    if (m.closed) continue;
    const prices = parseList(m.outcomePrices).map(Number);
    const yes = Number.isFinite(prices[0]) ? prices[0] : null;
    quotes.push({
      venue: "polymarket",
      id: String(m.id ?? m.slug ?? ""),
      title: m.question || m.groupItemTitle || m.slug || "untitled",
      category: "Polymarket",
      url: m.slug ? `https://polymarket.com/event/${m.slug}` : "https://polymarket.com",
      yes,
      volume24h: typeof m.volume24hr === "number" ? m.volume24hr : null,
      closesAt: m.endDate ?? null,
      nOutcomes: Math.max(2, parseList(m.outcomes).length),
    });
  }
  return quotes.slice(0, limit);
}
