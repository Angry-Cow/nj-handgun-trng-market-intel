# Build Plan

> This file is written by the external model (Magica) and read by Bolt.
> Bolt reads this at the start of each work session.

## Active Plan — Phase 2: Build the missing "Generate Report" feature

_Context: The "Full Report (MD)" panel only ever displays the single, oldest `ResearchReport`
row (inserted once by `DataSeeder.tsx` / `REPORT_SEED_DATA` on Feb 7, 2026). Nothing in the
app has ever created a second `ResearchReport` row — the scraping pipeline only writes to
`Competitor`, `CourseOffering`, `DataCollectionRun`, and `SourceLog`. This phase adds the
actual report-generation feature, modeled after the existing `DataCollectionRun` history
pattern: every generated report is a new row, never an overwrite, so there's a running
history of reports over time._

### Section 1: Add a `generate-report` Supabase Edge Function
**Prompt:** Add a new Supabase Edge Function, `generate-report`, that:
- Accepts an optional request body with `county`, `state`, and `providerType` filters
  (same filter shape as the existing `firecrawl-scan` function). If no filters are given,
  it covers all current data.
- Reads all current `Competitor` rows matching the filters, plus their related
  `CourseOffering` rows.
- Computes summary statistics: count of providers and course offerings per county and per
  provider type; average/min/max price where price is known; percent of rows flagged
  `needsVerification`; a data-confidence breakdown (what fraction of rows are high/medium/
  low confidence).
- Builds a Markdown document containing: a title, the report date, an executive summary
  paragraph, a per-county breakdown table, a per-provider-type breakdown table, a data
  quality / methodology footnote (pull source counts from `SourceLog`), and a "changes
  since previous report" section that diffs against the most recent prior `ResearchReport`
  row if one exists (new providers added, providers removed, notable price changes).
- Inserts this as a **new row** in `ResearchReport` (never updates or deletes an existing
  row) with `title`, `reportDate` (now), `contentMarkdown`, and `executiveSummary`
  populated.
- Returns the new report's id plus a short JSON summary of what changed, for the UI to
  display immediately after generation.
**Done when:**
- [ ] `generate-report` edge function exists and is deployed
- [ ] Calling it with no filters returns a markdown report covering all current data
- [ ] Calling it with county/state/providerType filters scopes the report accordingly
- [ ] A new `ResearchReport` row is inserted every time (verified by row count increasing)
- [ ] The original Feb 7, 2026 seeded report is untouched and still the oldest row

### Section 2: Add a "Generate Report" action to the dashboard
**Prompt:** Add a "Generate Report" button next to the existing "Full Report (MD)" button
in the Methodology section. Clicking it calls the `generate-report` function, shows a
loading state while it runs, and on success shows an inline summary of what changed (e.g.
"12 new providers added since last report, 3 price changes detected") before refreshing
the Methodology section to show the newly generated report.
**Done when:**
- [ ] "Generate Report" button is visible and functional in the dashboard
- [ ] Clicking it shows a loading state, then a success summary
- [ ] The Methodology section immediately reflects the new report without a page reload

### Section 3: Show report history, not just the latest report
**Prompt:** Change `MethodologySection.tsx`'s report display to show the 5 most recent
`ResearchReport` rows (ordered by `reportDate` descending), each with its date and a short
"changes since previous report" line, and let me expand, download, or print any of them —
not only the newest one.
**Done when:**
- [ ] Up to 5 most recent reports are listed, each with date and change summary
- [ ] Each listed report can be individually downloaded (MD) and printed
- [ ] The Feb 7, 2026 seeded report still appears in this history (oldest entry)

### Section 4: Verify with a real generation
**Prompt:** After Sections 1-3 are complete, click "Generate Report" once from the live
dashboard and report in STATUS.md: the new report's id, its executive summary, at least
one number from its per-county breakdown table, and confirmation that the `ResearchReport`
table now has more than one row.
**Done when:**
- [ ] A real report was generated from the live dashboard (not just the edge function
      tested in isolation)
- [ ] STATUS.md includes the new report's id and a sample of its actual content
- [ ] `ResearchReport` table row count increased by exactly 1

---

## Completed Sections

### Phase 1: Fix cross-state geocoding + Overpass state-matching bugs — COMPLETE (Aug 19, 2026)
Fixed the NJ-only bounding box in `geocodeNominatim()` (replaced with a `STATE_BOUNDING_BOX`
map supporting per-state boxes, with unmapped states skipping the filter instead of being
silently rejected), and fixed `searchOverpass()` to try `ISO3166-2` matching first before
falling back to name-based matching. Verified independently: a live Bucks County, PA scan
(range + retailer) on Aug 19, 2026 3:37 PM created 18 new `Competitor` rows including 3
with real Pennsylvania coordinates (Wicen's Shooting Range, Rifle & Shotgun Range, Ridge &
Valley Rod & Gun Club), where previously all Bucks County rows had `latitude/longitude =
0.000000`.
