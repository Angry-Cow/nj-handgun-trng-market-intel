# Build Plan

> This file is written by the external model (Magica) and read by Bolt.
> Bolt reads this at the start of each work session.

## Active Plan — Phase 3: Prior-year (3–4 year) historical data via the Wayback Machine

_Context: You asked to be able to pull prior-year pricing/context for providers already in
the `Competitor` table, going back at most 3–4 years, using the Internet Archive's Wayback
Machine — free, no API key, and it covers the actual historical pages of the specific
businesses already tracked (more accurate than any general industry estimate for "what did
this specific range charge two years ago")._

### Section 1: Add a `CompetitorHistory` table
**Prompt:** Add a new table `CompetitorHistory` with columns: `id` (uuid pk),
`competitorId` (uuid, references `Competitor.id` on delete cascade), `year` (integer),
`courseType` (text, nullable — label for which offering this price applies to, e.g.
"Basic Handgun", "CCW Prep"), `price` (numeric, nullable), `snapshotUrl` (text — the exact
`https://web.archive.org/web/<timestamp>/<original-url>` used, required whenever a price
or data point is recorded, since this is the citation), `dataConfidence` (integer),
`notes` (text, nullable), `createdAt`/`updatedAt` timestamps. Enable RLS with the same
read/write policy pattern as the other tables in this project.
**Done when:**
- [ ] `CompetitorHistory` table exists with the columns above
- [ ] RLS enabled matching the existing table pattern
- [ ] Foreign key to `Competitor` with cascade delete works correctly

### Section 2: Add a `wayback-history-scan` Supabase Edge Function
**Prompt:** Add a new Supabase Edge Function, `wayback-history-scan`, that accepts a
`competitorId` and a `years` array (e.g. `[2023, 2024, 2025]`, capped at 4 years) and, for
each year:
- Calls the Wayback Machine Availability API
  (`https://archive.org/wayback/available?url=<competitor website>&timestamp=<Dec 31 of
  that year>`) to find the closest snapshot to year-end of that year. If none is returned,
  record nothing for that year rather than guessing.
- Fetches the returned snapshot URL's content (the Wayback Machine serves it as normal
  HTML, so reuse a plain `fetch` + HTML parse, or reuse the Firecrawl scrape pattern
  already used in `firecrawl-scan/index.ts` if that's simpler — pick whichever approach
  costs less per page and note which you chose and why in STATUS.md).
- Reuses the existing phone/service/price extraction regex logic from
  `firecrawl-scan/index.ts` against the archived page's content to pull a price if one is
  present.
- Inserts one `CompetitorHistory` row per year found, with `snapshotUrl` set to the exact
  archived URL used.
- Respects at least a 500ms delay between Wayback calls, and caps total years per request
  at 4.
**Done when:**
- [ ] `wayback-history-scan` edge function exists and is deployed
- [ ] Calling it for a real competitor with a real website returns historical rows where
      snapshots exist, and cleanly returns nothing (not an error) for years with no
      snapshot available
- [ ] Every inserted row has a real, working `snapshotUrl`
- [ ] No more than 4 years processed per request, with at least 500ms between Wayback calls

### Section 3: Add a "Backfill History" action to the Competitor detail panel
**Prompt:** Add a "Backfill History" action to `ProviderDetailPanel.tsx` that lets me pick
how many years back (1–4) and triggers `wayback-history-scan` for that one competitor,
then shows the returned historical rows in a small year-over-year table with a clickable
link to each snapshot.
**Done when:**
- [ ] "Backfill History" control is visible in the Competitor detail panel
- [ ] Triggering it for 1–4 years calls the edge function and displays results
- [ ] Each historical row's snapshot link opens the actual archived page

### Section 4: Include year-over-year pricing in generated reports
**Prompt:** Update the `generate-report` function from Phase 2 to include a
"Year-over-Year Pricing" section per county/provider type when `CompetitorHistory` rows
exist for providers in scope, clearly stating how many providers had historical data
available vs. how many did not (Wayback coverage of small local business sites is
inconsistent — say so rather than implying full coverage).
**Done when:**
- [ ] Generated reports include a Year-over-Year Pricing section when historical data
      exists in scope
- [ ] The section states the count of providers with vs. without historical coverage
- [ ] Reports generated with no historical data in scope simply omit this section (no
      broken/empty table)

### Section 5: Verify with a real backfill
**Prompt:** After Sections 1-4 are complete, run a real "Backfill History" for one actual
competitor with a real website (pick one with `needsVerification: false` and a working
`website` field), 3 years back, from the live dashboard. Report in STATUS.md: which
competitor was used, which years returned real snapshot data vs. none, the actual
`snapshotUrl` values, and confirm the `CompetitorHistory` table row count increased
accordingly.
**Done when:**
- [ ] A real backfill was run from the live dashboard for a real competitor
- [ ] STATUS.md lists the actual years/snapshot URLs returned (or explicitly "no snapshot
      found" per year where that's genuinely the case)
- [ ] `CompetitorHistory` table row count increased to match

Do not run this against every competitor automatically — it should only run when
triggered for a specific provider or a specific batch I choose, since it makes outbound
calls per year per provider.

---

## Completed Sections

### Phase 2: Build the missing "Generate Report" feature — COMPLETE (Aug 19, 2026)
Added the `generate-report` Supabase Edge Function (accepts county/state/providerType
filters, computes per-county/per-type statistics, builds a full markdown report with a
"Changes Since Previous Report" diff section, and inserts a new `ResearchReport` row every
time — never overwrites). Added a "Generate New Report" button to the dashboard and
rewrote the report display to show up to 5 most recent reports with expand/download/print.
Verified independently: `ResearchReport` table row count increased from 2 to 3 after a
real generation from the live dashboard; new report id `78965ba8-3a29-4348-b874-
40c93dfb7996` covers 215 providers with a real computed executive summary and confidence
breakdown (45 high, 79 medium, 91 low).

### Phase 1: Fix cross-state geocoding + Overpass state-matching bugs — COMPLETE (Aug 19, 2026)
Fixed the NJ-only bounding box in `geocodeNominatim()` (replaced with a `STATE_BOUNDING_BOX`
map supporting per-state boxes) and `searchOverpass()` state-matching to use ISO 3166-2
codes. Verified with a live Bucks County, PA scan that created 18 new `Competitor` rows
including 3 with real Pennsylvania coordinates.
