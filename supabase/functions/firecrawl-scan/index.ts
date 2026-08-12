import { createClient } from "npm:@supabase/supabase-js@2.112.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY") ?? "";
const FIRECRAWL_BASE = "https://api.firecrawl.dev/v2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const STATE_ABBR: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR",
  California: "CA", Colorado: "CO", Connecticut: "CT", Delaware: "DE",
  Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID",
  Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS",
  Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS",
  Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK",
  Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT",
  Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV",
  Wisconsin: "WI", Wyoming: "WY", "District of Columbia": "DC", "Puerto Rico": "PR",
};

type ProviderResult = {
  name: string;
  address: string;
  lat: number;
  lon: number;
  website: string;
  phone: string;
  servicesOffered: string;
  sourceUrl: string;
  sourceName: string;
  confidence: number;
  needsVerification: boolean;
};

// ─── Firecrawl search ────────────────────────────────────────────────
async function firecrawlSearch(query: string): Promise<ProviderResult[]> {
  if (!FIRECRAWL_API_KEY) return [];

  try {
    const res = await fetch(`${FIRECRAWL_BASE}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        limit: 10,
        scrapeOptions: { formats: ["markdown"] },
      }),
    });

    if (!res.ok) return [];
    const json = await res.json();
    const items: Array<{
      title?: string;
      url?: string;
      description?: string;
      markdown?: string;
    }> = json?.data ?? [];

    return items
      .filter((item) => item.title && item.url)
      .map((item) => ({
        name: item.title!.trim(),
        address: "",
        lat: 0,
        lon: 0,
        website: item.url ?? "",
        phone: "",
        servicesOffered: "",
        sourceUrl: item.url ?? "",
        sourceName: "Firecrawl Search",
        confidence: 75,
        needsVerification: false,
      }));
  } catch {
    return [];
  }
}

// ─── Firecrawl scrape (extract phone/pricing/services from a page) ───
async function firecrawlScrape(
  url: string,
): Promise<{ phone: string; servicesOffered: string; confidence: number }> {
  if (!FIRECRAWL_API_KEY || !url) return { phone: "", servicesOffered: "", confidence: 0 };

  try {
    const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    if (!res.ok) return { phone: "", servicesOffered: "", confidence: 0 };
    const json = await res.json();
    const markdown: string = json?.data?.markdown ?? "";

    // Extract phone number (US format)
    const phoneMatch = markdown.match(
      /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
    );
    const phone = phoneMatch ? phoneMatch[0].trim() : "";

    // Extract services / courses keywords
    const serviceKeywords = [
      "basic handgun", "ccw", "concealed carry", "nra", "private lesson",
      "range rental", "rifle", "shotgun", "defensive handgun", "women",
      "beginner", "advanced", "simulator", "trap", "skeet", "competition",
    ];
    const found = serviceKeywords.filter((kw) =>
      markdown.toLowerCase().includes(kw),
    );
    const servicesOffered = found
      .map((kw) => kw.charAt(0).toUpperCase() + kw.slice(1))
      .join(", ");

    return { phone, servicesOffered, confidence: 15 };
  } catch {
    return { phone: "", servicesOffered: "", confidence: 0 };
  }
}

// ─── OpenStreetMap Overpass API ──────────────────────────────────────
async function searchOverpass(
  county: string,
  state: string,
  providerType: string,
): Promise<ProviderResult[]> {
  if (providerType === "private instructor") return [];

  const tagFilters: Record<string, string[]> = {
    range: [
      'nwr["leisure"="shooting_ground"]',
      'nwr["sport"="shooting"]',
      'nwr["amenity"="shooting_range"]',
      'nwr["leisure"="shooting_range"]',
      'nwr["sport"="shooting"]["shooting"="indoor_range"]',
    ],
    "gun club": [
      'nwr["leisure"="shooting_ground"]',
      'nwr["leisure"="shooting_club"]',
      'nwr["club"="shooting"]',
      'nwr["sport"="shooting"]',
    ],
    retailer: [
      'nwr["shop"="guns"]',
      'nwr["shop"="gun"]',
      'nwr["shop"="weapons"]',
      'nwr["shop"="firearm"]',
      'nwr["shop"="hunting"]',
    ],
  };

  const filters = tagFilters[providerType];
  if (!filters) return [];

  const stateAbbr = STATE_ABBR[state] ?? state;
  const tagUnion = filters.map((f) => `${f}(area.searchArea)`).join(";");

  const overpassQuery = `
[out:json][timeout:45];
area["name"="${state}"]["admin_level"="4"]->.stateArea;
area["name"="${county} County"]["admin_level"~"5|6"](area.stateArea)->.searchArea;
(${tagUnion};);
out center tags;
`.trim();

  const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

  try {
    const res = await fetch(overpassUrl);
    if (!res.ok) return [];
    const json = await res.json();
    let elements: Record<string, unknown>[] = json?.elements ?? [];

    // Fallback: broader state-level search if county query returned nothing
    if (elements.length === 0) {
      const fallbackQuery = `
[out:json][timeout:45];
area["ISO3166-2"="US-${stateAbbr}"]->.searchArea;
(${tagUnion};);
out center tags;
`.trim();
      const res2 = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(fallbackQuery)}`,
      );
      if (res2.ok) {
        const json2 = await res2.json();
        elements = json2?.elements ?? [];
      }
    }

    return elements.map((el) => {
      const tags = (el.tags as Record<string, string>) ?? {};
      const lat =
        (el.lat as number) ?? (el.center as Record<string, number>)?.lat ?? 0;
      const lon =
        (el.lon as number) ?? (el.center as Record<string, number>)?.lon ?? 0;
      const houseNum = tags["addr:housenumber"] ?? "";
      const street = tags["addr:street"] ?? "";
      const city = tags["addr:city"] ?? county;
      const postcode = tags["addr:postcode"] ?? "";
      const addrParts = [
        houseNum && street ? `${houseNum} ${street}` : street,
        city,
        state,
        postcode,
      ].filter(Boolean);
      return {
        name:
          tags.name ||
          tags["name:en"] ||
          `${providerType.charAt(0).toUpperCase() + providerType.slice(1)} in ${county}`,
        address: addrParts.join(", ") || `${county}, ${state}`,
        lat,
        lon,
        website: tags.website ?? tags["contact:website"] ?? "",
        phone: tags["phone"] ?? tags["contact:phone"] ?? "",
        servicesOffered: providerType,
        sourceUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
        sourceName: "OpenStreetMap Overpass",
        confidence: 80,
        needsVerification: false,
      };
    });
  } catch {
    return [];
  }
}

