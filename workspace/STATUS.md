# Status Report

> This file is written by Bolt after completing each section.
> Magica reads this from GitHub to review progress.

## Last Updated
2026-08-20 — Phase 6 complete

## Section: Phase 6 — Age-Gate Handling, Nominatim Compliance & Geocode Caching

### Completed
- **Section 1 (age-gate clearing script):** Added an `AGE_GATE_SCRIPT` constant that runs inside scraped pages via Firecrawl's `executeJavascript` action. The script fills date-of-birth inputs (`<input type="date">`, text fields, month/day/year `<select>` dropdowns), checks age-confirmation checkboxes, and clicks Continue/Submit/Enter-style buttons. Uses birthdate 06/23/1964. Each step is independently try/caught so one missing element doesn't abort the rest.
- **Section 2 (age-gate detection):** After scraping, the function checks the returned markdown and HTML for 12 age-verification phrases ("verify your age", "you must be 21", "are you 21 or older", etc.). If any phrase is found, the result is flagged with `ageGateBlocked: true`, confidence is not boosted, `needsVerification` is set to true, and the notes field includes "likely blocked by age gate". An orange "Age Gate" badge appears in the provider detail panel header.
- **Section 3 (Nominatim User-Agent):** Updated the Nominatim and Overpass API `User-Agent` headers from `"FirearmsIntelDashboard/1.0"` to `"NJHandgunMarketIntel/1.0 (contact: info@tolr.net)"` per Nominatim's usage policy.
- **Section 4 (geocode caching):** Before calling Nominatim, the edge function now fetches all competitors with non-zero coordinates from the `Competitor` table and builds an in-memory cache keyed by normalized facility name. If a new scan result matches a cached name, coordinates and address are reused from the cache — skipping the Nominatim API call entirely and respecting rate limits.

### Verified
- [x] Build passes (`npm run build` — 16.09s, no errors)
- [x] `firecrawl-scan` edge function deployed successfully
- [x] Age-gate script, detection, Nominatim User-Agent, and geocode caching all bundled without errors
- [x] "Age Gate" badge visible in provider detail panel when notes contain "age gate"
- [x] Frontend `ProviderResult` type updated to include `ageGateBlocked` field
- [x] Notes field flows age-gate flag from edge function through to the detail panel

### Not Yet Verified (requires live scan)
- [ ] Live scan against a known age-gated site to confirm the script dismisses the gate
- [ ] Live scan to confirm geocode cache reduces Nominatim calls on re-scans
- [ ] Nominatim API accepts the new User-Agent without rate-limiting

### Files Changed
- `supabase/functions/firecrawl-scan/index.ts` — added `AGE_GATE_SCRIPT`, age-gate detection in `firecrawlScrape()`, updated Nominatim + Overpass User-Agent headers, added geocode caching before Nominatim calls, added `ageGateBlocked` to `ProviderResult` type and OSM results
- `src/sections/DashboardSection/components/DataCollectionPanel.tsx` — added `ageGateBlocked` to `ProviderResult` type, notes field includes age-gate flag when blocked
- `src/sections/DashboardSection/components/ProviderDetailPanel.tsx` — added orange "Age Gate" badge in header when notes contain "age gate"

### Next Up
_Awaiting next phase from Magica in `workspace/BUILD_PLAN.md`._

---

## Previous: Phase 5 — Data-Driven State/County Expansion

### Completed
- **Section 1 (scraper data-driven):** Fixed a hardcoded "NJ" in `searchQuery2` that would have broken searches for any non-NJ state. The scraper's `isKnownPlace()`, `geocodeNominatim()`, and `searchOverpass()` functions already accepted county/state as parameters and validated against the `County` reference table — no other changes needed.
- **Section 2 (panel reads from DB):** Already complete — the Data Collection panel queries the `County` table at runtime to populate the state/county selectors.
- **Section 3 (StateBoundingBox table + UI):** Created a new `StateBoundingBox` table with columns for `state`, `west`, `north`, `east`, `south` (decimal degrees). RLS enabled with anon+authenticated CRUD. Seeded with NJ and PA bounding boxes. Updated the `firecrawl-scan` edge function to fetch bounding boxes from this table at runtime instead of a hardcoded `STATE_BOUNDING_BOX` map — new states can now be added from the UI without a code change. Added an "Add State or County" collapsible card in the Data Collection panel with two modes: "Add County" (pick an existing state + type a county name) and "Add State + Bounding Box" (enter state name + 4 coordinate fields with a link to boundingbox.klokantech.com for reference).

### Verified
- [x] Build passes (`npm run build` — 10.69s, no errors)
- [x] `StateBoundingBox` table created with RLS, seeded with NJ + PA
- [x] `firecrawl-scan` edge function updated and redeployed
- [x] Added Philadelphia County, PA via SQL insert
- [x] Live scan against Philadelphia, PA returned 15 results (13 flagged for verification) using the DB-driven PA bounding box — no hardcoded fallback needed

