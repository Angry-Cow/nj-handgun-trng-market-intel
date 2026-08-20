import React, { useState } from "react";
import { TrendingUp, Plus, Trash2, X } from "lucide-react";
import { useQuery, emitRefresh } from "@/lib/useQuery";
import { useMutation } from "@/lib/useMutation";

const PERIOD_TYPES = ["monthly", "quarterly", "annual"] as const;

const EMPTY_FORM = {
  indicatorName: "",
  indicatorValue: "",
  unit: "",
  period: "",
  periodType: "annual" as (typeof PERIOD_TYPES)[number],
  sourceName: "",
  sourceUrl: "",
  notes: "",
  dataConfidence: "90",
};

type FormState = typeof EMPTY_FORM;

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatValue(val: number, unit?: string | null) {
  const formatted = val % 1 === 0
    ? val.toLocaleString()
    : val.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return unit ? `${formatted} ${unit}` : formatted;
}

function AddIndicatorModal({
  onClose,
  onCreate,
  isMutating,
}: {
  onClose: () => void;
  onCreate: (data: any) => Promise<any>;
  isMutating: boolean;
}) {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.indicatorName.trim()) errs.indicatorName = "Required";
    if (!form.indicatorValue.trim()) errs.indicatorValue = "Required";
    else if (isNaN(Number(form.indicatorValue)) || Number(form.indicatorValue) < 0)
      errs.indicatorValue = "Must be a positive number";
    if (!form.period.trim()) errs.period = "Required";
    if (!form.sourceUrl.trim()) errs.sourceUrl = "Required — every indicator needs a verifiable source link";
    else if (!new RegExp("^https?://", "i").test(form.sourceUrl.trim())) errs.sourceUrl = "Must be a valid URL starting with http:// or https://";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    const payload = {
      indicatorName: form.indicatorName.trim(),
      indicatorValue: Number(form.indicatorValue),
      unit: form.unit.trim() || undefined,
      period: form.period.trim(),
      periodType: form.periodType,
      sourceName: form.sourceName.trim() || undefined,
      sourceUrl: form.sourceUrl.trim(),
      notes: form.notes.trim() || undefined,
      dataConfidence: Number(form.dataConfidence),
    };

    try {
      await onCreate(payload);
      emitRefresh("IndustryIndicator");
      onClose();
    } catch (err) {
      console.error("Indicator save failed", err);
      setSubmitError("Failed to save indicator. Please try again.");
    }
  };

  const inputCls = (field: keyof FormState) =>
    `w-full text-sm border rounded-lg px-3 py-2 outline-none focus:border-blue-400 bg-slate-50 transition-colors ${
      errors[field] ? "border-red-400 bg-red-50" : "border-gray-200"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Add Industry Indicator</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Manually enter a market-level data point
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-8 py-6">
          <div className="space-y-5">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Indicator Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.indicatorName}
                onChange={(e) => set("indicatorName", e.target.value)}
                className={inputCls("indicatorName")}
                placeholder="e.g., NJ Handgun Permit Applications"
              />
              {errors.indicatorName && (
                <p className="text-red-500 text-xs mt-1">{errors.indicatorName}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.indicatorValue}
                  onChange={(e) => set("indicatorValue", e.target.value)}
                  className={inputCls("indicatorValue")}
                  placeholder="e.g., 12500"
                />
                {errors.indicatorValue && (
                  <p className="text-red-500 text-xs mt-1">{errors.indicatorValue}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Unit
                </label>
                <input
                  value={form.unit}
                  onChange={(e) => set("unit", e.target.value)}
                  className={inputCls("unit")}
                  placeholder="e.g., applications"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Period <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.period}
                  onChange={(e) => set("period", e.target.value)}
                  className={inputCls("period")}
                  placeholder="e.g., 2025-Q1 or 2025-08"
                />
                {errors.period && (
                  <p className="text-red-500 text-xs mt-1">{errors.period}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Period Type
                </label>
                <select
                  value={form.periodType}
                  onChange={(e) =>
                    set("periodType", e.target.value as FormState["periodType"])
                  }
                  className={inputCls("periodType")}
                >
                  {PERIOD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Source Name
                </label>
                <input
                  value={form.sourceName}
                  onChange={(e) => set("sourceName", e.target.value)}
                  className={inputCls("sourceName")}
                  placeholder="e.g., NJ State Police"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Source URL <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.sourceUrl}
                  onChange={(e) => set("sourceUrl", e.target.value)}
                  className={inputCls("sourceUrl")}
                  placeholder="https://..."
                />
                {errors.sourceUrl && (
                  <p className="text-red-500 text-xs mt-1">{errors.sourceUrl}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1 italic">
                  Confirm this link loads in a browser before saving.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Data Confidence (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={form.dataConfidence}
                  onChange={(e) => set("dataConfidence", e.target.value)}
                  className={inputCls("dataConfidence")}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={3}
                className={`${inputCls("notes")} resize-none`}
                placeholder="Any additional context about this indicator..."
              />
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {submitError}
              </div>
            )}
          </div>
        </form>

        <div className="flex items-center justify-between px-8 py-5 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-bold text-gray-500 bg-white border border-gray-200 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isMutating}
            onClick={handleSubmit}
            className="text-sm font-bold text-white bg-blue-600 px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isMutating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                Saving...
              </>
            ) : (
              "Save Indicator"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export const IndustryIndicatorPanel = () => {
  const { data: indicators, isPending, error } = useQuery("IndustryIndicator", {
    orderBy: { period: "desc" },
  });
  const { create, remove, isPending: isMutating } = useMutation("IndustryIndicator");
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      emitRefresh("IndustryIndicator");
      setConfirmDelete(null);
    } catch (err) {
      console.error("Failed to delete indicator:", err);
    }
  };

  const uniqueIndicators = new Map<string, number>();
  (indicators ?? []).forEach((ind: any) => {
    const existing = uniqueIndicators.get(ind.indicatorName);
    if (existing == null) uniqueIndicators.set(ind.indicatorName, 1);
    else uniqueIndicators.set(ind.indicatorName, existing + 1);
  });
  const indicatorCount = uniqueIndicators.size;
  const totalEntries = indicators?.length ?? 0;

  return (
    <section className="box-border caret-transparent mb-12">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center bg-blue-600 shadow-[rgba(11,99,255,0.3)_0px_8px_24px_-4px] h-12 w-12 rounded-2xl shrink-0">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight leading-8">
              Industry Indicators
            </h2>
            <p className="text-gray-500 text-sm font-medium mt-0.5">
              Market-level data points for context and trend analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isPending && !error && (
            <>
              <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full">
                {indicatorCount} Indicator{indicatorCount !== 1 ? "s" : ""}
              </span>
              <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                {totalEntries} Data Point{totalEntries !== 1 ? "s" : ""}
              </span>
            </>
          )}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Indicator
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl shadow-[rgba(0,0,0,0.05)_0px_1px_3px] overflow-hidden">
        {isPending && (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <svg
              className="animate-spin h-6 w-6 mr-3 text-blue-600"
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
            <span className="text-sm font-medium">Loading indicators...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-20 text-red-500 gap-2">
            <span className="text-sm font-medium">
              Could not load indicators. Please refresh and try again.
            </span>
          </div>
        )}

        {!isPending && !error && (!indicators || indicators.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <TrendingUp className="h-10 w-10 text-gray-300" strokeWidth={1.5} />
            <p className="text-sm font-medium">No industry indicators yet.</p>
            <p className="text-xs text-gray-300 font-medium">
              Click "Add Indicator" to enter a market-level data point.
            </p>
          </div>
        )}

        {!isPending && !error && indicators && indicators.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-black text-gray-400 tracking-[1.5px] uppercase px-6 py-4">
                    Indicator
                  </th>
                  <th className="text-right text-xs font-black text-gray-400 tracking-[1.5px] uppercase px-4 py-4">
                    Value
                  </th>
                  <th className="text-left text-xs font-black text-gray-400 tracking-[1.5px] uppercase px-4 py-4">
                    Period
                  </th>
                  <th className="text-left text-xs font-black text-gray-400 tracking-[1.5px] uppercase px-4 py-4">
                    Source
                  </th>
                  <th className="text-left text-xs font-black text-gray-400 tracking-[1.5px] uppercase px-4 py-4">
                    Confidence
                  </th>
                  <th className="px-4 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {indicators.map((ind: any, idx: number) => (
                  <tr
                    key={ind.id}
                    className={`border-b border-gray-50 transition-colors hover:bg-blue-50/40 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-50 shrink-0">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate max-w-[240px]">
                            {ind.indicatorName}
                          </p>
                          {ind.notes && (
                            <p className="text-xs text-gray-400 truncate max-w-[240px]">
                              {ind.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-bold tabular-nums text-gray-800">
                        {formatValue(Number(ind.indicatorValue), ind.unit)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">{ind.period}</span>
                        <span className="text-[10px] font-bold bg-slate-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {ind.periodType}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {ind.sourceName ? (
                        <div className="flex flex-col">
                          <span className="text-gray-700 font-medium text-xs">
                            {ind.sourceName}
                          </span>
                          {ind.sourceUrl && (
                            <a
                              href={ind.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline truncate max-w-[180px]"
                            >
                              {ind.sourceUrl}
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          ind.dataConfidence >= 85
                            ? "bg-green-100 text-green-700"
                            : ind.dataConfidence >= 70
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {ind.dataConfidence}%
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {confirmDelete === ind.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(ind.id)}
                            disabled={isMutating}
                            className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 px-2 py-1 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs font-bold text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(ind.id)}
                          className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-400">
                {indicators.length} entr{indicators.length !== 1 ? "ies" : "y"} recorded
              </span>
              <span className="text-xs font-medium text-gray-400">
                Sorted by most recent period
              </span>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <AddIndicatorModal
          onClose={() => setShowModal(false)}
          onCreate={create}
          isMutating={isMutating}
        />
      )}
    </section>
  );
};
