import Link from "next/link";
import { Kicker } from "@/components/Bits";
import { Shell } from "@/components/Shell";
import { SUNDAY_INVITE } from "@/lib/constants";
import { formatPct, formatSparks } from "@/lib/format";
import { actorId } from "@/lib/http";
import { loadState } from "@/lib/store";
import { currentUser, marketVolume, priceMarket, thisWeekSlate } from "@/lib/views";

export const dynamic = "force-dynamic";

const DESK = [
  ["mkt_house", "House 2026"],
  ["mkt_senate", "Senate 2026"],
  ["mkt_collins", "Maine Senate"],
  ["mkt_texas", "Texas Senate"],
  ["mkt_fed", "Fed funds 2026"],
  ["mkt_sb-lxi-mvp", "Super Bowl LXI MVP"],
] as const;

export default async function PlayPage() {
  const s = await loadState();
  const me = currentUser(s, (await actorId()) ?? undefined);
  const cash = me
    ? (s.memberships.find((m) => m.userId === me.id && m.leagueId === "league_public")?.cash ?? 0)
    : 0;
  const { week, games } = thisWeekSlate(s);
  const books = DESK.map(([id, label]) => {
    const raw = s.markets.find((m) => m.id === id);
    if (!raw) return null;
    const m = priceMarket(s, raw);
    return { label, m, vol: marketVolume(s, id) };
  }).filter((x) => x !== null);

  return (
    <Shell here="/play">
      <Kicker>PLAY // EMPTY BOOKS</Kicker>
      <h1 className="mt-2 text-3xl tracking-tight">Your ticket is the first print</h1>
      <p className="mt-2 max-w-2xl text-[13px] text-muted">
        No seeded tape. Priors are 50/50 (Super Bowl is uniform). Buy or sell and the LMSR
        price, volume, your cash, and depth all move. Thin until five desks print — the book
        still trades.
      </p>

      {!me && (
        <p className="mt-6 border border-spark/40 bg-ink-2 p-4 text-[13px]">
          Make a desk first. Guest is enough.{" "}
          <Link href={`/join/${SUNDAY_INVITE}`} className="text-spark">
            /join/{SUNDAY_INVITE}
          </Link>{" "}
          puts you in Public Square and the Sunday card.
        </p>
      )}
      {me && (
        <p className="mt-6 text-[13px]">
          Desk @{me.handle} · Public Square cash{" "}
          <span className="tabular text-spark">✦{formatSparks(cash)}</span>
        </p>
      )}

      <section className="mt-10">
        <Kicker>BID THESE</Kicker>
        <ul className="mt-3 divide-y divide-line text-[13px]">
          {books.map(({ label, m, vol }) => (
            <li key={m.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
              <Link href={`/markets/${m.id}`} className="hover:text-spark">
                {label}
                <span className="mt-0.5 block text-[11px] text-muted">{m.question}</span>
              </Link>
              <span className="tabular text-[12px] text-muted">
                {formatPct(m.prices[0] ?? 0, 1)} · vol ✦{Math.round(vol).toLocaleString()} ·{" "}
                {m.integrity.uniqueTraders} desks
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <Kicker>NFL WEEK {week} MONEYLINES</Kicker>
        <ul className="mt-3 divide-y divide-line text-[13px]">
          {games.slice(0, 16).map((g) => (
            <li key={g.id} className="flex justify-between gap-3 py-2">
              <Link href={`/markets/${g.id}`} className="hover:text-spark">
                {g.question}
              </Link>
              <span className="tabular text-spark">{formatPct(g.prices[0] ?? 0, 0)}</span>
            </li>
          ))}
        </ul>
        <Link href="/week" className="mt-4 inline-block text-[11px] tracking-widest text-spark">
          SUNDAY CARD →
        </Link>
      </section>
    </Shell>
  );
}
