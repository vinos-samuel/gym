# PRD — GYM (working name)

Personal training companion for Vinos. Single user. Opened on the phone 4–5x/week at Anytime Fitness. Status: **draft, awaiting sign-off.**

---

## 1. Problem

I train 4 days/week on a structured program but has no tool that:
1. Tells him *what to do today* (exercises, targets, visuals) without re-deriving from memory
2. Lets him log weight × reps per set, one-handed, between sets, faster than a notes app
3. Shows whether each lift is actually progressing over weeks/months, and when to add load
4. Holds the program as editable data so it evolves as he rebuilds barbell confidence
5. Tracks bodyweight + waist alongside training load (recomp = both signals matter)

Notes apps lose structure; commercial apps (Strong, Hevy) are generic, subscription-walled, and don't hold personal context. The failure mode to design against: **if logging feels like a chore, the app is abandoned within two weeks.**

## 2. Success criteria

- **Speed:** From opening the app to logging a completed set: ≤ 3 taps, ≤ 5 seconds. Starting today's workout: ≤ 2 taps from home screen.
- **Stickiness:** Still logging every session after 8 weeks. (The only metric that matters.)
- **Durability:** Zero data loss, ever. Data lives in Postgres, survives cache clears, device switches, and gym dead zones (a set logged offline syncs when signal returns).
- **Usefulness:** Within 6 weeks of data, the app can answer "am I progressing on RDL?" and "what should I lift today?" without Vinos doing mental math.

## 3. Scope

### v1 — In
| Area | What ships |
|---|---|
| **Today screen** | Opens to the next workout in the rotation (rotation-based, not calendar-based — next day in sequence whenever you show up). Shows exercises, target sets × reps, target weight, and last session's numbers for each. |
| **Set logging** | Per-set weight (kg) + reps via large tap steppers pre-filled from last session (usually 0–2 taps to confirm). A set logs with one thumb. Auto rest timer starts on set completion (silent, visible countdown, skippable). |
| **Exercise visuals** | Each exercise has an inline illustration + 1-line form cue, so "Pallof press" is never a mystery. Detail view links out to a form video. |
| **Program editor** | The 4-day split (lower/squat-focus, push, lower/hinge-focus, pull) stored as data. Add/remove/reorder exercises, change set/rep/weight targets, swap days. No code changes needed to evolve the program. |
| **Progression engine (simple, transparent)** | Double-progression rule per exercise: work within a rep range (e.g. 8–12); when all sets hit the top of the range at a given weight for 2 consecutive sessions → suggest +2.5 kg (upper) / +5 kg (lower/machine). Stall flag: no e1RM improvement in 4 sessions → surface it with options (deload 10%, swap variation, hold). Suggestions only — never auto-changes targets. |
| **Progress screens** | Per-exercise trend (est. 1RM + volume over time), 4-week vs previous 4-week comparison, stalled-lift list. Bodyweight + waist logged in ~10 seconds, charted against training volume — the recomp view. |
| **Health profile** | Baseline stats, kcal/protein targets, activity context — stored as structured data, editable. |
| **Daily nutrition quick-entry** | Two numbers a day: kcal + protein, entered in ≤10 seconds, charted against targets and bodyweight. Explicitly **not** a food database — if it ever grows toward food search/logging, that moves to Vigor. |
| **Lab-ready data model** | `biomarkers` table (name, value, unit, reference range, date, source document) exists from day 1, empty until the blood report is uploaded. Nothing bolted on later. |
| **PWA** | Home-screen installable, standalone (no browser chrome), fast load, works one-handed on a phone. Offline-tolerant logging: sets queue locally if signal drops mid-session, sync on reconnect. |

### v1 — Out (deliberately)
- Food-database logging (search foods, meals, barcode scanning) — daily entry here is two totals, nothing more
- Social anything, sharing, multi-user
- Wearable / Apple Health / Strava integrations
- AI-generated programming (the progression rule is deterministic and inspectable)
- Native app / App Store
- Cardio session logging (cycling/steps stay context, not logs — revisit later if wanted)

### Later (designed-for, not built)
- Blood report upload → parsed into `biomarkers`
- Program "phases" (e.g., reintroducing barbell squat as a planned transition)
- Export everything as CSV/JSON (data model makes this trivial whenever wanted)

## 4. Constraints & decisions

