# Sparkboard issues

Repo: https://github.com/tjtags/sparkboard/issues

Human-in-the-loop connections go **one at a time**. Code for Sentry and Postgres lands dark (no-op without secrets).

## Connection queue

1. **Sentry DSN** — issue [#6](https://github.com/tjtags/sparkboard/issues/6)
2. **DATABASE_URL** (Neon / Vercel Postgres) — [#7](https://github.com/tjtags/sparkboard/issues/7)
3. **Resend** — [#3](https://github.com/tjtags/sparkboard/issues/3)
4. **Admin email / oracle** — [#4](https://github.com/tjtags/sparkboard/issues/4)
5. **GitHub OAuth** — [#5](https://github.com/tjtags/sparkboard/issues/5)
6. **XAI_API_KEY** for Grok packs — [#16](https://github.com/tjtags/sparkboard/issues/16)

## Launch / ops

| # | Item |
| --- | --- |
| [1](https://github.com/tjtags/sparkboard/issues/1) | Production smoke: stranger `/join/SUNDAY` |
| [2](https://github.com/tjtags/sparkboard/issues/2) | Health: store postgres/blob, switcher false, auth true |
| [3](https://github.com/tjtags/sparkboard/issues/3) | Resend magic link actually mails |
| [4](https://github.com/tjtags/sparkboard/issues/4) | Oracle can resolve Public Square in prod |
| [5](https://github.com/tjtags/sparkboard/issues/5) | GitHub OAuth on production |

## Infra (this drop)

| # | Item |
| --- | --- |
| [6](https://github.com/tjtags/sparkboard/issues/6) | Sentry for Next.js 16 |
| [7](https://github.com/tjtags/sparkboard/issues/7) | Postgres as source of truth |
| [8](https://github.com/tjtags/sparkboard/issues/8) | Import Blob/file into Postgres |

## Weekly card

| # | Item |
| --- | --- |
| [9](https://github.com/tjtags/sparkboard/issues/9) | Missed-week auto-miss |
| [10](https://github.com/tjtags/sparkboard/issues/10) | Freeze pLock at slate lock |
| [11](https://github.com/tjtags/sparkboard/issues/11) | US Sunday lock timezone |
| [12](https://github.com/tjtags/sparkboard/issues/12) | Email on resolve / challenge / lock |
| [13](https://github.com/tjtags/sparkboard/issues/13) | OG card for `/week` |
| [14](https://github.com/tjtags/sparkboard/issues/14) | Invite rotate and kick |

## Coverage

| # | Item |
| --- | --- |
| [15](https://github.com/tjtags/sparkboard/issues/15) | Fed / CPI / GDP print pack |
| [16](https://github.com/tjtags/sparkboard/issues/16) | Grok propose-pack from venue tape |
| [17](https://github.com/tjtags/sparkboard/issues/17) | Nested sports books (spread / total) |
| [18](https://github.com/tjtags/sparkboard/issues/18) | NBA / MLB this-week surface |

## Product / later

| # | Item |
| --- | --- |
| [19](https://github.com/tjtags/sparkboard/issues/19) | Guest can link GitHub later |
| [20](https://github.com/tjtags/sparkboard/issues/20) | Forecasts API rate limit / key |
| [21](https://github.com/tjtags/sparkboard/issues/21) | PWA last |
| [22](https://github.com/tjtags/sparkboard/issues/22) | Stripe org desk (first dollar) |
| [23](https://github.com/tjtags/sparkboard/issues/23) | Do not build (CLOB, parlays, cash-out, venue routing) |
