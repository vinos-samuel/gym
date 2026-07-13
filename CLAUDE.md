@AGENTS.md

# GYM — project context

Personal single-user fitness tracking PWA for Vinos. Source of truth for scope, decisions, and constraints: [PRD.md](PRD.md) — read it before making structural changes.

## Stack
- Next.js 16 (App Router, Turbopack), TypeScript, Tailwind v4
- Neon Postgres (serverless), accessed server-side only via `pg` (`src/lib/db.ts`)
- Auth: single passphrase (`AUTH_PASSPHRASE` env var) gating a signed httpOnly session cookie (`src/lib/session.ts`, `src/proxy.ts`). No user accounts, no RLS — genuinely single-tenant.
- Hosting: Vercel (auto-deploy on push to `main`)

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build (also the pre-deploy check)
- `npm run lint` — eslint
- `npm run migrate` — applies `db/migrations/*.sql` in order against `DATABASE_URL` (reads `.env.local`)

## Structure
- `db/migrations/` — schema + seed SQL, applied via `npm run migrate`
- `src/lib/db.ts` — Postgres pool
- `src/lib/queries.ts` — all data access (rotation logic, sets, workouts)
- `src/lib/session.ts`, `src/lib/auth.ts`, `src/proxy.ts` — auth
- `src/components/WorkoutSession.tsx` — the core logging loop (Today screen client logic)
- `src/lib/offlineQueue.ts` — localStorage retry queue for set writes made while offline
- `public/exercises/*.svg` — hand-drawn exercise illustrations (no external licensing dependency)

## Current Sprint
Building M1 (auth + PWA shell) and M2 (core logging loop) per PRD §6. Code for both is written; blocked on Vinos creating a Neon project and providing `DATABASE_URL` (see PRD — Neon has no MCP integration, this step is manual). Once unblocked: run migrations, deploy to Vercel, verify end-to-end on a real gym session before M3/M4 (program editor, analytics) begin.

## Don't
- Don't build the program editor, analytics/progress screens, or nutrition entry yet — gated on 2-3 real gym sessions with the M2 logging loop first (PRD §6).
- Don't add RLS or a user table — single-tenant by design, see PRD §4.
