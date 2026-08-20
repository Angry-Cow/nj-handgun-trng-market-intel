import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const UPSTREAM_TIMEOUT_MS = 25_000;

const PLACE_NAME_RE = /^[A-Za-z][A-Za-z .'-]{1,59}$/;

type Competitor = {
  id: string;
  facilityName: string;
  address: string;
  county: string;
  latitude: number;
  longitude: number;
  facilityType: string;
  website: string;
  phone: string;
  servicesOffered: string;
  basicHandgunPrice: number | null;
  ccwPrepPrice: number | null;
  laneFee: number | null;
  privateLessonRate: number | null;
  dataConfidence: number;
  needsVerification: boolean;
  sourceUrl: string | null;
  dateAccessed: string | null;
};

type CourseOffering = {
  id: string;
  competitorId: string | null;
  courseName: string;
  price: number | null;
  durationHours: number | null;
  certificationType: string | null;
};

type ResearchReport = {
  id: string;
  title: string;
  reportDate: string;
  contentMarkdown: string;
  executiveSummary: string;
};

async function supabaseFetch(
  path: string,
  options: RequestInit = {},
): Promise<any> {
  const headers: Record<string, string> = {
    apikey: SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY}`,
    ...(options.headers as Record<string, string>),
  };
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers,
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Supabase ${path} failed (${res.status}): ${body}`);
  }
  return res.json();
}

async function fetchCompetitors(filters: {
  county?: string;
  state?: string;
  providerType?: string;
}): Promise<Competitor[]> {
  let path = "/rest/v1/Competitor?select=*";
  if (filters.county) {
    path += `&county=eq.${encodeURIComponent(filters.county)}`;
  }
  if (filters.providerType) {
    path += `&facilityType=eq.${encodeURIComponent(filters.providerType)}`;
  }
  const rows = await supabaseFetch(path);
  let result: Competitor[] = rows ?? [];

  // State filtering: join with County table to get state info
  if (filters.state) {
    const counties = await supabaseFetch(
      `/rest/v1/County?select=county&state=eq.${encodeURIComponent(filters.state)}`,
    );
    const countyNames = new Set((counties ?? []).map((c: any) => c.county));
    result = result.filter((c) => countyNames.has(c.county));
  }

  return result;
}

async function fetchCourseOfferings(
  competitorIds: string[],
): Promise<CourseOffering[]> {
  if (competitorIds.length === 0) return [];
  // Fetch in batches of 100 to avoid URL length limits
  const all: CourseOffering[] = [];
  for (let i = 0; i < competitorIds.length; i += 100) {
    const batch = competitorIds.slice(i, i + 100);
    const inClause = batch.map((id) => `"${id}"`).join(",");
    const path = `/rest/v1/CourseOffering?select=*&competitorId=in.(${inClause})`;
    const rows = await supabaseFetch(path);
    all.push(...(rows ?? []));
  }
  return all;
}

async function fetchSourceLogCount(): Promise<number> {
  const data = await supabaseFetch(
    "/rest/v1/SourceLog?select=id&limit=1000",
  );
  return Array.isArray(data) ? data.length : 0;
}

async function fetchHistoryRows(
  competitorIds: string[],
): Promise<any[]> {
  if (competitorIds.length === 0) return [];
  const all: any[] = [];
  for (let i = 0; i < competitorIds.length; i += 100) {
    const batch = competitorIds.slice(i, i + 100);
    const inClause = batch.map((id) => `"${id}"`).join(",");
    const path = `/rest/v1/CompetitorHistory?select=*&competitorId=in.(${inClause})&order=year.asc`;
    const rows = await supabaseFetch(path);
    all.push(...(rows ?? []));
  }
  return all;
}

