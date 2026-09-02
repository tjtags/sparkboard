import { formatPct } from "./format";
import { prices } from "./lmsr";
import type { Market } from "./types";

export function ogPct(market: Market) {
  const px = prices(market.q, market.b, market.pi);
  const ranked = market.outcomes
    .map((o, i) => ({ outcome: o, p: px[i] ?? 0, i }))
    .sort((a, b) => b.p - a.p);
  const leader = ranked[0];
  const second = ranked[1];
  return {
    leader: {
      name: leader?.outcome.name ?? "",
      big: formatPct(leader?.p ?? 0, 0),
      small: formatPct(leader?.p ?? 0, 1),
      p: leader?.p ?? 0,
    },
    second: second
      ? {
          name: second.outcome.name,
          big: formatPct(second.p, 0),
          small: formatPct(second.p, 1),
          p: second.p,
        }
      : null,
  };
}
