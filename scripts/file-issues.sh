#!/bin/zsh
set -euo pipefail
cd "$(dirname "$0")/.."

for spec in \
  "launch:#7CFFCB:Blocks telling a stranger to play" \
  "ops:#5EEAD4:Env, Vercel, human-in-the-loop secrets" \
  "infra:#E879F9:Sentry, Postgres, health" \
  "weekly:#F5D76E:Sunday card loop" \
  "coverage:#6B7C8F:Packs and wire" \
  "product:#C8D4E0:UX, OG, commissioner" \
  "money:#FF5C7A:Org desks later" \
  "wontfix:#1C2A3A:Do not build"; do
  name="${spec%%:*}"
  rest="${spec#*:}"
  color="${rest%%:*}"
  desc="${rest#*:}"
  gh label create "$name" --color "${color#\#}" --description "$desc" --force >/dev/null
done

create() {
  local title="$1" labels="$2"
  shift 2
  gh issue create --title "$title" --label "$labels" --body "$*"
}

create "A1 · Production smoke: stranger can /join/SUNDAY" "launch,ops" "$(cat <<'EOF'
## Why
The game is not sendable until a cold visitor on production can join without the dev switcher.

## Do
- Open https://sparkboard-zeta.vercel.app/join/SUNDAY in a private window
- Pick a handle, land in Sunday + Public Square at ✦1,000,000
- Cannot become Mira; unsigned POST returns 401 `need_desk`
- Repeat `/join/DESK12`

## Accept
Private-window join works. `GET /api/health` has `switcher: false`.
EOF
)"

create "A2 · Production health: store postgres or blob, auth true" "launch,ops,infra" "$(cat <<'EOF'
## Why
Vercel with `store: file` is a lie. Health is the go/no-go.

## Do
- `GET https://sparkboard-zeta.vercel.app/api/health`
- Expect `ok`, `auth: true`, `switcher: false`
- `store` is `postgres` (preferred) or `blob`
- Report `sentry`, `db`, `resend`, `admin`

## Accept
Health matches the matrix in README. Fail the deploy if `store` is `file` on Vercel.
EOF
)"

create "A3 · Resend: magic link actually mails" "launch,ops" "$(cat <<'EOF'
## Human loop
Set on Vercel production: `RESEND_API_KEY`, `RESEND_FROM`, `NEXT_PUBLIC_APP_URL`.

## Do
- `/signin` sends mail instead of printing the URL
- Confirm link mints the desk
- Copy still says play-money, no cash-out

## Accept
One real inbox receives the confirm. Health `resend: true`.
EOF
)"

create "A4 · Oracle desk can resolve Public Square in prod" "launch,ops" "$(cat <<'EOF'
## Human loop
Set `SPARKBOARD_ADMIN_EMAIL` to the founder GitHub/email desk, and/or `SPARKBOARD_ADMIN_SECRET` for `x-sparkboard-admin`.

## Do
- Logged-in admin can propose resolve on Public Square
- 24h challenge still applies
- Friend-league creators still settle their own books
- Seed `user_desk` stays un-loginable

## Accept
A real human can settle House without the dev switcher.
EOF
)"

create "A5 · GitHub OAuth on production" "launch,ops" "$(cat <<'EOF'
## Human loop
Create a GitHub OAuth app. Callback `https://sparkboard-zeta.vercel.app/api/auth/callback/github`. Set `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`. Separate app for localhost.

## Accept
Sign in with GitHub creates or maps a desk. Guest can exist without it.
EOF
)"

create "B1 · Sentry for Next.js 16" "infra,ops" "$(cat <<'EOF'
## Human loop (connection 1)
1. Create a Sentry project (Next.js).
2. Paste DSN. Set `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` on Vercel and locally.
3. Optional source maps: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.

## Do
- `@sentry/nextjs` via `instrumentation.ts` + client + `global-error.tsx`
- No-op when DSN is missing (local file store still works)
- Capture engine failures, Blob/Postgres CAS exhaustion, venue pull errors

## Accept
Throw a test error, see it in Sentry. Health `sentry: true` when DSN set.
EOF
)"

create "B2 · Postgres as source of truth" "infra,ops" "$(cat <<'EOF'
## Human loop (connection 2)
Create a Neon / Vercel Postgres database. Set `DATABASE_URL`. Local stays `SPARKBOARD_STORE=file`.

## Do
- Drizzle schema matching `src/lib/types.ts`
- `storeKind()` includes `postgres`
- `loadState` / `mutate` transactional with version CAS
- Import existing file/blob JSON once (`npm run db:import`)
- Vercel may use postgres instead of Blob
- Engine, LMSR, integrity do not change

## Accept
Round-trip seed through Postgres. Trades persist across deploys. File store still default locally.
EOF
)"

create "B3 · Import Blob/file state into Postgres" "infra" "$(cat <<'EOF'
Depends on B2.

## Do
- `npm run db:import` reads file or Blob and writes tables
- Idempotent on user/market ids
- Do not double-credit memberships

## Accept
Prod data survives the cutover. Public Square books still priced.
EOF
)"

create "C1 · Missed-week auto-miss on Sunday desks" "weekly" "$(cat <<'EOF'
## Why
If you skip a week the board just looks empty. The game needs a ghost.

## Do
- After lock, members of `sportSeason` leagues with no pick for that week get `miss` / edge 0 or a documented sit
- Show streak / missed count on `/week` and league board
- Do not move Sparks

