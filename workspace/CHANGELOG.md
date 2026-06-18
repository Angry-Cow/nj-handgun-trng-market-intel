<instructions>
## 🚨 MANDATORY: CHANGELOG TRACKING 🚨

You MUST maintain this file to track your work across messages. This is NON-NEGOTIABLE.

---

## INSTRUCTIONS

- **MAX 5 lines** per entry - be concise but informative
- **Include file paths** of key files modified or discovered
- **Note patterns/conventions** found in the codebase
- **Sort entries by date** in DESCENDING order (most recent first)
- If this file gets corrupted, messy, or unsorted -> re-create it. 
- CRITICAL: Updating this file at the END of EVERY response is MANDATORY.
- CRITICAL: Keep this file under 300 lines. You are allowed to summarize, change the format, delete entries, etc., in order to keep it under the limit.

</instructions>

<changelog>

## 2026-06-18 (tactical-course-directory)
- Added `searchTacticalCourseDirectory()` to `DataCollectionPanel.tsx` as Source 2
- Queries `https://www.tacticalcoursedirectory.com/search?state=&q=` via `proxiedFetch` (corsproxy.io → allorigins fallback)
- Parses listing cards from HTML using multiple fallback selectors; falls back to href-based extraction
- Results merged with Overpass in `searchProviders()`; run summary updated to "Overpass OSM + Tactical Course Directory"
- Covers all provider types including private instructors (not available via Overpass/OSM)

## 2026-04-06 (debug-cleanup)
- Removed all `__ANIMA_DBG__` debug console logs from `DataCollectionPanel.tsx`
- Added TODO item to fix Overpass NJ area disambiguation (MA/SC returned instead of NJ)
- Fix: use OSM relation ID `admin_level=4` + `ISO3166-2=US-NJ` to pin state unambiguously

## 2026-04-06 (overpass-fix)
- Removed non-functional NRA/USCCA scrapers — no public API, JS-rendered pages don't work via CORS proxy
- Improved Overpass query: added `leisure=shooting_ground`, `sport=shooting`, `shop=hunting` tags per OSM wiki
- Fixed Overpass area query to properly nest county within state; added state-wide fallback
- Private instructors still unsupported (no free source has instructor directory data without auth)

## 2026-04-05 (data-acquisition-state-county)
- Fixed `ALL_COUNTIES is not defined` crash in `DataCollectionPanel.tsx`
- Added state selection row above counties: derives unique sorted states from `useQuery("County")` DB records
- State chips use indigo color scheme to visually distinguish from county chips (blue)
- County chip list filters dynamically to only counties belonging to selected states; selecting/deselecting a state auto-prunes county selection
- Clearing states also clears counties; "Select All" for counties scoped to currently visible (filtered) set
- Preview summary now shows States, Counties, Types, and year window

## 2026-04-05 (data-acquisition)
## 2026-04-05 (data-acquisition)
- Created `DataCollectionPanel.tsx` — full Data Acquisition & Scraping section wired to `DataCollectionRun` entity
- Configure run: multi-select counties (15 NJ counties), provider types, year range (start/end), trigger source
- Collapsible config form with preview summary; queues a `pending` run via `useMutation("DataCollectionRun").create`
- Run history table: status badge, county scope chips, scanned/new/updated/flagged counts, trigger type, delete with confirm
- Expandable detail row per run shows full county list, provider types, year window, run ID, errorLog, notes
- Added "Data Acquisition" nav link in `NavLinks.tsx`; panel inserted above `SourceLogPanel` in `DashboardSection/index.tsx`

## 2026-04-05 (courses-tab)
- `ProviderDetailPanel.tsx` — added Overview / Courses tab bar below the panel header
- `useQuery("CourseOffering", { where: { competitorId } })` fetches live course records per provider
- Courses tab renders cards: course name, type badge (color-coded), price, duration, capacity, cert body, confidence score
- Empty state shown when no CourseOffering records exist; spinner while loading
- Tab resets to "overview" when a new competitor is selected; edit mode only available on Overview tab

## 2026-04-05 (revert-clustering)
- `MapContainer.tsx` — reverted `buildClusters` from two-pass union-find back to the original single-pass grid-snap
- Removed density ring layers from `makeClusterIcon`; restored plain gradient circle with count label
- No other files changed

