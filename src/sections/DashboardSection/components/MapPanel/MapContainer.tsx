import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Competitor = {
  id: string;
  facilityName: string;
  facilityType: string;
  county: string;
  latitude: number;
  longitude: number;
  ccwPrepPrice?: number | null;
  basicHandgunPrice?: number | null;
  laneFee?: number | null;
  privateLessonRate?: number | null;
  needsVerification: boolean;
  address?: string;
  phone?: string;
  website?: string;
  servicesOffered?: string;
  lanes?: number | null;
  membershipOptions?: string;
  instructorCredentials?: string;
  notes?: string;
};

type Props = {
  competitors: Competitor[];
  filteredIds: Set<string> | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

const TYPE_COLORS: Record<string, string> = {
  range: "#2563eb",
  "private instructor": "#16a34a",
  "gun club": "#f59e0b",
  retailer: "#9333ea",
};

const DEFAULT_COLOR = "#6b7280";

// NJ bounding box
const NJ_BOUNDS: L.LatLngBoundsExpression = [
  [38.9, -75.6],
  [41.4, -73.9],
];

// ─── Pure-JS clustering ───────────────────────────────────────────────────────
// Grid-based O(n) clustering. No external package needed.

type ClusterPoint = {
  id: string;
  lat: number;
  lng: number;
  comp: Competitor;
};

type Cluster = {
  lat: number;
  lng: number;
  items: ClusterPoint[];
};

/** Convert [lat,lng] to pixel coords given the current map */
function latLngToPixel(map: L.Map, lat: number, lng: number): { x: number; y: number } {
  const pt = map.latLngToContainerPoint([lat, lng]);
  return { x: pt.x, y: pt.y };
}

/**
 * Cluster points by pixel proximity using a simple single-pass grid snap.
 * Each point is assigned to the grid cell it falls in; all points in the
 * same cell become one cluster.
 */
function buildClusters(map: L.Map, points: ClusterPoint[], radius: number): Cluster[] {
  if (points.length === 0) return [];

  const cellSize = radius * 2;
  const cellMap: Record<string, ClusterPoint[]> = {};

  for (const p of points) {
    const { x, y } = latLngToPixel(map, p.lat, p.lng);
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);
    const key = `${cx}:${cy}`;
    if (!cellMap[key]) cellMap[key] = [];
    cellMap[key].push(p);
  }

  return Object.values(cellMap).map((pts) => {
    const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
    const lng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
    return { lat, lng, items: pts };
  });
}
// ─────────────────────────────────────────────────────────────────────────────

function makeMarkerIcon(
  color: string,
  isSelected: boolean,
  isActive: boolean,
  needsVerification: boolean
): L.DivIcon {
  const size = isSelected ? 18 : 14;
  const opacity = isActive ? 1 : 0.3;
  const shadow = isActive ? "0 1px 6px rgba(0,0,0,0.35)" : "none";
  const bg = isActive ? color : "#cbd5e1";
  const cursor = isActive ? "pointer" : "default";
  const scale = isSelected ? "scale(1.3)" : "scale(1)";

  const badge = needsVerification
    ? `<div style="position:absolute;top:-3px;right:-3px;width:7px;height:7px;border-radius:50%;background:#f59e0b;border:1.5px solid white;"></div>`
    : "";

  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${bg};border:2.5px solid white;
      box-shadow:${shadow};cursor:${cursor};
      position:relative;
      transition:transform 0.15s ease,opacity 0.2s ease,background 0.2s ease;
      opacity:${opacity};transform:${scale};
    ">${badge}</div>`,
    iconSize: [size + 6, size + 6],
    iconAnchor: [(size + 6) / 2, (size + 6) / 2],
    popupAnchor: [0, -(size + 6) / 2],
  });
}

