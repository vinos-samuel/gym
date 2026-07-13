# Build prompt for Sonnet — paste everything below the line into a new session in this folder

---

Read PRD.md in this folder fully before doing anything. It is the signed-off spec — follow it exactly, including the scope exclusions (§3) and the simplicity guardrail (§4). Do not add features it doesn't list.

Build **Milestones M1 and M2 only** (PRD §6), then STOP. M3/M4 are gated on me using the logging loop at 2–3 real gym sessions first. Do not build the program editor, analytics screens, or nutrition entry yet — but DO create the full database schema for all tables (PRD §5) now, so later milestones never need schema rework.

## Setup order

1. Create a project CLAUDE.md for this repo: stack, commands, a Current Sprint block, and a one-line pointer to PRD.md as source of truth. Also create an empty DAILY_LOG.md.
2. Scaffold: Next.js (App Router) + TypeScript + Tailwind, PWA (installable, standalone display, app icon, works from iPhone home screen). npm, Node 20.
3. `git init`, sensible .gitignore, then create a private GitHub repo with `gh repo create` and push. GitHub is source of truth.
4. Supabase: if a Supabase MCP tool is available in your session, use it to create the project and apply migrations. If not, write numbered SQL migration files in `supabase/migrations/` and give me exact step-by-step instructions to create the project at supabase.com and paste each migration into the SQL editor — one at a time, telling me what each does.
5. Vercel: give me exact click-by-click instructions to connect the GitHub repo (I know this flow), plus the env vars to set (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

## Non-negotiable requirements

- **Schema + RLS:** all tables from PRD §5, single-user: every table has RLS with SELECT **and** INSERT/UPDATE/DELETE policies scoped to my auth uid, written together and tested with real writes before you call M1 done. No SECURITY DEFINER unless a policy would otherwise query its own table.
- **Auth:** Supabase email+password, one account (I'll sign up once), session persistence ~90 days. No magic links.
- **Seed data:** the exercise library and my 4-day program from PRD Appendix A, inserted via a seed script or migration. Target weights start NULL — first logged session sets them; thereafter pre-fill from my last session.
- **Logging loop (the whole point):** Today screen shows next rotation day with each exercise's targets and last-session numbers. Per set: weight (kg) and reps as large tap steppers pre-filled from last session — confirming an unchanged set is one tap. Buttons sized for one thumb, bottom half of a phone screen. Rest timer auto-starts on set completion: visible countdown, silent, skippable. From app open to a logged set must be ≤3 taps.
- **Offline tolerance (keep it simple):** if a set write fails, queue it in localStorage and retry on reconnect, with a small "syncing" indicator. Do NOT build a general offline-first sync engine — a pending-writes queue with retry is the entire requirement.
- **Exercise visuals:** each seeded exercise gets an inline illustration (open-licensed, e.g. from yuhonas/free-exercise-db — check the license and bundle the images locally in the repo, don't hotlink), a one-line form cue, and an external video link on the detail view.
- **Units:** kg only. No unit toggle, no settings screen in M1/M2.

## Working style

- Work milestone by milestone. After M1, stop and give me the deploy + Supabase steps and wait until I confirm I can log in from my phone's home screen before starting M2.
- After every code change, give me the exact numbered deploy steps per my global CLAUDE.md format.
- If anything in the PRD is ambiguous, ask me — don't guess silently.
- When M2 is done and deployed, tell me explicitly: "Take this to the gym 2–3 times before we build more." Then update the Current Sprint block in CLAUDE.md and append a DAILY_LOG.md entry.

## Definition of done for this session

M1: I can open the app from my iPhone home screen, log in, and it looks like an app (no browser chrome).
M2: I can run a complete real workout — see today's day in the rotation, log every set one-handed with pre-filled values, see last session's numbers per exercise, rest timer runs between sets, and a set logged in airplane mode syncs when I reconnect. All data verifiably lands in Supabase Postgres.
