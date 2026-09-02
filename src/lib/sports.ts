import fs from "node:fs";
import path from "node:path";
import { DESK_USER_ID, PUBLIC_LEAGUE_ID } from "./constants";
import { isoWeekKey, weekBounds } from "./lockin-week";
import { normalize } from "./lmsr";
import type { Category, Market, State } from "./types";

export type SportLeague = "nfl" | "nba" | "mlb" | "news";

export type SportGame = {
  id: string;
  league: SportLeague;
  week: number | null;
  startsAt: string;
  home?: string;
  away?: string;
  name: string;
  kind?: "mvp" | "award" | "news" | "pack";
  question?: string;
  outcomes?: string[];
  category?: Category;
  description?: string;
  resolutionCriteria?: string;
};

export type SportsCatalog = {
  at: string;
  nfl: SportGame[];
  nba: SportGame[];
  mlb: SportGame[];
  extras: SportGame[];
};

let cached: SportsCatalog | null = null;

export function loadCatalog(): SportsCatalog {
  if (cached) return cached;
  const file = path.join(process.cwd(), "data", "sports-catalog.json");
  try {
    cached = JSON.parse(fs.readFileSync(file, "utf8")) as SportsCatalog;
  } catch {
    cached = { at: new Date().toISOString(), nfl: [], nba: [], mlb: [], extras: [] };
  }
  return cached;
}

