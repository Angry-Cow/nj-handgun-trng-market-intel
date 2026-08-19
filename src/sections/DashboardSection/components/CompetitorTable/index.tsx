import React, { useState } from "react";
import { useQuery } from "@/lib/useQuery";
import { useMutation } from "@/lib/useMutation";
import { safeUrl } from "@/lib/sanitize";
import { TableFilters } from "@/sections/DashboardSection/components/CompetitorTable/TableFilters";
import { AddCompetitorModal } from "@/sections/DashboardSection/components/CompetitorTable/AddCompetitorModal";

type Props = {
  countyFilter: string[];
  typeFilter: string;
  priceFilter: string;
  onRowClick?: (id: string) => void;
};

type SortField = "facilityName" | "county" | "ccwPrepPrice" | "dataConfidence";

const getConfidenceMeta = (score: number) => {
  if (score >= 95) return { label: "high", colorClass: "text-green-600 bg-green-600/10", icon: "https://c.animaapp.com/mn5696zt0wUcrM/assets/icon-17.svg" };
  if (score >= 92) return { label: "medium", colorClass: "text-amber-500 bg-amber-500/10", icon: "https://c.animaapp.com/mn5696zt0wUcrM/assets/icon-19.svg" };
  return { label: "low", colorClass: "text-red-500 bg-red-500/10", icon: "https://c.animaapp.com/mn5696zt0wUcrM/assets/icon-19.svg" };
};

