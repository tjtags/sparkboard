import type {
  AuthKind,
  CardMode,
  CardPool,
  Category,
  DeskMessage,
  EmailChallenge,
  JoinProbe,
  League,
  LeagueKind,
  LockInPick,
  LockInStatus,
  Market,
  MarketStatus,
  Membership,
  Position,
  ResolveAction,
  ResolveEvent,
  SpawnEvent,
  State,
  Trade,
  User,
  WireDraft,
} from "../types";
import type { InferSelectModel } from "drizzle-orm";
import {
  emailChallenges,
  joinProbes,
  leagues,
  lockInPicks,
  markets,
  memberships,
  messages,
  positions,
  resolveEvents,
  spawnEvents,
  trades,
  users,
  wireDrafts,
} from "./schema";

export type Rows = {
  users: InferSelectModel<typeof users>[];
  leagues: InferSelectModel<typeof leagues>[];
  memberships: InferSelectModel<typeof memberships>[];
  markets: InferSelectModel<typeof markets>[];
  positions: InferSelectModel<typeof positions>[];
  trades: InferSelectModel<typeof trades>[];
  lockInPicks: InferSelectModel<typeof lockInPicks>[];
  wireDrafts: InferSelectModel<typeof wireDrafts>[];
  spawnEvents: InferSelectModel<typeof spawnEvents>[];
  joinProbes: InferSelectModel<typeof joinProbes>[];
  emailChallenges: InferSelectModel<typeof emailChallenges>[];
  messages: InferSelectModel<typeof messages>[];
  resolveEvents: InferSelectModel<typeof resolveEvents>[];
  updatedAt: string;
};

