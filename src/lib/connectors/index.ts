import { fetchKalshi } from "./kalshi";
import { fetchPolymarket } from "./polymarket";
import type { Venue, VenueQuote, VenueSnapshot } from "./types";

export type { Venue, VenueQuote, VenueSnapshot } from "./types";

export async function pullVenues(which: "all" | Venue = "all"): Promise<VenueSnapshot> {
  const errors: VenueSnapshot["errors"] = [];
  const quotes: VenueQuote[] = [];

  const run = async (venue: Venue, fn: () => Promise<VenueQuote[]>) => {
    try {
      quotes.push(...(await fn()));
    } catch (e) {
      errors.push({ venue, message: String((e as Error).message ?? e) });
    }
  };

  const jobs: Promise<void>[] = [];
  if (which === "all" || which === "kalshi") jobs.push(run("kalshi", () => fetchKalshi(30)));
  if (which === "all" || which === "polymarket") jobs.push(run("polymarket", () => fetchPolymarket(30)));
  await Promise.all(jobs);
  quotes.sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0));
  return { at: new Date().toISOString(), quotes, errors };
}
