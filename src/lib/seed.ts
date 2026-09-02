import {
  DEFAULT_B,
  DESK_USER_ID,
  MIN_UNIQUE,
  PUBLIC_LEAGUE_ID,
  STARTING_BANKROLL,
} from "./constants";
import { applyTrade, joinLeague } from "./engine";
import { normalize } from "./lmsr";
import type { Market, State, User } from "./types";

const T0 = "2026-09-02T14:00:00.000Z";

function user(id: string, handle: string, displayName: string, desk: string, system = false): User {
  return {
    id,
    handle,
    displayName,
    desk,
    createdAt: T0,
    system,
    authKind: system ? "system" : "seed",
  };
}

function mkt(partial: Omit<Market, "q" | "status" | "createdAt" | "minUniqueTraders"> & { n: number; min?: number }): Market {
  return {
    id: partial.id,
    leagueId: partial.leagueId,
    question: partial.question,
    description: partial.description,
    resolutionCriteria: partial.resolutionCriteria,
    category: partial.category,
    featured: partial.featured,
    callSheet: partial.callSheet,
    outcomes: partial.outcomes,
    q: Array.from({ length: partial.n }, () => 0),
    pi: partial.pi,
    b: partial.b,
    status: "open",
    createdBy: partial.createdBy,
    closesAt: partial.closesAt,
    createdAt: T0,
    minUniqueTraders: partial.min ?? MIN_UNIQUE.global,
  };
}

export function emptyState(): State {
  return {
    version: 2,
    users: [],
    leagues: [],
    memberships: [],
    markets: [],
    positions: [],
    trades: [],
    lockInPicks: [],
    wireDrafts: [],
    spawnEvents: [],
    joinProbes: [],
    updatedAt: T0,
  };
}

