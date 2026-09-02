export type Venue = "kalshi" | "polymarket";

export type VenueQuote = {
  venue: Venue;
  id: string;
  title: string;
  category: string;
  url: string;
  yes: number | null;
  volume24h: number | null;
  closesAt: string | null;
  nOutcomes: number;
};

export type VenueSnapshot = {
  at: string;
  quotes: VenueQuote[];
  errors: { venue: Venue; message: string }[];
};
