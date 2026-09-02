# Connections (human / Cursor)

Do these in Vercel env or `.env.local`. **Do not commit secrets.** Sparkboard runs without them (`SPARKBOARD_STORE=file`).

Order: one at a time.

## 1. Sentry — [#6](https://github.com/tjtags/sparkboard/issues/6)

Already instrumented. Dark until set.

```
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

Create a Next.js project at sentry.io. Same DSN for the two DSN vars is fine.

## 2. Postgres — [#7](https://github.com/tjtags/sparkboard/issues/7) [#8](https://github.com/tjtags/sparkboard/issues/8)

Neon or Vercel Postgres.

```
DATABASE_URL=postgres://...
SPARKBOARD_STORE=postgres
```

Then:

```
npm run db:push
npm run db:import
```

Local default stays `SPARKBOARD_STORE=file`. Do not point local at prod.

## 3. Auth secret (required for a real account)

```
AUTH_SECRET=
```

`openssl rand -base64 32`

## 4. Resend magic link — [#3](https://github.com/tjtags/sparkboard/issues/3)

```
RESEND_API_KEY=
RESEND_FROM=Sparkboard <you@yourdomain>
NEXT_PUBLIC_APP_URL=https://sparkboard-zeta.vercel.app
```

Without this, `/signin` prints the confirm URL.

## 5. Oracle / admin — [#4](https://github.com/tjtags/sparkboard/issues/4)

```
SPARKBOARD_ADMIN_EMAIL=you@...
SPARKBOARD_ADMIN_SECRET=
```

Public Square resolve. Header `x-sparkboard-admin` for the secret.

## 6. GitHub OAuth — [#5](https://github.com/tjtags/sparkboard/issues/5)

Callback `https://sparkboard-zeta.vercel.app/api/auth/callback/github` (and a second app for localhost).

```
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
```

## 7. Grok drafts — [#16](https://github.com/tjtags/sparkboard/issues/16)

```
XAI_API_KEY=
```

Model `grok-4.6` at `https://api.x.ai/v1`. Call sheet RUN.

## 8. Blob (only if not using Postgres on Vercel)

```
BLOB_READ_WRITE_TOKEN=
BLOB_STORE_ID=
```

## Check

`GET /api/health` should grow `sentry`, `db`, `resend`, `admin`, `github` to true as you add keys. Production must not show `store: "file"` or `switcher: true`.
