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
- `src/app/globals.css` — color tokens: `--background` (warm cream/charcoal), `--accent`/`--success` (sage green — same value, kept as separate tokens so they can diverge later), `--gold` (rare secondary accent, e.g. "stalled" badge). Neutrals use Tailwind's built-in `stone-*` (warm gray), not `zinc-*`.

## Current Sprint

**2026-07-13 to 07-19 — M2 bug-fix pass, real-session-tested:** fixed weight/reps not carrying forward between sets, an unrecoverable Finish-workout flow (added confirm + undo), rest timer drift on screen lock, added session notes and tap-to-edit on logged sets, fixed a display bug for fixed-duration/distance exercises. All verified against 4 real completed sessions (full rotation: Lower squat-focus, Push, Lower hinge-focus, Pull) and real data pulled directly from Neon, not just UI testing.

**2026-07-19 — M4 core shipped (Progress screen):**
- New `/progress` screen, linked from the Today header: bodyweight/waist quick-entry with trend charts, per-exercise est. 1RM trend charts, and a double-progression suggestion engine (PRD §3 rule) that flags "ready to add weight" or "stalled."
- Fixed a real bug found while doing this: exercise icons used `currentColor` + a text-color class on an `<img>` tag to theme them — that CSS inheritance never reaches an externally-loaded SVG resource, so they'd been rendering flat black regardless of light/dark mode. Regenerated all 22 with real baked-in hex colors.
- Added a proper color system (`--accent` amber, `--success` green) replacing the all-black/white UI, per feedback that it felt "sad."
- All new queries (session history, recent-session-sets, progression targets) verified directly against production data before shipping, not just build-checked.
- **Known state, not a bug:** every exercise currently shows "insufficient data" for a suggestion — the double-progression check needs 2 sessions of the same exercise, the stall check needs 4, and only one full rotation has been completed so far.

**2026-08-07 — Progress screen debugging saga, root-caused:** three real issues, in order of discovery: (1) N+1 queries — 3-4 DB round trips per exercise across ~20 exercises overwhelmed the default 10-connection `pg` pool, fixed by batching into one query per data type using window functions (`getAllExercise*` functions in queries.ts); (2) the page was too heavy — ~20 exercises × 2 always-rendered SVG charts (600-800+ elements) was too much to reliably deliver over gym wifi, fixed by collapsing charts behind a tap-to-expand; (3) the real crash — expanding a chart threw React error #31 ("Objects are not valid as a React child, found [object Date]"). **Root cause: `pg` parses Postgres `date` columns into real JS `Date` objects, not strings, regardless of the TypeScript types in queries.ts claiming `date: string`.** This was invisible through several rounds of my own verification because every check used `JSON.stringify`/`console.log`, which silently serializes `Date` → ISO string and masks the mismatch completely. Only surfaced by reading the actual browser DevTools console the user screenshotted. **Lesson: when verifying query output against a live DB, check `typeof value` / `value instanceof Date` explicitly — never trust `JSON.stringify` output as proof of the runtime type.** Fixed with a `toDateString()` normalizer in queries.ts applied at every date-typed field.

**New decisions / architecture notes:**
- Editing an existing set is keyed by `(workout_id, exercise_id, set_number)`, not the row's DB id.
- Notes and body-metric entries save on blur/submit with no offline queue — lower stakes than losing a set.
- The reopen-workout undo only works in the same browser session right after tapping Finish, before any reload creates the next day's workout.
- `TrendChart` is a small hand-built single-series SVG line component, not a charting library — bodyweight and waist get separate charts rather than one dual-axis chart (different units; dual-axis is a known anti-pattern).
- Progression logic lives in `src/lib/progression.ts` as a pure function operating on already-fetched session data, kept separate from `queries.ts` (DB access) for testability.

**2026-08-07 — M3 shipped (Program editor) + 0kg guard:**
- New `/program` screen, linked from Today: edit target sets/rep range/progression increment per exercise, add/remove exercises from a day (removal keeps logged history — sets reference `exercise_id` directly, not the day_exercise slot), reorder within a day.
- Reordering swaps `order_in_day` through a temporary sentinel value rather than a direct two-row swap — `(program_day_id, order_in_day)` is a non-deferrable unique constraint, so a direct swap collides mid-update.
- Migration: `workout_substitutions.day_exercise_id` FK changed to `ON DELETE CASCADE`, since removing a day_exercise would otherwise be blocked by old substitution rows referencing that slot.
- Also shipped: a confirm-before-logging guard when weight is 0kg on a non-bodyweight exercise (the Incline DB press incident from weeks ago).
- All mutations (add/remove/update/reorder) verified against real production data with self-restoring tests before shipping.

**2026-08-07 — Vigor-inspired redesign shipped:**
- Vinos asked for a design pass referencing Vigor (vigorapp.fit) — presented a mockup artifact first, iterated once (v1 kept GYM's amber identity + invented a dark "floor mode" Vigor doesn't have; v2 corrected to Vigor's actual palette: cream background, sage green as the one primary accent, gold used once) before writing any code, per explicit "do not build anything yet" instruction.
- Shipped: cream/sage/gold tokens in `globals.css`, Nunito replacing Geist Sans (Geist Mono kept for all numeric data), `zinc-*` → `stone-*` across every component, all 23 exercise illustrations re-tinted amber→sage.
- Real bug caught by an actual visual check (not just build passing): several page containers used hardcoded `bg-white`/`bg-stone-50` instead of the `bg-background` token, so they didn't pick up the new cream color at all. Login page checked directly in the browser, in both light and dark, before shipping.
- Nav buttons (Today/Progress/Program) switched from soft-fill to the same solid `bg-accent` treatment as Log set/Finish workout — they weren't reading as tappable.
- One unified palette across Today/Progress/Program now — no more light/dark-mode split by screen, only density (spacing, type size) differs.

**Big strategic thread, not a build decision yet:** Vinos wants to eventually merge GYM's exercise-tracking into **Vigor** (his App Store app — VibecodeApp stack, already tracks nutrition/calories-burned/water/weight) rather than keep GYM as a permanently separate tool. This is explicitly "much bigger" and needs its own planning conversation — it means porting logic to a different framework/design system, not copying files. Worth checking in on before investing in more GYM-only polish that might get thrown away in a port. Not blocking current work; Vinos chose to keep building GYM standalone (program editor) despite this.

**Where we stopped:** M2, M3, and M4-core are all live and working. Nutrition entry (rest of M4) is the only PRD-scoped piece still unbuilt.

**Open, not yet decided:**
- Per-arm/unilateral set tracking (flagged twice now — left-shoulder weakness on lateral raises, and that exercise's trend has been flat for 3+ sessions since. App still can't log left/right separately).
- The "AI bot that can edit workouts" idea from an earlier session note — bigger scope, not sized.
- The Vigor merge (see above) — needs its own scoping conversation.

**Deferred, explicitly not now:** an onboarding flow for new users with two paths (guided plan builder vs. pick-and-design-your-own days). Vinos flagged this as a "later" idea — don't build until asked.

## Don't
- Don't build the onboarding flow or nutrition entry yet — not chosen as next priority, see Current Sprint.
- Don't add RLS or a user table — single-tenant by design, see PRD §4.