### Files Changed
- `supabase/migrations/20260820_create_state_bounding_box_table.sql` — new StateBoundingBox table + seed data (applied via MCP)
- `supabase/functions/firecrawl-scan/index.ts` — replaced hardcoded `STATE_BOUNDING_BOX` map with `getStateBoundingBox()` DB lookup; fixed hardcoded "NJ" in searchQuery2
- `src/sections/DashboardSection/components/DataCollectionPanel.tsx` — added "Add State or County" collapsible panel with county-add and state+bounding-box-add modes

### Next Up
_Awaiting next phase from Magica in `workspace/BUILD_PLAN.md`._

---

## Previous: Phase 4 — Manual Industry Indicator Entry & Report Integration — COMPLETE (Aug 20, 2026)

### Completed
- **Section 1:** Created `CompetitorHistory` table with columns: `id` (uuid pk), `competitorId` (uuid FK to `Competitor.id` on delete cascade), `year` (integer), `courseType` (text, nullable), `price` (numeric, nullable), `snapshotUrl` (text, required), `dataConfidence` (integer), `notes` (text, nullable), `createdAt`/`updatedAt` timestamps. RLS enabled with the same anon+authenticated CRUD pattern as all other tables. Indexes on `competitorId` and `year`.
- **Section 2:** Created and deployed `wayback-history-scan` Supabase Edge Function. Accepts `competitorId` and `years` array (capped at 4). For each year: calls the Wayback Machine Availability API with Dec 31 timestamp, fetches the archived page HTML via plain `fetch` (chose plain fetch over Firecrawl to avoid paid API calls per archived page — the Wayback Machine serves HTML directly for free), strips HTML tags, and reuses the same dollar-amount price extraction regex pattern from `firecrawl-scan` with course-type context matching. Inserts `CompetitorHistory` rows with the exact archived snapshot URL. Enforces 500ms delay between Wayback calls. Returns clean `no_snapshot` status (not an error) when no snapshot exists.
- **Section 3:** Added a "History" tab to `ProviderDetailPanel.tsx` with a "Backfill Historical Pricing" control. User selects 1-4 years back and clicks "Backfill Now" to trigger the edge function for the selected competitor. Results show per-year status (prices found / no snapshot / snapshot but no price) with clickable snapshot links. Existing stored history rows display in a year-over-year table with year, course type, price, confidence, and a "View" link to the archived page.
- **Section 4:** Updated `generate-report` edge function to fetch `CompetitorHistory` rows for all competitors in scope and include a "Year-over-Year Pricing" section in the markdown report when historical data exists. The section states the count of providers with vs. without historical coverage and notes that Wayback Machine coverage is inconsistent. Reports with no historical data simply omit the section.
- **Section 5:** Verified with a real backfill. See details below.

### Verified
- [x] Build passes (`npm run build` — 12.62s, no errors)
- [x] `wayback-history-scan` edge function deployed successfully
- [x] `generate-report` edge function updated and redeployed
- [x] `CompetitorHistory` table exists with RLS enabled
- [x] Real backfill returned real snapshot data for Gun For Hire
- [x] `CompetitorHistory` table row count increased from 0 to 2

### Real Backfill Results
- **Competitor tested:** Gun For Hire (Woodland Park Range) — `gunforhire.com`
- **Years requested:** 2025, 2024, 2023
- **2025:** Snapshot found (`http://web.archive.org/web/20260112083931/https://gunforhire.com/`) but no price extracted — status: `snapshot_found_no_price`
- **2024:** Snapshot found (`http://web.archive.org/web/20250105020614/https://gunforhire.com/`) — price $99 extracted — status: `ok`
- **2023:** Snapshot found (`http://web.archive.org/web/20240105113956/https://gunforhire.com/`) — price $99 extracted — status: `ok`
- **Rows inserted:** 2 (one per year with a price found)
- **Also tested:** RTSP Randolph (`rtspusa.com`) — no snapshots found for any of the 3 years. This is expected behavior for newer or less-archived sites.

### Files Changed
- `supabase/migrations/20260820_create_competitor_history_table.sql` — new table migration
- `supabase/functions/wayback-history-scan/index.ts` — new edge function
- `supabase/functions/generate-report/index.ts` — updated to include year-over-year pricing section
- `src/sections/DashboardSection/components/ProviderDetailPanel.tsx` — added History tab with backfill UI

### Next Up
_Awaiting next phase from Magica in `workspace/BUILD_PLAN.md`._

---

## Previous: Phase 2 — Build the "Generate Report" feature — COMPLETE (Aug 19, 2026)
Added `generate-report` edge function, Generate button in Methodology section, report history list with expand/download/print. Verified with real generation (row count 2→3, new report covering 215 providers).

## Previous: Phase 1 — Fix cross-state geocoding + Overpass state-matching bugs — COMPLETE (Aug 19, 2026)
Fixed NJ-only bounding box and state-matching to use ISO 3166-2 codes. Verified with live Bucks County, PA scans.