## 2026-04-05 (county-dropdown-db)
- `FilterBar.tsx` — county list now sourced from `useQuery("County", { orderBy: { county: "asc" } })` instead of hardcoded array
- Each dropdown row shows county name + state subtitle (small gray text)
- `countyOptions` built as `{ key: "County, State", countyName, stateName }` tuples; filter uses full "County, State" key
- Badges trim to county name only for compact display
- "Select All" uses live `countyOptions` array; loading state shows "Loading counties…" placeholder

## 2026-04-05 (filterbar-portal-dropdown)
- `FilterBar.tsx` — county dropdown now renders via `ReactDOM.createPortal` into `document.body`
- Eliminates stacking-context clipping from the sticky FilterBar container
- `buttonRef` + `getBoundingClientRect()` computes portal position; updates on scroll/resize while open
- Added `mt-6` spacer div between FilterBar and MapPanel in `DashboardSection/index.tsx`
- `dropdownRef` outside-click handler checks both button and portal div to avoid spurious closes

## 2026-04-05 (intelligence-references-v3)
- `IntelligenceReferences.tsx` — surfaced real SDK error messages in `handleAdd`, `handleSaveEdit`, `handleDelete`
- `create({ county, state })` via `useMutation("County")` was already correctly wired to write to the County DB table
- Removed silent `catch {}` blocks; errors now shown inline in the UI with actual SDK error message
- Added `setAddError("")` / `setEditError("")` before the async call to clear stale errors on retry

## 2026-04-05 (intelligence-references-v2)
## 2026-04-05 (intelligence-references-v2)
- `IntelligenceReferences.tsx` — each card now shows county name + state subtitle
- Add form: county name input + 52-option state dropdown (50 states + DC + Puerto Rico); defaults to New Jersey
- Edit mode: expands card vertically with county input + state dropdown + Save/Cancel buttons
- Removed hardcoded `where: { state: "New Jersey" }` filter — all county records shown regardless of state
- Dupe check now scoped to county+state pair (not county name alone)

## 2026-04-05 (cluster-v2)
- Upgraded `buildClusters()` in `MapContainer.tsx`: two-pass greedy merge (grid-snap + union-find on adjacent cells)
- Fixes border-straddling false splits in dense counties (Union, Essex, Hudson)
- Cluster icons now have 3 density tiers (small/medium/large) with inner halo + outer pulse rings
- `makeClusterIcon()` uses concentric ring layers (ring1 = core+10, ring2 = core+22) for visual density signal
- No external deps; CLUSTER_RADIUS = 40px; DISABLE_CLUSTER_AT_ZOOM = 13 unchanged

## 2026-04-05 (provider-detail-panel)
- Created `ProviderDetailPanel.tsx` — fixed slide-in drawer (right side) with full field display + inline edit
- Clicking any table row opens the panel; "fly to" button triggers map fly-to via `externalSelectedId` prop on `MapPanel`
- Edit mode renders form inputs in-place per section (Contact, Pricing, Facility, Data Quality, Notes); saves via `useMutation("Competitor").update`
- `DashboardSection/index.tsx` lifts `selectedProviderId` + `mapFlyToId` state; panel closes via backdrop or ✕
- Actions column in table uses `e.stopPropagation()` so edit/delete buttons don&#39;t trigger the row-click panel open

## 2026-04-05 (geocoding)
- Added Nominatim OSM geocoding to `AddCompetitorModal.tsx` — fires on address `onBlur` and on "Next" click
- `geocodeAddress()` calls `nominatim.openstreetmap.org/search` (no API key, US-only filter)
- Inline status indicator: spinner while loading, green ✓ + coords when found, amber ⚠ when not found
- On submit, resolved coords are written to `latitude`/`longitude`; fallback to existing coords; last resort 0,0
- Edit mode: only re-geocodes if address changed or existing coords are 0/missing

