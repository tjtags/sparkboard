import { Kicker } from "@/components/Bits";
import { Shell } from "@/components/Shell";

export const dynamic = "force-dynamic";

export default function LegalPage() {
  return (
    <Shell here="/legal">
      <Kicker>LEGAL // GAME</Kicker>
      <h1 className="mt-2 text-3xl tracking-tight">Play-money. No prize.</h1>
      <p className="mt-3 max-w-2xl text-[13px] text-muted">
        Sparkboard is a forecasting game. Sparks (✦) are points inside a league. They are not
        money, they do not leave the league, and they cannot be cashed out, transferred, or
        redeemed. This is not a sportsbook, not a casino, and not a CFTC designated contract
        market.
      </p>

      <section className="mt-10 max-w-2xl space-y-4 text-[13px] leading-relaxed">
        <Kicker>GAME TERMS</Kicker>
        <p>
          You get ✦1,000,000 when you join a league. Ranking uses Hanson&apos;s LMSR and integrity
          gates. Thin or mirrored books stay on the fly and off the board. Weekly lock-in cards
          score points vs the price you locked; they do not move Sparks.
        </p>
        <p>
          Anyone can list a question in a league they belong to. Public Square resolves only from
          the oracle desk, then sits 24 hours for a challenge from desks that actually traded.
          We do not auto-copy Kalshi or Polymarket settlement. Friend-league creators resolve
          their own books.
        </p>
        <p>
          Do not treat Sparks as a wager. There is no house edge, no rake, no shop. If a
          jurisdiction would read this as gambling, do not play.
        </p>
      </section>

      <section className="mt-10 max-w-2xl space-y-4 text-[13px] leading-relaxed">
        <Kicker>PRIVACY</Kicker>
        <p>
          We store the handle you pick, optional GitHub login, optional email for a magic link,
          trades, positions, and messages you send on the desk. We do not sell that. Email is
          used to confirm the desk and, if you set it up, to mail resolve notices. Magic-link
          tokens die in 20 minutes.
        </p>
        <p>
          Guest desks are invite-gated. The local store is a JSON file; production is a private
          Vercel Blob document. Venue connectors read Kalshi and Polymarket <em>public</em> REST
          with no login and do not send your identity to them.
        </p>
      </section>

      <section className="mt-10 max-w-2xl space-y-4 text-[13px] leading-relaxed">
        <Kicker>FORECAST DATA</Kicker>
        <p>
          <a href="/api/public/forecasts" className="text-spark">
            GET /api/public/forecasts
          </a>{" "}
          is the board-eligible Public Square tape, JSON or{" "}
          <a href="/api/public/forecasts?format=csv" className="text-spark">
            CSV
          </a>
          . Quote it with the permalink. Attribution required. No high-frequency scrape without
          asking. Prices are play-money LMSR probabilities, not cash bids.
        </p>
      </section>

      <p className="mt-10 max-w-2xl text-[12px] text-muted">
        MIT licensed software. The game is Sparkboard. The company, if any, sells desks and
        data — not wagers. Last updated 2 Sep 2026.
      </p>
    </Shell>
  );
}
