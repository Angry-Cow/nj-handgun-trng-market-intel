import React, { useState, useCallback } from "react";
import {
  BookOpen, MapPinned, Tag, ClipboardList, FileDown, Printer,
  Sparkles, ChevronDown, ChevronUp, AlertCircle, CheckCircle2,
} from "lucide-react";
import { useQuery, emitRefresh } from "@/lib/useQuery";
import { escapeHtml } from "@/lib/sanitize";

function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handlePrint(title: string, content: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(title)}</title><style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.7; color: #111; }
    h1, h2, h3 { color: #1a1a2e; } pre { background: #f4f4f4; padding: 12px; border-radius: 4px; overflow: auto; }
    code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
    @media print { body { margin: 20px; } }
  </style></head><body><pre style="white-space:pre-wrap;font-family:Georgia,serif;">${escapeHtml(content)}</pre></body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

function extractChangeLine(content: string): string {
  const match = content.match(/## Changes Since Previous Report\s*\n([\s\S]*?)(?=\n##|\n$|$)/);
  if (!match) return "";
  const section = match[1].trim();
  const lines = section.split("\n").filter((l) => l.startsWith("- "));
  if (lines.length > 0) return lines.join(" · ").replace(/^- /g, "");
  const firstPara = section.split("\n\n")[0].replace(/^_+|_+$/g, "").trim();
  return firstPara;
}

export const MethodologySection = () => {
  const { data: reports, isPending: reportsPending, refetch } = useQuery(
    "ResearchReport",
    { orderBy: { reportDate: "desc" }, limit: 5 },
  );

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [genResult, setGenResult] = useState<{
    title: string;
    summary: string;
    changes: { newProviders: number; removedProviders: number; priceChanges: number };
    providerCount: number;
  } | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setGenError("");
    setGenResult(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`Generation failed (${res.status}): ${errBody}`);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setGenResult({
        title: data.title,
        summary: data.executiveSummary,
        changes: data.changes,
        providerCount: data.providerCount,
      });
      refetch();
      emitRefresh("ResearchReport");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setGenError(msg);
    } finally {
      setGenerating(false);
    }
  }, [refetch]);

  const reportList = reports ?? [];
  const latestReport = reportList[0] ?? null;

  return (
    <section className="relative text-white bg-gray-900 shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0.4)_0px_40px_100px_-20px] box-border caret-transparent overflow-hidden p-16 rounded-[48px]">
      <div className="absolute bg-blue-600/20 box-border caret-transparent blur-[120px] h-[500px] w-[500px] -mr-64 -mt-64 rounded-full right-0 top-0"></div>
      <div className="absolute bg-amber-500/10 box-border caret-transparent blur-[100px] h-[300px] w-[300px] -ml-32 -mb-32 rounded-full left-0 bottom-0"></div>
      <div className="relative box-border caret-transparent z-10">
        {/* Header */}
        <div className="items-center box-border caret-transparent flex mb-12">
          <div className="items-center bg-blue-600 shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(11,99,255,0.4)_0px_25px_50px_-12px] box-border caret-transparent flex h-16 justify-center min-h-[auto] min-w-[auto] w-16 mr-6 rounded-2xl">
            <BookOpen className="h-8 w-8" />
          </div>
          <div className="box-border caret-transparent min-h-[auto] min-w-[auto]">
            <h2 className="text-4xl font-bold box-border caret-transparent tracking-[-0.9px] leading-10">
              Methodology &amp; Documentation
            </h2>
            <p className="text-gray-400 font-medium box-border caret-transparent mt-1">
              Authoritative research content and verification protocols.
            </p>
          </div>
        </div>

        <div className="box-border caret-transparent gap-x-20 grid grid-cols-[repeat(1,minmax(0px,1fr))] gap-y-20 md:grid-cols-[repeat(2,minmax(0px,1fr))]">
          {/* Left column: research summary + data quality */}
          <div className="box-border caret-transparent min-h-[auto] min-w-[auto]">
            <div className="box-border caret-transparent">
              <h4 className="text-blue-600 text-xs font-black box-border caret-transparent tracking-[3.6px] leading-4 uppercase mb-6">
                Research Summary
              </h4>
              <p className="text-gray-400 text-lg box-border caret-transparent leading-[29.25px] mb-8">
                This market research was conducted in February 2026, focusing on
                eight key counties in New Jersey. Data was sourced from official
                facility websites, county business registries, and reputable
                industry directories. Verification was performed via direct site
                audits and phone inquiries.
              </p>
              <div className="box-border caret-transparent gap-x-6 grid grid-cols-[repeat(1,minmax(0px,1fr))] gap-y-6 md:grid-cols-[repeat(2,minmax(0px,1fr))]">
                <div className="items-center bg-white/10 box-border caret-transparent flex min-h-[auto] min-w-[auto] border p-4 rounded-2xl border-solid border-white/10">
                  <MapPinned className="text-green-600 shrink-0 h-5 w-5 mr-4 mt-1" />
                  <span className="text-gray-300 text-sm font-medium box-border caret-transparent block leading-5 min-h-[auto] min-w-[auto]">
                    Verified lat/long accuracy within 25 meters.
                  </span>
                </div>
                <div className="items-center bg-white/10 box-border caret-transparent flex min-h-[auto] min-w-[auto] border p-4 rounded-2xl border-solid border-white/10">
                  <Tag className="text-green-600 shrink-0 h-5 w-5 mr-4 mt-1" />
                  <span className="text-gray-300 text-sm font-medium box-border caret-transparent block leading-5 min-h-[auto] min-w-[auto]">
                    Pricing benchmarks updated Feb 7, 2026.
                  </span>
                </div>
              </div>
            </div>
            <div className="backdrop-blur-sm bg-white/10 box-border caret-transparent border mt-10 p-8 rounded-[32px] border-solid border-white/10">
              <h4 className="text-2xl font-bold items-center box-border caret-transparent flex leading-8 mb-6">
                <ClipboardList className="text-blue-600 h-6 w-6 mr-3" />
                Data Quality Standards
              </h4>
              <ul className="text-gray-400 text-sm box-border caret-transparent leading-5 list-none pl-0">
                <li className="items-center box-border caret-transparent flex">
                  <span className="bg-blue-600 box-border caret-transparent block h-1.5 min-h-[auto] min-w-[auto] w-1.5 mr-3 rounded-full"></span>
                  Source priority: Official sites &gt; Registries &gt;
                  Directories
                </li>
                <li className="items-center box-border caret-transparent flex mt-4">
                  <span className="bg-blue-600 box-border caret-transparent block h-1.5 min-h-[auto] min-w-[auto] w-1.5 mr-3 rounded-full"></span>
                  Pricing field protocol: Exact price + Source URL
                </li>
                <li className="items-center box-border caret-transparent flex mt-4">
                  <span className="bg-blue-600 box-border caret-transparent block h-1.5 min-h-[auto] min-w-[auto] w-1.5 mr-3 rounded-full"></span>
                  Geolocation: Validated via Google Maps API
                </li>
              </ul>
            </div>
          </div>

          {/* Right column: report generation + history */}
          <div className="bg-white/10 shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0.05)_0px_2px_4px_0px_inset] box-border caret-transparent flex flex-col h-full min-h-[auto] min-w-[auto] border p-10 rounded-[40px] border-solid border-white/10">
            <div className="items-center box-border caret-transparent flex justify-between min-h-[auto] min-w-[auto] mb-6">
              <h4 className="text-2xl font-bold items-center box-border caret-transparent flex leading-8 min-h-[auto] min-w-[auto]">
                <FileDown className="text-blue-600 h-6 w-6 mr-3" />
                Reports
              </h4>
              <span className="text-gray-500 text-[10px] font-black box-border caret-transparent block tracking-[1px] leading-[15px] min-h-[auto] min-w-[auto] uppercase">
                {reportList.length} of 5 most recent
              </span>
            </div>

            {/* Generate button + result */}
            <div className="mb-6">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold bg-blue-600 text-white px-6 py-3.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Generating report…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate New Report
                  </>
                )}
              </button>

              {genError && (
                <div className="flex items-start gap-2 mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{genError}</span>
                </div>
              )}

              {genResult && (
                <div className="flex items-start gap-2 mt-3 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold mb-1">Report generated successfully</p>
                    <p className="text-gray-300">{genResult.summary}</p>
                    <p className="text-gray-400 mt-1">
                      Changes: {genResult.changes.newProviders} new providers, {genResult.changes.priceChanges} price changes
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Report history list */}
            {reportsPending ? (
              <div className="flex items-center gap-3 text-gray-400 py-8 justify-center">
                <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span className="text-sm">Loading reports…</span>
              </div>
            ) : reportList.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No reports found. Generate one to get started.
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-auto max-h-[500px]">
                {reportList.map((report: any, idx: number) => {
                  const isExpanded = expandedReportId === report.id;
                  const isLatest = idx === 0;
                  const changeLine = extractChangeLine(report.contentMarkdown ?? "");
                  const reportContent = report.contentMarkdown ?? "";
                  const reportTitle = report.title ?? "Untitled Report";

                  return (
                    <div
                      key={report.id}
                      className={`bg-gray-900/50 border rounded-2xl overflow-hidden transition-all ${
                        isLatest
                          ? "border-blue-500/30"
                          : "border-white/10"
                      }`}
                    >
                      {/* Report header row */}
                      <button
                        onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {isLatest && (
                              <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                Latest
                              </span>
                            )}
                            <span className="text-sm font-bold text-gray-200 truncate">
                              {reportTitle}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {fmtDate(report.reportDate)}
                          </p>
                          {changeLine && (
                            <p className="text-[11px] text-gray-400 mt-1 truncate">
                              {changeLine}
                            </p>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-400 shrink-0 ml-2" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 ml-2" />
                        )}
                      </button>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="border-t border-white/10 px-5 py-4">
                          <div className="bg-gray-900/70 border border-white/5 rounded-xl p-4 mb-4 max-h-[300px] overflow-auto">
                            <pre className="whitespace-pre-wrap font-mono text-xs text-gray-300 leading-relaxed">
                              {reportContent}
                            </pre>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => downloadMarkdown(
                                `${reportTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`,
                                reportContent,
                              )}
                              className="flex items-center gap-2 text-xs font-bold text-gray-900 bg-white px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <FileDown className="h-3.5 w-3.5" />
                              Download (MD)
                            </button>
                            <button
                              onClick={() => handlePrint(reportTitle, reportContent)}
                              className="flex items-center gap-2 text-xs font-bold text-white bg-blue-600 px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              Print
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