**Stack: Next.js (PWA) on Vercel + Neon Postgres.** *(Revised 2026-07-13 — see note below)*
Why this over the alternatives:
- **Neon** = real managed serverless Postgres, generous free tier, native Vercel integration. Originally speced as Supabase, but your existing Supabase org has used its free project allowance (6 projects already running), making a new project $10/mo. Neon gets the same relational database — same persistence guarantee, same schema, same query power — at $0/mo. Rejected Airtable (free tier caps at 1,000 records/base — you'd hit that in ~3 months at 4 sessions/week) and Google Sheets (no real query layer; every trend/progression feature would mean hand-filtering full-sheet fetches in JS, and it gets slower and more fragile as data grows — directly against your "clean enough that future changes aren't painful" requirement).
- **Vercel** = your documented workflow for new projects: push to `main`, auto-deploy, nothing to babysit.
- **Next.js + React + TypeScript + Tailwind** = your stack defaults.
- **Tradeoff accepted:** Neon has no built-in auth (unlike Supabase), so auth is simplified accordingly (see below). All Postgres access happens server-side only (Server Actions / Route Handlers) — the database connection string never reaches the browser. Data is plain Postgres, exportable any time, so no lock-in on the part that matters.

**Auth:** No user accounts, no Supabase Auth. Since this is genuinely single-user, a single passphrase (stored server-side as an env var) gates a signed, httpOnly session cookie valid ~90 days. No RLS needed — there's exactly one tenant, and every server-side data function checks the session cookie before touching the database, so the security boundary is the app layer, not row-level policies. This is simpler than a full auth system and matches "reasonable care... not enterprise-grade security theater for a single-user personal tool."

**Units:** kg, cm, kcal. No unit toggle.

**Simplicity guardrail:** every future feature request (including from you) gets tested against "does this make the between-sets logging loop slower or the app busier?" If yes, it's a no by default.

## 5. Data model (summary)

```
programs        → the split (name, active flag)
program_days    → 4 rotation days, ordered
day_exercises   → exercise + target sets/rep-range/weight per day (editable = living program)
exercises       → library: name, muscle group, equipment, illustration, form cue, video link
workouts        → one logged session (day, date, notes)
sets            → workout, exercise, set #, weight, reps, timestamp  ← the core table
body_metrics    → date, type (bodyweight | waist | future types), value, unit
profile         → baseline stats, targets, health notes (single row)
biomarkers      → name, value, unit, ref range, measured date, source  (empty until report upload)
```

Everything analytics-related is *derived* from `sets` — no denormalized stats to corrupt.

## 6. Plan

| Milestone | Contents | Definition of done |
|---|---|---|
| **M1 — Foundation** | Supabase project, schema + RLS, auth, Next.js PWA shell deployed to Vercel | You can log in from your phone home screen |
| **M2 — Core loop** | Today screen, set logging, rest timer, program seeded with your 4-day split, offline queue | You can run a full real workout at the gym logging every set |
| **M3 — Program & visuals** | Program editor, exercise library with illustrations + cues | You can swap an exercise and see visuals without me |
| **M4 — Analytics & body** | Trends, progression suggestions, stall flags, bodyweight/waist tracking | App answers "add weight to RDL?" from real data |

Gate: **M2 gets used at 2–3 real sessions before M3/M4 are built.** If the logging loop isn't faster than a notes app in practice, we fix that before building anything else.

## 7. Open questions — RESOLVED (2026-07-13)

1. **Program content** — Claude drafts the 4-day program for review (see Appendix A). Starting weights set at first real session, not guessed here.
2. **Nutrition scope** — Daily quick-entry of kcal + protein totals IS in scope. Guardrail: two numbers, never a food database.
3. **Exercise visuals** — Bundled open-licensed illustrations inline + video link-out per exercise.

## 8. Non-blocking assumptions (correct me if wrong)

- Rotation-based scheduling (next day in sequence) beats calendar-pinned days for a 4x/week schedule with variable rest days.
- Rest timer is included but silent/skippable — visible countdown, no alarms.
- English only, no dark-mode toggle in v1 (follows system preference).
- App name/branding: placeholder "GYM" until you care.

---

## Appendix A — Draft program v1 (for your review)

4-day rotation, ~45–60 min/session, no barbell squats, no standing overhead barbell work, hinge pattern built deliberately. Rep ranges are the double-progression window. **All starting weights get set during your first logged session** — the app pre-fills from there on.

**Day 1 — Lower (squat-focus)**
| Exercise | Sets × reps | Note |
|---|---|---|
| Leg press | 4 × 8–12 | Main squat-pattern load, spine unloaded |
| KB goblet squat | 3 × 8–12 | Squat pattern practice, upright torso |
| Leg extension | 3 × 10–15 | Quad isolation |
| Seated leg curl | 3 × 10–15 | Hamstring balance |
| Standing calf raise | 3 × 10–15 | |
| Pallof press | 3 × 10/side | Anti-rotation core |

**Day 2 — Push**
| Exercise | Sets × reps | Note |
|---|---|---|
| Machine chest press | 4 × 8–12 | Main press |
| Seated DB shoulder press | 3 × 8–12 | Seated = back supported |
| Incline DB press | 3 × 8–12 | Upper chest |
| Cable lateral raise | 3 × 12–15 | |
| Rope triceps pushdown | 3 × 10–15 | |
| Dead bug | 3 × 10/side | Anterior core, spine-neutral |

**Day 3 — Lower (hinge-focus)**
| Exercise | Sets × reps | Note |
|---|---|---|
| Barbell RDL | 4 × 8–10 | The main hinge builder — key progression lift |
| Back extension | 3 × 10–15 | Direct posterior-chain endurance |
| KB swing | 3 × 12–15 | Hinge power, light-moderate |
| Seated leg curl | 3 × 10–15 | |
| Side plank | 3 × 30s/side | Lateral core |

**Day 4 — Pull**
| Exercise | Sets × reps | Note |
|---|---|---|
| Lat pulldown | 4 × 8–12 | Main vertical pull |
| KB gorilla row | 3 × 8–12/side | Hinge-position row — doubles as hinge practice |
| Seated cable row | 3 × 8–12 | Chest-supported alternative: machine row |
| Face pull | 3 × 12–15 | Rear delts / posture |
| DB curl | 3 × 10–12 | |
| KB farmer's carry | 3 × ~30 m | Grip + trunk under load |

Progression per §3: within-range reps first, then +2.5 kg (upper) / +5 kg (lower & machines) when the top of the range is hit across all sets two sessions running. RDL progresses conservatively: +2.5 kg only.