/** Season-long and news books invented from the public tape. Not scraped games. */
export const INVENTED: SportGame[] = [
  {
    id: "sb-lxi-mvp",
    league: "nfl",
    week: 22,
    startsAt: "2027-02-14T23:30:00.000Z",
    kind: "mvp",
    name: "Super Bowl LXI MVP",
    question: "Who wins Super Bowl LXI MVP?",
    outcomes: [
      "Patrick Mahomes",
      "Josh Allen",
      "Lamar Jackson",
      "Jalen Hurts",
      "Joe Burrow",
      "C.J. Stroud",
      "Justin Jefferson",
      "Ja'Marr Chase",
      "Saquon Barkley",
      "Field / other",
    ],
    category: "sports",
    description: "Play-money Super Bowl LXI MVP. Resolves on the official Super Bowl MVP trophy.",
    resolutionCriteria: "Official Super Bowl LXI MVP as named by the game's MVP award.",
  },
  {
    id: "sb-lxi-champ",
    league: "nfl",
    week: 22,
    startsAt: "2027-02-14T23:30:00.000Z",
    kind: "award",
    name: "Super Bowl LXI",
    question: "Which conference wins Super Bowl LXI?",
    outcomes: ["AFC", "NFC"],
    category: "sports",
  },
  {
    id: "nfl-mvp-26",
    league: "nfl",
    week: null,
    startsAt: "2027-02-06T00:00:00.000Z",
    kind: "mvp",
    name: "NFL MVP",
    question: "Who wins 2026 NFL Most Valuable Player?",
    outcomes: ["Josh Allen", "Lamar Jackson", "Patrick Mahomes", "Joe Burrow", "Jalen Hurts", "Field / other"],
    category: "sports",
  },
  {
    id: "nfl-afc-east",
    league: "nfl",
    week: 18,
    startsAt: "2027-01-04T00:00:00.000Z",
    kind: "award",
    question: "Which team wins the 2026 AFC East?",
    outcomes: ["Buffalo Bills", "Miami Dolphins", "New York Jets", "New England Patriots"],
    name: "AFC East",
    category: "sports",
  },
  {
    id: "nfl-afc-north",
    league: "nfl",
    week: 18,
    startsAt: "2027-01-04T00:00:00.000Z",
    kind: "award",
    question: "Which team wins the 2026 AFC North?",
    outcomes: ["Baltimore Ravens", "Cincinnati Bengals", "Pittsburgh Steelers", "Cleveland Browns"],
    name: "AFC North",
    category: "sports",
  },
  {
    id: "nfl-afc-south",
    league: "nfl",
    week: 18,
    startsAt: "2027-01-04T00:00:00.000Z",
    kind: "award",
    question: "Which team wins the 2026 AFC South?",
    outcomes: ["Houston Texans", "Indianapolis Colts", "Jacksonville Jaguars", "Tennessee Titans"],
    name: "AFC South",
    category: "sports",
  },
  {
    id: "nfl-afc-west",
    league: "nfl",
    week: 18,
    startsAt: "2027-01-04T00:00:00.000Z",
    kind: "award",
    question: "Which team wins the 2026 AFC West?",
    outcomes: ["Kansas City Chiefs", "Los Angeles Chargers", "Denver Broncos", "Las Vegas Raiders"],
    name: "AFC West",
    category: "sports",
  },
  {
    id: "nfl-nfc-east",
    league: "nfl",
    week: 18,
    startsAt: "2027-01-04T00:00:00.000Z",
    kind: "award",
    question: "Which team wins the 2026 NFC East?",
    outcomes: ["Philadelphia Eagles", "Dallas Cowboys", "Washington Commanders", "New York Giants"],
    name: "NFC East",
    category: "sports",
  },
  {
    id: "nfl-nfc-north",
    league: "nfl",
    week: 18,
    startsAt: "2027-01-04T00:00:00.000Z",
    kind: "award",
    question: "Which team wins the 2026 NFC North?",
    outcomes: ["Detroit Lions", "Green Bay Packers", "Minnesota Vikings", "Chicago Bears"],
    name: "NFC North",
    category: "sports",
  },
  {
    id: "nfl-nfc-south",
    league: "nfl",
    week: 18,
    startsAt: "2027-01-04T00:00:00.000Z",
    kind: "award",
    question: "Which team wins the 2026 NFC South?",
    outcomes: ["Tampa Bay Buccaneers", "Atlanta Falcons", "New Orleans Saints", "Carolina Panthers"],
    name: "NFC South",
    category: "sports",
  },
  {
    id: "nfl-nfc-west",
    league: "nfl",
    week: 18,
    startsAt: "2027-01-04T00:00:00.000Z",
    kind: "award",
    question: "Which team wins the 2026 NFC West?",
    outcomes: ["San Francisco 49ers", "Seattle Seahawks", "Los Angeles Rams", "Arizona Cardinals"],
    name: "NFC West",
    category: "sports",
  },
  {
    id: "nba-title-27",
    league: "nba",
    week: null,
    startsAt: "2027-06-20T00:00:00.000Z",
    kind: "award",
    question: "Which conference wins the 2027 NBA Finals?",
    outcomes: ["Western Conference", "Eastern Conference"],
    name: "NBA Finals",
    category: "sports",
  },
  {
    id: "news-nba-mvp",
    league: "nba",
    week: null,
    startsAt: "2027-04-20T00:00:00.000Z",
    kind: "mvp",
    name: "NBA MVP",
    question: "Who wins 2026-27 NBA MVP?",
    outcomes: [
      "Shai Gilgeous-Alexander",
      "Nikola Jokić",
      "Luka Dončić",
      "Giannis Antetokounmpo",
      "Anthony Edwards",
      "Field",
    ],
    category: "sports",
  },
  {
    id: "nba-scoring-27",
    league: "nba",
    week: null,
    startsAt: "2027-04-13T00:00:00.000Z",
    kind: "award",
    question: "Who leads the NBA in scoring average in 2026-27?",
    outcomes: ["Luka Dončić", "Shai Gilgeous-Alexander", "Anthony Edwards", "Nikola Jokić", "Field"],
    name: "NBA scoring title",
    category: "sports",
  },
  {
    id: "news-ws-2026",
    league: "mlb",
    week: null,
    startsAt: "2026-11-05T00:00:00.000Z",
    kind: "award",
    name: "World Series",
    question: "Does the National League win the 2026 World Series?",
    outcomes: ["NL", "AL"],
    category: "sports",
  },
  {
    id: "mlb-al-mvp-26",
    league: "mlb",
    week: null,
    startsAt: "2026-11-15T00:00:00.000Z",
    kind: "mvp",
    question: "Who wins 2026 American League MVP?",
    outcomes: ["Aaron Judge", "Bobby Witt Jr.", "Gunnar Henderson", "Juan Soto", "Field"],
    name: "AL MVP",
    category: "sports",
  },
  {
    id: "mlb-nl-mvp-26",
    league: "mlb",
    week: null,
    startsAt: "2026-11-15T00:00:00.000Z",
    kind: "mvp",
    question: "Who wins 2026 National League MVP?",
    outcomes: ["Shohei Ohtani", "Elly De La Cruz", "Francisco Lindor", "Ronald Acuña Jr.", "Field"],
    name: "NL MVP",
    category: "sports",
  },
  {
    id: "news-fed-oct",
    league: "news",
    week: null,
    startsAt: "2026-11-01T00:00:00.000Z",
    kind: "news",
    name: "Fed",
    question: "Does the Fed cut at the October 2026 meeting?",
    outcomes: ["Yes, cut", "No cut"],
    category: "macro",
  },
  {
    id: "news-fed-dec",
    league: "news",
    week: null,
    startsAt: "2026-12-16T00:00:00.000Z",
    kind: "news",
    question: "Is the upper bound of the federal funds rate at or below 3.50% after the December 2026 FOMC?",
    outcomes: ["Yes", "No"],
    name: "Fed December",
    category: "macro",
  },
  {
    id: "news-btc-100k",
    league: "news",
    week: null,
    startsAt: "2026-12-31T23:59:00.000Z",
    kind: "news",
    name: "BTC",
    question: "Is Bitcoin above $100,000 on 31 Dec 2026 UTC?",
    outcomes: ["Yes", "No"],
    category: "macro",
  },
  {
    id: "news-eth-5k",
    league: "news",
    week: null,
    startsAt: "2026-12-31T23:59:00.000Z",
    kind: "news",
    question: "Is Ether above $5,000 on 31 Dec 2026 UTC?",
    outcomes: ["Yes", "No"],
    name: "ETH",
    category: "macro",
  },
  {
    id: "news-oscars-26",
    league: "news",
    week: null,
    startsAt: "2027-03-15T00:00:00.000Z",
    kind: "news",
    name: "Oscars",
    question: "Does a non-English-language film win Best Picture at the 2027 Oscars?",
    outcomes: ["Yes", "No"],
    category: "culture",
  },
  {
    id: "news-egot",
    league: "news",
    week: null,
    startsAt: "2027-03-15T00:00:00.000Z",
    kind: "news",
    question: "Does anyone complete an EGOT at the 2027 Oscars, Grammys, Emmys, or Tonys cycle?",
    outcomes: ["Yes", "No"],
    name: "EGOT",
    category: "culture",
  },
  {
    id: "news-scotus",
    league: "news",
    week: null,
    startsAt: "2027-01-20T00:00:00.000Z",
    kind: "news",
    question: "Does a Supreme Court justice leave the Court before 20 Jan 2027?",
    outcomes: ["Yes", "No"],
    name: "SCOTUS",
    category: "politics",
  },
  {
    id: "news-house-margin",
    league: "news",
    week: null,
    startsAt: "2026-11-04T00:00:00.000Z",
    kind: "news",
    question: "Do Democrats win 230 or more U.S. House seats in 2026?",
    outcomes: ["Yes, 230+", "No"],
    name: "House margin",
    category: "politics",
  },
  {
    id: "news-ai-nobel",
    league: "news",
    week: null,
    startsAt: "2026-10-10T00:00:00.000Z",
    kind: "news",
    question: "Does a Nobel Prize in 2026 cite machine learning or artificial intelligence in the citation?",
    outcomes: ["Yes", "No"],
    name: "Nobel AI",
    category: "science",
  },
  {
    id: "news-fusion",
    league: "news",
    week: null,
    startsAt: "2026-12-31T00:00:00.000Z",
    kind: "news",
    question: "Does a lab announce net energy gain from fusion (Q>1, independently confirmed) in 2026?",
    outcomes: ["Yes", "No"],
    name: "Fusion",
    category: "science",
  },
  {
    id: "news-spx-7k",
    league: "news",
    week: null,
    startsAt: "2026-12-31T21:00:00.000Z",
    kind: "news",
    question: "Does the S&P 500 close above 7,000 on any session in 2026?",
    outcomes: ["Yes", "No"],
    name: "S&P 500",
    category: "macro",
  },
  {
    id: "news-unemp",
    league: "news",
    week: null,
    startsAt: "2026-12-31T00:00:00.000Z",
    kind: "news",
    question: "Is U.S. unemployment (U-3) at or above 5.0% in any 2026 BLS print?",
    outcomes: ["Yes", "No"],
    name: "Unemployment",
    category: "macro",
  },
  {
    id: "heisman-26",
    league: "news",
    week: null,
    startsAt: "2026-12-12T00:00:00.000Z",
    kind: "award",
    question: "Does a quarterback win the 2026 Heisman Trophy?",
    outcomes: ["Yes", "No"],
    name: "Heisman",
    category: "sports",
  },
];

