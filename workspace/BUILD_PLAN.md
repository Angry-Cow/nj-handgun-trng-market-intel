# Build Plan

> This file is written by the external model (Magica) and read by Bolt.
> Bolt reads this at the start of each work session.

## Active Plan — Phase 6: Age-gate handling + Nominatim/map hardening

_Context: Many gun retailer/range sites sit behind an age-verification interstitial. Today
the scraper has no `actions` in its Firecrawl calls, so when it hits an age gate it just
captures the gate page itself (not the real content), and the phone/price/service
extraction regexes silently find nothing — producing a thin, low-confidence record that
looks like "just didn't have much data" rather than "was blocked by an age gate." There is
no universal fix (age gates are built too differently across sites — single button, three
month/day/year dropdowns, a date input, custom JS widgets), so this phase does the best
realistic single-script approach plus an honest fallback for whatever it can't clear.
Real birthdate to use for any age-gate field that requires one: **June 23, 1964**
(06/23/1964)._

### Section 1: Add a generic age-gate-clearing script to firecrawlScrape()
**Prompt:** In `supabase/functions/firecrawl-scan/index.ts`, add an `actions` array to the
Firecrawl `/scrape` call inside `firecrawlScrape()` (the function that scrapes each
provider's own website). Use an `executeJavascript` action containing one script that:
- Looks for `input[type="date"]` fields and sets their value to `1964-06-23` (ISO format),
  dispatching `input` and `change` events so any framework listening picks up the change.
- Looks for common birthdate `<select>` patterns: elements whose `name`, `id`, or
  `aria-label` (case-insensitive) contain "month", "day", "year", "dob", or "birth". Set
  month selects to June/6, day selects to 23, year selects to 1964, matching against
  either numeric values or text option labels, and dispatch `change` events.
- Looks for free-text birthdate inputs (`name`/`id`/placeholder containing "dob" or
  "birth") and sets their value to `06/23/1964`, dispatching `input`/`change`.
- Looks for a simple age-confirmation checkbox (`input[type="checkbox"]` whose nearby
  label text contains "21" or "18" or "of age" or "years old") and checks it.
- After attempting the above, looks for a button/link whose visible text matches
  "enter", "continue", "submit", "yes", "confirm", "i am", or "agree" (case-insensitive)
  and clicks the first match.
- Wrap each individual step in its own try/catch inside the script so one missing element
  doesn't stop the rest of the script from running.
- Add a short `wait` action (500-1000ms) before and after this script to let any resulting
  page navigation/render settle.
**Done when:**
- [ ] The `actions` array is added to the `firecrawlScrape()` Firecrawl request
- [ ] The script handles all four field-shape cases above (date input, dropdowns,
      free-text, checkbox) without crashing if any are absent
- [ ] A generic "click a Continue/Enter/Submit/Confirm-like button" step runs after
      attempting to fill any fields

### Section 2: Detect and flag pages that are still age-gated afterward
**Prompt:** After the action sequence runs and the page content is captured, check the
returned markdown/HTML for common age-gate phrases (e.g. "verify your age", "you must be
21", "must be at least 18", "confirm your date of birth", "age verification"). If found,
do not silently record a generic low-confidence result — instead set `needsVerification:
true` and add a clear note (e.g. in the existing notes/servicesOffered handling, or a new
field if easier) indicating "likely blocked by age gate" so this is visibly different from
"no data available for other reasons" in the dashboard.
**Done when:**
- [ ] A page still showing age-gate language after the action sequence is explicitly
      flagged as age-gate-blocked, not just scored as generic low confidence
- [ ] This flag/note is visible somewhere in the Competitor table or detail panel, not
      just buried in logs

### Section 3: Nominatim etiquette — identify the app properly
**Prompt:** Update the Nominatim request headers in `geocodeNominatim()` from the current
generic `"User-Agent": "FirearmsIntelDashboard/1.0"` to something that identifies the app
with a real contact point, per Nominatim's usage policy
(https://operations.osmfoundation.org/policies/nominatim/), which asks for a valid
User-Agent/Referer identifying the application. Use a format like
`"NJHandgunMarketIntel/1.0 (contact: <site URL or email I give you>)"` — ask me for the
contact value if you don't have one to use.
**Done when:**
- [ ] Nominatim requests send a User-Agent that identifies the app with a real contact
      point
- [ ] No other Nominatim request behavior changes

### Section 4: Geocode caching to reduce redundant Nominatim calls
**Prompt:** Before calling `geocodeNominatim()` for a given business name/county/state,
check whether a `Competitor` row with the same normalized name in that county already has
non-zero `latitude`/`longitude` from a previous scan, and reuse it instead of calling
Nominatim again. This reduces redundant calls to the free service on repeat scans of the
same counties over time.
**Done when:**
- [ ] Re-scanning a county with already-geocoded providers does not re-call Nominatim for
      those same providers
- [ ] New/ungeocoded providers still get geocoded normally

### Section 5: Verify with a real test against a known age-gated site
**Prompt:** After Sections 1-4 are complete, find a real gun retailer or range website
that currently has (or is known to have) an age-verification gate, and run a real scan
that includes it (via the live dashboard, not just the function in isolation). Report in
STATUS.md: which site was tested, what the age gate looked like (button, dropdowns, date
field, etc.), whether the script successfully cleared it and captured real data, or
whether it was correctly flagged as age-gate-blocked instead. If you can't find a
naturally-occurring age-gated site in the current data, say so plainly rather than
fabricating a test result — this is a best-effort feature, not a guaranteed one.
**Done when:**
- [ ] A real test was attempted against a real age-gated (or suspected age-gated) site
- [ ] STATUS.md honestly reports what happened — cleared successfully, or correctly
      flagged as blocked, or "no age-gated site could be identified to test against"
- [ ] Nominatim User-Agent change and geocode caching are also verified with a real scan

---

## Completed Sections

### Phase 5: Make state/county expansion a data change, not a code change — COMPLETE (Aug 20, 2026)
Replaced hardcoded `STATE_BOUNDING_BOX` map with a database-backed `StateBoundingBox`
table; fixed a leftover hardcoded "NJ" in `searchQuery2`; made the Data Collection panel
read states/counties from the `County` table at runtime; added an "Add State or County"
UI control. Verified end-to-end by the user directly: added New Castle County, Delaware
(a genuinely new state, not previously in the system) with a real, looked-up Delaware
bounding box, and ran a real scan that created 31 new `Competitor` rows — confirmed
directly in the database. Also fixed scraper junk-filtering to exclude news sites and law
firm/law office results, confirmed in the deployed code.

### Phase 4: Free industry-outlook indicators (no paid subscriptions) — COMPLETE (Aug 20, 2026)
Added `IndustryIndicator` table (`sourceUrl` enforced NOT NULL) and a manual-entry panel.
Added an "Industry Outlook" report section citing sources as real clickable links. One
correction was needed and verified: a dead source link was replaced with a real, working
one (NJ Attorney General's Permit to Carry Dashboard), confirmed live by direct fetch.

### Phase 3: Prior-year (3–4 year) historical data via the Wayback Machine — COMPLETE (Aug 19-20, 2026)
Added `CompetitorHistory` table and `wayback-history-scan` edge function. Verified with a
real backfill returning real snapshot URLs and prices for a real competitor.

### Phase 2: Build the missing "Generate Report" feature — COMPLETE (Aug 19, 2026)
Added the `generate-report` Supabase Edge Function and report history UI. Verified with a
real generation confirmed live on the public site.

### Phase 1: Fix cross-state geocoding + Overpass state-matching bugs — COMPLETE (Aug 19, 2026)
Fixed the NJ-only bounding box and Overpass state-matching. Verified with a live Bucks
County, PA scan. Confirmed live on the public site.
