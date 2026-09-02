import Link from "next/link";
import { Wordmark } from "./Logo";

const LINKS = [
  ["/", "Fly"],
  ["/call-sheet", "Call sheet"],
  ["/markets", "Markets"],
  ["/leagues", "Leagues"],
  ["/leaderboard", "Board"],
  ["/math", "Maker"],
  ["/integrity", "Integrity"],
] as const;

export function Nav({ here }: { here: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3">
        <Link href="/" className="shrink-0">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-5 text-[13px] text-muted md:flex">
          {LINKS.map(([href, label]) => {
            const on = href === "/" ? here === "/" : here.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={on ? "text-paper" : "hover:text-paper"}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/markets/new"
          className="rounded-full bg-spark px-3 py-1.5 text-[13px] font-medium text-ink hover:bg-paper"
        >
          Open a market
        </Link>
      </div>
    </header>
  );
}