## 2026-04-05 (latest)
- Replaced MapLibre GL with Leaflet + OpenStreetMap raster tiles in `MapContainer.tsx`
- Removed `maplibre-gl` dep; added `leaflet` + `@types/leaflet` to `package.json`
- Leaflet uses standard raster tiles — no WebGL, no vector tile workers, no refresh blank-map issues
- All marker features preserved: color by type, dim/active filter state, popups, fly-to, fit-bounds, needsVerification badge
- MapLegend z-index uses `z-[1000]` (Leaflet&#39;s layer stack) to stay on top

## 2026-04-05
- Edit button on competitor rows now opens `AddCompetitorModal` in edit mode (pre-populated with all fields)
- `AddCompetitorModal` gains `editData` + `onUpdate` props; detects edit vs. create mode via `isEditMode` flag
- Removed inline row editing state (`editingId`, `editForm`, `startEdit`, `saveEdit`) from `CompetitorTable/index.tsx`
- Modal title changes to "Edit Competitor" and submit button shows "Save Changes" in edit mode
- Latitude/longitude preserved from original record on update

## 2026-04-05 (prev)
- Synced map dots with FilterBar: active dots stay colored, filtered-out dots go gray+30% opacity
- `MapContainer.tsx` accepts new `filteredIds: Set<string> | null` prop; new `applyMarkerState()` helper
- `MapPanel/index.tsx` computes `filteredIds` from county+type filters, passes to MapContainer
- Map auto-fits to filtered subset on filter change; badge shows "X of Y shown"
- Clicking dimmed markers is blocked; selection clears if selected item leaves filter scope

## 2026-04-05 (prev)
- Added NJ state outline polygon to `MapContainer.tsx` — ~60 vertices traced from NJ DEP/USGS boundary, projected via `toSVG()`
- Polygon sits below grid lines, county labels, and dots; styled with `#e8eef7` fill + `#9aaec8` stroke
- Removed `__ANIMA_DBG__ toSVG` console log (no longer needed)
- Fixed `MapContainer.tsx` SVG dot placement — viewBox `0 0 312 600`, cosine correction at mid-lat ~40.15°
- All 11 county labels positioned at geographic centroids; `nj-outline` TODO completed

## 2026-04-05

- Verified `EnrollmentChart` + `PricingChart` — both use `useQuery` from SDK, zero static arrays
- `EnrollmentChart` queries `MarketForecast` (county: Statewide, orderBy: year asc) — 6 DB records confirmed
- `PricingChart` queries `Competitor` and derives tier pcts + avg from live `ccwPrepPrice` fields
- DB confirmed: MarketForecast has all 6 statewide years (12,400→20,600 enrollments, $2.28M→$3.79M revenue)
- `charts-live-data` TODO removed — fully verified

## 2026-04-05
- Wired `MethodologySection.tsx` Report Download + Print buttons to live `ResearchReport` DB query
- `useQuery("ResearchReport", { orderBy: { reportDate: "desc" }, limit: 1 })` fetches most recent report
- Preview panel now renders real `contentMarkdown` as `<pre>` with scroll; shows spinner while loading
- `downloadMarkdown()` creates a Blob + `<a>` click — downloads `.md` file with sanitized filename
- `handlePrint()` opens new window with formatted HTML, calls `window.print()`; buttons disabled when no data

## 2026-04-04
- Built `SourceLogPanel.tsx` — audit trail table with status badges (Success/Failed/Pending), records count, last scraped date
- Panel shows summary pills (counts per status + total records) in the header
- Wired into `DashboardSection/index.tsx` between `CompetitorTable` and `MethodologySection`
- Queries `SourceLog` via `useQuery("SourceLog", { orderBy: { lastScrapeDate: "desc" } })`
- Handles isPending / error / empty states gracefully

## 2026-04-04
- Added `AddCompetitorModal.tsx` — 2-step modal form (Basic Info → Pricing & Details) wired to `useMutation("Competitor").create`
- Added "+ Add Competitor" button to `TableFilters.tsx` via new `onAddNew` prop
- Modal validates required fields (facilityName, address, phone) before advancing steps
- All 21 NJ counties and all 4 facility types available as dropdowns
- `index.tsx` imports modal, passes `create` + `isMutating` down

## 2026-04-04
- Added `REPORT_SEED_DATA` (full 6-section markdown report) to `src/data/seedData.ts`
- Added `SOURCE_LOG_SEED_DATA` (15 audit trail entries) to `src/data/seedData.ts`
- Added `ResearchReportDraft` and `SourceLogDraft` types to `src/data/types.ts`
- `DataSeeder.tsx` import of these exports now resolves correctly — seeder unblocked

</changelog>
