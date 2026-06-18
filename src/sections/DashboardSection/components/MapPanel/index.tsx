import React, { useState } from "react";
import { useQuery } from "@animaapp/playground-react-sdk";
import { MapContainer } from "@/sections/DashboardSection/components/MapPanel/MapContainer";
import { MapLegend } from "@/sections/DashboardSection/components/MapPanel/MapLegend";

type Props = {
  countyFilter: string[];
  typeFilter: string;
  externalSelectedId?: string | null;
  onExternalSelectHandled?: () => void;
};

const TYPE_COLORS: Record<string, string> = {
  range: "bg-blue-600",
  "private instructor": "bg-green-600",
  "gun club": "bg-amber-500",
  retailer: "bg-purple-600",
};

export const MapPanel = ({ countyFilter, typeFilter, externalSelectedId, onExternalSelectHandled }: Props) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: competitors } = useQuery("Competitor");

  const allCompetitors = competitors ?? [];

  // IDs that pass the current filters (empty set = no filter active = all pass)
  const filtersActive = !!(countyFilter.length || typeFilter);
  const filteredIds = filtersActive
    ? new Set(
        allCompetitors
          .filter((c) => {
            if (countyFilter.length > 0 && !countyFilter.includes(c.county)) return false;
            if (typeFilter && c.facilityType !== typeFilter) return false;
            return true;
          })
          .map((c) => c.id)
      )
    : null; // null means "all active"

  // For the info box, only the in-filter competitors can be selected
  const inFilterList = filteredIds
    ? allCompetitors.filter((c) => filteredIds.has(c.id))
    : allCompetitors;

  const selected = inFilterList.find((c) => c.id === selectedId);

  // When filters change, clear a selection that's no longer in-filter
  React.useEffect(() => {
    if (selectedId && filteredIds && !filteredIds.has(selectedId)) {
      setSelectedId(null);
    }
  }, [JSON.stringify(countyFilter), typeFilter]);

  // Handle external fly-to requests (from detail panel "fly to" button)
  React.useEffect(() => {
    if (externalSelectedId) {
      setSelectedId(externalSelectedId);
      onExternalSelectHandled?.();
    }
  }, [externalSelectedId]);

  return (
    <div className="box-border caret-transparent gap-x-10 grid grid-cols-none gap-y-10 mb-20 md:grid-cols-[repeat(3,minmax(0px,1fr))]">
      <div className="relative bg-white shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0.25)_0px_25px_50px_-12px] box-border caret-transparent col-end-auto col-start-auto h-[700px] min-h-[auto] min-w-[auto] border border-gray-200 overflow-hidden rounded-[40px] border-solid md:col-end-[span_2] md:col-start-[span_2]">
        <MapContainer
          competitors={allCompetitors}
          filteredIds={filteredIds}
          selectedId={selectedId}
          onSelect={(id) => {
            // Only allow selecting in-filter markers
            if (!filteredIds || filteredIds.has(id)) setSelectedId(id);
          }}
        />
        <MapLegend />
      </div>
      <div className="bg-white shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0.25)_0px_25px_50px_-12px] box-border caret-transparent flex flex-col min-h-[700px] min-w-[auto] border border-gray-200 overflow-hidden rounded-[40px] border-solid">
        {selected ? (
          <div className="p-8 overflow-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h4 className="text-xl font-bold leading-7 mb-1">{selected.facilityName}</h4>
                <span className={`text-[10px] font-black text-white ${TYPE_COLORS[selected.facilityType] ?? "bg-gray-400"} px-3 py-1 rounded-full uppercase tracking-wider`}>{selected.facilityType}</span>
              </div>
              <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2"><span className="text-gray-400 w-24 shrink-0">County</span><span className="font-semibold">{selected.county}</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-24 shrink-0">Address</span><span className="font-semibold">{selected.address}</span></div>
              {selected.phone && <div className="flex gap-2"><span className="text-gray-400 w-24 shrink-0">Phone</span><a href={`tel:${selected.phone}`} className="font-semibold text-blue-600">{selected.phone}</a></div>}
              {selected.website && <div className="flex gap-2"><span className="text-gray-400 w-24 shrink-0">Website</span><a href={selected.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 truncate">{selected.website.replace("https://", "")}</a></div>}
              {selected.ccwPrepPrice != null && <div className="flex gap-2"><span className="text-gray-400 w-24 shrink-0">CCW Price</span><span className="font-bold text-blue-600">${selected.ccwPrepPrice}</span></div>}
              {selected.basicHandgunPrice != null && <div className="flex gap-2"><span className="text-gray-400 w-24 shrink-0">Basic Course</span><span className="font-bold">${selected.basicHandgunPrice}</span></div>}
              {selected.laneFee != null && <div className="flex gap-2"><span className="text-gray-400 w-24 shrink-0">Lane Fee</span><span className="font-bold">${selected.laneFee}/hr</span></div>}
              {selected.privateLessonRate != null && <div className="flex gap-2"><span className="text-gray-400 w-24 shrink-0">Private Lesson</span><span className="font-bold">${selected.privateLessonRate}/hr</span></div>}
              {selected.lanes != null && <div className="flex gap-2"><span className="text-gray-400 w-24 shrink-0">Lanes</span><span className="font-semibold">{selected.lanes}</span></div>}
              {selected.membershipOptions && <div className="flex gap-2"><span className="text-gray-400 w-24 shrink-0">Membership</span><span className="font-semibold">{selected.membershipOptions}</span></div>}
              <div className="flex gap-2"><span className="text-gray-400 w-24 shrink-0">Services</span><span className="font-semibold text-xs leading-5">{selected.servicesOffered}</span></div>
              {selected.instructorCredentials && <div className="flex gap-2"><span className="text-gray-400 w-24 shrink-0">Credentials</span><span className="font-semibold text-xs">{selected.instructorCredentials}</span></div>}
              {selected.notes && <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">{selected.notes}</div>}
              {selected.needsVerification && <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">⚠ This record requires phone/email verification.</div>}
            </div>
          </div>
        ) : (
          <div className="items-center box-border caret-transparent flex basis-[0%] grow justify-center min-h-[auto] min-w-[auto] text-center p-16">
            <div className="box-border caret-transparent min-h-[auto] min-w-[auto]">
              <div className="items-center bg-gray-50 box-border caret-transparent flex h-24 justify-center w-24 mb-8 mx-auto rounded-full">
                <img src="https://c.animaapp.com/mn5696zt0wUcrM/assets/icon-10.svg" alt="Icon" className="text-gray-200 box-border caret-transparent h-12 w-12" />
              </div>
              <h4 className="text-2xl font-bold box-border caret-transparent leading-8 mb-4">Select a Provider</h4>
              <p className="text-gray-500 box-border caret-transparent leading-[26px]">
                Click any marker on the map to unlock pricing benchmarks, facility details, and contact intelligence.
              </p>
              {inFilterList.length > 0 && (
                <p className="text-blue-600 font-bold text-sm mt-4">{inFilterList.length} provider{inFilterList.length !== 1 ? "s" : ""} shown</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
