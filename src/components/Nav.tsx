import Link from "next/link";
import { Wordmark } from "./Logo";
import { HudClock } from "./HudClock";

const LINKS = [
  ["/", "FLY"],
  ["/week", "WEEK"],
  ["/call-sheet", "SHEET"],
  ["/sports", "SPORT"],
  ["/leagues", "DESKS"],
  ["/learn", "LEARN"],
] as const;

export function Nav({ here }: { here: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-void/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-3 py-2">
        <Link href="/" className="shrink-0">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-4 text-[11px] tracking-[0.18em] text-muted md:flex">
          {LINKS.map(([href, label]) => {
            const on = href === "/" ? here === "/" : here.startsWith(href);
            return (
              <Link key={href} href={href} className={on ? "text-spark glow" : "hover:text-paper"}>
                {on ? `▸ ${label}` : label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 text-[11px] tracking-widest text-muted">
          <span className="hidden text-yes sm:inline">SYS.OK</span>
          <HudClock />
          <Link href="/markets/new" className="border border-spark px-2 py-1 text-spark hover:bg-spark hover:text-void">
            [+] BOOK
          </Link>
        </div>
      </div>
    </header>
  );
}