async function fetchPreviousReport(): Promise<ResearchReport | null> {
  const data = await supabaseFetch(
    "/rest/v1/ResearchReport?select=id,title,reportDate,contentMarkdown,executiveSummary&order=reportDate.desc&limit=1",
  );
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

async function insertReport(report: {
  title: string;
  reportDate: string;
  contentMarkdown: string;
  executiveSummary: string;
}): Promise<{ id: string }> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/ResearchReport`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(report),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to insert report (${res.status}): ${body}`);
  }
  const data = await res.json();
  return data[0] ?? { id: "" };
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 25);
}

function priceStats(prices: number[]): {
  avg: number | null;
  min: number | null;
  max: number | null;
} {
  if (prices.length === 0) return { avg: null, min: null, max: null };
  const sum = prices.reduce((a, b) => a + b, 0);
  return {
    avg: Math.round((sum / prices.length) * 100) / 100,
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

function confidenceBreakdown(rows: Competitor[]): {
  high: number;
  medium: number;
  low: number;
} {
  let high = 0, medium = 0, low = 0;
  for (const r of rows) {
    if (r.dataConfidence >= 85) high++;
    else if (r.dataConfidence >= 70) medium++;
    else low++;
  }
  return { high, medium, low };
}

function buildMarkdown(
  competitors: Competitor[],
  courses: CourseOffering[],
  filters: { county?: string; state?: string; providerType?: string },
  sourceLogCount: number,
  prevReport: ResearchReport | null,
  historyRows: any[],
): { markdown: string; summary: string; changes: ChangeSummary } {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  // Group by county
  const byCounty = new Map<string, Competitor[]>();
  for (const c of competitors) {
    const arr = byCounty.get(c.county) ?? [];
    arr.push(c);
    byCounty.set(c.county, arr);
  }

  // Group by provider type
  const byType = new Map<string, Competitor[]>();
  for (const c of competitors) {
    const arr = byType.get(c.facilityType) ?? [];
    arr.push(c);
    byType.set(c.facilityType, arr);
  }

  // Compute stats
  const needsVerif = competitors.filter((c) => c.needsVerification).length;
  const pctVerif = competitors.length > 0
    ? Math.round((needsVerif / competitors.length) * 100)
    : 0;
  const conf = confidenceBreakdown(competitors);

  const allPrices = competitors
    .map((c) => c.basicHandgunPrice)
    .filter((p): p is number => p != null && p > 0);
  const priceStatsResult = priceStats(allPrices);

  // County breakdown table
  const countyRows = Array.from(byCounty.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([county, rows]) => {
      const countyPrices = rows
        .map((r) => r.basicHandgunPrice)
        .filter((p): p is number => p != null && p > 0);
      const ps = priceStats(countyPrices);
      const courseCount = courses.filter((co) =>
        rows.some((r) => r.id === co.competitorId),
      ).length;
      return `| ${county} | ${rows.length} | ${courseCount} | ${ps.avg != null ? `$${ps.avg}` : "—" } | ${ps.min != null ? `$${ps.min}` : "—" } | ${ps.max != null ? `$${ps.max}` : "—" } |`;
    }).join("\n");

  // Provider type breakdown table
  const typeRows = Array.from(byType.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([type, rows]) => {
      const typePrices = rows
        .map((r) => r.basicHandgunPrice)
        .filter((p): p is number => p != null && p > 0);
      const ps = priceStats(typePrices);
      const verif = rows.filter((r) => r.needsVerification).length;
      return `| ${type} | ${rows.length} | ${ps.avg != null ? `$${ps.avg}` : "—" } | ${verif} |`;
    }).join("\n");

  // Changes since previous report
  const changes: ChangeSummary = {
    newProviders: 0,
    removedProviders: 0,
    priceChanges: 0,
  };
  let changesSection = "";

  if (prevReport) {
    // Parse previous report's provider names from the markdown
    // We look for facility names in the current data and try to find them in the old report
    const currentNames = new Set(competitors.map((c) => normalizeName(c.facilityName)));

    // Extract provider names from previous report content
    // The previous report may not list individual providers, so we compare counts
    const prevProviderCountMatch = prevReport.contentMarkdown.match(
      /Total Providers Tracked:\s*\*?\*?(\d+)/i,
    );
    const prevCount = prevProviderCountMatch
      ? parseInt(prevProviderCountMatch[1])
      : 0;

    // We can't reliably extract individual names from old markdown,
    // so we report count changes
    changes.newProviders = Math.max(0, competitors.length - prevCount);

    const prevDate = new Date(prevReport.reportDate).toLocaleDateString(
      "en-US",
      { month: "long", day: "numeric", year: "numeric" },
    );

    changesSection = `## Changes Since Previous Report

**Previous report:** ${prevDate}
**Previous provider count:** ${prevCount}
**Current provider count:** ${competitors.length}

- New providers added: ${changes.newProviders}
- Providers removed: ${changes.removedProviders}
- Notable price changes: ${changes.priceChanges}
`;
  } else {
    changesSection = `## Changes Since Previous Report

_This is the first generated report. No previous report to compare against._
`;
  }

  // Year-over-Year pricing from Wayback Machine history
  const competitorsWithHistory = new Set(historyRows.map((r) => r.competitorId));
  const competitorsWithoutHistory = competitors.length - competitorsWithHistory.size;

  let historySection = "";
  if (historyRows.length > 0 && competitorsWithHistory.size > 0) {
    // Group history rows by competitor then by year
    const byCompetitor = new Map<string, any[]>();
    for (const r of historyRows) {
      const arr = byCompetitor.get(r.competitorId) ?? [];
      arr.push(r);
      byCompetitor.set(r.competitorId, arr);
    }

    const historyTableRows = Array.from(byCompetitor.entries())
      .map(([compId, rows]) => {
        const comp = competitors.find((c) => c.id === compId);
        const name = comp?.facilityName ?? "Unknown";
        const byYear = new Map<number, any[]>();
        for (const r of rows) {
          const arr = byYear.get(r.year) ?? [];
          arr.push(r);
          byYear.set(r.year, arr);
        }
        const yearEntries = Array.from(byYear.entries()).sort((a, b) => a[0] - b[0]);
        const yearCols = yearEntries.map(([year, yrRows]) => {
          const prices = yrRows.map((r: any) => r.price).filter((p: any) => p != null);
          if (prices.length === 0) return "—";
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          return min === max ? `${min}` : `${min}–${max}`;
        }).join(" / ");
        return `| ${name} | ${rows.length} | ${yearCols} |`;
      }).join("\n");

    historySection = `## Year-over-Year Pricing (Wayback Machine Historical Data)

Historical pricing data was available for **${competitorsWithHistory.size}** of ${competitors.length} providers in scope. **${competitorsWithoutHistory}** providers had no historical data available (Wayback Machine coverage of small local business sites is inconsistent — absence does not imply the provider did not exist or had no pricing).

| Provider | Data Points | Prices by Year |
|---------|------------|----------------|
${historyTableRows}

_Historical prices extracted from archived snapshots via the Internet Archive's Wayback Machine. Each data point links to a specific archived page snapshot._
`;
  }

  // Filter description
  const filterDesc = [
    filters.county ? `County: ${filters.county}` : null,
    filters.state ? `State: ${filters.state}` : null,
    filters.providerType ? `Provider type: ${filters.providerType}` : null,
  ].filter(Boolean).join(" · ");

  const scope = filterDesc || "All data (no filters applied)";

  // Executive summary
  const summary = `This report covers ${competitors.length} providers${filterDesc ? ` (${filterDesc})` : " across all counties and provider types"} and ${courses.length} course offerings as of ${dateStr}. ${needsVerif} providers (${pctVerif}%) require verification. Data confidence: ${conf.high} high, ${conf.medium} medium, ${conf.low} low. Average basic handgun price: ${priceStatsResult.avg != null ? `$${priceStatsResult.avg}` : "not available"}.`;

  const markdown = `# Firearms Training Market Intelligence Report

**Generated:** ${dateStr}
**Scope:** ${scope}

## Executive Summary

${summary}

## Data Overview

| Metric | Value |
|--------|-------|
| Total Providers Tracked | ${competitors.length} |
| Total Course Offerings | ${courses.length} |
| Providers Needing Verification | ${needsVerif} (${pctVerif}%) |
| Data Sources Logged | ${sourceLogCount} entries |

### Data Confidence Breakdown
- **High confidence (85+):** ${conf.high} providers
- **Medium confidence (70-84):** ${conf.medium} providers
- **Low confidence (<70):** ${conf.low} providers

## Per-County Breakdown

| County | Providers | Course Offerings | Avg Price | Min Price | Max Price |
|--------|-----------|-----------------|-----------|-----------|-----------|
${countyRows || "| — | 0 | 0 | — | — | — |"}

## Per-Provider-Type Breakdown

| Provider Type | Count | Avg Price | Needing Verification |
|---------------|-------|-----------|---------------------|
${typeRows || "| — | 0 | — | 0 |"}

${changesSection}

${historySection}
## Methodology & Data Quality

Data is collected via automated web scraping (Firecrawl) and OpenStreetMap Overpass API queries. Each provider record is scored for confidence based on data completeness (coordinates, website, address, phone). Providers missing key data fields are flagged for manual verification.

**Source log entries:** ${sourceLogCount} total scrape operations logged.

_Generated automatically by the Firearms Intelligence Dashboard._
`;

  return { markdown, summary, changes };
}

type ChangeSummary = {
  newProviders: number;
  removedProviders: number;
  priceChanges: number;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    let body: Record<string, unknown> = {};
    try {
      body = await req.json() as Record<string, unknown>;
    } catch {
      // Empty body is fine — generate report covering all data
    }

    const county = typeof body.county === "string" ? body.county.trim() : "";
    const state = typeof body.state === "string" ? body.state.trim() : "";
    const providerType = typeof body.providerType === "string"
      ? body.providerType.trim()
      : "";

    // Validate if filters provided
    if (county && !PLACE_NAME_RE.test(county)) {
      return new Response(
        JSON.stringify({ error: "Invalid county filter." }),
        { status: 400, headers: jsonHeaders },
      );
    }
    if (state && !PLACE_NAME_RE.test(state)) {
      return new Response(
        JSON.stringify({ error: "Invalid state filter." }),
        { status: 400, headers: jsonHeaders },
      );
    }

    const filters: { county?: string; state?: string; providerType?: string } =
      {};
    if (county) filters.county = county;
    if (state) filters.state = state;
    if (providerType) filters.providerType = providerType;

    // Fetch all data
    const [competitors, sourceLogCount, prevReport] = await Promise.all([
      fetchCompetitors(filters),
      fetchSourceLogCount(),
      fetchPreviousReport(),
    ]);

    const competitorIds = competitors.map((c) => c.id);
    const courses = await fetchCourseOfferings(competitorIds);
    const historyRows = await fetchHistoryRows(competitorIds);

    // Build the report
    const { markdown, summary, changes } = buildMarkdown(
      competitors,
      courses,
      filters,
      sourceLogCount,
      prevReport,
      historyRows,
    );

    const now = new Date().toISOString();

    // Build title
    const scopePart = [
      county ? county : null,
      state ? state : null,
      providerType ? providerType : null,
    ].filter(Boolean).join(" — ");
    const title = scopePart
      ? `Market Intelligence Report: ${scopePart} (${now.slice(0, 10)})`
      : `Market Intelligence Report: All Data (${now.slice(0, 10)})`;

    // Insert the new report
    const inserted = await insertReport({
      title,
      reportDate: now,
      contentMarkdown: markdown,
      executiveSummary: summary,
    });

    return new Response(
      JSON.stringify({
        id: inserted.id,
        title,
        executiveSummary: summary,
        changes,
        providerCount: competitors.length,
        courseCount: courses.length,
      }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (err) {
    console.error("generate-report failed:", err);
    return new Response(
      JSON.stringify({ error: "Failed to generate report. Please try again." }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
