"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Maximize2, Minus, Plus } from "lucide-react";

export interface MapTowerItem {
  id: string;
  kodeId: string;
  namaPemilik: string;
  tahun: number;
  jenisMenara: string;
  tenants: string;
  longitude: number;
  latitude: number;
  alamat: string;
  tinggiAgl: number;
  registrationNo: string;
}

interface TowerMapProps {
  towers: MapTowerItem[];
  selectedPinId: string | null;
  onSelectPin: (id: string | null) => void;
  bbox?: {
    lonMin: number;
    lonMax: number;
    latMin: number;
    latMax: number;
  };
}

function createPinIcon(isSelected: boolean) {
  const bg = isSelected ? "#8f181b" : "#016db0";
  const size = isSelected ? 34 : 28;

  return L.divIcon({
    className: "custom-tower-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${bg};
        border: 2px solid #ffffff;
        border-radius: 9999px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.28);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.15s ease;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
  });
}

export default function TowerMap({
  towers,
  selectedPinId,
  onSelectPin,
  bbox,
}: TowerMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const bboxLayerRef = useRef<L.Rectangle | null>(null);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Default center of Indonesia (-2.5, 118.0)
    const map = L.map(containerRef.current, {
      center: [-2.5, 118.0],
      zoom: 5,
      zoomControl: false,
      attributionControl: true,
    });

    // OpenStreetMap standard accurate tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update bounding box rectangle when filter bbox changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (bboxLayerRef.current) {
      bboxLayerRef.current.remove();
      bboxLayerRef.current = null;
    }

    if (
      bbox &&
      !Number.isNaN(bbox.latMin) &&
      !Number.isNaN(bbox.latMax) &&
      !Number.isNaN(bbox.lonMin) &&
      !Number.isNaN(bbox.lonMax)
    ) {
      const bounds: L.LatLngBoundsExpression = [
        [bbox.latMin, bbox.lonMin],
        [bbox.latMax, bbox.lonMax],
      ];
      bboxLayerRef.current = L.rectangle(bounds, {
        color: "#016db0",
        weight: 1.5,
        dashArray: "6 4",
        fillColor: "#016db0",
        fillOpacity: 0.04,
        interactive: false,
      }).addTo(map);
    }
  }, [bbox]);

  // Render tower markers
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = markersLayerRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    towers.forEach((tower) => {
      const isSelected = tower.id === selectedPinId;
      const marker = L.marker([tower.latitude, tower.longitude], {
        icon: createPinIcon(isSelected),
      });

      marker.bindPopup(
        `
        <div style="font-family: sans-serif; font-size: 12px; color: #1f2a37; min-width: 200px; line-height: 1.45;">
          <div style="font-weight: 700; font-size: 13px; color: #016db0; margin-bottom: 4px;">
            ${tower.kodeId}
          </div>
          <div><strong>Pemilik:</strong> ${tower.namaPemilik}</div>
          <div><strong>Jenis:</strong> ${tower.jenisMenara} (${tower.tinggiAgl}m)</div>
          <div><strong>Tenant:</strong> ${tower.tenants}</div>
          <div><strong>Koordinat:</strong> ${tower.latitude.toFixed(6)}, ${tower.longitude.toFixed(6)}</div>
          <div style="color: #6b7280; margin-top: 4px;">${tower.alamat}</div>
        </div>
        `,
        { closeButton: true }
      );

      marker.on("click", () => {
        onSelectPin(tower.id);
      });

      marker.addTo(layerGroup);

      if (isSelected) {
        marker.openPopup();
      }
    });
  }, [towers, selectedPinId, onSelectPin]);

  // Fly to selected pin when chosen from table or map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPinId) return;

    const target = towers.find((t) => t.id === selectedPinId);
    if (target) {
      map.flyTo([target.latitude, target.longitude], Math.max(map.getZoom(), 8), {
        duration: 0.6,
      });
    }
  }, [selectedPinId, towers]);

  function handleZoomIn() {
    mapRef.current?.zoomIn();
  }

  function handleZoomOut() {
    mapRef.current?.zoomOut();
  }

  function handleResetView() {
    mapRef.current?.flyTo([-2.5, 118.0], 5, { duration: 0.6 });
    onSelectPin(null);
  }

  return (
    <div className="relative h-95 w-full overflow-hidden rounded-[10px] border border-[#d0d5db] bg-[#e7f3fb]">
      <div ref={containerRef} className="h-full w-full z-0" />

      {/* Custom Figma-styled Zoom Controls */}
      <div className="absolute right-3 top-3 z-400 flex flex-col overflow-hidden rounded-lg border border-[#d0d5db] bg-white shadow-sm">
        <button
          type="button"
          onClick={handleZoomIn}
          className="flex h-8 w-8 items-center justify-center border-b border-[#e5e7eb] text-[#1f2a37] hover:bg-[#f5f6f8]"
          aria-label="Zoom in"
          title="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="flex h-8 w-8 items-center justify-center border-b border-[#e5e7eb] text-[#1f2a37] hover:bg-[#f5f6f8]"
          aria-label="Zoom out"
          title="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleResetView}
          className="flex h-8 w-8 items-center justify-center text-[#1f2a37] hover:bg-[#f5f6f8]"
          aria-label="Fit Indonesia"
          title="Fit Indonesia"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}