function makeClusterIcon(count: number): L.DivIcon {
  const size = count < 10 ? 34 : count < 20 ? 40 : 48;
  const fontSize = count < 10 ? 13 : count < 20 ? 14 : 15;

  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:linear-gradient(135deg,#1d4ed8,#3b82f6);
      border:2.5px solid white;
      box-shadow:0 2px 10px rgba(37,99,235,0.45);
      display:flex;align-items:center;justify-content:center;
      font-family:system-ui,sans-serif;font-size:${fontSize}px;
      font-weight:800;color:white;cursor:pointer;
    ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function boundsFromCompetitors(competitors: { latitude: number; longitude: number }[]): L.LatLngBounds | null {
  const valid = competitors.filter((c) => c.latitude && c.longitude);
  if (valid.length === 0) return null;
  return L.latLngBounds(valid.map((c) => [c.latitude, c.longitude] as L.LatLngTuple));
}

// Zoom level at which we stop clustering and show individual markers
const DISABLE_CLUSTER_AT_ZOOM = 13;
// Pixel radius for clustering
const CLUSTER_RADIUS = 40;

export const MapContainer = ({ competitors, filteredIds, selectedId, onSelect }: Props) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const [mapReady, setMapReady] = useState(false);
  const userSelectedRef = useRef(false);

  // Keep latest props in refs so the render fn can always access them without stale closures
  const competitorsRef = useRef(competitors);
  const filteredIdsRef = useRef(filteredIds);
  const selectedIdRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);

  useEffect(() => { competitorsRef.current = competitors; }, [competitors]);
  useEffect(() => { filteredIdsRef.current = filteredIds; }, [filteredIds]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  /** Rebuild all markers / clusters from scratch */
  const renderMarkers = useCallback(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    markersRef.current = {};

    const currentCompetitors = competitorsRef.current;
    const currentFilteredIds = filteredIdsRef.current;
    const currentSelectedId = selectedIdRef.current;
    const filtersActive = currentFilteredIds !== null;
    const zoom = map.getZoom();
    const useClusters = zoom < DISABLE_CLUSTER_AT_ZOOM;

    // Only cluster the active (visible) competitors
    const activeCompetitors = currentCompetitors.filter((c) =>
      c.latitude && c.longitude && (!filtersActive || currentFilteredIds!.has(c.id))
    );
    const inactiveCompetitors = currentCompetitors.filter((c) =>
      c.latitude && c.longitude && filtersActive && !currentFilteredIds!.has(c.id)
    );

    // Render inactive (dimmed) markers first — never clustered
    inactiveCompetitors.forEach((c) => {
      const color = TYPE_COLORS[c.facilityType] ?? DEFAULT_COLOR;
      const icon = makeMarkerIcon(color, false, false, c.needsVerification);
      const marker = L.marker([c.latitude, c.longitude], { icon, zIndexOffset: -1000 });
      layerGroup.addLayer(marker);
      markersRef.current[c.id] = marker;
    });

    if (useClusters) {
      const points: ClusterPoint[] = activeCompetitors.map((c) => ({
        id: c.id,
        lat: c.latitude,
        lng: c.longitude,
        comp: c,
      }));

      const clusters = buildClusters(map, points, CLUSTER_RADIUS);

      clusters.forEach((cluster) => {
        if (cluster.items.length === 1) {
          // Single item — render as normal marker
          const c = cluster.items[0].comp;
          const color = TYPE_COLORS[c.facilityType] ?? DEFAULT_COLOR;
          const isSelected = c.id === currentSelectedId;
          const icon = makeMarkerIcon(color, isSelected, true, c.needsVerification);
          const marker = L.marker([c.latitude, c.longitude], {
            icon,
            zIndexOffset: isSelected ? 1000 : 0,
          });
          addMarkerListeners(marker, c, filtersActive, currentFilteredIds);
          layerGroup.addLayer(marker);
          markersRef.current[c.id] = marker;
        } else {
          // Cluster bubble
          const icon = makeClusterIcon(cluster.items.length);
          const clusterMarker = L.marker([cluster.lat, cluster.lng], {
            icon,
            zIndexOffset: 500,
          });

          clusterMarker.on("click", () => {
            // Zoom in enough to expand the cluster
            const currentZoom = map.getZoom();
            const targetZoom = Math.min(currentZoom + 3, DISABLE_CLUSTER_AT_ZOOM + 1);
            map.setView([cluster.lat, cluster.lng], targetZoom, { animate: true, duration: 0.5 });
          });

          // Tooltip showing facility names
          const names = cluster.items
            .slice(0, 5)
            .map((p) => p.comp.facilityName)
            .join("<br>");
          const more = cluster.items.length > 5 ? `<br><em>+${cluster.items.length - 5} more</em>` : "";
          clusterMarker.bindTooltip(
            `<div style="font-family:sans-serif;font-size:11px;line-height:1.6">${names}${more}</div>`,
            { direction: "top", offset: [0, -10] }
          );

          layerGroup.addLayer(clusterMarker);
        }
      });
    } else {
      // No clustering — render all active markers individually
      activeCompetitors.forEach((c) => {
        const color = TYPE_COLORS[c.facilityType] ?? DEFAULT_COLOR;
        const isSelected = c.id === currentSelectedId;
        const icon = makeMarkerIcon(color, isSelected, true, c.needsVerification);
        const marker = L.marker([c.latitude, c.longitude], {
          icon,
          zIndexOffset: isSelected ? 1000 : 0,
        });
        addMarkerListeners(marker, c, filtersActive, currentFilteredIds);
        layerGroup.addLayer(marker);
        markersRef.current[c.id] = marker;
      });
    }
  }, []);

  /** Attach click / hover / popup to a single-item marker */
  function addMarkerListeners(
    marker: L.Marker,
    c: Competitor,
    filtersActive: boolean,
    currentFilteredIds: Set<string> | null
  ) {
    marker.on("click", (e) => {
      L.DomEvent.stopPropagation(e);
      if (filtersActive && !currentFilteredIds!.has(c.id)) return;
      userSelectedRef.current = true;
      onSelectRef.current(c.id);
    });

    marker.on("mouseover", () => {
      const el = marker.getElement();
      if (el) {
        const inner = el.querySelector("div") as HTMLElement | null;
        if (inner) inner.style.transform = "scale(1.35)";
      }
    });

    marker.on("mouseout", () => {
      const el = marker.getElement();
      if (el) {
        const inner = el.querySelector("div") as HTMLElement | null;
        if (inner) {
          const isSelected = c.id === selectedIdRef.current;
          inner.style.transform = isSelected ? "scale(1.3)" : "scale(1)";
        }
      }
    });

    const priceLines: string[] = [];
    if (c.ccwPrepPrice != null)
      priceLines.push(`<span style="color:#2563eb;font-weight:700">CCW: $${c.ccwPrepPrice}</span>`);
    if (c.basicHandgunPrice != null)
      priceLines.push(`Basic: $${c.basicHandgunPrice}`);
    if (c.laneFee != null)
      priceLines.push(`Lane: $${c.laneFee}/hr`);

    marker.bindPopup(
      L.popup({ offset: [0, -8], maxWidth: 220 }).setContent(
        `<div style="font-family:sans-serif;font-size:12px;line-height:1.5">
          <div style="font-weight:800;font-size:13px;margin-bottom:2px;color:#1e293b">${c.facilityName}</div>
          <div style="color:#64748b;margin-bottom:4px">${c.county} &middot; ${c.facilityType}</div>
          ${priceLines.length ? `<div>${priceLines.join(" &nbsp;·&nbsp; ")}</div>` : ""}
          ${c.needsVerification ? `<div style="margin-top:6px;color:#b45309;font-size:10px">⚠ Needs verification</div>` : ""}
        </div>`
      )
    );
  }

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).fitBounds(NJ_BOUNDS);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapRef.current = map;
    setMapReady(true);

    // Re-cluster on zoom changes
    map.on("zoomend", () => renderMarkers());

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(mapContainerRef.current!);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, [renderMarkers]);

  // Re-render markers whenever data or selection changes
  useEffect(() => {
    if (mapReady) renderMarkers();
  }, [competitors, filteredIds, selectedId, mapReady, renderMarkers]);

  // Fit map to active (filtered) competitors whenever filters change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (userSelectedRef.current) return;

    const activeCandidates = filteredIds
      ? competitors.filter((c) => filteredIds.has(c.id))
      : competitors;

    const bounds = boundsFromCompetitors(activeCandidates);
    if (bounds) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
    } else {
      map.fitBounds(NJ_BOUNDS, { padding: [40, 40] });
    }
  }, [competitors, filteredIds, mapReady]);

  // Fly to selected competitor when selectedId changes
  useEffect(() => {
    if (!selectedId || !mapRef.current || !mapReady) return;
    const comp = competitors.find((c) => c.id === selectedId);
    if (!comp?.latitude || !comp?.longitude) return;

    userSelectedRef.current = true;
    mapRef.current.setView([comp.latitude, comp.longitude], Math.max(mapRef.current.getZoom(), DISABLE_CLUSTER_AT_ZOOM + 1), {
      animate: true,
      duration: 0.8,
    });

    // Show popup after flying
    setTimeout(() => {
      const marker = markersRef.current[selectedId];
      if (marker) marker.openPopup();
    }, 900);
  }, [selectedId, competitors, mapReady]);

  const fitAll = () => {
    const map = mapRef.current;
    if (!map) return;
    userSelectedRef.current = false;
    map.closePopup();

    const activeCandidates = filteredIds
      ? competitors.filter((c) => filteredIds.has(c.id))
      : competitors;
    const bounds = boundsFromCompetitors(activeCandidates);
    if (bounds) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13, animate: true });
    } else {
      map.fitBounds(NJ_BOUNDS, { padding: [40, 40], animate: true });
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Badge + fit-all button */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-[1000]">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-sm border border-gray-200 pointer-events-none">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">NJ Training Map</p>
          {filteredIds !== null ? (
            <p className="text-xs text-blue-600 font-semibold">
              {filteredIds.size} of {competitors.length} shown
            </p>
          ) : (
            <p className="text-xs text-gray-400">{competitors.length} providers</p>
          )}
        </div>
        {selectedId && (
          <button
            onClick={fitAll}
            className="bg-white/90 backdrop-blur-sm rounded-2xl px-3 py-2 shadow-sm border border-gray-200 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
            title="Zoom out to show all providers"
          >
            Show All
          </button>
        )}
      </div>
    </div>
  );
};
