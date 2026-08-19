import React, { useState } from "react";
import { useQuery } from "@/lib/useQuery";
import { useMutation } from "@/lib/useMutation";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming",
  "District of Columbia", "Puerto Rico",
];

export const IntelligenceReferences = () => {
  const { data: counties, isPending } = useQuery("County", {
    orderBy: { county: "asc" },
  });
  const { create, update, remove, isPending: isMutating } = useMutation("County");

  const [isExpanded, setIsExpanded] = useState(false);

  // Add form state
  const [addName, setAddName] = useState("");
  const [addState, setAddState] = useState("New Jersey");
  const [addError, setAddError] = useState("");

  // Edit form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editState, setEditState] = useState("New Jersey");
  const [editError, setEditError] = useState("");

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleAdd = async () => {
    const trimmed = addName.trim();
    if (!trimmed) { setAddError("County name is required."); return; }
    const exists = counties?.some(
      (c) => c.county.toLowerCase() === trimmed.toLowerCase() && c.state === addState
    );
    if (exists) { setAddError("That county already exists for this state."); return; }
    setAddError("");
    try {
      await create({ county: trimmed, state: addState });
      setAddName("");
      setAddState("New Jersey");
      setAddError("");
    } catch (err: unknown) {
      console.error("County create failed", err);
      setAddError("Failed to add county. Please try again.");
    }
  };

  const startEdit = (id: string, name: string, state: string) => {
    setEditingId(id);
    setEditName(name);
    setEditState(state);
    setEditError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditState("New Jersey");
    setEditError("");
  };

  const handleSaveEdit = async (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) { setEditError("County name is required."); return; }
    const exists = counties?.some(
      (c) => c.county.toLowerCase() === trimmed.toLowerCase() && c.state === editState && c.id !== id
    );
    if (exists) { setEditError("That county already exists for this state."); return; }
    setEditError("");
    try {
      await update(id, { county: trimmed, state: editState });
      setEditingId(null);
      setEditName("");
      setEditState("New Jersey");
      setEditError("");
    } catch (err: unknown) {
      console.error("County update failed", err);
      setEditError("Failed to save changes. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      setConfirmDeleteId(null);
    } catch (err: unknown) {
      console.error("Failed to delete county:", err);
    }
  };

  return (
    <div className="backdrop-blur-2xl bg-white/90 shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0.25)_0px_25px_50px_-12px] box-border caret-transparent border border-gray-200 mb-6 rounded-3xl border-solid overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/60 transition-colors"
      >
        <div className="flex items-center gap-2 text-blue-600 font-bold">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-4.724A1 1 0 013 14.382V5a1 1 0 011-1h6m0 16V4m0 16h6m-6-16h6a1 1 0 011 1v9.382a1 1 0 01-.553.894L12 20m0 0V4" />
          </svg>
          <span>Intelligence References</span>
          {!isPending && counties && (
            <span className="ml-1 text-[11px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
              {counties.length} counties
            </span>
          )}
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable body */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-medium mt-4 mb-4">
            Manage the reference list of counties used across filters and dropdowns throughout the dashboard.
          </p>

          {/* Add new county */}
          <div className="flex flex-col gap-2 mb-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={addName}
                onChange={(e) => { setAddName(e.target.value); setAddError(""); }}
                onKeyDown={(e) => e.key === "Enter" && !isMutating && handleAdd()}
                placeholder="County name…"
                className="flex-1 text-sm bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:outline-blue-400 focus:outline-2 transition-colors"
              />
              <select
                value={addState}
                onChange={(e) => { setAddState(e.target.value); setAddError(""); }}
                className="text-sm bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:outline-blue-400 focus:outline-2 transition-colors text-gray-700 min-w-[160px]"
              >
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAdd}
                disabled={isMutating || !addName.trim()}
                className="flex items-center gap-1.5 text-sm font-bold bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            </div>
            {addError && (
              <p className="text-xs text-red-500 font-medium">{addError}</p>
            )}
          </div>

          {/* County list */}
          {isPending ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : !counties || counties.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No counties found. Add one above.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-4">
              {counties.map((county) => (
                <div
                  key={county.id}
                  className="flex items-center gap-2 bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 group"
                >
                  {editingId === county.id ? (
                    <div className="flex flex-col gap-1.5 w-full">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => { setEditName(e.target.value); setEditError(""); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(county.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        autoFocus
                        placeholder="County name"
                        className="w-full text-sm bg-white border border-blue-300 rounded-lg px-2 py-1.5 outline-none focus:outline-blue-400 focus:outline-2"
                      />
                      <select
                        value={editState}
                        onChange={(e) => { setEditState(e.target.value); setEditError(""); }}
                        className="w-full text-sm bg-white border border-blue-300 rounded-lg px-2 py-1.5 outline-none focus:outline-blue-400 focus:outline-2 text-gray-700"
                      >
                        {US_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {editError && (
                        <p className="text-xs text-red-500 font-medium">{editError}</p>
                      )}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(county.id)}
                          disabled={isMutating}
                          className="flex-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="flex-1 text-xs font-bold text-gray-500 hover:text-gray-700 border border-gray-200 px-2 py-1 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : confirmDeleteId === county.id ? (
                    <>
                      <span className="flex-1 text-xs text-red-600 font-semibold">Remove &quot;{county.county}&quot;?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(county.id)}
                        disabled={isMutating}
                        className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 px-2 py-1 rounded-lg transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs font-bold text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg transition-colors"
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{county.county}</p>
                        <p className="text-[11px] text-gray-400 truncate">{county.state}</p>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => startEdit(county.id, county.county, county.state)}
                          className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(county.id)}
                          className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
