import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const UPSTREAM_TIMEOUT_MS = 20_000;
const MAX_YEARS = 4;
const DELAY_BETWEEN_CALLS_MS = 500;

// ─── Price extraction (reused from firecrawl-scan) ─────────────────────
// Matches dollar amounts like $150, $1,200, $99.99 in markdown/text content.
const PRICE_RE = /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;

// Course-type keywords to label extracted prices
const COURSE_KEYWORDS: { pattern: RegExp; label: string }[] = [
  { pattern: /ccw|concealed\s*carry/i, label: "CCW Prep" },
  { pattern: /basic\s*handgun|beginner\s*handgun|introduction\s*to\s*handgun/i, label: "Basic Handgun" },
  { pattern: /private\s*lesson|one[- ]on[- ]one/i, label: "Private Lesson" },
  { pattern: /advanced|defensive|tactical/i, label: "Advanced" },
  { pattern: /nra\s*cert|certification/i, label: "Certification" },
];

function extractPrices(text: string): { courseType: string; price: number }[] {
  const matches: { courseType: string; price: number }[] = [];
  const seen = new Set<string>();

  // Find all dollar amounts with surrounding context
  let m: RegExpExecArray | null;
  PRICE_RE.lastIndex = 0;
  while ((m = PRICE_RE.exec(text)) !== null) {
    const priceStr = m[1].replace(/,/g, "");
    const price = parseFloat(priceStr);
    if (isNaN(price) || price < 10 || price > 2000) continue;

    // Grab ~80 chars of context around the price to identify course type
    const start = Math.max(0, m.index - 80);
    const end = Math.min(text.length, m.index + m[0].length + 80);
    const context = text.slice(start, end);

    let label = "Other";
    for (const kw of COURSE_KEYWORDS) {
      if (kw.pattern.test(context)) {
        label = kw.label;
        break;
      }
    }

    const key = `${label}:${price}`;
    if (seen.has(key)) continue;
    seen.add(key);

    matches.push({ courseType: label, price });
  }

  return matches;
}

// ─── Wayback Machine Availability API ─────────────────────────────────
async function findSnapshot(
  website: string,
  timestamp: string,
): Promise<string | null> {
  const apiUrl =
    `https://archive.org/wayback/available?url=${encodeURIComponent(website)}&timestamp=${timestamp}`;

  try {
    const res = await fetch(apiUrl, {
      headers: { "User-Agent": "FirearmsIntelDashboard/1.0" },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const snapshot = json?.archived_snapshots?.closest;
    if (!snapshot?.available || !snapshot?.url) return null;

    return snapshot.url as string;
  } catch {
    return null;
  }
}

// ─── Fetch archived page content ──────────────────────────────────────
async function fetchArchivedPage(
  snapshotUrl: string,
): Promise<string> {
  try {
    const res = await fetch(snapshotUrl, {
      headers: { "User-Agent": "FirearmsIntelDashboard/1.0" },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!res.ok) return "";

    const html = await res.text();

    // Strip HTML tags to get rough text content for price extraction
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ");

    return text;
  } catch {
    return "";
  }
}

// ─── Insert history rows via REST API ──────────────────────────────────
async function insertHistoryRows(
  rows: { competitorId: string; year: number; courseType: string; price: number; snapshotUrl: string; dataConfidence: number }[],
): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || rows.length === 0) return false;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/CompetitorHistory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(rows),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    return res.ok;
  } catch {
    return false;
  }
}

// ─── Main handler ────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
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
    const competitorId = typeof raw.competitorId === "string" ? raw.competitorId.trim() : "";
    const yearsRaw = Array.isArray(raw.years) ? raw.years : [];

    if (!competitorId) {
      return new Response(
        JSON.stringify({ error: "Missing competitorId" }),
        { status: 400, headers: jsonHeaders },
      );
    }

    // Validate and cap years at MAX_YEARS
    const years = yearsRaw
      .map((y: unknown) => Number(y))
      .filter((y: number) => Number.isInteger(y) && y >= 2000 && y <= 2030)
      .slice(0, MAX_YEARS);

    if (years.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid years provided (1-4 years, 2000-2030)" }),
        { status: 400, headers: jsonHeaders },
      );
    }

    // Fetch the competitor's website from the Competitor table
    let website = "";
    let facilityName = "";
    try {
      const compRes = await fetch(
        `${SUPABASE_URL}/rest/v1/Competitor?id=eq.${encodeURIComponent(competitorId)}&select=website,facilityName`,
        {
          headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        },
      );
      if (compRes.ok) {
        const compRows = await compRes.json();
        if (Array.isArray(compRows) && compRows.length > 0) {
          website = (compRows[0].website as string) ?? "";
          facilityName = (compRows[0].facilityName as string) ?? "";
        }
      }
    } catch {
      // ignore — will fail below if website is empty
    }

    if (!website) {
      return new Response(
        JSON.stringify({ error: "This provider has no website URL on file — cannot look up Wayback Machine snapshots." }),
        { status: 400, headers: jsonHeaders },
      );
    }

    // Process each year sequentially with delay
    const results: {
      year: number;
      snapshotUrl: string | null;
      pricesFound: { courseType: string; price: number }[];
      status: string;
    }[] = [];

    const rowsToInsert: {
      competitorId: string;
      year: number;
      courseType: string;
      price: number;
      snapshotUrl: string;
      dataConfidence: number;
    }[] = [];

    for (let i = 0; i < years.length; i++) {
      const year = years[i];

      // Delay between calls (skip on first iteration)
      if (i > 0) {
        await new Promise((r) => setTimeout(r, DELAY_BETWEEN_CALLS_MS));
      }

      // Use Dec 31 of the target year as the timestamp
      const timestamp = `${year}1231`;
      const snapshotUrl = await findSnapshot(website, timestamp);

      if (!snapshotUrl) {
        results.push({
          year,
          snapshotUrl: null,
          pricesFound: [],
          status: "no_snapshot",
        });
        continue;
      }

      // Fetch and parse the archived page
      const pageText = await fetchArchivedPage(snapshotUrl);
      const prices = extractPrices(pageText);

      if (prices.length === 0) {
        results.push({
          year,
          snapshotUrl,
          pricesFound: [],
          status: "snapshot_found_no_price",
        });
        continue;
      }

      // Queue rows for insertion
      for (const p of prices) {
        rowsToInsert.push({
          competitorId,
          year,
          courseType: p.courseType,
          price: p.price,
          snapshotUrl,
          dataConfidence: 75,
        });
      }

      results.push({
        year,
        snapshotUrl,
        pricesFound: prices,
        status: "ok",
      });
    }

    // Insert all found rows
    let insertedCount = 0;
    if (rowsToInsert.length > 0) {
      const success = await insertHistoryRows(rowsToInsert);
      insertedCount = success ? rowsToInsert.length : 0;
    }

    return new Response(
      JSON.stringify({
        competitorId,
        facilityName,
        website,
        yearsRequested: years,
        results,
        rowsInserted: insertedCount,
      }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (err) {
    console.error("wayback-history-scan failed:", err);
    return new Response(
      JSON.stringify({ error: "History scan failed. Please try again." }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
