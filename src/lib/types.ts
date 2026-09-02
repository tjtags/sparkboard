export type LeagueKind = "global" | "friends";
export type MarketStatus = "open" | "closed" | "resolved";
export type ResolveAction = "propose" | "finalize" | "challenge" | "void" | "resolve";
export type Category = "politics" | "sports" | "macro" | "culture" | "science" | "meta";
export type AuthKind = "github" | "guest" | "email" | "seed" | "system";
export type CardMode = "points" | "off";
export type CardPool = "league" | "league+public";
export type LockInStatus = "open" | "locked" | "hit" | "miss" | "void";

export type User = {
  id: string;
  handle: string;
  displayName: string;
  desk: string;
  createdAt: string;
  system?: boolean;
  authKind: AuthKind;
  githubId?: string;
  githubLogin?: string;
  avatarUrl?: string;
  email?: string;
  emailVerifiedAt?: string;
  bio?: string;
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
  cardMode?: CardMode;
  cardPool?: CardPool;
  /** nfl weekly card through the season — play-money points, not a sportsbook */
  sportSeason?: "nfl" | "nba" | "mlb";
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
  sport?: "nfl" | "nba" | "mlb" | "other";
  tags?: string[];
  featured: boolean;
  callSheet: boolean;
  outcomes: Outcome[];
  q: number[];
  pi: number[];
  b: number;
  status: MarketStatus;
  resolvedOutcomeId?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionSourceUrl?: string;
  pendingOutcomeId?: string;
  proposedBy?: string;
  proposedAt?: string;
  challengeUntil?: string;
  challengedBy?: string;
  challengedAt?: string;
  createdBy: string;
  closesAt: string;
  createdAt: string;
  minUniqueTraders: number;
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

export type LockInPick = {
  id: string;
  userId: string;
  leagueId: string;
  week: string;
  marketId: string;
  outcomeId: string;
  pLock: number;
  status: LockInStatus;
  edge?: number;
  createdAt: string;
  updatedAt: string;
};

export type WireDraft = {
  id: string;
  topic: string;
  questions: string[];
  source: "grok" | "canned";
  createdAt: string;
  createdBy: string;
};

export type SpawnEvent = {
  at: string;
  ipHash: string;
  userId: string;
};

export type JoinProbe = {
  at: string;
  userId: string;
  ok: boolean;
};

export type EmailChallenge = {
  email: string;
  tokenHash: string;
  handle?: string;
  invite?: string;
  exp: string;
  at: string;
};

export type DeskMessage = {
  id: string;
  fromId: string;
  toId?: string;
  leagueId?: string;
  body: string;
  at: string;
};

export type ResolveEvent = {
  id: string;
  marketId: string;
  actorId: string;
  action: ResolveAction;
  outcomeId?: string;
  note?: string;
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
  version: 2;
  users: User[];
  leagues: League[];
  memberships: Membership[];
  markets: Market[];
  positions: Position[];
  trades: Trade[];
  lockInPicks: LockInPick[];
  wireDrafts: WireDraft[];
  spawnEvents: SpawnEvent[];
  joinProbes: JoinProbe[];
  emailChallenges: EmailChallenge[];
  messages: DeskMessage[];
  resolveEvents: ResolveEvent[];
  updatedAt: string;
};
