export type LeagueKind = "global" | "friends";
export type MarketStatus = "open" | "closed" | "resolved";
export type Category = "politics" | "sports" | "macro" | "culture" | "science" | "meta";

export type User = {
  id: string;
  handle: string;
  displayName: string;
  desk: string;
  createdAt: string;
  system?: boolean;
};

export type League = {
  id: string;
  name: string;
  slug: string;
  kind: LeagueKind;
  blurb: string;
  inviteCode?: string;
  startingBankroll: number;
  minUniqueTraders: number;
  createdBy: string;
  createdAt: string;
};

export type Membership = {
  userId: string;
  leagueId: string;
  cash: number;
  joinedAt: string;
};

export type Outcome = {
  id: string;
  name: string;
};

export type Market = {
  id: string;
  leagueId: string;
  question: string;
  description: string;
  resolutionCriteria: string;
  category: Category;
  featured: boolean;
  callSheet: boolean;
  outcomes: Outcome[];
  q: number[];
  pi: number[];
  b: number;
  status: MarketStatus;
  resolvedOutcomeId?: string;
  resolvedAt?: string;
  createdBy: string;
  closesAt: string;
  createdAt: string;
  minUniqueTraders: number;
  /** Frozen at resolution so later clustering cannot rewrite history. */
  boardEligibleAtResolve?: boolean;
};

export type Position = {
  userId: string;
  marketId: string;
  outcomeId: string;
  shares: number;
  costBasis: number;
};

export type Trade = {
  id: string;
  userId: string;
  marketId: string;
  outcomeId: string;
  side: "buy" | "sell";
  shares: number;
  cost: number;
  avgPrice: number;
  pricesAfter: number[];
  at: string;
};

export type IntegrityReport = {
  marketId: string;
  uniqueTraders: number;
  minUniqueTraders: number;
  minMet: boolean;
  volume: number;
  topTwoVolumeShare: number;
  herfindahl: number;
  thin: boolean;
  opposingPairs: { a: string; b: string; score: number }[];
  boardEligible: boolean;
  reasons: string[];
};

export type Cluster = {
  id: string;
  userIds: string[];
  reason: string;
};

export type State = {
  version: 1;
  users: User[];
  leagues: League[];
  memberships: Membership[];
  markets: Market[];
  positions: Position[];
  trades: Trade[];
  updatedAt: string;
};
