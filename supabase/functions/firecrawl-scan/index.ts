const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY") ?? "";
const FIRECRAWL_BASE = "https://api.firecrawl.dev/v2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// Outbound calls get a hard timeout so a slow upstream cannot hang the request.
const UPSTREAM_TIMEOUT_MS = 25_000;
// Upper bound on paid scrape calls per request, so one request cannot fan out
// into unbounded spend against FIRECRAWL_API_KEY.
const MAX_SCRAPES_PER_REQUEST = 12;
// Upper bound on sequential geocoding lookups per request.
const MAX_GEOCODES_PER_REQUEST = 15;

const ALLOWED_PROVIDER_TYPES = new Set([
  "range",
  "private instructor",
  "gun club",
  "retailer",
]);

// Place names only ever contain letters, spaces and a few punctuation marks.
// Anything else is rejected before it can reach the Overpass query language.
const PLACE_NAME_RE = /^[A-Za-z][A-Za-z .'-]{1,59}$/;

// ─── Simple in-memory per-IP rate limit ───────────────────────────────
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateBuckets = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rateBuckets.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (hits.length >= RATE_LIMIT_MAX) {
    rateBuckets.set(ip, hits);
    return true;
  }
  hits.push(now);
  rateBuckets.set(ip, hits);
  if (rateBuckets.size > 5000) {
    for (const [k, v] of rateBuckets) {
      if (v.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) rateBuckets.delete(k);
    }
  }
  return false;
}

// ─── Confirm county/state exist in the County reference table ─────────
async function isKnownPlace(county: string, state: string): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  try {
    const url =
      `${SUPABASE_URL}/rest/v1/County?select=county&limit=1` +
      `&county=eq.${encodeURIComponent(county)}` +
      `&state=eq.${encodeURIComponent(state)}`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!res.ok) return false;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length > 0;
  } catch (e) {
    console.error("County lookup failed:", e);
    return false;
  }
}

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

const REDDIT_DOMAINS = ["reddit.com", "www.reddit.com", "old.reddit.com"];
const JUNK_DOMAINS = [
  "reddit.com", "www.reddit.com", "old.reddit.com",
  "yelp.com", "www.yelp.com",
  "instagram.com", "www.instagram.com",
  "facebook.com", "www.facebook.com",
  "maps.apple.com",
  "anjrpc.org", "www.anjrpc.org",
  "mapquest.com", "www.mapquest.com",
];

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
  /^(the best|best|top)\s+\d+\s/i,
  /^(places to shoot|shooting range close to|beginner friendly)/i,
  /^(all|safe)\s+(indoor\s+and\s+outdoor\s+)?shooting ranges?\s/i,
  /^(all|list of)\s+.+\s(in|near)\s/i,
  /^\d+\s+(best|top|great)\s/i,
  /^watch\b/i,
  /^(fish and wildlife|njdep|dep)\s/i,
  /^(a tour of|tour of)\s/i,
  /^(rod gun|shotgun range|rifle range)$/i,
  /^(union county\s+)?archery range\s+at/i,
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

  // Reject if website is a junk domain
  if (result.website) {
    for (const d of JUNK_DOMAINS) {
      if (result.website.includes(d)) return true;
    }
  }

  return false;
}

