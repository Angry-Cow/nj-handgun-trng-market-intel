import React, { useState } from "react";
import { Building2, BadgeCheck, DollarSign } from "lucide-react";
import { useQuery } from "@/lib/useQuery";
import { StatCard } from "@/sections/DashboardSection/components/StatCard";
import { FilterBar } from "@/sections/DashboardSection/components/FilterBar";
import { MapPanel } from "@/sections/DashboardSection/components/MapPanel";
import { ChartsSection } from "@/sections/DashboardSection/components/ChartsSection";
import { CompetitorTable } from "@/sections/DashboardSection/components/CompetitorTable";
import { MethodologySection } from "@/sections/DashboardSection/components/MethodologySection";
import { SourceLogPanel } from "@/sections/DashboardSection/components/SourceLogPanel";
import { ProviderDetailPanel } from "@/sections/DashboardSection/components/ProviderDetailPanel";
import { IntelligenceReferences } from "@/sections/DashboardSection/components/IntelligenceReferences";
import { DataCollectionPanel } from "@/sections/DashboardSection/components/DataCollectionPanel";

export const DashboardSection = () => {
  const [countyFilter, setCountyFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [mapFlyToId, setMapFlyToId] = useState<string | null>(null);

  const { data: competitors, isPending } = useQuery("Competitor");

  const totalProviders = competitors?.length ?? 0;
  const highConfidence = competitors?.filter((c) => c.dataConfidence >= 95).length ?? 0;
  const highConfidencePct = totalProviders > 0 ? Math.round((highConfidence / totalProviders) * 100) : 0;
  const verifiedCcwPrices = competitors?.filter((c) => c.ccwPrepPrice && c.dataConfidence >= 92).map((c) => c.ccwPrepPrice!) ?? [];
  const avgCcwPrice = verifiedCcwPrices.length > 0
    ? Math.round(verifiedCcwPrices.reduce((a, b) => a + b, 0) / verifiedCcwPrices.length)
    : 184;

  const selectedProvider = competitors?.find((c) => c.id === selectedProviderId) ?? null;

  const handleFlyTo = (id: string) => {
    setMapFlyToId(id);
    // Scroll to map panel
    document.getElementById("map-panel-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative box-border caret-transparent max-w-none w-full z-30 mx-auto pt-12 pb-24 px-6 md:max-w-screen-xl">
      <div className="box-border caret-transparent gap-x-8 grid grid-cols-[repeat(1,minmax(0px,1fr))] gap-y-8 mb-12 md:grid-cols-[repeat(3,minmax(0px,1fr))]">
        <StatCard
          title="Total Providers"
          value={isPending ? "..." : String(totalProviders)}
          footerText="Total Providers"
          icon={Building2}
          accentColorClass="text-blue-600 bg-blue-600/10"
        />
        <StatCard
          title="Verified Sources"
          value={isPending ? "..." : `${highConfidencePct}%`}
          footerText="High Confidence"
          icon={BadgeCheck}
          accentColorClass="text-amber-500 bg-amber-500/10"
        />
        <StatCard
          title="Avg CCW Price"
          value={isPending ? "..." : `$${avgCcwPrice}`}
          footerText="Weighted Avg"
          icon={DollarSign}
          accentColorClass="text-blue-600 bg-blue-600/10"
        />
      </div>
      <IntelligenceReferences />
      <FilterBar
        countyFilter={countyFilter}
        typeFilter={typeFilter}
        priceFilter={priceFilter}
        onCountyChange={setCountyFilter}
        onTypeChange={setTypeFilter}
        onPriceChange={setPriceFilter}
        onReset={() => { setCountyFilter([]); setTypeFilter(""); setPriceFilter(""); }}
      />
      <div id="map-panel-anchor" className="mt-6" />
      <MapPanel
        countyFilter={countyFilter}
        typeFilter={typeFilter}
        externalSelectedId={mapFlyToId}
        onExternalSelectHandled={() => setMapFlyToId(null)}
      />
      <ChartsSection />
      <CompetitorTable
        countyFilter={countyFilter}
        typeFilter={typeFilter}
        priceFilter={priceFilter}
        onRowClick={(id) => setSelectedProviderId(id)}
      />
      <DataCollectionPanel />
      <SourceLogPanel />
      <MethodologySection />
      <ProviderDetailPanel
        competitor={selectedProvider as any}
        onClose={() => setSelectedProviderId(null)}
        onFlyTo={handleFlyTo}
      />
    </div>
  );
};
