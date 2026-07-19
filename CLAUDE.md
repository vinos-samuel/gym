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
- `src/lib/queries.ts` — all data access (rotation logic, sets, workouts, body metrics, trends)
- `src/lib/progression.ts` — double-progression suggestion logic (pure function, no DB access)
- `src/lib/session.ts`, `src/lib/auth.ts`, `src/proxy.ts` — auth
- `src/components/WorkoutSession.tsx` — the core logging loop (Today screen client logic)
- `src/app/progress/page.tsx` — body metrics + exercise trends + progression suggestions
- `src/components/TrendChart.tsx` — reusable single-series SVG line chart (no charting library)
- `src/lib/offlineQueue.ts` — localStorage retry queue for set writes made while offline
- `public/exercises/*.svg` — hand-drawn exercise illustrations, real baked-in hex colors (not `currentColor` — see Current Sprint)
- `src/app/globals.css` — color tokens: `--accent` (amber, primary actions), `--success` (green, progress/positive states)

## Current Sprint

**2026-07-13 to 07-19 — M2 bug-fix pass, real-session-tested:** fixed weight/reps not carrying forward between sets, an unrecoverable Finish-workout flow (added confirm + undo), rest timer drift on screen lock, added session notes and tap-to-edit on logged sets, fixed a display bug for fixed-duration/distance exercises. All verified against 4 real completed sessions (full rotation: Lower squat-focus, Push, Lower hinge-focus, Pull) and real data pulled directly from Neon, not just UI testing.

**2026-07-19 — M4 core shipped (Progress screen):**
- New `/progress` screen, linked from the Today header: bodyweight/waist quick-entry with trend charts, per-exercise est. 1RM trend charts, and a double-progression suggestion engine (PRD §3 rule) that flags "ready to add weight" or "stalled."
- Fixed a real bug found while doing this: exercise icons used `currentColor` + a text-color class on an `<img>` tag to theme them — that CSS inheritance never reaches an externally-loaded SVG resource, so they'd been rendering flat black regardless of light/dark mode. Regenerated all 22 with real baked-in hex colors.
- Added a proper color system (`--accent` amber, `--success` green) replacing the all-black/white UI, per feedback that it felt "sad."
- All new queries (session history, recent-session-sets, progression targets) verified directly against production data before shipping, not just build-checked.
- **Known state, not a bug:** every exercise currently shows "insufficient data" for a suggestion — the double-progression check needs 2 sessions of the same exercise, the stall check needs 4, and only one full rotation has been completed so far.

**New decisions / architecture notes:**
- Editing an existing set is keyed by `(workout_id, exercise_id, set_number)`, not the row's DB id.
- Notes and body-metric entries save on blur/submit with no offline queue — lower stakes than losing a set.
- The reopen-workout undo only works in the same browser session right after tapping Finish, before any reload creates the next day's workout.
- `TrendChart` is a small hand-built single-series SVG line component, not a charting library — bodyweight and waist get separate charts rather than one dual-axis chart (different units; dual-axis is a known anti-pattern).
- Progression logic lives in `src/lib/progression.ts` as a pure function operating on already-fetched session data, kept separate from `queries.ts` (DB access) for testability.

**Where we stopped:** M4 core (progress + body tracking) is live. Program editor (M3) and nutrition entry are still unbuilt — Vinos chose progress/body-tracking first.

**Open, not yet decided:**
- Per-arm/unilateral set tracking (flagged after a reported left-shoulder weakness on lateral raises — app currently can't log left/right separately).
- Guard against accidentally logging a 0kg set on a brand-new exercise (happened once, Incline DB press).
- The "AI bot that can edit workouts" idea from an earlier session note — bigger scope, not sized.

**Deferred, explicitly not now:** an onboarding flow for new users with two paths (guided plan builder vs. pick-and-design-your-own days). Vinos flagged this as a "later" idea — don't build until asked.

## Don't
- Don't build the onboarding flow, program editor, or nutrition entry yet — not chosen as next priority, see Current Sprint.
- Don't add RLS or a user table — single-tenant by design, see PRD §4.
