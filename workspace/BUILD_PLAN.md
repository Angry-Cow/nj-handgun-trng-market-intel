# Build Plan

> This file is written by the external model (Magica) and read by Bolt.
> Bolt reads this at the start of each work session.

## Active Plan — Phase 5: Make state/county expansion a data change, not a code change

_Context: I plan to keep adding counties and states over time (currently NJ + PA, 15
counties). Adding a new state or county should be something done from the existing
`County` table / Data Acquisition panel, without needing a code change each time, other
than the one-time addition of that state's geocoding bounding box (added in Phase 1's
`STATE_BOUNDING_BOX` map)._

### Section 1: Confirm the scraper takes county/state purely as data
**Prompt:** Confirm (and fix if not already true) that `searchOverpass()` and
`geocodeNominatim()` in `supabase/functions/firecrawl-scan/index.ts` take `county`/`state`
purely as parameters — no part of either function should assume New Jersey or Pennsylvania
specifically outside of the `STATE_BOUNDING_BOX` and `STATE_ABBR` maps added in Phase 1.
**Done when:**
- [ ] No hardcoded state-specific logic remains outside the two lookup maps
- [ ] A state not yet in `STATE_BOUNDING_BOX`/`STATE_ABBR` still runs without crashing
      (falls back to no bounding box / no ISO code, per Phase 1's fallback behavior)

### Section 2: Make the Data Acquisition panel read states/counties from the database
**Prompt:** In `DataCollectionPanel.tsx`, the state/county checkboxes are currently
hard-coded (the two state names, and the 15 county names). Change this to read the
available states/counties from the `County` table via a live query instead of a hard-coded
list, so adding a row to `County` (which the app already supports doing) is enough to make
a new county selectable for scanning, without a redeploy.
**Done when:**
- [ ] State/county checkboxes are populated from the `County` table at runtime
- [ ] Adding a test row directly to `County` makes it appear as a selectable option without
      any code change or redeploy
- [ ] Existing 15 counties across NJ/PA still display and function identically to before

### Section 3: Add an "Add State/County" admin control
**Prompt:** Add a small "Add State/County" control in the Data Acquisition section that
lets me add a new `County` row directly from the UI. If the state is new (not yet in
`STATE_BOUNDING_BOX`), prompt me for its bounding box (four numbers: west, north, east,
south) so it can be added to that map — since that one piece genuinely needs a real,
correct value per state and should not silently default to "no bounding box" once several
states are in use (a missing bounding box is fine for exactly one or two states while
testing, but as more states are added, an unbounded geocode search increases the risk of
cross-state mismatches).
**Done when:**
- [ ] I can add a new County row from the UI without touching code
- [ ] Adding a new state prompts for its bounding box and stores it somewhere the edge
      function can read (e.g. a new `StateBoundingBox` table, or an extension of `County`)
- [ ] Existing NJ/PA bounding boxes are unaffected by this change

### Section 4: Verify the known-place validation still works correctly
**Prompt:** Double check that `PLACE_NAME_RE` validation and `isKnownPlace()` in
`firecrawl-scan/index.ts` still work correctly when new states/counties are added via the
UI (Section 3) rather than via a migration — they should, since both check against the
`County` table, but confirm this with a real test and fix any edge case found.
**Done when:**
- [ ] A county added via the new UI control passes `isKnownPlace()` validation
- [ ] A scan for that county runs successfully end-to-end

### Section 5: Verify with a real new county added end-to-end
**Prompt:** After Sections 1-4 are complete, add one real new county from a state not
currently in the system (pick any real US county/state combination), provide its state's
real bounding box (look up real lat/lon bounds for that state), and run a real scan for it
from the live dashboard. Report in STATUS.md: which state/county was added, the bounding
box values used and where you got them, and the actual scan results (records
found/created, and whether any got real coordinates).
**Done when:**
- [ ] A genuinely new state/county was added through the UI (not seeded/faked)
- [ ] A real scan ran successfully for it and returned real results
- [ ] STATUS.md reports the real bounding box source and real scan output

---

## Completed Sections

### Phase 4: Free industry-outlook indicators (no paid subscriptions) — COMPLETE (Aug 20, 2026)
Added `IndustryIndicator` table (with `sourceUrl` enforced NOT NULL at the database level)
and a manual-entry panel for the four free sources researched (FBI NICS, BLS OEWS, Census
CBP, IBISWorld free preview). Added an "Industry Outlook" section to generated reports that
cites each indicator's source as a real clickable markdown link. One round of correction
was needed: the first test indicator's sourceUrl was a dead link (404); it was replaced
with a verified-working source (NJ Attorney General's Permit to Carry Dashboard,
https://www.njoag.gov/permittocarry/ — confirmed live by me directly), and the report
generator was fixed to actually include the link, not just the source name. Verified by
generating a fresh report directly via the deployed edge function and confirming the real
markdown link appears in the stored report content.

### Phase 3: Prior-year (3–4 year) historical data via the Wayback Machine — COMPLETE (Aug 19-20, 2026)
Added `CompetitorHistory` table and `wayback-history-scan` edge function. Added a
"Backfill Historical Pricing" control to the Competitor detail panel and a Year-over-Year
Pricing section to generated reports. Verified: real backfill for Gun For Hire
(gunforhire.com) returned real snapshot URLs and $99 prices for 2023 and 2024. Confirmed
live on the public site.

### Phase 2: Build the missing "Generate Report" feature — COMPLETE (Aug 19, 2026)
Added the `generate-report` Supabase Edge Function and a "Generate New Report" button;
rewrote the report display to show up to 5 most recent reports. Verified and confirmed
live on the public site.

### Phase 1: Fix cross-state geocoding + Overpass state-matching bugs — COMPLETE (Aug 19, 2026)
Fixed the NJ-only bounding box in `geocodeNominatim()` and `searchOverpass()`
state-matching to use ISO 3166-2 codes. Verified with a live Bucks County, PA scan.
Confirmed live on the public site.