## Accept
A Sunday member who never locks week 1 shows as sitting that week once the slate locks.
EOF
)"

create "C2 · Freeze pLock at slate lock, not last upsert" "weekly" "$(cat <<'EOF'
## Why
Today pLock is the LMSR price at last confirm. A Sunday cron (or lazy freeze at kickoff) should stamp the lock print.

## Do
- Vercel cron or lazy freeze when `now >= min(week.locksAt, market.closesAt)` without requiring a later upsert
- Document on the card: locked at {pLock} at {frozenAt}

## Accept
Confirm Monday, ignore the book, still freeze at lock time.
EOF
)"

create "C3 · US Sunday lock timezone" "weekly" "$(cat <<'EOF'
ISO Monday–Sunday UTC is late afternoon PT. First real league will complain.

## Do
- Print lock in local time on `/week`
- Consider Sunday 00:00 America/New_York as the NFL lock
- Keep ISO key internally or migrate carefully

## Accept
A PT user sees a lock time that matches kickoff week, not Monday UTC.
EOF
)"

create "C4 · Email on resolve, challenge, and weekly lock" "weekly,ops" "$(cat <<'EOF'
Depends on A3 Resend.

## Do
- Mail desks who traded when Public Square proposes / finalizes / is challenged
- Mail Sunday members when the week opens and 3h before lock
- Play-money copy. No “you won money”

## Accept
One real resolve sends mail. Health still `resend: true`.
EOF
)"

create "C5 · OG card for /week" "weekly,product" "$(cat <<'EOF'
## Do
- ImageResponse for `/week` (week number, top game, Sunday invite)
- iMessage/X preview is the slate, not the generic HUD

## Accept
`/week/opengraph-image` renders week + invite.
EOF
)"

create "C6 · Invite rotate and kick" "weekly,product" "$(cat <<'EOF'
v1 answer is make a new league. That will not last.

## Do
- Commissioner `POST /api/leagues/:id/rotate-invite`
- Kick a desk (membership removed; positions stay for integrity history or void — pick one and test)
- Do not transfer Sparks out

## Accept
SUNDAY code can rotate. Kicked user cannot lock next week.
EOF
)"

create "D1 · Fed / CPI / GDP print pack" "coverage" "$(cat <<'EOF'
## Do
- One LMSR book per upcoming FOMC / CPI / GDP print
- Prior from `/api/wire/venues` when a matching Kalshi/Poly yes exists
- List on call sheet, not 83k venue rows

## Accept
At least the next Fed meeting is a Public Square book with a venue prior.
EOF
)"

create "D2 · Grok propose-pack from venue tape (human lists)" "coverage" "$(cat <<'EOF'
## Human loop
`XAI_API_KEY` on Vercel.

## Do
- Call-sheet action: pull venues, Grok proposes 4 questions, human clicks LIST
- Never bulk-import parlays (`KXMVE*`)
- Model `grok-4.6` at `https://api.x.ai/v1`

## Accept
With key set, RUN on `/call-sheet` shows 4 listable questions from live tape.
EOF
)"

create "D3 · Nested sports books (spread / total) as extra LMSR" "coverage" "$(cat <<'EOF'
Not a sportsbook. Play-money only. Friend-league card pool stays moneyline-first.

## Do
- Optional extra books per game: spread, total
- Separate market ids, same ESPN game tag
- Do not add parlays

## Accept
One NFL week-1 game has a moneyline and a total, both LMSR.
EOF
)"

create "D4 · NBA / MLB this-week surface" "coverage,weekly" "$(cat <<'EOF'
`/week` is NFL-first. Season desks already accept nba/mlb.

## Do
- `/week?league=nba|mlb` uses ISO-week window already in `inSportWeek`
- Home rail stays NFL during football season

## Accept
An NBA Sunday desk can lock from `/week?league=nba`.
EOF
)"

create "E1 · Guest can link GitHub later" "product,launch" "$(cat <<'EOF'
## Do
- Guest JWT `guestId`; GitHub callback attaches if `githubId` free
- If taken, keep guest session, banner `?github=taken`
- No bankroll merge

## Accept
Guest then GitHub on an unused account maps. Collision refuses.
EOF
)"

create "E2 · Forecasts API rate limit / key" "product,infra" "$(cat <<'EOF'
`GET /api/public/forecasts` is open CORS. Fine for journalists, not for a scrape farm.

## Do
- 60s cache (already on wire)
- Optional `X-Sparkboard-Key` for CSV dumps
- Attribution in `/legal` already; enforce a polite 429

## Accept
Unkeyed burst 429s. Keyed CSV works.
EOF
)"

create "E3 · PWA last" "product" "$(cat <<'EOF'
After the game is sendable. Manifest + install prompt. No native app.
EOF
)"

create "F1 · Stripe org desk (first dollar)" "money" "$(cat <<'EOF'
Later. Private league as software-for-a-game, not wagering. SSO after that. Do not rake Sparks.
EOF
)"

create "Z1 · Do not build" "wontfix" "$(cat <<'EOF'
- CLOB / Uniswap / Maniswap
- Parlays
- Cash-out, shop, redeemable points, rake
- Routing orders to Kalshi or Polymarket
- Survivor-elimination as the default card
- Auto-copy venue settlement onto Sparkboard books
EOF
)"
echo "done"
