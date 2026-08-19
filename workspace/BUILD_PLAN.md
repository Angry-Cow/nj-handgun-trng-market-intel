# Build Plan

> This file is written by the external model (Magica) and read by Bolt.
> Bolt reads this at the start of each work session.

## Active Plan — Phase 1: Fix cross-state geocoding + Overpass state-matching bugs

_Context: `supabase/functions/firecrawl-scan/index.ts` currently hard-codes a New
Jersey-only bounding box and a "must contain new jersey/nj" text check inside
`geocodeNominatim()`, which silently discards valid results for Pennsylvania counties
(Bucks, Northampton) and any future state. `searchOverpass()` also matches the state
boundary by name only, which can match the wrong same-named area. Fix both without
changing any other scraper behavior._

### Section 1: Fix the NJ-only geocode bounding box in geocodeNominatim()
**Prompt:** In `supabase/functions/firecrawl-scan/index.ts`, `geocodeNominatim()`
currently hard-codes `&viewbox=-75.6,41.4,-73.9,38.9&bounded=1` in the Nominatim request
URL, and rejects any result unless its `lat`/`lon` fall inside that same box AND its
`display_name` contains "new jersey" or ", nj". Replace this with a per-state bounding
box lookup keyed by the `state` parameter already passed into the function — add a
`STATE_BOUNDING_BOX` map (same style as the existing `STATE_ABBR` map) with entries at
least for "New Jersey" and "Pennsylvania". If a state isn't in the map yet, skip the
`viewbox`/`bounded` params and the display-name text check entirely rather than silently
rejecting the result. Replace the hardcoded "new jersey"/", nj" text check with a check
derived from the `STATE_ABBR` map for whichever state was actually requested.
**Done when:**
- [ ] `STATE_BOUNDING_BOX` map exists with New Jersey and Pennsylvania entries
- [ ] A result for a Pennsylvania address is no longer rejected by the bounding box or
      text check
- [ ] A request for a state not in the map still runs (no viewbox filter) instead of
      returning nothing
- [ ] No other function behavior changed

### Section 2: Fix Overpass area matching in searchOverpass()
**Prompt:** In `supabase/functions/firecrawl-scan/index.ts`, `searchOverpass()` builds
`area["name"="${state}"]["admin_level"="4"]->.stateArea;` to find the state boundary,
which can match a same-named area that isn't actually the U.S. state. Change this to
prefer matching by ISO 3166-2 code (e.g. `["ISO3166-2"="US-NJ"]`), derived from the
existing `STATE_ABBR` map (`"US-" + abbreviation`), and keep the current
name+admin_level match only as a fallback if the ISO-tagged area query returns nothing.
**Done when:**
- [ ] Overpass query tries `ISO3166-2` first
- [ ] Falls back to the existing name/admin_level match only if the ISO query returns no
      results
- [ ] Existing New Jersey scans still return the same or better results as before

### Section 3: Verify with a real scan
**Prompt:** After Sections 1 and 2 are complete, run a Data Acquisition scan for Bucks
County, Pennsylvania, provider types "range" and "retailer", and report in STATUS.md how
many results came back with non-zero coordinates vs. before this fix (should be more than
zero now).
**Done when:**
- [ ] Bucks County, PA scan returns at least one result with real lat/lon coordinates
- [ ] STATUS.md includes a before/after comparison note

---

## Completed Sections

<!-- Bolt moves completed sections here with a one-line summary -->

_None yet._