export const CompetitorTable = ({ countyFilter, typeFilter, priceFilter, onRowClick }: Props) => {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("facilityName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const PAGE_SIZE = 15;

  const { data: competitors, isPending, error } = useQuery("Competitor");
  const { create, update, remove, isPending: isMutating } = useMutation("Competitor");

  const openEditModal = (c: any) => setEditingCompetitor(c);
  const closeEditModal = () => setEditingCompetitor(null);

  const handleExportCSV = () => {
    if (!competitors) return;
    const headers = ["Facility Name", "Type", "County", "Address", "Website", "Phone", "Services", "CCW Price", "Basic Price", "Lane Fee", "Private Lesson", "Confidence", "Needs Verification", "Source URL", "Date Accessed", "Notes"];
    const rows = competitors.map((c) => [
      c.facilityName, c.facilityType, c.county, c.address, c.website, c.phone,
      c.servicesOffered, c.ccwPrepPrice ?? "", c.basicHandgunPrice ?? "",
      c.laneFee ?? "", c.privateLessonRate ?? "", c.dataConfidence,
      c.needsVerification ? "Yes" : "No", c.sourceUrl,
      new Date(c.dateAccessed).toLocaleDateString(), c.notes ?? "",
    ]);
    const csvContent = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nj_handgun_competitors.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = (competitors ?? []).filter((c) => {
    if (countyFilter.length > 0) {
      const match = countyFilter.some((cf) => {
        const countyName = cf.includes(",") ? cf.split(",")[0].trim() : cf;
        return c.county === countyName;
      });
      if (!match) return false;
    }
    if (typeFilter && c.facilityType !== typeFilter) return false;
    if (priceFilter === "<100" && (c.ccwPrepPrice ?? 9999) >= 100) return false;
    if (priceFilter === "100-199" && ((c.ccwPrepPrice ?? 0) < 100 || (c.ccwPrepPrice ?? 0) > 199)) return false;
    if (priceFilter === "200+" && (c.ccwPrepPrice ?? 0) < 200) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.facilityName.toLowerCase().includes(q) ||
        c.county.toLowerCase().includes(q) ||
        c.facilityType.toLowerCase().includes(q) ||
        (c.address ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let av: string | number = a[sortField] ?? "";
    let bv: string | number = b[sortField] ?? "";
    if (typeof av === "string") av = av.toLowerCase();
    if (typeof bv === "string") bv = bv.toLowerCase();
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remove this competitor record?")) {
      await remove(id);
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAllPageSelected = paginated.length > 0 && paginated.every((c) => selectedIds.has(c.id));

  const toggleSelectAll = () => {
    if (isAllPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((c) => next.add(c.id));
        return next;
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Permanently delete ${selectedIds.size} selected competitor${selectedIds.size > 1 ? "s" : ""}?`)) return;
    setBulkDeleting(true);
    try {
      for (const id of Array.from(selectedIds)) {
        await remove(id);
      }
      setSelectedIds(new Set());
    } finally {
      setBulkDeleting(false);
    }
  };

  // NOTE: toggleSelectAll / isAllPageSelected depend on `paginated` which is defined above — hoisted safely here
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const SortBtn = ({ field, label }: { field: SortField; label: string }) => (
    <button onClick={() => toggleSort(field)} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
      {label}
      {sortField === field && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
    </button>
  );

  if (error) {
    console.error("Competitor load failed", error);
    return <div className="text-red-500 p-8">Could not load competitor data. Please refresh and try again.</div>;
  }

  return (
    <section className="box-border caret-transparent mb-24">
      <TableFilters
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onExportCSV={handleExportCSV}
        onAddNew={() => setShowAddModal(true)}
        total={filtered.length}
        selectedCount={selectedIds.size}
        onBulkDelete={handleBulkDelete}
        isBulkDeleting={bulkDeleting}
        onClearSelection={() => setSelectedIds(new Set())}
      />
      {showAddModal && (
        <AddCompetitorModal
          onClose={() => setShowAddModal(false)}
          onCreate={create}
          isMutating={isMutating}
        />
      )}
      {editingCompetitor && (
        <AddCompetitorModal
          onClose={closeEditModal}
          onCreate={create}
          onUpdate={update}
          editData={editingCompetitor}
          isMutating={isMutating}
        />
      )}
      <div className="bg-white shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0.25)_0px_25px_50px_-12px] box-border caret-transparent border border-gray-200 overflow-hidden rounded-[40px] border-solid">
        <div className="box-border caret-transparent overflow-auto">
          {isPending ? (
            <div className="flex items-center justify-center p-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
            </div>
          ) : (
            <table className="caret-transparent text-left w-full border-collapse">
              <thead className="box-border caret-transparent">
                <tr className="bg-gray-50/50 box-border caret-transparent align-middle border-gray-200 border-b border-solid">
                  <th className="text-gray-500 text-[10px] font-black box-border caret-transparent tracking-[2px] leading-[15px] uppercase align-middle px-4 py-6 w-10">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={toggleSelectAll}
                      title="Select all on this page"
                      className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </th>
                  <th className="text-gray-500 text-[10px] font-black box-border caret-transparent tracking-[2px] leading-[15px] uppercase align-middle px-8 py-6">
                    <SortBtn field="facilityName" label="Provider Name" />
                  </th>
                  <th className="text-gray-500 text-[10px] font-black box-border caret-transparent tracking-[2px] leading-[15px] uppercase align-middle px-8 py-6">Type</th>
                  <th className="text-gray-500 text-[10px] font-black box-border caret-transparent tracking-[2px] leading-[15px] uppercase align-middle px-8 py-6">
                    <SortBtn field="county" label="County" />
                  </th>
                  <th className="text-gray-500 text-[10px] font-black box-border caret-transparent tracking-[2px] leading-[15px] uppercase align-middle px-8 py-6">
                    <SortBtn field="ccwPrepPrice" label="CCW Price" />
                  </th>
                  <th className="text-gray-500 text-[10px] font-black box-border caret-transparent tracking-[2px] leading-[15px] uppercase align-middle px-8 py-6">
                    <SortBtn field="dataConfidence" label="Confidence" />
                  </th>
                  <th className="text-gray-500 text-[10px] font-black box-border caret-transparent tracking-[2px] leading-[15px] uppercase align-middle px-8 py-6">Actions</th>
                </tr>
              </thead>
              <tbody className="box-border caret-transparent">
                {paginated.map((c, i) => {
                  const conf = getConfidenceMeta(c.dataConfidence);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => onRowClick?.(c.id)}
                      className={`box-border caret-transparent align-middle cursor-pointer hover:bg-blue-50/40 transition-colors ${i > 0 ? "border-gray-100 border-t border-solid" : ""}`}
                    >
                      <td className="box-border caret-transparent align-middle px-4 py-5 w-10" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                        />
                      </td>
                      <td className="box-border caret-transparent align-middle px-8 py-5">
                        <div className="font-bold box-border caret-transparent">{c.facilityName}</div>
                        <div className="text-gray-500 text-xs box-border caret-transparent leading-4 mt-1">{c.address?.split(",").slice(0, 2).join(",") || `${c.county}, NJ`}</div>
                        {c.needsVerification && (
                          <span className="text-[9px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block">⚠ Verify</span>
                        )}
                      </td>
                      <td className="box-border caret-transparent align-middle px-8 py-5">
                        <span className="text-gray-500 text-[10px] font-black bg-gray-100 box-border caret-transparent tracking-[1px] leading-[15px] uppercase px-3 py-1 rounded-full whitespace-nowrap">{c.facilityType}</span>
                      </td>
                      <td className="text-sm font-semibold box-border caret-transparent leading-5 align-middle px-8 py-5">
                        {c.county}
                      </td>
                      <td className="box-border caret-transparent align-middle px-8 py-5">
                        <div className="text-blue-600 text-sm font-black box-border caret-transparent leading-5">
                          {c.ccwPrepPrice != null ? `$${c.ccwPrepPrice}` : "N/A"}
                        </div>
                      </td>
                      <td className="box-border caret-transparent align-middle px-8 py-5">
                        <span className={`text-[10px] font-black items-center ${conf.colorClass} box-border caret-transparent flex tracking-[1px] leading-[15px] uppercase w-fit px-3 py-1 rounded-full`}>
                          <img src={conf.icon} alt="Icon" className="box-border caret-transparent h-3 w-3 mr-1" />
                          {conf.label}
                        </span>
                      </td>
                      <td className="box-border caret-transparent align-middle px-8 py-5" onClick={(e) => e.stopPropagation()}>
                        <div className="items-center box-border caret-transparent gap-x-1 flex gap-y-1">
                          <button onClick={() => openEditModal(c)} title="Edit record" className="text-blue-600 bg-blue-50 hover:bg-blue-100 caret-transparent block min-h-[auto] min-w-[auto] text-center p-2 rounded-lg transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          {safeUrl(c.website) && (
                            <a href={safeUrl(c.website)} target="_blank" rel="noopener noreferrer" title="Visit website" className="text-gray-500 bg-gray-50 hover:bg-gray-100 block p-2 rounded-lg transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                          )}
                          <button onClick={() => handleDelete(c.id)} disabled={isMutating} title="Delete record" className="text-red-500 bg-red-50 hover:bg-red-100 caret-transparent block min-h-[auto] min-w-[auto] text-center p-2 rounded-lg transition-colors disabled:opacity-50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-500 py-16 px-8">No competitors match your current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-5 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-xs font-bold px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i + 1} onClick={() => setPage(i + 1)} className={`text-xs font-bold px-3 py-2 rounded-lg border transition-colors ${page === i + 1 ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:bg-gray-50"}`}>{i + 1}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="text-xs font-bold px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
