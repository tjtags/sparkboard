/** ESPN public scoreboard — delay between calls. No login. Merges into data/sports-catalog.json. */
import fs from "node:fs";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  const res = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function gamesFromScoreboard(data, league, week) {
  const out = [];
  for (const e of data.events ?? []) {
    const comp = (e.competitions ?? [])[0] ?? {};
    const teams = (comp.competitors ?? []).map((c) => ({
      name: c.team?.displayName,
      abbr: c.team?.abbreviation,
      home: c.homeAway === "home",
    }));
    const home = teams.find((t) => t.home) ?? teams[0];
    const away = teams.find((t) => !t.home) ?? teams[1];
    if (!home?.name || !away?.name) continue;
    out.push({
      id: String(e.id),
      league,
      week: week ?? null,
      startsAt: e.date,
      home: home.name,
      homeAbbr: home.abbr,
      away: away.name,
      awayAbbr: away.abbr,
      name: e.name || `${away.name} at ${home.name}`,
    });
  }
  return out;
}

function merge(into, extra) {
  const seen = new Set(into.map((g) => g.id));
  for (const g of extra) {
    if (seen.has(g.id)) continue;
    into.push(g);
    seen.add(g.id);
  }
}

const file = "data/sports-catalog.json";
const prev = fs.existsSync(file)
  ? JSON.parse(fs.readFileSync(file, "utf8"))
  : { at: "", nfl: [], nba: [], mlb: [], extras: [] };

const nfl = [...(prev.nfl ?? [])];
const nba = [...(prev.nba ?? [])];
const mlb = [...(prev.mlb ?? [])];

const refetchNfl = process.argv.includes("--nfl");
if (refetchNfl || nfl.length < 200) {
  nfl.length = 0;
  for (let w = 1; w <= 18; w++) {
    try {
      const d = await get(
        `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${w}`,
      );
      const g = gamesFromScoreboard(d, "nfl", w);
      merge(nfl, g);
      console.log("nfl week", w, g.length);
    } catch (e) {
      console.warn("nfl week fail", w, e.message);
    }
    await sleep(350);
  }
} else {
  console.log("nfl cached", nfl.length);
}

for (let w = 1; w <= 5; w++) {
  try {
    const d = await get(
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=3&week=${w}`,
    );
    const g = gamesFromScoreboard(d, "nfl", 18 + w);
    merge(nfl, g);
    if (g.length) console.log("nfl postseason", w, g.length);
  } catch (e) {
    console.warn("nfl post fail", w, e.message);
  }
  await sleep(350);
}

function ymd(d) {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function lastDate(games, fallback) {
  const times = games.map((g) => Date.parse(g.startsAt)).filter((n) => Number.isFinite(n));
  if (!times.length) return new Date(fallback);
  return new Date(Math.max(...times));
}

const nbaStart = nba.length
  ? new Date(lastDate(nba, "2026-10-21T00:00:00Z").getTime() + 86400000)
  : new Date("2026-10-21T00:00:00Z");
const nbaEnd = new Date("2027-04-16T00:00:00Z");
console.log("nba scrape", ymd(nbaStart), "→", ymd(nbaEnd), "have", nba.length);

for (let t = nbaStart.getTime(); t <= nbaEnd.getTime(); t += 86400000) {
  const day = new Date(t);
  try {
    const d = await get(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${ymd(day)}`,
    );
    const g = gamesFromScoreboard(d, "nba", null);
    merge(nba, g);
    if (g.length) console.log("nba", ymd(day), g.length);
  } catch (e) {
    console.warn("nba fail", ymd(day), e.message);
  }
  await sleep(280);
}

const mlbStart = mlb.length
  ? new Date(lastDate(mlb, "2026-09-02T00:00:00Z").getTime() + 86400000)
  : new Date("2026-09-02T00:00:00Z");
const mlbEnd = new Date("2026-11-05T00:00:00Z");
console.log("mlb scrape", ymd(mlbStart), "→", ymd(mlbEnd), "have", mlb.length);

for (let t = mlbStart.getTime(); t <= mlbEnd.getTime(); t += 86400000) {
  const day = new Date(t);
  try {
    const d = await get(
      `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${ymd(day)}`,
    );
    const g = gamesFromScoreboard(d, "mlb", null);
    merge(mlb, g);
    if (g.length) console.log("mlb", ymd(day), g.length);
  } catch (e) {
    console.warn("mlb fail", ymd(day), e.message);
  }
  await sleep(280);
}

const extras = [
  {
    id: "sb-lxi-mvp",
    league: "nfl",
    week: 22,
    startsAt: "2027-02-14T23:30:00.000Z",
    kind: "mvp",
    name: "Super Bowl LXI MVP",
    question: "Who wins Super Bowl LXI MVP?",
    outcomes: [
      "Patrick Mahomes",
      "Josh Allen",
      "Lamar Jackson",
      "Jalen Hurts",
      "Joe Burrow",
      "C.J. Stroud",
      "Justin Jefferson",
      "Ja'Marr Chase",
      "Saquon Barkley",
      "Field / other",
    ],
  },
  {
    id: "sb-lxi-champ",
    league: "nfl",
    week: 22,
    startsAt: "2027-02-14T23:30:00.000Z",
    kind: "award",
    name: "Super Bowl LXI",
    question: "Which conference wins Super Bowl LXI?",
    outcomes: ["AFC", "NFC"],
  },
];

const catalog = {
  at: new Date().toISOString(),
  nfl,
  nba,
  mlb,
  extras,
};

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync(file, JSON.stringify(catalog, null, 2));
console.log(
  "wrote",
  nfl.length,
  "nfl",
  nba.length,
  "nba",
  mlb.length,
  "mlb",
  "extras",
  extras.length,
  "total games",
  nfl.length + nba.length + mlb.length + extras.length,
);
