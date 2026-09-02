import Link from "next/link";
import { Kicker } from "@/components/Bits";
import { Shell } from "@/components/Shell";
import { catalogCounts, INVENTED, loadCatalog, marketIdFor } from "@/lib/sports";
import type { SportGame } from "@/lib/sports";

export const dynamic = "force-dynamic";

const LEAGUES = ["nfl", "nba", "mlb", "awards"] as const;

export default function SportsPage({
  searchParams,
}: {
  searchParams: Promise<{ league?: string; week?: string; month?: string }>;
}) {
  return <Body searchParams={searchParams} />;
}

function monthKey(iso: string) {
  return iso.slice(0, 7);
}

async function Body({
  searchParams,
}: {
  searchParams: Promise<{ league?: string; week?: string; month?: string }>;
}) {
  const sp = await searchParams;
  const tab = (sp.league ?? "nfl") as (typeof LEAGUES)[number];
  const week = sp.week ? Number(sp.week) : undefined;
  const month = sp.month;
  const cat = loadCatalog();
  const counts = catalogCounts();

  let games: SportGame[] = [];
  if (tab === "awards") {
    const extras = cat.extras ?? [];
    const seen = new Set<string>();
    games = [...extras, ...INVENTED].filter((g) => {
      if (seen.has(g.id)) return false;
      seen.add(g.id);
      return Boolean(g.kind);
    });
  } else {
    games = cat[tab] ?? [];
    if (tab === "nfl" && week) games = games.filter((g) => g.week === week);
    if ((tab === "nba" || tab === "mlb") && month) {
      games = games.filter((g) => monthKey(g.startsAt) === month);
    }
  }

  const months = Array.from(new Set(games.map((g) => monthKey(g.startsAt)))).sort();

  return (
    <Shell here="/sports">
      <Kicker>SPORTS // PLAY-MONEY</Kicker>
      <h1 className="mt-2 text-3xl tracking-tight">Season book</h1>
      <p className="mt-2 max-w-2xl text-[13px] text-muted">
        NFL, NBA, and MLB schedules from the ESPN public scoreboard, plus invented award and news
        books. Each row is an LMSR moneyline you can enter. Sparks never leave the league. This is
        not a sportsbook.
      </p>
      <p className="mt-2 text-[12px] text-muted">
        {counts.nfl} NFL · {counts.nba} NBA · {counts.mlb} MLB · {counts.invented} awards/news ·{" "}
        {counts.total} listed
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-[11px] tracking-widest">
        {LEAGUES.map((l) => (
          <Link
            key={l}
            href={`/sports?league=${l}`}
            className={`border px-2 py-1 ${tab === l ? "border-spark text-spark" : "border-line text-muted"}`}
          >
            {l.toUpperCase()}
            {l === "nfl" ? ` · ${counts.nfl}` : ""}
            {l === "nba" ? ` · ${counts.nba}` : ""}
            {l === "mlb" ? ` · ${counts.mlb}` : ""}
            {l === "awards" ? ` · ${counts.invented}` : ""}
          </Link>
        ))}
        <Link href="/leagues" className="border border-mag px-2 py-1 text-mag">
          WEEKLY DESK
        </Link>
        <Link href="/learn" className="border border-line px-2 py-1 text-muted">
          LEARN
        </Link>
      </div>
      {tab === "nfl" && (
        <div className="mt-3 flex flex-wrap gap-1 text-[10px]">
          {Array.from({ length: 22 }, (_, i) => i + 1).map((w) => (
            <Link
              key={w}
              href={`/sports?league=nfl&week=${w}`}
              className={`px-1.5 py-0.5 border ${week === w ? "border-spark text-spark" : "border-line text-muted"}`}
            >
              W{w}
            </Link>
          ))}
        </div>
      )}
      {(tab === "nba" || tab === "mlb") && months.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-1 text-[10px]">
          {months.map((m) => (
            <Link
              key={m}
              href={`/sports?league=${tab}&month=${m}`}
              className={`px-1.5 py-0.5 border ${month === m ? "border-spark text-spark" : "border-line text-muted"}`}
            >
              {m}
            </Link>
          ))}
        </div>
      )}

      <ul className="mt-6 divide-y divide-line text-[13px]">
        {games.map((g) => (
          <li key={g.id} className="flex items-center justify-between gap-3 py-2">
            <Link href={`/markets/${marketIdFor(g)}`} className="hover:text-spark">
              {g.week != null ? `W${g.week} · ` : ""}
              {g.question || (g.away && g.home ? `${g.away} @ ${g.home}` : g.name)}
            </Link>
            <span className="shrink-0 tabular text-[11px] text-muted">
              {g.startsAt.slice(0, 16).replace("T", " ")}Z
            </span>
          </li>
        ))}
      </ul>
      {games.length === 0 && (
        <p className="mt-6 text-muted">Catalog empty — run `npm run sports`.</p>
      )}
    </Shell>
  );
}
