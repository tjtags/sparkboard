import { DEFAULT_B, MIN_UNIQUE, PUBLIC_LEAGUE_ID } from "./constants";
import type { VenueQuote } from "./connectors";
import { EngineError, getUser, membership } from "./engine";
import { normalize } from "./lmsr";
import type { Category, Market, State } from "./types";

export function wireMarketId(venue: string, rawId: string) {
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
  return `mkt_wire_${venue}_${id || "x"}`;
}

function categoryOf(raw: string): Category {
  const c = raw.toLowerCase();
  if (c.includes("sport")) return "sports";
  if (c.includes("elect") || c.includes("polit")) return "politics";
  if (c.includes("econ") || c.includes("fed") || c.includes("crypto") || c.includes("financ")) return "macro";
  if (c.includes("science") || c.includes("tech")) return "science";
  return "culture";
}

export function openWireBook(s: State, userId: string, q: VenueQuote): Market {
  getUser(s, userId);
  membership(s, userId, PUBLIC_LEAGUE_ID);
  const id = wireMarketId(q.venue, q.id);
  const have = s.markets.find((m) => m.id === id);
  if (have) return have;
  const title = q.title.trim();
  if (title.length < 8) throw new EngineError("bad_question", "Venue title is too thin to list");
  const question = /[?]$/.test(title) ? title : `${title}?`;
  const yes = Math.min(0.92, Math.max(0.08, q.yes ?? 0.5));
  const closesAt =
    q.closesAt && Number.isFinite(Date.parse(q.closesAt))
      ? q.closesAt
      : new Date(Date.now() + 30 * 86400000).toISOString();
  const category = categoryOf(q.category);
  const market: Market = {
    id,
    leagueId: PUBLIC_LEAGUE_ID,
    question,
    description: `Play-money mirror of a ${q.venue} print. Venue price is a prior, not settlement. Sparks are not cash.`,
    resolutionCriteria:
      "Resolved by the Sparkboard oracle from the public event named in the question. Not copied from Kalshi or Polymarket settlement.",
    category,
    sport: category === "sports" ? "other" : undefined,
    tags: ["wire", q.venue],
    featured: false,
    callSheet: category === "politics",
    outcomes: [
      { id: "o0", name: "Yes" },
      { id: "o1", name: "No" },
    ],
    q: [0, 0],
    pi: normalize([yes, 1 - yes]),
    b: DEFAULT_B.global,
    status: "open",
    createdBy: userId,
    closesAt,
    createdAt: new Date().toISOString(),
    minUniqueTraders: MIN_UNIQUE.global,
    resolutionSourceUrl: q.url,
  };
  s.markets.push(market);
  return market;
}
