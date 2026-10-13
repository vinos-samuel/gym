# GYM

A single-user training companion PWA I built for myself because notes apps lose structure and commercial apps are generic.

## What it does
- Shows **today's session**: exercises, targets, warm-up and cool-down.
- One-handed set logging (weight × reps) between sets, faster than a notes app.
- Progress per lift over weeks, with a nudge when it's time to add load.
- The program lives as editable data, so it evolves with me.
- Exercise substitution when a machine is taken.

## Stack
Next.js (App Router), TypeScript, Tailwind, Neon Postgres via `pg` (server-side only), passphrase auth.

## Run locally
```bash
cp .env.example .env.local   # DATABASE_URL, AUTH_PASSPHRASE
npm install
npm run dev
```
Migrations are in `db/migrations/`.

## Built with
Claude Code. See `PRD.md` for scope and decisions.