// ─── Firecrawl search ────────────────────────────────────────────────
async function firecrawlSearch(
  query: string,
): Promise<{ results: ProviderResult[]; error: string | null }> {
  if (!FIRECRAWL_API_KEY) {
    return { results: [], error: "FIRECRAWL_API_KEY not set" };
  }

  try {
    const res = await fetch(`${FIRECRAWL_BASE}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        limit: 15,
        scrapeOptions: { formats: ["markdown"] },
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!res.ok) {
      // Log the upstream body server-side only; never return it to the caller.
      const body = await res.text().catch(() => "");
      console.error(`Firecrawl search failed (${res.status}):`, body);
      return { results: [], error: "search_unavailable" };
    }

    const json = await res.json();
    const items: Array<{
      title?: string;
      url?: string;
      description?: string;
      markdown?: string;
    }> = json?.data?.web ?? json?.data ?? [];

    const results = items
      .filter((item) => item.title && item.url)
      .filter((item) => !REDDIT_DOMAINS.some((d) => item.url!.includes(d)))
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
        confidence: 70,
        needsVerification: false,
      }));

    return { results, error: null };
  } catch (e) {
    console.error("Firecrawl search exception:", e);
    return { results: [], error: "search_unavailable" };
  }
}

// ─── Firecrawl scrape: verify website + extract phone/services/coords ─
async function firecrawlScrape(
  url: string,
  businessName: string,
): Promise<{
  phone: string;
  servicesOffered: string;
  confidence: number;
  verified: boolean;
  address: string;
  lat: number;
  lon: number;
}> {
  if (!FIRECRAWL_API_KEY || !url) {
    return { phone: "", servicesOffered: "", confidence: 0, verified: false, address: "", lat: 0, lon: 0 };
  }

  try {
    const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "html"],
        onlyMainContent: false,
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!res.ok) {
      return { phone: "", servicesOffered: "", confidence: 0, verified: false, address: "", lat: 0, lon: 0 };
    }

    const json = await res.json();
    const markdown: string = json?.data?.markdown ?? "";
    const html: string = json?.data?.html ?? "";

    // ── Website verification: check if business name appears in <head> tags ──
    let verified = false;
    const normBusiness = businessName.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Extract <title> tag content
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const titleText = titleMatch ? titleMatch[1].toLowerCase().replace(/[^a-z0-9]/g, "") : "";

    // Extract meta tags: og:site_name, og:title, description, keywords
    const metaMatches = html.match(/<meta[^>]+(?:name|property)=["'](?:og:site_name|og:title|description|keywords|author|twitter:title)["'][^>]*content=["']([^"']+)["']/gi) ?? [];
    const metaText = metaMatches
      .map((m) => {
        const cm = m.match(/content=["']([^"']+)["']/i);
        return cm ? cm[1].toLowerCase().replace(/[^a-z0-9]/g, "") : "";
      })
      .join(" ");

    // Check if a significant portion of the business name appears in title or meta
    const checkSubstring = (haystack: string, needle: string): boolean => {
      if (!needle || needle.length < 4) return false;
      // Try full name first, then progressively shorter substrings
      if (haystack.includes(needle)) return true;
      // Try first 8+ chars
      for (let len = Math.min(needle.length - 1, 20); len >= 8; len--) {
        if (haystack.includes(needle.substring(0, len))) return true;
      }
      // Try last 8+ chars
      for (let len = Math.min(needle.length - 1, 20); len >= 8; len--) {
        if (haystack.includes(needle.substring(needle.length - len))) return true;
      }
      return false;
    };

    if (checkSubstring(titleText, normBusiness) || checkSubstring(metaText, normBusiness)) {
      verified = true;
    }

    // ── Extract phone number ──
    const phoneMatch = markdown.match(
      /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
    );
    const phone = phoneMatch ? phoneMatch[0].trim() : "";

    // ── Extract services offered ──
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

    // ── Extract address from markdown ──
    let address = "";
    const addrMatch = markdown.match(
      /(\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Boulevard|Way|Pkwy|Parkway|Hwy|Highway|Ct|Court)\.?,?\s+\w+,\s+[A-Z]{2}\s+\d{5})/,
    );
    if (addrMatch) {
      address = addrMatch[1];
    }

    // ── Extract coordinates from page (schema.org, data-lat, or embedded JSON) ──
    let lat = 0;
    let lon = 0;

    // Try schema.org GeoCoordinates
    const geoMatch = html.match(/"latitude"\s*:\s*"?(-?\d+\.?\d*)"?[^}]*"longitude"\s*:\s*"?(-?\d+\.?\d*)"?/i);
    if (geoMatch) {
      lat = parseFloat(geoMatch[1]);
      lon = parseFloat(geoMatch[2]);
    }

    if (lat === 0 && lon === 0) {
      // Try data-lat / data-lng attributes
      const dataLatMatch = html.match(/data-lat(?:itude)?=["'](-?\d+\.?\d*)["']/i);
      const dataLngMatch = html.match(/data-l(?:ng|on)(?:gitude)?=["'](-?\d+\.?\d*)["']/i);
      if (dataLatMatch && dataLngMatch) {
        lat = parseFloat(dataLatMatch[1]);
        lon = parseFloat(dataLngMatch[1]);
      }
    }

    if (lat === 0 && lon === 0) {
      // Try embedded Google Maps coordinates
      const gmapsMatch = html.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (gmapsMatch) {
        lat = parseFloat(gmapsMatch[1]);
        lon = parseFloat(gmapsMatch[2]);
      }
    }

    return {
      phone,
      servicesOffered,
      confidence: verified ? 25 : 10,
      verified,
      address,
      lat,
      lon,
    };
  } catch {
    return { phone: "", servicesOffered: "", confidence: 0, verified: false, address: "", lat: 0, lon: 0 };
  }
}

// ─── Nominatim geocoding (OpenStreetMap search) ───────────────────────
async function geocodeNominatim(
  businessName: string,
  county: string,
  state: string,
): Promise<{ lat: number; lon: number; address: string } | null> {
  const stateAbbr = STATE_ABBR[state] ?? state;
  // Include state in the query to avoid geocoding to wrong states
  const query = `${businessName} ${stateAbbr}`;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1&countrycodes=us&viewbox=-75.6,41.4,-73.9,38.9&bounded=1`,
      {
        headers: {
          "User-Agent": "FirearmsIntelDashboard/1.0",
        },
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      },
    );

    if (!res.ok) return null;
    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;

    const result = json[0];
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    // Reject results outside NJ bounding box (avoids geocoding to wrong states)
    if (lat < 38.9 || lat > 41.4 || lon < -75.6 || lon > -73.9) {
      return null;
    }

    // Also reject if the display name doesn't contain "New Jersey" or "NJ"
    const display = (result.display_name ?? "").toLowerCase();
    if (!display.includes("new jersey") && !display.includes(", nj")) {
      return null;
    }

    return {
      lat,
      lon,
      address: result.display_name ?? "",
    };
  } catch {
    return null;
  }
}