export function allGames(): SportGame[] {
  const c = loadCatalog();
  const list = [...c.nfl, ...c.nba, ...c.mlb, ...(c.extras ?? []), ...INVENTED];
  const seen = new Set<string>();
  const out: SportGame[] = [];
  for (const g of list) {
    if (seen.has(g.id)) continue;
    seen.add(g.id);
    out.push(g);
  }
  return out;
}

export function currentNflWeek(now = new Date()) {
  const upcoming = loadCatalog().nfl.filter(
    (g) => new Date(g.startsAt).getTime() >= now.getTime() - 2 * 86400000 && g.week != null,
  );
  if (!upcoming.length) return 18;
  return Math.min(...upcoming.map((g) => g.week ?? 18));
}

export function marketIdFor(g: SportGame) {
  if (g.kind === "mvp" || g.kind === "award" || g.kind === "news") return `mkt_${g.id}`;
  return `mkt_${g.league}_${g.id}`;
}

export function gameByMarketId(id: string): SportGame | undefined {
  return allGames().find((g) => marketIdFor(g) === id);
}

export function specFromGame(g: SportGame): Omit<Market, "q" | "status" | "createdAt"> {
  if (g.outcomes?.length) {
    const names = g.outcomes;
    const sport = g.league === "news" ? "other" : g.league;
    const category: Category = g.category ?? (g.league === "news" ? "macro" : "sports");
    return {
      id: marketIdFor(g),
      leagueId: PUBLIC_LEAGUE_ID,
      question: g.question || g.name,
      description: g.description ?? "Play-money. Resolves from the official result. Sparks are not cash.",
      resolutionCriteria: g.resolutionCriteria ?? "Official source named in the question.",
      category,
      sport,
      tags: [g.league, g.kind ?? "pack", g.week != null ? `week-${g.week}` : ""].filter(Boolean),
      featured: g.kind === "mvp",
      callSheet: category === "politics",
      outcomes: names.map((name, i) => ({ id: `o${i}`, name })),
      pi: normalize(names.map(() => 1)),
      b: names.length > 2 ? 80_000 : 40_000,
      createdBy: DESK_USER_ID,
      closesAt: g.startsAt,
      minUniqueTraders: 5,
    };
  }
  const away = g.away ?? "Away";
  const home = g.home ?? "Home";
  return {
    id: marketIdFor(g),
    leagueId: PUBLIC_LEAGUE_ID,
    question: `Does ${away} beat ${home}?`,
    description: `${g.name}. Play-money moneyline. Kickoff ${g.startsAt}. Not a sportsbook.`,
    resolutionCriteria: `Yes if ${away} wins the regulation/OT game as official result. Push/cancel voids.`,
    category: "sports",
    sport: g.league === "news" ? "other" : g.league,
    tags: [g.league, g.week != null ? `week-${g.week}` : g.league].filter(Boolean),
    featured: false,
    callSheet: false,
    outcomes: [
      { id: "o0", name: away },
      { id: "o1", name: home },
    ],
    pi: normalize([0.5, 0.5]),
    b: 25_000,
    createdBy: DESK_USER_ID,
    closesAt: g.startsAt,
    minUniqueTraders: 5,
  };
}