// ─── Normalize name for dedup ─────────────────────────────────────────
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 25);
}

// ─── Junk detection ───────────────────────────────────────────────────
const JUNK_NAME_PATTERNS = [
  /^(range|gun club|retailer|instructor|shooting range|firearm|store|shop)\s+(in|near|at)\s/i,
  /^(shooting|firearms?|guns?)\s*$/i,
  /^unknown\s/i,
  /^n\/a$/i,
  /^test\b/i,
];

const CATEGORY_LABELS = new Set([
  "range", "gun club", "retailer", "private instructor",
  "shooting range", "firearms", "gun store", "gun shop",
  "shooting", "firearm", "gun",
]);

function isJunk(result: ProviderResult): boolean {
  const name = result.name.trim();
  if (!name) return true;
  if (name.length < 3) return true;
  if (name.length > 200) return true;

  for (const pattern of JUNK_NAME_PATTERNS) {
    if (pattern.test(name)) return true;
  }

  if (CATEGORY_LABELS.has(name.toLowerCase().trim())) return true;

  // No address AND no website AND no coordinates = junk
  if (
    !result.address &&
    !result.website &&
    result.lat === 0 &&
    result.lon === 0
  ) {
    return true;
  }

  return false;
}

// ─── Merge results from multiple sources ──────────────────────────────
function mergeResults(
  firecrawlResults: ProviderResult[],
  osmResults: ProviderResult[],
): ProviderResult[] {
  const merged: Map<string, ProviderResult> = new Map();

  // Add OSM results first (they have coordinates)
  for (const r of osmResults) {
    if (isJunk(r)) continue;
    const key = normalizeName(r.name);
    if (!key) continue;
    merged.set(key, { ...r });
  }

  // Merge Firecrawl results
  for (const r of firecrawlResults) {
    if (isJunk(r)) continue;
    const key = normalizeName(r.name);
    if (!key) continue;

    const existing = merged.get(key);
    if (existing) {
      // Enrich existing record with Firecrawl data
      if (!existing.website && r.website) existing.website = r.website;
      if (!existing.phone && r.phone) existing.phone = r.phone;
      if (!existing.servicesOffered && r.servicesOffered) {
        existing.servicesOffered = r.servicesOffered;
      }
      existing.sourceName = `${existing.sourceName} + Firecrawl`;
      existing.confidence = Math.min(existing.confidence + 10, 95);
    } else {
      merged.set(key, { ...r });
    }
  }

  return Array.from(merged.values());
}