export function stateToRows(s: State): Rows {
  return {
    users: s.users.map((u) => ({
      id: u.id,
      handle: u.handle,
      displayName: u.displayName,
      desk: u.desk,
      createdAt: u.createdAt,
      system: Boolean(u.system),
      authKind: u.authKind,
      githubId: u.githubId ?? null,
      githubLogin: u.githubLogin ?? null,
      avatarUrl: u.avatarUrl ?? null,
      email: u.email ?? null,
      emailVerifiedAt: u.emailVerifiedAt ?? null,
      bio: u.bio ?? null,
    })),
    leagues: s.leagues.map((l) => ({
      id: l.id,
      name: l.name,
      slug: l.slug,
      kind: l.kind,
      blurb: l.blurb,
      inviteCode: l.inviteCode ?? null,
      startingBankroll: l.startingBankroll,
      minUniqueTraders: l.minUniqueTraders,
      createdBy: l.createdBy,
      createdAt: l.createdAt,
      cardMode: l.cardMode ?? null,
      cardPool: l.cardPool ?? null,
      sportSeason: l.sportSeason ?? null,
    })),
    memberships: s.memberships.map((m) => ({
      userId: m.userId,
      leagueId: m.leagueId,
      cash: m.cash,
      joinedAt: m.joinedAt,
    })),
    markets: s.markets.map((m) => ({
      id: m.id,
      leagueId: m.leagueId,
      question: m.question,
      description: m.description,
      resolutionCriteria: m.resolutionCriteria,
      category: m.category,
      sport: m.sport ?? null,
      tags: m.tags ?? null,
      featured: m.featured,
      callSheet: m.callSheet,
      outcomes: m.outcomes,
      q: m.q,
      pi: m.pi,
      b: m.b,
      status: m.status,
      resolvedOutcomeId: m.resolvedOutcomeId ?? null,
      resolvedAt: m.resolvedAt ?? null,
      resolvedBy: m.resolvedBy ?? null,
      resolutionSourceUrl: m.resolutionSourceUrl ?? null,
      pendingOutcomeId: m.pendingOutcomeId ?? null,
      proposedBy: m.proposedBy ?? null,
      proposedAt: m.proposedAt ?? null,
      challengeUntil: m.challengeUntil ?? null,
      challengedBy: m.challengedBy ?? null,
      challengedAt: m.challengedAt ?? null,
      createdBy: m.createdBy,
      closesAt: m.closesAt,
      createdAt: m.createdAt,
      minUniqueTraders: m.minUniqueTraders,
      boardEligibleAtResolve: m.boardEligibleAtResolve ?? null,
    })),
    positions: s.positions.map((p) => ({
      userId: p.userId,
      marketId: p.marketId,
      outcomeId: p.outcomeId,
      shares: p.shares,
      costBasis: p.costBasis,
    })),
    trades: s.trades.map((t) => ({
      id: t.id,
      userId: t.userId,
      marketId: t.marketId,
      outcomeId: t.outcomeId,
      side: t.side,
      shares: t.shares,
      cost: t.cost,
      avgPrice: t.avgPrice,
      pricesAfter: t.pricesAfter,
      at: t.at,
    })),
    lockInPicks: s.lockInPicks.map((p) => ({
      id: p.id,
      userId: p.userId,
      leagueId: p.leagueId,
      week: p.week,
      marketId: p.marketId,
      outcomeId: p.outcomeId,
      pLock: p.pLock,
      status: p.status,
      edge: p.edge ?? null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
    wireDrafts: s.wireDrafts.map((w) => ({
      id: w.id,
      topic: w.topic,
      questions: w.questions,
      source: w.source,
      createdAt: w.createdAt,
      createdBy: w.createdBy,
    })),
    spawnEvents: s.spawnEvents.map((e) => ({ at: e.at, ipHash: e.ipHash, userId: e.userId })),
    joinProbes: s.joinProbes.map((e) => ({ at: e.at, userId: e.userId, ok: e.ok })),
    emailChallenges: s.emailChallenges.map((e) => ({
      email: e.email,
      tokenHash: e.tokenHash,
      handle: e.handle ?? null,
      invite: e.invite ?? null,
      exp: e.exp,
      at: e.at,
    })),
    messages: s.messages.map((m) => ({
      id: m.id,
      fromId: m.fromId,
      toId: m.toId ?? null,
      leagueId: m.leagueId ?? null,
      body: m.body,
      at: m.at,
    })),
    resolveEvents: s.resolveEvents.map((e) => ({
      id: e.id,
      marketId: e.marketId,
      actorId: e.actorId,
      action: e.action,
      outcomeId: e.outcomeId ?? null,
      note: e.note ?? null,
      at: e.at,
    })),
    updatedAt: s.updatedAt,
  };
}

function undef<T>(v: T | null): T | undefined {
  return v == null ? undefined : v;
}

export function rowsToState(rows: Rows): State {
  const usersOut: User[] = rows.users.map((u) => ({
    id: u.id,
    handle: u.handle,
    displayName: u.displayName,
    desk: u.desk,
    createdAt: u.createdAt,
    system: u.system || undefined,
    authKind: u.authKind as AuthKind,
    githubId: undef(u.githubId),
    githubLogin: undef(u.githubLogin),
    avatarUrl: undef(u.avatarUrl),
    email: undef(u.email),
    emailVerifiedAt: undef(u.emailVerifiedAt),
    bio: undef(u.bio),
  }));
  const leaguesOut: League[] = rows.leagues.map((l) => ({
    id: l.id,
    name: l.name,
    slug: l.slug,
    kind: l.kind as LeagueKind,
    blurb: l.blurb,
    inviteCode: undef(l.inviteCode),
    startingBankroll: l.startingBankroll,
    minUniqueTraders: l.minUniqueTraders,
    createdBy: l.createdBy,
    createdAt: l.createdAt,
    cardMode: undef(l.cardMode) as CardMode | undefined,
    cardPool: undef(l.cardPool) as CardPool | undefined,
    sportSeason: undef(l.sportSeason) as League["sportSeason"],
  }));
  const membershipsOut: Membership[] = rows.memberships.map((m) => ({
    userId: m.userId,
    leagueId: m.leagueId,
    cash: m.cash,
    joinedAt: m.joinedAt,
  }));
  const marketsOut: Market[] = rows.markets.map((m) => ({
    id: m.id,
    leagueId: m.leagueId,
    question: m.question,
    description: m.description,
    resolutionCriteria: m.resolutionCriteria,
    category: m.category as Category,
    sport: undef(m.sport) as Market["sport"],
    tags: m.tags ?? undefined,
    featured: m.featured,
    callSheet: m.callSheet,
    outcomes: m.outcomes as Market["outcomes"],
    q: m.q,
    pi: m.pi,
    b: m.b,
    status: m.status as MarketStatus,
    resolvedOutcomeId: undef(m.resolvedOutcomeId),
    resolvedAt: undef(m.resolvedAt),
    resolvedBy: undef(m.resolvedBy),
    resolutionSourceUrl: undef(m.resolutionSourceUrl),
    pendingOutcomeId: undef(m.pendingOutcomeId),
    proposedBy: undef(m.proposedBy),
    proposedAt: undef(m.proposedAt),
    challengeUntil: undef(m.challengeUntil),
    challengedBy: undef(m.challengedBy),
    challengedAt: undef(m.challengedAt),
    createdBy: m.createdBy,
    closesAt: m.closesAt,
    createdAt: m.createdAt,
    minUniqueTraders: m.minUniqueTraders,
    boardEligibleAtResolve: m.boardEligibleAtResolve ?? undefined,
  }));
  const positionsOut: Position[] = rows.positions.map((p) => ({
    userId: p.userId,
    marketId: p.marketId,
    outcomeId: p.outcomeId,
    shares: p.shares,
    costBasis: p.costBasis,
  }));
  const tradesOut: Trade[] = rows.trades.map((t) => ({
    id: t.id,
    userId: t.userId,
    marketId: t.marketId,
    outcomeId: t.outcomeId,
    side: t.side as Trade["side"],
    shares: t.shares,
    cost: t.cost,
    avgPrice: t.avgPrice,
    pricesAfter: t.pricesAfter,
    at: t.at,
  }));
  const lockOut: LockInPick[] = rows.lockInPicks.map((p) => ({
    id: p.id,
    userId: p.userId,
    leagueId: p.leagueId,
    week: p.week,
    marketId: p.marketId,
    outcomeId: p.outcomeId,
    pLock: p.pLock,
    status: p.status as LockInStatus,
    edge: p.edge ?? undefined,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));
  const wireOut: WireDraft[] = rows.wireDrafts.map((w) => ({
    id: w.id,
    topic: w.topic,
    questions: w.questions,
    source: w.source as WireDraft["source"],
    createdAt: w.createdAt,
    createdBy: w.createdBy,
  }));
  const spawnOut: SpawnEvent[] = rows.spawnEvents.map((e) => ({
    at: e.at,
    ipHash: e.ipHash,
    userId: e.userId,
  }));
  const joinOut: JoinProbe[] = rows.joinProbes.map((e) => ({
    at: e.at,
    userId: e.userId,
    ok: e.ok,
  }));
  const emailOut: EmailChallenge[] = rows.emailChallenges.map((e) => ({
    email: e.email,
    tokenHash: e.tokenHash,
    handle: undef(e.handle),
    invite: undef(e.invite),
    exp: e.exp,
    at: e.at,
  }));
  const msgOut: DeskMessage[] = rows.messages.map((m) => ({
    id: m.id,
    fromId: m.fromId,
    toId: undef(m.toId),
    leagueId: undef(m.leagueId),
    body: m.body,
    at: m.at,
  }));
  const resolveOut: ResolveEvent[] = rows.resolveEvents.map((e) => ({
    id: e.id,
    marketId: e.marketId,
    actorId: e.actorId,
    action: e.action as ResolveAction,
    outcomeId: undef(e.outcomeId),
    note: undef(e.note),
    at: e.at,
  }));
  return {
    version: 2,
    users: usersOut,
    leagues: leaguesOut,
    memberships: membershipsOut,
    markets: marketsOut,
    positions: positionsOut,
    trades: tradesOut,
    lockInPicks: lockOut,
    wireDrafts: wireOut,
    spawnEvents: spawnOut,
    joinProbes: joinOut,
    emailChallenges: emailOut,
    messages: msgOut,
    resolveEvents: resolveOut,
    updatedAt: rows.updatedAt,
  };
}
