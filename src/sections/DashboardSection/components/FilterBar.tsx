import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { SlidersHorizontal } from "lucide-react";
import { useQuery } from "@/lib/useQuery";

type FilterBarProps = {
  countyFilter: string[];
  typeFilter: string;
  priceFilter: string;
  onCountyChange: (v: string[]) => void;
  onTypeChange: (v: string) => void;
  onPriceChange: (v: string) => void;
  onReset: () => void;
};

const TYPES = ["range", "private instructor", "gun club", "retailer"];
const PRICES = [
  { label: "All Prices", value: "" },
  { label: "<$100", value: "<100" },
  { label: "$100-$199", value: "100-199" },
  { label: "$200+", value: "200+" },
];

export const FilterBar = ({ countyFilter, typeFilter, priceFilter, onCountyChange, onTypeChange, onPriceChange, onReset }: FilterBarProps) => {
  const { data: countyRows } = useQuery("County", { orderBy: { county: "asc" } });

  // Build a display key "County, State" from each DB row
  const countyOptions = (countyRows ?? []).map((r) => ({
    key: `${r.county}, ${r.state}`,
    countyName: r.county,
    stateName: r.state,
  }));

  const [countyOpen, setCountyOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Compute portal position when opening
  const openDropdown = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + window.scrollY + 8, left: rect.left + window.scrollX });
    }
    setCountyOpen(true);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const inButton = buttonRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inButton && !inDropdown) {
        setCountyOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Recompute position on scroll/resize while open
  useEffect(() => {
    if (!countyOpen) return;
    const update = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPos({ top: rect.bottom + window.scrollY + 8, left: rect.left + window.scrollX });
      }
    };
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [countyOpen]);

  const toggleCounty = (county: string) => {
    if (countyFilter.includes(county)) {
      onCountyChange(countyFilter.filter((c) => c !== county));
    } else {
      onCountyChange([...countyFilter, county]);
    }
  };

  const countyLabel =
    countyFilter.length === 0
      ? "All Counties"
      : countyFilter.length === 1
      ? countyFilter[0]
      : `${countyFilter.length} Counties`;

  const dropdownPortal = countyOpen && dropdownPos
    ? ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          style={{ position: "absolute", top: dropdownPos.top, left: dropdownPos.left, zIndex: 99999 }}
          className="w-52 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Select all / Clear */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <button
              type="button"
              onClick={() => onCountyChange(countyOptions.map((o) => o.key))}
              className="text-[11px] font-bold text-blue-600 hover:underline"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => onCountyChange([])}
              className="text-[11px] font-bold text-gray-400 hover:text-red-500"
            >
              Clear
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {countyOptions.length === 0 && (
              <div className="px-4 py-3 text-xs text-gray-400 italic">Loading counties…</div>
            )}
            {countyOptions.map((opt) => {
              const checked = countyFilter.includes(opt.key);
              return (
                <label
                  key={opt.key}
                  className={`flex items-center gap-3 px-4 py-2 cursor-pointer text-sm transition-colors ${
                    checked ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCounty(opt.key)}
                    className="accent-blue-600 w-4 h-4 shrink-0"
                  />
                  <span className="flex flex-col leading-tight">
                    <span>{opt.countyName}</span>
                    <span className="text-[10px] text-gray-400 font-normal">{opt.stateName}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div className="static md:sticky md:top-24 items-center backdrop-blur-2xl bg-white/90 shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0.25)_0px_25px_50px_-12px] box-border caret-transparent gap-x-4 gap-y-3 md:gap-x-6 md:gap-y-6 flex flex-wrap z-[40] border border-gray-200 p-3 md:p-5 rounded-2xl md:rounded-3xl border-solid w-full">
        <div className="text-blue-600 font-bold items-center box-border caret-transparent flex min-h-[auto] min-w-[auto] mr-4">
          <SlidersHorizontal className="h-5 w-5 mr-2" />
          <span className="box-border caret-transparent hidden min-h-0 min-w-0 md:block md:min-h-[auto] md:min-w-[auto]">
            Intelligence Filters
          </span>
        </div>
        <div className="box-border caret-transparent gap-x-4 flex basis-[0%] grow flex-wrap min-h-[auto] min-w-[auto] gap-y-4 items-center">

          {/* Multi-select county dropdown — portal-rendered to escape stacking context */}
          <div className="relative">
            <button
              ref={buttonRef}
              type="button"
              onClick={() => countyOpen ? setCountyOpen(false) : openDropdown()}
              className={`text-sm font-semibold bg-slate-50 caret-transparent flex items-center gap-2 leading-[normal] min-h-[auto] min-w-[auto] outline-offset-2 outline outline-2 px-3 py-2 md:px-4 md:py-3 rounded-xl transition-colors ${
                countyFilter.length > 0
                  ? "outline-blue-500 text-blue-600"
                  : "outline-transparent border-gray-200"
              }`}
            >
              <span>{countyLabel}</span>
              {countyFilter.length > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                  {countyFilter.length}
                </span>
              )}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 text-gray-400 transition-transform ${countyOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            className="text-sm font-semibold bg-slate-50 caret-transparent block leading-[normal] min-h-[auto] min-w-[auto] outline-transparent outline-offset-2 outline outline-2 border-gray-200 px-3 py-2 md:px-4 md:py-3 rounded-xl"
          >
            <option value="">All Provider Types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>

          <div className="items-center bg-slate-50 box-border caret-transparent flex min-h-[auto] min-w-[auto] border border-gray-200 p-0.5 md:p-1 rounded-xl border-solid">
            {PRICES.map((p) => (
              <button
                key={p.value}
                onClick={() => onPriceChange(p.value)}
                className={`text-xs font-bold caret-transparent block leading-4 min-h-[auto] min-w-[auto] text-center px-2 py-1.5 md:px-3 md:py-2 rounded-lg transition-colors ${
                  priceFilter === p.value
                    ? "text-white bg-blue-600 shadow-[rgba(0,0,0,0.1)_0px_10px_15px_-3px]"
                    : "text-gray-500 bg-transparent"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="box-border caret-transparent gap-x-3 flex min-h-[auto] min-w-[auto] gap-y-3 ml-auto items-center">
          {countyFilter.length > 0 && (
            <div className="flex flex-wrap gap-1 max-w-xs">
              {countyFilter.map((c) => {
                // Show only the county part of "County, State" in the badge
                const label = c.includes(",") ? c.split(",")[0].trim() : c;
                return (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full"
                  >
                    {label}
                    <button
                      type="button"
                      onClick={() => toggleCounty(c)}
                      className="text-blue-400 hover:text-blue-700 leading-none"
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <button
            onClick={onReset}
            className="text-gray-500 text-sm font-bold bg-transparent caret-transparent block leading-5 min-h-[auto] min-w-[auto] text-center px-4 py-2 hover:text-blue-600 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
      {dropdownPortal}
    </>
  );
};
