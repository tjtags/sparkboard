/** One-shot: file JSON → Postgres. Requires DATABASE_URL. Local SPARKBOARD_STORE can stay file. */
import fs from "node:fs";
import path from "node:path";
import { importStateToPostgres } from "../src/lib/db/persist.ts";
import { migrate } from "../src/lib/migrate.ts";
import { buildSeed } from "../src/lib/seed.ts";
import { ensureSportsMarkets } from "../src/lib/sports.ts";
import type { State } from "../src/lib/types.ts";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const file = path.join(process.cwd(), "data", "sparkboard.json");
let state: State;
if (fs.existsSync(file)) {
  state = ensureSportsMarkets(migrate(JSON.parse(fs.readFileSync(file, "utf8")) as State));
  console.log("importing", file);
} else {
  state = ensureSportsMarkets(buildSeed());
  console.log("importing seed");
}
await importStateToPostgres(state);
console.log("postgres has", state.users.length, "users", state.markets.length, "markets");
process.exit(0);