function materialize(s: State, spec: Omit<Market, "q" | "status" | "createdAt">): Market {
  const market: Market = {
    ...spec,
    q: spec.outcomes.map(() => 0),
    status: "open",
    createdAt: new Date().toISOString(),
  };
  s.markets.push(market);
  return market;
}

export function ensureMarketById(s: State, id: string): Market | undefined {
  const have = s.markets.find((m) => m.id === id);
  if (have) return have;
  const g = gameByMarketId(id);
  if (!g) return undefined;
  return materialize(s, specFromGame(g));
}

/** Upsert upcoming + invented books. Catalog may be larger; visit a row to open the rest. */
export function ensureSportsMarkets(s: State, cap = 2000, now = new Date()) {
  const games = allGames();
  const have = new Set(s.markets.map((m) => m.id));
  const invented = games.filter((g) => g.kind === "mvp" || g.kind === "award" || g.kind === "news");
  const dated = games
    .filter((g) => !invented.includes(g))
    .slice()
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const horizon = now.getTime() - 12 * 3600000;
  const upcoming = dated.filter((g) => new Date(g.startsAt).getTime() >= horizon);
  const picked = [...invented, ...upcoming].slice(0, cap);
  for (const g of picked) {
    const spec = specFromGame(g);
    if (have.has(spec.id)) continue;
    materialize(s, spec);
    have.add(spec.id);
  }
  return s;
}

export function inSportWeek(m: Market, sport: "nfl" | "nba" | "mlb", now = new Date()) {
  if (m.sport !== sport) return false;
  if (sport === "nfl") {
    const w = currentNflWeek(now);
    return (m.tags ?? []).includes(`week-${w}`);
  }
  const { startsAt, locksAt } = weekBounds(isoWeekKey(now));
  const t = new Date(m.closesAt).getTime();
  return t >= new Date(startsAt).getTime() && t <= new Date(locksAt).getTime();
}

export function catalogCounts() {
  const c = loadCatalog();
  return {
    nfl: c.nfl.length,
    nba: c.nba.length,
    mlb: c.mlb.length,
    extras: (c.extras ?? []).length,
    invented: INVENTED.length,
    total: allGames().length,
  };
}
