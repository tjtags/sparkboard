export function formatSparks(n: number, digits = 1): string {
  const sign = n < 0 ? "−" : "";
  const v = Math.abs(n);
  if (v >= 1_000_000) return `${sign}${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 10_000) return `${sign}${(v / 1_000).toFixed(digits)}k`;
  if (v >= 1_000) return `${sign}${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (v >= 100) return `${sign}${v.toFixed(0)}`;
  if (v >= 10) return `${sign}${v.toFixed(1)}`;
  return `${sign}${v.toFixed(2)}`;
}

export function formatPct(p: number, digits = 1): string {
  return `${(p * 100).toFixed(digits)}%`;
}

export function formatCents(p: number): string {
  return `${Math.round(p * 100)}¢`;
}

export function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function relative(iso: string): string {
  const t = Date.now() - new Date(iso).getTime();
  const m = Math.round(t / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
