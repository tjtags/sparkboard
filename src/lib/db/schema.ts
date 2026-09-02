import { boolean, doublePrecision, integer, jsonb, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

export const meta = pgTable("meta", {
  id: text("id").primaryKey(),
  version: integer("version").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  handle: text("handle").notNull().unique(),
  displayName: text("display_name").notNull(),
  desk: text("desk").notNull(),
  createdAt: text("created_at").notNull(),
  system: boolean("system").notNull().default(false),
  authKind: text("auth_kind").notNull(),
  githubId: text("github_id"),
  githubLogin: text("github_login"),
  avatarUrl: text("avatar_url"),
  email: text("email"),
  emailVerifiedAt: text("email_verified_at"),
  bio: text("bio"),
});

export const leagues = pgTable("leagues", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  kind: text("kind").notNull(),
  blurb: text("blurb").notNull(),
  inviteCode: text("invite_code"),
  startingBankroll: doublePrecision("starting_bankroll").notNull(),
  minUniqueTraders: integer("min_unique_traders").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  cardMode: text("card_mode"),
  cardPool: text("card_pool"),
  sportSeason: text("sport_season"),
});

export const memberships = pgTable(
  "memberships",
  {
    userId: text("user_id").notNull(),
    leagueId: text("league_id").notNull(),
    cash: doublePrecision("cash").notNull(),
    joinedAt: text("joined_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.leagueId] })],
);

export const markets = pgTable("markets", {
  id: text("id").primaryKey(),
  leagueId: text("league_id").notNull(),
  question: text("question").notNull(),
  description: text("description").notNull(),
  resolutionCriteria: text("resolution_criteria").notNull(),
  category: text("category").notNull(),
  sport: text("sport"),
  tags: jsonb("tags").$type<string[]>(),
  featured: boolean("featured").notNull(),
  callSheet: boolean("call_sheet").notNull(),
  outcomes: jsonb("outcomes").notNull(),
  q: jsonb("q").$type<number[]>().notNull(),
  pi: jsonb("pi").$type<number[]>().notNull(),
  b: doublePrecision("b").notNull(),
  status: text("status").notNull(),
  resolvedOutcomeId: text("resolved_outcome_id"),
  resolvedAt: text("resolved_at"),
  resolvedBy: text("resolved_by"),
  resolutionSourceUrl: text("resolution_source_url"),
  pendingOutcomeId: text("pending_outcome_id"),
  proposedBy: text("proposed_by"),
  proposedAt: text("proposed_at"),
  challengeUntil: text("challenge_until"),
  challengedBy: text("challenged_by"),
  challengedAt: text("challenged_at"),
  createdBy: text("created_by").notNull(),
  closesAt: text("closes_at").notNull(),
  createdAt: text("created_at").notNull(),
  minUniqueTraders: integer("min_unique_traders").notNull(),
  boardEligibleAtResolve: boolean("board_eligible_at_resolve"),
});

export const positions = pgTable(
  "positions",
  {
    userId: text("user_id").notNull(),
    marketId: text("market_id").notNull(),
    outcomeId: text("outcome_id").notNull(),
    shares: doublePrecision("shares").notNull(),
    costBasis: doublePrecision("cost_basis").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.marketId, t.outcomeId] })],
);

export const trades = pgTable("trades", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  marketId: text("market_id").notNull(),
  outcomeId: text("outcome_id").notNull(),
  side: text("side").notNull(),
  shares: doublePrecision("shares").notNull(),
  cost: doublePrecision("cost").notNull(),
  avgPrice: doublePrecision("avg_price").notNull(),
  pricesAfter: jsonb("prices_after").$type<number[]>().notNull(),
  at: text("at").notNull(),
});

export const lockInPicks = pgTable("lock_in_picks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  leagueId: text("league_id").notNull(),
  week: text("week").notNull(),
  marketId: text("market_id").notNull(),
  outcomeId: text("outcome_id").notNull(),
  pLock: doublePrecision("p_lock").notNull(),
  status: text("status").notNull(),
  edge: doublePrecision("edge"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const wireDrafts = pgTable("wire_drafts", {
  id: text("id").primaryKey(),
  topic: text("topic").notNull(),
  questions: jsonb("questions").$type<string[]>().notNull(),
  source: text("source").notNull(),
  createdAt: text("created_at").notNull(),
  createdBy: text("created_by").notNull(),
});

export const spawnEvents = pgTable("spawn_events", {
  at: text("at").notNull(),
  ipHash: text("ip_hash").notNull(),
  userId: text("user_id").notNull(),
});

export const joinProbes = pgTable("join_probes", {
  at: text("at").notNull(),
  userId: text("user_id").notNull(),
  ok: boolean("ok").notNull(),
});

export const emailChallenges = pgTable("email_challenges", {
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull(),
  handle: text("handle"),
  invite: text("invite"),
  exp: text("exp").notNull(),
  at: text("at").notNull(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  fromId: text("from_id").notNull(),
  toId: text("to_id"),
  leagueId: text("league_id"),
  body: text("body").notNull(),
  at: text("at").notNull(),
});

export const resolveEvents = pgTable("resolve_events", {
  id: text("id").primaryKey(),
  marketId: text("market_id").notNull(),
  actorId: text("actor_id").notNull(),
  action: text("action").notNull(),
  outcomeId: text("outcome_id"),
  note: text("note"),
  at: text("at").notNull(),
});
