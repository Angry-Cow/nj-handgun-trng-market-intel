import React from "react";
import { useQuery } from "@/lib/useQuery";

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
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.7; color: #111; }
    h1, h2, h3 { color: #1a1a2e; } pre { background: #f4f4f4; padding: 12px; border-radius: 4px; overflow: auto; }
    code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
    @media print { body { margin: 20px; } }
  </style></head><body><pre style="white-space:pre-wrap;font-family:Georgia,serif;">${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

export const MethodologySection = () => {
  const { data: reports, isPending: reportsPending } = useQuery("ResearchReport", {
    orderBy: { reportDate: "desc" },
    limit: 1,
  });

  const report = reports?.[0] ?? null;
  const reportTitle = report?.title ?? "Market Research Report: Firearms Training";
  const reportContent = report?.contentMarkdown ?? "";
  const reportDate = report?.reportDate
    ? new Date(report.reportDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "February 7, 2026";
  const summary = report?.executiveSummary ?? "Demand for firearms safety and handgun training in New Jersey&#39;s selected counties remained meaningful after the post‑2020 sales surge...";

  return (
    <section className="relative text-white bg-gray-900 shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0.4)_0px_40px_100px_-20px] box-border caret-transparent overflow-hidden p-16 rounded-[48px]">
      <div className="absolute bg-blue-600/20 box-border caret-transparent blur-[120px] h-[500px] w-[500px] -mr-64 -mt-64 rounded-full right-0 top-0"></div>
      <div className="absolute bg-amber-500/10 box-border caret-transparent blur-[100px] h-[300px] w-[300px] -ml-32 -mb-32 rounded-full left-0 bottom-0"></div>
      <div className="relative box-border caret-transparent z-10">
        <div className="items-center box-border caret-transparent flex mb-12">
          <div className="items-center bg-blue-600 shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(11,99,255,0.4)_0px_25px_50px_-12px] box-border caret-transparent flex h-16 justify-center min-h-[auto] min-w-[auto] w-16 mr-6 rounded-2xl">
            <img
              src="https://c.animaapp.com/mn5696zt0wUcrM/assets/icon-20.svg"
              alt="Icon"
              className="box-border caret-transparent h-8 w-8"
            />
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
                  <img
                    src="https://c.animaapp.com/mn5696zt0wUcrM/assets/icon-21.svg"
                    alt="Icon"
                    className="text-green-600 box-border caret-transparent shrink-0 h-5 w-5 mr-4 mt-1"
                  />
                  <span className="text-gray-300 text-sm font-medium box-border caret-transparent block leading-5 min-h-[auto] min-w-[auto]">
                    Verified lat/long accuracy within 25 meters.
                  </span>
                </div>
                <div className="items-center bg-white/10 box-border caret-transparent flex min-h-[auto] min-w-[auto] border p-4 rounded-2xl border-solid border-white/10">
                  <img
                    src="https://c.animaapp.com/mn5696zt0wUcrM/assets/icon-22.svg"
                    alt="Icon"
                    className="text-green-600 box-border caret-transparent shrink-0 h-5 w-5 mr-4 mt-1"
                  />
                  <span className="text-gray-300 text-sm font-medium box-border caret-transparent block leading-5 min-h-[auto] min-w-[auto]">
                    Pricing benchmarks updated Feb 7, 2026.
                  </span>
                </div>
              </div>
            </div>
            <div className="backdrop-blur-sm bg-white/10 box-border caret-transparent border mt-10 p-8 rounded-[32px] border-solid border-white/10">
              <h4 className="text-2xl font-bold items-center box-border caret-transparent flex leading-8 mb-6">
                <img
                  src="https://c.animaapp.com/mn5696zt0wUcrM/assets/icon-23.svg"
                  alt="Icon"
                  className="text-blue-600 box-border caret-transparent h-6 w-6 mr-3"
                />
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
          <div className="bg-white/10 shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0.05)_0px_2px_4px_0px_inset] box-border caret-transparent flex flex-col h-full min-h-[auto] min-w-[auto] border p-10 rounded-[40px] border-solid border-white/10">
            <div className="items-center box-border caret-transparent flex justify-between min-h-[auto] min-w-[auto] mb-8">
              <h4 className="text-2xl font-bold items-center box-border caret-transparent flex leading-8 min-h-[auto] min-w-[auto]">
                <img
                  src="https://c.animaapp.com/mn5696zt0wUcrM/assets/icon-24.svg"
                  alt="Icon"
                  className="text-blue-600 box-border caret-transparent h-6 w-6 mr-3"
                />
                Full Report
              </h4>
            <span className="text-gray-500 text-[10px] font-black box-border caret-transparent block tracking-[1px] leading-[15px] min-h-[auto] min-w-[auto] uppercase">
                Markdown Format
              </span>
            </div>

            {/* Report preview panel */}
            <div className="bg-gray-900/50 box-border caret-transparent basis-[0%] grow max-h-[400px] min-h-[auto] min-w-[auto] border overflow-auto mb-8 p-6 rounded-2xl border-solid border-white/10">
              {reportsPending ? (
                <div className="flex items-center gap-3 text-gray-400 py-8 justify-center">
                  <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span className="text-sm">Loading report…</span>
                </div>
              ) : reportContent ? (
                <pre className="whitespace-pre-wrap font-mono text-xs text-gray-300 leading-relaxed">{reportContent}</pre>
              ) : (
                <div className="box-border caret-transparent">
                  <h1 className="text-xl font-bold box-border caret-transparent leading-7 mb-4">{reportTitle}</h1>
                  <p className="text-gray-400 box-border caret-transparent mb-4">Date: {reportDate}</p>
                  <h2 className="text-lg font-bold box-border caret-transparent leading-7 mb-2">Executive Summary</h2>
                  <p className="text-gray-400 box-border caret-transparent mb-4">{summary}</p>
                  <p className="text-gray-500 text-xs italic box-border caret-transparent leading-4 mt-8">
                    No report content found in database.
                  </p>
                </div>
              )}
            </div>

            <div className="box-border caret-transparent gap-x-4 flex flex-col min-h-[auto] min-w-[auto] gap-y-4 md:flex-row">
              <button
                disabled={!reportContent || reportsPending}
                onClick={() => downloadMarkdown(
                  `${reportTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`,
                  reportContent
                )}
                className="text-gray-900 text-xs font-black items-center bg-white shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(255,255,255,0.1)_0px_25px_50px_-12px] caret-transparent gap-x-2 flex basis-[0%] grow justify-center tracking-[1.2px] leading-4 min-h-[auto] min-w-[auto] gap-y-2 text-center uppercase px-0 py-5 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                <img
                  src="https://c.animaapp.com/mn5696zt0wUcrM/assets/icon-25.svg"
                  alt="Icon"
                  className="box-border caret-transparent h-4 w-4"
                />
                Download (MD)
              </button>
              <button
                disabled={!reportContent || reportsPending}
                onClick={() => handlePrint(reportTitle, reportContent)}
                className="text-xs font-black items-center bg-blue-600 shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(11,99,255,0.2)_0px_25px_50px_-12px] caret-transparent gap-x-2 flex basis-[0%] grow justify-center tracking-[1.2px] leading-4 min-h-[auto] min-w-[auto] gap-y-2 text-center uppercase px-0 py-5 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                <img
                  src="https://c.animaapp.com/mn5696zt0wUcrM/assets/icon-26.svg"
                  alt="Icon"
                  className="box-border caret-transparent h-4 w-4"
                />
                Print Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