// ─── OpenStreetMap Overpass API ──────────────────────────────────────
async function searchOverpass(
  county: string,
  state: string,
  providerType: string,
): Promise<{ results: ProviderResult[]; error: string | null }> {
  if (providerType === "private instructor") {
    return { results: [], error: null };
  }

  const tagFilters: Record<string, string[]> = {
    range: [
      'nwr["leisure"="shooting_ground"]',
      'nwr["sport"="shooting"]',
      'nwr["amenity"="shooting_range"]',
      'nwr["leisure"="shooting_range"]',
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
  if (!filters) return { results: [], error: null };

  // Defence in depth: never interpolate a place name into Overpass QL unless it
  // matches the strict place-name shape. The handler validates too.
  if (!PLACE_NAME_RE.test(county) || !PLACE_NAME_RE.test(state)) {
    return { results: [], error: null };
  }

  const tagUnion = filters.map((f) => `${f}(area.searchArea)`).join(";");

  // County-level query with longer timeout
  const overpassQuery = `
[out:json][timeout:90];
area["name"="${state}"]["admin_level"="4"]->.stateArea;
area["name"="${county} County"]["admin_level"~"5|6"](area.stateArea)->.searchArea;
(${tagUnion};);
out center tags;
`.trim();

  const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

  try {
    const res = await fetch(overpassUrl, {
      headers: { "User-Agent": "FirearmsIntelDashboard/1.0" },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`Overpass failed (${res.status})`);
      return { results: [], error: "map_data_unavailable" };
    }
    const json = await res.json();
    const elements: Record<string, unknown>[] = json?.elements ?? [];

    const results = elements.map((el) => {
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

    return { results, error: null };
  } catch (e) {
    console.error("Overpass exception:", e);
    return { results: [], error: "map_data_unavailable" };
  }
}

// ─── Merge results from multiple sources ──────────────────────────────
function mergeResults(
  firecrawlResults: ProviderResult[],
  osmResults: ProviderResult[],
): ProviderResult[] {
  const merged: Map<string, ProviderResult> = new Map();

  // OSM results first (they have coordinates)
  for (const r of osmResults) {
    if (isJunk(r)) continue;
    const key = normalizeName(r.name);
    if (!key) continue;
    merged.set(key, { ...r });
  }

  for (const r of firecrawlResults) {
    if (isJunk(r)) continue;
    const key = normalizeName(r.name);
    if (!key) continue;

    const existing = merged.get(key);
    if (existing) {
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
    const hasAddress = !!r.address && r.address !== `${r.sourceName}`;
    const hasPhone = !!r.phone;

    if (!hasCoords && !hasWebsite) return null;

    let confidence = r.confidence;
    let needsVerification = false;

    if (hasCoords && hasWebsite && hasAddress) {
      confidence = Math.max(confidence, 90);
    } else if (hasWebsite && (hasCoords || hasAddress)) {
      confidence = Math.min(Math.max(confidence, 75), 85);
      if (!hasCoords || !hasPhone) needsVerification = true;
    } else if (hasCoords && !hasWebsite) {
      confidence = Math.min(Math.max(confidence, 65), 75);
      needsVerification = true;
    } else if (hasWebsite && !hasCoords && !hasAddress) {
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

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    // ── Rate limit per client IP ──
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    if (rateLimited(ip)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again shortly." }),
        { status: 429, headers: jsonHeaders },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request." }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const raw = (body ?? {}) as Record<string, unknown>;
    const county = typeof raw.county === "string" ? raw.county.trim() : "";
    const state = typeof raw.state === "string" ? raw.state.trim() : "";
    const providerType =
      typeof raw.providerType === "string" ? raw.providerType.trim() : "";

    if (!county || !state || !providerType) {
      return new Response(
        JSON.stringify({ error: "Missing county, state, or providerType" }),
        { status: 400, headers: jsonHeaders },
      );
    }

    // ── Validate provider type against the known set ──
    if (!ALLOWED_PROVIDER_TYPES.has(providerType)) {
      return new Response(
        JSON.stringify({ error: "Unsupported provider type." }),
        { status: 400, headers: jsonHeaders },
      );
    }

    // ── Validate place names by shape, then against the County reference table ──
    if (!PLACE_NAME_RE.test(county) || !PLACE_NAME_RE.test(state)) {
      return new Response(
        JSON.stringify({ error: "Unrecognized county or state." }),
        { status: 400, headers: jsonHeaders },
      );
    }
    if (!(await isKnownPlace(county, state))) {
      return new Response(
        JSON.stringify({ error: "Unrecognized county or state." }),
        { status: 400, headers: jsonHeaders },
      );
    }

    const typeLabel: Record<string, string> = {
      range: "shooting range",
      "private instructor": "firearms training instructor",
      "gun club": "gun club",
      retailer: "gun store firearms dealer",
    };

    // Use multiple search queries to cast a wider net
    const searchQuery1 = `${typeLabel[providerType] ?? providerType} ${county} County ${state}`;
    const searchQuery2 = `${typeLabel[providerType] ?? providerType} ${county} County NJ site:.com`;

    const [fcResult1, fcResult2, osmResult] = await Promise.all([
      firecrawlSearch(searchQuery1),
      firecrawlSearch(searchQuery2),
      searchOverpass(county, state, providerType),
    ]);

    const debugErrors: string[] = [];
    if (fcResult1.error) debugErrors.push(`Firecrawl1: ${fcResult1.error}`);
    if (fcResult2.error) debugErrors.push(`Firecrawl2: ${fcResult2.error}`);
    if (osmResult.error) debugErrors.push(`Overpass: ${osmResult.error}`);

    // Merge both Firecrawl searches with OSM results
    let merged = mergeResults(
      [...fcResult1.results, ...fcResult2.results],
      osmResult.results,
    );

    // Scrape each Firecrawl-sourced result to verify website and extract data
    const scrapePromises = merged
      .filter((r) => r.website && r.sourceName.includes("Firecrawl"))
      .slice(0, MAX_SCRAPES_PER_REQUEST)
      .map(async (r) => {
        const scraped = await firecrawlScrape(r.website, r.name);
        if (scraped.phone) r.phone = r.phone || scraped.phone;
        if (scraped.servicesOffered) {
          r.servicesOffered = r.servicesOffered || scraped.servicesOffered;
        }
        if (scraped.address && r.address === "") r.address = scraped.address;
        if (scraped.lat !== 0 && scraped.lon !== 0) {
          r.lat = scraped.lat;
          r.lon = scraped.lon;
        }
        if (scraped.verified) {
          r.confidence = Math.min(r.confidence + scraped.confidence, 95);
          r.needsVerification = false;
        } else {
          r.needsVerification = true;
        }
      });
    await Promise.all(scrapePromises);

    // Geocode any results still missing coordinates using Nominatim (sequentially to respect rate limits)
    const needsGeo = merged
      .filter((r) => r.lat === 0 && r.lon === 0 && r.name)
      .slice(0, MAX_GEOCODES_PER_REQUEST);
    for (const r of needsGeo) {
      if (r.lat !== 0) continue; // might have been set by scrape
      const geo = await geocodeNominatim(r.name, county, state);
      if (geo) {
        r.lat = geo.lat;
        r.lon = geo.lon;
        if (!r.address || r.address === `${county}, ${state}`) {
          r.address = geo.address;
        }
        r.confidence = Math.min(r.confidence + 10, 90);
      }
      // Nominatim rate limit: 1 request per second
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }

    merged = applyQualityFlags(merged);

    return new Response(
      JSON.stringify({
        providers: merged,
        totalFound: merged.length,
        flagged: merged.filter((r) => r.needsVerification).length,
        sources: "Firecrawl + OpenStreetMap",
        debug: debugErrors.length > 0 ? debugErrors.join("; ") : undefined,
      }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (err) {
    // Log the detail server-side; return a generic message to the caller.
    console.error("firecrawl-scan failed:", err);
    return new Response(
      JSON.stringify({ error: "Scan failed. Please try again." }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
