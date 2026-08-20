# Build Plan

> This file is written by the external model (Magica) and read by Bolt.
> Bolt reads this at the start of each work session.

## Active Plan — Phase 7: Login gate + close remaining anonymous-write exposure

_Context: The site is now public and holds real, valuable multi-state competitor data.
I checked the actual RLS policies directly and confirmed that every table except
`CourseOffering`, `MarketForecast`, `ResearchReport`, and `SourceLog` (restricted back in
an earlier phase) still allows full anonymous CRUD — including DELETE — on `Competitor`,
`CompetitorHistory`, `County`, `DataCollectionRun`, `IndustryIndicator`, and
`StateBoundingBox`. This means anyone with the URL can currently read, edit, or delete
this data directly via the public anon key, with no login required. This phase closes
that completely and adds a real login gate in front of the whole application — not just
the write operations — so no one can view or scrape the dashboard, map, or data without
logging in._

### Section 1: Lock down RLS on every remaining table
**Prompt:** For `Competitor`, `CompetitorHistory`, `County`, `DataCollectionRun`,
`IndustryIndicator`, and `StateBoundingBox`, add a migration that changes every existing
policy (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) from `TO anon, authenticated` to
`TO authenticated` only. Also double check `CourseOffering`, `MarketForecast`,
`ResearchReport`, and `SourceLog` — their write policies were restricted in an earlier
phase, but confirm their `SELECT` policies are also restricted to `authenticated` only
now, since the entire app is moving behind a login wall in this phase (no more
public-readable data anywhere). Do not drop or alter any table structure — policy changes
only.
**Done when:**
- [ ] Every table's `SELECT`, `INSERT`, `UPDATE`, `DELETE` policies are `TO authenticated`
      only — zero policies remain with `anon` in the roles list
- [ ] No table structure, data, or non-RLS behavior is changed

### Section 2: Add Supabase Auth login screen gating the entire app
**Prompt:** Add a login screen (Supabase Auth, email + password) that appears before any
part of the dashboard loads for an unauthenticated visitor. Public visitors should not be
able to see the dashboard, map, competitor table, data acquisition panel, reports, or
anything else without logging in — the entire app should be inaccessible pre-login, not
just individual actions.
**Done when:**
- [ ] An unauthenticated visitor sees only a login screen, nothing else
- [ ] A logged-in user sees the full dashboard and can use every existing feature
      normally

### Section 3: Single-user/admin access only — no public sign-up
**Prompt:** Use Supabase Auth's standard email/password sign-in. Do not build a public
sign-up flow — I will create my own account credentials directly in the Supabase
dashboard (tell me the simplest way to do that if it isn't obvious). This should be
single-user/admin access, not open registration.
**Done when:**
- [ ] No public sign-up form exists anywhere in the app
- [ ] I can log in with credentials I create directly in Supabase

### Section 4: Add a visible logout control
**Prompt:** Add a clearly visible "Log out" control somewhere in the header, available
whenever I'm logged in.
**Done when:**
- [ ] "Log out" is visible in the header when logged in
- [ ] Clicking it signs me out and returns me to the login screen

### Section 5: Verify with real tests — both the API level and the UI level
**Prompt:** After Sections 1-4 are complete, verify two things and report both honestly in
STATUS.md:
1. From a completely unauthenticated state (e.g. an incognito browser window, or a direct
   API call using only the public anon key), confirm you can no longer read or write any
   data on any table — report the actual HTTP status/error you get back, not an assumption.
2. Log in with real credentials and confirm the full dashboard loads and at least one
   read action and one write action (e.g. viewing the competitor table, then adding or
   editing a test record) both work correctly while authenticated.
**Done when:**
- [ ] STATUS.md reports the actual result of an unauthenticated API call against at least
      one table (e.g. `Competitor`) showing it is now rejected, with the real error/status
      returned
- [ ] STATUS.md confirms a real logged-in session can both read and write successfully
- [ ] No fabricated or assumed results — if something doesn't work as expected, say so
      plainly and describe what you found instead

---

## Completed Sections

### Phase 6: Age-gate handling + Nominatim/map hardening — COMPLETE (Aug 20, 2026)
Added an `executeJavascript`-based age-gate-clearing script (using a real birthdate) to
the Firecrawl scrape call, with detection/flagging for pages that remain gated afterward
(surfaced as an "Age Gate" badge in the UI). Fixed the Nominatim/Overpass User-Agent to
identify the app with a real contact address per Nominatim's usage policy. Added geocode
caching to avoid redundant Nominatim calls on re-scans. Verified at the code level
(script, detection flag, User-Agent, and cache logic all confirmed present and correct);
live-scan verification against a real age-gated site and cache-hit confirmation deferred
to a scheduled real run.

### Phase 5: Make state/county expansion a data change, not a code change — COMPLETE (Aug 20, 2026)
Replaced hardcoded bounding-box map with a database-backed `StateBoundingBox` table; made
the Data Collection panel read states/counties from the `County` table at runtime; added
an "Add State or County" UI control. Verified end-to-end: a genuinely new state (Delaware,
New Castle County) was added with a real bounding box and a real scan created 31 new
`Competitor` rows.

### Phase 4: Free industry-outlook indicators (no paid subscriptions) — COMPLETE (Aug 20, 2026)
Added `IndustryIndicator` table (`sourceUrl` enforced NOT NULL) and a manual-entry panel,
with a verified-working citation link in generated reports.

### Phase 3: Prior-year (3–4 year) historical data via the Wayback Machine — COMPLETE (Aug 19-20, 2026)
Added `CompetitorHistory` table and `wayback-history-scan` edge function, verified with a
real backfill.

### Phase 2: Build the missing "Generate Report" feature — COMPLETE (Aug 19, 2026)
Added the `generate-report` Supabase Edge Function and report history UI, verified live.

### Phase 1: Fix cross-state geocoding + Overpass state-matching bugs — COMPLETE (Aug 19, 2026)
Fixed the NJ-only bounding box and Overpass state-matching, verified with a live scan.
