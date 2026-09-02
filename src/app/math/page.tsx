import { Kicker } from "@/components/Bits";
import { Shell } from "@/components/Shell";
import { maxLoss } from "@/lib/lmsr";
import { Playground } from "./playground";

export const dynamic = "force-dynamic";

export default function MathPage() {

  return (
    <Shell here="/math">
      <Kicker>Hanson 2003 · LMSR</Kicker>
      <h1 className="display mt-2 text-4xl">The maker</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Sparkboard uses Robin Hanson&apos;s logarithmic market scoring rule. Prices are
        always a probability distribution. The operator&apos;s worst day is known up front:{" "}
        <span className="text-paper">b ln n</span>. For a binary book with b = 80,000 that
        is ✦{maxLoss(80_000, 2).toFixed(0)}.
      </p>
      <pre className="mt-6 overflow-x-auto rounded-lg bg-ink-2 p-4 text-[13px] leading-relaxed text-spark">
{`C(q) = b · log( Σ  π_i exp(q_i / b) )
p_i  = π_i exp(q_i / b) / Σ π_j exp(q_j / b)
cost to buy Δ of i  = C(q + Δ e_i) − C(q)
complete set (one of each) always costs 1`}
      </pre>
      <ul className="mt-6 max-w-2xl list-disc space-y-2 pl-5 text-sm text-muted">
        <li>
          <span className="text-paper">Why LMSR, not Uniswap.</span> CPMM can be drained on
          a known-false outcome. LMSR&apos;s loss is bounded. Prices stay in (0,1) and sum
          to 1, so they read as probabilities.
        </li>
        <li>
          <span className="text-paper">Why not Maniswap.</span> Manifold&apos;s CPMM variant
          is great when users inject liquidity. We are a subsidized play-money square —
          Hanson&apos;s b is the whole subsidy, and that is a feature.
        </li>
        <li>
          <span className="text-paper">Sizing b.</span> Near 50/50, a 1% move costs about
          0.25 · Δq with Δq ≈ 0.04 b. Default global b = 80k so a few thousand Sparks
          barely wiggle the fly; pushing to 99¢ costs ~3.91 b.
        </li>
      </ul>
      <Playground />
    </Shell>
  );
}