// ─── Apply quality scoring and flagging ───────────────────────────────
function applyQualityFlags(results: ProviderResult[]): ProviderResult[] {
  return results.map((r) => {
    const hasCoords = r.lat !== 0 && r.lon !== 0;
    const hasWebsite = !!r.website;
    const hasAddress = !!r.address;
    const hasPhone = !!r.phone;

    // Reject: no coords AND no website (already filtered by isJunk, but double-check)
    if (!hasCoords && !hasWebsite) return null;

    let confidence = r.confidence;
    let needsVerification = false;

    if (hasCoords && hasWebsite && hasAddress) {
      // Full data — high confidence
      confidence = Math.max(confidence, 90);
    } else if (hasWebsite && (hasCoords || hasAddress)) {
      // Good but maybe missing one piece
      confidence = Math.min(Math.max(confidence, 75), 85);
      if (!hasCoords || !hasPhone) needsVerification = true;
    } else if (hasCoords && !hasWebsite) {
      // OSM-only, no website found
      confidence = Math.min(Math.max(confidence, 65), 75);
      needsVerification = true;
    } else if (hasWebsite && !hasCoords && !hasAddress) {
      // Firecrawl-only, no location data
      confidence = Math.min(Math.max(confidence, 55), 65);
      needsVerification = true;
    }

    return {
      ...r,
      confidence,
      needsVerification,
    } as ProviderResult;
  }).filter((r): r is ProviderResult => r !== null);
}

// ─── Main handler ────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const {
      county,
      state,
      providerType,
    }: { county: string; state: string; providerType: string } =
      await req.json();

    if (!county || !state || !providerType) {
      return new Response(
        JSON.stringify({ error: "Missing county, state, or providerType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build search query based on provider type
    const typeLabel: Record<string, string> = {
      range: "shooting range",
      "private instructor": "firearms training instructor",
      "gun club": "gun club",
      retailer: "gun store firearms dealer",
    };
    const searchQuery = `${typeLabel[providerType] ?? providerType} ${county} County ${state}`;

    // Run Firecrawl search and OSM Overpass in parallel
    const [firecrawlResults, osmResults] = await Promise.all([
      firecrawlSearch(searchQuery),
      searchOverpass(county, state, providerType),
    ]);

    // Merge results
    let merged = mergeResults(firecrawlResults, osmResults);

    // Scrape each provider website that has a URL (enrich with phone/services)
    const scrapePromises = merged
      .filter((r) => r.website && r.sourceName.includes("Firecrawl"))
      .map(async (r) => {
        const scraped = await firecrawlScrape(r.website);
        if (scraped.phone) r.phone = r.phone || scraped.phone;
        if (scraped.servicesOffered) {
          r.servicesOffered = r.servicesOffered || scraped.servicesOffered;
        }
        r.confidence = Math.min(r.confidence + scraped.confidence, 95);
      });
    await Promise.all(scrapePromises);

    // Apply quality flags and filter
    merged = applyQualityFlags(merged);

    // Optionally save to database if service role key is available
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      for (const r of merged) {
        try {
          await supabase.from("Competitor").insert({
            facilityName: r.name,
            address: r.address || `${county}, ${state}`,
            county,
            latitude: r.lat,
            longitude: r.lon,
            facilityType: providerType,
            website: r.website,
            phone: r.phone,
            servicesOffered: r.servicesOffered || providerType,
            dataConfidence: r.confidence,
            needsVerification: r.needsVerification,
            sourceUrl: r.sourceUrl,
            dateAccessed: new Date().toISOString(),
            notes: `Auto-collected via ${r.sourceName} — ${county}, ${state}`,
          });
        } catch {
          // Continue even if individual inserts fail
        }
      }
    }

    return new Response(
      JSON.stringify({
        providers: merged,
        totalFound: merged.length,
        flagged: merged.filter((r) => r.needsVerification).length,
        sources: "Firecrawl + OpenStreetMap",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
