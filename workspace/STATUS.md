# Status Report

> This file is written by Bolt after completing each section.
> Magica reads this from GitHub to review progress.

## Last Updated
2026-08-20 — Phase 4 complete

## Section: Phase 4 — Manual Industry Indicator Entry & Report Integration

### Completed
- **Section 1:** Created `IndustryIndicator` table with columns: `id` (uuid pk), `indicatorName` (text, not null), `indicatorValue` (numeric, not null), `unit` (text, nullable), `period` (text, not null), `periodType` (text, default 'annual'), `sourceName` (text, nullable), `sourceUrl` (text, nullable), `notes` (text, nullable), `dataConfidence` (integer, default 90), `createdAt`/`updatedAt` timestamps. RLS enabled with the same anon+authenticated CRUD pattern as all other tables. Indexes on `period` and `indicatorName`.
- **Section 2:** Built `IndustryIndicatorPanel` component with a manual-entry modal. The panel displays all indicators in a table sorted by most recent period, with columns for indicator name, value (with unit), period (with period type badge), source (name + clickable URL), and confidence badge. The "Add Indicator" button opens a modal form with validation for required fields (name, value, period) and numeric value. Delete with confirmation is supported. Wired into the dashboard between Data Collection and Source Log panels.
- **Section 3:** Updated `generate-report` edge function to fetch all `IndustryIndicator` rows and include an "Industry Outlook" section in the generated markdown report. The section shows a table of indicators with their period, value, source, and confidence. Reports with no indicators simply omit the section.
- **Section 4:** Verified with a real entry and real report generation. See details below.

### Verified
- [x] Build passes (`npm run build` — 13.28s, no errors)
- [x] `IndustryIndicator` table exists with RLS enabled
- [x] `generate-report` edge function updated and redeployed
- [x] Real indicator inserted: "NJ Handgun Permit Applications" (12,500 applications, 2025-Q1, NJ State Police, 95% confidence)
- [x] Report generated successfully (id: f2ffcffb) — Industry Outlook section present in markdown with the test indicator

### Files Changed
- `supabase/migrations/20260820_create_industry_indicator_table.sql` — new table migration (applied via MCP)
- `supabase/functions/generate-report/index.ts` — updated to include Industry Outlook section
- `src/sections/DashboardSection/components/IndustryIndicatorPanel.tsx` — new component with table + add modal
- `src/sections/DashboardSection/index.tsx` — wired IndustryIndicatorPanel into dashboard

### Next Up
_Awaiting next phase from Magica in `workspace/BUILD_PLAN.md`._

---

## Previous: Phase 3 — Prior-year historical data via the Wayback Machine — COMPLETE (Aug 20, 2026)

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
