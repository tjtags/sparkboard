import { PUBLIC_LEAGUE_ID } from "./constants";
import { prices } from "./lmsr";
import { isCatalogSport } from "./views";
import { integrityOf } from "./engine";
import type { State } from "./types";

export type ForecastRow = {
  id: string;
  question: string;
  category: string;
  status: string;
  closesAt: string;
  resolvedAt?: string;
  resolvedOutcome?: string;
  b: number;
  uniqueTraders: number;
  boardEligible: boolean;
  outcomes: { id: string; name: string; p: number }[];
  permalink: string;
};

export function publicForecasts(s: State, origin: string): ForecastRow[] {
  const rows: ForecastRow[] = [];
  for (const m of s.markets) {
    if (m.leagueId !== PUBLIC_LEAGUE_ID) continue;
    if (m.category === "meta") continue;
    if (isCatalogSport(m)) continue;
    const report = m.status === "resolved" ? null : integrityOf(s, m.id);
    const eligible = m.status === "resolved" ? Boolean(m.boardEligibleAtResolve) : Boolean(report?.boardEligible);
    if (!eligible) continue;
    const px = prices(m.q, m.b, m.pi);
    rows.push({
      id: m.id,
      question: m.question,
      category: m.category,
      status: m.status,
      closesAt: m.closesAt,
      resolvedAt: m.resolvedAt,
      resolvedOutcome: m.outcomes.find((o) => o.id === m.resolvedOutcomeId)?.name,
      b: m.b,
      uniqueTraders: report?.uniqueTraders ?? 0,
      boardEligible: eligible,
      outcomes: m.outcomes.map((o, i) => ({ id: o.id, name: o.name, p: px[i] ?? 0 })),
      permalink: `${origin}/markets/${m.id}`,
    });
  }
  return rows.sort((a, b) => a.closesAt.localeCompare(b.closesAt));
}

export function forecastsCsv(rows: ForecastRow[]) {
  const header = "id,question,category,status,outcome,p,closesAt,permalink";
  const lines = [header];
  for (const r of rows) {
    for (const o of r.outcomes) {
      const q = r.question.replaceAll('"', '""');
      lines.push(
        `${r.id},"${q}",${r.category},${r.status},${o.name},${o.p.toFixed(4)},${r.closesAt},${r.permalink}`,
      );
    }
  }
  return lines.join("\n") + "\n";
}
