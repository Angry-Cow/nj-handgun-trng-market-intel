# Build Plan

> This file is written by the external model (Magica) and read by Bolt.
> Bolt reads this at the start of each work session.

## Active Plan — Phase 4: Free industry-outlook indicators (no paid subscriptions)

_Context: The report should include forward-looking / directional industry context,
sourced only from free public data — no paid industry-report subscriptions. None of these
sources are specific to "handgun training" alone (no free source is), so every number must
be clearly labeled as a proxy with its exact source and date, not implied to be
training-industry-specific. This phase adds manual entry (not automated scraping) for four
specific free sources, since some are PDFs, some require picking the right row/column, and
the data going into a report I'm putting my name on needs to be something I've reviewed
before it's cited._

### Section 1: Add an `IndustryIndicator` table
**Prompt:** Add a new table `IndustryIndicator` with columns: `id` (uuid pk), `sourceName`
(text, e.g. "FBI NICS Background Checks — NJ"), `metricName` (text, e.g. "Monthly
background checks, New Jersey"), `state` (text, nullable), `county` (text, nullable),
`period` (text, e.g. "2026-07"), `value` (numeric), `unit` (text, e.g. "checks",
"establishments", "USD"), `sourceUrl` (text, required — must always be the exact page/file
the number came from), `retrievedAt` (timestamptz), `notes` (text, nullable). Enable RLS
matching the pattern from the other tables.
**Done when:**
- [ ] `IndustryIndicator` table exists with the columns above
- [ ] `sourceUrl` is enforced as required (not nullable)
- [ ] RLS enabled matching the existing table pattern

### Section 2: Add a manual-entry form for industry indicators
**Prompt:** Add a manual-entry modal (similar in spirit to `AddCompetitorModal.tsx`) where
I can paste in a value + its source + date for any of the following four sources. Do not
build automated scraping for these — they require me to review and choose the exact
number before it's cited:
- FBI NICS monthly firearm background checks for New Jersey (source:
  https://www.fbi.gov/file-repository/cjis/nics_firearm_checks_-_month_year_by_state.pdf/view,
  or the pre-parsed CSV maintained by the Data Liberation Project:
  https://www.data-liberation-project.org/datasets/nics-firearm-background-checks/)
- BLS OEWS state-level wage data for the closest instructor/training occupation code
  (source: https://www.bls.gov/oes/tables.htm)
- Census County Business Patterns establishment counts for NAICS 713990 (Rifle & Pistol
  Ranges is sub-code 713990-38) by county (source:
  https://www.census.gov/programs-surveys/cbp/data/datasets.html)
- IBISWorld's public preview topline figure for the Shooting Ranges industry (source:
  https://www.ibisworld.com/united-states/industry/shooting-ranges/5467/ — the free
  preview number only, not the paid report)

The form should have fields matching the `IndustryIndicator` columns, with `sourceUrl`
required before saving, and should offer the 4 source names above as quick-select options
(with free-text override allowed for other sources later).
**Done when:**
- [ ] Manual-entry modal exists and is accessible from the dashboard
- [ ] All `IndustryIndicator` fields are editable, with `sourceUrl` required
- [ ] Saved entries appear immediately in a simple indicator list/table

### Section 3: Include an Industry Outlook section in generated reports
**Prompt:** Update the `generate-report` function from Phase 2 to include an "Industry
Outlook" section that pulls the most recent `IndustryIndicator` row per `sourceName`,
quotes the number with its `sourceUrl` as an inline citation, and explicitly states these
are national/state-level proxies rather than training-industry-specific figures. If no
`IndustryIndicator` rows exist yet, omit this section entirely (no broken/empty section).
**Done when:**
- [ ] Generated reports include an Industry Outlook section when indicator data exists
- [ ] Each cited number includes its source name and `sourceUrl`
- [ ] The section explicitly states these are proxies, not training-specific figures
- [ ] Reports generated with no indicator data simply omit this section

### Section 4: Verify with a real entry and a real report
**Prompt:** After Sections 1-3 are complete, manually enter one real indicator (pick any
one of the 4 sources above, with a real current value you look up yourself) from the live
dashboard, then generate a new report and confirm the Industry Outlook section appears
with that real value and source link. Report in STATUS.md: the indicator entered (source,
metric, value, sourceUrl), and confirm the new report's markdown actually contains that
citation.
**Done when:**
- [ ] A real indicator was entered from the live dashboard (not seeded/faked data)
- [ ] A new report was generated and its Industry Outlook section contains that indicator
- [ ] STATUS.md quotes the actual markdown text of the Industry Outlook section produced

I'm intentionally not asking for automatic scraping of these four sources in this phase —
some are PDFs, some require picking the right row/column, and I want to control exactly
which numbers go into a report I'm putting my name on. If a fully automated ingestion later
turns out to be worth it for one specific source, I'll ask for it as its own phase.

---

## Completed Sections

### Phase 3: Prior-year (3–4 year) historical data via the Wayback Machine — COMPLETE (Aug 19-20, 2026)
Added `CompetitorHistory` table and `wayback-history-scan` edge function (queries the
Internet Archive's free Availability API, capped at 4 years, respects a 500ms delay
between calls, returns clean `no_snapshot` status instead of an error when nothing is
found). Added a "Backfill Historical Pricing" control to the Competitor detail panel and a
Year-over-Year Pricing section to generated reports. Verified independently: real backfill
for Gun For Hire (gunforhire.com) returned real snapshot URLs and $99 prices for 2023 and
2024 (confirmed directly in the `CompetitorHistory` table), and a second competitor (RTSP
Randolph) correctly returned no snapshots rather than fabricated data. Confirmed live on
the public site.

### Phase 2: Build the missing "Generate Report" feature — COMPLETE (Aug 19, 2026)
Added the `generate-report` Supabase Edge Function and a "Generate New Report" button;
rewrote the report display to show up to 5 most recent reports. Verified independently and
confirmed live on the public site: `ResearchReport` row count increased from 2 to 3, new
report covers 215 providers with a real computed executive summary.

### Phase 1: Fix cross-state geocoding + Overpass state-matching bugs — COMPLETE (Aug 19, 2026)
Fixed the NJ-only bounding box in `geocodeNominatim()` and `searchOverpass()`
state-matching to use ISO 3166-2 codes. Verified with a live Bucks County, PA scan that
created 18 new `Competitor` rows including real Pennsylvania coordinates. Confirmed live on
the public site.
