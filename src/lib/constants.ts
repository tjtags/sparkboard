export const STARTING_BANKROLL = 1_000_000;
export const MIN_TRADE = 25;
export const MAX_TRADE_CASH_FRAC = 0.08;
export const MAX_MARKET_COST_FRAC = 0.25;
export const MIN_B = 5_000;
export const MAX_B = 400_000;
export const DEFAULT_B = {
  global: 80_000,
  friends: 20_000,
} as const;
export const MIN_UNIQUE = {
  global: 5,
  friends: 3,
} as const;
/** If the two largest traders are this share of volume, the book is thin. */
export const THIN_TOP_TWO = 0.9;
export const CLUSTER_MIN_MARKETS = 2;
export const CLUSTER_OPPOSE = -0.7;
export const CLUSTER_VOLUME = 0.6;

export const PUBLIC_LEAGUE_ID = "league_public";
export const DESK_USER_ID = "user_desk";
/** Public Square proposed resolves sit this long before payout. */
export const CHALLENGE_MS = 24 * 60 * 60 * 1000;
