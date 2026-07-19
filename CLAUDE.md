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

**Completed this session (2026-07-15), fixing bugs found in 2 real gym sessions:**
- Fixed weight/reps resetting to last-session history (often 0) after every logged set — steppers now carry forward the just-logged value within a session.
- Fixed Finish workout: no confirmation and no way back, which orphaned a partial session on an accidental tap. Added a confirm (stronger wording if sets are still outstanding) and an undo link on the post-finish screen that reopens the workout via new `/api/workouts/reopen`.
- Manually repaired the workout that got orphaned by the bug above: reopened workout id 2, deleted the empty auto-created next-day workout id 3, directly in Neon (one-off data fix, not a migration).
- Added session notes, wiring up the `workouts.notes` column that existed in the schema but had no UI. Placed at the bottom near Finish (moved there after user feedback — first placement was top of screen, felt like pre-workout clutter; reframed as an end-of-session reflection instead).
- Fixed rest timer drifting/freezing when the phone screen locks or the app backgrounds — was decrementing via a repeating `setTimeout` tick (throttled by mobile OSes when backgrounded), now computes remaining time from a fixed wall-clock end time plus a `visibilitychange` listener to force an immediate recompute on return.
- Added tap-to-edit on logged sets (new `/api/sets/edit` route, `updateSet` query) — requested twice (once dismissed as "not now," then resurfaced in-app via session notes), so built rather than deferred again.
- Reviewed real logged data directly from Neon (not just the UI) to sanity-check the Push day session — surfaced two product gaps, not yet acted on: no per-arm/unilateral set tracking (relevant given a reported left-shoulder weakness on lateral raises), and no guard against accidentally logging a 0kg set on a brand-new exercise.

**New decisions / architecture notes:**
- Editing an existing set is keyed by `(workout_id, exercise_id, set_number)`, not the row's DB id — avoids needing to track server-generated ids in client state for sets logged earlier in the same session.
- Notes save on blur, no offline queue — lower stakes than losing a set, and edited rarely enough that this is proportionate.
- The reopen-workout undo only works in the same browser session right after tapping Finish (before any reload creates the next day's workout). Once the app has moved on to the next day, fixing a wrongly-finished workout is a manual DB fix, same pattern as the id-2/id-3 repair above.

**2026-07-19 — gate cleared, entering M3/M4:** Vinos completed all 4 rotation days (Lower squat-focus, Push, Lower hinge-focus, Pull) across 4 real sessions. Reviewed session notes directly from Neon: confirmed weight-carry-forward and tap-to-edit both working correctly against real data. Fixed one more small bug — fixed-duration/distance exercises (side plank, farmer's carry) displayed as a confusing "30-30" range instead of a single value.

**Chosen next phase:** Progress + body tracking (M4 core) over program editor or nutrition entry — Vinos wants the analytics that PRD §1 calls the headline goal, and there's now 4 sessions of real data to build against. Also requested, folded into this phase: a real color system (current UI is grayscale-only, described as "sad") and better exercise illustrations (current hand-drawn stick figures don't convey meaningful info). Building in this order: color system → illustrations → body metrics entry → progress trends → progression suggestion engine.

**Deferred, explicitly not now:** an onboarding flow for new users with two paths (guided plan builder vs. pick-and-design-your-own days). Vinos flagged this as a "later" idea — don't build until asked.

## Don't
- Don't build the onboarding flow — explicitly deferred, see Current Sprint.
- Don't add RLS or a user table — single-tenant by design, see PRD §4.
