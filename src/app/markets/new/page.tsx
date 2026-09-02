import { Kicker } from "@/components/Bits";
import { Shell } from "@/components/Shell";
import { loadState } from "@/lib/store";
import { readPlayerId } from "@/lib/session";
import { currentUser } from "@/lib/views";

export const dynamic = "force-dynamic";

export default async function NewMarketPage() {
  const s = await loadState();
  const me = currentUser(s, await readPlayerId());
  const leagues = s.leagues.filter((l) =>
    s.memberships.some((m) => m.userId === me.id && m.leagueId === l.id),
  );

  return (
    <Shell here="/markets">
      <Kicker>Market builder</Kicker>
      <h1 className="display mt-2 text-4xl">Write a question the book can score</h1>
      <p className="mt-2 max-w-xl text-muted">
        Binary by default. Liquidity <em>b</em> bounds the maker&apos;s loss at b ln n. Start
        everyone at a prior that already looks like a probability.
      </p>
      <form action="/api/markets" method="post" className="mt-8 max-w-xl space-y-4">
        <Field label="League">
          <select name="leagueId" className="field">
            {leagues.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Question">
          <input name="question" required minLength={8} className="field" placeholder="Will … ?" />
        </Field>
        <Field label="Why it matters">
          <textarea name="description" rows={3} className="field" />
        </Field>
        <Field label="Resolution rule">
          <textarea
            name="resolutionCriteria"
            rows={2}
            className="field"
            placeholder="Resolves from AP / official source on …"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Yes label">
            <input name="yes" defaultValue="Yes" className="field" />
          </Field>
          <Field label="No label">
            <input name="no" defaultValue="No" className="field" />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Yes prior %">
            <input name="priorYes" type="number" defaultValue={50} min={1} max={99} className="field" />
          </Field>
          <Field label="Liquidity b">
            <input name="b" type="number" defaultValue={40000} min={5000} max={400000} className="field" />
          </Field>
          <Field label="Closes">
            <input name="closesAt" type="date" defaultValue="2026-11-03" className="field" />
          </Field>
        </div>
        <Field label="Category">
          <select name="category" className="field">
            {["politics", "macro", "sports", "culture", "science", "meta"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" name="callSheet" /> Pin to the politics call sheet
        </label>
        <button className="rounded-md bg-spark px-4 py-2 text-sm font-medium text-ink">
          List the market
        </button>
      </form>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[12px] uppercase tracking-wide text-muted">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
