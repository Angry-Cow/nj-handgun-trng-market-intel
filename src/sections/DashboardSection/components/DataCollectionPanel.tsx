import React, { useState, useMemo, useRef, useCallback } from "react";
import { useQuery } from "@/lib/useQuery";
import { useMutation } from "@/lib/useMutation";

const ALL_TYPES = ["range", "private instructor", "gun club", "retailer"];

const STATUS_STYLES: Record<
  string,
  { dot: string; badge: string; label: string }
> = {
  complete: {
    dot: "bg-green-500",
    badge: "bg-green-100 text-green-700",
    label: "Complete",
  },
  running: {
    dot: "bg-blue-500 animate-pulse",
    badge: "bg-blue-100 text-blue-700",
    label: "Running",
  },
  pending: {
    dot: "bg-amber-400",
    badge: "bg-amber-100 text-amber-700",
    label: "Pending",
  },
  failed: {
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700",
    label: "Failed",
  },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES["pending"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${s.badge}`}
    >
      <span className={`block w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type RunConfig = {
  states: string[];
  counties: string[];
  types: string[];
  yearStart: number;
  yearEnd: number;
  trigger: "manual" | "scheduled";
};

const DEFAULT_CONFIG: RunConfig = {
  states: [],
  counties: [],
  types: [],
  yearStart: 2023,
  yearEnd: 2028,
  trigger: "manual",
};

export const DataCollectionPanel = () => {
  const {
    data: runs,
    isPending,
    error,
  } = useQuery("DataCollectionRun", {
    orderBy: { runDate: "desc" },
  });
  const {
    create,
    update,
    remove,
    isPending: isMutating,
  } = useMutation("DataCollectionRun");
  const { create: createCompetitor } = useMutation("Competitor");

  // Fetch all counties from DB
  const { data: countyRecords, isPending: countiesLoading } = useQuery(
    "County",
    {
      orderBy: { state: "asc" },
    },
  );

  const [config, setConfig] = useState<RunConfig>(DEFAULT_CONFIG);
  const [expandConfig, setExpandConfig] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [launchError, setLaunchError] = useState("");
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runProgress, setRunProgress] = useState<Record<string, string>>({});
  const abortRef = useRef<boolean>(false);

  // Derive unique sorted states from county records
  const allStates = useMemo(() => {
    if (!countyRecords) return [];
    return Array.from(new Set(countyRecords.map((c) => c.state))).sort();
  }, [countyRecords]);

  // Counties filtered by selected states (or all if no state selected)
  const filteredCounties = useMemo(() => {
    if (!countyRecords) return [];
    const records =
      config.states.length > 0
        ? countyRecords.filter((c) => config.states.includes(c.state))
        : countyRecords;
    return Array.from(new Set(records.map((c) => c.county))).sort();
  }, [countyRecords, config.states]);

  // All counties in selected states (for select-all scope)
  const allCountiesInSelectedStates = useMemo(
    () => filteredCounties,
    [filteredCounties],
  );

  const toggleState = (s: string) => {
    setConfig((prev) => {
      const newStates = prev.states.includes(s)
        ? prev.states.filter((x) => x !== s)
        : [...prev.states, s];
      // Remove deselected-state counties from county list
      const validCounties = countyRecords
        ? countyRecords
            .filter(
              (c) => newStates.length === 0 || newStates.includes(c.state),
            )
            .map((c) => c.county)
        : [];
      return {
        ...prev,
        states: newStates,
        counties: prev.counties.filter((c) => validCounties.includes(c)),
      };
    });
  };

  const toggleCounty = (c: string) => {
    setConfig((prev) => ({
      ...prev,
      counties: prev.counties.includes(c)
        ? prev.counties.filter((x) => x !== c)
        : [...prev.counties, c],
    }));
  };

  const toggleType = (t: string) => {
    setConfig((prev) => ({
      ...prev,
      types: prev.types.includes(t)
        ? prev.types.filter((x) => x !== t)
        : [...prev.types, t],
    }));
  };

  const handleLaunch = async () => {
    if (config.counties.length === 0) {
      setLaunchError("Select at least one county.");
      return;
    }
    if (config.types.length === 0) {
      setLaunchError("Select at least one provider type.");
      return;
    }
    if (config.yearStart > config.yearEnd) {
      setLaunchError("Year range start must be ≤ end.");
      return;
    }
    setLaunchError("");
    try {
      const created = await create({
        runDate: new Date(),
        status: "pending",
        countiesIncluded: JSON.stringify(config.counties),
        providerTypesIncluded: JSON.stringify(config.types),
        yearRangeStart: config.yearStart,
        yearRangeEnd: config.yearEnd,
        triggeredBy: config.trigger,
      });
      const runId = created?.id;
      setConfig(DEFAULT_CONFIG);
      setExpandConfig(false);
      // Auto-start the run immediately
      if (runId) {
        await executeRun(runId, config.counties, config.types);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to queue run.";
      setLaunchError(msg);
    }
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

  // ─── Call edge function for server-side scraping ──────────────────────
  const scanProviders = useCallback(
    async (
      county: string,
      state: string,
      providerType: string,
    ): Promise<{
      providers: ProviderResult[];
      totalFound: number;
      flagged: number;
      sources: string;
    }> => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const apiUrl = `${supabaseUrl}/functions/v1/firecrawl-scan`;

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ county, state, providerType }),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`Scan failed (${res.status}): ${errBody}`);
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      return {
        providers: data.providers ?? [],
        totalFound: data.totalFound ?? 0,
        flagged: data.flagged ?? 0,
        sources: data.sources ?? "Firecrawl + OpenStreetMap",
      };
    },
    [],
  );

  // ─── Core run execution logic (shared by Queue Run and Start) ────────
  const executeRun = useCallback(
    async (
      runId: string,
      counties: string[],
      types: string[],
    ) => {
      // Find the state for each county from countyRecords
      const countyStateMap: Record<string, string> = {};
      (countyRecords ?? []).forEach((c) => {
        countyStateMap[c.county] = c.state;
      });

      abortRef.current = false;
      setRunningId(runId);
      setRunProgress((p) => ({ ...p, [runId]: "Starting…" }));

      let totalScanned = 0;
      let newRecords = 0;
      let flagged = 0;
      let errorLog = "";

      try {
        await update(runId, { status: "running" });

        for (const county of counties) {
          if (abortRef.current) break;
          const state = countyStateMap[county] ?? "New Jersey";

          for (const pType of types) {
            if (abortRef.current) break;
            setRunProgress((p) => ({
              ...p,
              [runId]: `Scanning ${county} › ${pType}…`,
            }));

            let scanResult: {
              providers: ProviderResult[];
              totalFound: number;
              flagged: number;
              sources: string;
            } | null = null;
            try {
              scanResult = await scanProviders(county, state, pType);
            } catch (e) {
              errorLog += `Error scanning ${county}/${pType}: ${e instanceof Error ? e.message : e}\n`;
            }

            const results = scanResult?.providers ?? [];
            totalScanned += results.length;
            flagged += scanResult?.flagged ?? 0;

            for (const r of results) {
              if (abortRef.current) break;
              try {
                await createCompetitor({
                  facilityName:
                    r.name ||
                    `${pType.charAt(0).toUpperCase() + pType.slice(1)} in ${county}`,
                  address: r.address || `${county}, ${state}`,
                  county: county,
                  latitude: r.lat,
                  longitude: r.lon,
                  facilityType: pType,
                  website: r.website || "",
                  phone: r.phone || "",
                  servicesOffered: r.servicesOffered || pType,
                  dataConfidence: r.confidence,
                  needsVerification: r.needsVerification,
                  sourceUrl: r.sourceUrl,
                  dateAccessed: new Date(),
                  notes: `Auto-collected via ${r.sourceName} — ${county}, ${state}`,
                });
                newRecords++;
              } catch (e) {
                flagged++;
                errorLog += `Failed to save ${r.name}: ${e instanceof Error ? e.message : e}\n`;
              }
            }
          }
        }

        const finalStatus = abortRef.current ? "failed" : "complete";
        await update(runId, {
          status: finalStatus,
          totalProvidersScanned: totalScanned,
          newRecordsCreated: newRecords,
          recordsUpdated: 0,
          recordsFlagged: flagged,
          errorLog: errorLog || undefined,
        });
        const sourcesSummary = "Firecrawl + OpenStreetMap";
        setRunProgress((p) => ({
          ...p,
          [runId]: abortRef.current
            ? "Cancelled."
            : `Done — ${newRecords} new record${newRecords !== 1 ? "s" : ""} added (${sourcesSummary}).`,
        }));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await update(runId, { status: "failed", errorLog: msg }).catch(
          () => {},
        );
        setRunProgress((p) => ({ ...p, [runId]: `Failed: ${msg}` }));
      } finally {
        setRunningId(null);
      }
    },
    [countyRecords, update, createCompetitor, scanProviders],
  );

  // ─── Start a pending run from the history table ──────────────────────
  const handleStartRun = useCallback(
    async (runId: string) => {
      const run = runs?.find((r) => r.id === runId);
      if (!run) return;

      let counties: string[] = [];
      let types: string[] = [];
      try {
        counties = JSON.parse(run.countiesIncluded);
      } catch {}
      try {
        types = JSON.parse(run.providerTypesIncluded);
      } catch {}

      await executeRun(runId, counties, types);
    },
    [runs, executeRun],
  );

  const handleCancelRun = () => {
    abortRef.current = true;
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      setConfirmDelete(null);
    } catch (err) {
      console.error("Failed to delete run:", err);
    }
  };

  // Aggregate stats
  const totalRuns = runs?.length ?? 0;
  const completeRuns = runs?.filter((r) => r.status === "complete").length ?? 0;
  const totalNewRecords =
    runs?.reduce((s, r) => s + (r.newRecordsCreated ?? 0), 0) ?? 0;
  const totalFlagged =
    runs?.reduce((s, r) => s + (r.recordsFlagged ?? 0), 0) ?? 0;

  return (
    <section
      id="data-collection"
      className="box-border caret-transparent mb-12"
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center bg-blue-600 shadow-[rgba(11,99,255,0.3)_0px_8px_24px_-4px] h-12 w-12 rounded-2xl shrink-0">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight leading-8">
              Data Acquisition &amp; Scraping
            </h2>
            <p className="text-gray-500 text-sm font-medium mt-0.5">
              Configure and launch collection runs across counties and provider
              types
            </p>
          </div>
        </div>

        {/* Summary pills */}
        {!isPending && !error && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full">
              {totalRuns} Run{totalRuns !== 1 ? "s" : ""}
            </span>
            <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
              ✓ {completeRuns} Complete
            </span>
            <span className="text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1.5 rounded-full">
              +{totalNewRecords} New Records
            </span>
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full">
              ⚑ {totalFlagged} Flagged
            </span>
          </div>
        )}
      </div>

      {/* Launch new run card */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-[rgba(0,0,0,0.05)_0px_1px_3px] overflow-hidden mb-6">
        <button
          type="button"
          onClick={() => setExpandConfig((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/60 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 bg-blue-600 rounded-xl shrink-0">
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">
                Configure New Collection Run
              </p>
              <p className="text-xs text-gray-400 font-medium">
                Set states, counties, provider types, year range and launch
              </p>
            </div>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${expandConfig ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {expandConfig && (
          <div className="border-t border-gray-100 px-6 pb-6 pt-5 space-y-6">
            {/* ── States ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-black text-gray-500 tracking-widest uppercase">
                  States
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((p) => ({ ...p, states: [...allStates] }))
                    }
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                    disabled={countiesLoading}
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((p) => ({ ...p, states: [], counties: [] }))
                    }
                    className="text-[11px] font-bold text-gray-400 hover:text-red-500"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {countiesLoading ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium py-2">
                  <svg
                    className="animate-spin h-4 w-4 text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Loading states…
                </div>
              ) : allStates.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">
                  No states found — add counties via the County Reference panel
                  first.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allStates.map((s) => {
                    const sel = config.states.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleState(s)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                          sel
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-slate-50 text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Counties ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-black text-gray-500 tracking-widest uppercase">
                  Counties
                  {config.states.length > 0 && (
                    <span className="ml-2 text-indigo-400 normal-case font-semibold tracking-normal">
                      ({config.states.join(", ")})
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((p) => ({
                        ...p,
                        counties: [...allCountiesInSelectedStates],
                      }))
                    }
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                    disabled={countiesLoading}
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => setConfig((p) => ({ ...p, counties: [] }))}
                    className="text-[11px] font-bold text-gray-400 hover:text-red-500"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {countiesLoading ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium py-2">
                  <svg
                    className="animate-spin h-4 w-4 text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Loading counties…
                </div>
              ) : filteredCounties.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">
                  {config.states.length > 0
                    ? "No counties found for the selected state(s)."
                    : "No counties in database — add them via the County Reference panel."}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {filteredCounties.map((c) => {
                    const sel = config.counties.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCounty(c)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                          sel
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-50 text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Provider Types ── */}
            <div>
              <label className="text-xs font-black text-gray-500 tracking-widest uppercase block mb-3">
                Provider Types
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_TYPES.map((t) => {
                  const sel = config.types.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleType(t)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                        sel
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-50 text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Year range + trigger ── */}
            <div className="flex flex-wrap gap-6 items-end">
              <div>
                <label className="text-xs font-black text-gray-500 tracking-widest uppercase block mb-2">
                  Year Range Start
                </label>
                <input
                  type="number"
                  min={2020}
                  max={2035}
                  value={config.yearStart}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      yearStart: parseInt(e.target.value) || 2023,
                    }))
                  }
                  className="text-sm bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 w-28 outline-none focus:outline-blue-400 focus:outline-2"
                />
              </div>
              <div>
                <label className="text-xs font-black text-gray-500 tracking-widest uppercase block mb-2">
                  Year Range End
                </label>
                <input
                  type="number"
                  min={2020}
                  max={2035}
                  value={config.yearEnd}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      yearEnd: parseInt(e.target.value) || 2028,
                    }))
                  }
                  className="text-sm bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 w-28 outline-none focus:outline-blue-400 focus:outline-2"
                />
              </div>
              <div>
                <label className="text-xs font-black text-gray-500 tracking-widest uppercase block mb-2">
                  Trigger Source
                </label>
                <select
                  value={config.trigger}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      trigger: e.target.value as "manual" | "scheduled",
                    }))
                  }
                  className="text-sm bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:outline-blue-400 focus:outline-2 text-gray-700 min-w-[140px]"
                >
                  <option value="manual">Manual</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
            </div>

            {/* Preview summary */}
            {(config.states.length > 0 ||
              config.counties.length > 0 ||
              config.types.length > 0) && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-xs text-blue-700 font-medium space-y-1">
                {config.states.length > 0 && (
                  <p>
                    <span className="font-black">
                      States ({config.states.length}):
                    </span>{" "}
                    {config.states.join(", ")}
                  </p>
                )}
                {config.counties.length > 0 && (
                  <p>
                    <span className="font-black">
                      Counties ({config.counties.length}):
                    </span>{" "}
                    {config.counties.join(", ")}
                  </p>
                )}
                {config.types.length > 0 && (
                  <p>
                    <span className="font-black">
                      Types ({config.types.length}):
                    </span>{" "}
                    {config.types
                      .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
                      .join(", ")}
                  </p>
                )}
                <p>
                  <span className="font-black">Year window:</span>{" "}
                  {config.yearStart} – {config.yearEnd}
                </p>
              </div>
            )}

            {launchError && (
              <p className="text-xs text-red-500 font-semibold">
                {launchError}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleLaunch}
                disabled={isMutating}
                className="flex items-center gap-2 text-sm font-bold bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {isMutating ? "Queuing…" : "Queue Run"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfig(DEFAULT_CONFIG);
                  setLaunchError("");
                  setExpandConfig(false);
                }}
                className="text-sm font-bold text-gray-500 hover:text-gray-700 px-4 py-2.5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Run history table */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-[rgba(0,0,0,0.05)_0px_1px_3px] overflow-hidden">
        {isPending && (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <svg
              className="animate-spin h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <span className="text-sm font-medium">Loading run history…</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-20 text-red-500 gap-2">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium">
              Failed to load run history: {error.message}
            </span>
          </div>
        )}

        {!isPending && !error && (!runs || runs.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <svg
              className="h-12 w-12 text-gray-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <p className="text-sm font-medium">No collection runs yet.</p>
            <p className="text-xs text-gray-300 font-medium">
              Configure and queue a run above to get started.
            </p>
          </div>
        )}

        {!isPending && !error && runs && runs.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs font-black text-gray-400 tracking-[1.5px] uppercase px-6 py-4">
                      Run Date
                    </th>
                    <th className="text-left text-xs font-black text-gray-400 tracking-[1.5px] uppercase px-4 py-4">
                      Status
                    </th>
                    <th className="text-left text-xs font-black text-gray-400 tracking-[1.5px] uppercase px-4 py-4">
                      Scope
                    </th>
                    <th className="text-right text-xs font-black text-gray-400 tracking-[1.5px] uppercase px-4 py-4">
                      Scanned
                    </th>
                    <th className="text-right text-xs font-black text-gray-400 tracking-[1.5px] uppercase px-4 py-4">
                      New
                    </th>
                    <th className="text-right text-xs font-black text-gray-400 tracking-[1.5px] uppercase px-4 py-4">
                      Updated
                    </th>
                    <th className="text-right text-xs font-black text-gray-400 tracking-[1.5px] uppercase px-4 py-4">
                      Flagged
                    </th>
                    <th className="text-left text-xs font-black text-gray-400 tracking-[1.5px] uppercase px-4 py-4">
                      Trigger
                    </th>
                    <th className="px-4 py-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run, idx) => {
                    let counties: string[] = [];
                    let types: string[] = [];
                    try {
                      counties = JSON.parse(run.countiesIncluded);
                    } catch {}
                    try {
                      types = JSON.parse(run.providerTypesIncluded);
                    } catch {}
                    const isExpanded = expandedRunId === run.id;

                    return (
                      <React.Fragment key={run.id}>
                        <tr
                          className={`border-b border-gray-50 transition-colors cursor-pointer hover:bg-blue-50/30 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                          onClick={() =>
                            setExpandedRunId(isExpanded ? null : run.id)
                          }
                        >
                          <td className="px-6 py-4">
                            <span className="font-semibold text-gray-800 text-sm">
                              {fmtDate(run.runDate)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge status={run.status} />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                              {counties.slice(0, 3).map((c) => (
                                <span
                                  key={c}
                                  className="text-[10px] font-bold bg-slate-100 text-gray-600 px-2 py-0.5 rounded-full"
                                >
                                  {c}
                                </span>
                              ))}
                              {counties.length > 3 && (
                                <span className="text-[10px] font-bold bg-slate-100 text-gray-500 px-2 py-0.5 rounded-full">
                                  +{counties.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span
                              className={`font-bold tabular-nums ${run.totalProvidersScanned ? "text-gray-800" : "text-gray-300"}`}
                            >
                              {run.totalProvidersScanned ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span
                              className={`font-bold tabular-nums ${run.newRecordsCreated ? "text-green-700" : "text-gray-300"}`}
                            >
                              {run.newRecordsCreated != null
                                ? `+${run.newRecordsCreated}`
                                : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span
                              className={`font-bold tabular-nums ${run.recordsUpdated ? "text-blue-700" : "text-gray-300"}`}
                            >
                              {run.recordsUpdated ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span
                              className={`font-bold tabular-nums ${run.recordsFlagged ? "text-amber-600" : "text-gray-300"}`}
                            >
                              {run.recordsFlagged ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${run.triggeredBy === "manual" ? "bg-gray-100 text-gray-500" : "bg-purple-100 text-purple-600"}`}
                            >
                              {run.triggeredBy}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1">
                              {/* ▶ Start button for pending runs */}
                              {run.status === "pending" &&
                                runningId !== run.id && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartRun(run.id);
                                    }}
                                    disabled={!!runningId}
                                    className="flex items-center gap-1 text-xs font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors"
                                    title="Start this run"
                                  >
                                    <svg
                                      className="h-3 w-3"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                    Start
                                  </button>
                                )}
                              {/* ⏹ Cancel button while running */}
                              {runningId === run.id && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelRun();
                                  }}
                                  className="flex items-center gap-1 text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  <svg
                                    className="h-3 w-3"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <rect x="6" y="6" width="12" height="12" />
                                  </svg>
                                  Cancel
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedRunId(isExpanded ? null : run.id);
                                }}
                                className="text-gray-400 hover:text-blue-500 p-1 rounded transition-colors"
                                title="Details"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </button>
                              {confirmDelete === run.id ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(run.id);
                                    }}
                                    disabled={isMutating}
                                    className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 px-2 py-1 rounded-lg transition-colors"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDelete(null);
                                    }}
                                    className="text-xs font-bold text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg"
                                  >
                                    No
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDelete(run.id);
                                  }}
                                  className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                                  title="Delete"
                                >
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Progress row while running */}
                        {runningId === run.id && runProgress[run.id] && (
                          <tr className="bg-blue-50/50">
                            <td colSpan={9} className="px-6 py-2">
                              <div className="flex items-center gap-2 text-xs text-blue-700 font-semibold">
                                <svg
                                  className="animate-spin h-3.5 w-3.5 text-blue-500 shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8H4z"
                                  />
                                </svg>
                                {runProgress[run.id]}
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Expanded detail row */}
                        {isExpanded && (
                          <tr
                            className={
                              idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                            }
                          >
                            <td colSpan={9} className="px-6 pb-5 pt-1">
                              <div className="bg-slate-50 border border-gray-100 rounded-2xl p-5 text-sm space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <p className="text-[11px] font-black text-gray-400 tracking-widest uppercase mb-1">
                                      Counties ({counties.length})
                                    </p>
                                    <p className="text-gray-700 font-medium text-xs leading-relaxed">
                                      {counties.join(", ") || "—"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-black text-gray-400 tracking-widest uppercase mb-1">
                                      Provider Types
                                    </p>
                                    <p className="text-gray-700 font-medium text-xs leading-relaxed">
                                      {types
                                        .map(
                                          (t) =>
                                            t.charAt(0).toUpperCase() +
                                            t.slice(1),
                                        )
                                        .join(", ") || "—"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-black text-gray-400 tracking-widest uppercase mb-1">
                                      Year Window
                                    </p>
                                    <p className="text-gray-700 font-medium text-xs">
                                      {run.yearRangeStart} – {run.yearRangeEnd}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-black text-gray-400 tracking-widest uppercase mb-1">
                                      Run ID
                                    </p>
                                    <p className="text-gray-400 font-mono text-[10px] truncate">
                                      {run.id}
                                    </p>
                                  </div>
                                </div>
                                {run.errorLog && (
                                  <div>
                                    <p className="text-[11px] font-black text-red-400 tracking-widest uppercase mb-1">
                                      Error Log
                                    </p>
                                    <pre className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 whitespace-pre-wrap font-mono leading-relaxed">
                                      {run.errorLog}
                                    </pre>
                                  </div>
                                )}
                                {run.notes && (
                                  <div>
                                    <p className="text-[11px] font-black text-gray-400 tracking-widest uppercase mb-1">
                                      Notes
                                    </p>
                                    <p className="text-gray-600 text-xs">
                                      {run.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-400">
                {runs.length} run{runs.length !== 1 ? "s" : ""} recorded
              </span>
              <span className="text-xs font-medium text-gray-400">
                Sorted by most recent
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
