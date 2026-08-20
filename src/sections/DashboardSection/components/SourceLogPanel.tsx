import React from "react";
import { useQuery } from "@/lib/useQuery";

const STATUS_STYLES: Record<string, { dot: string; badge: string; label: string }> = {
  Success: {
    dot: "bg-green-500",
    badge: "text-green-700 bg-green-100",
    label: "Success",
  },
  Failed: {
    dot: "bg-red-500",
    badge: "text-red-700 bg-red-100",
    label: "Failed",
  },
  "Pending Verification": {
    dot: "bg-amber-500",
    badge: "text-amber-700 bg-amber-100",
    label: "Pending",
  },
};

function StatusBadge({ status }: { status: string }) {
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES["Pending Verification"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${styles.badge}`}>
      <span className={`block w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      {styles.label}
    </span>
  );
}

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const SourceLogPanel = () => {
  const { data: logs, isPending, error } = useQuery("SourceLog", {
    orderBy: { lastScrapeDate: "desc" },
    limit: 20,
  });

  const successCount = logs?.filter((l) => l.status === "Success").length ?? 0;
  const failedCount = logs?.filter((l) => l.status === "Failed").length ?? 0;
  const pendingCount = logs?.filter((l) => l.status === "Pending Verification").length ?? 0;
  const totalRecords = logs?.reduce((sum, l) => sum + (l.recordsFound ?? 0), 0) ?? 0;

  return (
    <section className="box-border caret-transparent mb-12">
      {/* Header */}
      <div className="items-center box-border caret-transparent flex justify-between mb-6 flex-wrap gap-4">
        <div className="items-center box-border caret-transparent flex gap-4">
          <div className="items-center bg-blue-600 shadow-[rgba(11,99,255,0.3)_0px_8px_24px_-4px] box-border caret-transparent flex h-12 justify-center w-12 rounded-2xl shrink-0">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold box-border caret-transparent tracking-tight leading-8">
              Source Audit Log
            </h2>
            <p className="text-gray-500 text-sm font-medium box-border caret-transparent mt-0.5">
              Data ingestion history and scraping activity trail
            </p>
          </div>
        </div>

        {/* Summary pills */}
        {!isPending && !error && (
          <div className="items-center box-border caret-transparent flex gap-2 flex-wrap">
            <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
              ✓ {successCount} Successful
            </span>
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full">
              ⏳ {pendingCount} Pending
            </span>
            <span className="text-xs font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-full">
              ✗ {failedCount} Failed
            </span>
            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full">
              {totalRecords.toLocaleString()} Records Total
            </span>
          </div>
        )}
      </div>

      {/* Card */}
      <div className="bg-white shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0.05)_0px_1px_3px_0px] box-border caret-transparent border border-gray-100 rounded-3xl overflow-hidden">
        {isPending && (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <svg className="animate-spin h-6 w-6 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm font-medium">Loading audit log…</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-20 text-red-500 gap-2">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Could not load the source log. Please refresh and try again.</span>
          </div>
        )}

        {!isPending && !error && (!logs || logs.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium">No source log entries found.</p>
          </div>
        )}

        {!isPending && !error && logs && logs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-black text-gray-400 tracking-[1.5px] uppercase px-6 py-4">
                    Source Name
                  </th>
                  <th className="text-left text-xs font-black text-gray-400 tracking-[1.5px] uppercase px-4 py-4">
                    Status
                  </th>
                  <th className="text-right text-xs font-black text-gray-400 tracking-[1.5px] uppercase px-4 py-4">
                    Records Found
                  </th>
                  <th className="text-left text-xs font-black text-gray-400 tracking-[1.5px] uppercase px-4 py-4">
                    Last Scraped
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr
                    key={log.id}
                    className={`border-b border-gray-50 transition-colors hover:bg-blue-50/40 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gray-100 shrink-0">
                          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                          </svg>
                        </div>
                        <span className="font-semibold text-gray-800 truncate max-w-[260px]">
                          {log.sourceName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`font-bold tabular-nums ${log.recordsFound > 0 ? "text-gray-800" : "text-gray-400"}`}>
                        {log.recordsFound > 0 ? log.recordsFound.toLocaleString() : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-gray-500 font-medium">
                        {formatDate(log.lastScrapeDate)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-400">
                Showing {logs.length} most recent entr{logs.length !== 1 ? "ies" : "y"}
              </span>
              <span className="text-xs font-medium text-gray-400">
                Sorted by most recent scrape
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
