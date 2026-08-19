import { Download } from "lucide-react";

type TableFiltersProps = {
  search: string;
  onSearchChange: (v: string) => void;
  onExportCSV: () => void;
  onAddNew: () => void;
  total: number;
  selectedCount: number;
  onBulkDelete: () => void;
  isBulkDeleting: boolean;
  onClearSelection: () => void;
};

export const TableFilters = ({ search, onSearchChange, onExportCSV, onAddNew, total, selectedCount, onBulkDelete, isBulkDeleting, onClearSelection }: TableFiltersProps) => {
  return (
    <div className="mb-10">
      <div className="items-start box-border caret-transparent gap-x-6 flex flex-col justify-between gap-y-6 md:items-center md:flex-row">
        <div className="box-border caret-transparent min-h-[auto] min-w-[auto]">
          <h2 className="text-4xl font-bold box-border caret-transparent tracking-[-0.9px] leading-10 mb-2">
            Competitor Database
          </h2>
          <p className="text-gray-500 font-medium box-border caret-transparent">
            {total} verified handgun training provider{total !== 1 ? "s" : ""} in NJ — live from database
          </p>
        </div>
        <div className="box-border caret-transparent gap-x-4 flex flex-wrap min-h-[auto] min-w-[auto] gap-y-4 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search providers..."
            className="text-sm border border-gray-200 rounded-xl px-4 py-3 bg-slate-50 outline-none focus:border-blue-400 w-48"
          />
          <button
            onClick={onExportCSV}
            className="text-sm font-bold items-center bg-white shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0.05)_0px_1px_2px_0px] caret-transparent flex leading-5 min-h-[auto] min-w-[auto] text-center border border-gray-200 px-6 py-3 rounded-xl hover:border-blue-400 transition-colors"
          >
            <Download className="text-blue-600 h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={onAddNew}
            className="text-sm font-bold items-center bg-blue-600 text-white caret-transparent flex leading-5 min-h-[auto] min-w-[auto] text-center px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Competitor
          </button>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="mt-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3 animate-pulse-once">
          <span className="text-sm font-bold text-red-700">
            {selectedCount} record{selectedCount !== 1 ? "s" : ""} selected
          </span>
          <button
            onClick={onBulkDelete}
            disabled={isBulkDeleting}
            className="flex items-center gap-1.5 text-xs font-black text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-2 rounded-xl transition-colors"
          >
            {isBulkDeleting ? (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 border-2 border-white border-r-transparent rounded-full animate-spin"></span>
                Deleting…
              </span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Selected
              </>
            )}
          </button>
          <button
            onClick={onClearSelection}
            className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors ml-1"
          >
            Clear selection
          </button>
        </div>
      )}
    </div>
  );
};