export function buildSeed(): State {
  const s = emptyState();
  s.users = [
    user(DESK_USER_ID, "desk", "Sparkboard Desk", "Oracle", true),
    user("user_mira", "mira", "Mira Chen", "Politics"),
    user("user_cole", "cole", "Cole Okonkwo", "Numbers"),
    user("user_anjali", "anjali", "Anjali Shah", "Desk 12"),
    user("user_reed", "reed", "Reed Voss", "Skeptic"),
    user("user_sam", "sam", "Sam Ortiz", "Night wire"),
    user("user_priya", "priya", "Priya Nair", "Macro"),
    user("user_botte", "botte", "Botte", "Unaffiliated"),
    user("user_echo", "echo", "Echo", "Unaffiliated"),
  ];

  s.leagues = [
    {
      id: PUBLIC_LEAGUE_ID,
      name: "Public Square",
      slug: "public-square",
      kind: "global",
      blurb: "The open board. One million Sparks each. No transfers. Integrity gates the ranking.",
      startingBankroll: STARTING_BANKROLL,
      minUniqueTraders: MIN_UNIQUE.global,
      createdBy: DESK_USER_ID,
      createdAt: T0,
    },
    {
      id: "league_desk12",
      name: "Desk 12",
      slug: "desk-12",
      kind: "friends",
      blurb: "Anjali's private league — fantasy desk, not a casino.",
      inviteCode: "DESK12",
      startingBankroll: STARTING_BANKROLL,
      minUniqueTraders: MIN_UNIQUE.friends,
      createdBy: "user_anjali",
      createdAt: T0,
      cardMode: "points",
      cardPool: "league+public",
    },
  ];

  for (const u of s.users) {
    if (u.system) continue;
    joinLeague(s, u.id, PUBLIC_LEAGUE_ID);
  }
  for (const id of ["user_anjali", "user_mira", "user_cole", "user_reed"]) {
    joinLeague(s, id, "league_desk12", "DESK12");
  }

  const close = "2026-11-03T23:59:00.000Z";
  const b = DEFAULT_B.global;

  s.markets = [
    mkt({
      id: "mkt_house",
      leagueId: PUBLIC_LEAGUE_ID,
      n: 2,
      question: "Will Democrats win the U.S. House in 2026?",
      description:
        "Midterm fly. Cook's sheet in late August listed 21 House toss-ups; Democrats need a large share of them after redistricting. Play-money only.",
      resolutionCriteria:
        "Resolves Yes if AP calls Democratic control of the U.S. House (218+ seats, including vacancies filled by the new Congress) after the Nov 3, 2026 general election.",
      category: "politics",
      featured: true,
      callSheet: true,
      outcomes: [
        { id: "o0", name: "Yes — Democrats" },
        { id: "o1", name: "No — GOP holds" },
      ],
      pi: normalize([0.62, 0.38]),
      b,
      createdBy: DESK_USER_ID,
      closesAt: close,
    }),
    mkt({
      id: "mkt_senate",
      leagueId: PUBLIC_LEAGUE_ID,
      n: 2,
      question: "Will Republicans hold the U.S. Senate in 2026?",
      description:
        "Map still favors the GOP on paper (open seats in Trump states) but Iowa and Texas were moved to toss-up by Cook. Six true deciders.",
      resolutionCriteria:
        "Resolves Yes if Republicans hold 51 or more Senate seats after the Nov 3, 2026 election and subsequent party caucusing.",
      category: "politics",
      featured: true,
      callSheet: true,
      outcomes: [
        { id: "o0", name: "Yes — GOP holds" },
        { id: "o1", name: "No — Democrats flip" },
      ],
      pi: normalize([0.57, 0.43]),
      b,
      createdBy: DESK_USER_ID,
      closesAt: close,
    }),
    mkt({
      id: "mkt_collins",
      leagueId: PUBLIC_LEAGUE_ID,
      n: 2,
      question: "Does Susan Collins hold Maine?",
      description:
        "Only Republican senator defending a Harris-2024 state. Tossup on the NYT sheet (updated Aug 26, 2026).",
      resolutionCriteria: "Yes if Collins is certified the winner of the 2026 Maine U.S. Senate race.",
      category: "politics",
      featured: false,
      callSheet: true,
      outcomes: [
        { id: "o0", name: "Collins holds" },
        { id: "o1", name: "Democrat flips" },
      ],
      pi: normalize([0.48, 0.52]),
      b: 50_000,
      createdBy: DESK_USER_ID,
      closesAt: close,
    }),
    mkt({
      id: "mkt_texas",
      leagueId: PUBLIC_LEAGUE_ID,
      n: 2,
      question: "Do Democrats win the open Texas Senate seat?",
      description: "Open GOP seat. Cook moved Texas to toss-up citing Paxton's numbers. High-beta midterm market.",
      resolutionCriteria: "Yes if the Democratic nominee is certified winner of the 2026 Texas U.S. Senate race.",
      category: "politics",
      featured: false,
      callSheet: true,
      outcomes: [
        { id: "o0", name: "Democrats win" },
        { id: "o1", name: "Republicans hold" },
      ],
      pi: normalize([0.38, 0.62]),
      b: 60_000,
      createdBy: DESK_USER_ID,
      closesAt: close,
    }),
    mkt({
      id: "mkt_ohio",
      leagueId: PUBLIC_LEAGUE_ID,
      n: 2,
      question: "Does Jon Husted hold Ohio's Senate seat?",
      description: "Ohio is a listed toss-up. Husted is the Republican incumbent on the NYT tracker.",
      resolutionCriteria: "Yes if Husted is certified winner of the 2026 Ohio U.S. Senate race.",
      category: "politics",
      featured: false,
      callSheet: true,
      outcomes: [
        { id: "o0", name: "Husted holds" },
        { id: "o1", name: "Democrat flips" },
      ],
      pi: normalize([0.54, 0.46]),
      b: 45_000,
      createdBy: DESK_USER_ID,
      closesAt: close,
    }),
    mkt({
      id: "mkt_fed",
      leagueId: PUBLIC_LEAGUE_ID,
      n: 2,
      question: "Is the upper bound of the federal funds rate above 3.00% on 31 Dec 2026?",
      description: "Macro overlay for the political year. Resolves off the FOMC target range.",
      resolutionCriteria:
        "Yes if the Federal Reserve's published target range upper bound is strictly greater than 3.00% on Dec 31, 2026.",
      category: "macro",
      featured: false,
      callSheet: false,
      outcomes: [
        { id: "o0", name: "Yes, above 3%" },
        { id: "o1", name: "No, 3% or below" },
      ],
      pi: normalize([0.41, 0.59]),
      b: 40_000,
      createdBy: DESK_USER_ID,
      closesAt: "2026-12-31T23:59:00.000Z",
    }),
    mkt({
      id: "mkt_coinflip",
      leagueId: PUBLIC_LEAGUE_ID,
      n: 2,
      question: "Will this seeded coin-flip market resolve Yes?",
      description:
        "Integrity demo. Two unaffiliated desks dumped opposite sides. Unique-trader and concentration gates should keep it off the board.",
      resolutionCriteria: "Resolved by the desk as a fixture. Not a real event.",
      category: "meta",
      featured: false,
      callSheet: false,
      outcomes: [
        { id: "o0", name: "Yes" },
        { id: "o1", name: "No" },
      ],
      pi: normalize([0.5, 0.5]),
      b: 8_000,
      createdBy: "user_botte",
      closesAt: close,
      min: 5,
    }),
    mkt({
      id: "mkt_chat",
      leagueId: "league_desk12",
      n: 2,
      question: "Does the Desk 12 group chat go unmuted through October?",
      description: "Friends-league filler. Private, play-money, invite-only.",
      resolutionCriteria: "Yes if the chat is not globally muted at any point in October 2026.",
      category: "culture",
      featured: true,
      callSheet: false,
      outcomes: [
        { id: "o0", name: "Stays live" },
        { id: "o1", name: "Someone mutes it" },
      ],
      pi: normalize([0.35, 0.65]),
      b: DEFAULT_B.friends,
      createdBy: "user_anjali",
      closesAt: "2026-10-31T23:59:00.000Z",
      min: MIN_UNIQUE.friends,
    }),
  ];

  const buys: Array<[string, string, string, number]> = [
    ["user_mira", "mkt_house", "o0", 22000],
    ["user_cole", "mkt_house", "o1", 14000],
    ["user_anjali", "mkt_house", "o0", 18000],
    ["user_reed", "mkt_house", "o1", 9000],
    ["user_sam", "mkt_house", "o0", 11000],
    ["user_priya", "mkt_house", "o1", 8000],
    ["user_mira", "mkt_senate", "o1", 16000],
    ["user_cole", "mkt_senate", "o0", 19000],
    ["user_anjali", "mkt_senate", "o0", 7000],
    ["user_reed", "mkt_senate", "o1", 12000],
    ["user_sam", "mkt_senate", "o0", 10000],
    ["user_priya", "mkt_collins", "o1", 15000],
    ["user_mira", "mkt_collins", "o0", 12000],
    ["user_cole", "mkt_collins", "o1", 9000],
    ["user_anjali", "mkt_texas", "o0", 20000],
    ["user_reed", "mkt_texas", "o1", 17000],
    ["user_sam", "mkt_texas", "o1", 8000],
    ["user_priya", "mkt_ohio", "o0", 11000],
    ["user_mira", "mkt_ohio", "o0", 9000],
    ["user_cole", "mkt_fed", "o1", 13000],
    ["user_priya", "mkt_fed", "o0", 10000],
    ["user_botte", "mkt_coinflip", "o0", 40000],
    ["user_echo", "mkt_coinflip", "o1", 40000],
    ["user_anjali", "mkt_chat", "o1", 8000],
    ["user_mira", "mkt_chat", "o0", 6000],
    ["user_cole", "mkt_chat", "o1", 5000],
  ];

  for (const [userId, marketId, outcomeId, amount] of buys) {
    applyTrade(s, { userId, marketId, outcomeId, side: "buy", amount, mode: "spend" });
  }

  s.updatedAt = nowish();
  return s;
}

function nowish() {
  return new Date().toISOString();
}
