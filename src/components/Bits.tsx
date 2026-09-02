import { formatCents, formatPct, formatSparks } from "@/lib/format";
import type { IntegrityReport } from "@/lib/types";

export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-copper">
      {children}
    </div>
  );
}

export function IntegrityChip({ report }: { report: IntegrityReport }) {
  if (report.boardEligible) {
    return (
      <span className="rounded-full bg-yes/15 px-2 py-0.5 text-[11px] uppercase tracking-wide text-yes">
        Board-eligible · {report.uniqueTraders} desks
      </span>
    );
  }
  return (
    <span className="rounded-full bg-warn/15 px-2 py-0.5 text-[11px] uppercase tracking-wide text-warn">
      Thin · {report.uniqueTraders}/{report.minUniqueTraders} desks
    </span>
  );
}

export function Prob({ p, accent = "yes" }: { p: number; accent?: "yes" | "no" | "spark" }) {
  const color =
    accent === "no" ? "text-no" : accent === "spark" ? "text-spark" : "text-yes";
  return (
    <span className={`tabular font-medium ${color}`}>
      {formatPct(p)} <span className="text-muted">({formatCents(p)})</span>
    </span>
  );
}

export function SparkAmt({ n, signed = false }: { n: number; signed?: boolean }) {
  const pos = n > 0.5;
  const neg = n < -0.5;
  return (
    <span
      className={`tabular ${
        signed ? (pos ? "text-yes" : neg ? "text-no" : "text-paper") : "text-paper"
      }`}
    >
      {signed && pos ? "+" : ""}✦{formatSparks(n)}
    </span>
  );
}

export function Bar({ p }: { p: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-3">
      <div className="h-full bg-spark" style={{ width: `${Math.max(2, Math.min(100, p * 100))}%` }} />
    </div>
  );
}
