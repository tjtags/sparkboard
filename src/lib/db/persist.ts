import { eq } from "drizzle-orm";
import type { State } from "../types";
import { db } from "./client";
import { rowsToState, stateToRows } from "./map";
import {
  emailChallenges,
  joinProbes,
  leagues,
  lockInPicks,
  markets,
  memberships,
  messages,
  meta,
  positions,
  resolveEvents,
  spawnEvents,
  trades,
  users,
  wireDrafts,
} from "./schema";

const MAIN = "main";

export class PostgresConflictError extends Error {
  constructor() {
    super("Sparkboard postgres CAS missed");
    this.name = "PostgresConflictError";
  }
}

export async function loadPostgres(): Promise<{ state: State; version: number } | null> {
  const d = db();
  const [head] = await d.select().from(meta).where(eq(meta.id, MAIN)).limit(1);
  if (!head) return null;
  const [
    userRows,
    leagueRows,
    memRows,
    marketRows,
    posRows,
    tradeRows,
    pickRows,
    wireRows,
    spawnRows,
    joinRows,
    emailRows,
    msgRows,
    resolveRows,
  ] = await Promise.all([
    d.select().from(users),
    d.select().from(leagues),
    d.select().from(memberships),
    d.select().from(markets),
    d.select().from(positions),
    d.select().from(trades),
    d.select().from(lockInPicks),
    d.select().from(wireDrafts),
    d.select().from(spawnEvents),
    d.select().from(joinProbes),
    d.select().from(emailChallenges),
    d.select().from(messages),
    d.select().from(resolveEvents),
  ]);
  return {
    version: head.version,
    state: rowsToState({
      users: userRows,
      leagues: leagueRows,
      memberships: memRows,
      markets: marketRows,
      positions: posRows,
      trades: tradeRows,
      lockInPicks: pickRows,
      wireDrafts: wireRows,
      spawnEvents: spawnRows,
      joinProbes: joinRows,
      emailChallenges: emailRows,
      messages: msgRows,
      resolveEvents: resolveRows,
      updatedAt: head.updatedAt,
    }),
  };
}

export async function writePostgres(s: State, expectedVersion: number | null) {
  const d = db();
  const rows = stateToRows(s);
  await d.transaction(async (tx) => {
    const [head] = await tx.select().from(meta).where(eq(meta.id, MAIN)).limit(1);
    if (expectedVersion == null) {
      if (head) await tx.delete(meta).where(eq(meta.id, MAIN));
      await tx.insert(meta).values({ id: MAIN, version: 1, updatedAt: s.updatedAt });
    } else {
      if (!head || head.version !== expectedVersion) throw new PostgresConflictError();
      await tx
        .update(meta)
        .set({ version: expectedVersion + 1, updatedAt: s.updatedAt })
        .where(eq(meta.id, MAIN));
    }

    await tx.delete(resolveEvents);
    await tx.delete(messages);
    await tx.delete(emailChallenges);
    await tx.delete(joinProbes);
    await tx.delete(spawnEvents);
    await tx.delete(wireDrafts);
    await tx.delete(lockInPicks);
    await tx.delete(trades);
    await tx.delete(positions);
    await tx.delete(markets);
    await tx.delete(memberships);
    await tx.delete(leagues);
    await tx.delete(users);

    const put = async (table: Parameters<typeof tx.insert>[0], list: object[]) => {
      for (let i = 0; i < list.length; i += 400) {
        await tx.insert(table).values(list.slice(i, i + 400) as never);
      }
    };

    if (rows.users.length) await put(users, rows.users);
    if (rows.leagues.length) await put(leagues, rows.leagues);
    if (rows.memberships.length) await put(memberships, rows.memberships);
    if (rows.markets.length) await put(markets, rows.markets);
    if (rows.positions.length) await put(positions, rows.positions);
    if (rows.trades.length) await put(trades, rows.trades);
    if (rows.lockInPicks.length) await put(lockInPicks, rows.lockInPicks);
    if (rows.wireDrafts.length) await put(wireDrafts, rows.wireDrafts);
    if (rows.spawnEvents.length) await put(spawnEvents, rows.spawnEvents);
    if (rows.joinProbes.length) await put(joinProbes, rows.joinProbes);
    if (rows.emailChallenges.length) await put(emailChallenges, rows.emailChallenges);
    if (rows.messages.length) await put(messages, rows.messages);
    if (rows.resolveEvents.length) await put(resolveEvents, rows.resolveEvents);
  });
}

export async function importStateToPostgres(s: State) {
  await writePostgres(s, null);
}
