# Daily Log

## 2026-07-13
- Wrote PRD, got sign-off, drafted the 4-day program (Appendix A).
- Started build with Sonnet. Pivoted stack from Supabase to Neon mid-build: Vinos's Supabase org had used its free project allowance, making a new project $10/mo; considered Airtable/Google Sheets but rejected both (Airtable's 1,000-record free cap would be hit in ~3 months at this logging volume; Sheets has no real query layer for the progression/trend features). Neon is $0/mo with the same relational guarantees.
- Neon has no built-in auth (unlike Supabase), so auth simplified to a single env-var passphrase + signed session cookie — appropriate for a genuinely single-user app, avoids building unnecessary account infrastructure.
- Built: Next.js PWA shell (manifest, icons, service worker for app-shell caching), passphrase auth + proxy-based route gating, full DB schema (`db/migrations/001_init.sql`) and seed data (`002_seed.sql` — 22 exercises, 4-day program, profile baseline), 22 hand-drawn exercise illustrations (avoided external dataset to sidestep licensing/naming-match risk), the Today screen + set logging loop with tap steppers, rest timer, and an offline write queue (localStorage retry on reconnect).
- No Neon MCP tool available in this environment — creating the Neon project and supplying `DATABASE_URL` is a manual step for Vinos. Everything else (migrations, seeding, deploy, verification) is ready to run the moment that's in hand.
- Blocked: waiting on Neon connection string to run migrations, deploy to Vercel, and verify M1/M2 end-to-end.
